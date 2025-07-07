import {
  AlertCircle,
  BarChart3,
  CheckCircle,
  Clock,
  Download,
  RotateCcw,
  Share2,
  Target,
  TrendingUp,
  Trophy,
} from 'lucide-react';
import React from 'react';
import { Link, useParams } from 'react-router-dom';
import { mockTests } from '../data/mockPte';

const TestResults: React.FC = () => {
  const { testId } = useParams<{ testId: string }>();

  const test = mockTests.find((t) => t.id === testId);

  // Mock results data
  const results = {
    overallScore: 82,
    speakingScore: 85,
    writingScore: 78,
    readingScore: 84,
    listeningScore: 81,
    grammarScore: 79,
    oralFluencyScore: 88,
    pronunciationScore: 82,
    vocabularyScore: 85,
    discourseScore: 76,
    spellingScore: 83,
    timeTaken: 165, // minutes
    completedAt: new Date().toISOString(),
    strengths: [
      'Excellent oral fluency and pronunciation',
      'Strong vocabulary usage',
      'Good reading comprehension',
    ],
    weaknesses: [
      'Grammar accuracy needs improvement',
      'Discourse organization could be better',
      'Writing coherence requires attention',
    ],
    suggestions: [
      'Practice complex sentence structures',
      'Focus on essay organization techniques',
      'Review grammar rules for common errors',
      'Work on connecting ideas smoothly',
    ],
  };

  if (!test) {
    return (
      <div className='min-h-screen flex items-center justify-center'>
        <div className='text-center'>
          <h1 className='text-2xl font-bold text-gray-900 dark:text-white mb-4'>
            Test Not Found
          </h1>
          <Link
            to='/portal'
            className='text-blue-600 hover:text-blue-800'
          >
            Back to Portal
          </Link>
        </div>
      </div>
    );
  }

  const getScoreColor = (score: number) => {
    if (score >= 85) return 'text-green-600 dark:text-green-400';
    if (score >= 70) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getScoreBg = (score: number) => {
    if (score >= 85) return 'bg-green-100 dark:bg-green-900/30';
    if (score >= 70) return 'bg-yellow-100 dark:bg-yellow-900/30';
    return 'bg-red-100 dark:bg-red-900/30';
  };

  return (
    <div className='min-h-screen bg-gray-50 dark:bg-gray-900 py-8'>
      <div className='container mx-auto px-4 max-w-6xl'>
        {/* Header */}
        <div className='text-center mb-8'>
          <div className='flex items-center justify-center mb-4'>
            <div
              className={`p-4 rounded-full ${getScoreBg(results.overallScore)}`}
            >
              <Trophy
                className={`h-12 w-12 ${getScoreColor(results.overallScore)}`}
              />
            </div>
          </div>
          <h1 className='text-3xl font-bold text-gray-900 dark:text-white mb-2'>
            Test Results
          </h1>
          <h2 className='text-xl text-gray-600 dark:text-gray-300 mb-4'>
            {test.title}
          </h2>
          <div className='flex items-center justify-center space-x-6 text-sm text-gray-500 dark:text-gray-400'>
            <div className='flex items-center space-x-1'>
              <Clock className='h-4 w-4' />
              <span>Completed in {results.timeTaken} minutes</span>
            </div>
            <div className='flex items-center space-x-1'>
              <CheckCircle className='h-4 w-4' />
              <span>All questions answered</span>
            </div>
          </div>
        </div>

        {/* Overall Score */}
        <div className='bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 mb-8 text-center'>
          <h3 className='text-lg font-semibold text-gray-900 dark:text-white mb-4'>
            Overall Score
          </h3>
          <div className='relative inline-block'>
            <div className='w-32 h-32 rounded-full border-8 border-gray-200 dark:border-gray-700 flex items-center justify-center'>
              <div className='text-center'>
                <div
                  className={`text-4xl font-bold ${getScoreColor(
                    results.overallScore
                  )}`}
                >
                  {results.overallScore}
                </div>
                <div className='text-sm text-gray-500 dark:text-gray-400'>
                  out of 90
                </div>
              </div>
            </div>
            <div
              className={`absolute inset-0 rounded-full border-8 border-transparent ${
                results.overallScore >= 85
                  ? 'border-t-green-500 border-r-green-500'
                  : results.overallScore >= 70
                  ? 'border-t-yellow-500 border-r-yellow-500'
                  : 'border-t-red-500 border-r-red-500'
              }`}
              style={{
                transform: `rotate(${(results.overallScore / 90) * 360}deg)`,
                clipPath: 'polygon(50% 50%, 50% 0%, 100% 0%, 100% 50%)',
              }}
            ></div>
          </div>
          <p className='text-gray-600 dark:text-gray-300 mt-4'>
            {results.overallScore >= 85
              ? 'Excellent performance!'
              : results.overallScore >= 70
              ? 'Good performance!'
              : 'Keep practicing to improve!'}
          </p>
        </div>

        <div className='grid grid-cols-1 lg:grid-cols-2 gap-8'>
          {/* Communicative Skills */}
          <div className='bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6'>
            <h3 className='text-lg font-semibold text-gray-900 dark:text-white mb-6 flex items-center space-x-2'>
              <Target className='h-5 w-5' />
              <span>Communicative Skills</span>
            </h3>
            <div className='space-y-4'>
              <div className='flex items-center justify-between'>
                <span className='text-gray-700 dark:text-gray-300'>
                  Speaking
                </span>
                <div className='flex items-center space-x-2'>
                  <div className='w-24 bg-gray-200 dark:bg-gray-700 rounded-full h-2'>
                    <div
                      className='bg-blue-600 h-2 rounded-full'
                      style={{
                        width: `${(results.speakingScore / 90) * 100}%`,
                      }}
                    ></div>
                  </div>
                  <span
                    className={`font-semibold ${getScoreColor(
                      results.speakingScore
                    )}`}
                  >
                    {results.speakingScore}
                  </span>
                </div>
              </div>
              <div className='flex items-center justify-between'>
                <span className='text-gray-700 dark:text-gray-300'>
                  Writing
                </span>
                <div className='flex items-center space-x-2'>
                  <div className='w-24 bg-gray-200 dark:bg-gray-700 rounded-full h-2'>
                    <div
                      className='bg-green-600 h-2 rounded-full'
                      style={{ width: `${(results.writingScore / 90) * 100}%` }}
                    ></div>
                  </div>
                  <span
                    className={`font-semibold ${getScoreColor(
                      results.writingScore
                    )}`}
                  >
                    {results.writingScore}
                  </span>
                </div>
              </div>
              <div className='flex items-center justify-between'>
                <span className='text-gray-700 dark:text-gray-300'>
                  Reading
                </span>
                <div className='flex items-center space-x-2'>
                  <div className='w-24 bg-gray-200 dark:bg-gray-700 rounded-full h-2'>
                    <div
                      className='bg-purple-600 h-2 rounded-full'
                      style={{ width: `${(results.readingScore / 90) * 100}%` }}
                    ></div>
                  </div>
                  <span
                    className={`font-semibold ${getScoreColor(
                      results.readingScore
                    )}`}
                  >
                    {results.readingScore}
                  </span>
                </div>
              </div>
              <div className='flex items-center justify-between'>
                <span className='text-gray-700 dark:text-gray-300'>
                  Listening
                </span>
                <div className='flex items-center space-x-2'>
                  <div className='w-24 bg-gray-200 dark:bg-gray-700 rounded-full h-2'>
                    <div
                      className='bg-orange-600 h-2 rounded-full'
                      style={{
                        width: `${(results.listeningScore / 90) * 100}%`,
                      }}
                    ></div>
                  </div>
                  <span
                    className={`font-semibold ${getScoreColor(
                      results.listeningScore
                    )}`}
                  >
                    {results.listeningScore}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Enabling Skills */}
          <div className='bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6'>
            <h3 className='text-lg font-semibold text-gray-900 dark:text-white mb-6 flex items-center space-x-2'>
              <BarChart3 className='h-5 w-5' />
              <span>Enabling Skills</span>
            </h3>
            <div className='space-y-4'>
              <div className='flex items-center justify-between'>
                <span className='text-gray-700 dark:text-gray-300'>
                  Grammar
                </span>
                <div className='flex items-center space-x-2'>
                  <div className='w-24 bg-gray-200 dark:bg-gray-700 rounded-full h-2'>
                    <div
                      className='bg-red-600 h-2 rounded-full'
                      style={{ width: `${(results.grammarScore / 90) * 100}%` }}
                    ></div>
                  </div>
                  <span
                    className={`font-semibold ${getScoreColor(
                      results.grammarScore
                    )}`}
                  >
                    {results.grammarScore}
                  </span>
                </div>
              </div>
              <div className='flex items-center justify-between'>
                <span className='text-gray-700 dark:text-gray-300'>
                  Oral Fluency
                </span>
                <div className='flex items-center space-x-2'>
                  <div className='w-24 bg-gray-200 dark:bg-gray-700 rounded-full h-2'>
                    <div
                      className='bg-green-600 h-2 rounded-full'
                      style={{
                        width: `${(results.oralFluencyScore / 90) * 100}%`,
                      }}
                    ></div>
                  </div>
                  <span
                    className={`font-semibold ${getScoreColor(
                      results.oralFluencyScore
                    )}`}
                  >
                    {results.oralFluencyScore}
                  </span>
                </div>
              </div>
              <div className='flex items-center justify-between'>
                <span className='text-gray-700 dark:text-gray-300'>
                  Pronunciation
                </span>
                <div className='flex items-center space-x-2'>
                  <div className='w-24 bg-gray-200 dark:bg-gray-700 rounded-full h-2'>
                    <div
                      className='bg-blue-600 h-2 rounded-full'
                      style={{
                        width: `${(results.pronunciationScore / 90) * 100}%`,
                      }}
                    ></div>
                  </div>
                  <span
                    className={`font-semibold ${getScoreColor(
                      results.pronunciationScore
                    )}`}
                  >
                    {results.pronunciationScore}
                  </span>
                </div>
              </div>
              <div className='flex items-center justify-between'>
                <span className='text-gray-700 dark:text-gray-300'>
                  Vocabulary
                </span>
                <div className='flex items-center space-x-2'>
                  <div className='w-24 bg-gray-200 dark:bg-gray-700 rounded-full h-2'>
                    <div
                      className='bg-purple-600 h-2 rounded-full'
                      style={{
                        width: `${(results.vocabularyScore / 90) * 100}%`,
                      }}
                    ></div>
                  </div>
                  <span
                    className={`font-semibold ${getScoreColor(
                      results.vocabularyScore
                    )}`}
                  >
                    {results.vocabularyScore}
                  </span>
                </div>
              </div>
              <div className='flex items-center justify-between'>
                <span className='text-gray-700 dark:text-gray-300'>
                  Spelling
                </span>
                <div className='flex items-center space-x-2'>
                  <div className='w-24 bg-gray-200 dark:bg-gray-700 rounded-full h-2'>
                    <div
                      className='bg-yellow-600 h-2 rounded-full'
                      style={{
                        width: `${(results.spellingScore / 90) * 100}%`,
                      }}
                    ></div>
                  </div>
                  <span
                    className={`font-semibold ${getScoreColor(
                      results.spellingScore
                    )}`}
                  >
                    {results.spellingScore}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Detailed Feedback */}
        <div className='grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8'>
          {/* Strengths */}
          <div className='bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6'>
            <h3 className='text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center space-x-2'>
              <CheckCircle className='h-5 w-5 text-green-600 dark:text-green-400' />
              <span>Strengths</span>
            </h3>
            <ul className='space-y-3'>
              {results.strengths.map((strength, index) => (
                <li
                  key={index}
                  className='flex items-start space-x-2'
                >
                  <div className='w-2 h-2 bg-green-500 rounded-full mt-2'></div>
                  <span className='text-gray-700 dark:text-gray-300'>
                    {strength}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* Areas for Improvement */}
          <div className='bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6'>
            <h3 className='text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center space-x-2'>
              <AlertCircle className='h-5 w-5 text-orange-600 dark:text-orange-400' />
              <span>Areas for Improvement</span>
            </h3>
            <ul className='space-y-3'>
              {results.weaknesses.map((weakness, index) => (
                <li
                  key={index}
                  className='flex items-start space-x-2'
                >
                  <div className='w-2 h-2 bg-orange-500 rounded-full mt-2'></div>
                  <span className='text-gray-700 dark:text-gray-300'>
                    {weakness}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Suggestions */}
        <div className='bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mt-8'>
          <h3 className='text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center space-x-2'>
            <TrendingUp className='h-5 w-5 text-blue-600 dark:text-blue-400' />
            <span>Recommendations for Improvement</span>
          </h3>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            {results.suggestions.map((suggestion, index) => (
              <div
                key={index}
                className='flex items-start space-x-3 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg'
              >
                <div className='w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-semibold'>
                  {index + 1}
                </div>
                <span className='text-gray-700 dark:text-gray-300'>
                  {suggestion}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className='flex flex-wrap items-center justify-center gap-4 mt-8'>
          <button className='flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200'>
            <Download className='h-4 w-4' />
            <span>Download Report</span>
          </button>
          <button className='flex items-center space-x-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 px-6 py-3 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200'>
            <Share2 className='h-4 w-4' />
            <span>Share Results</span>
          </button>
          <Link
            to={`/portal/test/${testId}/instructions`}
            className='flex items-center space-x-2 border border-blue-600 text-blue-600 dark:text-blue-400 px-6 py-3 rounded-lg font-medium hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors duration-200'
          >
            <RotateCcw className='h-4 w-4' />
            <span>Retake Test</span>
          </Link>
          <Link
            to='/portal'
            className='flex items-center space-x-2 bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200'
          >
            <span>Back to Portal</span>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default TestResults;
