import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Mail,
  User,
  BookOpen,
  ArrowLeft,
  Clock,
  Shield,
  CheckCircle,
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

  // Countdown timer for resend OTP
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

    if (!name.trim()) {
      setError('Please enter your full name');
      return;
    }

    if (!email) {
      setError('Please enter your email address');
      return;
    }

    if (!acceptTerms) {
      setError('Please accept the terms and conditions');
      return;
    }

    const result = await sendOtp(email, 'registration');
    if (result.success) {
      setSuccess(result.message);
      setStep('otp');
      setCountdown(60); // 60 seconds countdown
    } else {
      setError(result.message);
    }
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
    const result = await sendOtp(email, 'registration');
    if (result.success) {
      setSuccess('New OTP sent to your email');
      setCountdown(60);
      setOtp(''); // Clear previous OTP
    } else {
      setError(result.message);
    }
  };

  const handleGoogleSuccess = () => {
    navigate('/dashboard');
  };

  const handleGoogleError = (error: string) => {
    setError(error);
  };

  const handleBackToDetails = () => {
    setStep('details');
    setOtp('');
    setError('');
    setSuccess('');
  };

  return (
    <div className='min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8'>
      <div className='max-w-md w-full space-y-8'>
        {/* Header */}
        <div className='text-center'>
          <div className='flex justify-center items-center space-x-2 mb-6'>
            <BookOpen className='h-10 w-10 text-blue-600 dark:text-blue-400' />
            <span className='text-3xl font-bold text-gray-900 dark:text-white'>
              PTEbyDee
            </span>
          </div>
          <h2 className='text-3xl font-bold text-gray-900 dark:text-white'>
            {step === 'details' ? 'Create Your Account' : 'Verify Your Email'}
          </h2>
          <p className='mt-2 text-sm text-gray-600 dark:text-gray-400'>
            {step === 'details'
              ? 'Join thousands of students achieving their PTE goals'
              : `We sent a 6-digit code to ${email}`}
          </p>
        </div>

        {/* Registration Details Step */}
        {step === 'details' && (
          <>
            {/* Google Registration */}
            <div className='space-y-4'>
              <GoogleSignInButton
                onSuccess={handleGoogleSuccess}
                onError={handleGoogleError}
              />

              <div className='relative'>
                <div className='absolute inset-0 flex items-center'>
                  <div className='w-full border-t border-gray-300 dark:border-gray-600' />
                </div>
                <div className='relative flex justify-center text-sm'>
                  <span className='px-2 bg-gray-50 dark:bg-gray-900 text-gray-500 dark:text-gray-400'>
                    Or create account with email
                  </span>
                </div>
              </div>
            </div>

            {/* Registration Form */}
            <form
              className='mt-8 space-y-6'
              onSubmit={handleSendOtp}
            >
              <div className='space-y-4'>
                {/* Name */}
                <div>
                  <label
                    htmlFor='name'
                    className='sr-only'
                  >
                    Full Name
                  </label>
                  <div className='relative'>
                    <div className='absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none'>
                      <User className='h-5 w-5 text-gray-400' />
                    </div>
                    <input
                      id='name'
                      name='name'
                      type='text'
                      autoComplete='name'
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className='appearance-none relative block w-full pl-10 pr-3 py-3 border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:z-10 bg-white dark:bg-gray-800'
                      placeholder='Full Name'
                    />
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label
                    htmlFor='email'
                    className='sr-only'
                  >
                    Email address
                  </label>
                  <div className='relative'>
                    <div className='absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none'>
                      <Mail className='h-5 w-5 text-gray-400' />
                    </div>
                    <input
                      id='email'
                      name='email'
                      type='email'
                      autoComplete='email'
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className='appearance-none relative block w-full pl-10 pr-3 py-3 border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:z-10 bg-white dark:bg-gray-800'
                      placeholder='Email address'
                    />
                  </div>
                </div>
              </div>

              {/* Error/Success Messages */}
              {error && (
                <div className='bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg text-sm'>
                  {error}
                </div>
              )}

              {success && (
                <div className='bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 px-4 py-3 rounded-lg text-sm'>
                  {success}
                </div>
              )}

              {/* Benefits */}
              <div className='bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4'>
                <h3 className='text-sm font-medium text-blue-800 dark:text-blue-300 mb-2'>
                  What you'll get:
                </h3>
                <ul className='space-y-1 text-xs text-blue-700 dark:text-blue-400'>
                  <li className='flex items-center space-x-2'>
                    <CheckCircle className='h-3 w-3' />
                    <span>Access to expert PTE preparation courses</span>
                  </li>
                  <li className='flex items-center space-x-2'>
                    <CheckCircle className='h-3 w-3' />
                    <span>Mock tests and practice materials</span>
                  </li>
                  <li className='flex items-center space-x-2'>
                    <CheckCircle className='h-3 w-3' />
                    <span>Personalized study plans and progress tracking</span>
                  </li>
                </ul>
              </div>

              {/* Terms and Conditions */}
              <div className='flex items-start'>
                <input
                  id='accept-terms'
                  name='accept-terms'
                  type='checkbox'
                  checked={acceptTerms}
                  onChange={(e) => setAcceptTerms(e.target.checked)}
                  className='h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 mt-1'
                />
                <label
                  htmlFor='accept-terms'
                  className='ml-2 block text-sm text-gray-900 dark:text-gray-300'
                >
                  I agree to the{' '}
                  <a
                    href='#'
                    className='text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300'
                  >
                    Terms and Conditions
                  </a>{' '}
                  and{' '}
                  <a
                    href='#'
                    className='text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300'
                  >
                    Privacy Policy
                  </a>
                </label>
              </div>

              {/* Submit Button */}
              <div>
                <button
                  type='submit'
                  disabled={isLoading}
                  className='group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200'
                >
                  {isLoading ? (
                    <div className='flex items-center space-x-2'>
                      <div className='animate-spin rounded-full h-4 w-4 border-b-2 border-white'></div>
                      <span>Sending verification code...</span>
                    </div>
                  ) : (
                    <div className='flex items-center space-x-2'>
                      <Mail className='h-4 w-4' />
                      <span>Send Verification Code</span>
                    </div>
                  )}
                </button>
              </div>

              {/* Sign In Link */}
              <div className='text-center'>
                <p className='text-sm text-gray-600 dark:text-gray-400'>
                  Already have an account?{' '}
                  <Link
                    to='/login'
                    className='font-medium text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300'
                  >
                    Sign in here
                  </Link>
                </p>
              </div>
            </form>
          </>
        )}

        {/* OTP Verification Step */}
        {step === 'otp' && (
          <>
            {/* Back Button */}
            <button
              onClick={handleBackToDetails}
              className='flex items-center space-x-2 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 mb-4'
            >
              <ArrowLeft className='h-4 w-4' />
              <span>Change details</span>
            </button>

            {/* Security Info */}
            <div className='bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6'>
              <div className='flex items-start space-x-3'>
                <Shield className='h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5' />
                <div>
                  <h3 className='text-sm font-medium text-blue-800 dark:text-blue-300'>
                    Email Verification
                  </h3>
                  <p className='text-xs text-blue-700 dark:text-blue-400 mt-1'>
                    We've sent a 6-digit verification code to your email. This
                    code expires in 10 minutes.
                  </p>
                </div>
              </div>
            </div>

            {/* OTP Form */}
            <form
              className='space-y-6'
              onSubmit={handleVerifyOtp}
            >
              <div>
                <label
                  htmlFor='otp'
                  className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2'
                >
                  Verification Code
                </label>
                <input
                  id='otp'
                  name='otp'
                  type='text'
                  inputMode='numeric'
                  pattern='[0-9]*'
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  className='appearance-none relative block w-full px-3 py-3 border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 text-center text-2xl font-mono tracking-widest'
                  placeholder='000000'
                  autoComplete='one-time-code'
                />
              </div>

              {/* Error Messages */}
              {error && (
                <div className='bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg text-sm'>
                  {error}
                </div>
              )}

              {success && (
                <div className='bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 px-4 py-3 rounded-lg text-sm'>
                  {success}
                </div>
              )}

              {/* Verify Button */}
              <button
                type='submit'
                disabled={isLoading || otp.length !== 6}
                className='group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200'
              >
                {isLoading ? (
                  <div className='flex items-center space-x-2'>
                    <div className='animate-spin rounded-full h-4 w-4 border-b-2 border-white'></div>
                    <span>Creating account...</span>
                  </div>
                ) : (
                  'Verify & Create Account'
                )}
              </button>

              {/* Resend OTP */}
              <div className='text-center'>
                <p className='text-sm text-gray-600 dark:text-gray-400 mb-2'>
                  Didn't receive the code?
                </p>
                <button
                  type='button'
                  onClick={handleResendOtp}
                  disabled={countdown > 0}
                  className='text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300 disabled:opacity-50 disabled:cursor-not-allowed'
                >
                  {countdown > 0 ? (
                    <div className='flex items-center justify-center space-x-1'>
                      <Clock className='h-4 w-4' />
                      <span>Resend in {countdown}s</span>
                    </div>
                  ) : (
                    'Resend Code'
                  )}
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
};

export default Register;
