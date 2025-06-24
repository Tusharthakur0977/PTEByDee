import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { Clock, Users, Star, BookOpen, CheckCircle, Play, ArrowLeft, Video, FileText, HelpCircle, PenTool } from 'lucide-react';
import { courses } from '../data/courses';
import { useAuth } from '../contexts/AuthContext';
import VideoPlayer from '../components/VideoPlayer';

const CourseDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const course = courses.find(c => c.id === id);

  if (!course) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Course Not Found</h1>
          <Link to="/courses" className="text-blue-600 hover:text-blue-800">
            Back to Courses
          </Link>
        </div>
      </div>
    );
  }

  const isEnrolled = user?.enrolledCourses?.includes(course.id) || false;
  const discount = course.originalPrice ? Math.round(((course.originalPrice - course.price) / course.originalPrice) * 100) : 0;

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'video':
        return <Video className="h-4 w-4" />;
      case 'quiz':
        return <HelpCircle className="h-4 w-4" />;
      case 'assignment':
        return <PenTool className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'video':
        return 'text-blue-600 dark:text-blue-400';
      case 'quiz':
        return 'text-green-600 dark:text-green-400';
      case 'assignment':
        return 'text-purple-600 dark:text-purple-400';
      default:
        return 'text-gray-600 dark:text-gray-400';
    }
  };

  return (
    <div className="min-h-screen py-8">
      <div className="container mx-auto px-4">
        {/* Back Button */}
        <Link
          to="/courses"
          className="inline-flex items-center space-x-2 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 mb-8"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Courses</span>
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Course Header */}
            <div>
              <div className="flex items-center space-x-4 mb-4">
                <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 text-sm font-medium rounded-full">
                  {course.level}
                </span>
                <div className="flex items-center space-x-1">
                  <Star className="h-4 w-4 fill-current text-yellow-400" />
                  <span className="text-sm font-medium text-gray-900 dark:text-white">{course.rating}</span>
                  <span className="text-sm text-gray-500 dark:text-gray-400">({course.students} students)</span>
                </div>
              </div>
              <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
                {course.title}
              </h1>
              <p className="text-xl text-gray-600 dark:text-gray-300 leading-relaxed">
                {course.detailedDescription}
              </p>
            </div>

            {/* Course Preview Video */}
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                Course Preview
              </h2>
              <VideoPlayer
                videoUrl={course.curriculum[0]?.lessons[0]?.videoUrl}
                title={course.curriculum[0]?.lessons[0]?.title || 'Course Introduction'}
                duration={course.curriculum[0]?.lessons[0]?.duration}
                isPreview={true}
                isEnrolled={isEnrolled}
              />
            </div>

            {/* Course Features */}
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                What You'll Learn
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {course.features.map((feature, index) => (
                  <div key={index} className="flex items-start space-x-3">
                    <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700 dark:text-gray-300">{feature}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Curriculum */}
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                Course Curriculum
              </h2>
              <div className="space-y-4">
                {course.curriculum.map((module, index) => (
                  <div key={index} className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
                    <div className="bg-gray-50 dark:bg-gray-700 px-6 py-4 border-b dark:border-gray-600">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        Module {index + 1}: {module.title}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        {module.lessons.length} lessons
                      </p>
                    </div>
                    <div className="p-6">
                      <ul className="space-y-4">
                        {module.lessons.map((lesson, lessonIndex) => (
                          <li key={lessonIndex} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                            <div className="flex items-center space-x-3">
                              <div className={`${getTypeColor(lesson.type)}`}>
                                {getTypeIcon(lesson.type)}
                              </div>
                              <div>
                                <span className="text-gray-900 dark:text-white font-medium">
                                  {lesson.title}
                                </span>
                                {lesson.duration && (
                                  <p className="text-sm text-gray-500 dark:text-gray-400">
                                    {lesson.duration}
                                  </p>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              {lesson.isPreview && (
                                <span className="text-xs bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 px-2 py-1 rounded-full">
                                  Preview
                                </span>
                              )}
                              {lesson.type === 'video' && lesson.videoUrl && (
                                <button
                                  className={`p-2 rounded-full transition-colors duration-200 ${
                                    lesson.isPreview || isEnrolled
                                      ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-900/50'
                                      : 'bg-gray-200 dark:bg-gray-600 text-gray-400 cursor-not-allowed'
                                  }`}
                                  disabled={!lesson.isPreview && !isEnrolled}
                                >
                                  <Play className="h-4 w-4" />
                                </button>
                              )}
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Instructor */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                Your Instructor
              </h2>
              <div className="flex items-start space-x-4">
                <div className="bg-blue-600 text-white w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold">
                  {course.instructor.name.charAt(0)}
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                    {course.instructor.name}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 mb-2">
                    {course.instructor.experience} of teaching experience
                  </p>
                  <p className="text-gray-700 dark:text-gray-300">
                    {course.instructor.bio}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 sticky top-24">
              {/* Price */}
              <div className="text-center mb-6">
                <div className="flex items-center justify-center space-x-2 mb-2">
                  <span className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                    ${course.price}
                  </span>
                  {course.originalPrice && (
                    <span className="text-xl text-gray-500 dark:text-gray-400 line-through">
                      ${course.originalPrice}
                    </span>
                  )}
                </div>
                {discount > 0 && (
                  <span className="inline-block bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 px-2 py-1 rounded-md text-sm font-semibold">
                    {discount}% OFF
                  </span>
                )}
              </div>

              {/* Course Info */}
              <div className="space-y-4 mb-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Clock className="h-5 w-5 text-gray-400" />
                    <span className="text-gray-700 dark:text-gray-300">Duration</span>
                  </div>
                  <span className="font-medium text-gray-900 dark:text-white">{course.duration}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Users className="h-5 w-5 text-gray-400" />
                    <span className="text-gray-700 dark:text-gray-300">Students</span>
                  </div>
                  <span className="font-medium text-gray-900 dark:text-white">{course.students}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <BookOpen className="h-5 w-5 text-gray-400" />
                    <span className="text-gray-700 dark:text-gray-300">Level</span>
                  </div>
                  <span className="font-medium text-gray-900 dark:text-white">{course.level}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Video className="h-5 w-5 text-gray-400" />
                    <span className="text-gray-700 dark:text-gray-300">Videos</span>
                  </div>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {course.curriculum.reduce((total, module) => 
                      total + module.lessons.filter(lesson => lesson.type === 'video').length, 0
                    )}
                  </span>
                </div>
              </div>

              {/* Enroll Button */}
              {user ? (
                isEnrolled ? (
                  <Link
                    to="/dashboard"
                    className="w-full bg-green-600 hover:bg-green-700 text-white py-3 px-4 rounded-lg font-semibold text-center block transition-colors duration-200"
                  >
                    Go to Dashboard
                  </Link>
                ) : (
                  <button className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-lg font-semibold transition-colors duration-200">
                    Enroll Now
                  </button>
                )
              ) : (
                <div className="space-y-3">
                  <Link
                    to="/register"
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-lg font-semibold text-center block transition-colors duration-200"
                  >
                    Sign Up to Enroll
                  </Link>
                  <Link
                    to="/login"
                    className="w-full border border-blue-600 text-blue-600 dark:text-blue-400 py-3 px-4 rounded-lg font-semibold text-center block hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors duration-200"
                  >
                    Already have an account?
                  </Link>
                </div>
              )}

              {/* 30-day guarantee */}
              <div className="mt-6 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                  <span className="font-semibold text-green-800 dark:text-green-300">30-Day Money Back Guarantee</span>
                </div>
                <p className="text-sm text-green-700 dark:text-green-300">
                  Not satisfied? Get a full refund within 30 days of purchase.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourseDetail;