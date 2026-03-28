import React from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Clock3,
  FileCheck,
  GraduationCap,
  Mic,
  MonitorPlay,
  ShieldCheck,
  Star,
  Target,
  TrendingUp,
  Trophy,
  Users,
} from 'lucide-react';
import CourseCard from '../components/CourseCard';
import { useAuth } from '../contexts/AuthContext';
import { getFeaturedCourses } from '../services/courses';
import type { Course } from '../services/courses';

const platformStats = [
  { value: '10,000+', label: 'Learners supported' },
  { value: '79+', label: 'Target score pathways' },
  { value: '95%', label: 'Students reaching goals' },
  { value: '4.8/5', label: 'Average learner rating' },
];

const learningHighlights = [
  {
    icon: Target,
    title: 'Score-focused study plans',
    description:
      'Structured preparation paths built around the score you need, not generic practice.',
  },
  {
    icon: Mic,
    title: 'Full PTE skill coverage',
    description:
      'Prepare speaking, writing, reading, and listening with guided drills and realistic task formats.',
  },
  {
    icon: ShieldCheck,
    title: 'Trusted coaching approach',
    description:
      'Clear strategies, exam-smart techniques, and practical feedback that feel reliable and professional.',
  },
];

const learningJourney = [
  {
    step: '01',
    title: 'Assess your current level',
    description:
      'Start with focused practice and identify where your score is leaking across each section.',
  },
  {
    step: '02',
    title: 'Train with targeted lessons',
    description:
      'Work through curated lessons, section strategies, and guided practice that fits the PTE format.',
  },
  {
    step: '03',
    title: 'Track progress with confidence',
    description:
      'Build consistency, measure improvement, and move into exam mode with a clear roadmap.',
  },
];

const proofPoints = [
  'Exam-oriented materials designed for real score improvement',
  'Clear course structure that feels guided, not overwhelming',
  'Flexible learning flow for students balancing work and study',
  'Trusted by learners preparing for migration, study, and career goals',
];

const portalFeatures = [
  {
    icon: MonitorPlay,
    title: 'Real test-style exam flow',
    description:
      'Move through instructions, timed questions, speaking tasks, and navigation that feel closer to the actual PTE experience.',
  },
  {
    icon: Clock3,
    title: 'Timed sections and question control',
    description:
      'Train under pressure with question timers, progress tracking, preparation time, and clear test progression.',
  },
  {
    icon: FileCheck,
    title: 'Results and performance review',
    description:
      'Finish each simulation with score breakdowns, strengths, weaknesses, and practical next-step guidance.',
  },
];

