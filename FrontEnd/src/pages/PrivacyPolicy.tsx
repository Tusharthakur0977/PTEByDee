import React from 'react';
import { Lock, Shield, UserCheck } from 'lucide-react';

const policySections = [
  {
    title: 'Information we collect',
    body: 'We may collect account details you provide during registration, course activity data, support conversations, and payment-related information required to process purchases securely.',
  },
  {
    title: 'How we use your information',
    body: 'Your information helps us deliver course access, support your learning experience, improve the platform, process payments, and communicate important service updates.',
  },
  {
    title: 'How we protect your data',
    body: 'We use reasonable administrative and technical safeguards to protect your personal information and restrict access to only those who need it to operate the service.',
  },
  {
    title: 'Sharing with third parties',
    body: 'We may work with trusted service providers for payments, hosting, analytics, and support operations. These providers only receive the information needed to perform their services.',
  },
  {
    title: 'Your choices',
    body: 'You can contact us to update account details, request support with your stored information, or ask questions about how your data is handled on the platform.',
  },
  {
    title: 'Policy updates',
    body: 'We may update this privacy policy from time to time to reflect platform changes, legal obligations, or improved data practices. Continued use of the platform means you accept the updated policy.',
  },
];

const PrivacyPolicy: React.FC = () => {
  return (
    <div className='min-h-screen bg-slate-50 dark:bg-slate-950'>
      <section className='relative overflow-hidden border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950'>
        <div className='absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.10),_transparent_28%),radial-gradient(circle_at_80%_10%,_rgba(16,185,129,0.10),_transparent_22%)] dark:bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.16),_transparent_28%),radial-gradient(circle_at_80%_10%,_rgba(16,185,129,0.12),_transparent_22%)]' />
        <div className='container relative mx-auto px-5 py-14 sm:px-6 lg:px-8'>
          <div className='max-w-3xl'>
            <div className='inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700 dark:border-blue-500/20 dark:bg-blue-400/10 dark:text-blue-300'>
              <Lock className='h-4 w-4' />
              <span>Privacy Policy</span>
            </div>
            <h1 className='mt-5 text-4xl font-semibold leading-[1.12] tracking-tight text-slate-900 dark:text-white sm:text-[3.1rem]'>
              How we collect, use, and protect your information
            </h1>
            <p className='mt-5 max-w-2xl text-base leading-8 text-slate-600 dark:text-slate-300 sm:text-lg'>
              This policy explains the basic information practices used on the
              platform when you register, study, make purchases, or contact support.
            </p>
          </div>
        </div>
      </section>

      <section className='py-14 sm:py-16'>
        <div className='container mx-auto px-5 sm:px-6 lg:px-8'>
          <div className='mx-auto mb-8 grid max-w-5xl gap-4 sm:grid-cols-3'>
            <div className='rounded-2xl border border-slate-200 bg-white px-5 py-5 shadow-sm dark:border-slate-800 dark:bg-slate-900'>
              <Shield className='h-5 w-5 text-blue-600 dark:text-blue-300' />
              <p className='mt-3 text-sm font-medium text-slate-900 dark:text-slate-100'>
                Data protection
              </p>
              <p className='mt-1 text-sm leading-6 text-slate-500 dark:text-slate-400'>
                We use reasonable safeguards to protect personal information.
              </p>
            </div>
            <div className='rounded-2xl border border-slate-200 bg-white px-5 py-5 shadow-sm dark:border-slate-800 dark:bg-slate-900'>
              <UserCheck className='h-5 w-5 text-emerald-600 dark:text-emerald-300' />
              <p className='mt-3 text-sm font-medium text-slate-900 dark:text-slate-100'>
                Limited use
              </p>
              <p className='mt-1 text-sm leading-6 text-slate-500 dark:text-slate-400'>
                Information is used to run the service, support learning, and process payments.
              </p>
            </div>
            <div className='rounded-2xl border border-slate-200 bg-white px-5 py-5 shadow-sm dark:border-slate-800 dark:bg-slate-900'>
              <Lock className='h-5 w-5 text-slate-700 dark:text-slate-300' />
              <p className='mt-3 text-sm font-medium text-slate-900 dark:text-slate-100'>
                Transparent policy
              </p>
              <p className='mt-1 text-sm leading-6 text-slate-500 dark:text-slate-400'>
                This page is meant to explain our core privacy handling clearly.
              </p>
            </div>
          </div>

          <div className='mx-auto max-w-5xl rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-8'>
            <p className='text-sm leading-7 text-slate-600 dark:text-slate-300'>
              By using PTEbyDee, you agree to the collection and use of
              information in accordance with this policy. We are committed to
              protecting your privacy and keeping your data secure.
            </p>

            <div className='mt-8 space-y-6'>
              {policySections.map((section) => (
                <div
                  key={section.title}
                  className='rounded-2xl border border-slate-200 bg-slate-50 px-5 py-5 dark:border-slate-800 dark:bg-slate-950'
                >
                  <h2 className='text-lg font-semibold text-slate-900 dark:text-white sm:text-xl'>
                    {section.title}
                  </h2>
                  <p className='mt-3 text-sm leading-7 text-slate-600 dark:text-slate-300'>
                    {section.body}
                  </p>
                </div>
              ))}

              <div className='rounded-2xl border border-slate-200 bg-slate-50 px-5 py-5 dark:border-slate-800 dark:bg-slate-950'>
                <h2 className='text-lg font-semibold text-slate-900 dark:text-white sm:text-xl'>
                  Contact us
                </h2>
                <p className='mt-3 text-sm leading-7 text-slate-600 dark:text-slate-300'>
                  If you have any questions about this Privacy Policy, please
                  contact us at ptebydee@gmail.com.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default PrivacyPolicy;
