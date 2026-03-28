import React from 'react';

const faqs = [
  {
    question: 'How do I start learning after purchasing a course?',
    answer:
      'Once your payment is confirmed, the course becomes available in your account dashboard where you can open lessons, track progress, and continue from where you left off.',
  },
  {
    question: 'Can I practice individual PTE question types on the platform?',
    answer:
      'Yes. The platform includes focused practice flows for multiple PTE tasks so you can strengthen weak areas without repeating an entire mock test.',
  },
  {
    question:
      'What should I do if I cannot access a course I already paid for?',
    answer:
      'First refresh your dashboard and sign in again. If access still does not appear, contact support with your registered email address and payment details so we can verify it quickly.',
  },
  {
    question:
      'Do I need special equipment for speaking and listening practice?',
    answer:
      'A stable internet connection, an updated browser, and a working microphone are the main requirements. Headphones are recommended for more accurate listening and recording practice.',
  },
  {
    question: 'Can I study on mobile as well as desktop?',
    answer:
      'Yes. The site is designed to work across devices, though desktop or laptop is usually more comfortable for long sessions, writing tasks, and audio practice.',
  },
  {
    question:
      'Where can I ask questions about the right course for my target score?',
    answer:
      'Use the Contact Support page if you want help choosing the best study path based on your current level, target score, and test timeline.',
  },
];

const FAQ: React.FC = () => {
  return (
    <div className='min-h-screen bg-gray-50 dark:bg-gray-900'>
      <section className='bg-gradient-to-r from-blue-600 via-blue-700 to-purple-600 text-white py-10'>
        <div className='container mx-auto px-4 text-center'>
          <h1 className='mt-6 text-4xl font-bold'>
            Frequently Asked Questions
          </h1>
          <p className='mt-4 max-w-2xl mx-auto text-blue-100 text-lg'>
            Find quick answers to the most common questions about courses,
            access, payments, and practice.
          </p>
        </div>
      </section>

      <section className='py-16'>
        <div className='container mx-auto px-4 max-w-4xl'>
          <div className='space-y-4'>
            {faqs.map((item) => (
              <article
                key={item.question}
                className='bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6'
              >
                <h2 className='text-xl font-semibold text-gray-900 dark:text-white'>
                  {item.question}
                </h2>
                <p className='mt-3 text-gray-600 dark:text-gray-300 leading-relaxed'>
                  {item.answer}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default FAQ;
