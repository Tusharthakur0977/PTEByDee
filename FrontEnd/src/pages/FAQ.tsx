import React from 'react';
import { HelpCircle, MessageSquare, ShieldCheck } from 'lucide-react';

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
    question: 'What should I do if I cannot access a course I already paid for?',
    answer:
      'First refresh your dashboard and sign in again. If access still does not appear, contact support with your registered email address and payment details so we can verify it quickly.',
  },
  {
    question: 'Do I need special equipment for speaking and listening practice?',
    answer:
      'A stable internet connection, an updated browser, and a working microphone are the main requirements. Headphones are recommended for more accurate listening and recording practice.',
  },
  {
    question: 'Can I study on mobile as well as desktop?',
    answer:
      'Yes. The site is designed to work across devices, though desktop or laptop is usually more comfortable for long sessions, writing tasks, and audio practice.',
  },
  {
    question: 'Where can I ask questions about the right course for my target score?',
    answer:
      'Use the Contact Support page if you want help choosing the best study path based on your current level, target score, and test timeline.',
  },
];

const FAQ: React.FC = () => {
  return (
    <div className='min-h-screen bg-slate-50 dark:bg-slate-950'>
      <section className='relative overflow-hidden border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950'>
        <div className='absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.10),_transparent_28%),radial-gradient(circle_at_80%_10%,_rgba(16,185,129,0.10),_transparent_22%)] dark:bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.16),_transparent_28%),radial-gradient(circle_at_80%_10%,_rgba(16,185,129,0.12),_transparent_22%)]' />
        <div className='container relative mx-auto px-5 py-14 sm:px-6 lg:px-8'>
          <div className='max-w-3xl'>
            <div className='inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700 dark:border-blue-500/20 dark:bg-blue-400/10 dark:text-blue-300'>
              <HelpCircle className='h-4 w-4' />
              <span>Support FAQ</span>
            </div>
            <h1 className='mt-5 text-4xl font-semibold leading-[1.12] tracking-tight text-slate-900 dark:text-white sm:text-[3.1rem]'>
              Quick answers for the most common learner questions
            </h1>
            <p className='mt-5 max-w-2xl text-base leading-8 text-slate-600 dark:text-slate-300 sm:text-lg'>
              Find simple guidance about access, study flow, payments, and
              support so you can get back to preparation faster.
            </p>
          </div>
        </div>
      </section>

      <section className='py-14 sm:py-16'>
        <div className='container mx-auto px-5 sm:px-6 lg:px-8'>
          <div className='mx-auto mb-8 grid max-w-5xl gap-4 sm:grid-cols-3'>
            <div className='rounded-2xl border border-slate-200 bg-white px-5 py-5 shadow-sm dark:border-slate-800 dark:bg-slate-900'>
              <MessageSquare className='h-5 w-5 text-blue-600 dark:text-blue-300' />
              <p className='mt-3 text-sm font-medium text-slate-900 dark:text-slate-100'>
                Clear guidance
              </p>
              <p className='mt-1 text-sm leading-6 text-slate-500 dark:text-slate-400'>
                Get quick answers without needing to contact support first.
              </p>
            </div>
            <div className='rounded-2xl border border-slate-200 bg-white px-5 py-5 shadow-sm dark:border-slate-800 dark:bg-slate-900'>
              <ShieldCheck className='h-5 w-5 text-emerald-600 dark:text-emerald-300' />
              <p className='mt-3 text-sm font-medium text-slate-900 dark:text-slate-100'>
                Platform help
              </p>
              <p className='mt-1 text-sm leading-6 text-slate-500 dark:text-slate-400'>
                Covers access, study requirements, and common account issues.
              </p>
            </div>
            <div className='rounded-2xl border border-slate-200 bg-white px-5 py-5 shadow-sm dark:border-slate-800 dark:bg-slate-900'>
              <HelpCircle className='h-5 w-5 text-slate-700 dark:text-slate-300' />
              <p className='mt-3 text-sm font-medium text-slate-900 dark:text-slate-100'>
                Simple reference
              </p>
              <p className='mt-1 text-sm leading-6 text-slate-500 dark:text-slate-400'>
                Written to be easy to scan before you submit a support request.
              </p>
            </div>
          </div>

          <div className='mx-auto max-w-5xl space-y-4'>
            {faqs.map((item, index) => (
              <article
                key={item.question}
                className='rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900'
              >
                <div className='flex items-start gap-4'>
                  <div className='flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-sm font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-200'>
                    {index + 1}
                  </div>
                  <div>
                    <h2 className='text-lg font-semibold text-slate-900 dark:text-white sm:text-xl'>
                      {item.question}
                    </h2>
                    <p className='mt-3 text-sm leading-7 text-slate-600 dark:text-slate-300'>
                      {item.answer}
                    </p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default FAQ;
