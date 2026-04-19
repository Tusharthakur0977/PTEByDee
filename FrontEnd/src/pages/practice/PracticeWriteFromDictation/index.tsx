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
import { formatScoringText } from '../../../utils/Helpers';
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

type DictationToken = {
  raw: string;
  normalized: string;
};

type DictationAlignmentOp =
  | { type: 'correct'; correct: DictationToken; user: DictationToken }
  | { type: 'spelling'; correct: DictationToken; user: DictationToken }
  | { type: 'missing'; correct: DictationToken }
  | { type: 'extra'; user: DictationToken };

const normalizeWord = (word: string) =>
  word.toLowerCase().replace(/^[^a-z0-9']+|[^a-z0-9']+$/gi, '');

const tokenizeText = (text: string): DictationToken[] =>
  text
    .split(/\s+/)
    .map((raw) => raw.trim())
    .filter(Boolean)
    .map((raw) => ({
      raw,
      normalized: normalizeWord(raw),
    }))
    .filter((token) => token.normalized.length > 0);

const levenshteinDistance = (a: string, b: string): number => {
  const rows = a.length + 1;
  const cols = b.length + 1;
  const dp: number[][] = Array.from({ length: rows }, () =>
    Array(cols).fill(0),
  );

  for (let i = 0; i < rows; i++) dp[i][0] = i;
  for (let j = 0; j < cols; j++) dp[0][j] = j;

  for (let i = 1; i < rows; i++) {
    for (let j = 1; j < cols; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + cost,
      );
    }
  }

  return dp[a.length][b.length];
};

const areSimilarWords = (a: string, b: string): boolean => {
  if (!a || !b) return false;
  if (a === b) return true;

  const distance = levenshteinDistance(a, b);
  const maxLen = Math.max(a.length, b.length);
  return distance <= Math.max(1, Math.ceil(maxLen * 0.34));
};

const alignDictationWords = (
  correctText: string,
  userText: string,
): DictationAlignmentOp[] => {
  const correct = tokenizeText(correctText);
  const user = tokenizeText(userText);

  const n = correct.length;
  const m = user.length;

  const GAP = -1;
  const EXACT = 3;
  const SIMILAR = 2;
  const NEG_INF = -1e9;

  const dp: number[][] = Array.from({ length: n + 1 }, () =>
    Array(m + 1).fill(NEG_INF),
  );
  const parent: ('diag_exact' | 'diag_similar' | 'up' | 'left' | null)[][] =
    Array.from({ length: n + 1 }, () => Array(m + 1).fill(null));

  dp[0][0] = 0;

  for (let i = 1; i <= n; i++) {
    dp[i][0] = dp[i - 1][0] + GAP;
    parent[i][0] = 'up';
  }

  for (let j = 1; j <= m; j++) {
    dp[0][j] = dp[0][j - 1] + GAP;
    parent[0][j] = 'left';
  }

  for (let i = 1; i <= n; i++) {
    for (let j = 1; j <= m; j++) {
      const exact =
        correct[i - 1].normalized === user[j - 1].normalized
          ? dp[i - 1][j - 1] + EXACT
          : NEG_INF;
      const similar =
        correct[i - 1].normalized !== user[j - 1].normalized &&
        areSimilarWords(correct[i - 1].normalized, user[j - 1].normalized)
          ? dp[i - 1][j - 1] + SIMILAR
          : NEG_INF;
      const up = dp[i - 1][j] + GAP;
      const left = dp[i][j - 1] + GAP;

      const best = Math.max(exact, similar, up, left);
      dp[i][j] = best;

      if (best === exact) {
        parent[i][j] = 'diag_exact';
      } else if (best === similar) {
        parent[i][j] = 'diag_similar';
      } else if (best === up) {
        parent[i][j] = 'up';
      } else {
        parent[i][j] = 'left';
      }
    }
  }

  const ops: DictationAlignmentOp[] = [];
  let i = n;
  let j = m;

  while (i > 0 || j > 0) {
    const move = parent[i][j];

    if (move === 'diag_exact') {
      ops.push({ type: 'correct', correct: correct[i - 1], user: user[j - 1] });
      i--;
      j--;
      continue;
    }

    if (move === 'diag_similar') {
      ops.push({
        type: 'spelling',
        correct: correct[i - 1],
        user: user[j - 1],
      });
      i--;
      j--;
      continue;
    }

    if (move === 'up') {
      ops.push({ type: 'missing', correct: correct[i - 1] });
      i--;
      continue;
    }

    ops.push({ type: 'extra', user: user[j - 1] });
    j--;
  }

  return ops.reverse();
};

