import React from 'react';

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
    <div className='min-h-screen bg-gray-50 dark:bg-gray-900'>
      <section className='bg-gradient-to-r from-blue-600 via-blue-700 to-purple-600 text-white py-10'>
        <div className='container mx-auto px-4 text-center'>
          <h1 className=' text-4xl font-bold'>Privacy Policy</h1>
          <p className='mt-4 max-w-3xl mx-auto text-blue-100 text-lg'>
            This Privacy Policy explains how we collect, use, protect, and
            manage your personal information when you use our platform.
          </p>
        </div>
      </section>

      <section className='py-16'>
        <div className='container mx-auto px-4 max-w-5xl'>
          <div className='bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 space-y-6'>
            <p className='text-gray-600 dark:text-gray-300 leading-relaxed'>
              By using PTEbyDee, you agree to the collection and use of
              information in accordance with this policy. We are committed to
              protecting your privacy and keeping your data secure.
            </p>

            {policySections.map((section) => (
              <div key={section.title}>
                <h2 className='text-xl font-semibold text-gray-900 dark:text-white'>
                  {section.title}
                </h2>
                <p className='mt-2 text-gray-600 dark:text-gray-300 leading-relaxed'>
                  {section.body}
                </p>
              </div>
            ))}

            <div>
              <h2 className='text-xl font-semibold text-gray-900 dark:text-white'>
                Contact us
              </h2>
              <p className='mt-2 text-gray-600 dark:text-gray-300 leading-relaxed'>
                If you have any questions about this Privacy Policy, please
                contact us at ptebydee@gmail.com.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default PrivacyPolicy;
