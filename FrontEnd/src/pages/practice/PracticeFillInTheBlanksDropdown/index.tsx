import {
  ArrowLeft,
  BarChart3,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Filter,
  History,
  Info,
  XCircle,
} from 'lucide-react';
import InlinePreviousAttempts from '../../../components/InlinePreviousAttempts';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PreviousResponses from '../../../components/PreviousResponses';
import QuestionSidebar from '../../../components/QuestionSidebar';
import api from '../../../services/api';
import { getPracticeQuestions } from '../../../services/portal';
import { PteQuestionTypeName } from '../../../types/pte';
import { formatScoringText } from '../../../utils/Helpers';
import ResponseDetailModal from './ResponseDetailModal';

type BlankDropdownProps = {
  blankKey: string;
  value: string;
  options: string[];
  disabled: boolean;
  selectClassColor: string;
  openBlankKey: string | null;
  setOpenBlankKey: (key: string | null) => void;
  onSelect: (nextValue: string) => void;
};

const BlankDropdown: React.FC<BlankDropdownProps> = ({
  blankKey,
  value,
  options,
  disabled,
  selectClassColor,
  openBlankKey,
  setOpenBlankKey,
  onSelect,
}) => {
  const isOpen = openBlankKey === blankKey;
  const containerRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const onPointerDown = (event: PointerEvent) => {
      const targetNode = event.target as Node | null;
      if (!targetNode) return;
      if (containerRef.current?.contains(targetNode)) return;
      setOpenBlankKey(null);
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpenBlankKey(null);
      }
    };

    window.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [isOpen, setOpenBlankKey]);

  return (
    <span
      ref={containerRef}
      className='inline-block relative mx-1 align-baseline'
    >
      <button
        type='button'
        disabled={disabled}
        onClick={() => {
          if (disabled) return;
          setOpenBlankKey(isOpen ? null : blankKey);
        }}
        className={`min-w-[140px] h-[24px] px-3 pr-7 border-2 rounded-lg text-center transition-all duration-200 font-medium outline-none text-sm relative
          disabled:cursor-not-allowed
          ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}
          ${selectClassColor}`}
        aria-haspopup='listbox'
        aria-expanded={isOpen}
      >
        <span className='inline-flex w-full items-center justify-center gap-2'>
          <span
            className={`${value ? '' : 'text-gray-500 dark:text-gray-400'}`}
          >
            {value || 'Select'}
          </span>
        </span>
        <ChevronDown className='absolute right-1.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600 dark:text-gray-400 pointer-events-none' />
      </button>

      {isOpen && !disabled && (
        <div
          role='listbox'
          className='absolute left-0 top-full mt-2 z-50 min-w-[160px] max-w-[260px] overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xl shadow-black/10 dark:border-gray-700 dark:bg-gray-900'
        >
          <div className='max-h-56 overflow-auto p-1'>
            <button
              type='button'
              role='option'
              aria-selected={value === ''}
              className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs transition-colors ${
                value === ''
                  ? 'bg-blue-50 text-blue-900 dark:bg-blue-900/30 dark:text-blue-100'
                  : 'text-gray-700 hover:bg-gray-50 dark:text-gray-200 dark:hover:bg-gray-800'
              }`}
              onClick={() => {
                onSelect('');
                setOpenBlankKey(null);
              }}
            >
              Select
            </button>
            {options.map((option) => {
              const isSelected = option === value;
              return (
                <button
                  key={option}
                  type='button'
                  role='option'
                  aria-selected={isSelected}
                  className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs transition-colors ${
                    isSelected
                      ? 'bg-blue-50 text-blue-900 dark:bg-blue-900/30 dark:text-blue-100'
                      : 'text-gray-700 hover:bg-gray-50 dark:text-gray-200 dark:hover:bg-gray-800'
                  }`}
                  onClick={() => {
                    onSelect(option);
                    setOpenBlankKey(null);
                  }}
                >
                  {option}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </span>
  );
};

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
  timeLimit: number;
  preparationTime: number;
  recordingTime: number;
}

