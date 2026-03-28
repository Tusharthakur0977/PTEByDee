import { ArrowRight, BookOpen, Mail, Phone } from 'lucide-react';
import React from 'react';
import { Link } from 'react-router-dom';

const Footer: React.FC = () => {
  const quickLinks = [
    { label: 'Home', to: '/' },
    { label: 'Courses', to: '/courses' },
    { label: 'About', to: '/about' },
    { label: 'Portal', to: '/portal' },
  ];

  const supportLinks = [
    { label: 'Contact Support', to: '/contact-support' },
    { label: 'FAQ', to: '/faq' },
    { label: 'Privacy Policy', to: '/privacy-policy' },
  ];

  return (
    <footer className='border-t border-slate-200 bg-slate-100 dark:border-slate-800 dark:bg-slate-950'>
      <div className='container mx-auto px-4 py-14'>
        <div className='grid gap-10 lg:grid-cols-[1.2fr_0.8fr_0.8fr]'>
          <div>
            <div className='flex items-center space-x-3 text-2xl font-semibold text-slate-950 dark:text-white'>
              <div className='flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-900 text-white dark:bg-white dark:text-slate-900'>
                <BookOpen className='h-5 w-5' />
              </div>
              <span>PTEbyDee</span>
            </div>

            <p className='mt-5 max-w-xl text-sm leading-7 text-slate-600 dark:text-slate-300'>
              A focused PTE preparation platform built to help learners study with
              more clarity, stronger structure, and a more professional learning
              experience.
            </p>

            <div className='mt-6 flex flex-wrap gap-3'>
              <Link
                to='/courses'
                className='inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100'
              >
                <span>Explore Courses</span>
                <ArrowRight className='h-4 w-4' />
              </Link>
              <Link
                to='/contact-support'
                className='inline-flex items-center gap-2 rounded-xl border border-slate-300 px-5 py-3 text-sm font-medium text-slate-700 transition-colors hover:bg-white dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-900'
              >
                <span>Contact Support</span>
              </Link>
            </div>

            <div className='mt-8 space-y-3'>
              <div className='flex items-center gap-3 text-sm text-slate-600 dark:text-slate-300'>
                <Mail className='h-4 w-4 text-blue-600 dark:text-blue-300' />
                <span>ptebydee@gmail.com</span>
              </div>
              <div className='flex items-center gap-3 text-sm text-slate-600 dark:text-slate-300'>
                <Phone className='h-4 w-4 text-emerald-600 dark:text-emerald-300' />
                <span>+61 420370334</span>
              </div>
            </div>
          </div>

          <div>
            <h3 className='text-sm font-semibold uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400'>
              Quick Links
            </h3>
            <ul className='mt-5 space-y-3'>
              {quickLinks.map((link) => (
                <li key={link.to}>
                  <Link
                    to={link.to}
                    className='text-sm text-slate-600 transition-colors hover:text-slate-950 dark:text-slate-300 dark:hover:text-white'
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className='text-sm font-semibold uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400'>
              Support
            </h3>
            <ul className='mt-5 space-y-3'>
              {supportLinks.map((link) => (
                <li key={link.to}>
                  <Link
                    to={link.to}
                    className='text-sm text-slate-600 transition-colors hover:text-slate-950 dark:text-slate-300 dark:hover:text-white'
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className='mt-12 border-t border-slate-200 pt-6 dark:border-slate-800'>
          <p className='text-center text-sm text-slate-500 dark:text-slate-400'>
            © 2026 PTEbyDee. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
