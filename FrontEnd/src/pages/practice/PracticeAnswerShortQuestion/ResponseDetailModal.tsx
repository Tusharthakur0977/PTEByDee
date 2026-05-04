import { TrendingUp, X } from 'lucide-react';
import React, { useEffect } from 'react';
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { PreviousResponse } from '../../../services/questionResponse';
import { formatScoringText } from '../../../utils/Helpers';

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

const ResponseDetailModal: React.FC<ResponseDetailModalProps> = ({
  response,
  isOpen,
  onClose,
  questionNumber,
  questionType = 'ANSWER_SHORT_QUESTION',
}) => {
  useEffect(() => {
    if (!isOpen) return;

    const previousBodyOverflow = document.body.style.overflow;
    const previousBodyTouchAction = document.body.style.touchAction;

    document.body.style.overflow = 'hidden';
    document.body.style.touchAction = 'none';

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
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
  const scoreEntries = Object.entries(scores)
    .map(([key, value]) => {
      const item = (value || {}) as ScoreItem;
      return {
        key,
        label: formatScoringText(key),
        score: item.score || 0,
        max: item.max || 0,
      };
    })
    .filter((item) => item.max > 0);

  const totalScore =
    typeof response.questionScore === 'number'
      ? response.questionScore
      : scoreEntries.reduce((sum, item) => sum + item.score, 0);
  const totalMax = scoreEntries.reduce((sum, item) => sum + item.max, 0);
  const remainingScore = Math.max(totalMax - totalScore, 0);

  const chartData = totalMax
    ? [
        {
          name: 'Scored',
          value: totalScore,
          fill: response.isCorrect ? '#10b981' : '#f59e0b',
        },
        {
          name: 'Remaining',
          value: remainingScore,
          fill: '#e5e7eb',
        },
      ]
    : [];

  const userAnswer = response.textResponse || analysis.userText || 'No answer captured.';
  const correctAnswer = analysis.correctAnswer || 'No correct answer available.';
  const summary =
    response.aiFeedback ||
    feedback.summary ||
    feedback.content ||
    'No summary available for this response.';

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm'>
      <div className='flex max-h-[calc(100vh-2rem)] w-full max-w-6xl flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-950'>
        <div className='border-b border-slate-200 bg-gradient-to-r from-sky-50 via-white to-indigo-50 px-6 py-6 text-slate-900 dark:border-white/10 dark:from-slate-900 dark:via-slate-900 dark:to-indigo-950 dark:text-white'>
          <div className='flex items-start justify-between gap-6'>
            <div className='min-w-0'>
              <span className='inline-flex rounded-full border border-cyan-500/20 bg-cyan-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-cyan-700 dark:text-cyan-300'>
                Speaking Practice
              </span>
              <h2 className='mt-3 text-3xl font-semibold tracking-tight text-slate-900 dark:text-slate-50'>
                Answer Short Question Response Analysis
              </h2>
              <p className='mt-2 max-w-2xl text-sm text-slate-600 dark:text-slate-400'>
                Review the answer, correct response, and score breakdown in one
                place.
              </p>
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

            <button
              onClick={onClose}
              className='flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 dark:border-white/10 dark:bg-white/5 dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-white'
            >
              <X className='h-5 w-5' />
            </button>
          </div>
        </div>

        <div className='flex-1 overflow-y-auto bg-slate-100/70 p-4 sm:p-6 custom-scrollbar dark:bg-slate-900/70'>
          <div className='grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(360px,0.92fr)]'>
            <section className='min-w-0 space-y-6'>
              <div className='rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700/60 dark:bg-slate-950/50'>
                <div className='flex items-start justify-between gap-4'>
                  <div>
                    <h3 className='text-lg font-semibold text-slate-900 dark:text-slate-50'>
                      Your Answer
                    </h3>
                    <p className='mt-1 text-sm text-slate-500 dark:text-slate-400'>
                      Simple one-word or short-phrase response captured from your
                      recording.
                    </p>
                  </div>
                </div>

                <div className='mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-5 text-base leading-8 text-slate-800 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200'>
                  <p className='whitespace-pre-wrap'>{userAnswer}</p>
                </div>
              </div>

              <div className='rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700/60 dark:bg-slate-950/50'>
                <div className='flex items-start justify-between gap-4'>
                  <div>
                    <h3 className='text-lg font-semibold text-slate-900 dark:text-slate-50'>
                      Correct Answer
                    </h3>
                    <p className='mt-1 text-sm text-slate-500 dark:text-slate-400'>
                      Expected answer for this question.
                    </p>
                  </div>
                </div>

                <div className='mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-base leading-8 text-emerald-900 dark:border-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-200'>
                  <p className='whitespace-pre-wrap'>{correctAnswer}</p>
                </div>
              </div>
            </section>

            <aside className='min-w-0 space-y-6'>
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

                <div className='grid grid-cols-1 gap-6'>
                  <div className='flex items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-700/60 dark:bg-slate-950/40'>
                    <div className='relative flex h-[240px] w-full items-center justify-center'>
                      <ResponsiveContainer width='100%' height={240}>
                        <PieChart>
                          <Pie
                            data={chartData}
                            cx='50%'
                            cy='50%'
                            innerRadius={68}
                            outerRadius={94}
                            startAngle={90}
                            endAngle={-270}
                            paddingAngle={2}
                            dataKey='value'
                          >
                            {chartData.map((entry) => (
                              <Cell key={entry.name} fill={entry.fill} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(value: number) => `${value}/${totalMax}`} />
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
                      const palette = ['#38bdf8', '#a78bfa', '#f472b6', '#f59e0b'];
                      const percentage = Math.round((item.score / item.max) * 100);

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
                                width: `${Math.min(100, Math.max(0, percentage))}%`,
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
            </aside>
          </div>

          <div className='mt-6 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700/60 dark:bg-slate-950/50'>
            <div className='flex items-start justify-between gap-4'>
              <div>
                <h3 className='text-base font-semibold text-slate-900 dark:text-slate-50'>
                  Overall Feedback
                </h3>
                <p className='mt-1 text-sm text-slate-500 dark:text-slate-400'>
                  Short summary of the response quality.
                </p>
              </div>
              <div
                className={`rounded-full px-3 py-1 text-xs font-medium ${
                  response.isCorrect
                    ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
                    : 'bg-rose-500/10 text-rose-700 dark:text-rose-300'
                }`}
              >
                {response.isCorrect ? 'Correct' : 'Needs review'}
              </div>
            </div>

            <p className='mt-3 text-sm leading-relaxed text-slate-700 dark:text-slate-300'>
              {summary}
            </p>

            {feedback.content || feedback.vocabulary ? (
              <div className='mt-5 grid grid-cols-1 gap-4 md:grid-cols-2'>
                {feedback.content ? (
                  <div className='rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-900'>
                    <p className='text-sm font-semibold text-slate-800 dark:text-slate-100'>
                      Content
                    </p>
                    <p className='mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300'>
                      {feedback.content}
                    </p>
                  </div>
                ) : null}
                {feedback.vocabulary ? (
                  <div className='rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-900'>
                    <p className='text-sm font-semibold text-slate-800 dark:text-slate-100'>
                      Vocabulary
                    </p>
                    <p className='mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300'>
                      {feedback.vocabulary}
                    </p>
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>
        </div>

        {/* <div className='border-t border-slate-200 bg-slate-50 px-6 py-4 dark:border-slate-700 dark:bg-slate-950'>
          <div className='flex items-center justify-end gap-4'>
            <button
              onClick={onClose}
              className='rounded-full bg-slate-900 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-slate-800 dark:bg-white/10 dark:text-slate-100 dark:hover:bg-white/15'
            >
              Close
            </button>
          </div>
        </div> */}
      </div>
    </div>
  );
};

export default ResponseDetailModal;