const PracticeFillInTheBlanksDropdown: React.FC = () => {
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

  // User response
  const [response, setResponse] = useState<{
    blanks: { [key: string]: string };
  }>({ blanks: {} });
  const [openBlankKey, setOpenBlankKey] = useState<string | null>(null);

  // Evaluation features
  const [isCompleted, setIsCompleted] = useState(false);
  const [evaluationResult, setEvaluationResult] = useState<Data | null>(null);
  const [resetKey, setResetKey] = useState(0);
  const [showPreviousResponses, setShowPreviousResponses] = useState(false);
  const [selectedResponse, setSelectedResponse] = useState<any>(null);
  const [showResponseModal, setShowResponseModal] = useState(false);

  const [selectedError, setSelectedError] = useState<any>(null);

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
        PteQuestionTypeName.READING_FILL_IN_THE_BLANKS,
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

  // Reset state when question changes
  useEffect(() => {
    setIsCompleted(false);
    setResponse({ blanks: {} });
    setEvaluationResult(null);
    setShowPreviousResponses(false);
    setSelectedResponse(null);
    setShowResponseModal(false);
    setResetKey((prev) => prev + 1);
    setOpenBlankKey(null);
  }, [currentIndex]);

  const currentQuestion = questions[currentIndex];

  useEffect(() => {
    setElapsedSeconds(0);
  }, [currentQuestion?.id]);

  useEffect(() => {
    if (isCompleted || isLoading || !currentQuestion?.id) return;

    const interval = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [isCompleted, isLoading, currentQuestion?.id]);

  const handleResetRecording = () => {
    setResponse({ blanks: {} });
    setIsCompleted(false);
    setEvaluationResult(null);
    setError(null);
  };

  const handleSubmit = useCallback(async () => {
    if (isCompleted || isSubmitting) return;

    // Check if all blanks are filled
    const filledBlanksCount = Object.keys(response.blanks).length;

    if (filledBlanksCount === 0) {
      setError('Please fill in at least one blank');
      return;
    }

    try {
      setIsSubmitting(true);

      const result = await api.post('/user/questions/submit-response', {
        questionId: currentQuestion?.id,
        userResponse: {
          blanks: response.blanks,
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
  }, [isCompleted, isSubmitting, currentQuestion, response, setError]);

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
          >
            <ArrowLeft className='w-6 h-6 text-black dark:text-white' />
          </button>
          <div>
            <h1 className='text-2xl font-bold flex items-center gap-2 text-black dark:text-white'>
              Fill In The Blanks (Dropdown){' '}
              <p className='text-gray-400 dark:text-gray-400 text-sm'>
                (Question {currentIndex + 1} of {questions.length})
              </p>
            </h1>

            <div className='flex flex-row items-center space-x-3 '>
              <p className='font-bold text-blue-600 dark:text-blue-400 text-sm leading-relaxed'>
                There are some words missing in the following text. Please
                select the correct word in the drop-down box.
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
              Elapsed Time: {formatElapsedTime(elapsedSeconds)}
            </p>
          </div>

          <div className='max-w-4xl mx-auto p-8 space-y-6'>
            {/* Text with dropdown select blanks */}
            <div className='bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-600 shadow-sm'>
              <div className='text-base leading-relaxed text-gray-900 dark:text-white'>
                {currentQuestion?.content?.text
                  ?.split('_____')
                  .map((part, index, array) => {
                    const selectedValue =
                      response.blanks?.[`blank${index + 1}`] || '';
                    const blankKey = `blank${index + 1}`;
                    const blankOptions =
                      currentQuestion?.content?.blanks?.[index]?.options || [];
                    const blankResult =
                      evaluationResult?.evaluation?.detailedAnalysis
                        ?.itemResults?.[blankKey];
                    const isCorrect = blankResult?.isCorrect;
                    const correctAnswer = blankResult?.correctAnswer;

                    let selectClassColor = '';
                    if (isCompleted && blankResult) {
                      selectClassColor = isCorrect
                        ? 'border-green-400 bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                        : 'border-red-400 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300';
                    } else if (selectedValue) {
                      selectClassColor =
                        'border-blue-400 dark:border-blue-600 bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-200';
                    } else {
                      selectClassColor =
                        'border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 hover:border-blue-400 dark:hover:border-blue-500 text-gray-700 dark:text-gray-300';
                    }

                    return (
                      <span key={index}>
                        {part}
                        {index < array.length - 1 && (
                          <>
                            <BlankDropdown
                              blankKey={blankKey}
                              value={selectedValue}
                              options={blankOptions}
                              disabled={isCompleted}
                              selectClassColor={selectClassColor}
                              openBlankKey={openBlankKey}
                              setOpenBlankKey={setOpenBlankKey}
                              onSelect={(nextValue) => {
                                if (isCompleted) return;
                                setResponse({
                                  ...response,
                                  blanks: {
                                    ...response.blanks,
                                    [`blank${index + 1}`]: nextValue,
                                  },
                                });
                              }}
                            />

                            {/* Show correct answer if incorrect */}
                            {isCompleted && !isCorrect && correctAnswer && (
                              <div className='ml-1 inline-block'>
                                <span className='text-xs font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 px-1.5 py-0.5 rounded border border-emerald-200 dark:border-emerald-800'>
                                  ✓ {correctAnswer}
                                </span>
                              </div>
                            )}
                          </>
                        )}
                      </span>
                    );
                  })}
              </div>
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
                onClick={handleResetRecording}
                disabled={isSubmitting}
                className='px-6 py-3 rounded-xl bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50 font-semibold transition'
              >
                Reset
              </button>

              {!isCompleted && (
                <button
                  onClick={handleSubmit}
                  disabled={
                    Object.keys(response.blanks).length === 0 || isSubmitting
                  }
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
                                    Your response for Fill in the Blanks
                                    (Dropdown) is judged on your ability to use
                                    contextual and grammatical cues to identify
                                    words that complete a reading text. If all
                                    blanks are filled correctly, you receive the
                                    maximum score points for this question type.
                                    If one or more blanks are filled
                                    incorrectly, partial credit scoring applies.
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

                {/* Explaination */}
                {evaluationResult?.evaluation?.detailedAnalysis
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
                      {evaluationResult.evaluation.detailedAnalysis.explanation}
                    </div>
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
        questionType={PteQuestionTypeName.READING_FILL_IN_THE_BLANKS}
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
        questionType={PteQuestionTypeName.READING_FILL_IN_THE_BLANKS}
        questionNumber={currentIndex + 1}
      />

      {/* Error Detail Modal */}
      {selectedError && (
        <div className='fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4'>
          <div className='bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full p-6 space-y-4'>
            <div>
              <label className='text-xs font-medium text-gray-600 dark:text-gray-400 mb-1 block'>
                Error Type:
              </label>
              <div className='p-2 bg-red-50 dark:bg-red-900/20 rounded border border-red-200 dark:border-red-800'>
                <span className='text-red-800 dark:text-red-200 font-medium text-sm capitalize'>
                  {selectedError.type?.replace(/_/g, ' ')}
                </span>
              </div>
            </div>

            <div>
              <label className='text-xs font-medium text-gray-600 dark:text-gray-400 mb-1 block'>
                Your text:
              </label>
              <div className='p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded border border-yellow-200 dark:border-yellow-800'>
                <span className='text-yellow-800 dark:text-yellow-200 font-medium text-sm'>
                  "{selectedError.text}"
                </span>
              </div>
            </div>

            {selectedError.correction &&
              selectedError.type !== 'missing_word' &&
              selectedError.type !== 'unnecessary_word' && (
                <div>
                  <label className='text-xs font-medium text-gray-600 dark:text-gray-400 mb-1 block'>
                    ✅ Suggested correction:
                  </label>
                  <div className='p-2 bg-green-50 dark:bg-green-900/20 rounded border border-green-200 dark:border-green-800'>
                    <span className='text-green-800 dark:text-green-200 font-medium text-sm'>
                      "{selectedError.correction}"
                    </span>
                  </div>
                </div>
              )}

            {selectedError.type === 'missing_word' && (
              <div>
                <label className='text-xs font-medium text-gray-600 dark:text-gray-400 mb-1 block'>
                  ✅ Include this word:
                </label>
                <div className='p-2 bg-green-50 dark:bg-green-900/20 rounded border border-green-200 dark:border-green-800'>
                  <span className='text-green-800 dark:text-green-200 font-medium text-sm'>
                    "{selectedError.correction}"
                  </span>
                </div>
              </div>
            )}

            <div>
              <label className='text-xs font-medium text-gray-600 dark:text-gray-400 mb-1 block'>
                💡 Explanation:
              </label>
              <div className='p-2 bg-blue-50 dark:bg-blue-900/20 rounded border border-blue-200 dark:border-blue-800'>
                <span className='text-blue-800 dark:text-blue-200 text-xs leading-relaxed'>
                  {selectedError.explanation}
                </span>
              </div>
            </div>

            <div className='mt-4 flex justify-end'>
              <button
                onClick={() => setSelectedError(null)}
                className='px-3 py-1.5 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors text-sm font-medium'
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PracticeFillInTheBlanksDropdown;

export interface Data {
  responseId: string;
  evaluation: Evaluation;
  question: Question;
  timeTaken: number;
  transcribedText: any;
}

export interface Evaluation {
  score: Score;
  isCorrect: boolean;
  feedback: string;
  detailedAnalysis: DetailedAnalysis;
  suggestions: string[];
}

export interface Score {
  scored: number;
  max: number;
}

export interface DetailedAnalysis {
  scores: Scores;
  feedback: Feedback;
  timeTaken: number;
  itemResults: ItemResults;
  explanation: string;
}

export interface Scores {
  reading: Reading;
}

export interface Reading {
  score: number;
  max: number;
}

export interface Feedback {
  summary: string;
}

export interface BlankResult {
  userAnswer: string;
  correctAnswer: string;
  isCorrect: boolean;
}

export interface ItemResults {
  [key: string]: BlankResult;
}

export interface Blank1 {
  userAnswer: string;
  correctAnswer: string;
  isCorrect: boolean;
}

export interface Blank2 {
  userAnswer: string;
  correctAnswer: string;
  isCorrect: boolean;
}

export interface Blank3 {
  userAnswer: string;
  correctAnswer: string;
  isCorrect: boolean;
}

export interface Question {
  id: string;
  questionCode: string;
  questionType: string;
  sectionName: string;
}
