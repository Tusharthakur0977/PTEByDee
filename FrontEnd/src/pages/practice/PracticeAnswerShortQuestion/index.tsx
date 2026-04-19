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
  XCircle,
} from 'lucide-react';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AudioRecorder from '../../../components/AudioRecorder';
import InlinePreviousAttempts from '../../../components/InlinePreviousAttempts';
import MiniAudioPlayer from '../../../components/MiniAudioPlayer';
import PreviousResponses from '../../../components/PreviousResponses';
import QuestionSidebar from '../../../components/QuestionSidebar';
import api from '../../../services/api';
import { getPracticeQuestions } from '../../../services/portal';
import { Data } from '../../../types/AnswerShortQuestionEvaluationResult';
import { PteQuestionTypeName } from '../../../types/pte';
import { playBeep } from '../../../utils/Helpers';
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
  timeLimit: number;
  preparationTime: number;
  recordingTime: number;
}

const PracticeAnswerShortQuestion: React.FC = () => {
  const navigate = useNavigate();
  const [questions, setQuestions] = useState<any[]>([]);
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
  // Audio and evaluation features
  const [isCompleted, setIsCompleted] = useState(false);
  const [isProcessingAudio, setIsProcessingAudio] = useState(false);
  const [isAudioReady, setIsAudioReady] = useState(false);
  const [evaluationResult, setEvaluationResult] = useState<Data | null>(null);
  const [isAudioFinished, setIsAudioFinished] = useState(false);
  const [resetKey, setResetKey] = useState(0);
  const [showPreviousResponses, setShowPreviousResponses] = useState(false);
  const [selectedResponse, setSelectedResponse] = useState<any>(null);
  const [showResponseModal, setShowResponseModal] = useState(false);
  const [uploadedAudioUrl, setUploadedAudioUrl] = useState<any>({});
  const [shouldAutoStartRecording, setShouldAutoStartRecording] =
    useState(true);

  const [selectedError, setSelectedError] = useState<any>(null);

  const audioPlayerRef = useRef<any>(null);
  const audioRecorderRef = useRef<any>(null);

  const loadQuestions = useCallback(async () => {
    try {
      setIsLoading(true);
      const options: any = {
        limit: 100,
        random: true,
      };

      if (difficultyLevel !== 'all') {
        options.difficultyLevel = difficultyLevel;
      }

      const response = await getPracticeQuestions(
        PteQuestionTypeName.ANSWER_SHORT_QUESTION,
        options,
      );
      setQuestions(response.questions);
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
    setUploadedAudioUrl({});
    setEvaluationResult(null);
    setIsAudioReady(false);
    setIsProcessingAudio(false);
    setIsAudioFinished(false);
    setShowPreviousResponses(false);
    setSelectedResponse(null);
    setShowResponseModal(false);
    setResetKey((prev) => prev + 1);
    setShouldAutoStartRecording(true);
  }, [currentIndex]);

  // Auto-start recording when audio finishes
  useEffect(() => {
    if (
      isAudioFinished &&
      shouldAutoStartRecording &&
      audioRecorderRef.current
    ) {
      const timer = setTimeout(() => {
        audioRecorderRef.current?.startRecording();
        setShouldAutoStartRecording(false);
      }, 500); // 500ms delay to ensure audio player has finished

      return () => clearTimeout(timer);
    }
  }, [isAudioFinished, shouldAutoStartRecording]);

  const handleAudioRecordingComplete = (audioUrl: string) => {
    setUploadedAudioUrl(audioUrl);
    setIsAudioReady(true);
  };

  const handleStartRecordingManually = () => {
    if (audioPlayerRef.current) {
      audioPlayerRef.current.stop(); // Stops the question audio
    }
    audioRecorderRef.current?.startRecording(); // Starts recording + plays beep
  };

  const handleSubmit = useCallback(async () => {
    if (isCompleted || isSubmitting) return;

    if (!uploadedAudioUrl) {
      setError('Please record an audio response');
      return;
    }

    try {
      setIsSubmitting(true);
      setIsProcessingAudio(true);

      const result = await api.post('/user/questions/submit-response', {
        questionId: questions[currentIndex]?.id,
        userResponse: {
          audioResponseUrl: uploadedAudioUrl,
        },
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
      setIsCompleted(true);
    } finally {
      setIsSubmitting(false);
      setIsProcessingAudio(false);
    }
  }, [isCompleted, isSubmitting, uploadedAudioUrl, questions, currentIndex]);

  const handleViewResponse = (resp: any) => {
    setShowPreviousResponses(false);
    setSelectedResponse(resp);
    setShowResponseModal(true);
  };

  const handleCloseResponseModal = () => {
    setShowResponseModal(false);
    setSelectedResponse(null);
  };

  const handleResetRecording = () => {
    audioRecorderRef.current?.clearRecording();
    setIsCompleted(false);
    setUploadedAudioUrl({});
    setEvaluationResult(null);
    setIsAudioReady(false);
    setIsProcessingAudio(false);
    setIsAudioFinished(false);
    setShowPreviousResponses(false);
    setSelectedResponse(null);
    setShowResponseModal(false);
    setResetKey((prev) => prev + 1);
    setShouldAutoStartRecording(true);
    setError(null);
  };

  const handleExit = () => {
    if (window.confirm('Are you sure you want to exit?')) {
      navigate('/portal');
    }
  };

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

  const currentQuestion = questions[currentIndex];

  const handleQuestionSelect = (questionId: string) => {
    const selectedIndex = questions.findIndex((q) => q.id === questionId);
    if (selectedIndex !== -1) {
      setCurrentIndex(selectedIndex);
      setShowQuestionSidebar(false);
    }
  };

  const getScoreColor = (score: number, maxScore: number) => {
    const percentage = (score / maxScore) * 100;
    if (percentage >= 80) return 'text-green-600 dark:text-green-400';
    if (percentage >= 60) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  return (
    <div className='min-h-[calc(100vh-65px)] bg-gradient-to-br dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex flex-col'>
      {/* HEADER */}
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
              Answer Short Question{' '}
              <p className='text-gray-400 dark:text-gray-400 text-sm'>
                (Question {currentIndex + 1} of {questions.length})
              </p>
            </h1>

            <div className='flex flex-row items-center space-x-3 '>
              <h3 className='font-medium text-gray-700 dark:text-gray-400'>
                Instructions
              </h3>
              <p className='font-bold text-blue-600 dark:text-blue-400 text-sm leading-relaxed'>
                Listen to the audio question and respond with a simple, short
                answer—often just one or a few words—within 10 seconds.
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
        !isLoading && (
          <div className='flex-1 overflow-auto px-6 py-8'>
            <div className='max-w-4xl mx-auto space-y-6'>
              {/* Audio Player */}
              {currentQuestion?.content?.audioUrl && (
                <div className='rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 p-4'>
                  <MiniAudioPlayer
                    ref={audioPlayerRef}
                    src={currentQuestion.content.audioUrl}
                    title='Listen to the question'
                    autoPlay
                    autoPlayDelay={2000}
                    onEnded={() => setIsAudioFinished(true)}
                    key={`audio-${currentQuestion.id}-${resetKey}`}
                    questionId={currentQuestion.id}
                    questionAudioText={currentQuestion.content.text || ''}
                  />
                </div>
              )}

              {/* Recorder + Actions */}
              <AudioRecorder
                ref={audioRecorderRef}
                onRecordingComplete={handleAudioRecordingComplete}
                onRecordingStart={playBeep}
                onManualStart={handleStartRecordingManually}
                maxDuration={10}
                autoUpload
                disabled={isCompleted}
                key={`recorder-${currentQuestion?.id}-${resetKey}`}
              />

              <div className='flex flex-col sm:flex-row gap-4 justify-center'>
                <button
                  onClick={handleResetRecording}
                  disabled={
                    isSubmitting || (!isAudioReady && !uploadedAudioUrl)
                  }
                  className='px-6 py-3 rounded-xl bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50 font-semibold transition dark:text-white'
                >
                  Reset
                </button>

                {!isCompleted && (
                  <button
                    onClick={handleSubmit}
                    disabled={!isAudioReady || isSubmitting}
                    className='flex-1 sm:flex-none sm:w-[60%] bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-semibold py-3 rounded-xl shadow-md transition'
                  >
                    {isSubmitting ? 'Submitting...' : 'Submit Answer'}
                  </button>
                )}
              </div>

              {/* ENHANCED EVALUATION UI */}

              {evaluationResult?.evaluation && (
                <div
                  ref={evaluationRef}
                  className='space-y-6'
                >
                  <div className='space-y-4'>
                    <h3 className='text-lg font-semibold text-gray-900 dark:text-white'>
                      Detailed Results
                    </h3>
                    <div className='space-y-4 relative group'>
                      <div className='bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden'>
                        <table className='w-full'>
                          <thead className='bg-gray-50 dark:bg-gray-700'>
                            <tr>
                              <th className='px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-white'>
                                Scoring Rubric
                              </th>
                              <th className='px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-white'>
                                Score
                              </th>
                            </tr>
                          </thead>
                          <tbody className='divide-y divide-gray-200 dark:divide-gray-700'>
                            <tr className='hover:bg-gray-50 dark:hover:bg-gray-700'>
                              <td className='px-6 py-4 whitespace-nowrap'>
                                <div className='flex items-center gap-2'>
                                  <span className='text-sm font-medium text-gray-900 dark:text-white capitalize'>
                                    Vocabulary
                                  </span>

                                  {/* Tooltip Trigger */}
                                  <div
                                    className='relative'
                                    onMouseEnter={(e) => {
                                      const tooltip =
                                        e.currentTarget.querySelector(
                                          '[data-tooltip]',
                                        ) as HTMLElement;
                                      if (tooltip) {
                                        const rect =
                                          e.currentTarget.getBoundingClientRect();
                                        tooltip.style.top = `${rect.bottom + 8}px`;
                                        tooltip.style.left = `${rect.left + rect.width / 2}px`;
                                      }
                                    }}
                                  >
                                    <Info className='h-4 w-4 text-gray-400 cursor-pointer' />

                                    {/* Tooltip (fixed – not clipped by table) */}
                                    <div
                                      data-tooltip
                                      className='fixed z-[9999] hidden -translate-x-1/2 rounded-lg bg-gray-900 px-3 py-2 text-xs text-white shadow-lg group-hover:block'
                                    >
                                      <p className='font-semibold mb-1'>
                                        How vocabulary is scored
                                      </p>
                                      <ul className='list-disc pl-4 space-y-0.5 text-gray-200'>
                                        <li>
                                          Use of correct and appropriate words
                                        </li>
                                        <li>Accuracy of word choice</li>
                                        <li>
                                          Ability to convey meaning clearly
                                        </li>
                                      </ul>

                                      {/* Arrow */}
                                      <div className='absolute -top-1 left-1/2 h-2 w-2 -translate-x-1/2 rotate-45 bg-gray-900'></div>
                                    </div>
                                  </div>
                                </div>
                              </td>
                              <td className='px-6 py-4 whitespace-nowrap'>
                                <span
                                  className={`text-sm font-semibold ${getScoreColor(
                                    evaluationResult?.evaluation
                                      ?.detailedAnalysis?.scores?.vocabulary
                                      ?.score || 1,
                                    evaluationResult?.evaluation
                                      ?.detailedAnalysis?.scores?.vocabulary
                                      ?.max || 0,
                                  )}`}
                                >
                                  {
                                    evaluationResult?.evaluation
                                      ?.detailedAnalysis?.scores?.vocabulary
                                      ?.score
                                  }
                                  /
                                  {
                                    evaluationResult?.evaluation
                                      ?.detailedAnalysis?.scores?.vocabulary
                                      ?.max
                                  }
                                </span>
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>

                  {evaluationResult.evaluation.detailedAnalysis?.errorAnalysis
                    ?.pronunciationErrors?.length === 0 &&
                    evaluationResult.evaluation.detailedAnalysis?.errorAnalysis
                      ?.fluencyErrors?.length === 0 &&
                    evaluationResult.evaluation.detailedAnalysis?.errorAnalysis
                      ?.contentErrors?.length === 0 && (
                      <div className='rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'>
                        <div className='p-5 border-b dark:border-gray-700'>
                          <h4 className='font-semibold dark:text-white'>
                            Your Answer
                          </h4>
                        </div>
                        <div className='p-5 text-sm leading-relaxed'>
                          {
                            evaluationResult.evaluation.detailedAnalysis
                              .userText
                          }
                        </div>
                      </div>
                    )}

                  {/* Summary Card */}
                  <div
                    className={`rounded-xl p-6 border ${
                      evaluationResult.evaluation.isCorrect
                        ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-300 dark:border-emerald-800'
                        : 'bg-rose-50 dark:bg-rose-900/20 border-rose-300 dark:border-rose-800'
                    }`}
                  >
                    <div className='flex items-center gap-3'>
                      {evaluationResult.evaluation.isCorrect ? (
                        <CheckCircle className='w-6 h-6 text-emerald-600' />
                      ) : (
                        <AlertCircle className='w-6 h-6 text-rose-600' />
                      )}
                      <div>
                        <h3 className='font-bold text-lg dark:text-white'>
                          {evaluationResult.evaluation.feedback}
                        </h3>
                        <p className='text-sm text-gray-600 dark:text-gray-400'>
                          {evaluationResult.evaluation.suggestions}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Error Analysis */}
                  {evaluationResult.evaluation.detailedAnalysis?.errorAnalysis
                    ?.pronunciationErrors?.length > 0 ||
                    evaluationResult.evaluation.detailedAnalysis?.errorAnalysis
                      ?.fluencyErrors?.length > 0 ||
                    (evaluationResult.evaluation.detailedAnalysis?.errorAnalysis
                      ?.contentErrors?.length > 0 && (
                      <div className='rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'>
                        <div className='p-5 border-b dark:border-gray-700'>
                          <h4 className='font-semibold dark:text-white'>
                            Your Answer
                          </h4>
                        </div>
                        <div className='p-5 text-sm dark:text-white leading-relaxed'>
                          {/* {renderHighlightedText(
                            evaluationResult.evaluation.detailedAnalysis
                              .userText,
                            evaluationResult.evaluation.detailedAnalysis
                              .errorAnalysis,
                            (err: string) => setSelectedError(err),
                          )} */}

                          {
                            evaluationResult.evaluation.detailedAnalysis
                              .userText
                          }
                        </div>
                      </div>
                    ))}

                  {!evaluationResult.evaluation.isCorrect && (
                    <div className='rounded-xl border border-emerald-300 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900/20 p-5'>
                      <h4 className='font-semibold mb-2 dark:text-white'>
                        Correct Answer
                      </h4>
                      <p className='text-emerald-700 dark:text-emerald-300'>
                        {evaluationResult.evaluation.detailedAnalysis
                          ?.correctAnswer || 'Expected answer'}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )
      )}

      {
        <InlinePreviousAttempts
          questionId={currentQuestion?.id}
          question={currentQuestion}
          onViewResponse={handleViewResponse}
          className='mt-6'
        />
        /* FOOTER NAVIGATION */
      }
      <div className='border-t dark:border-gray-700 px-6 py-4 flex justify-between items-center dark:bg-gray-800'>
        <button
          onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
          className='flex items-center gap-2 px-4 py-2 bg-gray-700 text-white rounded-lg'
        >
          <ChevronLeft className='w-4 h-4' />
          Previous
        </button>

        <span className='text-gray-400 text-sm'>
          {currentIndex + 1} / {questions.length}
        </span>

        <button
          onClick={() =>
            setCurrentIndex((i) => Math.min(questions.length - 1, i + 1))
          }
          className='flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg'
        >
          Next
          <ChevronRight className='w-4 h-4' />
        </button>
      </div>

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
                                ? 'bg-red-500'
                                : 'bg-gray-500'
                  }`}
                ></div>
                <h3 className='text-base font-semibold text-gray-900 dark:text-white capitalize'>
                  Wrong Answer Error
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
                    {selectedError.explanation}
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

      {/* Question Sidebar */}
      <QuestionSidebar
        isOpen={showQuestionSidebar}
        onClose={() => setShowQuestionSidebar(false)}
        questionType={PteQuestionTypeName.ANSWER_SHORT_QUESTION}
        selectedQuestionId={currentQuestion?.id}
        onQuestionSelect={handleQuestionSelect}
        practiceStatus='all'
        difficultyLevel={difficultyLevel}
        onFilterChange={(filters) => {
          setDifficultyLevel(filters.difficultyLevel);
        }}
      />

      {/* Previous Attempts Modal Drawer (Mobile/Tablet) */}
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
        questionType={PteQuestionTypeName.ANSWER_SHORT_QUESTION}
        questionNumber={currentIndex + 1}
      />
    </div>
  );
};

export default PracticeAnswerShortQuestion;
