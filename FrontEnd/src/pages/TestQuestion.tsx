import {
  ArrowLeft,
  ArrowRight,
  Clock,
  Mic,
  Pause,
  Play,
  Square,
} from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { mockTests } from '../data/mockPte';

const TestQuestion: React.FC = () => {
  const { testId, questionNumber } = useParams<{
    testId: string;
    questionNumber: string;
  }>();
  const navigate = useNavigate();
  const [timeLeft, setTimeLeft] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [response, setResponse] = useState('');
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const test = mockTests.find((t) => t.id === testId);
  const currentQuestionIndex = parseInt(questionNumber || '1') - 1;
  const currentQuestion = test?.questions[currentQuestionIndex];

  useEffect(() => {
    if (currentQuestion?.durationMillis) {
      setTimeLeft(Math.floor(currentQuestion.durationMillis / 1000));
    }
  }, [currentQuestion]);

  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0 && !isSubmitted) {
      handleSubmit();
    }
  }, [timeLeft, isSubmitted]);

  if (!test || !currentQuestion) {
    return (
      <div className='min-h-screen flex items-center justify-center'>
        <div className='text-center'>
          <h1 className='text-2xl font-bold text-gray-900 dark:text-white mb-4'>
            Question Not Found
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

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSubmit = () => {
    setIsSubmitted(true);
    // Save response logic here

    // Navigate to next question or results
    const nextQuestionNumber = currentQuestionIndex + 2;
    if (nextQuestionNumber <= test.questions.length) {
      setTimeout(() => {
        navigate(`/portal/test/${testId}/question/${nextQuestionNumber}`);
      }, 1000);
    } else {
      setTimeout(() => {
        navigate(`/portal/test/${testId}/results`);
      }, 1000);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      navigate(`/portal/test/${testId}/question/${currentQuestionIndex}`);
    }
  };

  const toggleRecording = () => {
    setIsRecording(!isRecording);
  };

  const toggleAudio = () => {
    setIsPlaying(!isPlaying);
  };

  const handleOptionSelect = (
    optionId: string,
    isMultiple: boolean = false
  ) => {
    if (isMultiple) {
      setSelectedOptions((prev) =>
        prev.includes(optionId)
          ? prev.filter((id) => id !== optionId)
          : [...prev, optionId]
      );
    } else {
      setSelectedOptions([optionId]);
    }
  };

  const getQuestionTypeDisplay = (questionCode: string) => {
    if (questionCode.startsWith('RA_')) return 'Read Aloud';
    if (questionCode.startsWith('RS_')) return 'Repeat Sentence';
    if (questionCode.startsWith('DI_')) return 'Describe Image';
    if (questionCode.startsWith('SWT_')) return 'Summarize Written Text';
    if (questionCode.startsWith('WE_')) return 'Write Essay';
    if (questionCode.startsWith('MCQ_')) return 'Multiple Choice';
    if (questionCode.startsWith('SST_')) return 'Summarize Spoken Text';
    return 'Question';
  };

  const renderQuestionContent = () => {
    const questionType = getQuestionTypeDisplay(currentQuestion.questionCode);

    switch (true) {
      case currentQuestion.questionCode.startsWith('RA_'):
        return (
          <div className='space-y-6'>
            <div className='bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg'>
              <h3 className='font-semibold text-blue-800 dark:text-blue-300 mb-2'>
                Instructions
              </h3>
              <p className='text-blue-700 dark:text-blue-400 text-sm'>
                Look at the text below. In 40 seconds, you must read this text
                aloud as naturally and clearly as possible. You have 40 seconds
                to read aloud.
              </p>
            </div>
            <div className='bg-white dark:bg-gray-800 p-6 rounded-lg border-2 border-gray-200 dark:border-gray-600'>
              <p className='text-lg leading-relaxed text-gray-900 dark:text-white'>
                {currentQuestion.textContent}
              </p>
            </div>
            <div className='flex items-center justify-center space-x-4'>
              <button
                onClick={toggleRecording}
                className={`flex items-center space-x-2 px-6 py-3 rounded-lg font-medium transition-colors duration-200 ${
                  isRecording
                    ? 'bg-red-600 hover:bg-red-700 text-white'
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
              >
                {isRecording ? (
                  <Square className='h-5 w-5' />
                ) : (
                  <Mic className='h-5 w-5' />
                )}
                <span>
                  {isRecording ? 'Stop Recording' : 'Start Recording'}
                </span>
              </button>
            </div>
          </div>
        );

      case currentQuestion.questionCode.startsWith('DI_'):
        return (
          <div className='space-y-6'>
            <div className='bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg'>
              <h3 className='font-semibold text-blue-800 dark:text-blue-300 mb-2'>
                Instructions
              </h3>
              <p className='text-blue-700 dark:text-blue-400 text-sm'>
                Look at the image below. In 25 seconds, please speak into the
                microphone and describe in detail what the image is showing. You
                will have 40 seconds to give your response.
              </p>
            </div>
            <div className='flex justify-center'>
              <img
                src={currentQuestion.imageUrl}
                alt='Describe this image'
                className='max-w-full h-auto rounded-lg shadow-lg'
              />
            </div>
            <div className='flex items-center justify-center space-x-4'>
              <button
                onClick={toggleRecording}
                className={`flex items-center space-x-2 px-6 py-3 rounded-lg font-medium transition-colors duration-200 ${
                  isRecording
                    ? 'bg-red-600 hover:bg-red-700 text-white'
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
              >
                {isRecording ? (
                  <Square className='h-5 w-5' />
                ) : (
                  <Mic className='h-5 w-5' />
                )}
                <span>
                  {isRecording ? 'Stop Recording' : 'Start Recording'}
                </span>
              </button>
            </div>
          </div>
        );

      case currentQuestion.questionCode.startsWith('SWT_'):
        return (
          <div className='space-y-6'>
            <div className='bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg'>
              <h3 className='font-semibold text-blue-800 dark:text-blue-300 mb-2'>
                Instructions
              </h3>
              <p className='text-blue-700 dark:text-blue-400 text-sm'>
                Read the passage below and summarize it using one sentence. Type
                your response in the box at the bottom of the screen. You have
                10 minutes to finish this task. Your response will be judged on
                the quality of your writing and on how well your response
                presents the key points in the passage.
              </p>
            </div>
            <div className='bg-white dark:bg-gray-800 p-6 rounded-lg border-2 border-gray-200 dark:border-gray-600'>
              <p className='text-base leading-relaxed text-gray-900 dark:text-white'>
                {currentQuestion.textContent}
              </p>
            </div>
            <div>
              <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2'>
                Your Summary (
                {response.split(' ').filter((word) => word.length > 0).length}{' '}
                words)
              </label>
              <textarea
                value={response}
                onChange={(e) => setResponse(e.target.value)}
                className='w-full h-32 p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white'
                placeholder='Write your summary here...'
              />
              <p className='text-sm text-gray-500 dark:text-gray-400 mt-1'>
                Word limit: {currentQuestion.wordCountMin}-
                {currentQuestion.wordCountMax} words
              </p>
            </div>
          </div>
        );

      case currentQuestion.questionCode.startsWith('MCQ_'):
        return (
          <div className='space-y-6'>
            <div className='bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg'>
              <h3 className='font-semibold text-blue-800 dark:text-blue-300 mb-2'>
                Instructions
              </h3>
              <p className='text-blue-700 dark:text-blue-400 text-sm'>
                Read the text and answer the multiple-choice question by
                selecting the correct response. Only one response is correct.
              </p>
            </div>
            <div className='bg-white dark:bg-gray-800 p-6 rounded-lg border-2 border-gray-200 dark:border-gray-600'>
              <p className='text-base leading-relaxed text-gray-900 dark:text-white mb-4'>
                {currentQuestion.textContent}
              </p>
            </div>
            <div className='space-y-3'>
              {currentQuestion.options?.map((option: any) => (
                <label
                  key={option.id}
                  className='flex items-start space-x-3 p-4 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer'
                >
                  <input
                    type='radio'
                    name='mcq-option'
                    value={option.id}
                    checked={selectedOptions.includes(option.id)}
                    onChange={() => handleOptionSelect(option.id)}
                    className='mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300'
                  />
                  <span className='text-gray-900 dark:text-white'>
                    {option.text}
                  </span>
                </label>
              ))}
            </div>
          </div>
        );

      case currentQuestion.questionCode.startsWith('SST_'):
        return (
          <div className='space-y-6'>
            <div className='bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg'>
              <h3 className='font-semibold text-blue-800 dark:text-blue-300 mb-2'>
                Instructions
              </h3>
              <p className='text-blue-700 dark:text-blue-400 text-sm'>
                You will hear a lecture. Write a summary for a fellow student
                who was not present at the lecture. You should write 50-70
                words. You have 10 minutes to finish this task.
              </p>
            </div>
            <div className='text-center'>
              <button
                onClick={toggleAudio}
                className={`flex items-center space-x-2 px-6 py-3 rounded-lg font-medium transition-colors duration-200 ${
                  isPlaying
                    ? 'bg-green-600 hover:bg-green-700 text-white'
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
              >
                {isPlaying ? (
                  <Pause className='h-5 w-5' />
                ) : (
                  <Play className='h-5 w-5' />
                )}
                <span>{isPlaying ? 'Pause Audio' : 'Play Audio'}</span>
              </button>
            </div>
            <div>
              <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2'>
                Your Summary (
                {response.split(' ').filter((word) => word.length > 0).length}{' '}
                words)
              </label>
              <textarea
                value={response}
                onChange={(e) => setResponse(e.target.value)}
                className='w-full h-40 p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white'
                placeholder='Write your summary here...'
              />
              <p className='text-sm text-gray-500 dark:text-gray-400 mt-1'>
                Word limit: {currentQuestion.wordCountMin}-
                {currentQuestion.wordCountMax} words
              </p>
            </div>
          </div>
        );

      default:
        return (
          <div className='text-center py-8'>
            <p className='text-gray-600 dark:text-gray-300'>
              Question type not implemented yet.
            </p>
          </div>
        );
    }
  };

  return (
    <div className='min-h-screen bg-gray-50 dark:bg-gray-900'>
      {/* Header */}
      <div className='bg-white dark:bg-gray-800 shadow-sm border-b dark:border-gray-700'>
        <div className='container mx-auto px-4 py-4'>
          <div className='flex items-center justify-between'>
            <div className='flex items-center space-x-4'>
              <h1 className='text-lg font-semibold text-gray-900 dark:text-white'>
                {test.title}
              </h1>
              <span className='text-sm text-gray-500 dark:text-gray-400'>
                Question {currentQuestionIndex + 1} of {test.questions.length}
              </span>
            </div>
            <div className='flex items-center space-x-4'>
              <div className='flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-300'>
                <Clock className='h-4 w-4' />
                <span
                  className={`font-mono ${
                    timeLeft < 60 ? 'text-red-600 dark:text-red-400' : ''
                  }`}
                >
                  {formatTime(timeLeft)}
                </span>
              </div>
              {isRecording && (
                <div className='flex items-center space-x-2 text-red-600 dark:text-red-400'>
                  <div className='w-2 h-2 bg-red-600 rounded-full animate-pulse'></div>
                  <span className='text-sm font-medium'>Recording</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className='bg-gray-200 dark:bg-gray-700 h-1'>
        <div
          className='bg-blue-600 h-1 transition-all duration-300'
          style={{
            width: `${
              ((currentQuestionIndex + 1) / test.questions.length) * 100
            }%`,
          }}
        ></div>
      </div>

      {/* Question Content */}
      <div className='container mx-auto px-4 py-8 max-w-4xl'>
        <div className='bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6'>
          {/* Question Header */}
          <div className='mb-6'>
            <div className='flex items-center justify-between mb-2'>
              <h2 className='text-xl font-semibold text-gray-900 dark:text-white'>
                {getQuestionTypeDisplay(currentQuestion.questionCode)}
              </h2>
              <span className='text-sm text-gray-500 dark:text-gray-400'>
                {currentQuestion.questionCode}
              </span>
            </div>
          </div>

          {/* Question Content */}
          {renderQuestionContent()}

          {/* Navigation */}
          <div className='flex items-center justify-between mt-8 pt-6 border-t dark:border-gray-700'>
            <button
              onClick={handlePrevious}
              disabled={currentQuestionIndex === 0}
              className='flex items-center space-x-2 px-4 py-2 text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100 disabled:opacity-50 disabled:cursor-not-allowed'
            >
              <ArrowLeft className='h-4 w-4' />
              <span>Previous</span>
            </button>

            <button
              onClick={handleSubmit}
              disabled={isSubmitted}
              className='flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed'
            >
              <span>{isSubmitted ? 'Submitted' : 'Next'}</span>
              {!isSubmitted && <ArrowRight className='h-4 w-4' />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestQuestion;
