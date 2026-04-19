import React, { useEffect, useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Moon,
  Sun,
  Menu,
  X,
  BookOpen,
  User,
  LogOut,
  LayoutDashboard,
  Users,
  DollarSign,
  LifeBuoy,
  FileText,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { getQuestionTypes } from '../services/portal';
import { PteQuestionTypeName } from '../types/pte';
import { getPracticePagePath } from '../utils/questionTypeToSlug';
import { questionTypeOrder, sectionOrder } from '../utils/questionOrdering';

const Navbar: React.FC = () => {
  const { isDarkMode, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isPortalMenuOpen, setIsPortalMenuOpen] = useState(false);
  const [isAdminMenuOpen, setIsAdminMenuOpen] = useState(false);
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
  const navLinkClass = (active: boolean) =>
    `rounded-full px-4 py-2 text-sm font-medium transition-all duration-200 ${
      active
        ? 'bg-slate-900 text-white shadow-sm dark:bg-white dark:text-slate-900'
        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white'
    }`;

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

  const adminLinks = [
    {
      title: 'Dashboard',
      description: 'See platform activity and admin shortcuts.',
      to: '/admin',
      icon: LayoutDashboard,
    },
    {
      title: 'Courses',
      description: 'Create, edit, and manage learning content.',
      to: '/admin/courses',
      icon: BookOpen,
    },
    {
      title: 'Users',
      description: 'Review user accounts and permissions.',
      to: '/admin/users',
      icon: Users,
    },
    {
      title: 'Payments',
      description: 'Track transactions and payment activity.',
      to: '/admin/payments',
      icon: DollarSign,
    },
    {
      title: 'Support Tickets',
      description: 'Handle learner questions and ticket updates.',
      to: '/admin/support-tickets',
      icon: LifeBuoy,
    },
    {
      title: 'Questions',
      description: 'Manage practice questions and test items.',
      to: '/admin/questions',
      icon: FileText,
    },
  ];

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

    const ordered = sectionOrder
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

    const remaining = sectionEntries.filter(
      ([name]) => !ordered.some(([orderedName]) => orderedName === name),
    );

    const mergedSections = [...ordered, ...remaining];

    return mergedSections.map(([sectionName, sectionData]) => {
      const sortedQuestionTypes = [...sectionData.questionTypes].sort(
        (questionTypeA, questionTypeB) => {
          const orderA =
            questionTypeOrder[questionTypeA.name.toLowerCase()] ?? 999;
          const orderB =
            questionTypeOrder[questionTypeB.name.toLowerCase()] ?? 999;

          if (orderA !== orderB) {
            return orderA - orderB;
          }

          return questionTypeA.name.localeCompare(questionTypeB.name);
        },
      );

      return [
        sectionName,
        {
          ...sectionData,
          questionTypes: sortedQuestionTypes,
        },
      ] as [
        string,
        typeof sectionData & {
          questionTypes: typeof sectionData.questionTypes;
        },
      ];
    });
  }, [groupedQuestionTypes]);

  const handleLogout = () => {
    logout();
    setIsMenuOpen(false);
  };

  const handleMenuToggle = () => {
    if (isMenuOpen) {
      setIsPortalMenuOpen(false);
      setIsAdminMenuOpen(false);
    }
    setIsMenuOpen(!isMenuOpen);
  };

  const togglePortalMenu = () => {
    setIsPortalMenuOpen((prev) => !prev);
    setIsAdminMenuOpen(false);
  };

  const toggleAdminMenu = () => {
    setIsAdminMenuOpen((prev) => !prev);
    setIsPortalMenuOpen(false);
  };

  useEffect(() => {
    setIsPortalMenuOpen(false);
    setIsAdminMenuOpen(false);
  }, [location.pathname]);

  return (
    <nav className='sticky top-0 z-50 border-b border-slate-200 bg-white shadow-sm transition-colors duration-300 dark:border-slate-800 dark:bg-slate-950'>
      <div className='container mx-auto px-4'>
        <div className='flex justify-between items-center h-16'>
          {/* Logo */}
          <Link
            to='/'
            className='flex items-center space-x-3 text-2xl font-semibold text-slate-950 dark:text-white'
          >
            <div className='flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-900 text-white shadow-sm dark:bg-white dark:text-slate-900'>
              <BookOpen className='h-5 w-5' />
            </div>
            <span>PTEbyDee</span>
          </Link>

          {/* Desktop Navigation */}
          <div className='hidden lg:flex items-center space-x-8'>
            <Link
              to='/'
              className={navLinkClass(isActive('/'))}
            >
              Home
            </Link>
            <Link
              to='/courses'
              className={navLinkClass(isActive('/courses'))}
            >
              Courses
            </Link>
            <Link
              to='/about'
              className={navLinkClass(isActive('/about'))}
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
                  className={navLinkClass(isActive('/portal'))}
                >
                  Portal
                </Link>

                {orderedSections.length > 0 && (
                  <div
                    className={`absolute left-1/2 top-full z-50 w-[840px] max-w-[calc(100vw-2rem)] -translate-x-1/2 pt-3 transition-all duration-150 ${
                      isPortalMenuOpen
                        ? 'visible opacity-100 pointer-events-auto'
                        : 'invisible opacity-0 pointer-events-none'
                    }`}
                  >
                    <div className='rounded-3xl border border-slate-200 bg-white shadow-2xl ring-1 ring-slate-950/5 dark:border-slate-800 dark:bg-slate-950 dark:ring-white/10'>
                      <div className='grid grid-cols-4 gap-6 p-6'>
                        {orderedSections.map(([sectionName, sectionData]) => (
                          <div key={sectionName}>
                            <h4 className='mb-2 text-lg font-semibold text-slate-900 dark:text-white'>
                              {sectionName}
                            </h4>
                            <div className='mb-3 h-0.5 w-12 bg-gradient-to-r from-emerald-400 to-blue-500'></div>
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
                                      className='text-sm leading-snug text-slate-600 transition-colors hover:text-blue-700 dark:text-slate-300 dark:hover:text-emerald-300'
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
                  </div>
                )}
              </div>
            )}
            {user && user.role === 'ADMIN' && (
              <div
                className='relative'
                onMouseEnter={() => setIsAdminMenuOpen(true)}
                onMouseLeave={() => setIsAdminMenuOpen(false)}
              >
                <Link
                  to='/admin'
                  onClick={() => setIsAdminMenuOpen(false)}
                  className={navLinkClass(location.pathname.startsWith('/admin'))}
                >
                  Admin
                </Link>
                <div
                  className={`absolute left-1/2 top-full z-50 w-[720px] max-w-[calc(100vw-2rem)] -translate-x-1/2 pt-3 transition-all duration-150 ${
                    isAdminMenuOpen
                      ? 'visible opacity-100 pointer-events-auto'
                      : 'invisible opacity-0 pointer-events-none'
                  }`}
                >
                  <div className='rounded-3xl border border-slate-200 bg-white shadow-2xl ring-1 ring-slate-950/5 dark:border-slate-800 dark:bg-slate-950 dark:ring-white/10'>
                    <div className='grid grid-cols-2 gap-4 p-6'>
                      {adminLinks.map((link) => {
                        const Icon = link.icon;

                        return (
                          <Link
                            key={link.to}
                            to={link.to}
                            onClick={() => setIsAdminMenuOpen(false)}
                            className='flex items-start gap-4 rounded-2xl border border-slate-200 p-4 transition-colors duration-200 hover:border-blue-200 hover:bg-slate-50 dark:border-slate-800 dark:hover:border-slate-700 dark:hover:bg-slate-900'
                          >
                            <div className='flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200'>
                              <Icon className='h-5 w-5' />
                            </div>
                            <div>
                              <h4 className='text-sm font-semibold text-slate-900 dark:text-white'>
                                {link.title}
                              </h4>
                              <p className='mt-1 text-sm leading-relaxed text-slate-600 dark:text-slate-300'>
                                {link.description}
                              </p>
                            </div>
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right side buttons */}
          <div className='hidden lg:flex items-center space-x-4'>
            <button
              onClick={toggleTheme}
              className='rounded-full border border-slate-200 bg-white p-2.5 text-slate-600 transition-colors duration-200 hover:bg-slate-100 hover:text-slate-900 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white'
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
                  className={`flex items-center space-x-1 ${navLinkClass(
                    isActive('/dashboard'),
                  )}`}
                >
                  <User className='h-4 w-4' />
                  <span>Dashboard</span>
                </Link>
                <button
                  onClick={handleLogout}
                  className='flex items-center space-x-1 rounded-full px-4 py-2 text-sm font-medium text-slate-600 transition-colors duration-200 hover:bg-rose-50 hover:text-rose-600 dark:text-slate-300 dark:hover:bg-rose-950/30 dark:hover:text-rose-300'
                >
                  <LogOut className='h-4 w-4' />
                  <span>Logout</span>
                </button>
              </div>
            ) : (
              <div className='flex items-center space-x-3'>
                <Link
                  to='/login'
                  className='rounded-full px-4 py-2 text-sm font-medium text-slate-600 transition-colors duration-200 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white'
                >
                  Login
                </Link>
                <Link
                  to='/register'
                  className='rounded-full bg-slate-900 px-5 py-2.5 text-sm font-medium text-white transition-colors duration-200 hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100'
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
              className='rounded-full border border-slate-200 bg-white p-2 text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300'
            >
              {isDarkMode ? (
                <Sun className='h-5 w-5' />
              ) : (
                <Moon className='h-5 w-5' />
              )}
            </button>
            <button
              onClick={handleMenuToggle}
              className='rounded-full border border-slate-200 bg-white p-2 text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300'
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
            <div className='border-t border-slate-200 bg-white px-2 pb-3 pt-3 dark:border-slate-800 dark:bg-slate-950'>
              <div className='max-h-[calc(100vh-5.5rem)] overflow-y-auto pr-1'>
                <div className='space-y-2'>
              <Link
                to='/'
                className='block rounded-2xl border border-transparent bg-slate-50 px-4 py-3 text-base font-medium text-slate-700 shadow-sm transition-colors hover:border-slate-200 hover:bg-white hover:text-slate-950 dark:bg-slate-900/70 dark:text-slate-200 dark:hover:border-slate-700 dark:hover:bg-slate-900 dark:hover:text-white'
                onClick={() => setIsMenuOpen(false)}
              >
                Home
              </Link>
              <Link
                to='/courses'
                className='block rounded-2xl border border-transparent bg-slate-50 px-4 py-3 text-base font-medium text-slate-700 shadow-sm transition-colors hover:border-slate-200 hover:bg-white hover:text-slate-950 dark:bg-slate-900/70 dark:text-slate-200 dark:hover:border-slate-700 dark:hover:bg-slate-900 dark:hover:text-white'
                onClick={() => setIsMenuOpen(false)}
              >
                Courses
              </Link>
              <Link
                to='/about'
                className='block rounded-2xl border border-transparent bg-slate-50 px-4 py-3 text-base font-medium text-slate-700 shadow-sm transition-colors hover:border-slate-200 hover:bg-white hover:text-slate-950 dark:bg-slate-900/70 dark:text-slate-200 dark:hover:border-slate-700 dark:hover:bg-slate-900 dark:hover:text-white'
                onClick={() => setIsMenuOpen(false)}
              >
                About
              </Link>
              {user && (
                <div className='rounded-2xl border border-slate-200 bg-white p-1.5 shadow-sm dark:border-slate-800 dark:bg-slate-950'>
                  <button
                    type='button'
                    className='flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-base font-semibold text-slate-700 transition-colors hover:bg-slate-100 hover:text-slate-950 dark:text-slate-200 dark:hover:bg-slate-800 dark:hover:text-white'
                    onClick={togglePortalMenu}
                  >
                    <span>Portal</span>
                    {isPortalMenuOpen ? (
                      <ChevronUp className='h-4 w-4' />
                    ) : (
                      <ChevronDown className='h-4 w-4' />
                    )}
                  </button>
                  {isPortalMenuOpen && (
                    <div className='mt-2 space-y-3 px-2 pb-2'>
                      <Link
                        to='/portal'
                        onClick={() => setIsMenuOpen(false)}
                        className='block rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:border-blue-200 hover:bg-white hover:text-blue-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-emerald-700 dark:hover:text-emerald-300'
                      >
                        Portal Home
                      </Link>
                      {orderedSections.map(([sectionName, sectionData]) => (
                        <div
                          key={sectionName}
                          className='rounded-xl border border-slate-200 bg-slate-50 p-2.5 dark:border-slate-800 dark:bg-slate-900/80'
                        >
                          <p className='mb-1 px-2 text-sm font-semibold text-slate-900 dark:text-white'>
                            {sectionName}
                          </p>
                          <ul className='space-y-0.5'>
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
                                    onClick={() => setIsMenuOpen(false)}
                                    className='block rounded-lg px-2.5 py-2 text-sm text-slate-600 transition-colors hover:bg-white hover:text-blue-700 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-emerald-300'
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
                  )}
                </div>
              )}
              {user && user.role === 'ADMIN' && (
                <div className='rounded-2xl border border-slate-200 bg-white p-1.5 shadow-sm dark:border-slate-800 dark:bg-slate-950'>
                  <button
                    type='button'
                    className='flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-base font-semibold text-slate-700 transition-colors hover:bg-slate-100 hover:text-slate-950 dark:text-slate-200 dark:hover:bg-slate-800 dark:hover:text-white'
                    onClick={toggleAdminMenu}
                  >
                    <span>Admin</span>
                    {isAdminMenuOpen ? (
                      <ChevronUp className='h-4 w-4' />
                    ) : (
                      <ChevronDown className='h-4 w-4' />
                    )}
                  </button>
                  {isAdminMenuOpen && (
                    <div className='mt-2 space-y-1 px-2 pb-2'>
                      {adminLinks.map((link) => (
                        <Link
                          key={link.to}
                          to={link.to}
                          className='block rounded-xl px-3 py-2 text-sm text-slate-700 transition-colors hover:bg-slate-100 hover:text-slate-950 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white'
                          onClick={() => setIsMenuOpen(false)}
                        >
                          {link.title}
                        </Link>
                      ))}
                      <Link
                        to='/admin/categories'
                        className='block rounded-xl px-3 py-2 text-sm text-slate-700 transition-colors hover:bg-slate-100 hover:text-slate-950 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white'
                        onClick={() => setIsMenuOpen(false)}
                      >
                        Manage Categories
                      </Link>
                    </div>
                  )}
                </div>
              )}
              {user ? (
                <>
                  <Link
                    to='/dashboard'
                    className='block rounded-2xl border border-transparent bg-slate-50 px-4 py-3 text-base font-medium text-slate-700 shadow-sm transition-colors hover:border-slate-200 hover:bg-white hover:text-slate-950 dark:bg-slate-900/70 dark:text-slate-200 dark:hover:border-slate-700 dark:hover:bg-slate-900 dark:hover:text-white'
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Dashboard
                  </Link>
                  <button
                    onClick={handleLogout}
                    className='block w-full rounded-2xl border border-transparent bg-slate-50 px-4 py-3 text-left text-base font-medium text-slate-700 shadow-sm transition-colors hover:border-rose-100 hover:bg-rose-50 hover:text-rose-600 dark:bg-slate-900/70 dark:text-slate-200 dark:hover:border-rose-900/40 dark:hover:bg-rose-950/30 dark:hover:text-rose-300'
                  >
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to='/login'
                    className='block rounded-2xl border border-transparent bg-slate-50 px-4 py-3 text-base font-medium text-slate-700 shadow-sm transition-colors hover:border-slate-200 hover:bg-white hover:text-slate-950 dark:bg-slate-900/70 dark:text-slate-200 dark:hover:border-slate-700 dark:hover:bg-slate-900 dark:hover:text-white'
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Login
                  </Link>
                  <Link
                    to='/register'
                    className='block rounded-2xl bg-slate-900 px-4 py-3 text-base font-medium text-white shadow-sm transition-colors hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100'
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Sign Up
                  </Link>
                </>
              )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
