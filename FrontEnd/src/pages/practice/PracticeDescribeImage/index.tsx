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
} from "lucide-react";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import AudioRecorder from "../../../components/AudioRecorder";
import PreviousResponses from "../../../components/PreviousResponses";
import QuestionSidebar from "../../../components/QuestionSidebar";
import api from "../../../services/api";
import { getPracticeQuestions } from "../../../services/portal";
import { PteQuestionTypeName } from "../../../types/pte";
import {
  formatScoringText,
  playBeep,
  renderHighlightedText,
} from "../../../utils/Helpers";
import ResponseDetailModal from "./ResponseDetailModal";
import { describeImageTypeOptions } from "../../../constants/describeImageTypes";

export interface QuestionsData {
  id: string;
  type: string;
  difficultyLevel: string;
  title: string;
  instructions: string;
  hasUserResponses: boolean;
  content: Content;
  tags?: string[];
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

const PracticeDescribeImage: React.FC = () => {
  const navigate = useNavigate();
  const [questions, setQuestions] = useState<QuestionsData[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showQuestionSidebar, setShowQuestionSidebar] = useState(false);
  const [difficultyLevel, setDifficultyLevel] = useState<
    "EASY" | "MEDIUM" | "HARD" | "all"
  >("all");
  const [showDifficultyFilter, setShowDifficultyFilter] = useState(false);
  const [imageTypeFilter, setImageTypeFilter] = useState<"all" | string>("all");
  const evaluationRef = useRef<HTMLDivElement>(null);
  // Audio and evaluation features
  const [isCompleted, setIsCompleted] = useState(false);
  const [isProcessingAudio, setIsProcessingAudio] = useState(false);
  const [isAudioReady, setIsAudioReady] = useState(false);
  const [evaluationResult, setEvaluationResult] = useState<Data | null>(null);
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

  const [prepTimeLeft, setPrepTimeLeft] = useState<number>(0);
  const prepTimerRef = useRef<any | null>(null);

  // Helper to clear the timer safely
  const clearPrepTimer = () => {
    if (prepTimerRef.current) {
      clearInterval(prepTimerRef.current);
      prepTimerRef.current = null;
    }
  };

  const loadQuestions = useCallback(async () => {
    try {
      setIsLoading(true);
      const options: any = {
        limit: 100,
        random: true,
      };

      if (difficultyLevel !== "all") {
        options.difficultyLevel = difficultyLevel;
      }

      if (imageTypeFilter && imageTypeFilter !== "all") {
        options.imageType = imageTypeFilter;
      }

      const response = await getPracticeQuestions(
        PteQuestionTypeName.DESCRIBE_IMAGE,
        options,
      );
      setQuestions(response.questions as QuestionsData[]);
      setCurrentIndex(0);
    } catch (err) {
      setError("Failed to load questions");
    } finally {
      setIsLoading(false);
    }
  }, [difficultyLevel, imageTypeFilter]);

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
    setShowPreviousResponses(false);
    setSelectedResponse(null);
    setShowResponseModal(false);
    setResetKey((prev) => prev + 1);
    setShouldAutoStartRecording(true);

    // Reset Preparation Time
    clearPrepTimer();
    const prepDuration = 25;
    setPrepTimeLeft(prepDuration);

    prepTimerRef.current = setInterval(() => {
      setPrepTimeLeft((prev) => {
        if (prev <= 1) {
          clearPrepTimer();
          handleStartRecordingManually(); // Auto-trigger recording
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearPrepTimer();
  }, [currentIndex]);

  useEffect(() => {
    return () => {
      audioRecorderRef.current?.stopAndRelease();
    };
  }, [currentIndex]);

  const handleAudioRecordingComplete = (audioUrl: string) => {
    setUploadedAudioUrl(audioUrl);
    setIsAudioReady(true);
  };

  const handleStartRecordingManually = () => {
    clearPrepTimer(); // Stop the countdown
    setPrepTimeLeft(0);
    if (audioPlayerRef.current) {
      audioPlayerRef.current.stop();
    }
    audioRecorderRef.current?.startRecording(); // Starts recording + plays beep
  };

  const handleSubmit = useCallback(async () => {
    if (isCompleted || isSubmitting) return;

    if (!uploadedAudioUrl) {
      setError("Please record an audio response");
      return;
    }

    try {
      setIsSubmitting(true);
      setIsProcessingAudio(true);

      const result = await api.post("/user/questions/submit-response", {
        questionId: questions[currentIndex]?.id,
        userResponse: {
          audioResponseUrl: uploadedAudioUrl,
        },
      });

      setEvaluationResult(result.data.data);

      setIsCompleted(true);

      setTimeout(() => {
        evaluationRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "start", // or 'center' / 'nearest'
        });
      }, 100);
    } catch (err: any) {
      console.error("Error submitting response:", err);
      setError(err.message || "Failed to evaluate response");

      setEvaluationResult(null);
      setIsCompleted(false);
    } finally {
      setIsSubmitting(false);
      setIsProcessingAudio(false);
      audioRecorderRef.current?.stopAndRelease();
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
    audioRecorderRef.current?.stopAndRelease();
    setIsCompleted(false);
    setUploadedAudioUrl({});
    setEvaluationResult(null);
    setIsAudioReady(false);
    setIsProcessingAudio(false);
    setShowPreviousResponses(false);
    setSelectedResponse(null);
    setShowResponseModal(false);
    setResetKey((prev) => prev + 1);
    setShouldAutoStartRecording(true);
    setError(null);
    clearPrepTimer();
    const prepDuration = 25;
    setPrepTimeLeft(prepDuration);

    prepTimerRef.current = setInterval(() => {
      setPrepTimeLeft((prev) => {
        if (prev <= 1) {
          clearPrepTimer();
          handleStartRecordingManually(); // Auto-trigger recording
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearPrepTimer();
  };

  const handleExit = () => {
    if (window.confirm("Are you sure you want to exit?")) {
      audioRecorderRef.current?.stopAndRelease();
      navigate("/portal");
    }
  };

  if (error && !isLoading && questions.length === 0) {
    return (
      <div className="h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 text-lg mb-4">{error}</p>
          <button
            onClick={() => navigate("/portal")}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg"
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
    if (percentage >= 80) return "text-green-600 dark:text-green-400";
    if (percentage >= 60) return "text-yellow-600 dark:text-yellow-400";
    return "text-red-600 dark:text-red-400";
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
              Describe Image{' '}
              <p className='text-gray-400 dark:text-gray-400 text-sm'>
                (Question {currentIndex + 1} of {questions.length})
              </p>
            </h1>

            <div className='flex flex-row items-center space-x-3 '>
              <h3 className='font-medium text-gray-700 dark:text-gray-400'>
                Instructions
              </h3>
              <p className='font-bold text-blue-600 dark:text-blue-400 text-sm leading-relaxed'>
                Look at the image below. In 25 seconds, please speak into the
                microphone and describe in detail what the image is showing. You
                will have 40 seconds to give your response.
              </p>
            </div>
            <div className='mt-3 flex flex-wrap items-center gap-3'>
              <label className='text-xs font-semibold uppercase tracking-[0.1em] text-slate-500 dark:text-slate-400'>
                Filter by image type
              </label>
              <select
                value={imageTypeFilter}
                onChange={(e) =>
                  setImageTypeFilter(
                    e.target.value === 'all' ? 'all' : e.target.value,
                  )
                }
                className='rounded-full border border-slate-200 bg-white px-5 py-1.5 text-xs font-semibold text-slate-900 outline-none transition focus:border-slate-300 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:border-slate-500'
              >
                <option value='all'>All Image Types</option>
                {describeImageTypeOptions.map((option) => (
                  <option
                    key={option.value}
                    value={option.value}
                  >
                    {option.label}
                  </option>
                ))}
              </select>
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
          <>
            <div className='flex flex-1 min-h-[70vh] flex-row overflow-auto px-6 py-8 gap-10'>
              {/* Question  Image */}
              {currentQuestion?.content?.imageUrl && (
                <div className='relative flex-[0.7] flex-col h-auto rounded-2xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 p-2 flex items-center justify-center overflow-hidden shadow-sm'>
                  {/* Preparation Timer UI */}
                  {!isAudioReady && !isCompleted && prepTimeLeft > 0 && (
                    <div className='absolute top-2 right-2 flex items-center justify-between p-2 rounded-xl animate-pulse'>
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
                              strokeDashoffset={
                                113 -
                                (113 * prepTimeLeft) /
                                  (currentQuestion?.content?.preparationTime ||
                                    25)
                              }
                              className='text-blue-600 dark:text-blue-400 transition-all duration-1000'
                            />
                          </svg>
                          <span className='absolute text-xs font-bold text-blue-700 dark:text-blue-300'>
                            {prepTimeLeft}s
                          </span>
                        </div>
                        <div>
                          <p className='text-sm font-bold text-blue-900 dark:text-blue-100'>
                            Preparation Time
                          </p>
                          <p className='text-xs text-blue-700 dark:text-blue-300'>
                            Recording starts automatically
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {currentQuestion?.tags?.length ? (
                    <div className='absolute top-2 left-2 flex flex-wrap gap-2 pt-2 text-xs font-semibold text-slate-700 dark:text-slate-200'>
                      <span className='rounded-full border border-slate-300 bg-slate-100 px-3 py-1 text-[11px] uppercase tracking-wider dark:border-slate-700 dark:bg-slate-900/60'>
                        Image Type: {currentQuestion.tags[0]}
                      </span>
                    </div>
                  ) : null}
                  <img
                    src={currentQuestion.content.imageUrl}
                    alt='Question'
                    className='max-w-[80%] max-h-[35vh] object-contain'
                  />
                </div>
              )}

              {currentQuestion?.tags?.length ? (
                <div className='absolute top-2 flex flex-wrap gap-2 pt-2 text-xs font-semibold text-slate-700 dark:text-slate-200'>
                  <span className='rounded-full border border-slate-300 bg-slate-100 px-3 py-1 text-[11px] uppercase tracking-wider dark:border-slate-700 dark:bg-slate-900/60'>
                    Image Type: {currentQuestion.tags[0]}
                  </span>
                </div>
              ) : null}
              <div className='flex-1 flex flex-col space-y-6 h-auto'>
                {/* Recorder Section */}
                <div className='flex-1 flex flex-col justify-center bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-100 dark:border-gray-800 shadow-sm'>
                  <AudioRecorder
                    ref={audioRecorderRef}
                    onRecordingComplete={handleAudioRecordingComplete}
                    onRecordingStart={playBeep}
                    onManualStart={handleStartRecordingManually}
                    maxDuration={40}
                    autoUpload
                    disabled={isCompleted}
                    key={`recorder-${currentQuestion?.id}-${resetKey}`}
                    title='Recording will start automatically when preparation finishes.'
                  />

                  <div className='flex flex-row gap-3 mt-6'>
                    <button
                      onClick={handleResetRecording}
                      disabled={
                        isSubmitting || (!isAudioReady && !uploadedAudioUrl)
                      }
                      className='flex-1 px-6 py-3 rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 disabled:opacity-50 font-bold transition-all'
                    >
                      Reset
                    </button>

                    {!isCompleted && (
                      <button
                        onClick={handleSubmit}
                        disabled={!isAudioReady || isSubmitting}
                        className='flex-[2] bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold py-3 rounded-xl shadow-lg shadow-emerald-900/20 transition-all'
                      >
                        {isSubmitting ? 'Submitting...' : 'Submit Answer'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Evaluation Results Section */}
            {evaluationResult?.evaluation && (
              <div
                ref={evaluationRef}
                className=' flex flex-1 mx-auto max-w-5xl flex-col overflow-auto px-6 py-8 gap-10 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500'
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

                                  {component === 'content' &&
                                    'Content is scored by determining if all aspects and elements of the image have been addressed in your response. Your description of relationships, possible developments and conclusions or implications based on details from the image is also scored. The best responses deal with all parts of the image, contain logical and specific information and include possible developments, conclusions or implications. Mentioning just a few disjointed ideas will negatively affect your score.'}
                                  {component === 'pronunciation' &&
                                    'Pronunciation is scored by determining if your speech is easily understandable to most regular speakers of the language. The best responses contain vowels and consonants pronounced in a native-like way, and stress words and phrases correctly. Responses should also be immediately understandable to a regular speaker of the language.'}
                                  {component === 'oralFluency' &&
                                    'Oral fluency is scored by determining if your rhythm, phrasing and stress are smooth. The best responses are spoken at a constant and natural rate of speech with appropriate phrasing. Hesitations, repetitions and false starts will negatively affect your score.'}

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
                      {/* <div className='flex flex-wrap items-center gap-4 text-sm'>
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
                      </div> */}
                    </div>
                    <div className='p-6 text-base leading-relaxed text-gray-700 dark:text-gray-300 italic'>
                      {/* {renderHighlightedText(
                        evaluationResult.evaluation.detailedAnalysis.userText,
                        evaluationResult.evaluation.detailedAnalysis
                          .errorAnalysis,
                        (err: any) => setSelectedError(err),
                      )} */}
                      {evaluationResult.evaluation.detailedAnalysis.userText}
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

                    {/* Detailed Feedback Grid */}
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
          </>
        )
      )}

      {/* FOOTER NAVIGATION */}
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
        questionType={PteQuestionTypeName.DESCRIBE_IMAGE}
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
        questionType={PteQuestionTypeName.DESCRIBE_IMAGE}
        questionNumber={currentIndex + 1}
      />
    </div>
  );
};

export default PracticeDescribeImage;

export interface SubmitApiResponse {
  success: boolean;
  data: Data;
  message: string;
  statusCode: number;
}

export interface Data {
  responseId: string;
  evaluation: Evaluation;
  question: Question;
  timeTaken: number;
  transcribedText: string;
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
  feedback: Feedback;
  contentScore: number;
  contentMaxScore: number;
  contentPercentage: number;
  oralFluencyScore: number;
  oralFluencyMaxScore: number;
  oralFluencyPercentage: number;
  pronunciationScore: number;
  pronunciationMaxScore: number;
  pronunciationPercentage: number;
  recognizedText: string;
  timeTaken: number;
  imageAnalysis: ImageAnalysis;
  keyElementsCovered: string[];
  contentFeedback: string;
  oralFluencyFeedback: string;
  pronunciationFeedback: string;
  errorAnalysis: ErrorAnalysis;
  userText: string;
}

export interface Scores {
  content: Content;
  oralFluency: OralFluency;
  pronunciation: Pronunciation;
}

export interface Content {
  score: number;
  max: number;
}

export interface OralFluency {
  score: number;
  max: number;
}

export interface Pronunciation {
  score: number;
  max: number;
}

export interface Feedback {
  summary: string;
  content: string;
  pronunciation: string;
  oralFluency: string;
}

export interface ImageAnalysis {
  imageType: string;
  mainTopic: string;
  keyElements: string[];
  conclusion: string;
  analysisGenerated: boolean;
  generatedAt: string;
}

export interface ErrorAnalysis {
  pronunciationErrors: any[];
  fluencyErrors: FluencyError[];
  grammarErrors: any[];
  contentErrors: any[];
}

export interface FluencyError {
  text: string;
  type: string;
  position: Position;
  correction: string;
  explanation: string;
}

export interface Position {
  start: number;
  end: number;
}

export interface Question {
  id: string;
  questionCode: string;
  questionType: string;
  sectionName: string;
}
