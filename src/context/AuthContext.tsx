import React, { createContext, useContext, useState, useEffect } from 'react';
import type { User, Session } from '@supabase/supabase-js';
import { supabase, clearUserWishlist } from '../lib/supabase';
import type { Tables } from '../types/database';

export type UserProfile = Tables<'profiles'>;

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  session: Session | null;
  isLoading: boolean;
  isEmailVerified: boolean;
  pendingVerificationEmail: string | null;
  setPendingVerificationEmail: (email: string | null) => void;
  authNotification: { type: 'success' | 'error' | 'info'; message: string } | null;
  clearAuthNotification: () => void;
  isAuthModalOpen: boolean;
  authMode: 'signin' | 'signup' | 'reset' | 'verify';
  setIsAuthModalOpen: (open: boolean) => void;
  setAuthMode: (mode: 'signin' | 'signup' | 'reset' | 'verify') => void;
  openAuthModal: (mode?: 'signin' | 'signup' | 'reset' | 'verify') => void;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (
    email: string,
    password: string,
    metadata: { fullName: string; college: string; department?: string }
  ) => Promise<{ error: Error | null; confirmationRequired?: boolean }>;
  resendConfirmationEmail: (email: string) => Promise<{ error: Error | null }>;
  resetPassword: (email: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<{ error: Error | null }>;
  refreshProfile: () => Promise<void>;
  deleteAccount: () => Promise<{ error: Error | null }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [authMode, setAuthMode] = useState<'signin' | 'signup' | 'reset' | 'verify'>('signin');
  const [pendingVerificationEmail, setPendingVerificationEmail] = useState<string | null>(null);
  const [authNotification, setAuthNotification] = useState<{
    type: 'success' | 'error' | 'info';
    message: string;
  } | null>(null);

  const clearAuthNotification = () => setAuthNotification(null);

  const isEmailVerified = Boolean(
    user?.email_confirmed_at || (user as any)?.confirmed_at
  );

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
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, newSession) => {
      if (!mounted) return;
      setSession(newSession);
      setUser(newSession?.user ?? null);
      if (newSession?.user) {
        fetchProfile(newSession.user.id);
        if (event === 'SIGNED_IN') {
          if (newSession.user.email_confirmed_at) {
            setAuthNotification({
              type: 'success',
              message: 'Email confirmed successfully! Your student account is now active.',
            });
          }
        }
      } else {
        setProfile(null);
      }
      setIsLoading(false);
    });

    // Check URL hash for error callbacks or confirmation events
    if (typeof window !== 'undefined') {
      const hash = window.location.hash;
      if (hash.includes('error_code=') || hash.includes('error=')) {
        const params = new URLSearchParams(hash.startsWith('#') ? hash.slice(1) : hash);
        const errorCode = params.get('error_code');
        const errorDescription = params.get('error_description');

        if (errorCode === 'otp_expired' || errorDescription?.toLowerCase().includes('expired')) {
          setAuthNotification({
            type: 'error',
            message: 'Your email verification link has expired or has already been used. Please sign in or request a new confirmation email.',
          });
          setAuthMode('verify');
          setIsAuthModalOpen(true);
        } else if (errorDescription) {
          setAuthNotification({
            type: 'error',
            message: decodeURIComponent(errorDescription.replace(/\+/g, ' ')),
          });
        }
        window.history.replaceState(null, '', window.location.pathname + window.location.search);
      } else if (hash.includes('type=signup') || hash.includes('type=email_change')) {
        setAuthNotification({
          type: 'success',
          message: 'Email confirmed successfully! Welcome to CampusMart.',
        });
        window.history.replaceState(null, '', window.location.pathname + window.location.search);
      }
    }

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const openAuthModal = (mode: 'signin' | 'signup' | 'reset' | 'verify' = 'signin') => {
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

      if (error) {
        // Detect unconfirmed email error accurately
        if (
          error.message?.toLowerCase().includes('email not confirmed') ||
          (error as any).code === 'email_not_confirmed'
        ) {
          setPendingVerificationEmail(cleanEmail);
          setAuthMode('verify');
          return {
            error: new Error(
              'Your email has not been confirmed yet. Please check your inbox or click Resend Verification Email.'
            ),
          };
        }

        if (error.message?.toLowerCase().includes('invalid login credentials')) {
          return {
            error: new Error('Incorrect email or password. Please verify your details or create an account.'),
          };
        }

        return { error: new Error(error.message || 'Invalid email or password.') };
      }

      if (data?.user) {
        // Check confirmation status
        const isConfirmed = Boolean(data.user.email_confirmed_at || (data.user as any).confirmed_at);
        if (!isConfirmed) {
          setPendingVerificationEmail(cleanEmail);
          setAuthMode('verify');
          return {
            error: new Error(
              'Your email has not been confirmed yet. Please check your inbox or resend the verification email.'
            ),
          };
        }

        await fetchProfile(data.user.id);
        setIsAuthModalOpen(false);
        return { error: null };
      }

      return { error: null };
    } catch (err: any) {
      return { error: err as Error };
    }
  };

  const signUp = async (
    email: string,
    password: string,
    metadata: { fullName: string; college: string; department?: string }
  ): Promise<{ error: Error | null; confirmationRequired?: boolean }> => {
    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = password;
    const cleanFullName = metadata.fullName.trim();
    const cleanCollege = metadata.college.trim();
    const cleanDept = metadata.department?.trim() || 'Student';

    if (!cleanEmail || !cleanEmail.includes('@')) {
      return { error: new Error('Please enter a valid email address.') };
    }
    if (cleanPassword.length < 6) {
      return { error: new Error('Password must be at least 6 characters.') };
    }
    if (!cleanFullName) {
      return { error: new Error('Please enter your full name.') };
    }

    try {
      const redirectUrl = typeof window !== 'undefined'
        ? `${window.location.origin}/`
        : 'https://campusmarttt.vercel.app/';

      const { data, error } = await supabase.auth.signUp({
        email: cleanEmail,
        password: cleanPassword,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            full_name: cleanFullName,
            college: cleanCollege,
            department: cleanDept,
          },
        },
      });

      if (error) {
        if (
          error.message?.toLowerCase().includes('user already registered') ||
          error.message?.toLowerCase().includes('already exists')
        ) {
          return {
            error: new Error(
              'An account with this email already exists. Please sign in or use password reset.'
            ),
          };
        }

        if (
          error.message?.toLowerCase().includes('rate limit') ||
          error.message?.toLowerCase().includes('over_email_send_rate_limit') ||
          (error as any).status === 429
        ) {
          return {
            error: new Error(
              'Email delivery rate limit reached on Supabase. Please wait a few minutes before trying again or use custom SMTP.'
            ),
          };
        }

        return { error: new Error(error.message || 'Registration failed.') };
      }

      // Check if user already exists (Supabase returns empty identities array for existing users)
      if (data?.user?.identities && data.user.identities.length === 0) {
        return {
          error: new Error('An account with this email already exists. Please sign in instead.'),
        };
      }

      const sessionActive = Boolean(data?.session);
      const isConfirmed = Boolean(data?.user?.email_confirmed_at || data?.user?.confirmed_at);
      const confirmationRequired = !sessionActive || !isConfirmed;

      if (confirmationRequired) {
        setPendingVerificationEmail(cleanEmail);
        setAuthMode('verify');
        return { error: null, confirmationRequired: true };
      }

      // If project has email confirmations disabled and session was issued immediately
      if (data?.user && sessionActive) {
        await fetchProfile(data.user.id);
        setIsAuthModalOpen(false);
      }

      return { error: null, confirmationRequired: false };
    } catch (err: any) {
      return { error: err as Error };
    }
  };

  const resendConfirmationEmail = async (email: string): Promise<{ error: Error | null }> => {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      return { error: new Error('Please enter a valid email address.') };
    }

    try {
      const redirectUrl = typeof window !== 'undefined'
        ? `${window.location.origin}/`
        : 'https://campusmarttt.vercel.app/';

      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: cleanEmail,
        options: {
          emailRedirectTo: redirectUrl,
        },
      });

      if (error) {
        if (
          error.message?.toLowerCase().includes('rate limit') ||
          (error as any).status === 429
        ) {
          return {
            error: new Error(
              'Verification email rate limit reached. Please wait a few minutes before requesting another link.'
            ),
          };
        }
        return { error: new Error(error.message || 'Failed to resend confirmation email.') };
      }

      return { error: null };
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

  const resetPassword = async (email: string) => {
    const cleanEmail = email.trim().toLowerCase();
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) return { error: error as Error };
      return { error: null };
    } catch (err: any) {
      return { error: err as Error };
    }
  };

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user.id);
    }
  };

  const deleteAccount = async (): Promise<{ error: Error | null }> => {
    if (!user) return { error: new Error('User not authenticated') };
    const uid = user.id;

    try {
      // 1. Try server RPC delete_user_account first if deployed
      try {
        const { error: rpcErr } = await (supabase as any).rpc('delete_user_account');
        if (!rpcErr) {
          try {
            localStorage.removeItem(`campusmart_wishlist_${uid}`);
          } catch {
            // ignore
          }
          await signOut();
          return { error: null };
        }
      } catch {
        // Fallback to client-directed entity cleanup
      }

      // 2. Deactivate listings owned by this seller
      try {
        await supabase
          .from('products')
          .update({ in_stock: false, status: 'archived' } as any)
          .eq('seller_id', uid);
      } catch (err) {
        console.warn('Listing deactivation notice during account deletion:', err);
      }

      // 3. Clear user-saved wishlist
      try {
        await clearUserWishlist(uid);
      } catch (err) {
        console.warn('Wishlist cleanup notice during account deletion:', err);
      }

      // 4. Remove profile record
      const { error: profileErr } = await supabase.from('profiles').delete().eq('id', uid);
      if (profileErr) {
        console.warn('Profile deletion notice:', profileErr.message);
      }

      // 5. Clear user-scoped local caches
      try {
        localStorage.removeItem(`campusmart_wishlist_${uid}`);
      } catch {
        // ignore
      }

      // 6. Sign out session
      await signOut();
      return { error: null };
    } catch (err: any) {
      console.error('Account deletion error:', err);
      return { error: err as Error };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        session,
        isLoading,
        isEmailVerified,
        pendingVerificationEmail,
        setPendingVerificationEmail,
        authNotification,
        clearAuthNotification,
        isAuthModalOpen,
        authMode,
        setIsAuthModalOpen,
        setAuthMode,
        openAuthModal,
        signIn,
        signUp,
        resendConfirmationEmail,
        resetPassword,
        signOut,
        updateProfile,
        refreshProfile,
        deleteAccount,
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
