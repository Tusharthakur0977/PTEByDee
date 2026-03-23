import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, X, BarChart3, Filter } from 'lucide-react';
import { getPracticeQuestions } from '../../services/portal';
import { PteQuestionTypeName } from '../../types/pte';
import QuestionSidebar from '../../components/QuestionSidebar';

const PracticeSummarizeSpokenText: React.FC = () => {
  const navigate = useNavigate();
  const [questions, setQuestions] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadQuestions();
  }, []);

  const loadQuestions = async () => {
    try {
      setIsLoading(true);
      const response = await getPracticeQuestions(
        PteQuestionTypeName.SUMMARIZE_SPOKEN_TEXT,
        { limit: 100, random: true }
      );
      setQuestions(response.questions);
    } catch (err) {
      setError('Failed to load questions');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!summary.trim()) {
      setError('Please write a summary');
      return;
    }

    const wordCount = summary.trim().split(/\s+/).length;
    if (wordCount < 50) {
      setError(`Summary must be at least 50 words. Current: ${wordCount} words`);
      return;
    }

    try {
      setIsSubmitting(true);
      alert('Summary submitted!');
      handleNext();
      setSummary('');
    } catch (err) {
      setError('Failed to submit response');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setSummary('');
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setSummary('');
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
  const wordCount = summary.trim().split(/\s+/).filter(w => w.length > 0).length;

  return (
    <div className='h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex flex-col'>
      {/* HEADER */}
      <div className='bg-gray-800 border-b border-gray-700 px-6 py-4 flex justify-between items-center'>
        <div>
          <h1 className='text-2xl font-bold text-white'>Summarize Spoken Text</h1>
          <p className='text-gray-400 text-sm'>
            Question {currentIndex + 1} of {questions.length}
          </p>
        </div>
        <button onClick={handleExit} className='p-2 hover:bg-gray-700 rounded-lg'>
          <X className='w-6 h-6 text-white' />
        </button>
      </div>

      {/* CONTENT */}
      <div className='flex-1 overflow-auto p-8'>
        <div className='max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8'>
          {/* Left: Audio */}
          <div>
            <div className='bg-gray-700 rounded-lg p-6 border border-gray-600 h-full'>
              <h3 className='text-white font-semibold mb-4'>Listen to the lecture:</h3>
              {currentQuestion.audioUrl && (
                <>
                  <audio
                    src={currentQuestion.audioUrl}
                    controls
                    autoPlay
                    className='w-full mb-4'
                  />
                  <p className='text-gray-400 text-sm'>
                    You can play the audio multiple times
                  </p>
                </>
              )}
            </div>
          </div>

          {/* Right: Summary Editor */}
          <div>
            <div className='bg-gray-700 rounded-lg border border-gray-600 flex flex-col h-full'>
              {error && !isSubmitting && (
                <div className='bg-red-900/30 border-b border-red-600 px-4 py-3'>
                  <p className='text-red-400 text-sm'>{error}</p>
                </div>
              )}

              <textarea
                value={summary}
                onChange={(e) => {
                  setSummary(e.target.value);
                  if (error) setError(null);
                }}
                placeholder='Write a summary in 50+ words...'
                className='flex-1 bg-gray-600 text-white p-4 border-0 focus:ring-0 resize-none font-mono text-sm placeholder-gray-400'
              />

              <div className='border-t border-gray-600 px-4 py-3 bg-gray-800 flex justify-between items-center'>
                <div className='text-sm text-gray-400'>
                  Words: <span className={
                    wordCount < 50
                      ? 'text-red-400 font-semibold'
                      : 'text-green-400'
                  }>
                    {wordCount}
                  </span>
                </div>
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting || wordCount < 50}
                  className='bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white px-6 py-2 rounded-lg font-semibold'
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Summary'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* FOOTER */}
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

export default PracticeSummarizeSpokenText;
