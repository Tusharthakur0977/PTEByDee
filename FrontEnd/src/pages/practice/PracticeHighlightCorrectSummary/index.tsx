import {
  BarChart3,
  ChevronLeft,
  ChevronRight,
  Filter,
  History,
  XCircle,
  Info,
} from 'lucide-react';
import InlinePreviousAttempts from '../../../components/InlinePreviousAttempts';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import MiniAudioPlayer from '../../../components/MiniAudioPlayer';
import PreviousResponses from '../../../components/PreviousResponses';
import QuestionSidebar from '../../../components/QuestionSidebar';
import ResponseDetailModal from './ResponseDetailModal';
import api from '../../../services/api';
import { getPracticeQuestions } from '../../../services/portal';
import { PteQuestionTypeName } from '../../../types/pte';
import { formatScoringText } from '../../../utils/Helpers';

export interface QuestionsData {
  id: string;
  type: string;
  difficultyLevel: string;
  title: string;
  instructions: string;
  hasUserResponses: boolean;
  content: Content;
}

export interface Content {
  text: string;
  audioUrl: any;
  imageUrl: string;
  options: any[];
  blanks: any[];
  paragraphs: any[];
  timeLimit: number;
  preparationTime: number;
  recordingTime: number;
}

const PracticeHighlightCorrectSummary: React.FC = () => {
  const navigate = useNavigate();
  const [questions, setQuestions] = useState<QuestionsData[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showQuestionSidebar, setShowQuestionSidebar] = useState(false);
  const [difficultyLevel, setDifficultyLevel] = useState<
    'EASY' | 'MEDIUM' | 'HARD' | 'all'
  >('all');
  const [showDifficultyFilter, setShowDifficultyFilter] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const evaluationRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<{
    pause: () => void;
    play: () => void;
    stop: () => void;
  } | null>(null);

  // User response
  const [response, setResponse] = useState<{
    selectedSummary: string;
  }>({ selectedSummary: '' });

  // Evaluation features
  const [isCompleted, setIsCompleted] = useState(false);
  const [evaluationResult, setEvaluationResult] = useState<any>(null);
  const [showPreviousResponses, setShowPreviousResponses] = useState(false);
  const [selectedResponse, setSelectedResponse] = useState<any>(null);
  const [showResponseModal, setShowResponseModal] = useState(false);

  // Audio finished state
  const [audioFinished, setAudioFinished] = useState(false);
  const [audioResetKey, setAudioResetKey] = useState(0);

  const loadQuestions = useCallback(async () => {
    try {
      setIsLoading(true);
      const options: any = {
        limit: 100,
        random: false,
      };

      if (difficultyLevel !== 'all') {
        options.difficultyLevel = difficultyLevel;
      }

      const response = await getPracticeQuestions(
        PteQuestionTypeName.HIGHLIGHT_CORRECT_SUMMARY,
        options,
      );
      setQuestions(response.questions as QuestionsData[]);
      setCurrentIndex(0);
    } catch (err) {
      setError('Failed to load questions');
    } finally {
      setIsLoading(false);
    }
  }, [difficultyLevel]);

  useEffect(() => {
    loadQuestions();
  }, [loadQuestions]);

  const currentQuestion = questions[currentIndex];

  // Reset state when question changes
  useEffect(() => {
    setIsCompleted(false);
    setResponse({ selectedSummary: '' });
    setEvaluationResult(null);
    setShowPreviousResponses(false);
    setSelectedResponse(null);
    setShowResponseModal(false);
    setAudioFinished(false);
  }, [currentIndex]);

  useEffect(() => {
    setElapsedSeconds(0);
  }, [currentQuestion?.id]);

  useEffect(() => {
    if (isCompleted || isLoading || !currentQuestion?.id) return;

    const interval = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [currentQuestion?.id, isCompleted, isLoading]);

  const handleReset = () => {
    setResponse({ selectedSummary: '' });
    setElapsedSeconds(0);
    setIsCompleted(false);
    setEvaluationResult(null);
    setError(null);
    setAudioFinished(false);
    // Stop current audio and reset by incrementing key
    audioRef.current?.stop();
    setAudioResetKey((prev) => prev + 1);
  };

  const handleSubmit = useCallback(async () => {
    if (isCompleted || isSubmitting) return;

    if (!response.selectedSummary) {
      setError('Please select a summary');
      return;
    }

    try {
      setIsSubmitting(true);

      // Pause audio on submit
      if (audioRef.current) {
        audioRef.current.pause();
      }

      const result = await api.post('/user/questions/submit-response', {
        questionId: currentQuestion?.id,
        userResponse: {
          selectedSummary: response.selectedSummary,
        },
        timeTakenSeconds: elapsedSeconds,
      });

      setEvaluationResult(result.data.data);

      setIsCompleted(true);
      setTimeout(() => {
        evaluationRef.current?.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
        });
      }, 100);
    } catch (err: any) {
      console.error('Error submitting response:', err);
      setError(err.message || 'Failed to evaluate response');

      setEvaluationResult(null);
      setIsCompleted(false);
    } finally {
      setIsSubmitting(false);
    }
  }, [isCompleted, isSubmitting, currentQuestion, response, elapsedSeconds]);

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handleExit = () => {
    if (window.confirm('Are you sure you want to exit?')) {
      navigate('/portal');
    }
  };

  const handleQuestionSelect = (questionId: string) => {
    const selectedIndex = questions.findIndex((q) => q.id === questionId);
    if (selectedIndex !== -1) {
      setCurrentIndex(selectedIndex);
      setShowQuestionSidebar(false);
    }
  };

  const handleViewResponse = (response: any) => {
    setShowPreviousResponses(false);
    setSelectedResponse(response);
    setShowResponseModal(true);
  };

  const handleCloseResponseModal = () => {
    setShowResponseModal(false);
    setSelectedResponse(null);
  };

  const handleAudioEnded = () => {
    setAudioFinished(true);
  };

  const getScoreColor = (score: number, max: number): string => {
    const percentage = (score / max) * 100;
    if (percentage >= 80) return 'text-green-600 dark:text-green-400';
    if (percentage >= 60) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  const formatElapsedTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs
      .toString()
      .padStart(2, '0')}`;
  };

  return (
    <div className='min-h-[calc(100vh-65px)] bg-gradient-to-br dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex flex-col'>
      {/*  HEADER */}
      <div className='dark:bg-gray-800 border-b dark:border-gray-700 px-6 py-4 flex justify-between items-center'>
        <div className='flex items-center gap-4'>
          <button
            onClick={handleExit}
            className='p-2'
            title='Exit'
          >
            <ChevronLeft className='w-6 h-6 text-black dark:text-white' />
          </button>
          <div>
            <h1 className='text-2xl font-bold flex items-center gap-2 text-black dark:text-white'>
              Highlight Correct Summary{' '}
              <p className='text-gray-400 dark:text-gray-400 text-sm'>
                (Question {currentIndex + 1} of {questions.length})
              </p>
            </h1>

            <div className='flex flex-row items-center space-x-3 '>
              <p className='font-bold text-blue-600 dark:text-blue-400 text-sm leading-relaxed'>
                You will hear a recording. Click on the paragraph that best
                relates to the recording.
              </p>
            </div>
          </div>
        </div>
        <div className='flex items-center gap-3'>
          <div className='relative group'>
            <button
              onClick={() => setShowDifficultyFilter(!showDifficultyFilter)}
              className='p-2 text-gray-300 hover:text-white'
              title='Filter by difficulty'
            >
              <Filter className='w-4 h-4 text-gray-400 dark:text-white' />
            </button>
            {showDifficultyFilter && (
              <div className='absolute right-0 mt-2 w-48 bg-gray-700 rounded-lg shadow-lg p-3 z-50'>
                <p className='text-xs text-gray-400 mb-2 font-semibold'>
                  Difficulty Level
                </p>
                <div className='space-y-2'>
                  {(['all', 'EASY', 'MEDIUM', 'HARD'] as const).map((level) => (
                    <label
                      key={level}
                      className='flex items-center gap-2 cursor-pointer'
                    >
                      <input
                        type='radio'
                        name='difficulty'
                        value={level}
                        checked={difficultyLevel === level}
                        onChange={(e) => {
                          setDifficultyLevel(e.target.value as any);
                          setShowDifficultyFilter(false);
                        }}
                        className='w-4 h-4'
                      />
                      <span className='text-white text-sm'>
                        {level === 'all' ? 'All Levels' : level}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>

          <button
            onClick={() => setShowQuestionSidebar(true)}
            className='p-2 text-gray-300 hover:text-white'
            title='View all questions'
          >
            <BarChart3 className='w-4 h-4 text-gray-400 dark:text-white' />
          </button>
          <button
            onClick={() => setShowPreviousResponses(true)}
            className='flex items-center gap-2 p-2 text-gray-400 text-sm font-semibold'
            title='Previous Attempts'
          >
            <History className='w-4 h-4' />
          </button>
        </div>
      </div>

      {isLoading && (
        <div className='h-screen dark:bg-gray-900 flex items-center justify-center'>
          <div className='text-center'>
            <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4'></div>
            <p className='dark:text-white'>Loading questions...</p>
          </div>
        </div>
      )}

      {questions.length === 0 && !isLoading ? (
        <div className='flex flex-1 items-center justify-center px-6 py-12'>
          <div className='w-full max-w-md rounded-3xl border border-slate-200 bg-white/80 p-8 text-center shadow-lg shadow-slate-900/5 dark:border-slate-700 dark:bg-slate-900/70'>
            <div className='mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-200'>
              <XCircle className='h-6 w-6' />
            </div>
            <h3 className='text-lg font-semibold text-slate-900 dark:text-white'>
              No practice questions found
            </h3>
            <p className='mt-2 text-sm text-slate-500 dark:text-slate-400'>
              We are still curating Describe Image questions for this category.
              Try another type or revisit soon.
            </p>
          </div>
        </div>
      ) : (
        <div className='flex-1 overflow-auto relative'>
          <div className='absolute top-4 right-4 z-10 rounded-lg bg-white/90 dark:bg-gray-800/90 backdrop-blur px-3 py-1.5 border border-gray-200 dark:border-gray-600 shadow-sm'>
            <p className='text-xs font-semibold text-gray-700 dark:text-gray-200'>
              Elapsed: {formatElapsedTime(elapsedSeconds)}
            </p>
          </div>
          <div className='max-w-4xl mx-auto p-8 space-y-6'>
            {/* Audio Player */}
            <div className='bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-600'>
              <div className='text-center'>
                <MiniAudioPlayer
                  src={currentQuestion?.content?.audioUrl || ''}
                  title='Listen to the recording'
                  autoPlay={true}
                  autoPlayDelay={2000}
                  onEnded={handleAudioEnded}
                  key={`audio-${currentQuestion?.id}-${audioResetKey}`}
                  questionId={currentQuestion?.id} question={currentQuestion}
                  questionAudioText={currentQuestion?.content?.text || ''}
                  ref={audioRef}
                />
              </div>

              {audioFinished && (
                <div className='mt-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg text-center'>
                  <p className='text-sm font-semibold text-green-700 dark:text-green-300'>
                    ✓ Audio finished. Select your answer below.
                  </p>
                </div>
              )}
            </div>

            {/* Summary Options */}
            <div className='space-y-3'>
              <h4 className='font-medium text-gray-900 dark:text-white'>
                Choose the best summary:
              </h4>
              {currentQuestion?.content?.options?.map((option) => {
                const isCorrectAnswer =
                  evaluationResult?.evaluation?.detailedAnalysis?.choiceResult?.correctTexts?.includes(
                    option.text,
                  );
                const isSelected = response.selectedSummary === option.id;

                let optionClass =
                  'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700';

                if (isCompleted) {
                  if (isCorrectAnswer) {
                    optionClass =
                      'border-green-500 bg-green-50 dark:bg-green-900/30';
                  } else if (isSelected) {
                    optionClass = 'border-red-500 bg-red-50 dark:bg-red-900/30';
                  } else {
                    optionClass =
                      'border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/20';
                  }
                } else if (isSelected) {
                  optionClass =
                    'border-blue-500 bg-blue-50 dark:bg-blue-900/30';
                }

                return (
                  <label
                    key={option.id}
                    className={`flex items-start space-x-4 p-4 border rounded-lg cursor-pointer transition-all duration-200 ${optionClass} ${isCompleted ? 'pointer-events-none' : ''}`}
                  >
                    <input
                      type='radio'
                      name='summary-choice'
                      value={option.id}
                      checked={response.selectedSummary === option.id}
                      onChange={(e) =>
                        setResponse({
                          ...response,
                          selectedSummary: e.target.value,
                        })
                      }
                      disabled={isCompleted}
                      className='mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300'
                    />
                    <span className='text-gray-900 dark:text-white leading-relaxed'>
                      {option.text}
                    </span>
                  </label>
                );
              })}
            </div>

            {/* Error message */}
            {error && (
              <div className='bg-red-900/30 border border-red-600 rounded-lg p-4'>
                <p className='text-red-400'>{error}</p>
              </div>
            )}

            {/* Action buttons */}
            <div className='flex flex-col sm:flex-row gap-4 justify-center'>
              <button
                onClick={handleReset}
                disabled={isSubmitting || !response.selectedSummary}
               className="px-6 py-3 rounded-xl bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50 font-semibold transition dark:text-white"
              >
                Reset
              </button>

              {!isCompleted && (
                <button
                  onClick={handleSubmit}
                  disabled={!response.selectedSummary || isSubmitting}
                  className='flex-1 sm:flex-none sm:w-[60%] bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-semibold py-3 rounded-xl shadow-md transition'
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Answer'}
                </button>
              )}
            </div>

            {/* Evaluation Results Section */}
            {evaluationResult?.evaluation && (
              <div
                ref={evaluationRef}
                className='flex flex-1 flex-col overflow-auto px-6 py-8 gap-5 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500'
              >
                <h3 className='text-xl font-bold text-gray-900 dark:text-white px-1'>
                  Detailed Analysis
                </h3>

                {/* Scoring Table */}
                <div className='bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm'>
                  <table className='w-full border-collapse'>
                    <thead className='bg-gray-50 dark:bg-gray-700/50'>
                      <tr>
                        <th className='px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400'>
                          Rubric
                        </th>
                        <th className='px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400'>
                          Score
                        </th>
                      </tr>
                    </thead>
                    <tbody className='divide-y divide-gray-100 dark:divide-gray-700'>
                      {Object.entries(
                        evaluationResult.evaluation.detailedAnalysis.scores ||
                          {},
                      ).map(([component, scoreData]: any) => (
                        <tr
                          key={component}
                          className='hover:bg-gray-50/50 dark:hover:bg-gray-700/30 transition'
                        >
                          <td className='px-6 py-4'>
                            <div className='flex items-center gap-2'>
                              <span className='font-semibold text-gray-700 dark:text-gray-200'>
                                {formatScoringText(component)}
                              </span>
                              <div className='relative group inline-flex items-center'>
                                <Info className='h-4 w-4 text-gray-400 cursor-help' />

                                {/* Tooltip */}
                                <div className='absolute left-full top-1/2 ml-3 -translate-y-1/2 w-64 p-3 bg-gray-900 text-white text-xs rounded-xl shadow-xl hidden group-hover:block z-50'>
                                  <p className='font-bold mb-1'>
                                    Scoring Criteria
                                  </p>
                                  <p>
                                    Your response for Highlight Correct Summary
                                    is judged on your ability to comprehend,
                                    analyze, and combine information from a
                                    recording and identify the most accurate
                                    summary of the recording. Your response is
                                    scored as either correct or incorrect. No
                                    credit is given for no response or an
                                    incorrect response.
                                  </p>

                                  {/* Arrow */}
                                  <div
                                    className='absolute left-0 top-1/2 -translate-y-1/2 -translate-x-full 
                    border-8 border-transparent border-r-gray-900'
                                  ></div>
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className='px-6 py-4 text-left'>
                            <span
                              className={`text-lg font-bold ${getScoreColor(
                                scoreData.score || 0,
                                scoreData.max || 10,
                              )}`}
                            >
                              {scoreData.score}
                              <span className='text-gray-400 font-medium'>
                                /{scoreData.max}
                              </span>
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Score Summary */}
                <div className='bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6'>
                  <h4 className='text-lg font-semibold text-gray-900 dark:text-white'>
                    Your Score:{' '}
                    <span className='font-semibold text-green-600 dark:text-green-400'>
                      {evaluationResult.evaluation.score.scored}
                    </span>
                    {evaluationResult.evaluation.detailedAnalysis?.scores && (
                      <span className='ml-2 text-gray-500 dark:text-gray-400'>
                        /{' '}
                        {Object.values(
                          evaluationResult.evaluation.detailedAnalysis.scores,
                        ).reduce(
                          (sum: number, score: any) => sum + score.max,
                          0,
                        )}{' '}
                        points
                      </span>
                    )}
                  </h4>
                </div>

                {/* Explanation */}
                {evaluationResult?.evaluation?.detailedAnalysis?.choiceResult
                  ?.explanation && (
                  <div className='bg-white dark:bg-gray-800 rounded-2xl border border-blue-200 dark:border-blue-800 shadow-sm overflow-hidden'>
                    {/* Header */}
                    <div className='px-6 py-4 border-b border-blue-100 dark:border-blue-800 flex items-center gap-2'>
                      <span className='text-xl'>📘</span>
                      <h4 className='font-bold text-blue-900 dark:text-blue-200 text-lg'>
                        Answer Explanation
                      </h4>
                    </div>

                    {/* Content */}
                    <div className='p-6 text-sm leading-relaxed text-gray-700 dark:text-gray-300 whitespace-pre-line'>
                      {
                        evaluationResult.evaluation.detailedAnalysis
                          .choiceResult?.explanation
                      }
                    </div>
                  </div>
                )}

                {/* Answer Analysis - Show Correct vs Selected Options */}
                {evaluationResult?.evaluation?.detailedAnalysis && (
                  <div className='space-y-4'>
                    {/* Correct Answers */}
                    {evaluationResult.evaluation.detailedAnalysis.choiceResult
                      ?.correctTexts && (
                      <div className='bg-white dark:bg-gray-800 rounded-lg border border-green-200 dark:border-green-800 overflow-hidden'>
                        <div className='px-6 py-4 bg-green-50 dark:bg-green-900/20 border-b border-green-200 dark:border-green-800'>
                          <h4 className='font-semibold text-green-900 dark:text-green-300'>
                            ✓ Correct Answers (
                            {
                              evaluationResult.evaluation.detailedAnalysis
                                .choiceResult?.correctTexts.length
                            }
                            )
                          </h4>
                        </div>
                        <div className='p-6 space-y-3'>
                          {evaluationResult.evaluation.detailedAnalysis.choiceResult?.correctTexts.map(
                            (text: string, idx: number) => (
                              <div
                                key={idx}
                                className='flex items-start gap-3'
                              >
                                <div className='flex-shrink-0 mt-1'>
                                  <div className='flex items-center justify-center h-5 w-5 rounded-full bg-green-500'>
                                    <svg
                                      className='h-3 w-3 text-white'
                                      fill='currentColor'
                                      viewBox='0 0 20 20'
                                    >
                                      <path
                                        fillRule='evenodd'
                                        d='M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z'
                                        clipRule='evenodd'
                                      />
                                    </svg>
                                  </div>
                                </div>
                                <p className='text-sm text-gray-700 dark:text-gray-300'>
                                  {text}
                                </p>
                              </div>
                            ),
                          )}
                        </div>
                      </div>
                    )}

                    {/* Incorrectly Selected */}
                    {evaluationResult.evaluation.detailedAnalysis.choiceResult
                      ?.incorrectlySelectedTexts &&
                      evaluationResult.evaluation.detailedAnalysis.choiceResult
                        ?.incorrectlySelectedTexts.length > 0 && (
                        <div className='bg-white dark:bg-gray-800 rounded-lg border border-red-200 dark:border-red-800 overflow-hidden'>
                          <div className='px-6 py-4 bg-red-50 dark:bg-red-900/20 border-b border-red-200 dark:border-red-800'>
                            <h4 className='font-semibold text-red-900 dark:text-red-300'>
                              ✗ Incorrectly Selected (
                              {
                                evaluationResult.evaluation.detailedAnalysis
                                  .choiceResult?.incorrectlySelectedTexts.length
                              }
                              )
                            </h4>
                          </div>
                          <div className='p-6 space-y-3'>
                            {evaluationResult.evaluation.detailedAnalysis.choiceResult?.incorrectlySelectedTexts.map(
                              (text: string, idx: number) => (
                                <div
                                  key={idx}
                                  className='flex items-start gap-3'
                                >
                                  <div className='flex-shrink-0 mt-1'>
                                    <div className='flex items-center justify-center h-5 w-5 rounded-full bg-red-500'>
                                      <svg
                                        className='h-3 w-3 text-white'
                                        fill='currentColor'
                                        viewBox='0 0 20 20'
                                      >
                                        <path
                                          fillRule='evenodd'
                                          d='M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z'
                                          clipRule='evenodd'
                                        />
                                      </svg>
                                    </div>
                                  </div>
                                  <p className='text-sm text-gray-700 dark:text-gray-300'>
                                    {text}
                                  </p>
                                </div>
                              ),
                            )}
                          </div>
                        </div>
                      )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* FOOTER */}

      <InlinePreviousAttempts
        questionId={currentQuestion?.id} question={currentQuestion}
        onViewResponse={handleViewResponse}
        className='mt-6'
      />
      <div className='bg-gray-800 border-t border-gray-700 px-6 py-4 flex justify-between items-center'>
        <button
          onClick={handlePrevious}
          disabled={currentIndex === 0}
          className='flex items-center gap-2 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 text-white px-4 py-2 rounded-lg transition'
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
          className='flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg transition'
        >
          Next
          <ChevronRight className='w-5 h-5' />
        </button>
      </div>

      {/* Question Sidebar */}
      <QuestionSidebar
        isOpen={showQuestionSidebar}
        onClose={() => setShowQuestionSidebar(false)}
        questionType={PteQuestionTypeName.HIGHLIGHT_CORRECT_SUMMARY}
        selectedQuestionId={currentQuestion?.id}
        onQuestionSelect={handleQuestionSelect}
        practiceStatus='all'
        difficultyLevel={difficultyLevel}
        onFilterChange={(filters) => {
          setDifficultyLevel(filters.difficultyLevel);
        }}
      />

      {/* Previous Attempts Modal Drawer */}
      <PreviousResponses
        questionId={currentQuestion?.id} question={currentQuestion}
        onViewResponse={handleViewResponse}
        isOpen={showPreviousResponses}
        onClose={() => setShowPreviousResponses(false)}
      />

      {/* Response Detail Modal */}
      <ResponseDetailModal
        response={selectedResponse}
        isOpen={showResponseModal}
        onClose={handleCloseResponseModal}
        questionType={PteQuestionTypeName.HIGHLIGHT_CORRECT_SUMMARY}
      />
    </div>
  );
};

export default PracticeHighlightCorrectSummary;

export interface Data {
  responseId: string;
  evaluation: Evaluation;
  question: Question;
  timeTaken: number;
  transcribedText: any;
}

export interface Evaluation {
  score: { scored: number; max: number };
  isCorrect: boolean;
  feedback: string;
  detailedAnalysis: DetailedAnalysis;
  suggestions: string[];
}

export interface DetailedAnalysis {
  scores: Scores;
  choiceResult?: {
    selectedTexts: string[];
    correctTexts: string[];
    incorrectlySelectedTexts: string[];
    missedCorrectTexts: string[];
    explanation?: string;
  };
}

export interface Scores {
  listening: Listening;
}

export interface Listening {
  score: number;
  max: number;
}

export interface Question {
  id: string;
  questionCode: string;
  questionType: string;
  sectionName: string;
}