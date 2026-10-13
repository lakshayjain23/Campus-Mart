import React, { createContext, useContext, useState, useEffect } from 'react';
import type { User, Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import type { Tables } from '../types/database';

export type UserProfile = Tables<'profiles'>;

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  session: Session | null;
  isLoading: boolean;
  isAuthModalOpen: boolean;
  authMode: 'signin' | 'signup';
  setIsAuthModalOpen: (open: boolean) => void;
  setAuthMode: (mode: 'signin' | 'signup') => void;
  openAuthModal: (mode?: 'signin' | 'signup') => void;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, metadata: { fullName: string; college: string; department?: string }) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<{ error: Error | null }>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        console.warn('Error fetching profile from Supabase:', error.message);
        return;
      }

      if (data) {
        setProfile(data);
      }
    } catch (err) {
      console.warn('Profile fetch exception:', err);
    }
  };

  useEffect(() => {
    let mounted = true;

    // Check active session
    supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
      if (!mounted) return;
      setSession(currentSession);
      setUser(currentSession?.user ?? null);
      if (currentSession?.user) {
        fetchProfile(currentSession.user.id);
      }
      setIsLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, newSession) => {
      if (!mounted) return;
      setSession(newSession);
      setUser(newSession?.user ?? null);
      if (newSession?.user) {
        fetchProfile(newSession.user.id);
      } else {
        setProfile(null);
      }
      setIsLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const openAuthModal = (mode: 'signin' | 'signup' = 'signin') => {
    setAuthMode(mode);
    setIsAuthModalOpen(true);
  };

  const signIn = async (email: string, password: string) => {
    const cleanEmail = email.trim().toLowerCase();
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password,
      });

      if (!error && data?.user) {
        await fetchProfile(data.user.id);
        setIsAuthModalOpen(false);
        return { error: null };
      }

      // If user had unconfirmed email error from earlier signup, auto-confirm and retry
      if (error && error.message?.toLowerCase().includes('email not confirmed')) {
        const { error: rpcError } = await supabase.rpc('register_student_account', {
          p_email: cleanEmail,
          p_password: password,
          p_full_name: 'Student',
          p_college: 'IIT Delhi - Main Campus',
          p_department: 'Student',
        });
        if (!rpcError) {
          const retryRes = await supabase.auth.signInWithPassword({
            email: cleanEmail,
            password,
          });
          if (!retryRes.error && retryRes.data?.user) {
            await fetchProfile(retryRes.data.user.id);
            setIsAuthModalOpen(false);
            return { error: null };
          }
        }
      }

      return { error: error as Error | null };
    } catch (err: any) {
      return { error: err as Error };
    }
  };

  const signUp = async (
    email: string,
    password: string,
    metadata: { fullName: string; college: string; department?: string }
  ) => {
    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = password;
    const cleanFullName = metadata.fullName.trim();
    const cleanCollege = metadata.college.trim();
    const cleanDept = metadata.department?.trim() || 'Student';

    try {
      // 1. Attempt standard Supabase Auth signUp
      const { data, error } = await supabase.auth.signUp({
        email: cleanEmail,
        password: cleanPassword,
        options: {
          data: {
            full_name: cleanFullName,
            college: cleanCollege,
            department: cleanDept,
          },
        },
      });

      // 2. If rate limited by Supabase default emailer or email send failed
      const isRateLimited = error && (
        error.message?.toLowerCase().includes('rate limit') ||
        error.message?.toLowerCase().includes('over_email_send_rate_limit') ||
        (error as any).status === 429
      );

      if (isRateLimited) {
        console.warn('Supabase mailer rate limit encountered. Falling back to direct student account provisioning.');
        const { error: rpcError } = await supabase.rpc('register_student_account', {
          p_email: cleanEmail,
          p_password: cleanPassword,
          p_full_name: cleanFullName,
          p_college: cleanCollege,
          p_department: cleanDept,
        });

        if (rpcError) {
          return { error: new Error(rpcError.message || 'Registration failed.') };
        }

        // Sign in immediately with provisioned credentials
        const loginRes = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password: cleanPassword,
        });

        if (loginRes.error) {
          return { error: loginRes.error as Error };
        }

        if (loginRes.data?.user) {
          await fetchProfile(loginRes.data.user.id);
          setIsAuthModalOpen(false);
          return { error: null };
        }
      }

      if (error) {
        return { error: error as Error };
      }

      if (data?.user) {
        // Automatically create or ensure profile exists
        await supabase.from('profiles').upsert({
          id: data.user.id,
          email: data.user.email || cleanEmail,
          full_name: cleanFullName,
          college: cleanCollege,
          department: cleanDept,
        });

        if (data.session) {
          await fetchProfile(data.user.id);
          setIsAuthModalOpen(false);
        } else {
          // If session was not returned due to confirmation requirement, attempt sign in
          const loginAttempt = await supabase.auth.signInWithPassword({
            email: cleanEmail,
            password: cleanPassword,
          });
          if (!loginAttempt.error && loginAttempt.data?.user) {
            await fetchProfile(loginAttempt.data.user.id);
            setIsAuthModalOpen(false);
          }
        }
      }

      return { error: error as Error | null };
    } catch (err: any) {
      return { error: err as Error };
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      setProfile(null);
      setSession(null);
    } catch (err) {
      console.error('Sign out error:', err);
    }
  };

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!user) return { error: new Error('User not authenticated') };

    try {
      const { data, error } = await supabase
        .from('profiles')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id)
        .select()
        .single();

      if (error) throw error;
      if (data) setProfile(data);
      return { error: null };
    } catch (err: any) {
      console.error('Profile update error:', err);
      return { error: err as Error };
    }
  };

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user.id);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        session,
        isLoading,
        isAuthModalOpen,
        authMode,
        setIsAuthModalOpen,
        setAuthMode,
        openAuthModal,
        signIn,
        signUp,
        signOut,
        updateProfile,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
