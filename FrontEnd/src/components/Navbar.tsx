import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Moon, Sun, Menu, X, BookOpen, User, LogOut } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';

const Navbar: React.FC = () => {
  const { isDarkMode, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const isActive = (path: string) => location.pathname === path;

  const handleLogout = () => {
    logout();
    setIsMenuOpen(false);
  };

  return (
    <nav className='bg-white dark:bg-gray-900 shadow-lg sticky top-0 z-50 transition-colors duration-300'>
      <div className='container mx-auto px-4'>
        <div className='flex justify-between items-center h-16'>
          {/* Logo */}
          <Link
            to='/'
            className='flex items-center space-x-2 text-2xl font-bold text-blue-600 dark:text-blue-400'
          >
            <BookOpen className='h-8 w-8' />
            <span>PTEbyDee</span>
          </Link>

          {/* Desktop Navigation */}
          <div className='hidden md:flex items-center space-x-8'>
            <Link
              to='/'
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
                isActive('/')
                  ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20'
                  : 'text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400'
              }`}
            >
              Home
            </Link>
            <Link
              to='/courses'
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
                isActive('/courses')
                  ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20'
                  : 'text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400'
              }`}
            >
              Courses
            </Link>
            <Link
              to='/about'
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
                isActive('/about')
                  ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20'
                  : 'text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400'
              }`}
            >
              About
            </Link>
            {user && (
              <Link
                to='/portal'
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
                  isActive('/portal')
                    ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20'
                    : 'text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400'
                }`}
              >
                Portal
              </Link>
            )}
          </div>

          {/* Right side buttons */}
          <div className='hidden md:flex items-center space-x-4'>
            <button
              onClick={toggleTheme}
              className='p-2 rounded-md text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-200'
            >
              {isDarkMode ? (
                <Sun className='h-5 w-5' />
              ) : (
                <Moon className='h-5 w-5' />
              )}
            </button>

            {user ? (
              <div className='flex items-center space-x-3'>
                <Link
                  to='/dashboard'
                  className={`flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
                    isActive('/dashboard')
                      ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20'
                      : 'text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400'
                  }`}
                >
                  <User className='h-4 w-4' />
                  <span>Dashboard</span>
                </Link>
                <button
                  onClick={handleLogout}
                  className='flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400 transition-colors duration-200'
                >
                  <LogOut className='h-4 w-4' />
                  <span>Logout</span>
                </button>
              </div>
            ) : (
              <div className='flex items-center space-x-3'>
                <Link
                  to='/login'
                  className='px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-200'
                >
                  Login
                </Link>
                <Link
                  to='/register'
                  className='px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors duration-200'
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className='md:hidden flex items-center space-x-2'>
            <button
              onClick={toggleTheme}
              className='p-2 rounded-md text-gray-700 dark:text-gray-300'
            >
              {isDarkMode ? (
                <Sun className='h-5 w-5' />
              ) : (
                <Moon className='h-5 w-5' />
              )}
            </button>
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className='p-2 rounded-md text-gray-700 dark:text-gray-300'
            >
              {isMenuOpen ? (
                <X className='h-6 w-6' />
              ) : (
                <Menu className='h-6 w-6' />
              )}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {isMenuOpen && (
          <div className='md:hidden'>
            <div className='px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-white dark:bg-gray-900 border-t dark:border-gray-700'>
              <Link
                to='/'
                className='block px-3 py-2 rounded-md text-base font-medium text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400'
                onClick={() => setIsMenuOpen(false)}
              >
                Home
              </Link>
              <Link
                to='/courses'
                className='block px-3 py-2 rounded-md text-base font-medium text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400'
                onClick={() => setIsMenuOpen(false)}
              >
                Courses
              </Link>
              <Link
                to='/about'
                className='block px-3 py-2 rounded-md text-base font-medium text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400'
                onClick={() => setIsMenuOpen(false)}
              >
                About
              </Link>
              {user && (
                <Link
                  to='/portal'
                  className='block px-3 py-2 rounded-md text-base font-medium text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400'
                  onClick={() => setIsMenuOpen(false)}
                >
                  Portal
                </Link>
              )}
              {user ? (
                <>
                  <Link
                    to='/dashboard'
                    className='block px-3 py-2 rounded-md text-base font-medium text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400'
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Dashboard
                  </Link>
                  <button
                    onClick={handleLogout}
                    className='block w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-700 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400'
                  >
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to='/login'
                    className='block px-3 py-2 rounded-md text-base font-medium text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400'
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Login
                  </Link>
                  <Link
                    to='/register'
                    className='block px-3 py-2 rounded-md text-base font-medium text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400'
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Sign Up
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
