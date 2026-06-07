import {
  AlertCircle,
  CheckCircle,
  FileText,
  Mic,
  TrendingUp,
  Volume2,
  X,
  XCircle,
} from 'lucide-react';
import React, { useEffect, useState } from 'react';
import {
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import { PreviousResponse } from '../../../services/questionResponse';
import { formatScoringText } from '../../../utils/Helpers';
import { renderRepeatSentenceTranscriptAligned } from '../../../utils/repeatSentenceTranscriptRenderer';

interface ResponseDetailModalProps {
  response: PreviousResponse | null;
  isOpen: boolean;
  onClose: () => void;
  questionType?: string;
  questionNumber?: number;
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
}

interface WordAnalysisItem {
  word: string;
  status: string;
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

  if (percentage >= 80) return 'text-emerald-400';
  if (percentage >= 60) return 'text-amber-400';
  return 'text-rose-400';
};

const formatPauseSeverity = (severity: PauseMarker['severity']) => {
  if (severity === 'long_pause') return 'Long pause';
  if (severity === 'pause') return 'Pause';
  return 'Hesitation';
};

const getPauseGapClass = (severity: PauseMarker['severity']) => {
  if (severity === 'long_pause') {
    return 'border-yellow-600/80 bg-yellow-500/20 dark:border-yellow-400/90 dark:bg-yellow-400/20';
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

const getWordStatusClass = (statusRaw: string) => {
  const status = String(statusRaw || '').toLowerCase();
  if (status === 'omitted') {
    return 'bg-rose-500/10 text-rose-700 border border-rose-200 dark:bg-rose-500/10 dark:text-rose-200 dark:border-rose-800';
  }
  if (status === 'mispronounced') {
    return 'bg-orange-500/10 text-orange-700 border border-orange-200 dark:bg-orange-500/10 dark:text-orange-200 dark:border-orange-800';
  }
  if (status === 'inserted') {
    return 'bg-sky-500/10 text-sky-700 border border-sky-200 dark:bg-sky-500/10 dark:text-sky-200 dark:border-sky-800';
  }
  return '';
};

const normalizeTranscriptWord = (value: string) =>
  String(value || '')
    .toLowerCase()
    .replace(/^[^\w]+|[^\w]+$/g, '');

const renderRepeatSentenceTranscript = (
  spokenText: string,
  wordAnalysis: WordAnalysisItem[],
  pauseMarkers: PauseMarker[],
) => {
  const spokenWords = String(spokenText || '')
    .split(/\s+/)
    .filter((word) => word.length > 0);

  if (!spokenWords.length && (!wordAnalysis || wordAnalysis.length === 0)) return null;

  const normalize = (value: string) =>
    String(value || '')
      .toLowerCase()
      .replace(/^[^\w]+|[^\w]+$/g, '');

  const analysisWords = Array.isArray(wordAnalysis) ? wordAnalysis : [];

  const referenceWords = (wordAnalysis || []).filter(
    (word) => String(word?.status || '').toLowerCase() !== 'inserted',
  );

  const pauseMap = new Map<number, PauseMarker[]>();
  pauseMarkers.forEach((pause) => {
    const existing = pauseMap.get(pause.afterWordIndex) || [];
    existing.push(pause);
    pauseMap.set(pause.afterWordIndex, existing);
  });

  const gapClass = (severity: PauseMarker['severity']) => {
    if (severity === 'long_pause') return 'border-yellow-600/80 bg-yellow-500/20';
    if (severity === 'pause') return 'border-amber-500/80 bg-amber-500/20';
    return 'border-yellow-500/80 bg-yellow-500/20';
  };

  const gapWidth = (severity: PauseMarker['severity']) => {
    if (severity === 'long_pause') return 'w-14 sm:w-16';
    if (severity === 'pause') return 'w-10 sm:w-12';
    return 'w-8 sm:w-10';
  };

  const wordClass = (status: string) => {
    const normalized = String(status || '').toLowerCase();
    if (normalized === 'omitted') {
      return 'bg-red-100 text-red-800 border border-red-200 dark:bg-red-900/20 dark:text-red-200 dark:border-red-800 line-through';
    }
    if (normalized === 'mispronounced') {
      return 'bg-orange-100 text-orange-800 border border-orange-200 dark:bg-orange-900/20 dark:text-orange-200 dark:border-orange-800';
    }
    if (normalized === 'inserted') {
      return 'bg-blue-100 text-blue-800 border border-blue-200 dark:bg-blue-900/20 dark:text-blue-200 dark:border-blue-800';
    }
    return '';
  };

  const result: React.ReactNode[] = [];
  let refIndex = 0;
  let spokenIndex = 0;

  const pushWord = (
    word: string,
    status: string,
    keyPrefix: string,
    spokenPos?: number,
  ) => {
    const pauseList = spokenPos !== undefined ? pauseMap.get(spokenPos) || [] : [];
    const pause =
      pauseList.length > 0
        ? [...pauseList].sort((a, b) => {
            const rank = { hesitation: 1, pause: 2, long_pause: 3 } as const;
            return (
              rank[b.severity] - rank[a.severity] ||
              b.durationSeconds - a.durationSeconds
            );
          })[0]
        : null;

    result.push(
      <span
        key={keyPrefix}
        className={`whitespace-pre-wrap ${wordClass(status)} px-1 py-0.5 rounded font-medium`}
      >
        {word}
      </span>,
    );

    if (pause) {
      result.push(
        <span
          key={`${keyPrefix}-pause`}
          className={`group relative mx-1 inline-flex align-baseline items-end border-b-2 border-dashed ${gapClass(
            pause.severity,
          )} ${gapWidth(pause.severity)}`}
          title={`${pause.severity.replace('_', ' ')} - ${pause.durationSeconds.toFixed(2)}s`}
        >
          <span className='pointer-events-none absolute -top-5 left-1/2 hidden -translate-x-1/2 whitespace-nowrap rounded-full border border-slate-200 bg-white px-2 py-0.5 text-[10px] font-semibold text-slate-600 shadow-sm group-hover:block dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200'>
            {pause.severity.replace('_', ' ')} {pause.durationSeconds.toFixed(2)}s
          </span>
        </span>,
      );
    }
  };

  if (analysisWords.length > 0) {
    analysisWords.forEach((entry, index) => {
      const status = String(entry?.status || '').toLowerCase();
      pushWord(String(entry?.word || ''), status, `analysis-${index}`, index);

      if (index < analysisWords.length - 1) {
        result.push(
          <span key={`space-${index}`} className='whitespace-pre-wrap'>
            {' '}
          </span>,
        );
      }
    });

    return <span>{result}</span>;
  }

  while (refIndex < referenceWords.length || spokenIndex < spokenWords.length) {
    const referenceWord = referenceWords[refIndex];
    const spokenWord = spokenWords[spokenIndex];
    const normalizedReference = normalize(String(referenceWord?.word || ''));
    const normalizedSpoken = normalize(spokenWord || '');

    if (referenceWord && spokenWord && normalizedReference === normalizedSpoken) {
      pushWord(
        spokenWord,
        String(referenceWord.status || ''),
        `spoken-${spokenIndex}`,
        spokenIndex,
      );
      refIndex += 1;
      spokenIndex += 1;
      continue;
    }

    if (
      referenceWord &&
      String(referenceWord.status || '').toLowerCase() === 'omitted'
    ) {
      pushWord(
        String(referenceWord.word || ''),
        'omitted',
        `omitted-${refIndex}`,
        spokenIndex > 0 ? spokenIndex - 1 : undefined,
      );
      refIndex += 1;
      continue;
    }

    const nextMatchIndex =
      spokenWord && referenceWords
        ? referenceWords
            .slice(refIndex + 1)
            .findIndex((candidate) => normalize(String(candidate?.word || '')) === normalizedSpoken)
        : -1;

    if (spokenWord && nextMatchIndex === -1) {
      pushWord(spokenWord, 'inserted', `inserted-${spokenIndex}`, spokenIndex);
      spokenIndex += 1;
      continue;
    }

    if (referenceWord && spokenWord && nextMatchIndex >= 0) {
      pushWord(
        String(referenceWord.word || ''),
        'omitted',
        `omitted-${refIndex}`,
        spokenIndex > 0 ? spokenIndex - 1 : undefined,
      );
      refIndex += 1;
      continue;
    }

    if (referenceWord && !spokenWord) {
      pushWord(
        String(referenceWord.word || ''),
        'omitted',
        `omitted-${refIndex}`,
        spokenIndex > 0 ? spokenIndex - 1 : undefined,
      );
      refIndex += 1;
      continue;
    }

    if (!referenceWord && spokenWord) {
      pushWord(spokenWord, 'inserted', `inserted-${spokenIndex}`, spokenIndex);
      spokenIndex += 1;
      continue;
    }

    break;
  }

  return <span>{result}</span>;
};

const renderTranscriptWithPauseGaps = (
  text: string,
  pauseMarkers: PauseMarker[],
) => {
  if (!text) return null;

  const words = text.split(/\s+/).filter((word) => word.length > 0);
  const pauseMap = new Map<string, PauseMarker[]>();
  const pauseWordSeverity = new Map<number, PauseMarker['severity']>();

  pauseMarkers.forEach((pause) => {
    const key = `${pause.afterWordIndex}-${pause.beforeWordIndex}`;
    const existing = pauseMap.get(key) || [];
    existing.push(pause);
    pauseMap.set(key, existing);

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

  const renderPauseGap = (pauseList: PauseMarker[], index: number) => {
    const pause = [...pauseList].sort((a, b) => b.durationMs - a.durationMs)[0];
    return (
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
        <span className='pointer-events-none absolute -top-5 left-1/2 hidden -translate-x-1/2 whitespace-nowrap rounded-full border border-slate-700 bg-slate-950 px-2 py-0.5 text-[10px] font-semibold text-slate-200 shadow-sm group-hover:block'>
          {formatPauseSeverity(pause.severity)}{' '}
          {pause.durationSeconds.toFixed(2)}s
        </span>
      </span>
    );
  };

  const result: React.ReactNode[] = [];

  words.forEach((word, index) => {
    const wordSeverity = pauseWordSeverity.get(index);
    result.push(
      <span
        key={`word-${index}`}
        className={`whitespace-pre-wrap ${
          wordSeverity ? `${getPauseWordClass(wordSeverity)} font-medium` : ''
        }`}
      >
        {word}
      </span>,
    );

    const pauseList = pauseMap.get(`${index}-${index + 1}`);
    if (pauseList && pauseList.length > 0) {
      result.push(renderPauseGap(pauseList, index));
    }

    if (index < words.length - 1) {
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
  const pauseMarkers: PauseMarker[] = (
    Array.isArray(analysis?.speechFlow?.pauseMarkers)
      ? analysis.speechFlow.pauseMarkers
      : []
  ).map((pm: any) => ({
    ...pm,
    afterWord: pm.afterWord || '',
    beforeWord: pm.beforeWord || '',
    durationMs: pm.durationMs || pm.durationSeconds * 1000,
  }));

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
  const wordByWordAnalysis: WordAnalysisItem[] = Array.isArray(
    (analysis as any).wordByWordAnalysis,
  )
    ? ((analysis as any).wordByWordAnalysis as WordAnalysisItem[])
    : [];

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
      '#38bdf8',
      '#818cf8',
      '#f472b6',
      '#f59e0b',
      '#34d399',
      '#f87171',
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
        <div className='rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_18px_60px_rgba(15,23,42,0.08)] dark:border-slate-700/70 dark:bg-slate-900/80 dark:shadow-[0_18px_60px_rgba(15,23,42,0.22)]'>
          <div className='rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-sm text-slate-500 dark:border-slate-600/80 dark:bg-slate-950/40 dark:text-slate-400'>
            Score details are not available for this attempt.
          </div>
        </div>
      );
    }

    return (
      <div className='rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_22px_70px_rgba(15,23,42,0.08)] dark:border-slate-700/70 dark:bg-gradient-to-br dark:from-slate-900 dark:via-slate-900 dark:to-slate-950 dark:shadow-[0_22px_70px_rgba(15,23,42,0.28)]'>
        <div className='mb-5 flex items-center gap-3'>
          <div className='flex h-10 w-10 items-center justify-center rounded-2xl border border-cyan-500/20 bg-cyan-500/10 text-cyan-600 dark:text-cyan-300'>
            <TrendingUp className='h-5 w-5' />
          </div>
          <div>
            <h3 className='text-base font-semibold text-slate-900 dark:text-slate-50'>
              Score Breakdown
            </h3>
            <p className='text-sm text-slate-500 dark:text-slate-400'>
              A quick view of how this response was scored.
            </p>
          </div>
        </div>

        <div className='grid grid-cols-1 gap-6 lg:grid-cols-2'>
          <div className='flex items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-700/60 dark:bg-slate-950/40'>
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
                <div className='text-3xl font-semibold tracking-tight text-slate-900 dark:text-slate-50'>
                  {totalScore}
                  <span className='ml-1 text-base font-medium text-slate-500 dark:text-slate-400'>
                    /{totalMax}
                  </span>
                </div>
                <div className='mt-1 text-xs font-medium uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400'>
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
                  className='rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700/60 dark:bg-slate-950/50'
                >
                  <div className='mb-2 flex items-center justify-between gap-3'>
                    <div className='flex items-center gap-2'>
                      <div
                        className='h-3 w-3 rounded-full'
                        style={{
                          backgroundColor: colors[index % colors.length],
                        }}
                      />
                      <span className='text-sm font-medium text-slate-700 dark:text-slate-200'>
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

                  <div className='h-2 rounded-full bg-slate-200 dark:bg-slate-800'>
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
                    <div>
                      <h3 className='text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-50'>
                        Repeat Sentence Response Analysis
                      </h3>
                      <p className='mt-1 max-w-2xl text-sm text-slate-600 dark:text-slate-400'>
                        Review score breakdown, inline transcript highlights,
                        and fluency details in one place.
                      </p>
                    </div>
                    
                    {(() => {
                      const qCode = response.questionCode || (response as any)?.question?.questionCode;
                      const qText = response.questionText || (response as any)?.question?.questionText;
                      if (!qCode && !qText) return null;
                      return (
                        <div className='mt-2 max-w-3xl rounded-xl border border-slate-200/60 bg-white/40 p-3 backdrop-blur-sm dark:border-slate-700/50 dark:bg-slate-900/40'>
                          {qCode && (
                            <div className='mb-1 flex items-center gap-2'>
                              <span className='rounded bg-slate-200/50 px-2 py-0.5 text-xs font-semibold text-slate-700 dark:bg-slate-800/50 dark:text-slate-300'>
                                {qCode}
                              </span>
                            </div>
                          )}
                          {qText && (
                            <p className='text-sm italic leading-relaxed text-slate-700 dark:text-slate-300 line-clamp-2 hover:line-clamp-none transition-all'>
                              "{qText}"
                            </p>
                          )}
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

          <div className='custom-scrollbar flex-1 overflow-y-auto p-4 sm:p-6'>
            <div className='grid gap-5 xl:grid-cols-[1.08fr_0.92fr]'>
              <div className='flex flex-col gap-5'>
                <div className='rounded-3xl border border-slate-200 bg-white shadow-[0_18px_60px_rgba(15,23,42,0.08)] dark:border-slate-700/70 dark:bg-slate-900/80 dark:shadow-[0_18px_60px_rgba(15,23,42,0.24)]'>
                  <div className='border-b border-slate-200 px-5 py-4 dark:border-white/10'>
                    <div className='mb-3 flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-200'>
                      <FileText className='h-4 w-4 text-slate-500 dark:text-slate-400' />
                      Transcribed Response
                    </div>

                    {wordByWordAnalysis.length > 0 ? (
                      <div className='space-y-3'>
                        <div className='flex flex-wrap items-center gap-3 text-[11px]'>
                          <span className='inline-flex items-center gap-2 rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-rose-700 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-200'>
                            <span className='h-2 w-2 rounded-full bg-rose-500 dark:bg-rose-400' />
                            Omitted
                          </span>
                          <span className='inline-flex items-center gap-2 rounded-full border border-orange-200 bg-orange-50 px-3 py-1 text-orange-700 dark:border-orange-500/20 dark:bg-orange-500/10 dark:text-orange-200'>
                            <span className='h-2 w-2 rounded-full bg-orange-500 dark:bg-orange-400' />
                            Mispronounced
                          </span>
                          <span className='inline-flex items-center gap-2 rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-sky-700 dark:border-sky-500/20 dark:bg-sky-500/10 dark:text-sky-200'>
                            <span className='h-2 w-2 rounded-full bg-sky-500 dark:bg-sky-400' />
                            Inserted
                          </span>
                          {pauseMarkers.length > 0 && (
                            <span className='inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-amber-700 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-200'>
                              <span className='h-2 w-2 rounded-full bg-amber-500 dark:bg-amber-400' />
                              Pause / hesitation
                            </span>
                          )}
                        </div>

                        <div className='rounded-2xl border border-slate-200 bg-white px-4 py-4 text-base leading-8 text-slate-900 shadow-inner dark:border-slate-700/70 dark:bg-slate-950 dark:text-slate-100'>
                          <p className='leading-8 break-words whitespace-normal'>
                            {renderRepeatSentenceTranscriptAligned({
                              spokenText: userAnswer,
                              originalText:
                                analysis.correctAnswer ||
                                '',
                              wordAnalysis: wordByWordAnalysis,
                              pauseMarkers,
                            }) ||
                              renderTranscriptWithPauseGaps(
                                userAnswer,
                                pauseMarkers,
                              )}
                          </p>
                        </div>

                        <p className='text-xs text-slate-500 dark:text-slate-400'>
                          Underlined gaps mark detected hesitations or pauses.
                        </p>
                      </div>
                    ) : (
                      <p className='whitespace-pre-wrap text-sm leading-6 text-slate-700 dark:text-slate-200'>
                        {userAnswer}
                      </p>
                    )}
                  </div>

                  <div className='px-5 py-5'>
                    <div className='space-y-4'>
                      {response.audioResponseUrl && (
                        <div className='rounded-2xl border border-cyan-200 bg-cyan-50 p-4 dark:border-cyan-500/15 dark:bg-cyan-500/10'>
                          <div className='mb-3 flex items-center gap-2 text-sm font-medium text-cyan-700 dark:text-cyan-200'>
                            <Volume2 className='h-4 w-4' />
                            Audio Response
                          </div>
                          <audio
                            controls
                            src={response.audioResponseUrl}
                            className='w-full'
                            preload='metadata'
                          >
                            Your browser does not support the audio element.
                          </audio>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className='flex flex-col gap-5'>{renderScoringChart()}</div>
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

                <div>
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

              {/* {suggestions.length > 0 && (
                <div className='mt-5 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700/60 dark:bg-slate-950/40'>
                  <h5 className='text-sm font-semibold text-slate-900 dark:text-slate-50'>
                    Key suggestions
                  </h5>
                  <ul className='mt-3 space-y-2 text-sm leading-relaxed text-slate-700 dark:text-slate-300'>
                    {suggestions.slice(0, 4).map((item, index) => (
                      <li key={`${item}-${index}`} className='flex gap-2'>
                        <span className='mt-1 h-2 w-2 flex-none rounded-full bg-cyan-500 dark:bg-cyan-400' />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )} */}
            </div>
          </div>
        </div>

        {selectedError && (
          <div className='fixed inset-0 z-[220] flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm'>
            <div className='w-full max-w-md rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_30px_120px_rgba(15,23,42,0.18)] dark:border-slate-700/70 dark:bg-slate-950 dark:shadow-[0_30px_120px_rgba(15,23,42,0.55)]'>
              <div className='mb-4 flex items-center justify-between'>
                <div className='flex items-center space-x-2'>
                  <div
                    className={`h-3 w-3 rounded-full ${
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
                  />
                  <h3 className='text-base font-semibold capitalize text-slate-900 dark:text-slate-50'>
                    Wrong answer error
                  </h3>
                </div>
                <button
                  onClick={() => setSelectedError(null)}
                  className='rounded-full p-1 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-white/5 dark:hover:text-slate-100'
                >
                  <XCircle className='h-4 w-4' />
                </button>
              </div>

              <div className='space-y-3'>
                {selectedError.type !== 'missing_word' &&
                  selectedError.type !== 'unnecessary_word' && (
                    <div>
                      <label className='mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400'>
                        Your text:
                      </label>
                      <div className='rounded-2xl border border-rose-200 bg-rose-50 p-3 dark:border-rose-500/20 dark:bg-rose-500/10'>
                        <span className='text-sm font-medium text-rose-700 dark:text-rose-200'>
                          "{selectedError.text}"
                        </span>
                      </div>
                    </div>
                  )}

                {selectedError.correction &&
                  selectedError.type !== 'missing_word' &&
                  selectedError.type !== 'unnecessary_word' && (
                    <div>
                      <label className='mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400'>
                        Suggested correction:
                      </label>
                      <div className='rounded-2xl border border-emerald-200 bg-emerald-50 p-3 dark:border-emerald-500/20 dark:bg-emerald-500/10'>
                        <span className='text-sm font-medium text-emerald-700 dark:text-emerald-200'>
                          "{selectedError.correction}"
                        </span>
                      </div>
                    </div>
                  )}

                <div>
                  <label className='mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400'>
                    Explanation:
                  </label>
                  <div className='rounded-2xl border border-sky-200 bg-sky-50 p-3 dark:border-sky-500/20 dark:bg-sky-500/10'>
                    <span className='text-xs leading-relaxed text-sky-700 dark:text-sky-200'>
                      {selectedError.explanation}
                    </span>
                  </div>
                </div>
              </div>

              <div className='mt-4 flex justify-end'>
                <button
                  onClick={() => setSelectedError(null)}
                  className='rounded-full bg-slate-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-slate-800 dark:bg-white/10 dark:text-slate-100 dark:hover:bg-white/15'
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ResponseDetailModal;

export interface Data {
  responseId: string;
  evaluation: Evaluation;
  question: Question;
  timeTaken: number;
  transcribedText: string;
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
  userText: string;
  errorAnalysis: ErrorAnalysis;
  speechFlow?: {
    pauseMarkers?: PauseMarker[];
    totalPauseCount?: number;
    totalPausedMs?: number;
    longestPauseMs?: number;
    timingAvailable?: boolean;
    timedWordCount?: number;
    mappedWordCount?: number;
  };
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
  oralFluency: string;
  pronunciation: string;
}

export interface ErrorAnalysis {
  pronunciationErrors: any[];
  fluencyErrors: any[];
  contentErrors: any[];
}

export interface Question {
  id: string;
  questionCode: string;
  questionType: string;
  sectionName: string;
}

