import {
  AlertCircle,
  BarChart3,
  CheckCircle,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Filter,
  History,
  Info,
} from 'lucide-react';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
  timeLimit: number;
  preparationTime: number;
  recordingTime: number;
}

const PracticeReadingFillInTheBlanks: React.FC = () => {
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

  // Evaluation features
  const [isCompleted, setIsCompleted] = useState(false);
  const [evaluationResult, setEvaluationResult] = useState<Data | null>(null);
  const [showPreviousResponses, setShowPreviousResponses] = useState(false);
  const [selectedResponse, setSelectedResponse] = useState<any>(null);
  const [showResponseModal, setShowResponseModal] = useState(false);

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

  const currentQuestion = questions[currentIndex];

  // Reset state when question changes
  useEffect(() => {
    setIsCompleted(false);
    setResponse({ blanks: {} });
    setEvaluationResult(null);
    setShowPreviousResponses(false);
    setSelectedResponse(null);
    setShowResponseModal(false);
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

  const handleResetRecording = () => {
    setResponse({ blanks: {} });
    setElapsedSeconds(0);

    setIsCompleted(false);
    setEvaluationResult(null);
    setError(null);
  };

  const handleSubmit = useCallback(async () => {
    if (isCompleted || isSubmitting) return;

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
  }, [
    isCompleted,
    isSubmitting,
    currentQuestion,
    response,
    setError,
    elapsedSeconds,
  ]);

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
              Fill In The Blanks (Dropdown){' '}
              <p className='text-gray-400 dark:text-gray-400 text-sm'>
                (Question {currentIndex + 1} of {questions.length})
              </p>
            </h1>

            <div className='flex flex-row items-center space-x-3 '>
              <p className='font-bold text-blue-600 dark:text-blue-400 text-sm leading-relaxed'>
                There are some words missing in the following text. Please
                select the correct word in the drop-down box.{' '}
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
        <div className='flex-1 overflow-auto relative'>
          <div className='absolute top-4 right-4 z-10 rounded-lg bg-white/90 dark:bg-gray-800/90 backdrop-blur px-3 py-1.5 border border-gray-200 dark:border-gray-600 shadow-sm'>
            <p className='text-xs font-semibold text-gray-700 dark:text-gray-200'>
              Elapsed Time: {formatElapsedTime(elapsedSeconds)}
            </p>
          </div>
          <div className='max-w-6xl mx-auto p-8 space-y-6'>
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
                          <span className='inline-block relative mx-1 align-baseline group'>
                            <div className='relative inline-block'>
                              <select
                                value={selectedValue}
                                onChange={(e) => {
                                  if (!isCompleted) {
                                    setResponse({
                                      ...response,
                                      blanks: {
                                        ...response.blanks,
                                        [`blank${index + 1}`]: e.target.value,
                                      },
                                    });
                                  }
                                }}
                                disabled={isCompleted}
                                className={`min-w-[140px] h-[24px] px-3 pr-7 border-2 rounded-lg text-center transition-all duration-200 font-medium appearance-none cursor-pointer
                                  disabled:cursor-not-allowed outline-none text-sm
                                  ${selectClassColor}`}
                              >
                                <option value=''>Select</option>
                                {blankOptions.map((option: string) => (
                                  <option
                                    key={option}
                                    value={option}
                                  >
                                    {option}
                                  </option>
                                ))}
                              </select>
                              <ChevronDown className='absolute right-1.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600 dark:text-gray-400 pointer-events-none' />
                            </div>

                            {/* Show correct answer if incorrect */}
                            {isCompleted && !isCorrect && correctAnswer && (
                              <div className='ml-1 inline-block'>
                                <span className='text-xs font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 px-1.5 py-0.5 rounded border border-emerald-200 dark:border-emerald-800'>
                                  ✓ {correctAnswer}
                                </span>
                              </div>
                            )}
                          </span>
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
        questionType={PteQuestionTypeName.READING_FILL_IN_THE_BLANKS}
      />
    </div>
  );
};

export default PracticeReadingFillInTheBlanks;

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
  itemResults?: {
    [key: string]: {
      userAnswer: string;
      correctAnswer: string;
      isCorrect: boolean;
    };
  };
}

export interface BlankResults {
  [key: string]: {
    userAnswer: string;
    correctAnswer: string;
    isCorrect: boolean;
  };
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
