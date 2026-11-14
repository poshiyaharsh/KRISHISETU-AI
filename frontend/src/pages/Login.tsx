import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
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
      await requestCode(email.trim(), i18n.language);
      setStep('code');
      setCountdown(60);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : t('auth.errors.generic', 'Failed to send code.');
      setErrorMessage(msg);
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
      await requestCode(email.trim(), i18n.language);
      setCountdown(60);
    } catch {
      setErrorMessage(t('auth.errors.resend_failed', 'Failed to resend code. Please try again.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex flex-col justify-center items-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-2xl shadow-sm border border-mist">
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <BrandLogo variant="icon" size="lg" />
          </div>
          <h1 className="text-2xl font-bold text-heading">
            {step === 'email'
              ? t('auth.login_title', 'Sign In to KrishiSetu')
              : t('auth.verify_title', 'Enter Verification Code')}
          </h1>
          <p className="mt-2 text-sm text-muted">
            {step === 'email'
              ? t('auth.login_subtitle', 'Save farm plots, bookmark government schemes, and view your history.')
              : t('auth.code_sent_to', 'We sent a 6-digit code to {{email}}', { email })}
          </p>
        </div>

        {errorMessage && (
          <div
            role="alert"
            className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700"
          >
            {errorMessage}
          </div>
        )}

        {step === 'email' ? (
          <form className="mt-8 space-y-6" onSubmit={handleRequestCode}>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-soil mb-1">
                {t('auth.email_label', 'Email Address')}
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="kisan@example.com"
                className="appearance-none block w-full px-4 py-3 border border-mist rounded-xl placeholder:text-muted text-soil focus:outline-none focus:ring-2 focus:ring-paddy focus:border-paddy text-base"
              />
            </div>

            <div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex justify-center py-3.5 px-4 border border-transparent rounded-xl shadow-sm text-base font-semibold text-on-dark bg-paddy hover:bg-paddy-light focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-paddy disabled:opacity-50 transition-colors"
              >
                {isSubmitting
                  ? t('common.loading', 'Sending...')
                  : t('auth.send_code', 'Send Verification Code')}
              </button>
            </div>
          </form>
        ) : (
          <form className="mt-8 space-y-6" onSubmit={handleVerifyCode}>
            <div>
              <label htmlFor="code" className="block text-sm font-medium text-soil mb-1">
                {t('auth.code_label', '6-Digit Code')}
              </label>
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
                placeholder="123456"
                className="appearance-none block w-full px-4 py-3 text-center tracking-widest text-2xl font-bold border border-mist rounded-xl placeholder:text-muted text-soil focus:outline-none focus:ring-2 focus:ring-paddy focus:border-paddy tabular-nums"
              />
            </div>

            <div className="flex items-center justify-between text-sm">
              <button
                type="button"
                onClick={() => {
                  setStep('email');
                  setCode('');
                  setErrorMessage(null);
                }}
                className="text-paddy hover:underline font-medium"
              >
                {t('auth.change_email', 'Change email')}
              </button>

              <button
                type="button"
                onClick={handleResend}
                disabled={countdown > 0 || isSubmitting}
                className="text-muted hover:text-soil disabled:opacity-50"
              >
                {countdown > 0
                  ? t('auth.resend_in', 'Resend in {{seconds}}s', { seconds: countdown })
                  : t('auth.resend_code', 'Resend Code')}
              </button>
            </div>

            <div>
              <button
                type="submit"
                disabled={isSubmitting || code.length !== 6}
                className="w-full flex justify-center py-3.5 px-4 border border-transparent rounded-xl shadow-sm text-base font-semibold text-on-dark bg-paddy hover:bg-paddy-light focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-paddy disabled:opacity-50 transition-colors"
              >
                {isSubmitting
                  ? t('common.loading', 'Verifying...')
                  : t('auth.verify_and_login', 'Verify & Sign In')}
              </button>
            </div>
          </form>
        )}

        <div className="pt-4 border-t border-mist text-center">
          <Link
            to="/"
            className="text-sm font-medium text-muted hover:text-soil transition-colors"
          >
            {t('auth.continue_guest', 'Continue without signing in →')}
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Login;
