import {
  AlertCircle,
  BarChart3,
  CheckCircle,
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
import MiniAudioPlayer from '../../../components/MiniAudioPlayer';
import PreviousResponses from '../../../components/PreviousResponses';
import QuestionSidebar from '../../../components/QuestionSidebar';
import api from '../../../services/api';
import { getPracticeQuestions } from '../../../services/portal';
import { PteQuestionTypeName } from '../../../types/pte';
import {
  formatScoringText,
  renderHighlightedText,
} from '../../../utils/Helpers';
import ResponseDetailModal from './ResponseDetailModal';

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

const PracticeSummarizeSpokenText: React.FC = () => {
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
  const audioPlayerRef = useRef<{
    pause: () => void;
    play: () => void;
    stop: () => void;
  }>(null);

  // User response
  const [response, setResponse] = useState<{
    textResponse: string;
  }>({ textResponse: '' });

  // Evaluation features
  const [isCompleted, setIsCompleted] = useState(false);
  const [evaluationResult, setEvaluationResult] = useState<Data | null>(null);
  const [showPreviousResponses, setShowPreviousResponses] = useState(false);
  const [selectedResponse, setSelectedResponse] = useState<any>(null);
  const [showResponseModal, setShowResponseModal] = useState(false);
  const [selectedError, setSelectedError] = useState<any>(null);
  const evaluationRef = useRef<HTMLDivElement>(null);

  // Timer states
  const [remainingTime, setRemainingTime] = useState(600); // 10 minutes in seconds
  const [timerActive, setTimerActive] = useState(false);
  const timerIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

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
        PteQuestionTypeName.SUMMARIZE_SPOKEN_TEXT,
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
    audioPlayerRef.current?.stop();
    setIsCompleted(false);
    setResponse({ textResponse: '' });
    setEvaluationResult(null);
    setShowPreviousResponses(false);
    setSelectedResponse(null);
    setShowResponseModal(false);

    // Reset timer
    setRemainingTime(600); // 10 minutes
    setTimerActive(false);
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
  }, [currentIndex]);

  // Start timer when audio loads
  useEffect(() => {
    if (currentQuestion?.content?.audioUrl && !isCompleted) {
      const timer = setTimeout(() => {
        setTimerActive(true);
      }, 500); // Small delay to ensure audio player is ready
      return () => clearTimeout(timer);
    }
  }, [currentQuestion?.content?.audioUrl, isCompleted]);

  const handleReset = () => {
    audioPlayerRef.current?.stop();
    audioPlayerRef.current?.play();
    setResponse({ textResponse: '' });
    setIsCompleted(false);
    setEvaluationResult(null);
    setError(null);

    // Reset and start timer
    setRemainingTime(600);
    setTimerActive(true);
  };

  // Timer effect
  useEffect(() => {
    if (!timerActive || remainingTime <= 0) {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
      return;
    }

    timerIntervalRef.current = setInterval(() => {
      setRemainingTime((prev) => {
        const newTime = prev - 1;
        if (newTime <= 0) {
          setTimerActive(false);
          audioPlayerRef.current?.stop();
        }
        return newTime;
      });
    }, 1000);

    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
    };
  }, [timerActive]);

  const handleSubmit = useCallback(async () => {
    if (isCompleted || isSubmitting) return;

    if (!response.textResponse.trim()) {
      setError('Please write a summary');
      return;
    }

    try {
      setIsSubmitting(true);
      audioPlayerRef.current?.stop();

      // Stop timer
      setTimerActive(false);

      const result = await api.post('/user/questions/submit-response', {
        questionId: currentQuestion?.id,
        userResponse: {
          text: response.textResponse,
        },
        timeTakenSeconds: 0,
      });

      setEvaluationResult(result.data.data);
      setIsCompleted(true);

      setTimeout(() => {
        evaluationRef.current?.scrollIntoView({
          behavior: 'smooth',
          block: 'start', // or 'center' / 'nearest'
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
  }, [isCompleted, isSubmitting, currentQuestion?.id, response]);

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

  // Normalize error analysis from API response to match helper function expectations
  const normalizeErrorAnalysis = (errorAnalysis: any) => {
    if (!errorAnalysis) return errorAnalysis;

    return {
      grammarErrors: (errorAnalysis.grammarErrors || []).map((err: any) => ({
        position: { start: err.position, end: err.position + 1 },
        text: err.error,
        error: err.error,
        correction: err.suggestion,
        suggestion: err.suggestion,
        type: 'grammar',
      })),
      spellingErrors: (errorAnalysis.spellingErrors || []).map((err: any) => ({
        position: { start: err.position, end: err.position + 1 },
        text: err.error,
        error: err.error,
        correction: err.suggestion,
        suggestion: err.suggestion,
        type: 'spelling',
      })),
      vocabularyIssues: (errorAnalysis.vocabularyIssues || []).map(
        (err: any) => ({
          position: { start: err.position, end: err.position + 1 },
          text: err.error,
          error: err.error,
          correction: err.suggestion,
          suggestion: err.suggestion,
          type: 'vocabulary',
        }),
      ),
    };
  };

  // Format remaining time as MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getScoreColor = (score: number, maxScore: number) => {
    const percentage = (score / maxScore) * 100;
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
            title='Exit'
          >
            <ChevronLeft className='w-6 h-6 text-black dark:text-white' />
          </button>
          <div>
            <h1 className='text-2xl font-bold flex items-center gap-2 text-black dark:text-white'>
              Summarize Spoken Text{' '}
              <p className='text-gray-400 dark:text-gray-400 text-sm'>
                (Question {currentIndex + 1} of {questions.length})
              </p>
            </h1>

            <div className='flex flex-row items-center space-x-3 '>
              <p className='font-bold text-blue-600 dark:text-blue-400 text-sm leading-relaxed'>
                You will hear a short report. Write a summary for a fellow
                student who was not present. You should write 50-70 words. You
                have 10 minutes to finish this task. Your response will be
                judged on the quality of your writing and on how well your
                response presents the key points presented in the lecture.
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
        <div className='flex-1 overflow-auto px-6 py-8 relative'>
          {timerActive && (
            <div className='absolute top-2 right-2 flex items-center justify-between p-2'>
              <div className='flex items-center gap-3'>
                <div className='relative flex items-center justify-center'>
                  <svg className='w-10 h-10 transform -rotate-90'>
                    <circle
                      cx='20'
                      cy='20'
                      r='18'
                      stroke='currentColor'
                      strokeWidth='3'
                      fill='transparent'
                      className='text-blue-200 dark:text-blue-700'
                    />
                    <circle
                      cx='20'
                      cy='20'
                      r='18'
                      stroke='currentColor'
                      strokeWidth='3'
                      fill='transparent'
                      strokeDasharray={113}
                      strokeDashoffset={113 - (113 * remainingTime) / 600}
                      className='text-blue-600 dark:text-blue-400 transition-all duration-1000'
                    />
                  </svg>
                  <span className='absolute text-[10px] font-bold text-blue-700 dark:text-blue-300'>
                    {formatTime(remainingTime)}
                  </span>
                </div>
                <p className='text-sm font-bold text-blue-900 dark:text-blue-100'>
                  Remaining Time
                </p>
              </div>
            </div>
          )}

          <div className='max-w-4xl mx-auto space-y-6'>
            {/* Audio Player */}
            {currentQuestion?.content?.audioUrl && (
              <div className='bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-600'>
                <MiniAudioPlayer
                  ref={audioPlayerRef}
                  src={currentQuestion.content.audioUrl}
                  questionId={currentQuestion.id}
                  autoPlay={true}
                  autoPlayDelay={2000}
                  compact={false}
                  questionAudioText={currentQuestion.content.text}
                />
              </div>
            )}

            {/* Textarea for typing summary OR Evaluation Results */}

            <textarea
              value={response.textResponse}
              onChange={(e) => {
                setResponse({ textResponse: e.target.value });
              }}
              disabled={isCompleted}
              placeholder='Write a summary of what you heard...'
              className='w-full min-h-[200px] p-4 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed'
            />

            {/* Action buttons */}
            <div className='flex flex-col sm:flex-row gap-4 justify-center'>
              <button
                onClick={handleReset}
                disabled={isSubmitting}
               className="px-6 py-3 rounded-xl bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50 font-semibold transition dark:text-white"
              >
                Reset
              </button>

              {!isCompleted && (
                <button
                  onClick={handleSubmit}
                  disabled={!response.textResponse.trim() || isSubmitting}
                  className='flex-1 sm:flex-none sm:w-[60%] bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-semibold py-3 rounded-xl shadow-md transition'
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Answer'}
                </button>
              )}
            </div>

            {evaluationResult?.evaluation && (
              <div
                ref={evaluationRef}
                className=' flex flex-1 flex-col overflow-auto px-6 py-8 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500'
              >
                <h3 className='text-xl font-bold text-gray-900 dark:text-white px-1'>
                  Detailed Analysis
                </h3>

                {/* Scoring Table */}
                <div className='bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700  shadow-sm'>
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
                        evaluationResult.evaluation.detailedAnalysis.scores,
                      ).map(([component, scroeData]) => (
                        <tr className='hover:bg-gray-50/50 dark:hover:bg-gray-700/30 transition'>
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
                                    {component === 'form' &&
                                      'Form is scored by counting the number of words in your response. You will receive full credit if your response is between 50 and 70 words. Writing fewer than 50 words or more than 70 words will decrease your score. If your summary contains fewer than 40 words or more than 100 words, you will not receive any score points for your summary on any of the five factors. Your summary will be scored zero.'}

                                    {component === 'content' &&
                                      'Content is scored by determining if all the key points of the lecture have been addressed without misrepresenting the purpose or topic. If your summary misinterprets the topic or the purpose of the lecture, you will not receive any score points for your summary on any of the five factors. Your summary will be scored zero. The best responses clearly summarize the main points and condense essential supporting points. They focus on the topic and include only key information and essential supporting points.'}
                                    {component === 'grammar' &&
                                      'Grammar is scored by determining if the basic structure of the sentences is correct. The best responses use concise sentences that clearly communicate the intended meaning.'}
                                    {component === 'spelling' &&
                                      'PTE Academic recognizes English spelling conventions from the United States, the United Kingdom, Australia and Canada. However, one spelling convention should be used consistently in a given response.'}
                                    {component === 'vocabulary' &&
                                      'Vocabulary is scored according to its relevance to the lecture and its appropriateness in an academic environment. The appropriate use of synonyms is also scored. The best responses use words from the lecture appropriately, demonstrate an understanding of the context and use synonyms effectively to show variety in language use.'}
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
                                scroeData.score || 0,
                                scroeData.max || 10,
                              )}`}
                            >
                              {scroeData.score}
                              <span className='text-gray-400 font-medium'>
                                /{scroeData.max}
                              </span>
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

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

                {/* Error Highlight Area */}
                {evaluationResult.evaluation.detailedAnalysis?.userText && (
                  <div className='rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm'>
                    <div className='px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center flex-col lg:flex-row'>
                      <h4 className='font-bold text-gray-800 dark:text-gray-200'>
                        Your Response
                      </h4>
                      <div className='flex flex-wrap items-center gap-4 text-sm'>
                        {/* Speaking error types */}
                        <div className='flex items-center space-x-2'>
                          <div className='w-3 h-3 bg-orange-500 rounded-full'></div>
                          <span className='text-gray-600 dark:text-gray-400'>
                            Pronunciation
                          </span>
                        </div>
                        <div className='flex items-center space-x-2'>
                          <div className='w-3 h-3 bg-yellow-500 rounded-full'></div>
                          <span className='text-gray-600 dark:text-gray-400'>
                            Fluency
                          </span>
                        </div>
                        <div className='flex items-center space-x-2'>
                          <div className='w-3 h-3 bg-pink-500 rounded-full'></div>
                          <span className='text-gray-600 dark:text-gray-400'>
                            Content
                          </span>
                        </div>
                        <div className='flex items-center space-x-2'>
                          <div className='w-3 h-3 bg-red-500 rounded-full'></div>
                          <span className='text-gray-600 dark:text-gray-400'>
                            Grammar
                          </span>
                        </div>

                        <span className='text-gray-500 dark:text-gray-400 text-xs'>
                          * Click colored words for explanation
                        </span>
                      </div>
                    </div>
                    <div className='p-6 text-base leading-relaxed text-gray-700 dark:text-gray-300 italic'>
                      {renderHighlightedText(
                        evaluationResult.evaluation.detailedAnalysis.userText,
                        normalizeErrorAnalysis(
                          evaluationResult.evaluation.detailedAnalysis
                            .errorAnalysis,
                        ),
                        (err: any) => setSelectedError(err),
                      )}
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

                    {evaluationResult.evaluation.detailedAnalysis?.feedback && (
                      <div>
                        <h5 className='font-semibold text-gray-800 dark:text-gray-200 mb-3'>
                          Detailed Feedback
                        </h5>

                        <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                          {Object.entries(
                            evaluationResult.evaluation.detailedAnalysis
                              .feedback,
                          ).map(([key, value]) => (
                            <div
                              key={key}
                              className='rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-4'
                            >
                              <p className='text-sm font-bold text-gray-700 dark:text-gray-300 mb-1'>
                                {formatScoringText(key)}
                              </p>
                              <p className='text-sm text-gray-600 dark:text-gray-400 leading-relaxed'>
                                {value}
                              </p>
                            </div>
                          ))}
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
        questionType={PteQuestionTypeName.SUMMARIZE_SPOKEN_TEXT}
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
        questionType={PteQuestionTypeName.SUMMARIZE_SPOKEN_TEXT}
        questionNumber={currentIndex + 1}
      />
      {selectedError && (
        <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4'>
          <div className='bg-white dark:bg-gray-800 rounded-lg p-4 max-w-md w-full border border-gray-200 dark:border-gray-700 shadow-xl'>
            <div className='flex items-center justify-between mb-4'>
              <div className='flex items-center space-x-2'>
                <div
                  className={`w-3 h-3 rounded-full ${
                    selectedError.type === 'grammar' ||
                    selectedError.type === 'unnecessary_word'
                      ? 'bg-red-500'
                      : selectedError.type === 'spelling' ||
                          selectedError.type === 'spelling_error'
                        ? 'bg-blue-500'
                        : selectedError.type === 'vocabulary' ||
                            selectedError.type === 'missing_word'
                          ? 'bg-purple-500'
                          : selectedError.type === 'pronunciation'
                            ? 'bg-orange-500'
                            : selectedError.type === 'fluency'
                              ? 'bg-yellow-500'
                              : selectedError.type === 'content'
                                ? 'bg-pink-500'
                                : 'bg-gray-500'
                  }`}
                ></div>
                <h3 className='text-base font-semibold text-gray-900 dark:text-white capitalize'>
                  {selectedError.type === 'unnecessary_word'
                    ? 'Unnecessary Word'
                    : selectedError.type === 'missing_word'
                      ? 'Missing Word'
                      : selectedError.type === 'spelling_error'
                        ? 'Spelling Mistake'
                        : selectedError.type.replace(/_/g, ' ')}{' '}
                  Error
                </h3>
              </div>
              <button
                onClick={() => setSelectedError(null)}
                className='text-gray-400 dark:text-gray-300 hover:text-gray-600 dark:hover:text-gray-200 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors'
              >
                <XCircle className='h-4 w-4' />
              </button>
            </div>

            <div className='space-y-3'>
              {selectedError.type !== 'missing_word' &&
                selectedError.type !== 'unnecessary_word' && (
                  <div>
                    <label className='text-xs font-medium text-gray-600 dark:text-gray-400 mb-1 block'>
                      ❌ Your text:
                    </label>
                    <div className='p-2 bg-red-50 dark:bg-red-900/20 rounded border border-red-200 dark:border-red-800'>
                      <span className='text-red-800 dark:text-red-200 font-medium text-sm'>
                        "{selectedError.text}"
                      </span>
                    </div>
                  </div>
                )}

              {selectedError.type === 'missing_word' && (
                <div>
                  <label className='text-xs font-medium text-gray-600 dark:text-gray-400 mb-1 block'>
                    ❌ Missing word:
                  </label>
                  <div className='p-2 bg-purple-50 dark:bg-purple-900/20 rounded border border-purple-200 dark:border-purple-800'>
                    <span className='text-purple-800 dark:text-purple-200 font-medium text-sm'>
                      "{selectedError.text}"
                    </span>
                  </div>
                </div>
              )}

              {selectedError.type === 'unnecessary_word' && (
                <div>
                  <label className='text-xs font-medium text-gray-600 dark:text-gray-400 mb-1 block'>
                    ❌ Extra word that should be removed:
                  </label>
                  <div className='p-2 bg-red-50 dark:bg-red-900/20 rounded border border-red-200 dark:border-red-800'>
                    <span className='text-red-800 dark:text-red-200 font-medium text-sm'>
                      "{selectedError.text}"
                    </span>
                  </div>
                </div>
              )}

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
                    {selectedError.explanation ||
                      (selectedError.type === 'grammar'
                        ? 'This word or phrase contains a grammatical error. Use the suggested correction to fix it.'
                        : selectedError.type === 'spelling'
                          ? 'This word is misspelled. The correct spelling is provided in the suggestion above.'
                          : selectedError.type === 'vocabulary'
                            ? 'There is a vocabulary issue with this word. Consider using the suggested correction for better expression.'
                            : 'Please review this error and use the suggestion provided.')}
                  </span>
                </div>
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

export default PracticeSummarizeSpokenText;

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
  wordCount: number;
  scores: Scores;
  feedback: Feedback;
  errorAnalysis: ErrorAnalysis;
  userText: string;
}

export interface Scores {
  content: Content;
  form: Form;
  grammar: Grammar;
  vocabulary: Vocabulary;
  spelling: Spelling;
}

export interface Content {
  score: number;
  max: number;
}

export interface Form {
  score: number;
  max: number;
}

export interface Grammar {
  score: number;
  max: number;
}

export interface Vocabulary {
  score: number;
  max: number;
}

export interface Spelling {
  score: number;
  max: number;
}

export interface Breakdown {
  content: string;
  form: string;
  grammar: string;
  vocabulary: string;
  spelling: string;
}

export interface Feedback {
  summary: string;
  content: string;
  form: string;
  grammar: string;
  vocabulary: string;
  spelling: string;
}

export interface ErrorAnalysis {
  grammarErrors: any[];
  spellingErrors: any[];
  vocabularyIssues: any[];
}

export interface Question {
  id: string;
  questionCode: string;
  questionType: string;
  sectionName: string;
}