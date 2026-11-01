import React, { useState, useEffect } from 'react';
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
  RefreshCw,
  ArrowLeft,
  ShieldCheck,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useMarketplace } from '../context/MarketplaceContext';

export const AuthModal: React.FC = () => {
  const {
    isAuthModalOpen,
    setIsAuthModalOpen,
    authMode,
    setAuthMode,
    pendingVerificationEmail,
    setPendingVerificationEmail,
    resendConfirmationEmail,
    signIn,
    signUp,
    resetPassword,
  } = useAuth();
  const { campuses, selectedCampus } = useMarketplace();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [fullName, setFullName] = useState('');
  const [college, setCollege] = useState(
    selectedCampus !== 'All Campuses' ? selectedCampus : 'IIT Delhi - Main Campus'
  );
  const [department, setDepartment] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Sync email from pendingVerificationEmail if available
  const [prevPendingEmail, setPrevPendingEmail] = useState(pendingVerificationEmail);
  if (pendingVerificationEmail && pendingVerificationEmail !== prevPendingEmail) {
    setPrevPendingEmail(pendingVerificationEmail);
    if (!email) {
      setEmail(pendingVerificationEmail);
    }
  }

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const interval = setInterval(() => {
      setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [resendCooldown]);

  if (!isAuthModalOpen) return null;

  const handleClose = () => {
    setIsAuthModalOpen(false);
    setErrorMessage(null);
    setSuccessMessage(null);
  };

  const handleResendVerification = async () => {
    const targetEmail = (pendingVerificationEmail || email).trim();
    if (!targetEmail) {
      setErrorMessage('Please enter your email address to receive a verification link.');
      return;
    }
    if (resendCooldown > 0) return;

    setIsResending(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const { error } = await resendConfirmationEmail(targetEmail);
      if (error) {
        setErrorMessage(error.message || 'Could not resend verification email. Please try again.');
      } else {
        setSuccessMessage(`A new verification link has been sent to ${targetEmail}. Please check your inbox and spam folder.`);
        setResendCooldown(60);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'An unexpected error occurred while resending verification.');
    } finally {
      setIsResending(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const cleanEmail = email.trim();
    if (!cleanEmail) {
      setErrorMessage('Please enter your email address.');
      return;
    }

    if (authMode === 'reset') {
      setIsLoading(true);
      try {
        const { error } = await resetPassword(cleanEmail);
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

    if (authMode === 'signup') {
      if (!fullName.trim()) {
        setErrorMessage('Please enter your full student name.');
        return;
      }
      if (password !== confirmPassword) {
        setErrorMessage('Passwords do not match. Please re-enter your password correctly.');
        return;
      }
    }

    setIsLoading(true);

    try {
      if (authMode === 'signin') {
        const { error } = await signIn(cleanEmail, password);
        if (error) {
          const msg = error.message?.toLowerCase().includes('invalid login credentials')
            ? 'Incorrect email or password. Please verify your details or create an account.'
            : error.message || 'Invalid email or password.';
          setErrorMessage(msg);
        } else {
          handleClose();
        }
      } else {
        const result = await signUp(cleanEmail, password, {
          fullName: fullName.trim(),
          college: college.trim(),
          department: department.trim() || 'General Student',
        });

        if (result.error) {
          setErrorMessage(result.error.message);
        } else if (result.confirmationRequired) {
          // Modal automatically switches to 'verify' mode via AuthContext
          setPendingVerificationEmail(cleanEmail);
          setSuccessMessage(`Account created! A confirmation link has been sent to ${cleanEmail}.`);
          setResendCooldown(60);
        } else {
          // In case email confirmation was turned off in Supabase instance
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
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-3 ${
            authMode === 'verify' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
          }`}>
            {authMode === 'verify' ? (
              <Mail className="w-6 h-6 animate-pulse" />
            ) : (
              <GraduationCap className="w-6 h-6" />
            )}
          </div>
          <h3 className="text-xl font-black text-slate-900 tracking-tight">
            {authMode === 'signin'
              ? 'Sign in to Campus Mart'
              : authMode === 'signup'
              ? 'Create Student Account'
              : authMode === 'verify'
              ? 'Verify Your Student Email'
              : 'Reset Your Password'}
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            {authMode === 'signin'
              ? 'Access your listings, reservations, and buyer chats'
              : authMode === 'signup'
              ? 'Join your campus peer-to-peer marketplace'
              : authMode === 'verify'
              ? 'Activate full access to sell, message, and reserve products'
              : 'Enter your email to receive a password recovery link'}
          </p>
        </div>

        {/* Tab switcher or Back button */}
        {authMode === 'signin' || authMode === 'signup' ? (
          <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-xl mb-6">
            <button
              type="button"
              onClick={() => {
                setAuthMode('signin');
                setErrorMessage(null);
                setSuccessMessage(null);
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
                setSuccessMessage(null);
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
          <div className="mb-4 flex items-center justify-between">
            <button
              type="button"
              onClick={() => {
                setAuthMode('signin');
                setErrorMessage(null);
                setSuccessMessage(null);
              }}
              className="text-xs font-semibold text-emerald-700 hover:text-emerald-900 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Sign In</span>
            </button>

            {authMode === 'verify' && (
              <button
                type="button"
                onClick={() => {
                  setAuthMode('signup');
                  setErrorMessage(null);
                  setSuccessMessage(null);
                }}
                className="text-xs text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
              >
                Change details
              </button>
            )}
          </div>
        )}

        {/* Notifications / Errors */}
        {errorMessage && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2.5 text-xs text-red-700 animate-in fade-in">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span className="leading-relaxed">{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start gap-2.5 text-xs text-emerald-800 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
            <span className="leading-relaxed">{successMessage}</span>
          </div>
        )}

        {/* DEDICATED VERIFICATION VIEW */}
        {authMode === 'verify' ? (
          <div className="space-y-4">
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-center space-y-2.5">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 border border-amber-200 rounded-full text-[11px] font-medium text-amber-800">
                <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
                <span>Verification email sent to</span>
              </div>
              <p className="text-sm font-bold text-slate-900 break-all">
                {pendingVerificationEmail || email || 'your email address'}
              </p>
              <p className="text-xs text-slate-600 leading-relaxed text-left pt-1">
                Please check your inbox and click the verification link to confirm your account.
                Once confirmed, you will be able to post listings, message sellers, and place orders.
              </p>
              <p className="text-[11px] text-slate-400 text-left">
                💡 Don't see it? Please check your <strong>Spam</strong> or <strong>Junk</strong> folder. It usually arrives within 1-2 minutes.
              </p>
            </div>

            <div className="space-y-2 pt-1">
              <button
                type="button"
                onClick={handleResendVerification}
                disabled={isResending || resendCooldown > 0}
                className="w-full py-2.5 bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 text-xs font-bold rounded-xl shadow-2xs transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isResending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
                    <span>Sending new link...</span>
                  </>
                ) : resendCooldown > 0 ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 text-slate-400" />
                    <span>Resend available in {resendCooldown}s</span>
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 text-emerald-700" />
                    <span>Resend Verification Email</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  setAuthMode('signin');
                  setErrorMessage(null);
                  setSuccessMessage(null);
                }}
                className="w-full py-2.5 bg-[#064E3B] hover:bg-[#15803D] text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>I've Verified — Proceed to Sign In</span>
              </button>
            </div>
          </div>
        ) : (
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
                College emails (.edu, .ac.in) and personal student emails are supported.
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
                      className="text-[11px] text-emerald-700 hover:text-emerald-900 font-medium hover:underline cursor-pointer"
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
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                    aria-label="Toggle password visibility"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            )}

            {authMode === 'signup' && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Confirm Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter your password"
                    className="w-full pl-9 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-[#15803D]"
                  />
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                    aria-label="Toggle confirm password visibility"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
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
                    ? 'Create Account & Verify Email'
                    : 'Send Reset Link'}
                </span>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
