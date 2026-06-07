import { TrendingUp, Volume2, X } from 'lucide-react';
import React, { useEffect } from 'react';
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { PreviousResponse } from '../../../services/questionResponse';
import { formatScoringText } from '../../../utils/Helpers';
import {
  renderSpeechTranscriptWithPauses,
  SpeechPauseMarker,
} from '../../../utils/speakingTranscriptRenderer';

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
  position?: { start?: number; end?: number };
}

interface SpeechFlow {
  pauseMarkers?: SpeechPauseMarker[];
  totalPauseCount?: number;
  totalPausedMs?: number;
  longestPauseMs?: number;
  timingAvailable?: boolean;
  timedWordCount?: number;
  mappedWordCount?: number;
  aiInferredFluencyCount?: number;
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

const ResponseDetailModal: React.FC<ResponseDetailModalProps> = ({
  response,
  isOpen,
  onClose,
  questionNumber,
  questionType = 'RESPOND_TO_A_SITUATION',
}) => {
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
  const speechFlow = (analysis.speechFlow || {}) as SpeechFlow;

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

  const speechText = response.textResponse || analysis.userText || '';
  const pronunciationErrors = (errorAnalysis.pronunciationErrors ||
    []) as AnalysisErrorItem[];
  const fluencyErrors = (errorAnalysis.fluencyErrors ||
    []) as AnalysisErrorItem[];
  const pauseMarkers = speechFlow.pauseMarkers || [];
  const pronunciationNotes = pronunciationErrors.filter((error) =>
    isNonEmptyString(error.explanation),
  );
  const fluencyNotes = fluencyErrors.filter((error) =>
    isNonEmptyString(error.explanation),
  );

  const overallFeedback =
    response.aiFeedback ||
    feedback.summary ||
    feedback.content ||
    feedback.oralFluency ||
    'No summary available for this response.';

  const suggestions = Array.from(
    new Set(
      [
        ...(Array.isArray((response as any).suggestions)
          ? (response as any).suggestions
          : []),
        feedback.content,
        feedback.pronunciation,
        feedback.oralFluency,
        ...(pronunciationErrors || []).map((error) => error.explanation),
        ...(fluencyErrors || []).map((error) => error.explanation),
        ...(errorAnalysis.contentErrors || []).map(
          (error: AnalysisErrorItem) => error.explanation,
        ),
      ].filter(isNonEmptyString),
    ),
  );

  const detailedFeedbackEntries = Object.entries(feedback).filter(([, value]) =>
    isNonEmptyString(value),
  );

  const renderScoreBreakdown = () => {
    const donutData =
      totalMax > 0
        ? [
            { name: 'Scored', value: Math.min(totalScore, totalMax) },
            { name: 'Remaining', value: Math.max(totalMax - totalScore, 0) },
          ]
        : [];

    if (!scoreEntries.length) {
      return (
        <div className='rounded-3xl border border-slate-200 bg-white p-5 dark:border-slate-700/60 dark:bg-slate-950/50'>
          <div className='rounded-2xl border border-dashed border-slate-300 p-6 text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400'>
            Score details are not available for this attempt.
          </div>
        </div>
      );
    }

    return (
      <div className='rounded-3xl border border-cyan-200 bg-gradient-to-br from-cyan-50 to-blue-50 p-5 dark:border-cyan-800 dark:from-cyan-900/20 dark:to-blue-900/20'>
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
                    formatter={(value: number) => `${value}/${totalMax}`}
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
              const palette = [
                '#38bdf8',
                '#a78bfa',
                '#f472b6',
                '#f59e0b',
                '#34d399',
                '#fb7185',
              ];

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
                          backgroundColor: palette[index % palette.length],
                        }}
                      />
                      <span className='text-sm font-medium text-slate-700 dark:text-slate-200'>
                        {item.label}
                      </span>
                    </div>
                    <span className='text-sm font-semibold text-slate-900 dark:text-slate-50'>
                      {item.score}/{item.max}
                    </span>
                  </div>
                  <div className='h-2 w-full rounded-full bg-slate-200 dark:bg-slate-800'>
                    <div
                      className='h-2 rounded-full'
                      style={{
                        width: `${Math.min(100, Math.max(0, itemPercentage))}%`,
                        backgroundColor: palette[index % palette.length],
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
    <div className='fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm'>
      <div className='flex max-h-[calc(100vh-2rem)] w-full max-w-7xl flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-950'>
        <div className='border-b border-slate-200 bg-gradient-to-r from-sky-50 via-white to-indigo-50 px-6 py-6 text-slate-900 dark:border-white/10 dark:from-slate-900 dark:via-slate-900 dark:to-indigo-950 dark:text-white'>
          <div className='flex items-start justify-between gap-6'>
            <div className='min-w-0'>
              <span className='inline-flex rounded-full border border-cyan-500/20 bg-cyan-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-cyan-700 dark:text-cyan-300'>
                Speaking Practice
              </span>
              <h2 className='mt-3 text-3xl font-semibold tracking-tight text-slate-900 dark:text-slate-50'>
                Respond To A Situation Response Analysis
              </h2>
              <p className='mt-2 max-w-2xl text-sm text-slate-600 dark:text-slate-400'>
                Review the spoken response, inline fluency markers, and score
                breakdown in one place.
              </p>
              {(() => {
                const qCode =
                  response.questionCode ||
                  (response as any)?.question?.questionCode;
                const qText =
                  response.questionText ||
                  (response as any)?.question?.questionText;
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
              <div className='mt-4 flex flex-wrap gap-3 text-xs'>
                <span className='rounded-full border border-slate-200 bg-white px-3 py-1.5 text-slate-600 dark:border-white/10 dark:bg-slate-900/80 dark:text-slate-300'>
                  {questionType.replace(/_/g, ' ').toLowerCase()}
                </span>
                {questionNumber ? (
                  <span className='rounded-full border border-cyan-500/20 bg-cyan-500/10 px-3 py-1.5 font-medium text-cyan-700 dark:text-cyan-300'>
                    Question {questionNumber}
                  </span>
                ) : null}
                <span className='rounded-full border border-slate-200 bg-white px-3 py-1.5 text-slate-600 dark:border-white/10 dark:bg-slate-900/80 dark:text-slate-300'>
                  {formatDate((response as any).createdAt)}
                </span>
              </div>
            </div>
            <div className='rounded-3xl self-start border border-slate-200 bg-white px-5 py-4 shadow-[0_18px_60px_rgba(15,23,42,0.08)] dark:border-slate-700/70 dark:bg-slate-900/80 dark:shadow-[0_18px_60px_rgba(15,23,42,0.24)]'>
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
            <button
              onClick={onClose}
              className='flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 dark:border-white/10 dark:bg-white/5 dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-white'
            >
              <X className='h-5 w-5' />
            </button>
          </div>
        </div>

        <div className='flex-1 overflow-y-auto bg-slate-100/70 p-4 sm:p-6 dark:bg-slate-900/70 custom-scrollbar'>
          <div className='grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(360px,0.92fr)]'>
            <section className='min-w-0 space-y-6'>
              <div className='rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700/60 dark:bg-slate-950/50'>
                <div className='flex items-start justify-between gap-4'>
                  <div>
                    <h3 className='text-lg font-semibold text-slate-900 dark:text-slate-50'>
                      Spoken Response
                    </h3>
                    <p className='mt-1 text-sm text-slate-500 dark:text-slate-400'>
                      Pronunciation highlights are orange. Fluency markers and
                      pauses are yellow.
                    </p>
                  </div>
                  <div className='flex flex-wrap items-center gap-2 text-xs font-medium'>
                    <span className='rounded-full border border-orange-500/30 bg-orange-500/10 px-3 py-1.5 text-orange-700 dark:text-orange-300'>
                      Pronunciation
                    </span>
                    <span className='rounded-full border border-yellow-500/30 bg-yellow-500/10 px-3 py-1.5 text-yellow-700 dark:text-yellow-300'>
                      Fluency
                    </span>
                    <span className='rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-amber-700 dark:text-amber-300'>
                      Pause / hesitation
                    </span>
                  </div>
                </div>

                <div className='mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-5 text-base leading-8 text-slate-800 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200'>
                  {renderSpeechTranscriptWithPauses({
                    spokenText: analysis.userText || '',
                    pronunciationErrors:
                      errorAnalysis.pronunciationErrors || [],
                    fluencyErrors: errorAnalysis.fluencyErrors || [],
                    pauseMarkers: speechFlow.pauseMarkers || [],
                    options: {
                      pauseSeconds: 1,
                    },
                  })}
                </div>

                {!speechFlow?.pauseMarkers?.length ? (
                  <p className='mt-3 text-xs text-slate-500 dark:text-slate-400'>
                    No pause gaps were detected for this attempt.
                  </p>
                ) : null}
                {/* 
                {(pronunciationNotes.length > 0 || fluencyNotes.length > 0) && (
                  <div className='mt-4 space-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300'>
                    {pronunciationNotes.length > 0 && (
                      <div>
                        <p className='mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-orange-600 dark:text-orange-300'>
                          Pronunciation Notes
                        </p>
                        <div className='flex flex-wrap gap-2'>
                          {pronunciationNotes.slice(0, 4).map((error, index) => (
                            <span
                              key={`${error.text || 'pron'}-${index}`}
                              className='rounded-full border border-orange-500/30 bg-orange-500/10 px-3 py-1 text-xs font-medium text-orange-700 dark:text-orange-300'
                              title={error.explanation}
                            >
                              {error.text || 'Pronunciation issue'}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {fluencyNotes.length > 0 && (
                      <div>
                        <p className='mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-yellow-600 dark:text-yellow-300'>
                          Fluency Notes
                        </p>
                        <div className='flex flex-wrap gap-2'>
                          {fluencyNotes.slice(0, 4).map((error, index) => (
                            <span
                              key={`${error.text || 'fluency'}-${index}`}
                              className='rounded-full border border-yellow-500/30 bg-yellow-500/10 px-3 py-1 text-xs font-medium text-yellow-700 dark:text-yellow-300'
                              title={error.explanation}
                            >
                              {error.text || 'Fluency issue'}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )} */}
              </div>
            </section>

            <aside className='min-w-0 space-y-6'>
              {renderScoreBreakdown()}

              {response.audioResponseUrl ? (
                <div className='rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700/60 dark:bg-slate-950/50'>
                  <div className='mb-4 flex items-center gap-3'>
                    <div className='flex h-10 w-10 items-center justify-center rounded-2xl border border-cyan-500/20 bg-cyan-500/10 text-cyan-600 dark:text-cyan-300'>
                      <Volume2 className='h-5 w-5' />
                    </div>
                    <div>
                      <h3 className='text-base font-semibold text-slate-900 dark:text-slate-50'>
                        Audio Response
                      </h3>
                      <p className='text-sm text-slate-500 dark:text-slate-400'>
                        Listen back to the submitted response.
                      </p>
                    </div>
                  </div>

                  <audio
                    controls
                    src={response.audioResponseUrl}
                    className='w-full'
                    preload='metadata'
                  />
                </div>
              ) : null}
            </aside>
          </div>

          <div className='mt-6 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700/60 dark:bg-slate-950/50'>
            <div className='flex items-start justify-between gap-4'>
              <div>
                <h3 className='text-base font-semibold text-slate-900 dark:text-slate-50'>
                  Overall Feedback
                </h3>
                <p className='mt-1 text-sm text-slate-500 dark:text-slate-400'>
                  A concise summary of the response quality.
                </p>
              </div>
              <div
                className={`rounded-full px-3 py-1 text-xs font-medium ${
                  response.isCorrect
                    ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
                    : 'bg-rose-500/10 text-rose-700 dark:text-rose-300'
                }`}
              >
                {response.isCorrect
                  ? 'Needs little refinement'
                  : 'Needs review'}
              </div>
            </div>

            <p className='mt-3 text-sm leading-relaxed text-slate-700 dark:text-slate-300'>
              {overallFeedback}
            </p>

            {detailedFeedbackEntries.length > 0 ? (
              <div className='mt-5 grid grid-cols-1 gap-4 md:grid-cols-2'>
                {detailedFeedbackEntries.map(([key, value]) => (
                  <div
                    key={key}
                    className='rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-900'
                  >
                    <p className='text-sm font-semibold text-slate-800 dark:text-slate-100'>
                      {formatScoringText(key)}
                    </p>
                    <p className='mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300'>
                      {value as string}
                    </p>
                  </div>
                ))}
              </div>
            ) : null}

            {/* {suggestions.length > 0 ? (
              <div className='mt-5 flex flex-wrap gap-2'>
                {suggestions.slice(0, 6).map((suggestion) => (
                  <span
                    key={suggestion}
                    className='rounded-full border border-cyan-500/20 bg-cyan-500/10 px-3 py-1.5 text-xs font-medium text-cyan-700 dark:text-cyan-300'
                  >
                    {suggestion}
                  </span>
                ))}
              </div>
            ) : null} */}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResponseDetailModal;
