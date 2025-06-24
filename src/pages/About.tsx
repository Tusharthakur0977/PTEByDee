import React from 'react';
import {
  Award,
  Users,
  Target,
  Heart,
  BookOpen,
  Trophy,
  Star,
  CheckCircle,
} from 'lucide-react';

const About: React.FC = () => {
  return (
    <div className='min-h-screen'>
      {/* Hero Section */}
      <section className='bg-gradient-to-br from-blue-600 via-purple-600 to-blue-800 text-white py-20'>
        <div className='container mx-auto px-4'>
          <div className='grid grid-cols-1 lg:grid-cols-2 gap-12 items-center'>
            <div className='space-y-8'>
              <h1 className='text-5xl font-bold leading-tight'>
                My Journey to Becoming a
                <span className='block text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-orange-300'>
                  PTE Expert
                </span>
              </h1>
              <p className='text-xl text-blue-100 leading-relaxed'>
                From struggling student to certified trainer - discover how I
                transformed my challenges into expertise and now help thousands
                achieve their PTE dreams.
              </p>
            </div>
            <div className='relative'>
              <img
                src='https://images.pexels.com/photos/3184291/pexels-photo-3184291.jpeg?auto=compress&cs=tinysrgb&w=600'
                alt='PTE Trainer'
                className='rounded-2xl shadow-2xl'
              />
              {/* <div className='absolute -bottom-6 -right-6 bg-white text-gray-900 p-6 rounded-xl shadow-xl'>
                <div className='flex items-center space-x-2 mb-2'>
                  <Award className='h-6 w-6 text-blue-600' />
                  <span className='font-bold text-lg'>Certified Trainer</span>
                </div>
                <p className='text-gray-600'>8+ Years Experience</p>
              </div> */}
            </div>
          </div>
        </div>
      </section>

      {/* My Story */}
      <section className='py-20 bg-white dark:bg-gray-900'>
        <div className='container mx-auto px-4'>
          <div className='max-w-4xl mx-auto'>
            <div className='text-center mb-16'>
              <h2 className='text-4xl font-bold text-gray-900 dark:text-white mb-6'>
                My Story
              </h2>
              <p className='text-xl text-gray-600 dark:text-gray-300'>
                Every expert was once a beginner. Here's how my journey
                unfolded.
              </p>
            </div>

            <div className='space-y-12'>
              {/* Challenge */}
              <div className='flex items-start space-x-6'>
                <div className='bg-red-100 dark:bg-red-900/30 p-4 rounded-full'>
                  <Target className='h-8 w-8 text-red-600 dark:text-red-400' />
                </div>
                <div>
                  <h3 className='text-2xl font-bold text-gray-900 dark:text-white mb-4'>
                    The Struggle Began
                  </h3>
                  <p className='text-gray-700 dark:text-gray-300 leading-relaxed text-lg'>
                    Like many international students, I faced the daunting
                    challenge of proving my English proficiency through
                    standardized tests. My first PTE attempt was a humbling
                    experience - I scored well below my target despite feeling
                    confident in my English skills. The test format was
                    completely different from what I expected, and I realized
                    that knowing English and performing well on PTE were two
                    different things entirely.
                  </p>
                </div>
              </div>

              {/* Discovery */}
              <div className='flex items-start space-x-6'>
                <div className='bg-yellow-100 dark:bg-yellow-900/30 p-4 rounded-full'>
                  <BookOpen className='h-8 w-8 text-yellow-600 dark:text-yellow-400' />
                </div>
                <div>
                  <h3 className='text-2xl font-bold text-gray-900 dark:text-white mb-4'>
                    The Learning Phase
                  </h3>
                  <p className='text-gray-700 dark:text-gray-300 leading-relaxed text-lg'>
                    Determined to succeed, I immersed myself in understanding
                    the PTE format. I spent months analyzing question patterns,
                    timing strategies, and scoring algorithms. I practiced
                    religiously, documented every mistake, and developed
                    systematic approaches for each question type. This intensive
                    self-study period taught me that PTE success isn't just
                    about English proficiency - it's about test strategy, time
                    management, and understanding the AI scoring system.
                  </p>
                </div>
              </div>

              {/* Success */}
              <div className='flex items-start space-x-6'>
                <div className='bg-green-100 dark:bg-green-900/30 p-4 rounded-full'>
                  <Trophy className='h-8 w-8 text-green-600 dark:text-green-400' />
                </div>
                <div>
                  <h3 className='text-2xl font-bold text-gray-900 dark:text-white mb-4'>
                    Breakthrough & Beyond
                  </h3>
                  <p className='text-gray-700 dark:text-gray-300 leading-relaxed text-lg'>
                    My persistence paid off when I achieved a perfect score of
                    90 in all four skills. But more importantly, I had developed
                    a systematic methodology that could be replicated. Friends
                    and colleagues started asking for help, and I realized I had
                    a gift for breaking down complex strategies into simple,
                    actionable steps. This led me to pursue formal certification
                    and eventually establish PTEbyDee to help others avoid the
                    struggles I faced.
                  </p>
                </div>
              </div>

              {/* Mission */}
              <div className='flex items-start space-x-6'>
                <div className='bg-blue-100 dark:bg-blue-900/30 p-4 rounded-full'>
                  <Heart className='h-8 w-8 text-blue-600 dark:text-blue-400' />
                </div>
                <div>
                  <h3 className='text-2xl font-bold text-gray-900 dark:text-white mb-4'>
                    Empowering Others
                  </h3>
                  <p className='text-gray-700 dark:text-gray-300 leading-relaxed text-lg'>
                    Today, having helped over 10,000 students achieve their PTE
                    goals, I'm driven by the same passion that fueled my own
                    journey. Every student's success reminds me why I started
                    this mission. Whether it's a nurse trying to work abroad, a
                    student pursuing higher education, or a professional seeking
                    better opportunities, I understand the stakes involved. My
                    approach combines technical expertise with emotional support
                    because I know firsthand how challenging this journey can
                    be.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Achievements */}
      <section className='py-20 bg-gray-50 dark:bg-gray-800'>
        <div className='container mx-auto px-4'>
          <div className='text-center mb-16'>
            <h2 className='text-4xl font-bold text-gray-900 dark:text-white mb-6'>
              Achievements & Credentials
            </h2>
            <p className='text-xl text-gray-600 dark:text-gray-300'>
              Recognition and results that speak for themselves
            </p>
          </div>

          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16'>
            <div className='bg-white dark:bg-gray-900 p-8 rounded-xl shadow-lg text-center'>
              <div className='bg-blue-100 dark:bg-blue-900/30 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4'>
                <Users className='h-8 w-8 text-blue-600 dark:text-blue-400' />
              </div>
              <h3 className='text-3xl font-bold text-gray-900 dark:text-white mb-2'>
                10,000+
              </h3>
              <p className='text-gray-600 dark:text-gray-300'>
                Students Trained
              </p>
            </div>

            <div className='bg-white dark:bg-gray-900 p-8 rounded-xl shadow-lg text-center'>
              <div className='bg-green-100 dark:bg-green-900/30 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4'>
                <Trophy className='h-8 w-8 text-green-600 dark:text-green-400' />
              </div>
              <h3 className='text-3xl font-bold text-gray-900 dark:text-white mb-2'>
                95%
              </h3>
              <p className='text-gray-600 dark:text-gray-300'>Success Rate</p>
            </div>

            <div className='bg-white dark:bg-gray-900 p-8 rounded-xl shadow-lg text-center'>
              <div className='bg-purple-100 dark:bg-purple-900/30 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4'>
                <Star className='h-8 w-8 text-purple-600 dark:text-purple-400' />
              </div>
              <h3 className='text-3xl font-bold text-gray-900 dark:text-white mb-2'>
                4.9★
              </h3>
              <p className='text-gray-600 dark:text-gray-300'>Student Rating</p>
            </div>

            <div className='bg-white dark:bg-gray-900 p-8 rounded-xl shadow-lg text-center'>
              <div className='bg-orange-100 dark:bg-orange-900/30 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4'>
                <Award className='h-8 w-8 text-orange-600 dark:text-orange-400' />
              </div>
              <h3 className='text-3xl font-bold text-gray-900 dark:text-white mb-2'>
                8+
              </h3>
              <p className='text-gray-600 dark:text-gray-300'>
                Years Experience
              </p>
            </div>
          </div>

          {/* Certifications */}
          <div className='grid grid-cols-1 lg:grid-cols-2 gap-12'>
            <div>
              <h3 className='text-2xl font-bold text-gray-900 dark:text-white mb-6'>
                Professional Certifications
              </h3>
              <div className='space-y-4'>
                <div className='flex items-center space-x-3'>
                  <CheckCircle className='h-6 w-6 text-green-500' />
                  <span className='text-gray-700 dark:text-gray-300'>
                    Certified PTE Academic Trainer
                  </span>
                </div>
                <div className='flex items-center space-x-3'>
                  <CheckCircle className='h-6 w-6 text-green-500' />
                  <span className='text-gray-700 dark:text-gray-300'>
                    TESOL Certification (120 hours)
                  </span>
                </div>
                <div className='flex items-center space-x-3'>
                  <CheckCircle className='h-6 w-6 text-green-500' />
                  <span className='text-gray-700 dark:text-gray-300'>
                    Cambridge CELTA Qualified
                  </span>
                </div>
                <div className='flex items-center space-x-3'>
                  <CheckCircle className='h-6 w-6 text-green-500' />
                  <span className='text-gray-700 dark:text-gray-300'>
                    Master's in Applied Linguistics
                  </span>
                </div>
              </div>
            </div>

            <div>
              <h3 className='text-2xl font-bold text-gray-900 dark:text-white mb-6'>
                Recognition & Awards
              </h3>
              <div className='space-y-4'>
                <div className='flex items-center space-x-3'>
                  <Award className='h-6 w-6 text-blue-500' />
                  <span className='text-gray-700 dark:text-gray-300'>
                    Excellence in Language Training Award 2023
                  </span>
                </div>
                <div className='flex items-center space-x-3'>
                  <Award className='h-6 w-6 text-blue-500' />
                  <span className='text-gray-700 dark:text-gray-300'>
                    Top PTE Trainer - International Recognition
                  </span>
                </div>
                <div className='flex items-center space-x-3'>
                  <Award className='h-6 w-6 text-blue-500' />
                  <span className='text-gray-700 dark:text-gray-300'>
                    Educational Innovation Award 2022
                  </span>
                </div>
                <div className='flex items-center space-x-3'>
                  <Award className='h-6 w-6 text-blue-500' />
                  <span className='text-gray-700 dark:text-gray-300'>
                    Student Choice Award (5 consecutive years)
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Philosophy */}
      <section className='py-20 bg-white dark:bg-gray-900'>
        <div className='container mx-auto px-4'>
          <div className='max-w-4xl mx-auto text-center'>
            <h2 className='text-4xl font-bold text-gray-900 dark:text-white mb-8'>
              My Teaching Philosophy
            </h2>
            <div className='bg-blue-50 dark:bg-blue-900/20 p-8 rounded-2xl'>
              <blockquote className='text-2xl text-gray-700 dark:text-gray-300 italic leading-relaxed mb-6'>
                "Success in PTE isn't just about knowing English - it's about
                understanding the test, mastering the strategy, and building the
                confidence to perform under pressure. My role is to demystify
                the process and provide you with the tools, techniques, and
                support you need to achieve your goals."
              </blockquote>
              <div className='flex items-center justify-center space-x-4'>
                <div className='bg-blue-600 text-white w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold'>
                  S
                </div>
                <div className='text-left'>
                  <p className='font-semibold text-gray-900 dark:text-white'>
                    Sarah Johnson
                  </p>
                  <p className='text-gray-600 dark:text-gray-400'>
                    Founder & Lead Trainer, PTEbyDee
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default About;
