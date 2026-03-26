import React, { useEffect, useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Moon, Sun, Menu, X, BookOpen, User, LogOut } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { getQuestionTypes } from '../services/portal';
import { PteQuestionTypeName } from '../types/pte';
import { getPracticePagePath } from '../utils/questionTypeToSlug';

const Navbar: React.FC = () => {
  const { isDarkMode, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isPortalMenuOpen, setIsPortalMenuOpen] = useState(false);
  const [groupedQuestionTypes, setGroupedQuestionTypes] = useState<
    Record<
      string,
      {
        section: { id: string; name: string; description?: string };
        questionTypes: Array<{ id: string; name: string }>;
      }
    >
  >({});

  const isActive = (path: string) => location.pathname === path;

  useEffect(() => {
    const loadQuestionTypes = async () => {
      try {
        const data = await getQuestionTypes();
        setGroupedQuestionTypes(data.groupedBySection || {});
      } catch (error) {
        console.error('Failed to load question types for navigation:', error);
      }
    };

    if (user) {
      loadQuestionTypes();
    }
  }, [user]);

  const sectionOrder = ['Speaking', 'Writing', 'Reading', 'Listening'];

  const questionTypeLabelMap: Partial<Record<PteQuestionTypeName, string>> = {
    READ_ALOUD: 'Read Aloud',
    REPEAT_SENTENCE: 'Repeat Sentence',
    DESCRIBE_IMAGE: 'Describe Image',
    RE_TELL_LECTURE: 'Retell Lecture',
    ANSWER_SHORT_QUESTION: 'Answer Short Question',
    SUMMARIZE_GROUP_DISCUSSION: 'Summarize Group Discussion',
    RESPOND_TO_A_SITUATION: 'Respond to a Situation',

    SUMMARIZE_WRITTEN_TEXT: 'Summarize Written Text',
    WRITE_ESSAY: 'Write Essay',

    FILL_IN_THE_BLANKS_DRAG_AND_DROP: 'Fill in the Blanks (Drag and Drop)',
    MULTIPLE_CHOICE_MULTIPLE_ANSWERS_READING: 'Multiple Choice (Multiple)',
    RE_ORDER_PARAGRAPHS: 'Reorder Paragraph',
    READING_FILL_IN_THE_BLANKS: 'Fill in the Blanks (Dropdown)',
    MULTIPLE_CHOICE_SINGLE_ANSWER_READING: 'Multiple Choice (Single)',

    SUMMARIZE_SPOKEN_TEXT: 'Summarize Spoken Text',
    MULTIPLE_CHOICE_MULTIPLE_ANSWERS_LISTENING: 'Multiple Choice (Multiple)',
    LISTENING_FILL_IN_THE_BLANKS: 'Fill in the Blanks',
    HIGHLIGHT_CORRECT_SUMMARY: 'Highlight Correct Summary',
    MULTIPLE_CHOICE_SINGLE_ANSWER_LISTENING: 'Multiple Choice (Single)',
    SELECT_MISSING_WORD: 'Select Missing Word',
    HIGHLIGHT_INCORRECT_WORDS: 'Highlight Incorrect Words',
    WRITE_FROM_DICTATION: 'Write from Dictation',
  };

  const orderedSections = useMemo(() => {
    const sectionEntries = Object.entries(groupedQuestionTypes || {});

    return sectionOrder
      .map((sectionName) =>
        sectionEntries.find(([name]) =>
          name.toLowerCase().includes(sectionName.toLowerCase()),
        ),
      )
      .filter(Boolean) as Array<
      [
        string,
        {
          section: { id: string; name: string; description?: string };
          questionTypes: Array<{ id: string; name: string }>;
        },
      ]
    >;
  }, [groupedQuestionTypes]);

  const handleLogout = () => {
    logout();
    setIsMenuOpen(false);
  };

  useEffect(() => {
    setIsPortalMenuOpen(false);
  }, [location.pathname]);

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
          <div className='hidden lg:flex items-center space-x-8'>
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
              <div
                className='relative'
                onMouseEnter={() => setIsPortalMenuOpen(true)}
                onMouseLeave={() => setIsPortalMenuOpen(false)}
              >
                <Link
                  to='/portal'
                  onClick={() => setIsPortalMenuOpen(false)}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
                    isActive('/portal')
                      ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20'
                      : 'text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400'
                  }`}
                >
                  Portal
                </Link>

                {orderedSections.length > 0 && (
                  <div
                    className={`absolute top-full left-1/2 -translate-x-1/2 mt-2 w-[840px] max-w-[calc(100vw-2rem)] bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-2xl transition-all duration-150 z-50 ${
                      isPortalMenuOpen
                        ? 'opacity-100 visible'
                        : 'opacity-0 invisible'
                    }`}
                  >
                    <div className='grid grid-cols-4 gap-6 p-5'>
                      {orderedSections.map(([sectionName, sectionData]) => (
                        <div key={sectionName}>
                          <h4 className='text-lg font-semibold text-gray-900 dark:text-white mb-2'>
                            {sectionName}
                          </h4>
                          <div className='h-0.5 w-12 bg-cyan-500 mb-3'></div>
                          <ul className='space-y-1.5'>
                            {sectionData.questionTypes.map((questionType) => {
                              const typeName =
                                questionType.name as PteQuestionTypeName;
                              const label =
                                questionTypeLabelMap[typeName] ||
                                questionType.name
                                  .toLowerCase()
                                  .replace(/_/g, ' ')
                                  .replace(/\b\w/g, (char) =>
                                    char.toUpperCase(),
                                  );

                              return (
                                <li key={questionType.id}>
                                  <Link
                                    to={getPracticePagePath(typeName)}
                                    onClick={() => setIsPortalMenuOpen(false)}
                                    className='text-sm leading-snug text-gray-700 dark:text-gray-300 hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors'
                                  >
                                    {label}
                                  </Link>
                                </li>
                              );
                            })}
                          </ul>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
            {user && user.role === 'ADMIN' && (
              <div className='relative group'>
                <Link
                  to='/admin'
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
                    location.pathname.startsWith('/admin')
                      ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20'
                      : 'text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400'
                  }`}
                >
                  Admin
                </Link>
                <div className='absolute top-full left-0 mt-1 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50'>
                  <div className='py-2'>
                    <Link
                      to='/admin'
                      className='block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                    >
                      Dashboard
                    </Link>
                    <Link
                      to='/admin/courses'
                      className='block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                    >
                      Courses
                    </Link>
                    <Link
                      to='/admin/users'
                      className='block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                    >
                      Users
                    </Link>
                    {/* <Link
                      to='/admin/categories'
                      className='block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                    >
                      Categories
                    </Link> */}
                    <Link
                      to='/admin/payments'
                      className='block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                    >
                      Payments
                    </Link>
                    <Link
                      to='/admin/questions'
                      className='block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                    >
                      Questions
                    </Link>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right side buttons */}
          <div className='hidden lg:flex items-center space-x-4'>
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
          <div className='lg:hidden flex items-center space-x-2'>
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
          <div className='lg:hidden'>
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
              {user && user.role === 'ADMIN' && (
                <>
                  <Link
                    to='/admin'
                    className='block px-3 py-2 rounded-md text-base font-medium text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400'
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Admin Dashboard
                  </Link>
                  <Link
                    to='/admin/courses'
                    className='block px-3 py-2 rounded-md text-base font-medium text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400'
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Manage Courses
                  </Link>
                  <Link
                    to='/admin/users'
                    className='block px-3 py-2 rounded-md text-base font-medium text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400'
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Manage Users
                  </Link>
                  <Link
                    to='/admin/categories'
                    className='block px-3 py-2 rounded-md text-base font-medium text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400'
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Manage Categories
                  </Link>
                </>
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
