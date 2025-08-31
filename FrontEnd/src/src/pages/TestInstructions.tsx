import {
  AlertTriangle,
  ArrowRight,
  CheckCircle,
  Clock,
  Headphones,
  Mic,
  Monitor,
  Volume2,
} from 'lucide-react';
import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { mockTests } from '../data/mockPte';

const TestInstructions: React.FC = () => {
  const { testId } = useParams<{ testId: string }>();
  const navigate = useNavigate();
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});
  const [isReady, setIsReady] = useState(false);

  const test = mockTests.find((t) => t.id === testId);

  if (!test) {
    return (
      <div className='min-h-screen flex items-center justify-center'>
        <div className='text-center'>
          <h1 className='text-2xl font-bold text-gray-900 dark:text-white mb-4'>
            Test Not Found
          </h1>
          <button
            onClick={() => navigate('/portal')}
            className='text-blue-600 hover:text-blue-800'
          >
            Back to Portal
          </button>
        </div>
      </div>
    );
  }

  const handleCheckItem = (item: string) => {
    const newCheckedItems = { ...checkedItems, [item]: !checkedItems[item] };
    setCheckedItems(newCheckedItems);

    // Check if all required items are checked
    const requiredItems = [
      'audio',
      'microphone',
      'environment',
      'time',
      'instructions',
    ];
    const allChecked = requiredItems.every((item) => newCheckedItems[item]);
    setIsReady(allChecked);
  };

  const startTest = () => {
    navigate(`/portal/test/${testId}/question/1`);
  };

  return (
    <div className='min-h-screen bg-gray-50 dark:bg-gray-900 py-8'>
      <div className='container mx-auto px-4 max-w-4xl'>
        {/* Header */}
        <div className='text-center mb-8'>
          <h1 className='text-3xl font-bold text-gray-900 dark:text-white mb-2'>
            Test Instructions
          </h1>
          <h2 className='text-xl text-gray-600 dark:text-gray-300 mb-4'>
            {test.title}
          </h2>
          <div className='flex items-center justify-center space-x-6 text-sm text-gray-500 dark:text-gray-400'>
            <div className='flex items-center space-x-1'>
              <Clock className='h-4 w-4' />
              <span>{test.totalDuration} minutes</span>
            </div>
            <div className='flex items-center space-x-1'>
              <CheckCircle className='h-4 w-4' />
              <span>{test.questions.length} questions</span>
            </div>
          </div>
        </div>

        {/* System Requirements Check */}
        <div className='bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-6'>
          <h3 className='text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center space-x-2'>
            <Monitor className='h-5 w-5' />
            <span>System Requirements Check</span>
          </h3>
          <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
            <div className='flex items-center space-x-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg'>
              <CheckCircle className='h-5 w-5 text-green-600 dark:text-green-400' />
              <div>
                <p className='font-medium text-gray-900 dark:text-white'>
                  Browser
                </p>
                <p className='text-sm text-gray-600 dark:text-gray-300'>
                  Compatible
                </p>
              </div>
            </div>
            <div className='flex items-center space-x-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg'>
              <CheckCircle className='h-5 w-5 text-green-600 dark:text-green-400' />
              <div>
                <p className='font-medium text-gray-900 dark:text-white'>
                  Internet
                </p>
                <p className='text-sm text-gray-600 dark:text-gray-300'>
                  Stable Connection
                </p>
              </div>
            </div>
            <div className='flex items-center space-x-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg'>
              <CheckCircle className='h-5 w-5 text-green-600 dark:text-green-400' />
              <div>
                <p className='font-medium text-gray-900 dark:text-white'>
                  Screen
                </p>
                <p className='text-sm text-gray-600 dark:text-gray-300'>
                  Optimal Size
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Pre-Test Checklist */}
        <div className='bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-6'>
          <h3 className='text-lg font-semibold text-gray-900 dark:text-white mb-4'>
            Pre-Test Checklist
          </h3>
          <div className='space-y-4'>
            <label className='flex items-start space-x-3 cursor-pointer'>
              <input
                type='checkbox'
                checked={checkedItems.audio || false}
                onChange={() => handleCheckItem('audio')}
                className='mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded'
              />
              <div className='flex-1'>
                <div className='flex items-center space-x-2'>
                  <Volume2 className='h-4 w-4 text-gray-600 dark:text-gray-400' />
                  <span className='font-medium text-gray-900 dark:text-white'>
                    Audio Test
                  </span>
                </div>
                <p className='text-sm text-gray-600 dark:text-gray-300 mt-1'>
                  I can hear the audio clearly through my headphones/speakers
                </p>
              </div>
            </label>

            <label className='flex items-start space-x-3 cursor-pointer'>
              <input
                type='checkbox'
                checked={checkedItems.microphone || false}
                onChange={() => handleCheckItem('microphone')}
                className='mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded'
              />
              <div className='flex-1'>
                <div className='flex items-center space-x-2'>
                  <Mic className='h-4 w-4 text-gray-600 dark:text-gray-400' />
                  <span className='font-medium text-gray-900 dark:text-white'>
                    Microphone Test
                  </span>
                </div>
                <p className='text-sm text-gray-600 dark:text-gray-300 mt-1'>
                  My microphone is working and recording clearly
                </p>
              </div>
            </label>

            <label className='flex items-start space-x-3 cursor-pointer'>
              <input
                type='checkbox'
                checked={checkedItems.environment || false}
                onChange={() => handleCheckItem('environment')}
                className='mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded'
              />
              <div className='flex-1'>
                <div className='flex items-center space-x-2'>
                  <Headphones className='h-4 w-4 text-gray-600 dark:text-gray-400' />
                  <span className='font-medium text-gray-900 dark:text-white'>
                    Environment
                  </span>
                </div>
                <p className='text-sm text-gray-600 dark:text-gray-300 mt-1'>
                  I am in a quiet environment with minimal distractions
                </p>
              </div>
            </label>

            <label className='flex items-start space-x-3 cursor-pointer'>
              <input
                type='checkbox'
                checked={checkedItems.time || false}
                onChange={() => handleCheckItem('time')}
                className='mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded'
              />
              <div className='flex-1'>
                <div className='flex items-center space-x-2'>
                  <Clock className='h-4 w-4 text-gray-600 dark:text-gray-400' />
                  <span className='font-medium text-gray-900 dark:text-white'>
                    Time Availability
                  </span>
                </div>
                <p className='text-sm text-gray-600 dark:text-gray-300 mt-1'>
                  I have {test.totalDuration} minutes available to complete this
                  test
                </p>
              </div>
            </label>

            <label className='flex items-start space-x-3 cursor-pointer'>
              <input
                type='checkbox'
                checked={checkedItems.instructions || false}
                onChange={() => handleCheckItem('instructions')}
                className='mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded'
              />
              <div className='flex-1'>
                <div className='flex items-center space-x-2'>
                  <CheckCircle className='h-4 w-4 text-gray-600 dark:text-gray-400' />
                  <span className='font-medium text-gray-900 dark:text-white'>
                    Instructions
                  </span>
                </div>
                <p className='text-sm text-gray-600 dark:text-gray-300 mt-1'>
                  I have read and understood all test instructions
                </p>
              </div>
            </label>
          </div>
        </div>

        {/* Important Instructions */}
        <div className='bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-6 mb-6'>
          <div className='flex items-start space-x-3'>
            <AlertTriangle className='h-6 w-6 text-amber-600 dark:text-amber-400 mt-0.5' />
            <div>
              <h3 className='text-lg font-semibold text-amber-800 dark:text-amber-300 mb-2'>
                Important Instructions
              </h3>
              <ul className='space-y-2 text-sm text-amber-700 dark:text-amber-400'>
                <li>
                  • Once you start the test, you cannot pause or restart it
                </li>
                <li>
                  • Each question has a specific time limit that will be
                  displayed
                </li>
                <li>
                  • For speaking questions, you will have preparation time
                  before recording
                </li>
                <li>
                  • Make sure your internet connection is stable throughout the
                  test
                </li>
                <li>
                  • Do not refresh the page or navigate away during the test
                </li>
                <li>
                  • Your responses will be automatically saved as you progress
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Test Sections Overview */}
        <div className='bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-6'>
          <h3 className='text-lg font-semibold text-gray-900 dark:text-white mb-4'>
            Test Structure
          </h3>
          <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
            <div className='text-center p-4 bg-red-50 dark:bg-red-900/20 rounded-lg'>
              <Mic className='h-8 w-8 text-red-600 dark:text-red-400 mx-auto mb-2' />
              <h4 className='font-medium text-gray-900 dark:text-white'>
                Speaking & Writing
              </h4>
              <p className='text-sm text-gray-600 dark:text-gray-300'>
                77 minutes
              </p>
            </div>
            <div className='text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg'>
              <CheckCircle className='h-8 w-8 text-blue-600 dark:text-blue-400 mx-auto mb-2' />
              <h4 className='font-medium text-gray-900 dark:text-white'>
                Reading
              </h4>
              <p className='text-sm text-gray-600 dark:text-gray-300'>
                32-41 minutes
              </p>
            </div>
            <div className='text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg'>
              <Headphones className='h-8 w-8 text-green-600 dark:text-green-400 mx-auto mb-2' />
              <h4 className='font-medium text-gray-900 dark:text-white'>
                Listening
              </h4>
              <p className='text-sm text-gray-600 dark:text-gray-300'>
                45-57 minutes
              </p>
            </div>
          </div>
        </div>

        {/* Start Test Button */}
        <div className='text-center'>
          <button
            onClick={startTest}
            disabled={!isReady}
            className={`inline-flex items-center space-x-2 px-8 py-4 rounded-lg font-semibold text-lg transition-colors duration-200 ${
              isReady
                ? 'bg-blue-600 hover:bg-blue-700 text-white'
                : 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
            }`}
          >
            <span>Start Test</span>
            <ArrowRight className='h-5 w-5' />
          </button>
          {!isReady && (
            <p className='text-sm text-gray-500 dark:text-gray-400 mt-2'>
              Please complete all checklist items to start the test
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default TestInstructions;
