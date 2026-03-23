import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, X, BarChart3, Filter } from 'lucide-react';
import { getPracticeQuestions } from '../../services/portal';
import { PteQuestionTypeName } from '../../types/pte';
import QuestionSidebar from '../../components/QuestionSidebar';

const PracticeMultipleChoiceSingleAnswer: React.FC = () => {
  const navigate = useNavigate();
  const [questions, setQuestions] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showQuestionSidebar, setShowQuestionSidebar] = useState(false);
  const [difficultyLevel, setDifficultyLevel] = useState<'EASY' | 'MEDIUM' | 'HARD' | 'all'>('all');
  const [showDifficultyFilter, setShowDifficultyFilter] = useState(false);

  const loadQuestions = useCallback(async () => {
    try {
      setIsLoading(true);
      const options: any = { limit: 100, random: true };
      if (difficultyLevel !== 'all') {
        options.difficultyLevel = difficultyLevel;
      }
      const response = await getPracticeQuestions(
        PteQuestionTypeName.MULTIPLE_CHOICE_SINGLE_ANSWER_READING,
        options
      );
      setQuestions(response.questions);
    } catch (err) {
      setError('Failed to load questions');
    } finally {
      setIsLoading(false);
    }
  }, [difficultyLevel]);

  useEffect(() => {
    loadQuestions();
  }, [loadQuestions]);

  const handleSubmitResponse = async () => {
    if (!selectedOption) {
      setError('Please select an option');
      return;
    }

    try {
      setIsSubmitting(true);
      alert('Response submitted! Moving to next question.');
      handleNext();
      setSelectedOption(null);
    } catch (err) {
      setError('Failed to submit response');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setSelectedOption(null);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setSelectedOption(null);
    }
  };

  const handleExit = () => {
    if (window.confirm('Are you sure you want to exit?')) {
      navigate('/portal');
    }
  };

  const handleQuestionSelect = (index: number) => {
    setCurrentIndex(index);
    setSelectedOption(null);
    setShowQuestionSidebar(false);
  };

  if (isLoading) {
    return (
      <div className='h-screen bg-gray-900 flex items-center justify-center'>
        <div className='text-center'>
          <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4'></div>
          <p className='text-white text-lg'>Loading questions...</p>
        </div>
      </div>
    );
  }

  if (error && !isLoading && questions.length === 0) {
    return (
      <div className='h-screen bg-gray-900 flex items-center justify-center'>
        <div className='text-center'>
          <p className='text-red-500 text-lg mb-4'>{error}</p>
          <button
            onClick={() => navigate('/portal')}
            className='bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg'
          >
            Back to Portal
          </button>
        </div>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className='h-screen bg-gray-900 flex items-center justify-center'>
        <p className='text-white text-lg'>No questions available</p>
      </div>
    );
  }

  const currentQuestion = questions[currentIndex];

  return (
    <div className='h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex flex-col'>
      {/* HEADER */}
      <div className='bg-gray-800 border-b border-gray-700 px-6 py-4 flex justify-between items-center'>
        <div>
          <h1 className='text-2xl font-bold text-white'>Multiple Choice - Single Answer</h1>
          <p className='text-gray-400 text-sm'>
            Question {currentIndex + 1} of {questions.length}
          </p>
        </div>
        <div className='flex items-center gap-3'>
          <div className='relative'>
            <button
              onClick={() => setShowDifficultyFilter(!showDifficultyFilter)}
              className='p-2 hover:bg-gray-700 rounded-lg flex items-center gap-2'
            >
              <Filter className='w-5 h-5 text-white' />
            </button>
            {showDifficultyFilter && (
              <div className='absolute right-0 mt-2 bg-gray-700 rounded-lg shadow-lg z-10 p-3 min-w-40'>
                <p className='text-white text-sm font-semibold mb-2'>Difficulty Level</p>
                <div className='space-y-2'>
                  {(['all', 'EASY', 'MEDIUM', 'HARD'] as const).map((level) => (
                    <label key={level} className='flex items-center text-gray-200 cursor-pointer'>
                      <input
                        type='radio'
                        name='difficulty'
                        value={level}
                        checked={difficultyLevel === level}
                        onChange={(e) => setDifficultyLevel(e.target.value as any)}
                        className='mr-2'
                      />
                      {level === 'all' ? 'All Levels' : level}
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>
          <button
            onClick={() => setShowQuestionSidebar(!showQuestionSidebar)}
            className='p-2 hover:bg-gray-700 rounded-lg'
          >
            <BarChart3 className='w-5 h-5 text-white' />
          </button>
          <button
            onClick={handleExit}
            className='p-2 hover:bg-gray-700 rounded-lg transition-colors'
          >
            <X className='w-6 h-6 text-white' />
          </button>
        </div>
      </div>

      {/* CONTENT */}
      <div className='flex-1 overflow-auto p-8'>
        <div className='max-w-4xl mx-auto'>
          {/* Passage */}
          {currentQuestion.textContent && (
            <div className='bg-gray-700 rounded-lg p-8 mb-8 border border-gray-600'>
              <h3 className='text-white font-semibold mb-4'>Passage:</h3>
              <p className='text-gray-100 leading-relaxed whitespace-pre-wrap'>
                {currentQuestion.textContent}
              </p>
            </div>
          )}

          {/* Question */}
          <div className='bg-gray-700 rounded-lg p-8 mb-8 border border-gray-600'>
            <h3 className='text-white font-semibold mb-4'>Question:</h3>
            <p className='text-lg text-gray-100'>
              {currentQuestion.questionStatement}
            </p>
          </div>

          {/* Options */}
          <div className='space-y-3 mb-8'>
            {currentQuestion.options?.map((option: any) => (
              <label
                key={option.id}
                className={`flex items-start p-4 border-2 rounded-lg cursor-pointer transition-all ${
                  selectedOption === option.id
                    ? 'border-blue-500 bg-blue-900/30'
                    : 'border-gray-600 bg-gray-700 hover:border-gray-500'
                }`}
              >
                <input
                  type='radio'
                  name='answer'
                  value={option.id}
                  checked={selectedOption === option.id}
                  onChange={(e) => {
                    setSelectedOption(e.target.value);
                    if (error) setError(null);
                  }}
                  className='mt-1 w-4 h-4 text-blue-600 cursor-pointer'
                />
                <span className='ml-4 text-gray-100 text-lg'>
                  {option.text}
                </span>
              </label>
            ))}
          </div>

          {/* Error Message */}
          {error && (
            <div className='bg-red-900/30 border border-red-600 rounded-lg p-4 mb-8'>
              <p className='text-red-400'>{error}</p>
            </div>
          )}

          {/* Submit Button */}
          <button
            onClick={handleSubmitResponse}
            disabled={!selectedOption || isSubmitting}
            className='w-full bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-semibold py-3 rounded-lg transition-colors'
          >
            {isSubmitting ? 'Submitting...' : 'Submit Answer'}
          </button>
        </div>
      </div>

      {/* FOOTER NAVIGATION */}
      <div className='bg-gray-800 border-t border-gray-700 px-6 py-4 flex justify-between items-center'>
        <button
          onClick={handlePrevious}
          disabled={currentIndex === 0}
          className='flex items-center gap-2 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 text-white px-4 py-2 rounded-lg'
        >
          <ChevronLeft className='w-5 h-5' />
          Previous
        </button>

        <span className='text-gray-400 text-sm'>
          {currentIndex + 1} / {questions.length}
        </span>

        <button
          onClick={handleNext}
          disabled={currentIndex === questions.length - 1}
          className='flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg'
        >
          Next
          <ChevronRight className='w-5 h-5' />
        </button>
      </div>

      {showQuestionSidebar && (
        <QuestionSidebar
          questions={questions}
          currentIndex={currentIndex}
          onSelectQuestion={handleQuestionSelect}
          type={PteQuestionTypeName.MULTIPLE_CHOICE_SINGLE_ANSWER_READING}
        />
      )}
    </div>
  );
};

export default PracticeMultipleChoiceSingleAnswer;
