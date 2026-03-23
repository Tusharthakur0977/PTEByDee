import {
  AlertCircle,
  ArrowLeft,
  BarChart3,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Filter,
  History,
  Info,
} from 'lucide-react';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PreviousResponses from '../../components/PreviousResponses';
import ResponseDetailModal from '../../components/ResponseDetailModal';
import api from '../../services/api';
import { getPracticeQuestions } from '../../services/portal';
import { PteQuestionTypeName } from '../../types/pte';
import { formatScoringText } from '../../utils/Helpers';
import QuestionSidebar from '../../components/QuestionSidebar';

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
  const evaluationRef = useRef<HTMLDivElement>(null);

  // User response
  const [response, setResponse] = useState<{
    blanks: { [key: string]: string };
  }>({ blanks: {} });

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
        PteQuestionTypeName.FILL_IN_THE_BLANKS_DRAG_AND_DROP,
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
  }, [currentIndex]);

  const currentQuestion = questions[currentIndex];

  // Get all available options from all blanks
  const allOptions =
    currentQuestion?.content?.blanks?.flatMap((blank) => blank.options || []) ||
    [];
  const uniqueOptions = [...new Set(allOptions)];

  // Track which options are used
  const usedOptions = Object.values(response.blanks || {}).filter(Boolean);

  const handleResetRecording = () => {
    setResponse({ blanks: {} });

    setIsCompleted(false);
    setEvaluationResult(null);
    setError(null);
  };

  const handleSubmit = useCallback(async () => {
    if (isCompleted || isSubmitting) return;

    // Check if all blanks are filled
    const allBlanksCount = currentQuestion?.content?.blanks?.length || 0;
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
              Fill In The Blanks (Drag and Drop){' '}
              <p className='text-gray-400 dark:text-gray-400 text-sm'>
                (Question {currentIndex + 1} of {questions.length})
              </p>
            </h1>

            <div className='flex flex-row items-center space-x-3 '>
              <p className='font-bold text-blue-600 dark:text-blue-400 text-sm leading-relaxed'>
                In the text below some words are missing. Drag words from the
                box below to the appropriate place in the text. To undo an
                answer choice, drag the word back to the box below the text.
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
        <div className='h-screen bg-gray-900 flex items-center justify-center'>
          <p className='dark:text-white'>No questions available</p>
        </div>
      ) : (
        <div className='flex-1 overflow-auto'>
          <div className='max-w-4xl mx-auto p-8 space-y-6'>
            {/* Text with drag and drop blanks */}
            <div className='bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-600 shadow-sm'>
              <div className='text-base leading-8 text-gray-900 dark:text-white'>
                {currentQuestion?.content?.text
                  ?.split('_____')
                  .map((part, index, array) => {
                    const selectedValue =
                      response.blanks?.[`blank${index + 1}`] || '';
                    const blankKey = `blank${index + 1}`;
                    const blankResult =
                      evaluationResult?.evaluation?.detailedAnalysis
                        ?.blankResults?.[blankKey];
                    const isCorrect = blankResult?.isCorrect;
                    const correctAnswer = blankResult?.correctAnswer;

                    let blankClassColor = '';
                    if (isCompleted && blankResult) {
                      blankClassColor = isCorrect
                        ? 'border-green-400 bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 shadow-sm'
                        : 'border-red-400 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 shadow-sm';
                    } else if (selectedValue) {
                      blankClassColor =
                        'border-blue-300 dark:border-blue-600 bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-200';
                    } else {
                      blankClassColor =
                        'border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 hover:border-blue-400 dark:hover:border-blue-500';
                    }

                    return (
                      <span key={index}>
                        {part}
                        {index < array.length - 1 && (
                          <span className='inline-block relative mx-2 my-2 align-middle'>
                            <div
                              className={`inline-flex items-center justify-center min-w-[140px] h-[42px] px-3 border-2 border-dashed rounded-xl text-center transition-all duration-200 font-medium
                                          ${blankClassColor} ${!selectedValue ? 'hover:scale-[1.03]' : ''}`}
                              onDragOver={(e) => e.preventDefault()}
                              onDrop={(e) => {
                                if (isCompleted) return;
                                e.preventDefault();
                                const draggedWord =
                                  e.dataTransfer.getData('text/plain');
                                if (draggedWord) {
                                  setResponse({
                                    ...response,
                                    blanks: {
                                      ...response.blanks,
                                      [`blank${index + 1}`]: draggedWord,
                                    },
                                  });
                                }
                              }}
                            >
                              {selectedValue ? (
                                <span
                                  className='cursor-pointer font-medium'
                                  draggable={!isCompleted}
                                  onDragStart={(e) => {
                                    e.dataTransfer.setData(
                                      'text/plain',
                                      selectedValue,
                                    );
                                    e.dataTransfer.setData('source', 'blank');
                                    e.dataTransfer.setData(
                                      'blankId',
                                      `blank${index + 1}`,
                                    );
                                  }}
                                  onClick={() => {
                                    if (!isCompleted) {
                                      // Remove word from blank on click
                                      const newBlanks = { ...response.blanks };
                                      delete newBlanks[`blank${index + 1}`];
                                      setResponse({
                                        ...response,
                                        blanks: newBlanks,
                                      });
                                    }
                                  }}
                                >
                                  {selectedValue}
                                </span>
                              ) : (
                                <span className='text-gray-400 dark:text-gray-500 text-sm'>
                                  Drop here
                                </span>
                              )}
                            </div>

                            {/* Show correct answer if incorrect */}
                            {isCompleted && !isCorrect && correctAnswer && (
                              <span className='ml-2 text-sm font-medium text-emerald-600 dark:text-emerald-400'>
                                (Answer: {correctAnswer})
                              </span>
                            )}
                          </span>
                        )}
                      </span>
                    );
                  })}
              </div>
            </div>

            {/* Available words box */}
            <div className='bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-600 shadow-sm'>
              <h5 className='font-medium text-gray-900 dark:text-white mb-4'>
                Available Words:
              </h5>
              <div
                className='flex flex-wrap gap-3 min-h-[60px] p-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700'
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  if (isCompleted) return;
                  e.preventDefault();
                  const source = e.dataTransfer.getData('source');
                  const blankId = e.dataTransfer.getData('blankId');

                  if (source === 'blank' && blankId) {
                    // Remove word from blank when dropped back to available words
                    const newBlanks = { ...response.blanks };
                    delete newBlanks[blankId];
                    setResponse({
                      ...response,
                      blanks: newBlanks,
                    });
                  }
                }}
              >
                {uniqueOptions.map((option, index) => {
                  const isUsed = usedOptions.includes(option);
                  if (option === '') return;
                  return (
                    <div
                      key={index}
                      className={`px-4 py-2 rounded-lg border cursor-move transition-all duration-200 ${
                        isUsed
                          ? 'bg-gray-200 dark:bg-gray-600 text-gray-500 dark:text-gray-400 border-gray-300 dark:border-gray-500 opacity-50'
                          : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-300 dark:border-blue-600 hover:bg-blue-200 dark:hover:bg-blue-900/50'
                      } ${isCompleted ? 'pointer-events-none' : ''}`}
                      draggable={!isUsed && !isCompleted}
                      onDragStart={(e) => {
                        if (!isUsed) {
                          e.dataTransfer.setData('text/plain', option);
                          e.dataTransfer.setData('source', 'available');
                        }
                      }}
                    >
                      {option}
                    </div>
                  );
                })}
                {uniqueOptions.length === 0 && (
                  <p className='text-gray-500 dark:text-gray-400 text-sm italic'>
                    No words available
                  </p>
                )}
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
                disabled={
                  isSubmitting || Object.keys(response.blanks).length === 0
                }
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
                        <th className='px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-gray-500'>
                          Rubric
                        </th>
                        <th className='px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-gray-500'>
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
                                  <ul className='list-disc pl-4 space-y-1 opacity-90'>
                                    <li>Appropriate word choice</li>
                                    <li>Accuracy and context</li>
                                    <li>Clarity of meaning</li>
                                  </ul>

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
                      {evaluationResult.evaluation.score}
                    </span>
                    {evaluationResult.evaluation.detailedAnalysis?.scores && (
                      <span className='ml-2 text-gray-500'>
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

                {/* Feedback Summary */}
                {evaluationResult?.evaluation && (
                  <div
                    className={`rounded-2xl p-6 border-2 space-y-6 ${
                      evaluationResult.evaluation.isCorrect
                        ? 'bg-emerald-50/50 border-emerald-100 dark:bg-emerald-500/5 dark:border-emerald-500/20'
                        : 'bg-rose-50/50 border-rose-100 dark:bg-rose-500/5 dark:border-rose-500/20'
                    }`}
                  >
                    {/* Overall Feedback */}
                    <div className='flex items-start gap-4'>
                      <div className='mt-1'>
                        {evaluationResult.evaluation.isCorrect ? (
                          <CheckCircle className='w-6 h-6 text-emerald-500' />
                        ) : (
                          <AlertCircle className='w-6 h-6 text-rose-500' />
                        )}
                      </div>

                      <div>
                        <h4 className='font-bold text-gray-900 dark:text-white text-lg'>
                          Overall Feedback
                        </h4>
                        <p className='text-sm text-gray-700 dark:text-gray-300 mt-1 leading-relaxed'>
                          {evaluationResult.evaluation.feedback}
                        </p>
                      </div>
                    </div>

                    {/* Suggestions */}
                    {evaluationResult.evaluation.suggestions?.length > 0 && (
                      <div className='bg-white/60 dark:bg-gray-800/60 rounded-xl p-4 border border-gray-200 dark:border-gray-700'>
                        <h5 className='font-semibold text-gray-800 dark:text-gray-200 mb-2'>
                          Suggestions
                        </h5>
                        <ul className='list-disc pl-5 space-y-1 text-sm text-gray-600 dark:text-gray-400'>
                          {evaluationResult.evaluation.suggestions.map(
                            (suggestion: string, index: number) => (
                              <li key={index}>{suggestion}</li>
                            ),
                          )}
                        </ul>
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
        questionType={PteQuestionTypeName.FILL_IN_THE_BLANKS_DRAG_AND_DROP}
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
        questionId={currentQuestion?.id}
        onViewResponse={handleViewResponse}
        isOpen={showPreviousResponses}
        onClose={() => setShowPreviousResponses(false)}
      />

      {/* Response Detail Modal */}
      <ResponseDetailModal
        response={selectedResponse}
        isOpen={showResponseModal}
        onClose={handleCloseResponseModal}
        questionType={PteQuestionTypeName.FILL_IN_THE_BLANKS_DRAG_AND_DROP}
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
  score: number;
  isCorrect: boolean;
  feedback: string;
  detailedAnalysis: DetailedAnalysis;
  suggestions: string[];
}

export interface DetailedAnalysis {
  overallScore: number;
  blankResults: BlankResults;
  correctCount: number;
  totalBlanks: number;
  explanation: string;
  timeTaken: number;
  scores: Scores;
}

export interface BlankResults {
  [key: string]: Blank1 | Blank2 | Blank3 | Blank4;
  blank1: Blank1;
  blank2: Blank2;
  blank3: Blank3;
  blank4: Blank4;
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

export interface Blank4 {
  userAnswer: string;
  correctAnswer: string;
  isCorrect: boolean;
}

export interface Scores {
  reading: Reading;
}

export interface Reading {
  score: number;
  max: number;
}

export interface Question {
  id: string;
  questionCode: string;
  questionType: string;
  sectionName: string;
}
