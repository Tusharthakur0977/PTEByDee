import React from 'react';
import { Link } from 'react-router-dom';
import {
  Star,
  Users,
  BookOpen,
  Trophy,
  ArrowRight,
  CheckCircle,
} from 'lucide-react';
import CourseCard from '../components/CourseCard';
import { courses } from '../data/courses';

const Home: React.FC = () => {
  const featuredCourses = courses.slice(0, 3);

  return (
    <div className='min-h-screen'>
      {/* Hero Section */}
      <section className='bg-gradient-to-br from-blue-600 via-purple-600 to-blue-800 text-white py-20'>
        <div className='container mx-auto px-4'>
          <div className='grid grid-cols-1 lg:grid-cols-2 gap-12 items-center'>
            <div className='space-y-8'>
              <h1 className='text-5xl lg:text-6xl font-bold leading-tight'>
                Master the
                <span className='block text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-orange-300'>
                  PTE Academic
                </span>
                Test
              </h1>
              <p className='text-xl text-blue-100 leading-relaxed'>
                Achieve your target score with expert-led courses, comprehensive
                practice materials, and proven strategies trusted by thousands
                of successful students.
              </p>
              <div className='flex flex-col sm:flex-row gap-4'>
                <Link
                  to='/courses'
                  className='bg-white text-blue-600 px-8 py-4 rounded-lg font-semibold text-lg hover:bg-blue-50 transition-colors duration-200 flex items-center justify-center space-x-2'
                >
                  <BookOpen className='h-5 w-5' />
                  <span>Explore Courses</span>
                </Link>
                <Link
                  to='/about'
                  className='border-2 border-white text-white px-8 py-4 rounded-lg font-semibold text-lg hover:bg-white hover:text-blue-600 transition-colors duration-200 flex items-center justify-center space-x-2'
                >
                  <span>Learn More</span>
                  <ArrowRight className='h-5 w-5' />
                </Link>
              </div>
            </div>
            <div className='relative'>
              <img
                src='https://images.pexels.com/photos/3184306/pexels-photo-3184306.jpeg?auto=compress&cs=tinysrgb&w=600'
                alt='Student studying'
                className='rounded-2xl shadow-2xl'
              />
              <div className='absolute -bottom-6 -left-6 bg-white text-gray-900 p-6 rounded-xl shadow-xl'>
                <div className='flex items-center space-x-2 mb-2'>
                  <Trophy className='h-6 w-6 text-yellow-500' />
                  <span className='font-bold text-lg'>95% Success Rate</span>
                </div>
                <p className='text-gray-600'>
                  Students achieve their target scores
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className='py-16 bg-white dark:bg-gray-900'>
        <div className='container mx-auto px-4'>
          <div className='grid grid-cols-2 md:grid-cols-4 gap-8'>
            <div className='text-center'>
              <div className='text-4xl font-bold text-blue-600 dark:text-blue-400 mb-2'>
                10,000+
              </div>
              <div className='text-gray-600 dark:text-gray-300 font-medium'>
                Students Trained
              </div>
            </div>
            <div className='text-center'>
              <div className='text-4xl font-bold text-green-600 dark:text-green-400 mb-2'>
                95%
              </div>
              <div className='text-gray-600 dark:text-gray-300 font-medium'>
                Success Rate
              </div>
            </div>
            <div className='text-center'>
              <div className='text-4xl font-bold text-purple-600 dark:text-purple-400 mb-2'>
                4.8★
              </div>
              <div className='text-gray-600 dark:text-gray-300 font-medium'>
                Average Rating
              </div>
            </div>
            <div className='text-center'>
              <div className='text-4xl font-bold text-orange-600 dark:text-orange-400 mb-2'>
                8+
              </div>
              <div className='text-gray-600 dark:text-gray-300 font-medium'>
                Years Experience
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Courses */}
      <section className='py-20 bg-gray-50 dark:bg-gray-800'>
        <div className='container mx-auto px-4'>
          <div className='text-center mb-16'>
            <h2 className='text-4xl font-bold text-gray-900 dark:text-white mb-4'>
              Featured Courses
            </h2>
            <p className='text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto'>
              Discover our most popular PTE preparation courses designed to help
              you achieve your target score efficiently.
            </p>
          </div>
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12'>
            {featuredCourses.map((course) => (
              <CourseCard
                key={course.id}
                course={course}
              />
            ))}
          </div>
          <div className='text-center'>
            <Link
              to='/courses'
              className='inline-flex items-center space-x-2 bg-blue-600 text-white px-8 py-4 rounded-lg font-semibold text-lg hover:bg-blue-700 transition-colors duration-200'
            >
              <span>View All Courses</span>
              <ArrowRight className='h-5 w-5' />
            </Link>
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className='py-20 bg-white dark:bg-gray-900'>
        <div className='container mx-auto px-4'>
          <div className='grid grid-cols-1 lg:grid-cols-2 gap-16 items-center'>
            <div>
              <h2 className='text-4xl font-bold text-gray-900 dark:text-white mb-8'>
                Why Students Choose PTEbyDee
              </h2>
              <div className='space-y-6'>
                <div className='flex items-start space-x-4'>
                  <CheckCircle className='h-6 w-6 text-green-500 mt-1 flex-shrink-0' />
                  <div>
                    <h3 className='text-xl font-semibold text-gray-900 dark:text-white mb-2'>
                      Expert Instructors
                    </h3>
                    <p className='text-gray-600 dark:text-gray-300'>
                      Learn from certified PTE trainers with years of experience
                      and proven track records.
                    </p>
                  </div>
                </div>
                <div className='flex items-start space-x-4'>
                  <CheckCircle className='h-6 w-6 text-green-500 mt-1 flex-shrink-0' />
                  <div>
                    <h3 className='text-xl font-semibold text-gray-900 dark:text-white mb-2'>
                      Comprehensive Materials
                    </h3>
                    <p className='text-gray-600 dark:text-gray-300'>
                      Access to extensive practice questions, mock tests, and
                      study resources.
                    </p>
                  </div>
                </div>
                <div className='flex items-start space-x-4'>
                  <CheckCircle className='h-6 w-6 text-green-500 mt-1 flex-shrink-0' />
                  <div>
                    <h3 className='text-xl font-semibold text-gray-900 dark:text-white mb-2'>
                      Personalized Learning
                    </h3>
                    <p className='text-gray-600 dark:text-gray-300'>
                      Customized study plans and feedback tailored to your
                      specific needs and goals.
                    </p>
                  </div>
                </div>
                <div className='flex items-start space-x-4'>
                  <CheckCircle className='h-6 w-6 text-green-500 mt-1 flex-shrink-0' />
                  <div>
                    <h3 className='text-xl font-semibold text-gray-900 dark:text-white mb-2'>
                      Proven Results
                    </h3>
                    <p className='text-gray-600 dark:text-gray-300'>
                      95% of our students achieve their target scores within
                      their first attempt.
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <div className='relative'>
              <img
                src='https://images.pexels.com/photos/3184338/pexels-photo-3184338.jpeg?auto=compress&cs=tinysrgb&w=600'
                alt='Students learning'
                className='rounded-2xl shadow-2xl'
              />
              <div className='absolute top-6 right-6 bg-blue-600 text-white p-4 rounded-xl shadow-lg'>
                <div className='flex items-center space-x-2'>
                  <Star className='h-5 w-5 fill-current text-yellow-300' />
                  <span className='font-bold'>4.8/5</span>
                </div>
                <p className='text-sm text-blue-100'>Student Rating</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className='py-20 bg-gradient-to-r from-blue-600 to-purple-600 text-white'>
        <div className='container mx-auto px-4 text-center'>
          <h2 className='text-4xl font-bold mb-6'>
            Ready to Achieve Your PTE Goals?
          </h2>
          <p className='text-xl text-blue-100 mb-8 max-w-2xl mx-auto'>
            Join thousands of successful students who have achieved their target
            PTE scores with our expert guidance.
          </p>
          <div className='flex flex-col sm:flex-row gap-4 justify-center'>
            <Link
              to='/courses'
              className='bg-white text-blue-600 px-8 py-4 rounded-lg font-semibold text-lg hover:bg-blue-50 transition-colors duration-200 inline-flex items-center justify-center space-x-2'
            >
              <BookOpen className='h-5 w-5' />
              <span>Start Learning Today</span>
            </Link>
            <Link
              to='/register'
              className='border-2 border-white text-white px-8 py-4 rounded-lg font-semibold text-lg hover:bg-white hover:text-blue-600 transition-colors duration-200 inline-flex items-center justify-center space-x-2'
            >
              <Users className='h-5 w-5' />
              <span>Create Free Account</span>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
