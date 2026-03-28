import React from 'react';
import {
  Award,
  BookOpen,
  CheckCircle2,
  GraduationCap,
  Heart,
  Star,
  Target,
  TrendingUp,
  Trophy,
  Users,
} from 'lucide-react';

const storySteps = [
  {
    title: 'The Struggle Began',
    description:
      "Like many international students, I faced the challenge of proving my English proficiency through standardized tests. My first PTE attempt was humbling. I scored well below my target even though I felt confident in my English skills. That experience taught me that knowing English and performing well in PTE are two very different things.",
    icon: Target,
  },
  {
    title: 'The Learning Phase',
    description:
      "Determined to improve, I immersed myself in the PTE format. I studied question patterns, timing strategies, and scoring behaviour. I documented mistakes, refined systems for each task type, and learned that success in PTE depends on strategy, timing, and understanding how the exam works.",
    icon: BookOpen,
  },
  {
    title: 'Breakthrough and Beyond',
    description:
      "That persistence paid off when I achieved a perfect score of 90 in all four skills. More importantly, I had built a system that could be repeated. When friends and colleagues began asking for help, I realised I could turn that experience into a method that supports others on the same journey.",
    icon: Trophy,
  },
  {
    title: 'Empowering Others',
    description:
      "Today, after helping thousands of students work toward their target scores, I remain driven by the same motivation that shaped my own journey. Every student carries real goals behind this exam, and my aim is to offer both technical expertise and genuine support along the way.",
    icon: Heart,
  },
];

const achievements = [
  { value: '10,000+', label: 'Students Trained', icon: Users },
  { value: '95%', label: 'Success Rate', icon: TrendingUp },
  { value: '4.9/5', label: 'Student Rating', icon: Star },
  { value: '8+', label: 'Years Experience', icon: Award },
];

const certifications = [
  'Certified PTE Academic Trainer',
  'TESOL Certification (120 hours)',
  'Cambridge CELTA Qualified',
  "Master's in Applied Linguistics",
];

const recognitions = [
  'Excellence in Language Training Award 2023',
  'Top PTE Trainer - International Recognition',
  'Educational Innovation Award 2022',
  'Student Choice Award (5 consecutive years)',
];

