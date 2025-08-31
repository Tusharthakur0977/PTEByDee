import React from 'react';
import { BookOpen, Mail, Phone, MapPin } from 'lucide-react';

const Footer: React.FC = () => {
  return (
    <footer className='bg-gray-900 text-white'>
      <div className='container mx-auto px-4 py-12'>
        <div className='grid grid-cols-1 md:grid-cols-4 gap-8'>
          {/* Logo and Description */}
          <div className='col-span-1 md:col-span-2'>
            <div className='flex items-center space-x-2 text-2xl font-bold text-blue-400 mb-4'>
              <BookOpen className='h-8 w-8' />
              <span>PTEbyDee</span>
            </div>
            <p className='text-gray-300 mb-6 max-w-md'>
              Your trusted partner in PTE Academic preparation. Expert
              instruction, comprehensive materials, and proven strategies to
              help you achieve your target score.
            </p>
            <div className='space-y-2'>
              <div className='flex items-center space-x-2 text-gray-300'>
                <Mail className='h-4 w-4' />
                <span>info@ptemaster.com</span>
              </div>
              <div className='flex items-center space-x-2 text-gray-300'>
                <Phone className='h-4 w-4' />
                <span>+1 (555) 123-4567</span>
              </div>
              <div className='flex items-center space-x-2 text-gray-300'>
                <MapPin className='h-4 w-4' />
                <span>123 Education St, Learning City, LC 12345</span>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className='text-lg font-semibold mb-4'>Quick Links</h3>
            <ul className='space-y-2'>
              <li>
                <a
                  href='/'
                  className='text-gray-300 hover:text-blue-400 transition-colors duration-200'
                >
                  Home
                </a>
              </li>
              <li>
                <a
                  href='/courses'
                  className='text-gray-300 hover:text-blue-400 transition-colors duration-200'
                >
                  Courses
                </a>
              </li>
              <li>
                <a
                  href='/about'
                  className='text-gray-300 hover:text-blue-400 transition-colors duration-200'
                >
                  About
                </a>
              </li>
              <li>
                <a
                  href='/login'
                  className='text-gray-300 hover:text-blue-400 transition-colors duration-200'
                >
                  Login
                </a>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className='text-lg font-semibold mb-4'>Support</h3>
            <ul className='space-y-2'>
              <li>
                <a
                  href='#'
                  className='text-gray-300 hover:text-blue-400 transition-colors duration-200'
                >
                  Help Center
                </a>
              </li>
              <li>
                <a
                  href='#'
                  className='text-gray-300 hover:text-blue-400 transition-colors duration-200'
                >
                  Contact Support
                </a>
              </li>
              <li>
                <a
                  href='#'
                  className='text-gray-300 hover:text-blue-400 transition-colors duration-200'
                >
                  FAQ
                </a>
              </li>
              <li>
                <a
                  href='#'
                  className='text-gray-300 hover:text-blue-400 transition-colors duration-200'
                >
                  Privacy Policy
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className='border-t border-gray-700 mt-8 pt-8 text-center'>
          <p className='text-gray-300'>
            © 2024 PTEbyDee. All rights reserved. Built with passion for PTE
            success.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
