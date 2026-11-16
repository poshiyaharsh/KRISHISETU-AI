import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Mail,
  ShieldCheck,
  ArrowRight,
  ArrowLeft,
  KeyRound,
  Clock,
  AlertCircle,
  Sparkles,
  Loader2,
  CheckCircle2,
} from 'lucide-react';
import { useAuth } from '@/features/auth';
import { BrandLogo } from '@/components/brand/BrandLogo';

export const Login: React.FC = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { isAuthenticated, requestCode, verifyCode } = useAuth();

  const redirectUrl = searchParams.get('redirect') || '/dashboard';

  const [step, setStep] = useState<'email' | 'code'>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [devCode, setDevCode] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // If already logged in, redirect
  useEffect(() => {
    if (isAuthenticated) {
      navigate(redirectUrl, { replace: true });
    }
  }, [isAuthenticated, navigate, redirectUrl]);

  // Resend countdown timer
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(c => c - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleRequestCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      setErrorMessage(t('auth.errors.invalid_email', 'Please enter a valid email address.'));
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const res = await requestCode(email.trim(), i18n.language);
      if (res?.dev_code) {
        setDevCode(res.dev_code);
        setCode(res.dev_code);
      }
      setStep('code');
      setCountdown(60);
    } catch (err: unknown) {
      const rawMsg = err instanceof Error ? err.message : '';
      if (rawMsg.includes('timed out') || rawMsg.includes('408')) {
        setErrorMessage(
          t(
            'auth.errors.timeout',
            'Connection timed out. If you are using Render, the service may be warming up. Please click Send Verification Code again.'
          )
        );
      } else {
        setErrorMessage(rawMsg || t('auth.errors.generic', 'Failed to send verification code. Please try again.'));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code || code.trim().length !== 6) {
      setErrorMessage(t('auth.errors.invalid_code', 'Please enter the 6-digit code.'));
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      await verifyCode(email.trim(), code.trim(), i18n.language);
      navigate(redirectUrl, { replace: true });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : t('auth.errors.invalid_code', 'Invalid or expired code.');
      setErrorMessage(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResend = async () => {
    if (countdown > 0 || isSubmitting) return;
    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      const res = await requestCode(email.trim(), i18n.language);
      if (res?.dev_code) {
        setDevCode(res.dev_code);
        setCode(res.dev_code);
      }
      setCountdown(60);
    } catch {
      setErrorMessage(t('auth.errors.resend_failed', 'Failed to resend code. Please try again.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex flex-col justify-center items-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Decorative background orbs */}
      <div className="absolute top-12 left-1/2 -translate-x-1/2 w-96 h-96 bg-mist/50 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="absolute bottom-12 right-1/4 w-72 h-72 bg-leaf/5 rounded-full blur-2xl pointer-events-none -z-10" />

      <div className="max-w-md w-full bg-white/95 backdrop-blur-sm p-8 sm:p-10 rounded-3xl shadow-xl border border-mist transition-all">
        {/* Brand Header */}
        <div className="text-center">
          <div className="flex justify-center mb-5">
            <div className="p-3 bg-mist/40 rounded-2xl border border-mist/80 shadow-sm">
              <BrandLogo variant="icon" size="lg" />
            </div>
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-mist/60 text-heading border border-mist mb-3">
            <Sparkles className="w-3.5 h-3.5 text-leaf" />
            <span>{t('auth.portal_badge', 'Farmer Portal • किसान पोर्टल')}</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-heading tracking-tight">
            {step === 'email'
              ? t('auth.login_title', 'Sign In to KrishiSetu')
              : t('auth.verify_title', 'Enter Verification Code')}
          </h1>
          <p className="mt-2 text-sm text-muted leading-relaxed">
            {step === 'email'
              ? t('auth.login_subtitle', 'Passwordless & secure. Access your farm plots, history, and advisory.')
              : t('auth.code_sent_to', 'We sent a 6-digit code to {{email}}', { email })}
          </p>
        </div>

        {/* Step Indicator Pill */}
        <div className="flex items-center justify-center gap-2 my-6">
          <div
            className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1 rounded-full transition-colors ${
              step === 'email'
                ? 'bg-paddy text-on-dark shadow-sm'
                : 'bg-mist text-soil'
            }`}
          >
            <span>1</span>
            <span>{t('auth.step_email', 'Email')}</span>
          </div>
          <div className="w-6 h-0.5 bg-mist" />
          <div
            className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1 rounded-full transition-colors ${
              step === 'code'
                ? 'bg-paddy text-on-dark shadow-sm'
                : 'bg-mist/50 text-muted'
            }`}
          >
            <span>2</span>
            <span>{t('auth.step_verify', 'Verify Code')}</span>
          </div>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div
            role="alert"
            className="p-4 bg-red-50/90 border border-red-200 rounded-2xl text-sm text-red-800 flex items-start gap-3 my-4 animate-fadeIn"
          >
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            <div className="flex-1 text-xs sm:text-sm font-medium">{errorMessage}</div>
          </div>
        )}

        {/* Step 1: Request Code */}
        {step === 'email' ? (
          <form className="space-y-5" onSubmit={handleRequestCode}>
            <div>
              <label htmlFor="email" className="block text-xs font-bold uppercase tracking-wider text-soil mb-1.5">
                {t('auth.email_label', 'Email Address')}
              </label>
              <div className="relative rounded-2xl shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-muted">
                  <Mail className="h-5 w-5" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="kisan@example.com"
                  className="block w-full pl-11 pr-4 py-3.5 border border-mist rounded-2xl placeholder:text-muted/60 text-soil bg-mist/10 focus:bg-white focus:outline-none focus:ring-2 focus:ring-paddy focus:border-paddy text-sm sm:text-base transition-all"
                />
              </div>
              <p className="mt-1.5 text-xs text-muted">
                {t('auth.email_hint', 'No password needed. We will send you a one-time 6-digit code.')}
              </p>
            </div>

            <button
              type="submit"
              disabled={isSubmitting || !email.includes('@')}
              className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-2xl shadow-md text-base font-semibold text-on-dark bg-paddy hover:bg-paddy-light active:scale-[0.99] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-paddy disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>{t('common.loading', 'Sending Code...')}</span>
                </>
              ) : (
                <>
                  <span>{t('auth.send_code', 'Send Verification Code')}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        ) : (
          /* Step 2: Verify OTP */
          <form className="space-y-5" onSubmit={handleVerifyCode}>
            {/* Active Email Pill */}
            <div className="p-3 bg-mist/30 border border-mist rounded-2xl flex items-center justify-between text-xs sm:text-sm">
              <div className="flex items-center gap-2 text-soil font-medium truncate">
                <Mail className="w-4 h-4 text-paddy shrink-0" />
                <span className="truncate">{email}</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setStep('email');
                  setCode('');
                  setErrorMessage(null);
                }}
                className="text-xs font-bold text-paddy hover:underline shrink-0 flex items-center gap-1 ml-2"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>{t('auth.change_email', 'Change')}</span>
              </button>
            </div>

            {/* Dev / Local OTP Auto-fill Banner */}
            {devCode && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-900 flex items-center justify-between shadow-xs">
                <div>
                  <span className="font-bold">Dev/Test OTP:</span>{' '}
                  <code className="bg-amber-100 px-2 py-0.5 rounded font-mono font-bold text-soil">{devCode}</code>
                </div>
                <button
                  type="button"
                  onClick={() => setCode(devCode)}
                  className="px-2.5 py-1 rounded-lg bg-amber-200/80 hover:bg-amber-200 text-xs font-bold text-amber-950 transition-colors"
                >
                  Auto-fill
                </button>
              </div>
            )}

            <div>
              <label htmlFor="code" className="block text-xs font-bold uppercase tracking-wider text-soil mb-1.5 text-center">
                {t('auth.code_label', 'Enter 6-Digit Code')}
              </label>
              <div className="relative">
                <input
                  id="code"
                  name="code"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  required
                  autoFocus
                  value={code}
                  onChange={e => setCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="• • • • • •"
                  className="block w-full py-3.5 text-center tracking-[0.4em] text-2xl font-black border border-mist rounded-2xl placeholder:text-muted/40 text-soil bg-mist/10 focus:bg-white focus:outline-none focus:ring-2 focus:ring-paddy focus:border-paddy tabular-nums shadow-inner transition-all"
                />
              </div>
            </div>

            <div className="flex items-center justify-between text-xs sm:text-sm">
              <span className="text-muted flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                <span>Valid for 10 minutes</span>
              </span>

              <button
                type="button"
                onClick={handleResend}
                disabled={countdown > 0 || isSubmitting}
                className="font-semibold text-paddy hover:underline disabled:text-muted/60 disabled:no-underline transition-colors"
              >
                {countdown > 0
                  ? t('auth.resend_in', 'Resend in {{seconds}}s', { seconds: countdown })
                  : t('auth.resend_code', 'Resend Code')}
              </button>
            </div>

            <button
              type="submit"
              disabled={isSubmitting || code.length !== 6}
              className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-2xl shadow-md text-base font-semibold text-on-dark bg-paddy hover:bg-paddy-light active:scale-[0.99] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-paddy disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>{t('common.loading', 'Verifying...')}</span>
                </>
              ) : (
                <>
                  <KeyRound className="w-4 h-4" />
                  <span>{t('auth.verify_and_login', 'Verify & Sign In')}</span>
                </>
              )}
            </button>
          </form>
        )}

        {/* Benefits List */}
        <div className="mt-8 pt-6 border-t border-mist/80">
          <p className="text-xs font-bold uppercase tracking-wider text-muted mb-3 text-center">
            {t('auth.benefits_title', 'Farmer Account Benefits')}
          </p>
          <div className="grid grid-cols-1 gap-2 text-xs text-soil">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-leaf shrink-0" />
              <span>{t('auth.benefit_plots', 'Save up to 5 farm plots & soil profiles')}</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-leaf shrink-0" />
              <span>{t('auth.benefit_history', 'Track past crop recommendation results')}</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-leaf shrink-0" />
              <span>{t('auth.benefit_schemes', 'Bookmark government subsidies & schemes')}</span>
            </div>
          </div>
        </div>

        {/* Guest Footer */}
        <div className="mt-6 pt-4 border-t border-mist/60 text-center">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-muted hover:text-paddy transition-colors"
          >
            <span>{t('auth.continue_guest', 'Continue without signing in')}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Security badge */}
        <div className="mt-4 flex items-center justify-center gap-1.5 text-[11px] text-muted">
          <ShieldCheck className="w-3.5 h-3.5 text-leaf" />
          <span>{t('auth.security_notice', '100% Free & Secure • KrishiSetu AI')}</span>
        </div>
      </div>
    </div>
  );
};

export default Login;