const renderDictationHighlightedText = (
  userText: string,
  correctText: string,
  errorAnalysis: any,
  onPressError: (error: any) => void,
) => {
  const operations = alignDictationWords(correctText || '', userText || '');

  const spellingErrors = [...(errorAnalysis?.spellingErrors || [])];
  const missingErrors = [...(errorAnalysis?.vocabularyIssues || [])].filter(
    (e: any) => e?.type === 'missing_word',
  );
  const extraErrors = [...(errorAnalysis?.grammarErrors || [])].filter(
    (e: any) => e?.type === 'unnecessary_word',
  );

  const consumeMatchingError = (
    list: any[],
    matcher: (error: any) => boolean,
  ) => {
    const idx = list.findIndex(matcher);
    if (idx === -1) return null;
    const [found] = list.splice(idx, 1);
    return found;
  };

  const parts: React.ReactNode[] = [];

  operations.forEach((op, idx) => {
    if (op.type === 'correct') {
      parts.push(
        <span
          key={`dict-correct-${idx}`}
          className='text-teal-600 dark:text-teal-300'
        >
          {op.correct.raw}
        </span>,
      );
    }

    if (op.type === 'missing') {
      const error = consumeMatchingError(
        missingErrors,
        (e) => normalizeWord(e?.text || '') === op.correct.normalized,
      ) || {
        text: op.correct.raw,
        type: 'missing_word',
        correction: op.correct.raw,
        explanation: `You missed the word: "${op.correct.raw}"`,
      };

      parts.push(
        <span
          key={`dict-missing-${idx}`}
          className='text-red-600 dark:text-red-400 font-medium cursor-pointer'
          onClick={() => onPressError(error)}
          title='Missing word — click for details'
        >
          ({op.correct.raw})
        </span>,
      );
    }

    if (op.type === 'extra') {
      const error = consumeMatchingError(
        extraErrors,
        (e) => normalizeWord(e?.text || '') === op.user.normalized,
      ) || {
        text: op.user.raw,
        type: 'unnecessary_word',
        correction: '',
        explanation: `Unnecessary word that should be removed: "${op.user.raw}"`,
      };

      parts.push(
        <span
          key={`dict-extra-${idx}`}
          className='line-through text-gray-500 dark:text-gray-400 cursor-pointer'
          onClick={() => onPressError(error)}
          title='Extra word — click for details'
        >
          {op.user.raw}
        </span>,
      );
    }

    if (op.type === 'spelling') {
      const error = consumeMatchingError(
        spellingErrors,
        (e) =>
          normalizeWord(e?.text || '') === op.user.normalized &&
          normalizeWord(e?.correction || '') === op.correct.normalized,
      ) ||
        consumeMatchingError(
          spellingErrors,
          (e) => normalizeWord(e?.text || '') === op.user.normalized,
        ) || {
          text: op.user.raw,
          type: 'spelling_error',
          correction: op.correct.raw,
          explanation: `Wrong word: "${op.user.raw}" should be "${op.correct.raw}"`,
        };

      parts.push(
        <span
          key={`dict-spelling-user-${idx}`}
          className='line-through text-orange-500 dark:text-orange-400 cursor-pointer font-medium'
          onClick={() => onPressError(error)}
          title='Click for details'
        >
          {op.user.raw}
        </span>,
      );
      parts.push(' ');
      parts.push(
        <span
          key={`dict-spelling-correction-${idx}`}
          className='text-orange-600 dark:text-orange-400 font-semibold cursor-pointer'
          onClick={() => onPressError(error)}
          title='Click for details'
        >
          ({op.correct.raw})
        </span>,
      );
    }

    if (idx < operations.length - 1) {
      parts.push(' ');
    }
  });

  return <span>{parts}</span>;
};