const Home: React.FC = () => {
  const { user } = useAuth();
  const [featuredCourses, setFeaturedCourses] = React.useState<Course[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchFeaturedCourses = async () => {
      try {
        const courses = await getFeaturedCourses(3);
        setFeaturedCourses(courses);
      } catch (error) {
        console.error('Failed to fetch featured courses:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchFeaturedCourses();
  }, []);

  return (
    <div className='min-h-screen bg-slate-50 dark:bg-slate-950'>
      <section className='relative overflow-hidden bg-slate-950 text-white'>
        <div className='absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(34,197,94,0.18),_transparent_32%),radial-gradient(circle_at_80%_20%,_rgba(59,130,246,0.22),_transparent_28%),linear-gradient(135deg,_#0f172a_0%,_#111827_55%,_#1e293b_100%)]' />
        <div className='absolute inset-x-0 top-0 h-px bg-white/10' />

        <div className='relative container mx-auto px-5 py-12 sm:px-6 sm:py-14 lg:px-8 lg:py-16'>
          <div className='grid grid-cols-1 gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:items-center'>
            <div className='max-w-3xl'>
              <h1 className='max-w-4xl text-4xl font-semibold leading-tight text-white sm:text-[2.2rem] lg:text-[2.8rem]'>
                A more structured, professional way to prepare for the
                <span className='block text-emerald-300'>
                  {' '}
                  PTE Academic test.
                </span>
              </h1>

              <p className='mt-5 max-w-2xl text-base leading-7 text-slate-300 sm:text-lg'>
                Learn with a platform designed around score goals, guided
                practice, and expert-led preparation so your study feels focused
                from day one.
              </p>

              <div className='mt-7 flex flex-col gap-4 sm:flex-row'>
                <Link
                  to='/courses'
                  className='inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-400 px-6 py-3.5 font-semibold text-slate-950 transition hover:bg-emerald-300'
                >
                  <BookOpen className='h-5 w-5' />
                  <span>Explore Courses</span>
                </Link>
                <Link
                  to={user ? '/dashboard' : '/register'}
                  className='inline-flex items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/5 px-6 py-3.5 font-semibold text-white transition hover:bg-white/10'
                >
                  <span>
                    {user ? 'Go to Dashboard' : 'Create Free Account'}
                  </span>
                  <ArrowRight className='h-5 w-5' />
                </Link>
              </div>

              <div className='mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3'>
                {learningHighlights.map((item) => {
                  const Icon = item.icon;

                  return (
                    <div
                      key={item.title}
                      className='rounded-2xl border border-white/10 bg-white/6 p-4 backdrop-blur-sm'
                    >
                      <div className='mb-3 inline-flex rounded-xl bg-emerald-400/12 p-3 text-emerald-300'>
                        <Icon className='h-5 w-5' />
                      </div>
                      <h3 className='text-base font-semibold text-white'>
                        {item.title}
                      </h3>
                      <p className='mt-2 text-sm leading-6 text-slate-300'>
                        {item.description}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className='relative'>
              <div className='absolute -left-6 top-10 hidden h-28 w-28 rounded-full bg-emerald-400/20 blur-3xl lg:block' />
              <div className='absolute -right-6 bottom-8 hidden h-32 w-32 rounded-full bg-blue-400/20 blur-3xl lg:block' />

              <div className='relative rounded-[28px] border border-white/10 bg-white/8 p-4 shadow-2xl backdrop-blur-xl'>
                <div className='rounded-[24px] border border-white/10 bg-slate-900/90 p-5'>
                  <div className='flex items-center justify-between border-b border-white/10 pb-4'>
                    <div>
                      <p className='text-sm uppercase tracking-[0.22em] text-slate-400'>
                        Learning dashboard
                      </p>
                      <h2 className='mt-2 text-xl font-semibold text-white'>
                        Exam prep with a clearer path
                      </h2>
                    </div>
                    <div className='rounded-2xl bg-emerald-400/15 px-3 py-2 text-sm font-medium text-emerald-300'>
                      Target 79+
                    </div>
                  </div>

                  <div className='mt-5 grid gap-4 sm:grid-cols-2'>
                    <div className='rounded-2xl border border-white/10 bg-slate-800/80 p-4'>
                      <div className='flex items-center justify-between'>
                        <span className='text-sm text-slate-400'>
                          Weekly study progress
                        </span>
                        <TrendingUp className='h-4 w-4 text-emerald-300' />
                      </div>
                      <div className='mt-3 text-3xl font-semibold text-white'>
                        84%
                      </div>
                      <div className='mt-3 h-2 rounded-full bg-slate-700'>
                        <div className='h-2 w-[84%] rounded-full bg-gradient-to-r from-emerald-400 to-blue-400' />
                      </div>
                    </div>

                    <div className='rounded-2xl border border-white/10 bg-slate-800/80 p-4'>
                      <div className='flex items-center justify-between'>
                        <span className='text-sm text-slate-400'>
                          Mock test readiness
                        </span>
                        <Trophy className='h-4 w-4 text-amber-300' />
                      </div>
                      <div className='mt-3 text-3xl font-semibold text-white'>
                        3
                      </div>
                      <p className='mt-2 text-sm text-slate-300'>
                        Full-length tests completed this month
                      </p>
                    </div>
                  </div>

                  <div className='mt-5 rounded-2xl border border-white/10 bg-slate-800/70 p-4'>
                    <div className='flex items-center justify-between'>
                      <div>
                        <p className='text-sm text-slate-400'>Today’s focus</p>
                        <h3 className='mt-1 text-lg font-semibold text-white'>
                          Speaking and listening refinement
                        </h3>
                      </div>
                      <div className='rounded-xl bg-blue-400/15 p-3 text-blue-300'>
                        <Clock3 className='h-5 w-5' />
                      </div>
                    </div>

                    <div className='mt-4 space-y-3'>
                      {[
                        'Repeat Sentence accuracy drills',
                        'Read Aloud fluency practice',
                        'Listening summary review',
                      ].map((task) => (
                        <div
                          key={task}
                          className='flex items-center gap-3 rounded-xl border border-white/8 bg-slate-900/60 px-4 py-3'
                        >
                          <CheckCircle2 className='h-4 w-4 text-emerald-300' />
                          <span className='text-sm text-slate-200'>{task}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className='absolute -bottom-5 left-5 rounded-2xl border border-slate-200/20 bg-white px-4 py-3 text-slate-900 shadow-xl dark:bg-slate-100'>
                  <div className='flex items-center gap-3'>
                    <div className='rounded-xl bg-amber-100 p-2 text-amber-600'>
                      <Star className='h-4 w-4 fill-current' />
                    </div>
                    <div>
                      <p className='text-sm font-semibold'>
                        4.8 learner rating
                      </p>
                      <p className='text-xs text-slate-500'>
                        Trusted by students preparing for study and migration
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className='border-y border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900'>
        <div className='container mx-auto px-5 py-10 sm:px-6 lg:px-8'>
          <div className='grid grid-cols-2 gap-6 md:grid-cols-4'>
            {platformStats.map((item) => (
              <div
                key={item.label}
                className='rounded-2xl border border-slate-200 bg-slate-50 px-5 py-6 text-center dark:border-slate-800 dark:bg-slate-950'
              >
                <div className='text-2xl font-semibold text-slate-900 dark:text-white sm:text-3xl'>
                  {item.value}
                </div>
                <div className='mt-2 text-sm text-slate-600 dark:text-slate-300'>
                  {item.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className='bg-white py-20 dark:bg-slate-900'>
        <div className='container mx-auto px-5 sm:px-6 lg:px-8'>
          <div className='grid gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:items-center'>
            <div>
              <div className='inline-flex items-center gap-2 rounded-full bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700 dark:bg-blue-400/10 dark:text-blue-300'>
                <MonitorPlay className='h-4 w-4' />
                <span>PTE exam simulation portal</span>
              </div>
              <h2 className='mt-5 text-3xl font-semibold text-slate-900 dark:text-white sm:text-4xl'>
                Practice inside a portal that simulates the rhythm of the real
                exam
              </h2>
              <p className='mt-5 max-w-2xl text-lg leading-8 text-slate-600 dark:text-slate-300'>
                Beyond lessons and question banks, learners can step into a
                dedicated portal designed for mock-style PTE practice. It brings
                together test instructions, timed question flow, speaking tasks,
                and results review in one focused experience.
              </p>

              <div className='mt-8 grid gap-4'>
                {portalFeatures.map((feature) => {
                  const Icon = feature.icon;

                  return (
                    <div
                      key={feature.title}
                      className='flex items-start gap-4 rounded-2xl border border-slate-200 bg-slate-50 px-5 py-5 dark:border-slate-800 dark:bg-slate-950'
                    >
                      <div className='rounded-2xl bg-blue-100 p-3 text-blue-700 dark:bg-blue-400/10 dark:text-blue-300'>
                        <Icon className='h-5 w-5' />
                      </div>
                      <div>
                        <h3 className='text-base font-semibold text-slate-900 dark:text-white'>
                          {feature.title}
                        </h3>
                        <p className='mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300'>
                          {feature.description}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className='mt-8 flex flex-col gap-4 sm:flex-row'>
                <Link
                  to={user ? '/portal' : '/login'}
                  className='inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-6 py-3.5 font-semibold text-white transition hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100'
                >
                  <MonitorPlay className='h-5 w-5' />
                  <span>{user ? 'Open Portal' : 'Login to Access Portal'}</span>
                </Link>
                <Link
                  to='/courses'
                  className='inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 px-6 py-3.5 font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800'
                >
                  <BookOpen className='h-5 w-5' />
                  <span>Explore Preparation Courses</span>
                </Link>
              </div>
            </div>

            <div className='relative'>
              <div className='rounded-[30px] border border-slate-200 bg-slate-950 p-4 shadow-2xl dark:border-slate-800'>
                <div className='rounded-[24px] border border-white/10 bg-[linear-gradient(180deg,_rgba(15,23,42,1)_0%,_rgba(30,41,59,0.96)_100%)] p-6 text-white'>
                  <div className='flex items-center justify-between border-b border-white/10 pb-4'>
                    <div>
                      <p className='text-sm uppercase tracking-[0.24em] text-slate-400'>
                        Mock Test Portal
                      </p>
                      <h3 className='mt-2 text-2xl font-semibold'>
                        Full exam simulation
                      </h3>
                    </div>
                    <div className='rounded-2xl bg-emerald-400/15 px-3 py-2 text-sm font-medium text-emerald-300'>
                      Timed Mode
                    </div>
                  </div>

                  <div className='mt-6 space-y-4'>
                    <div className='grid gap-4 sm:grid-cols-2'>
                      <div className='rounded-2xl border border-white/10 bg-white/5 p-4'>
                        <p className='text-sm text-slate-400'>Pre-test setup</p>
                        <div className='mt-3 flex items-center gap-3'>
                          <CheckCircle2 className='h-5 w-5 text-emerald-300' />
                          <span className='text-sm text-slate-200'>
                            Audio, microphone, and checklist validation
                          </span>
                        </div>
                      </div>
                      <div className='rounded-2xl border border-white/10 bg-white/5 p-4'>
                        <p className='text-sm text-slate-400'>
                          Live question flow
                        </p>
                        <div className='mt-3 flex items-center gap-3'>
                          <Clock3 className='h-5 w-5 text-blue-300' />
                          <span className='text-sm text-slate-200'>
                            Timers, progress bar, and next-question navigation
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className='rounded-2xl border border-white/10 bg-white/5 p-5'>
                      <div className='flex items-center justify-between'>
                        <div>
                          <p className='text-sm text-slate-400'>
                            Score report preview
                          </p>
                          <h4 className='mt-1 text-lg font-semibold'>
                            Overall performance insight
                          </h4>
                        </div>
                        <div className='rounded-2xl bg-amber-400/15 px-3 py-2 text-lg font-semibold text-amber-300'>
                          82/90
                        </div>
                      </div>

                      <div className='mt-5 grid gap-3 sm:grid-cols-2'>
                        {[
                          ['Speaking', '85'],
                          ['Writing', '78'],
                          ['Reading', '84'],
                          ['Listening', '81'],
                        ].map(([label, value]) => (
                          <div
                            key={label}
                            className='rounded-xl border border-white/10 bg-slate-900/60 px-4 py-3'
                          >
                            <div className='flex items-center justify-between text-sm'>
                              <span className='text-slate-300'>{label}</span>
                              <span className='font-semibold text-white'>
                                {value}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className='border-y border-slate-200 bg-slate-50 py-20 dark:border-slate-800 dark:bg-slate-950'>
        <div className='container mx-auto px-5 sm:px-6 lg:px-8'>
          <div className='grid gap-12 lg:grid-cols-[0.95fr_1.05fr] lg:items-start'>
            <div>

              <h2 className='mt-5 text-3xl font-semibold text-slate-900 dark:text-white sm:text-4xl'>
                Everything should feel like a education platform.
              </h2>
              <p className='mt-5 max-w-2xl text-lg leading-8 text-slate-600 dark:text-slate-300'>
                The best preparation experience feels clear, trustworthy, and
                organised. PTEbyDee is shaped around that idea so students can
                focus on improving, not guessing what to do next.
              </p>

              <div className='mt-8 space-y-4'>
                {proofPoints.map((point) => (
                  <div
                    key={point}
                    className='flex items-start gap-3 rounded-2xl border border-slate-200 bg-white px-5 py-4 dark:border-slate-800 dark:bg-slate-900'
                  >
                    <CheckCircle2 className='mt-0.5 h-5 w-5 text-emerald-500' />
                    <p className='text-sm leading-6 text-slate-700 dark:text-slate-300'>
                      {point}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className='grid gap-5 sm:grid-cols-2'>
              {learningJourney.map((item) => (
                <div
                  key={item.step}
                  className='rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900'
                >
                  <div className='text-sm font-semibold tracking-[0.24em] text-slate-400'>
                    STEP {item.step}
                  </div>
                  <h3 className='mt-4 text-xl font-semibold text-slate-900 dark:text-white'>
                    {item.title}
                  </h3>
                  <p className='mt-3 text-sm leading-7 text-slate-600 dark:text-slate-300'>
                    {item.description}
                  </p>
                </div>
              ))}

              <div className='rounded-3xl bg-slate-900 p-6 text-white shadow-sm dark:bg-slate-800'>
                <div className='inline-flex rounded-2xl bg-white/10 p-3 text-emerald-300'>
                  <GraduationCap className='h-6 w-6' />
                </div>
                <h3 className='mt-5 text-xl font-semibold'>
                  Study with more confidence and direction
                </h3>
                <p className='mt-3 text-sm leading-7 text-slate-300'>
                  Every part of the experience is designed to feel calmer,
                  clearer, and more credible for students preparing for an
                  important exam.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className='bg-white py-20 dark:bg-slate-900'>
        <div className='container mx-auto px-5 sm:px-6 lg:px-8'>
          <div className='mb-12 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between'>
            <div className='max-w-2xl'>
              <h2 className='mt-5 text-3xl font-semibold text-slate-900 dark:text-white sm:text-4xl'>
                Courses designed to help learners move with purpose
              </h2>
              <p className='mt-4 text-lg leading-8 text-slate-600 dark:text-slate-300'>
                Start with the courses students use most when they want clearer
                preparation, stronger exam strategy, and consistent practice.
              </p>
            </div>

            <Link
              to='/courses'
              className='inline-flex items-center gap-2 self-start rounded-xl border border-slate-300 px-5 py-3 font-medium text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800'
            >
              <span>Browse all courses</span>
              <ArrowRight className='h-4 w-4' />
            </Link>
          </div>



          <div className='mx-auto grid max-w-6xl grid-cols-1 justify-items-center gap-6 md:grid-cols-2 xl:grid-cols-3'>
            {isLoading
              ? [...Array(3)].map((_, index) => (
                  <div
                    key={index}
                    className='w-full max-w-[340px] overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm animate-pulse dark:border-slate-800 dark:bg-slate-900'
                  >
                    <div className='h-48 w-full bg-slate-200 dark:bg-slate-800' />
                    <div className='space-y-4 p-6'>
                      <div className='h-4 w-3/4 rounded bg-slate-200 dark:bg-slate-800' />
                      <div className='h-3 w-full rounded bg-slate-200 dark:bg-slate-800' />
                      <div className='h-3 w-2/3 rounded bg-slate-200 dark:bg-slate-800' />
                      <div className='flex items-center justify-between pt-2'>
                        <div className='h-6 w-20 rounded bg-slate-200 dark:bg-slate-800' />
                        <div className='h-9 w-28 rounded bg-slate-200 dark:bg-slate-800' />
                      </div>
                    </div>
                  </div>
                ))
              : featuredCourses.map((course) => (
                  <CourseCard
                    key={course.id}
                    course={course}
                    variant='featured'
                  />
                ))}
          </div>
        </div>
      </section>

      <section className='bg-slate-100 py-20 dark:bg-slate-950'>
        <div className='container mx-auto px-5 sm:px-6 lg:px-8'>
          <div className='rounded-[32px] bg-gradient-to-r from-slate-900 via-slate-800 to-blue-950 px-6 py-12 text-white shadow-2xl sm:px-10 lg:px-14'>
            <div className='grid gap-10 lg:grid-cols-[1fr_auto] lg:items-center'>
              <div className='max-w-3xl'>
                <div className='inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-200'>
                  <Trophy className='h-4 w-4 text-amber-300' />
                  <span>Start preparing with more clarity</span>
                </div>
                <h2 className='mt-5 text-3xl font-semibold sm:text-4xl'>
                  Ready to prepare for PTE with more confidence?
                </h2>
                <p className='mt-4 max-w-2xl text-lg leading-8 text-slate-300'>
                  Join a learning experience built to feel focused, trustworthy,
                  and serious about helping you reach your target score.
                </p>
              </div>

              <div className='flex flex-col gap-4 sm:flex-row lg:flex-col'>
                <Link
                  to='/courses'
                  className='inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-400 px-6 py-3.5 font-semibold text-slate-950 transition hover:bg-emerald-300'
                >
                  <BookOpen className='h-5 w-5' />
                  <span>View Courses</span>
                </Link>
                <Link
                  to={user ? '/dashboard' : '/register'}
                  className='inline-flex items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/5 px-6 py-3.5 font-semibold text-white transition hover:bg-white/10'
                >
                  <span>{user ? 'Open Dashboard' : 'Join the Platform'}</span>
                  <ArrowRight className='h-5 w-5' />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
