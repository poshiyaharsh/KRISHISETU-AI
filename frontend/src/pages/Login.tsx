import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Mail,
  ArrowRight,
  ArrowLeft,
  KeyRound,
  Clock,
  AlertCircle,
  Sparkles,
  Loader2,
  CheckCircle2,
  RotateCcw,
  ShieldCheck,
} from 'lucide-react';
import { useAuth } from '@/features/auth';
import { BrandLogo } from '@/components/brand/BrandLogo';

export function maskEmail(email: string): string {
  if (!email || !email.includes('@')) return email;
  const parts = email.trim().toLowerCase().split('@');
  if (parts.length !== 2) return email;
  const [user, domain] = parts;
  const maskedUser = user.length <= 2 ? `${user[0]}***` : `${user.slice(0, 2)}***`;
  return `${maskedUser}@${domain}`;
}

export const Login: React.FC = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { isAuthenticated, requestCode, verifyCode, loginWithGoogle } = useAuth();

  const redirectUrl = searchParams.get('redirect') || '/dashboard';
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

  const [step, setStep] = useState<'email' | 'code'>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [devCode, setDevCode] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSlow, setIsSlow] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isDeliveryFailed, setIsDeliveryFailed] = useState(false);
  const [googleAvailable, setGoogleAvailable] = useState<boolean | null>(null);

  // Free-tier wake up indicator
  useEffect(() => {
    if (!isSubmitting) {
      setIsSlow(false);
      return;
    }
    const timer = setTimeout(() => setIsSlow(true), 3500);
    return () => clearTimeout(timer);
  }, [isSubmitting]);

  // If already logged in, redirect
  useEffect(() => {
    if (isAuthenticated) {
      navigate(redirectUrl, { replace: true });
    }
  }, [isAuthenticated, navigate, redirectUrl]);

  // Resend countdown timer (30 seconds per specification)
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(c => c - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  // Handle Google Credential Callback
  const handleGoogleSuccess = useCallback(
    async (response: { credential?: string }) => {
      if (!response.credential) {
        setErrorMessage(t('auth.generic_error', 'An unexpected error occurred. Please try again.'));
        return;
      }
      setIsSubmitting(true);
      setErrorMessage(null);
      try {
        await loginWithGoogle(response.credential, i18n.language);
        navigate(redirectUrl, { replace: true });
      } catch (err: unknown) {
        const msg =
          err instanceof Error
            ? err.message
            : t('auth.generic_error', 'An unexpected error occurred. Please try again.');
        setErrorMessage(msg);
      } finally {
        setIsSubmitting(false);
      }
    },
    [loginWithGoogle, i18n.language, navigate, redirectUrl, t]
  );

  // Initialize and Render Google Sign-In Button via GIS
  useEffect(() => {
    if (typeof window === 'undefined' || step !== 'email') return;

    if (!googleClientId) {
      setGoogleAvailable(false);
      return;
    }

    let isMounted = true;

    const renderGisButton = () => {
      if (!isMounted || !window.google?.accounts?.id) return;
      try {
        window.google.accounts.id.initialize({
          client_id: googleClientId,
          callback: handleGoogleSuccess,
          auto_select: false,
          cancel_on_tap_outside: true,
        });

        const btnContainer = document.getElementById('google-signin-container');
        if (btnContainer) {
          btnContainer.innerHTML = '';
          window.google.accounts.id.renderButton(btnContainer, {
            theme: 'outline',
            size: 'large',
            type: 'standard',
            shape: 'pill',
            text: 'continue_with',
            logo_alignment: 'left',
            width: 320,
            locale: i18n.language,
          });
          setGoogleAvailable(true);
        }
      } catch (err) {
        console.error('Google Sign-In initialization failed:', err);
        if (isMounted) setGoogleAvailable(false);
      }
    };

    if (window.google?.accounts?.id) {
      renderGisButton();
    } else {
      const existingScript = document.querySelector('script[src="https://accounts.google.com/gsi/client"]');
      if (existingScript) {
        existingScript.addEventListener('load', renderGisButton);
      } else {
        const script = document.createElement('script');
        script.src = 'https://accounts.google.com/gsi/client';
        script.async = true;
        script.defer = true;
        script.onload = renderGisButton;
        script.onerror = () => {
          if (isMounted) setGoogleAvailable(false);
        };
        document.head.appendChild(script);
      }
    }

    return () => {
      isMounted = false;
    };
  }, [googleClientId, handleGoogleSuccess, i18n.language, step]);

  const handleRequestCode = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!email || !email.includes('@')) {
      setErrorMessage(t('auth.invalid_email', 'Please enter a valid email address.'));
      setIsDeliveryFailed(false);
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);
    setIsDeliveryFailed(false);

    try {
      const res = await requestCode(email.trim(), i18n.language);
      if (res?.dev_code) {
        setDevCode(res.dev_code);
        setCode(res.dev_code);
      }
      setStep('code');
      setCountdown(30);
    } catch (err: unknown) {
      const rawMsg = err instanceof Error ? err.message : '';
      const is503 =
        rawMsg.includes('503') ||
        rawMsg.includes('delivery_failed') ||
        rawMsg.includes('email_delivery_failed');
      if (is503) {
        setIsDeliveryFailed(true);
        setErrorMessage(
          t(
            'auth.email_delivery_failed',
            'We could not send the email right now. Please try again in a few minutes.'
          )
        );
      } else if (rawMsg.includes('timed out') || rawMsg.includes('408')) {
        setIsDeliveryFailed(true);
        setErrorMessage(
          t(
            'auth.email_delivery_failed',
            'We could not send the email right now. Please try again in a few minutes.'
          )
        );
      } else {
        setErrorMessage(
          rawMsg || t('auth.generic_error', 'An unexpected error occurred. Please try again.')
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code || code.trim().length !== 6) {
      setErrorMessage(
        t('auth.invalid_code', 'Invalid or expired verification code. Please check and try again.')
      );
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      await verifyCode(email.trim(), code.trim(), i18n.language);
      navigate(redirectUrl, { replace: true });
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : t('auth.invalid_code', 'Invalid or expired verification code. Please check and try again.');
      setErrorMessage(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResend = async () => {
    if (countdown > 0 || isSubmitting) return;
    await handleRequestCode();
  };

  return (
    <div className="min-h-[85vh] flex flex-col justify-center items-center py-8 px-4 sm:px-6 lg:px-8 relative">
      {/* Small Back to Home link at top of login layout */}
      <div className="w-full max-w-md mb-4 flex justify-between items-center text-xs">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-muted hover:text-heading font-medium transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>{t('auth.back_to_home', 'Back to home')}</span>
        </Link>

        <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-mist/60 text-heading border border-mist font-medium">
          <Sparkles className="w-3 h-3 text-leaf" />
          <span>{t('auth.free_badge', '100% Free & Secure')}</span>
        </div>
      </div>

      <div className="max-w-md w-full bg-white p-6 sm:p-10 rounded-3xl shadow-card border border-mist/80 border-t-4 border-t-wheat">
        {/* Brand Header with Lockup Logo centered above the form */}
        <div className="text-center">
          <div className="flex justify-center mb-6">
            <Link
              to="/"
              aria-label="KrishiSetu AI, home"
              className="inline-flex items-center justify-center transition-transform hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-paddy focus:ring-offset-2 rounded-lg"
            >
              <BrandLogo
                variant="lockup"
                className="h-14 sm:h-16 w-auto object-contain"
              />
            </Link>
          </div>

          <h1 className="text-2xl font-bold text-heading">
            {step === 'email'
              ? t('auth.login_title', 'Sign In to KrishiSetu AI')
              : t('auth.step2_title', 'Enter Verification Code')}
          </h1>
          <p className="mt-2 text-sm text-muted">
            {step === 'email'
              ? t('auth.login_subtitle', 'Save your farm plots, access past crop recommendations, and track local weather.')
              : t('auth.step2_desc', 'Enter the 6-digit code sent to {{email}}.', { email: maskEmail(email) })}
          </p>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div
            role="alert"
            className="p-4 bg-red-50 border border-red-200 rounded-2xl text-sm text-red-800 flex flex-col gap-2 my-5 animate-fadeIn"
          >
            <div className="flex items-start gap-2.5">
              <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
              <div className="flex-1 text-xs sm:text-sm font-medium leading-relaxed">{errorMessage}</div>
            </div>

            {isDeliveryFailed && (
              <button
                type="button"
                onClick={() => handleRequestCode()}
                disabled={isSubmitting}
                className="self-start mt-1 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-100 hover:bg-red-200 text-xs font-bold text-red-900 transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>{t('common.retry', 'Try again')}</span>
              </button>
            )}
          </div>
        )}

        {/* Step 1: Request Code / Sign In Options */}
        {step === 'email' ? (
          <div className="mt-6">
            {/* Primary Option: Google Sign-In */}
            <div className="flex flex-col items-center justify-center">
              <div
                id="google-signin-container"
                className="w-full flex justify-center min-h-[44px]"
              />

              {/* If Google script fails to load or no client ID configured */}
              {googleAvailable === false && (
                <div className="w-full p-3 bg-amber-50/80 border border-amber-200 rounded-2xl text-xs text-amber-900 flex items-start gap-2 text-left">
                  <AlertCircle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                  <span>
                    {t(
                      'auth.google_unavailable',
                      'Google Sign-In is unavailable (blocked or offline). Please use email verification.'
                    )}
                  </span>
                </div>
              )}

              {/* Consent and Terms Notice */}
              <p className="text-[11px] text-muted text-center mt-2.5 leading-snug">
                {t(
                  'auth.terms_notice',
                  'By signing in, you agree to our Terms of Service and Privacy Policy.'
                )}
              </p>
            </div>

            {/* Divider: Or continue with email */}
            <div className="relative my-6 flex items-center justify-center">
              <div className="border-t border-mist w-full" />
              <span className="bg-white px-3 text-xs uppercase tracking-wider text-muted font-bold shrink-0">
                {t('auth.or_email', 'Or continue with email')}
              </span>
            </div>

            {/* Secondary Option: Email Code Form */}
            <form className="space-y-4" onSubmit={handleRequestCode}>
              <div>
                <label
                  htmlFor="email"
                  className="block text-xs font-bold uppercase tracking-wider text-soil mb-1.5"
                >
                  {t('auth.email_label', 'Email Address')}
                </label>
                <div className="relative rounded-2xl">
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
                    placeholder={t('auth.email_placeholder', 'farmer@example.com')}
                    className="block w-full pl-11 pr-4 py-3.5 border border-mist rounded-2xl placeholder:text-muted/60 text-soil bg-mist/10 focus:bg-white focus:outline-none focus:ring-2 focus:ring-paddy focus:border-paddy text-sm sm:text-base transition-all"
                  />
                </div>
                <p className="mt-1.5 text-xs text-muted">
                  {t(
                    'auth.step1_desc',
                    'We will send a 6-digit verification code to your email. No passwords needed.'
                  )}
                </p>
              </div>

              <button
                type="submit"
                disabled={isSubmitting || !email.includes('@')}
                className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-2xl shadow-sm text-base font-semibold text-on-dark bg-paddy hover:bg-paddy-light active:scale-[0.99] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-paddy disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>{t('common.loading', 'Loading...')}</span>
                  </>
                ) : (
                  <>
                    <span>{t('auth.send_code', 'Send Verification Code')}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              {isSubmitting && isSlow && (
                <div className="p-3 bg-amber-50/90 border border-amber-200/80 rounded-xl text-xs text-amber-900 flex items-center justify-center gap-2 text-center animate-fadeIn">
                  <Loader2 className="w-4 h-4 text-amber-700 animate-spin shrink-0" />
                  <span>{t('auth.waking_server', 'Connecting to server... Free-tier host wakes up in 30-45s on first visit.')}</span>
                </div>
              )}
            </form>
          </div>
        ) : (
          /* Step 2: Verification Code Form */
          <form className="mt-6 space-y-5" onSubmit={handleVerifyCode}>
            {/* Masked Email Notice & Spam Advisory */}
            <div className="p-3.5 bg-mist/30 border border-mist rounded-2xl space-y-1.5">
              <div className="flex items-center justify-between text-xs sm:text-sm">
                <div className="flex items-center gap-2 text-soil font-medium truncate">
                  <Mail className="w-4 h-4 text-paddy shrink-0" />
                  <span className="truncate">{maskEmail(email)}</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setStep('email');
                    setCode('');
                    setErrorMessage(null);
                    setIsDeliveryFailed(false);
                  }}
                  className="text-xs font-bold text-paddy hover:underline shrink-0 flex items-center gap-1 ml-2"
                >
                  <span>{t('auth.use_different_email', 'Use a different email')}</span>
                </button>
              </div>

              <p className="text-[11px] text-muted leading-tight">
                {t('auth.check_spam', 'It can take a minute. Check your spam or promotions folder.')}
              </p>
            </div>

            {/* Dev OTP Banner (if running locally or DEV_OTP active) */}
            {devCode && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-900 flex items-center justify-between">
                <div>
                  <span className="font-bold">Dev/Test OTP:</span>{' '}
                  <code className="bg-amber-100 px-2 py-0.5 rounded font-mono font-bold text-soil">
                    {devCode}
                  </code>
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
              <label
                htmlFor="code"
                className="block text-xs font-bold uppercase tracking-wider text-soil mb-1.5 text-center"
              >
                {t('auth.otp_label', '6-Digit Code')}
              </label>
              <input
                id="code"
                name="code"
                aria-label="6-digit code"
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

            <div className="flex items-center justify-between text-xs sm:text-sm">
              <span className="text-muted flex items-center gap-1 text-xs">
                <Clock className="w-3.5 h-3.5" />
                <span>{t('auth.code_expiry', 'Valid for 10 minutes.')}</span>
              </span>

              <button
                type="button"
                onClick={handleResend}
                disabled={countdown > 0 || isSubmitting}
                className="font-semibold text-paddy hover:underline disabled:text-muted/60 disabled:no-underline transition-colors"
              >
                {countdown > 0
                  ? t('auth.resend_in', 'Resend code in {{seconds}}s', { seconds: countdown })
                  : t('auth.resend_code', 'Resend code')}
              </button>
            </div>

            <button
              type="submit"
              disabled={isSubmitting || code.length !== 6}
              className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-2xl shadow-sm text-base font-semibold text-on-dark bg-paddy hover:bg-paddy-light active:scale-[0.99] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-paddy disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>{t('common.loading', 'Loading...')}</span>
                </>
              ) : (
                <>
                  <KeyRound className="w-4 h-4" />
                  <span>{t('auth.verify_btn', 'Verify & Continue')}</span>
                </>
              )}
            </button>

            {isSubmitting && isSlow && (
              <div className="p-3 bg-amber-50/90 border border-amber-200/80 rounded-xl text-xs text-amber-900 flex items-center justify-center gap-2 text-center animate-fadeIn">
                <Loader2 className="w-4 h-4 text-amber-700 animate-spin shrink-0" />
                <span>{t('auth.waking_server', 'Connecting to server... Free-tier host wakes up in 30-45s on first visit.')}</span>
              </div>
            )}
          </form>
        )}

        {/* Benefits List */}
        <div className="mt-8 pt-6 border-t border-mist">
          <p className="text-xs font-bold uppercase tracking-wider text-muted mb-3 text-center">
            {t('auth.login_title', 'Sign In to KrishiSetu AI')}
          </p>
          <div className="grid grid-cols-1 gap-2 text-xs text-soil">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-leaf shrink-0" />
              <span>
                {t('profile.plots_title', 'Your Land Plots')} (up to 5 plots)
              </span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-leaf shrink-0" />
              <span>
                {t(
                  'home.crsModuleDesc',
                  'Scientifically calibrated multi-class model predicting top crops'
                )}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-leaf shrink-0" />
              <span>{t('home.schemesModuleTitle', 'Government Schemes & Subsidies')}</span>
            </div>
          </div>
        </div>

        {/* Guest Skip Footer */}
        <div className="mt-6 pt-4 border-t border-mist text-center">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-muted hover:text-paddy transition-colors"
          >
            <span>{t('auth.skip_login', 'Continue as Guest (No Sign In)')}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Security Notice */}
        <div className="mt-4 flex items-center justify-center gap-1.5 text-[11px] text-muted">
          <ShieldCheck className="w-3.5 h-3.5 text-leaf" />
          <span>
            {t(
              'auth.free_badge_desc',
              'KrishiSetu is completely free. We never charge for accounts or share your data.'
            )}
          </span>
        </div>
      </div>
    </div>
  );
};

export default Login;
