import React from 'react';
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
    <div className='min-h-screen bg-gray-50 dark:bg-gray-900'>
      <section className='bg-gradient-to-r from-blue-600 via-blue-700 to-purple-600 text-white py-10'>
        <div className='container mx-auto px-4 text-center'>
          <h1 className='mt-6 text-4xl font-bold'>We are here to help</h1>
          <p className='mt-4 max-w-2xl mx-auto text-blue-100 text-lg'>
            Fill out the form below and our team will get back to you as soon as
            possible.
          </p>
        </div>
      </section>

      <section className='py-16'>
        <div className='container mx-auto px-4'>
          <div className='grid gap-8 max-w-6xl mx-auto'>
            <div className='lg:col-span-2 bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8'>
              <h2 className='text-2xl font-bold text-gray-900 dark:text-white mb-6'>
                Send Us a Message
              </h2>

              <form
                className='space-y-5'
                onSubmit={handleSubmit}
              >
                <div className='grid grid-cols-1 md:grid-cols-2 gap-5'>
                  <div>
                    <label
                      htmlFor='name'
                      className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2'
                    >
                      Full Name
                    </label>
                    <input
                      id='name'
                      name='name'
                      type='text'
                      placeholder='Enter your name'
                      value={formData.name}
                      onChange={handleChange}
                      className='w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-3 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500'
                      required
                    />
                  </div>
                  <div>
                    <label
                      htmlFor='email'
                      className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2'
                    >
                      Email Address
                    </label>
                    <input
                      id='email'
                      name='email'
                      type='email'
                      placeholder='Enter your email'
                      value={formData.email}
                      onChange={handleChange}
                      className='w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-3 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500'
                      required
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor='subject'
                    className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2'
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
                    className='w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-3 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500'
                    required
                  />
                </div>

                <div>
                  <label
                    htmlFor='message'
                    className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2'
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
                    className='w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-3 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500'
                    required
                  />
                </div>

                {error && (
                  <div className='rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-300'>
                    {error}
                  </div>
                )}

                {successMessage && (
                  <div className='rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700 dark:border-green-800 dark:bg-green-900/20 dark:text-green-300'>
                    <p>{successMessage}</p>
                    {ticketNumber && (
                      <p className='mt-1 font-semibold'>
                        Reference: {ticketNumber}
                      </p>
                    )}
                  </div>
                )}

                <button
                  type='submit'
                  disabled={isSubmitting}
                  className='bg-blue-600 hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70 text-white font-semibold px-6 py-3 rounded-lg transition-colors duration-200'
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Request'}
                </button>
              </form>

              <div className='bg-blue-50 dark:bg-blue-900/20 rounded-2xl p-6 border border-blue-100 dark:border-blue-800 mt-6'>
                <h3 className='text-lg font-semibold text-gray-900 dark:text-white mb-3'>
                  Response Time
                </h3>
                <p className='text-gray-600 dark:text-gray-300'>
                  We usually reply within 24 hours on business days.
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
