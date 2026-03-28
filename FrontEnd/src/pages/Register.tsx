import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  BookOpen,
  CheckCircle,
  Clock,
  Mail,
  Shield,
  Sparkles,
  User,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import GoogleSignInButton from '../components/GoogleSignInButton';

const Register: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'details' | 'otp'>('details');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [countdown, setCountdown] = useState(0);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const { sendOtp, verifyOtp, isLoading } = useAuth();
  const navigate = useNavigate();
  const [isSendingOTP, setIsSendingOTP] = useState(false);

  React.useEffect(() => {
    let timer: any;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsSendingOTP(true);

    if (!name.trim()) {
      setError('Please enter your full name');
      setIsSendingOTP(false);
      return;
    }

    if (!email) {
      setError('Please enter your email address');
      setIsSendingOTP(false);
      return;
    }

    if (!acceptTerms) {
      setError('Please accept the terms and conditions');
      setIsSendingOTP(false);
      return;
    }

    const result = await sendOtp(email, 'registration');
    if (result.success) {
      setSuccess(result.message);
      setStep('otp');
      setCountdown(60);
    } else {
      setError(result.message);
    }
    setIsSendingOTP(false);
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!otp || otp.length !== 6) {
      setError('Please enter the 6-digit OTP');
      return;
    }

    const result = await verifyOtp(email, otp, 'registration', name.trim());
    if (result.success) {
      navigate('/dashboard');
    } else {
      setError(result.message);
    }
  };

  const handleResendOtp = async () => {
    if (countdown > 0) return;

    setError('');
    setIsSendingOTP(true);
    const result = await sendOtp(email, 'registration');
    if (result.success) {
      setSuccess('New OTP sent to your email');
      setCountdown(60);
      setOtp('');
    } else {
      setError(result.message);
    }
    setIsSendingOTP(false);
  };

  const handleGoogleSuccess = () => {
    navigate('/dashboard');
  };

  const handleGoogleError = (message: string) => {
    setError(message);
  };

  const handleBackToDetails = () => {
    setStep('details');
    setOtp('');
    setError('');
    setSuccess('');
  };

  return (
    <div className='min-h-screen bg-slate-50 px-5 py-8 dark:bg-slate-950 sm:px-6 lg:px-8'>
      <div className='mx-auto flex min-h-[calc(100vh-7rem)] max-w-5xl items-center justify-center'>
        <div className='w-full max-w-[560px] overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-xl dark:border-slate-800 dark:bg-slate-900'>
          <div className='h-1 w-full bg-[linear-gradient(90deg,_#0f172a_0%,_#2563eb_55%,_#10b981_100%)]' />
          <div className='flex items-center justify-center px-5 py-8 sm:px-8 lg:px-10'>
          <div className='w-full max-w-md'>
            <div className='mb-8'>
              <div className='flex items-center gap-3'>
                <div className='flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'>
                  <BookOpen className='h-6 w-6' />
                </div>
                <div>
                  <p className='text-lg font-semibold text-slate-900 dark:text-slate-100'>
                    PTEbyDee
                  </p>
                  <p className='text-sm text-slate-500 dark:text-slate-400'>
                    {step === 'details'
                      ? 'Create your account'
                      : 'Verify your email'}
                  </p>
                </div>
              </div>

              <div className='mt-6 flex items-center gap-2 text-xs font-medium uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500'>
                <Sparkles className='h-4 w-4' />
                <span>
                  {step === 'details' ? 'Get started' : 'Complete registration'}
                </span>
              </div>
              <h2 className='mt-3 text-3xl font-semibold tracking-tight text-slate-900 dark:text-slate-100'>
                {step === 'details'
                  ? 'Create your learning account'
                  : 'Enter your verification code'}
              </h2>
              <p className='mt-3 text-sm leading-6 text-slate-500 dark:text-slate-400'>
                {step === 'details'
                  ? 'Sign up with Google or email to start learning inside a cleaner PTE preparation workspace.'
                  : `We sent a 6-digit code to ${email}. Enter it below to finish account creation.`}
              </p>
            </div>

            {step === 'details' && (
              <div className='space-y-6'>
                <GoogleSignInButton
                  onSuccess={handleGoogleSuccess}
                  onError={handleGoogleError}
                />

                <div className='relative'>
                  <div className='absolute inset-0 flex items-center'>
                    <div className='w-full border-t border-slate-200 dark:border-slate-700' />
                  </div>
                  <div className='relative flex justify-center text-sm'>
                    <span className='bg-white px-3 text-slate-500 dark:bg-slate-900 dark:text-slate-400'>
                      Or continue with email
                    </span>
                  </div>
                </div>

                <form
                  className='space-y-5'
                  onSubmit={handleSendOtp}
                >
                  <div className='space-y-4'>
                    <div>
                      <label
                        htmlFor='name'
                        className='mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300'
                      >
                        Full name
                      </label>
                      <div className='relative'>
                        <div className='pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4'>
                          <User className='h-5 w-5 text-slate-400' />
                        </div>
                        <input
                          id='name'
                          name='name'
                          type='text'
                          autoComplete='name'
                          required
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          className='block w-full rounded-2xl border border-slate-300 bg-white py-3.5 pl-11 pr-4 text-slate-900 outline-none transition focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:focus:border-slate-300 dark:focus:ring-slate-100/10'
                          placeholder='Enter your full name'
                        />
                      </div>
                    </div>

                    <div>
                      <label
                        htmlFor='email'
                        className='mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300'
                      >
                        Email address
                      </label>
                      <div className='relative'>
                        <div className='pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4'>
                          <Mail className='h-5 w-5 text-slate-400' />
                        </div>
                        <input
                          id='email'
                          name='email'
                          type='email'
                          autoComplete='email'
                          required
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className='block w-full rounded-2xl border border-slate-300 bg-white py-3.5 pl-11 pr-4 text-slate-900 outline-none transition focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:focus:border-slate-300 dark:focus:ring-slate-100/10'
                          placeholder='Enter your email address'
                        />
                      </div>
                    </div>
                  </div>

                  {error && (
                    <div className='rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-300'>
                      {error}
                    </div>
                  )}

                  {success && (
                    <div className='rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-950/30 dark:text-emerald-300'>
                      {success}
                    </div>
                  )}

              
                  <label className='flex items-start gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-4 text-sm text-slate-600 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-400'>
                    <input
                      id='accept-terms'
                      name='accept-terms'
                      type='checkbox'
                      checked={acceptTerms}
                      onChange={(e) => setAcceptTerms(e.target.checked)}
                      className='mt-1 h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-400 dark:border-slate-700 dark:bg-slate-900'
                    />
                    <span className='leading-6'>
                      I agree to the{' '}
                      <Link
                        to='/privacy-policy'
                        className='font-medium text-slate-900 hover:text-slate-700 dark:text-slate-100 dark:hover:text-slate-300'
                      >
                        Privacy Policy
                      </Link>{' '}
                      and platform terms for account access.
                    </span>
                  </label>

                  <button
                    type='submit'
                    disabled={isSendingOTP}
                    className='inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-900 px-4 py-3.5 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200'
                  >
                    {isSendingOTP ? (
                      <>
                        <span className='h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white dark:border-slate-400/30 dark:border-t-slate-900' />
                        <span>Sending verification code...</span>
                      </>
                    ) : (
                      <>
                        <Mail className='h-4 w-4' />
                        <span>Send Verification Code</span>
                      </>
                    )}
                  </button>
                </form>

                <p className='text-center text-sm text-slate-500 dark:text-slate-400'>
                  Already have an account?{' '}
                  <Link
                    to='/login'
                    className='font-medium text-slate-900 hover:text-slate-700 dark:text-slate-100 dark:hover:text-slate-300'
                  >
                    Sign in here
                  </Link>
                </p>
              </div>
            )}

            {step === 'otp' && (
              <div className='space-y-6'>
                <button
                  onClick={handleBackToDetails}
                  className='inline-flex items-center gap-2 text-sm font-medium text-slate-600 transition-colors hover:text-slate-900 dark:text-slate-300 dark:hover:text-slate-100'
                >
                  <ArrowLeft className='h-4 w-4' />
                  <span>Change details</span>
                </button>

                <div className='rounded-2xl border border-blue-200 bg-blue-50 px-4 py-4 dark:border-blue-900/40 dark:bg-blue-950/30'>
                  <div className='flex items-start gap-3'>
                    <Shield className='mt-0.5 h-5 w-5 text-blue-600 dark:text-blue-300' />
                    <div>
                      <p className='text-sm font-medium text-slate-900 dark:text-slate-100'>
                        Email verification
                      </p>
                      <p className='mt-1 text-sm leading-6 text-slate-600 dark:text-slate-400'>
                        Your code stays valid for 10 minutes while you complete
                        registration.
                      </p>
                    </div>
                  </div>
                </div>

                <form
                  className='space-y-5'
                  onSubmit={handleVerifyOtp}
                >
                  <div>
                    <label
                      htmlFor='otp'
                      className='mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300'
                    >
                      Verification code
                    </label>
                    <input
                      id='otp'
                      name='otp'
                      type='text'
                      inputMode='numeric'
                      pattern='[0-9]*'
                      maxLength={6}
                      value={otp}
                      onChange={(e) =>
                        setOtp(e.target.value.replace(/\D/g, ''))
                      }
                      className='block w-full rounded-2xl border border-slate-300 bg-white px-4 py-4 text-center font-mono text-3xl tracking-[0.35em] text-slate-900 outline-none transition focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:focus:border-slate-300 dark:focus:ring-slate-100/10'
                      placeholder='000000'
                      autoComplete='one-time-code'
                    />
                  </div>

                  {error && (
                    <div className='rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-300'>
                      {error}
                    </div>
                  )}

                  {success && (
                    <div className='rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-950/30 dark:text-emerald-300'>
                      {success}
                    </div>
                  )}

                  <button
                    type='submit'
                    disabled={isLoading || otp.length !== 6}
                    className='inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-900 px-4 py-3.5 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200'
                  >
                    {isLoading ? (
                      <>
                        <span className='h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white dark:border-slate-400/30 dark:border-t-slate-900' />
                        <span>Creating account...</span>
                      </>
                    ) : (
                      'Verify & Create Account'
                    )}
                  </button>
                </form>

                <div className='flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 dark:border-slate-800 dark:bg-slate-950'>
                  <div className='flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400'>
                    <Clock className='h-4 w-4' />
                    <span>
                      {countdown > 0
                        ? `Resend available in ${countdown}s`
                        : 'Need a fresh code?'}
                    </span>
                  </div>
                  <button
                    type='button'
                    onClick={handleResendOtp}
                    disabled={countdown > 0 || isLoading || isSendingOTP}
                    className='text-sm font-medium text-slate-900 transition hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-50 dark:text-slate-100 dark:hover:text-slate-300'
                  >
                    {isSendingOTP ? 'Sending...' : 'Resend Code'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
