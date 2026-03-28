import React from 'react';
import { Clock3, LifeBuoy, Mail, MessageSquareText } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { submitSupportTicket } from '../services/support';

const ContactSupport: React.FC = () => {
  const { user } = useAuth();
  const [formData, setFormData] = React.useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState('');
  const [successMessage, setSuccessMessage] = React.useState('');
  const [ticketNumber, setTicketNumber] = React.useState('');

  React.useEffect(() => {
    if (!user) return;

    setFormData((current) => ({
      ...current,
      name: current.name || user.name || '',
      email: current.email || user.email || '',
    }));
  }, [user]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    setTicketNumber('');

    const trimmedData = {
      name: formData.name.trim(),
      email: formData.email.trim(),
      subject: formData.subject.trim(),
      message: formData.message.trim(),
    };

    if (
      !trimmedData.name ||
      !trimmedData.email ||
      !trimmedData.subject ||
      !trimmedData.message
    ) {
      setError('Please fill in all fields before submitting.');
      return;
    }

    if (trimmedData.message.length < 20) {
      setError('Please enter at least 20 characters in your message.');
      return;
    }

    try {
      setIsSubmitting(true);
      const response = await submitSupportTicket(trimmedData);
      setSuccessMessage(response.message);
      setTicketNumber(response.data.ticketNumber);
      setFormData((current) => ({
        ...current,
        subject: '',
        message: '',
      }));
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
          'We could not submit your request right now. Please try again.',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className='min-h-screen bg-slate-50 dark:bg-slate-950'>
      <section className='relative overflow-hidden border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950'>
        <div className='absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.10),_transparent_28%),radial-gradient(circle_at_80%_10%,_rgba(16,185,129,0.10),_transparent_22%)] dark:bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.16),_transparent_28%),radial-gradient(circle_at_80%_10%,_rgba(16,185,129,0.12),_transparent_22%)]' />
        <div className='container relative mx-auto px-5 py-14 sm:px-6 lg:px-8'>
          <div className='grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-center'>
            <div className='max-w-3xl'>
              <div className='inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700 dark:border-blue-500/20 dark:bg-blue-400/10 dark:text-blue-300'>
                <LifeBuoy className='h-4 w-4' />
                <span>Contact Support</span>
              </div>
              <h1 className='mt-5 text-4xl font-semibold leading-[1.12] tracking-tight text-slate-900 dark:text-white sm:text-[3.1rem]'>
                Get help with access, payments, or your learning journey
              </h1>
              <p className='mt-5 max-w-2xl text-base leading-8 text-slate-600 dark:text-slate-300 sm:text-lg'>
                Send us a support request and we&apos;ll review it as soon as
                possible. Use the form for account issues, course access, or
                guidance about the right study path.
              </p>
            </div>

            <div className='rounded-[28px] border border-slate-200 bg-white p-4 shadow-xl dark:border-slate-800 dark:bg-slate-900'>
              <div className='rounded-[24px] border border-slate-200 bg-slate-950 p-6 text-white dark:border-slate-800 dark:bg-slate-900'>
                <p className='text-xs uppercase tracking-[0.22em] text-slate-400'>
                  Support flow
                </p>
                <div className='mt-5 space-y-3'>
                  <div className='rounded-2xl border border-white/10 bg-white/5 p-4'>
                    <p className='text-sm font-medium text-white'>Send your request</p>
                    <p className='mt-1 text-sm leading-6 text-slate-300'>
                      Share your issue with enough detail for us to check it properly.
                    </p>
                  </div>
                  <div className='rounded-2xl border border-white/10 bg-white/5 p-4'>
                    <p className='text-sm font-medium text-white'>We review the ticket</p>
                    <p className='mt-1 text-sm leading-6 text-slate-300'>
                      Your message is stored in the support system for tracking.
                    </p>
                  </div>
                  <div className='rounded-2xl border border-white/10 bg-white/5 p-4'>
                    <p className='text-sm font-medium text-white'>You receive updates</p>
                    <p className='mt-1 text-sm leading-6 text-slate-300'>
                      We can update you when the ticket is resolved or closed.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className='py-14 sm:py-16'>
        <div className='container mx-auto px-5 sm:px-6 lg:px-8'>
          <div className='mx-auto grid max-w-6xl gap-8 lg:grid-cols-[1.1fr_0.7fr]'>
            <div className='rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-8'>
              <h2 className='text-2xl font-semibold text-slate-900 dark:text-white'>
                Send us a message
              </h2>
              <p className='mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400'>
                Please include the email used on your account and enough context
                for us to investigate quickly.
              </p>

              <form
                className='mt-8 space-y-5'
                onSubmit={handleSubmit}
              >
                <div className='grid grid-cols-1 gap-5 md:grid-cols-2'>
                  <div>
                    <label
                      htmlFor='name'
                      className='mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300'
                    >
                      Full name
                    </label>
                    <input
                      id='name'
                      name='name'
                      type='text'
                      placeholder='Enter your name'
                      value={formData.name}
                      onChange={handleChange}
                      className='w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:focus:border-slate-300 dark:focus:ring-slate-100/10'
                      required
                    />
                  </div>
                  <div>
                    <label
                      htmlFor='email'
                      className='mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300'
                    >
                      Email address
                    </label>
                    <input
                      id='email'
                      name='email'
                      type='email'
                      placeholder='Enter your email'
                      value={formData.email}
                      onChange={handleChange}
                      className='w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:focus:border-slate-300 dark:focus:ring-slate-100/10'
                      required
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor='subject'
                    className='mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300'
                  >
                    Subject
                  </label>
                  <input
                    id='subject'
                    name='subject'
                    type='text'
                    placeholder='What do you need help with?'
                    value={formData.subject}
                    onChange={handleChange}
                    className='w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:focus:border-slate-300 dark:focus:ring-slate-100/10'
                    required
                  />
                </div>

                <div>
                  <label
                    htmlFor='message'
                    className='mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300'
                  >
                    Message
                  </label>
                  <textarea
                    id='message'
                    name='message'
                    rows={6}
                    placeholder='Write your message here'
                    value={formData.message}
                    onChange={handleChange}
                    className='w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:focus:border-slate-300 dark:focus:ring-slate-100/10'
                    required
                  />
                </div>

                {error && (
                  <div className='rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-300'>
                    {error}
                  </div>
                )}

                {successMessage && (
                  <div className='rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-950/30 dark:text-emerald-300'>
                    <p>{successMessage}</p>
                    {ticketNumber && (
                      <p className='mt-1 font-semibold'>Reference: {ticketNumber}</p>
                    )}
                  </div>
                )}

                <button
                  type='submit'
                  disabled={isSubmitting}
                  className='inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-900 px-6 py-3.5 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200'
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Request'}
                </button>
              </form>
            </div>

            <div className='space-y-5'>
              <div className='rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900'>
                <div className='inline-flex rounded-2xl bg-blue-50 p-3 text-blue-600 dark:bg-blue-500/10 dark:text-blue-300'>
                  <Clock3 className='h-5 w-5' />
                </div>
                <h3 className='mt-4 text-lg font-semibold text-slate-900 dark:text-white'>
                  Response time
                </h3>
                <p className='mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300'>
                  We usually reply within 24 hours on business days.
                </p>
              </div>

              <div className='rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900'>
                <div className='inline-flex rounded-2xl bg-emerald-50 p-3 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-300'>
                  <Mail className='h-5 w-5' />
                </div>
                <h3 className='mt-4 text-lg font-semibold text-slate-900 dark:text-white'>
                  Best when contacting us
                </h3>
                <p className='mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300'>
                  Include your registered email, course or payment details, and a
                  short explanation of what happened.
                </p>
              </div>

              <div className='rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900'>
                <div className='inline-flex rounded-2xl bg-slate-100 p-3 text-slate-700 dark:bg-slate-800 dark:text-slate-300'>
                  <MessageSquareText className='h-5 w-5' />
                </div>
                <h3 className='mt-4 text-lg font-semibold text-slate-900 dark:text-white'>
                  Ticket tracking
                </h3>
                <p className='mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300'>
                  After submission, your request receives a reference number for
                  follow-up and admin review.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default ContactSupport;
