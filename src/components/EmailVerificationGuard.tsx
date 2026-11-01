import React, { useState } from 'react';
import { Mail, AlertTriangle, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface EmailVerificationGuardProps {
  children: React.ReactNode;
  featureName?: string;
}

export const EmailVerificationGuard: React.FC<EmailVerificationGuardProps> = ({
  children,
  featureName = 'this marketplace feature',
}) => {
  const { user, isEmailVerified, resendConfirmationEmail, openAuthModal } = useAuth();
  const [isResending, setIsResending] = useState(false);
  const [resendStatus, setResendStatus] = useState<{ success: boolean; message: string } | null>(null);
  const [cooldown, setCooldown] = useState(0);

  if (!user) {
    return (
      <div className="min-h-[60vh] bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-3xl border border-slate-200 text-center max-w-md shadow-xs space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center mx-auto">
            <Mail className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-slate-900">Sign In Required</h2>
          <p className="text-xs text-slate-500 leading-relaxed">
            Please sign in with your student account to access {featureName}.
          </p>
          <button
            onClick={() => openAuthModal('signin')}
            className="w-full py-2.5 bg-[#064E3B] hover:bg-[#15803D] text-white text-xs font-bold rounded-full transition-colors cursor-pointer"
          >
            Sign In to Continue
          </button>
        </div>
      </div>
    );
  }

  // If user is signed in but email is not verified
  if (!isEmailVerified) {
    const handleResend = async () => {
      if (cooldown > 0 || !user.email) return;
      setIsResending(true);
      setResendStatus(null);
      try {
        const { error } = await resendConfirmationEmail(user.email);
        if (error) {
          setResendStatus({ success: false, message: error.message });
        } else {
          setResendStatus({
            success: true,
            message: `Verification link sent to ${user.email}! Please check your inbox and spam folder.`,
          });
          setCooldown(60);
          const interval = setInterval(() => {
            setCooldown((prev) => {
              if (prev <= 1) {
                clearInterval(interval);
                return 0;
              }
              return prev - 1;
            });
          }, 1000);
        }
      } catch (err: any) {
        setResendStatus({ success: false, message: err?.message || 'Failed to resend email.' });
      } finally {
        setIsResending(false);
      }
    };

    return (
      <div className="min-h-[70vh] bg-[#F8FAFC] flex items-center justify-center p-4">
        <div className="bg-white max-w-md w-full p-8 rounded-3xl border border-amber-200 text-center shadow-lg space-y-5 animate-in fade-in duration-200">
          <div className="w-14 h-14 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center mx-auto">
            <AlertTriangle className="w-7 h-7 text-amber-700" />
          </div>
          <h2 className="text-xl font-bold text-slate-900">Email Confirmation Required</h2>
          <p className="text-xs text-slate-600 leading-relaxed">
            Your account is registered, but you must confirm your email (
            <strong className="text-slate-800 font-semibold">{user.email}</strong>) before you can
            access {featureName}.
          </p>

          <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl text-left text-xs text-slate-600 space-y-2">
            <p className="font-semibold text-slate-800 flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-emerald-700" /> Next steps:
            </p>
            <ol className="list-decimal pl-4 space-y-1 text-[11px] text-slate-500">
              <li>Check your email inbox (and your Spam / Junk folder).</li>
              <li>Click the confirmation link sent by <strong>CampusMart</strong>.</li>
              <li>Return here or refresh this page to access full marketplace features.</li>
            </ol>
          </div>

          {resendStatus && (
            <div
              className={`p-3 rounded-xl text-xs font-medium text-left ${
                resendStatus.success
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : 'bg-rose-50 text-rose-800 border border-rose-200'
              }`}
            >
              {resendStatus.message}
            </div>
          )}

          <div className="space-y-2 pt-2">
            <button
              onClick={handleResend}
              disabled={isResending || cooldown > 0}
              className="w-full py-2.5 bg-[#064E3B] hover:bg-[#15803D] disabled:bg-slate-300 text-white text-xs font-bold rounded-full transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-xs"
            >
              {isResending ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Mail className="w-3.5 h-3.5" />
              )}
              <span>
                {cooldown > 0 ? `Resend email in ${cooldown}s` : 'Resend Verification Email'}
              </span>
            </button>
            <button
              onClick={() => window.location.reload()}
              className="w-full py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
            >
              I have already confirmed, refresh page
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Verified user: render protected content
  return <>{children}</>;
};