const PracticeWriteFromDictation: React.FC = () => {
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
        PteQuestionTypeName.WRITE_FROM_DICTATION,
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
    audioPlayerRef.current?.stop();
    audioPlayerRef.current?.play();
    setResponse({ textResponse: '' });
    setElapsedSeconds(0);
    setIsCompleted(false);
    setEvaluationResult(null);
    setError(null);
  };

  const handleSubmit = useCallback(async () => {
    if (isCompleted || isSubmitting) return;

    if (!response.textResponse.trim()) {
      setError('Please type the sentence you hear');
      return;
    }

    try {
      setIsSubmitting(true);
      audioPlayerRef.current?.stop();

      const result = await api.post('/user/questions/submit-response', {
        questionId: currentQuestion?.id,
        userResponse: {
          text: response.textResponse,
        },
        timeTakenSeconds: elapsedSeconds,
      });

      setEvaluationResult(result.data.data);
      setIsCompleted(true);
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
    currentQuestion?.id,
    response,
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

  const getScoreColor = (score: number, maxScore: number) => {
    const percentage = (score / maxScore) * 100;
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
              Write From Dictation{' '}
              <p className='text-gray-400 dark:text-gray-400 text-sm'>
                (Question {currentIndex + 1} of {questions.length})
              </p>
            </h1>

            <div className='flex flex-row items-center space-x-3 '>
              <p className='font-bold text-blue-600 dark:text-blue-400 text-sm leading-relaxed'>
                You will hear a sentence. Type the sentence in the box below
                exactly as you hear it. Write as much of the sentence as you
                can. You will hear the sentence only once.
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

            {/* Textarea for typing dictated text OR Evaluation Results */}
            <div className='space-y-3'>
              <label className='block text-sm font-medium text-gray-900 dark:text-white'>
                Type the sentence you hear:
              </label>
              <textarea
                value={response.textResponse}
                onChange={(e) => {
                  setResponse({ textResponse: e.target.value });
                }}
                disabled={isCompleted}
                placeholder='Type your answer here...'
                className='w-full min-h-[80px] p-4 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed'
              />
            </div>

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
              <div className=' flex flex-1 flex-col overflow-auto  py-8 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500'>
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
                                    How this question is scored Your response
                                    for Fill in the Blanks (Type In) is judged
                                    on your ability to listen for missing words
                                    in a recording and type the missing words
                                    into a transcription. Your score on Fill in
                                    the blanks is based on the following factor:
                                  </p>
                                  {/* <ul className="list-disc pl-4 space-y-1 opacity-90">
                                    <li>Appropriate word choice</li>
                                    <li>Accuracy and context</li>
                                    <li>Clarity of meaning</li>
                                  </ul> */}

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
                    <div className='px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center flex-col lg:flex-row gap-3'>
                      <h4 className='font-bold text-gray-800 dark:text-gray-200'>
                        Your Response
                      </h4>
                      <div className='flex flex-wrap items-center gap-4 text-xs'>
                        <div className='flex items-center gap-1.5'>
                          <span className='inline-block w-3 h-3 rounded-full bg-teal-500'></span>
                          <span className='text-gray-600 dark:text-gray-400'>
                            Correct
                          </span>
                        </div>
                        <div className='flex items-center gap-1.5'>
                          <span className='inline-block w-3 h-3 rounded-full bg-red-500'></span>
                          <span className='text-gray-600 dark:text-gray-400'>
                            Missing word
                          </span>
                        </div>
                        <div className='flex items-center gap-1.5'>
                          <span className='inline-block w-3 h-3 rounded-full bg-gray-400'></span>
                          <span className='text-gray-600 dark:text-gray-400'>
                            Extra word
                          </span>
                        </div>
                        <div className='flex items-center gap-1.5'>
                          <span className='inline-block w-3 h-3 rounded-full bg-orange-500'></span>
                          <span className='text-gray-600 dark:text-gray-400'>
                            Wrong / misspelled
                          </span>
                        </div>
                        <span className='text-gray-500 dark:text-gray-400'>
                          * Click highlighted words for details
                        </span>
                      </div>
                    </div>
                    <div className='p-6 text-base leading-relaxed text-gray-700 dark:text-gray-300 italic'>
                      {renderDictationHighlightedText(
                        evaluationResult.evaluation.detailedAnalysis.userText ||
                          '',
                        evaluationResult.evaluation.detailedAnalysis
                          .correctAnswer ||
                          evaluationResult.evaluation.detailedAnalysis
                            .correctText ||
                          '',
                        evaluationResult.evaluation.detailedAnalysis
                          .errorAnalysis,
                        (err: any) => setSelectedError(err),
                      )}
                    </div>
                    {(evaluationResult.evaluation.detailedAnalysis
                      .correctAnswer ||
                      evaluationResult.evaluation.detailedAnalysis
                        .correctText) && (
                      <div className='px-6 pb-5'>
                        <div className='rounded-lg bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-700 p-3'>
                          <p className='text-xs font-semibold text-emerald-700 dark:text-emerald-400 mb-1'>
                            ✅ Correct sentence:
                          </p>
                          <p className='text-sm text-emerald-800 dark:text-emerald-300 italic'>
                            {evaluationResult.evaluation.detailedAnalysis
                              .correctAnswer ||
                              evaluationResult.evaluation.detailedAnalysis
                                .correctText}
                          </p>
                        </div>
                      </div>
                    )}
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
        questionType={PteQuestionTypeName.WRITE_FROM_DICTATION}
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
        questionType={PteQuestionTypeName.WRITE_FROM_DICTATION}
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
    </div>
  );
};

export default PracticeWriteFromDictation;

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
  overallScore: number;
  selectedWord: string;
  correctAnswers: string[];
  timeTaken: number;
  scores: Scores;
  selectedOptionText: string;
  correctOptionText: string;
  explanation: string;
  errorAnalysis?: ErrorAnalysis;
  correctAnswer?: string;
  correctText?: string;
  userText?: string;
  correctWordCount?: number;
  totalWords?: number;
  accuracy?: number;
}

export interface ErrorAnalysis {
  spellingErrors: TextErrorItem[];
  grammarErrors: TextErrorItem[];
  vocabularyIssues: TextErrorItem[];
}

export interface TextErrorItem {
  text: string;
  type: 'spelling_error' | 'unnecessary_word' | 'missing_word';
  position: { start: number; end: number };
  correction: string;
  explanation: string;
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