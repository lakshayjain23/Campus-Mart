import React, { useState } from 'react';
import {
  X,
  Lock,
  Mail,
  User,
  GraduationCap,
  Building2,
  Eye,
  EyeOff,
  AlertCircle,
  Loader2,
  CheckCircle2,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useMarketplace } from '../context/MarketplaceContext';

export const AuthModal: React.FC = () => {
  const {
    isAuthModalOpen,
    setIsAuthModalOpen,
    authMode,
    setAuthMode,
    signIn,
    signUp,
    resetPassword,
  } = useAuth();
  const { campuses, selectedCampus } = useMarketplace();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [fullName, setFullName] = useState('');
  const [college, setCollege] = useState(
    selectedCampus !== 'All Campuses' ? selectedCampus : 'IIT Delhi - Main Campus'
  );
  const [department, setDepartment] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (!isAuthModalOpen) return null;

  const handleClose = () => {
    setIsAuthModalOpen(false);
    setErrorMessage(null);
    setSuccessMessage(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!email.trim()) {
      setErrorMessage('Please enter your email address.');
      return;
    }

    if (authMode === 'reset') {
      setIsLoading(true);
      try {
        const { error } = await resetPassword(email);
        if (error) {
          setErrorMessage(error.message || 'Failed to send reset email. Please try again.');
        } else {
          setSuccessMessage('Password reset instructions sent! Please check your email inbox.');
        }
      } catch (err: any) {
        setErrorMessage(err.message || 'Failed to send password reset request.');
      } finally {
        setIsLoading(false);
      }
      return;
    }

    if (!password) {
      setErrorMessage('Please enter your password.');
      return;
    }

    if (password.length < 6) {
      setErrorMessage('Password must be at least 6 characters.');
      return;
    }

    setIsLoading(true);

    try {
      if (authMode === 'signin') {
        const { error } = await signIn(email, password);
        if (error) {
          const msg = error.message?.toLowerCase().includes('invalid login credentials')
            ? 'Incorrect email or password. Please verify your details or create an account.'
            : error.message || 'Invalid email or password.';
          setErrorMessage(msg);
        } else {
          handleClose();
        }
      } else {
        if (!fullName.trim()) {
          setErrorMessage('Please enter your full student name.');
          setIsLoading(false);
          return;
        }

        const { error } = await signUp(email, password, {
          fullName: fullName.trim(),
          college: college.trim(),
          department: department.trim() || 'Engineering',
        });

        if (error) {
          const msg = error.message?.toLowerCase().includes('rate limit')
            ? 'Supabase email limit reached. Auto-provisioning attempted. Please try signing in or use One-Click Demo Student Sign In.'
            : error.message;
          setErrorMessage(msg);
        } else {
          setSuccessMessage('Account created and verified! Welcome to Campus Mart.');
          setTimeout(() => {
            handleClose();
          }, 1200);
        }
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Authentication failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="relative bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-200 my-auto">
        <button
          onClick={handleClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-slate-700 p-1.5 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
          aria-label="Close dialog"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Brand header */}
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center mx-auto mb-3">
            <GraduationCap className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-black text-slate-900 tracking-tight">
            {authMode === 'signin'
              ? 'Sign in to Campus Mart'
              : authMode === 'signup'
              ? 'Create Student Account'
              : 'Reset Your Password'}
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            {authMode === 'signin'
              ? 'Access your listings, reservations, and buyer chats'
              : authMode === 'signup'
              ? 'Join your campus peer-to-peer marketplace'
              : 'Enter your email to receive a password recovery link'}
          </p>
        </div>

        {/* Tab switcher or Back to Sign In button */}
        {authMode !== 'reset' ? (
          <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-xl mb-6">
            <button
              type="button"
              onClick={() => {
                setAuthMode('signin');
                setErrorMessage(null);
              }}
              className={`py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                authMode === 'signin'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setAuthMode('signup');
                setErrorMessage(null);
              }}
              className={`py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                authMode === 'signup'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Create Account
            </button>
          </div>
        ) : (
          <div className="mb-4 flex justify-start">
            <button
              type="button"
              onClick={() => {
                setAuthMode('signin');
                setErrorMessage(null);
              }}
              className="text-xs font-semibold text-emerald-700 hover:underline flex items-center gap-1"
            >
              ← Back to Sign In
            </button>
          </div>
        )}

        {/* Messages */}
        {errorMessage && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2.5 text-xs text-red-700 animate-in fade-in">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start gap-2.5 text-xs text-emerald-800 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{successMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {authMode === 'signup' && (
            <>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Aarav Sharma"
                    className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-[#15803D]"
                  />
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  College / Institute <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <select
                    value={college}
                    onChange={(e) => setCollege(e.target.value)}
                    className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-[#15803D]"
                  >
                    {campuses
                      .filter((c) => c !== 'All Campuses')
                      .map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                  </select>
                  <Building2 className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Department / Branch
                </label>
                <input
                  type="text"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  placeholder="e.g. Computer Science, Mechanical..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-[#15803D]"
                />
              </div>
            </>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Email Address <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="student@campus.edu or your email"
                className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-[#15803D]"
              />
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Supports college emails (.edu, .ac.in) and student personal accounts.
            </p>
          </div>

          {authMode !== 'reset' && (
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-slate-700">
                  Password <span className="text-red-500">*</span>
                </label>
                {authMode === 'signin' && (
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode('reset');
                      setErrorMessage(null);
                      setSuccessMessage(null);
                    }}
                    className="text-[11px] text-emerald-700 hover:text-emerald-900 font-medium hover:underline"
                  >
                    Forgot password?
                  </button>
                )}
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  className="w-full pl-9 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-[#15803D]"
                />
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                  aria-label="Toggle password visibility"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 bg-[#064E3B] hover:bg-[#15803D] text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Processing...</span>
              </>
            ) : (
              <span>
                {authMode === 'signin'
                  ? 'Sign In'
                  : authMode === 'signup'
                  ? 'Create Account'
                  : 'Send Reset Link'}
              </span>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
