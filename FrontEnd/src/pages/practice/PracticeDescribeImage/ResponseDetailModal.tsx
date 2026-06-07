import {
  AlertCircle,
  CheckCircle,
  FileText,
  Mic,
  TrendingUp,
  Volume2,
  X
} from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { PreviousResponse } from '../../../services/questionResponse';
import { formatScoringText } from '../../../utils/Helpers';

interface ResponseDetailModalProps {
  response: PreviousResponse | null;
  isOpen: boolean;
  onClose: () => void;
  questionType?: string;
  questionNumber?: number;
  questionImageUrl?: string;
}

interface ScoreItem {
  score?: number;
  max?: number;
}

interface AnalysisErrorItem {
  text?: string;
  type?: string;
  correction?: string;
  explanation?: string;
  position?: { start?: number; end?: number };
}

interface PauseMarker {
  afterWord: string;
  beforeWord: string;
  afterWordIndex: number;
  beforeWordIndex: number;
  durationMs: number;
  durationSeconds: number;
  severity: 'hesitation' | 'pause' | 'long_pause';
}

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === 'string' && value.trim().length > 0;

const formatDate = (dateString?: string) => {
  if (!dateString) return 'Unknown date';

  return new Date(dateString).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const getScoreColor = (score: number, maxScore: number) => {
  const percentage = maxScore > 0 ? (score / maxScore) * 100 : 0;

  if (percentage >= 80) return 'text-emerald-600 dark:text-emerald-400';
  if (percentage >= 60) return 'text-amber-600 dark:text-amber-400';
  return 'text-rose-600 dark:text-rose-400';
};

const normalizeTranscriptWord = (value: string) =>
  String(value || '')
    .toLowerCase()
    .replace(/^[^\w]+|[^\w]+$/g, '');

const formatPauseSeverity = (severity: PauseMarker['severity']) => {
  if (severity === 'long_pause') return 'Long pause';
  if (severity === 'pause') return 'Pause';
  return 'Hesitation';
};

const getPauseGapClass = (severity: PauseMarker['severity']) => {
  if (severity === 'long_pause') {
    return 'border-yellow-600/70 bg-yellow-500/10 dark:border-yellow-400/90 dark:bg-yellow-400/20';
  }
  if (severity === 'pause') {
    return 'border-amber-500/70 bg-amber-500/10 dark:border-amber-400/90 dark:bg-amber-400/20';
  }
  return 'border-yellow-500/70 bg-yellow-500/10 dark:border-yellow-400/90 dark:bg-yellow-400/20';
};

const getPauseGapWidthClass = (severity: PauseMarker['severity']) => {
  if (severity === 'long_pause') return 'w-14 sm:w-16';
  if (severity === 'pause') return 'w-10 sm:w-12';
  return 'w-8 sm:w-10';
};

const getPauseWordClass = (severity: PauseMarker['severity']) => {
  if (severity === 'long_pause') return 'text-yellow-800 dark:text-yellow-300';
  if (severity === 'pause') return 'text-amber-700 dark:text-amber-300';
  return 'text-yellow-700 dark:text-yellow-300';
};

const getTranscriptWordClass = (kind?: 'pronunciation' | 'fluency') => {
  if (kind === 'pronunciation') {
    return 'bg-orange-100 text-orange-800 border border-orange-200 dark:bg-orange-900/20 dark:text-orange-200 dark:border-orange-800';
  }
  if (kind === 'fluency') {
    return 'bg-yellow-100 text-yellow-800 border border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-200 dark:border-yellow-800';
  }
  return '';
};

const renderDescribeImageTranscript = (
  spokenText: string,
  pronunciationErrors: AnalysisErrorItem[],
  fluencyErrors: AnalysisErrorItem[],
  pauseMarkers: PauseMarker[],
) => {
  const spokenWords = String(spokenText || '')
    .split(/\s+/)
    .filter((word) => word.length > 0);

  if (!spokenWords.length) return null;

  const pauseMap = new Map<number, PauseMarker[]>();
  const pauseWordSeverity = new Map<number, PauseMarker['severity']>();
  pauseMarkers.forEach((pause) => {
    const existing = pauseMap.get(pause.afterWordIndex) || [];
    existing.push(pause);
    pauseMap.set(pause.afterWordIndex, existing);

    const currentAfter = pauseWordSeverity.get(pause.afterWordIndex);
    const currentBefore = pauseWordSeverity.get(pause.beforeWordIndex);
    const severityRank = { hesitation: 1, pause: 2, long_pause: 3 } as const;
    if (
      !currentAfter ||
      severityRank[pause.severity] > severityRank[currentAfter]
    ) {
      pauseWordSeverity.set(pause.afterWordIndex, pause.severity);
    }
    if (
      !currentBefore ||
      severityRank[pause.severity] > severityRank[currentBefore]
    ) {
      pauseWordSeverity.set(pause.beforeWordIndex, pause.severity);
    }
  });

  const statusMap = new Map<number, 'pronunciation' | 'fluency'>();
  const usedPronunciation = new Set<number>();
  const usedFluency = new Set<number>();

  const markErrors = (
    errors: AnalysisErrorItem[],
    kind: 'pronunciation' | 'fluency',
    usedSet: Set<number>,
  ) => {
    errors.forEach((error) => {
      const targetTokens = String(error?.text || '')
        .split(/\s+/)
        .map(normalizeTranscriptWord)
        .filter((token) => token.length > 0);

      if (!targetTokens.length) return;

      let foundIndex = -1;
      for (
        let start = 0;
        start <= spokenWords.length - targetTokens.length;
        start += 1
      ) {
        let matches = true;
        for (let offset = 0; offset < targetTokens.length; offset += 1) {
          const spokenIndex = start + offset;
          if (usedSet.has(spokenIndex)) {
            matches = false;
            break;
          }
          if (
            normalizeTranscriptWord(spokenWords[spokenIndex]) !==
            targetTokens[offset]
          ) {
            matches = false;
            break;
          }
        }
        if (matches) {
          foundIndex = start;
          break;
        }
      }

      if (foundIndex >= 0) {
        targetTokens.forEach((_, offset) => {
          const spokenIndex = foundIndex + offset;
          usedSet.add(spokenIndex);
          if (kind === 'pronunciation' || !statusMap.has(spokenIndex)) {
            statusMap.set(spokenIndex, kind);
          }
        });
      }
    });
  };

  markErrors(pronunciationErrors, 'pronunciation', usedPronunciation);
  markErrors(fluencyErrors, 'fluency', usedFluency);

  const result: React.ReactNode[] = [];
  spokenWords.forEach((word, index) => {
    const isPunctuationOnly = /^[\s.,!?;:'"()\-]+$/.test(word);
    const wordSeverity = pauseWordSeverity.get(index);
    const status = statusMap.get(index);

    result.push(
      <span
        key={`word-${index}`}
        className={`whitespace-pre-wrap ${
          !isPunctuationOnly
            ? `rounded-md px-1 py-0.5 ${getTranscriptWordClass(status)} ${
                wordSeverity
                  ? `${getPauseWordClass(wordSeverity)} font-medium`
                  : ''
              }`
            : ''
        }`}
      >
        {word}
      </span>,
    );

    const pauseList = pauseMap.get(index);
    if (pauseList && pauseList.length > 0) {
      const pause = [...pauseList].sort(
        (a, b) => b.durationMs - a.durationMs,
      )[0];
      result.push(
        <span
          key={`pause-${index}`}
          className={`group relative mx-1 inline-flex align-baseline items-end border-b-2 border-dashed ${getPauseGapClass(
            pause.severity,
          )} ${getPauseGapWidthClass(pause.severity)}`}
          title={`${formatPauseSeverity(pause.severity)} - ${pause.durationSeconds.toFixed(2)}s`}
        >
          <span className='sr-only'>
            {formatPauseSeverity(pause.severity)} pause of{' '}
            {pause.durationSeconds.toFixed(2)} seconds
          </span>
          <span className='pointer-events-none absolute -top-5 left-1/2 hidden -translate-x-1/2 whitespace-nowrap rounded-full border border-slate-200 bg-white px-2 py-0.5 text-[10px] font-semibold text-slate-600 shadow-sm group-hover:block dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200'>
            {formatPauseSeverity(pause.severity)}{' '}
            {pause.durationSeconds.toFixed(2)}s
          </span>
        </span>,
      );
    }

    if (index < spokenWords.length - 1) {
      result.push(
        <span
          key={`space-${index}`}
          className='whitespace-pre-wrap'
        >
          {' '}
        </span>,
      );
    }
  });

  return <span>{result}</span>;
};

const ResponseDetailModal: React.FC<ResponseDetailModalProps> = ({
  response,
  isOpen,
  onClose,
  questionNumber,
  questionImageUrl,
}) => {
  const [selectedError, setSelectedError] = useState<any>(null);

  useEffect(() => {
    if (!isOpen) return;

    const previousBodyOverflow = document.body.style.overflow;
    const previousBodyTouchAction = document.body.style.touchAction;

    document.body.style.overflow = 'hidden';
    document.body.style.touchAction = 'none';

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = previousBodyOverflow;
      document.body.style.touchAction = previousBodyTouchAction;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !response) return null;

  const analysis = response.detailedAnalysis || {};
  const feedback = analysis.feedback || {};
  const scores = analysis.scores || {};
  const errorAnalysis = analysis.errorAnalysis || {};
  const speechFlow = analysis.speechFlow || {};

  const scoreEntries = Object.entries(scores)
    .map(([key, value]) => {
      const scoreItem = (value || {}) as ScoreItem;
      return {
        key,
        label: formatScoringText(key),
        score: scoreItem.score || 0,
        max: scoreItem.max || 0,
      };
    })
    .filter((item) => item.max > 0);

  const totalScore =
    typeof response.questionScore === 'number'
      ? response.questionScore
      : scoreEntries.reduce((sum, item) => sum + item.score, 0);
  const totalMax = scoreEntries.reduce((sum, item) => sum + item.max, 0);

  const userAnswer =
    response.textResponse || analysis.userText || 'No answer captured.';

  const suggestions = Array.from(
    new Set(
      [
        ...(Array.isArray((response as any).suggestions)
          ? (response as any).suggestions
          : []),
        feedback.content,
        feedback.pronunciation,
        feedback.oralFluency,
        ...(errorAnalysis.pronunciationErrors || []).map(
          (error: AnalysisErrorItem) => error.explanation,
        ),
        ...(errorAnalysis.fluencyErrors || []).map(
          (error: AnalysisErrorItem) => error.explanation,
        ),
        ...(errorAnalysis.contentErrors || []).map(
          (error: AnalysisErrorItem) => error.explanation,
        ),
      ].filter(isNonEmptyString),
    ),
  );

  const detailedFeedbackEntries = Object.entries(feedback).filter(([, value]) =>
    isNonEmptyString(value),
  );

  const renderScoringChart = () => {
    const colors = [
      '#3b82f6',
      '#8b5cf6',
      '#ec4899',
      '#f59e0b',
      '#10b981',
      '#ef4444',
    ];

    const data = scoreEntries.map((item) => ({
      name: item.label,
      value: item.score,
      max: item.max,
    }));

    const donutData =
      totalMax > 0
        ? [
            {
              name: 'Scored',
              value: Math.min(totalScore, totalMax),
            },
            {
              name: 'Remaining',
              value: Math.max(totalMax - totalScore, 0),
            },
          ]
        : [];

    if (!data.length) {
      return (
        <div className='rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-800'>
          <div className='rounded-xl border border-dashed border-gray-300 p-6 text-sm text-gray-500 dark:border-gray-700 dark:text-gray-400'>
            Score details are not available for this attempt.
          </div>
        </div>
      );
    }

    return (
      <div className='rounded-2xl border border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50 p-5 dark:border-blue-800 dark:from-blue-900/20 dark:to-indigo-900/20'>
        <div className='mb-5 flex items-center gap-2'>
          <TrendingUp className='h-5 w-5 text-blue-600 dark:text-blue-400' />
          <h3 className='text-base font-semibold text-gray-900 dark:text-white'>
            Score Breakdown
          </h3>
        </div>

        <div className='grid grid-cols-1 gap-6 lg:grid-cols-2'>
          <div className='flex items-center justify-center rounded-2xl border border-gray-200 bg-gray-50 p-3 dark:border-gray-700/60 dark:bg-gray-950/40'>
            <div className='relative flex h-[240px] w-full items-center justify-center'>
              <ResponsiveContainer
                width='100%'
                height={240}
              >
                <PieChart>
                  <Pie
                    data={donutData}
                    cx='50%'
                    cy='50%'
                    innerRadius={68}
                    outerRadius={94}
                    startAngle={90}
                    endAngle={-270}
                    paddingAngle={2}
                    dataKey='value'
                  >
                    <Cell fill='#22d3ee' />
                    <Cell
                      fill='#e2e8f0'
                      className='dark:fill-slate-800'
                    />
                  </Pie>
                  <Tooltip
                    formatter={(value: number, _name: string) =>
                      `${value}/${totalMax}`
                    }
                  />
                </PieChart>
              </ResponsiveContainer>

              <div className='pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center'>
                <div className='text-3xl font-semibold tracking-tight text-gray-900 dark:text-white'>
                  {totalScore}
                  <span className='ml-1 text-base font-medium text-gray-500 dark:text-gray-400'>
                    /{totalMax}
                  </span>
                </div>
                <div className='mt-1 text-xs font-medium uppercase tracking-[0.24em] text-gray-500 dark:text-gray-400'>
                  Total
                </div>
              </div>
            </div>
          </div>

          <div className='space-y-3'>
            {scoreEntries.map((item, index) => {
              const itemPercentage = Math.round((item.score / item.max) * 100);

              return (
                <div
                  key={item.key}
                  className='rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800/80'
                >
                  <div className='mb-2 flex items-center justify-between gap-3'>
                    <div className='flex items-center gap-2'>
                      <div
                        className='h-3 w-3 rounded-full'
                        style={{
                          backgroundColor: colors[index % colors.length],
                        }}
                      />
                      <span className='text-sm font-medium text-gray-700 dark:text-gray-200'>
                        {item.label}
                      </span>
                    </div>
                    <span
                      className={`text-sm font-semibold ${getScoreColor(
                        item.score,
                        item.max,
                      )}`}
                    >
                      {item.score}/{item.max}
                    </span>
                  </div>

                  <div className='h-2 rounded-full bg-gray-200 dark:bg-gray-700'>
                    <div
                      className='h-2 rounded-full'
                      style={{
                        width: `${itemPercentage}%`,
                        backgroundColor: colors[index % colors.length],
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className='fixed inset-0 z-50 overflow-hidden'>
      <div className='flex min-h-screen items-center justify-center px-4 py-6 text-center sm:p-6'>
        <div
          className='fixed inset-0 bg-slate-950/80 backdrop-blur-sm'
          onClick={onClose}
        />

        <div className='relative z-[201] flex w-full max-w-7xl max-h-[calc(100vh-2rem)] flex-col overflow-hidden rounded-3xl border border-slate-200 bg-slate-50 text-left align-middle shadow-[0_30px_120px_rgba(15,23,42,0.22)] transition-all dark:border-slate-700/70 dark:bg-slate-950 dark:shadow-[0_30px_120px_rgba(15,23,42,0.55)]'>
          <div className='border-b border-slate-200 bg-gradient-to-r from-sky-50 via-white to-indigo-50 px-6 py-5 sm:px-8 dark:border-white/10 dark:from-slate-900 dark:via-slate-900 dark:to-indigo-950'>
            <div className='flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between'>
              <div className='space-y-3 flex-1'>
                <div className='inline-flex items-center gap-2 rounded-full border border-cyan-500/20 bg-cyan-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-cyan-700 dark:text-cyan-300'>
                  Speaking Practice
                </div>
                <div className='flex flex-1 flex-row justify-between'>
                  <div className='space-y-3'>
                    {(() => {
                      const qCode = response.questionCode || (response as any)?.question?.questionCode;
                      return (
                        <div>
                          <h3 className='text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-50'>
                            {qCode ? qCode : 'Describe Image Response Analysis'}
                          </h3>
                          <p className='mt-1 max-w-2xl text-sm text-slate-600 dark:text-slate-400'>
                            Review score breakdown, spoken response highlights, and
                            fluency details in one place.
                          </p>
                        </div>
                      );
                    })()}
                    <div className='flex flex-wrap items-center gap-2 text-sm text-slate-700 dark:text-slate-300'>
                      {typeof questionNumber === 'number' && (
                        <span className='rounded-full border border-sky-500/20 bg-sky-500/10 px-3 py-1 text-xs font-semibold text-sky-700 dark:text-sky-300'>
                          Question {questionNumber}
                        </span>
                      )}
                      <span className='rounded-full border border-slate-200 bg-white px-3 py-1 text-xs text-slate-600 dark:border-slate-700 dark:bg-slate-900/80 dark:text-slate-300'>
                        {formatDate(response.createdAt)}
                      </span>
                    </div>
                  </div>
                  <div className='rounded-3xl border self-start border-slate-200 bg-white px-5 py-4 shadow-[0_18px_60px_rgba(15,23,42,0.08)] dark:border-slate-700/70 dark:bg-slate-900/80 dark:shadow-[0_18px_60px_rgba(15,23,42,0.24)]'>
                    <p className='text-xs uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400'>
                      Total Score
                    </p>
                    <div className='mt-2 flex items-end gap-2'>
                      <span
                        className={`text-3xl font-semibold ${getScoreColor(
                          totalScore,
                          totalMax || 1,
                        )}`}
                      >
                        {totalScore}
                      </span>
                      {totalMax > 0 && (
                        <span className='pb-1 text-sm text-slate-500 dark:text-slate-400'>
                          / {totalMax}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className='flex items-center gap-3 self-start lg:self-auto'>
                <button
                  onClick={onClose}
                  className='rounded-full border border-slate-200 bg-white p-2.5 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:border-white/10 dark:bg-white/5 dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-white'
                  aria-label='Close response details'
                >
                  <X className='h-5 w-5' />
                </button>
              </div>
            </div>
          </div>

          <div className='custom-scrollbar flex-1 min-h-0 overflow-y-auto p-4 sm:p-6'>
            <div className='grid gap-5 xl:grid-cols-2'>
              <div className='min-w-0 flex flex-col gap-5'>
                {questionImageUrl && (
                  <div className='rounded-3xl border border-slate-200 bg-white shadow-[0_18px_60px_rgba(15,23,42,0.08)] dark:border-slate-700/70 dark:bg-slate-900/80 dark:shadow-[0_18px_60px_rgba(15,23,42,0.24)]'>
                    <div className='border-b border-slate-200 px-5 py-4 dark:border-white/10'>
                      <div className='flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-200'>
                        <FileText className='h-4 w-4 text-slate-500 dark:text-slate-400' />
                        Question Image
                      </div>
                    </div>
                    <div className='p-5'>
                      <div className='flex items-center justify-center overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 dark:border-slate-700/60 dark:bg-slate-950/40'>
                        <img
                          src={questionImageUrl}
                          alt='Describe Image question'
                          className='max-h-[320px] w-full object-contain'
                        />
                      </div>
                    </div>
                  </div>
                )}

                <div className='rounded-3xl border border-slate-200 bg-white shadow-[0_18px_60px_rgba(15,23,42,0.08)] dark:border-slate-700/70 dark:bg-slate-900/80 dark:shadow-[0_18px_60px_rgba(15,23,42,0.24)]'>
                  <div className='border-b border-slate-200 px-5 py-4 dark:border-white/10'>
                    <div className='mb-3 flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-200'>
                      <Mic className='h-4 w-4 text-slate-500 dark:text-slate-400' />
                      Spoken Response
                    </div>

                    <div className='flex flex-wrap items-center gap-3 text-[11px]'>
                      <span className='inline-flex items-center gap-2 rounded-full border border-orange-200 bg-orange-50 px-3 py-1 text-orange-700 dark:border-orange-500/20 dark:bg-orange-500/10 dark:text-orange-200'>
                        <span className='h-2 w-2 rounded-full bg-orange-500 dark:bg-orange-400' />
                        Pronunciation
                      </span>
                      <span className='inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-amber-700 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-200'>
                        <span className='h-2 w-2 rounded-full bg-amber-500 dark:bg-amber-400' />
                        Pause / hesitation
                      </span>
                    </div>
                  </div>

                  <div className='px-5 py-5'>
                    {isNonEmptyString(analysis.userText) ? (
                      <div className='space-y-3'>
                        <div className='rounded-2xl border border-slate-200 bg-white px-4 py-4 text-base leading-8 text-slate-900 shadow-inner dark:border-slate-700/70 dark:bg-slate-950 dark:text-slate-100'>
                          <p className='leading-8 break-words whitespace-normal'>
                            {renderDescribeImageTranscript(
                              analysis.userText,
                              errorAnalysis.pronunciationErrors || [],
                              errorAnalysis.fluencyErrors || [],
                              (speechFlow.pauseMarkers || []) as PauseMarker[],
                            )}
                          </p>
                        </div>

                        <p className='text-xs text-slate-500 dark:text-slate-400'>
                          Orange highlights indicate pronunciation issues.
                          Yellow highlights and gaps indicate fluency notes.
                        </p>
                      </div>
                    ) : (
                      <p className='whitespace-pre-wrap text-sm leading-6 text-slate-700 dark:text-slate-200'>
                        {userAnswer}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className='min-w-0 flex flex-col gap-5'>
                {renderScoringChart()}

                <div className='rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_18px_60px_rgba(15,23,42,0.08)] dark:border-slate-700/70 dark:bg-slate-900/80 dark:shadow-[0_18px_60px_rgba(15,23,42,0.24)]'>
                  <div className='mb-3 flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-200'>
                    <Volume2 className='h-4 w-4 text-slate-500 dark:text-slate-400' />
                    Audio Response
                  </div>
                  {response.audioResponseUrl ? (
                    <audio
                      controls
                      src={response.audioResponseUrl}
                      className='w-full'
                      preload='metadata'
                    >
                      Your browser does not support the audio element.
                    </audio>
                  ) : (
                    <div className='rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-950/40 dark:text-slate-400'>
                      Audio response not available.
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div
              className={`mt-5 rounded-3xl border p-5 shadow-[0_18px_60px_rgba(15,23,42,0.24)] ${
                response.isCorrect
                  ? 'border-emerald-200 bg-emerald-50 dark:border-emerald-500/20 dark:bg-emerald-500/10'
                  : 'border-rose-200 bg-rose-50 dark:border-rose-500/20 dark:bg-rose-500/10'
              }`}
            >
              <div className='flex items-start gap-4'>
                <div className='mt-1'>
                  {response.isCorrect ? (
                    <CheckCircle className='h-6 w-6 text-emerald-600 dark:text-emerald-400' />
                  ) : (
                    <AlertCircle className='h-6 w-6 text-rose-600 dark:text-rose-400' />
                  )}
                </div>

                <div className='min-w-0'>
                  <h4 className='text-lg font-semibold text-slate-900 dark:text-slate-50'>
                    Overall Feedback
                  </h4>
                  <p className='mt-1 text-sm leading-relaxed text-slate-700 dark:text-slate-300'>
                    {response.aiFeedback ||
                      feedback.summary ||
                      'No summary available.'}
                  </p>
                </div>
              </div>

              <div className='mt-5 grid grid-cols-1 gap-4 lg:grid-cols-2'>
                {detailedFeedbackEntries.map(([key, value]) => (
                  <div
                    key={key}
                    className='rounded-2xl border border-slate-200 bg-white p-4 dark:border-white/8 dark:bg-slate-950/40'
                  >
                    <p className='mb-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400'>
                      {formatScoringText(key)}
                    </p>
                    <p className='text-sm leading-relaxed text-slate-700 dark:text-slate-200'>
                      {value as string}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* <div className="border-t border-slate-200 bg-slate-50 px-6 py-4 sm:px-8 dark:border-white/10 dark:bg-slate-950">
            <div className="flex items-center justify-between gap-4">
              <p className="text-xs text-slate-500 dark:text-slate-500">
                Review the highlighted transcript and feedback before closing.
              </p>
              <button
                onClick={onClose}
                className="rounded-full bg-slate-900 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-slate-800 dark:bg-white/10 dark:text-slate-100 dark:hover:bg-white/15"
              >
                Close
              </button>
            </div>
          </div> */}
        </div>
      </div>
    </div>
  );
};

export default ResponseDetailModal;
