import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, X, BarChart3, Filter } from 'lucide-react';
import { getPracticeQuestions } from '../../services/portal';
import { PteQuestionTypeName } from '../../types/pte';
import QuestionSidebar from '../../components/QuestionSidebar';

const PracticeHighlightIncorrectWords: React.FC = () => {
  const navigate = useNavigate();
  const [questions, setQuestions] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [highlightedWords, setHighlightedWords] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadQuestions();
  }, []);

  const loadQuestions = async () => {
    try {
      setIsLoading(true);
      const response = await getPracticeQuestions(
        PteQuestionTypeName.HIGHLIGHT_INCORRECT_WORDS,
        { limit: 100, random: true }
      );
      setQuestions(response.questions);
    } catch (err) {
      setError('Failed to load questions');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleWord = (wordId: string) => {
    setHighlightedWords((prev) =>
      prev.includes(wordId)
        ? prev.filter((id) => id !== wordId)
        : [...prev, wordId]
    );
    if (error) setError(null);
  };

  const handleSubmit = async () => {
    if (highlightedWords.length === 0) {
      setError('Please highlight at least one word');
      return;
    }

    try {
      setIsSubmitting(true);
      alert('Response submitted!');
      handleNext();
      setHighlightedWords([]);
    } catch (err) {
      setError('Failed to submit response');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setHighlightedWords([]);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setHighlightedWords([]);
    }
  };

  const handleExit = () => {
    if (window.confirm('Are you sure you want to exit?')) {
      navigate('/portal');
    }
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
      <div className='bg-gray-800 border-b border-gray-700 px-6 py-4 flex justify-between items-center'>
        <div>
          <h1 className='text-2xl font-bold text-white'>Highlight Incorrect Words</h1>
          <p className='text-gray-400 text-sm'>
            Question {currentIndex + 1} of {questions.length}
          </p>
        </div>
        <button onClick={handleExit} className='p-2 hover:bg-gray-700 rounded-lg'>
          <X className='w-6 h-6 text-white' />
        </button>
      </div>

      <div className='flex-1 overflow-auto p-8'>
        <div className='max-w-4xl mx-auto'>
          {currentQuestion.audioUrl && (
            <div className='bg-gray-700 rounded-lg p-8 mb-8 border border-gray-600'>
              <h3 className='text-white font-semibold mb-4'>Listen to the audio:</h3>
              <audio src={currentQuestion.audioUrl} controls autoPlay className='w-full' />
            </div>
          )}

          <div className='bg-blue-900/20 border border-blue-600 rounded-lg p-4 mb-8'>
            <p className='text-blue-300 text-sm'>
              Click on words that are incorrectly pronounced or used in the wrong context
            </p>
          </div>

          <div className='bg-gray-700 rounded-lg p-8 mb-8 border border-gray-600'>
            <h3 className='text-white font-semibold mb-4'>Text:</h3>
            <div className='text-lg text-gray-100 leading-relaxed flex flex-wrap gap-2'>
              {currentQuestion.options?.map((word: any) => (
                <button
                  key={word.id}
                  onClick={() => toggleWord(word.id)}
                  className={`px-3 py-1 rounded transition-all ${
                    highlightedWords.includes(word.id)
                      ? 'bg-red-600 text-white'
                      : 'bg-gray-600 text-gray-100 hover:bg-gray-500'
                  }`}
                >
                  {word.text}
                </button>
              ))}
            </div>
          </div>

          {error && (
            <div className='bg-red-900/30 border border-red-600 rounded-lg p-4 mb-8'>
              <p className='text-red-400'>{error}</p>
            </div>
          )}

          <button
            onClick={handleSubmit}
            disabled={highlightedWords.length === 0 || isSubmitting}
            className='w-full bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-semibold py-3 rounded-lg'
          >
            {isSubmitting ? 'Submitting...' : 'Submit Answer'}
          </button>
        </div>
      </div>

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
    </div>
  );
};

export default PracticeHighlightIncorrectWords;