const About: React.FC = () => {
  return (
    <div className='min-h-screen bg-slate-50 dark:bg-slate-950'>
      <section className='relative overflow-hidden bg-slate-950 text-white'>
        <div className='absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(34,197,94,0.18),_transparent_32%),radial-gradient(circle_at_80%_15%,_rgba(59,130,246,0.2),_transparent_28%),linear-gradient(135deg,_#0f172a_0%,_#111827_55%,_#1e293b_100%)]' />
        <div className='relative container mx-auto px-4 py-14 sm:py-16 lg:py-20'>
          <div className='grid gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-center'>
            <div className='max-w-3xl'>
              <div className='inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/8 px-4 py-2 text-sm text-slate-200'>
                <GraduationCap className='h-4 w-4 text-emerald-300' />
                <span>The story behind PTEbyDee</span>
              </div>

              <h1 className='mt-5 text-4xl font-semibold leading-tight sm:text-5xl lg:text-[3.8rem]'>
                My journey to becoming a PTE trainer started with the same struggle many students face.
              </h1>

              <p className='mt-5 max-w-2xl text-lg leading-8 text-slate-300'>
                From uncertainty and low scores to a perfect 90 in all four
                skills, this journey shaped the teaching approach behind
                PTEbyDee. The goal has always been simple: help learners prepare
                with more clarity, strategy, and confidence.
              </p>
            </div>

            <div className='rounded-[30px] border border-white/10 bg-white/8 p-4 shadow-2xl'>
              <div className='rounded-[24px] border border-white/10 bg-slate-900/90 p-6'>
                <div className='flex items-center justify-between border-b border-white/10 pb-4'>
                  <div>
                    <p className='text-sm uppercase tracking-[0.22em] text-slate-400'>
                      PTEbyDee
                    </p>
                    <h2 className='mt-2 text-2xl font-semibold text-white'>
                      From student struggle to structured support
                    </h2>
                  </div>
                  <div className='rounded-2xl bg-emerald-400/15 px-3 py-2 text-sm font-medium text-emerald-300'>
                    90 in all skills
                  </div>
                </div>

                <div className='mt-5 space-y-4'>
                  {[
                    'Real exam experience shaped the teaching method',
                    'Practical strategy built from repeated preparation',
                    'A student-first approach with clear guidance',
                  ].map((item) => (
                    <div
                      key={item}
                      className='flex items-center gap-3 rounded-2xl border border-white/10 bg-slate-800/80 px-4 py-4'
                    >
                      <CheckCircle2 className='h-5 w-5 text-emerald-300' />
                      <span className='text-sm text-slate-200'>{item}</span>
                    </div>
                  ))}
                </div>

                <div className='mt-6 rounded-2xl border border-white/10 bg-slate-800/70 p-5'>
                  <p className='text-sm text-slate-400'>What students receive</p>
                  <div className='mt-3 grid grid-cols-2 gap-3'>
                    {[
                      ['Speaking', 'Fluency and confidence'],
                      ['Writing', 'Structure and strategy'],
                      ['Reading', 'Accuracy and speed'],
                      ['Listening', 'Focus and control'],
                    ].map(([label, value]) => (
                      <div
                        key={label}
                        className='rounded-xl border border-white/10 bg-slate-900/70 px-4 py-3'
                      >
                        <div className='text-sm font-medium text-white'>{label}</div>
                        <div className='mt-1 text-xs text-slate-400'>{value}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className='border-y border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900'>
        <div className='container mx-auto px-4 py-10'>
          <div className='grid grid-cols-2 gap-6 md:grid-cols-4'>
            {achievements.map((item) => {
              const Icon = item.icon;

              return (
                <div
                  key={item.label}
                  className='rounded-2xl border border-slate-200 bg-slate-50 px-5 py-6 text-center dark:border-slate-800 dark:bg-slate-950'
                >
                  <div className='mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-900 text-white dark:bg-white dark:text-slate-900'>
                    <Icon className='h-5 w-5' />
                  </div>
                  <div className='text-2xl font-semibold text-slate-900 dark:text-white sm:text-3xl'>
                    {item.value}
                  </div>
                  <div className='mt-2 text-sm text-slate-600 dark:text-slate-300'>
                    {item.label}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className='bg-slate-50 py-20 dark:bg-slate-950'>
        <div className='container mx-auto px-4'>
          <div className='mx-auto max-w-3xl text-center'>
            <div className='inline-flex items-center gap-2 rounded-full bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700 dark:bg-blue-400/10 dark:text-blue-300'>
              <Target className='h-4 w-4' />
              <span>My story</span>
            </div>
            <h2 className='mt-5 text-3xl font-semibold text-slate-900 dark:text-white sm:text-4xl'>
              Every expert starts somewhere. This is how the journey unfolded.
            </h2>
          </div>

          <div className='mx-auto mt-12 grid max-w-5xl gap-5'>
            {storySteps.map((step) => {
              const Icon = step.icon;

              return (
                <div
                  key={step.title}
                  className='rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900'
                >
                  <div className='flex items-start gap-4'>
                    <div className='flex h-12 w-12 items-center px-4 justify-center rounded-2xl bg-slate-900 text-white dark:bg-white dark:text-slate-900'>
                      <Icon className='h-5 w-5' />
                    </div>
                    <div>
                      <h3 className='text-2xl font-semibold text-slate-900 dark:text-white'>
                        {step.title}
                      </h3>
                      <p className='mt-4 text-base leading-8 text-slate-600 dark:text-slate-300'>
                        {step.description}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className='bg-white py-20 dark:bg-slate-900'>
        <div className='container mx-auto px-4'>
          <div className='grid gap-8 lg:grid-cols-2'>
            <div className='rounded-[30px] border border-slate-200 bg-slate-50 p-8 dark:border-slate-800 dark:bg-slate-950'>
              <h3 className='text-2xl font-semibold text-slate-900 dark:text-white'>
                Professional Certifications
              </h3>
              <div className='mt-6 space-y-4'>
                {certifications.map((item) => (
                  <div
                    key={item}
                    className='flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-4 dark:border-slate-800 dark:bg-slate-900'
                  >
                    <CheckCircle2 className='h-5 w-5 text-emerald-500' />
                    <span className='text-sm text-slate-700 dark:text-slate-300'>
                      {item}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className='rounded-[30px] border border-slate-200 bg-slate-50 p-8 dark:border-slate-800 dark:bg-slate-950'>
              <h3 className='text-2xl font-semibold text-slate-900 dark:text-white'>
                Recognition and Awards
              </h3>
              <div className='mt-6 space-y-4'>
                {recognitions.map((item) => (
                  <div
                    key={item}
                    className='flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-4 dark:border-slate-800 dark:bg-slate-900'
                  >
                    <Award className='h-5 w-5 text-blue-600 dark:text-blue-300' />
                    <span className='text-sm text-slate-700 dark:text-slate-300'>
                      {item}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className='bg-slate-100 py-20 dark:bg-slate-950'>
        <div className='container mx-auto px-4'>
          <div className='mx-auto max-w-4xl rounded-[32px] bg-gradient-to-r from-slate-900 via-slate-800 to-blue-950 px-8 py-12 text-white shadow-2xl'>
            <div className='inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-200'>
              <Heart className='h-4 w-4 text-emerald-300' />
              <span>Teaching philosophy</span>
            </div>
            <blockquote className='mt-6 text-2xl leading-10 text-slate-100'>
              "Success in PTE is not just about knowing English. It is about
              understanding the test, mastering strategy, and building the
              confidence to perform under pressure. My role is to make that
              journey clearer, simpler, and more achievable."
            </blockquote>
            <div className='mt-8 border-t border-white/10 pt-6'>
              <p className='font-semibold text-white'>Diskha Dwivedi</p>
              <p className='mt-1 text-sm text-slate-300'>
                Founder and Lead Trainer, PTEbyDee
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default About;
