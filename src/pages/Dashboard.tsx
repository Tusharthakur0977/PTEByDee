import React from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Clock, Star, Trophy, Target, Calendar, Play, CheckCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { courses } from '../data/courses';

const Dashboard: React.FC = () => {
  const { user } = useAuth();

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Please log in to access your dashboard
          </h1>
          <Link to="/login" className="text-blue-600 hover:text-blue-800">
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  const enrolledCourses = courses.filter(course => user.enrolledCourses?.includes(course.id));
  const recommendedCourses = courses.filter(course => !user.enrolledCourses?.includes(course.id)).slice(0, 3);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="container mx-auto px-4">
        {/* Welcome Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-2xl p-8 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">Welcome back, {user.name}!</h1>
              <p className="text-blue-100 text-lg">Continue your PTE journey and achieve your goals</p>
            </div>
            <div className="hidden md:block">
              <div className="bg-white bg-opacity-20 backdrop-blur-sm rounded-xl p-6">
                <div className="flex items-center space-x-2 mb-2">
                  <Trophy className="h-6 w-6 text-yellow-300" />
                  <span className="font-semibold">Current Progress</span>
                </div>
                <div className="text-2xl font-bold">{enrolledCourses.length} Courses</div>
                <div className="text-sm text-blue-100">Keep learning!</div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg text-center">
                <div className="bg-blue-100 dark:bg-blue-900/30 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                  <BookOpen className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">{enrolledCourses.length}</div>
                <div className="text-sm text-gray-600 dark:text-gray-300">Enrolled Courses</div>
              </div>

              <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg text-center">
                <div className="bg-green-100 dark:bg-green-900/30 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Clock className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">24</div>
                <div className="text-sm text-gray-600 dark:text-gray-300">Hours Studied</div>
              </div>

              <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg text-center">
                <div className="bg-purple-100 dark:bg-purple-900/30 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Target className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                </div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">85%</div>
                <div className="text-sm text-gray-600 dark:text-gray-300">Avg. Progress</div>
              </div>

              <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg text-center">
                <div className="bg-orange-100 dark:bg-orange-900/30 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Star className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                </div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">4.8</div>
                <div className="text-sm text-gray-600 dark:text-gray-300">Avg. Score</div>
              </div>
            </div>

            {/* Enrolled Courses */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">My Courses</h2>
              {enrolledCourses.length > 0 ? (
                <div className="space-y-4">
                  {enrolledCourses.map((course) => (
                    <div key={course.id} className="border dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow duration-200">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                            {course.title}
                          </h3>
                          <p className="text-gray-600 dark:text-gray-300 mb-3 line-clamp-2">
                            {course.description}
                          </p>
                          <div className="flex items-center space-x-4 mb-3">
                            <span className="flex items-center space-x-1 text-sm text-gray-500 dark:text-gray-400">
                              <Clock className="h-4 w-4" />
                              <span>{course.duration}</span>
                            </span>
                            <span className="flex items-center space-x-1 text-sm text-gray-500 dark:text-gray-400">
                              <Star className="h-4 w-4 fill-current text-yellow-400" />
                              <span>{course.rating}</span>
                            </span>
                            <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 text-xs rounded-md">
                              {course.level}
                            </span>
                          </div>
                          {/* Progress Bar */}
                          <div className="mb-3">
                            <div className="flex justify-between text-sm text-gray-600 dark:text-gray-300 mb-1">
                              <span>Progress</span>
                              <span>75%</span>
                            </div>
                            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                              <div className="bg-blue-600 h-2 rounded-full" style={{ width: '75%' }}></div>
                            </div>
                          </div>
                        </div>
                        <div className="ml-4 flex flex-col space-y-2">
                          <Link
                            to={`/courses/${course.id}`}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200 flex items-center space-x-1"
                          >
                            <Play className="h-4 w-4" />
                            <span>Continue</span>
                          </Link>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <BookOpen className="h-16 w-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    No Enrolled Courses
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 mb-4">
                    Start your PTE journey by enrolling in a course
                  </p>
                  <Link
                    to="/courses"
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md font-medium transition-colors duration-200"
                  >
                    Browse Courses
                  </Link>
                </div>
              )}
            </div>

            {/* Recent Activity */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Recent Activity</h2>
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="bg-green-100 dark:bg-green-900/30 p-2 rounded-full">
                    <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <p className="text-gray-900 dark:text-white font-medium">Completed "Speaking Module 1"</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">2 hours ago</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-full">
                    <Play className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <p className="text-gray-900 dark:text-white font-medium">Started "Writing Excellence Course"</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">1 day ago</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="bg-purple-100 dark:bg-purple-900/30 p-2 rounded-full">
                    <Trophy className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <p className="text-gray-900 dark:text-white font-medium">Achieved 90% in Mock Test #3</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">3 days ago</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Study Plan */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Today's Study Plan</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Calendar className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    <span className="text-gray-900 dark:text-white font-medium">Speaking Practice</span>
                  </div>
                  <span className="text-sm text-blue-600 dark:text-blue-400">30 min</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <BookOpen className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                    <span className="text-gray-900 dark:text-white font-medium">Writing Exercise</span>
                  </div>
                  <span className="text-sm text-gray-600 dark:text-gray-400">45 min</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Target className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                    <span className="text-gray-900 dark:text-white font-medium">Mock Test Review</span>
                  </div>
                  <span className="text-sm text-gray-600 dark:text-gray-400">20 min</span>
                </div>
              </div>
            </div>

            {/* Recommended Courses */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Recommended for You</h3>
              <div className="space-y-4">
                {recommendedCourses.map((course) => (
                  <div key={course.id} className="border dark:border-gray-700 rounded-lg p-3">
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-1 text-sm">
                      {course.title}
                    </h4>
                    <p className="text-xs text-gray-600 dark:text-gray-300 mb-2 line-clamp-2">
                      {course.description}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-blue-600 dark:text-blue-400">
                        ${course.price}
                      </span>
                      <Link
                        to={`/courses/${course.id}`}
                        className="text-xs bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-md transition-colors duration-200"
                      >
                        View
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
              <Link
                to="/courses"
                className="block mt-4 text-center text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 text-sm font-medium"
              >
                View All Courses →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;