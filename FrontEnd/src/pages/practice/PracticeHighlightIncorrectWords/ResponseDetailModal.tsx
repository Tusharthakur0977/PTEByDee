import {
  AlertTriangle,
  CheckCircle,
  Clock3,
  HelpCircle,
  ListChecks,
  Target,
  TrendingUp,
  X,
  XCircle,
  Info,
  ChevronRight,
} from "lucide-react";
import React, { useEffect, useState } from "react";
import {
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { PreviousResponse } from "../../../services/questionResponse";
import { formatScoringText } from "../../../utils/Helpers";

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

interface WordMapping {
  correct?: string;
  incorrect?: string;
  wasHighlighted?: boolean;
}

interface HighlightResult {
  highlightedWords?: string[];
  incorrectWords?: string[];
  cleanedHighlighted?: string[];
  cleanedIncorrect?: string[];
  correctHighlights?: number;
  incorrectHighlights?: number;
  wordMapping?: WordMapping[];
}

const formatDate = (dateString?: string) => {
  if (!dateString) return "Unknown date";

  return new Date(dateString).toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const getScoreColor = (score: number, maxScore: number) => {
  const percentage = maxScore > 0 ? (score / maxScore) * 100 : 0;

  if (percentage >= 80) return "text-emerald-400";
  if (percentage >= 60) return "text-amber-400";
  return "text-rose-400";
};

const parseDetailedAnalysis = (
  analysis: PreviousResponse["detailedAnalysis"],
) => {
  if (!analysis) return {};

  if (typeof analysis === "string") {
    try {
      return JSON.parse(analysis);
    } catch {
      return {};
    }
  }

  return analysis;
};

const normalizeStringArray = (value: unknown): string[] => {
  if (!Array.isArray(value)) return [];

  return value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean);
};

const normalizeWordMapping = (value: unknown): WordMapping[] => {
  if (!Array.isArray(value)) return [];

  return value.filter(
    (item): item is WordMapping => typeof item === "object" && item !== null,
  );
};

const cleanWord = (word: string) => word.replace(/[^\w]/g, "").toLowerCase();

const ResponseDetailModal: React.FC<ResponseDetailModalProps> = ({
  response,
  isOpen,
  onClose,
  questionNumber,
}) => {
  useEffect(() => {
    if (!isOpen) return;

    const previousBodyOverflow = document.body.style.overflow;
    const previousBodyTouchAction = document.body.style.touchAction;

    document.body.style.overflow = "hidden";
    document.body.style.touchAction = "none";

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousBodyOverflow;
      document.body.style.touchAction = previousBodyTouchAction;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !response) return null;

  const analysis = parseDetailedAnalysis(response.detailedAnalysis);
  const scores = analysis.scores || {};
  const highlightResult = (analysis.highlightResult || {}) as HighlightResult;

  const scoreEntries = Object.entries(scores)
    .map(([key, value]) => {
      const scoreItem = (value || {}) as ScoreItem;
      return {
        key,
        label: formatScoringText(key) || key,
        score: scoreItem.score || 0,
        max: scoreItem.max || 0,
      };
    })
    .filter((item) => item.max > 0);

  const totalScore =
    typeof response.questionScore === "number"
      ? response.questionScore
      : scoreEntries.reduce((sum, item) => sum + item.score, 0);
  const totalMax = scoreEntries.reduce((sum, item) => sum + item.max, 0);

  const highlightedWords = normalizeStringArray(
    highlightResult.highlightedWords?.length
      ? highlightResult.highlightedWords
      : response.highlightedWords,
  );
  const incorrectWords = normalizeStringArray(highlightResult.incorrectWords);
  const cleanedHighlighted = normalizeStringArray(
    highlightResult.cleanedHighlighted,
  );
  const cleanedIncorrect = normalizeStringArray(
    highlightResult.cleanedIncorrect,
  );
  const wordMapping = normalizeWordMapping(highlightResult.wordMapping);

  const correctHighlights =
    typeof highlightResult.correctHighlights === "number"
      ? highlightResult.correctHighlights
      : cleanedHighlighted.filter((word) => cleanedIncorrect.includes(word))
          .length;
  const incorrectHighlights =
    typeof highlightResult.incorrectHighlights === "number"
      ? highlightResult.incorrectHighlights
      : cleanedHighlighted.filter((word) => !cleanedIncorrect.includes(word))
          .length;
  const missedIncorrectWords = wordMapping
    .filter(
      (item) => !item.wasHighlighted && typeof item.incorrect === "string",
    )
    .map((item) => item.incorrect!.trim())
    .filter(Boolean);
  const incorrectlyHighlightedWords = highlightedWords.filter(
    (word) => !cleanedIncorrect.includes(cleanWord(word)),
  );

  const explanationParagraphs =
    typeof analysis.feedback?.summary === "string" && analysis.feedback.summary
      ? [analysis.feedback.summary]
      : [];

  const renderScoringChart = () => {
    const colors = ["#38bdf8", "#818cf8", "#f472b6", "#f59e0b", "#34d399"];

    const data = scoreEntries.map((item) => ({
      name: item.label,
      value: item.score,
      max: item.max,
    }));

    if (!data.length) {
      return (
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_18px_60px_rgba(15,23,42,0.08)] dark:border-slate-700/70 dark:bg-slate-900/80 dark:shadow-[0_18px_60px_rgba(15,23,42,0.22)]">
          <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-sm text-slate-500 dark:border-slate-600/80 dark:bg-slate-950/40 dark:text-slate-400">
            Score details are not available for this attempt.
          </div>
        </div>
      );
    }

    const donutData =
      totalMax > 0
        ? [
            { name: "Scored", value: Math.min(totalScore, totalMax) },
            { name: "Remaining", value: Math.max(totalMax - totalScore, 0) },
          ]
        : [];

    return (
      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_22px_70px_rgba(15,23,42,0.08)] dark:border-slate-700/70 dark:bg-gradient-to-br dark:from-slate-900 dark:via-slate-900 dark:to-slate-950 dark:shadow-[0_22px_70px_rgba(15,23,42,0.28)]">
        <div className="mb-5 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-cyan-500/20 bg-cyan-500/10 text-cyan-600 dark:text-cyan-300">
            <TrendingUp className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-slate-900 dark:text-slate-50">
              Score Breakdown
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Analysis of your highlighting accuracy.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="flex items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-700/60 dark:bg-slate-950/40">
            <div className="relative flex h-[240px] w-full items-center justify-center">
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie
                    data={donutData}
                    cx="50%"
                    cy="50%"
                    innerRadius={68}
                    outerRadius={94}
                    startAngle={90}
                    endAngle={-270}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    <Cell fill="#22d3ee" />
                    <Cell fill="#e2e8f0" className="dark:fill-slate-800" />
                  </Pie>
                  <Tooltip formatter={(value: number) => `${value}/${totalMax}`} />
                </PieChart>
              </ResponsiveContainer>

              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
                <div className="text-3xl font-semibold tracking-tight text-slate-900 dark:text-slate-50">
                  {totalScore}
                  <span className="ml-1 text-base font-medium text-slate-500 dark:text-slate-400">
                    /{totalMax}
                  </span>
                </div>
                <div className="mt-1 text-xs font-medium uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">
                  Total
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            {scoreEntries.map((item, index) => {
              const itemPercentage = Math.round((item.score / item.max) * 100);

              return (
                <div
                  key={item.key}
                  className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700/60 dark:bg-slate-950/50"
                >
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <div
                        className="h-3 w-3 rounded-full"
                        style={{
                          backgroundColor: colors[index % colors.length],
                        }}
                      />
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
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

                  <div className="h-2 rounded-full bg-slate-200 dark:bg-slate-800">
                    <div
                      className="h-2 rounded-full"
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
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div className="flex min-h-screen items-center justify-center px-4 py-6 text-center sm:p-6">
        <div
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm"
          onClick={onClose}
        />

        <div className="relative z-[201] flex w-full max-w-6xl max-h-[calc(100vh-2rem)] flex-col overflow-hidden rounded-3xl border border-slate-200 bg-slate-50 text-left align-middle shadow-[0_30px_120px_rgba(15,23,42,0.22)] transition-all dark:border-slate-700/70 dark:bg-slate-950 dark:shadow-[0_30px_120px_rgba(15,23,42,0.55)]">
          <div className="border-b border-slate-200 bg-gradient-to-r from-sky-50 via-white to-indigo-50 px-6 py-5 sm:px-8 dark:border-white/10 dark:from-slate-900 dark:via-slate-900 dark:to-indigo-950">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="space-y-3 flex-1">
                <div className="inline-flex items-center gap-2 rounded-full border border-sky-500/20 bg-sky-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-sky-700 dark:text-sky-300">
                  Listening Practice
                </div>
                <div className="flex flex-1 flex-row justify-between gap-6">
                  <div className="space-y-3">
                    <div>
                      <h3 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-50">
                        Highlight Incorrect Words Analysis
                      </h3>
                      <p className="mt-1 max-w-2xl text-sm text-slate-600 dark:text-slate-400">
                        Review which words were different in the audio compared to the transcript.
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
                    <div className="flex flex-wrap items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                      {typeof questionNumber === 'number' && (
                        <span className="rounded-full border border-sky-500/20 bg-sky-500/10 px-3 py-1 text-xs font-semibold text-sky-700 dark:text-sky-300">
                          Question {questionNumber}
                        </span>
                      )}
                      <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs text-slate-600 dark:border-slate-700 dark:bg-slate-900/80 dark:text-slate-300">
                        {formatDate(response.createdAt)}
                      </span>
                    </div>
                  </div>

                  <div className="rounded-3xl border border-slate-200 bg-white px-5 py-4 shadow-[0_18px_60_rgba(15,23,42,0.08)] dark:border-slate-700/70 dark:bg-slate-900/80 dark:shadow-[0_18px_60px_rgba(15,23,42,0.24)]">
                    <p className="text-xs uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">
                      Total Score
                    </p>
                    <div className="mt-2 flex items-end gap-2">
                      <span
                        className={`text-3xl font-semibold ${getScoreColor(
                          totalScore,
                          totalMax || 1,
                        )}`}
                      >
                        {totalScore}
                      </span>
                      {totalMax > 0 && (
                        <span className="pb-1 text-sm text-slate-500 dark:text-slate-400">
                          / {totalMax}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 self-start lg:self-auto">
                <button
                  onClick={onClose}
                  className="rounded-full border border-slate-200 bg-white p-2.5 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:border-white/10 dark:bg-white/5 dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-white"
                  aria-label="Close response details"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>

          <div className="custom-scrollbar flex-1 overflow-y-auto p-4 sm:p-6">
            <div className="grid gap-5 xl:grid-cols-2">
              <div className="min-w-0 flex flex-col gap-5">
                {renderScoringChart()}

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_18px_60_rgba(15,23,42,0.08)] dark:border-slate-700/70 dark:bg-slate-900/80 dark:shadow-[0_18px_60_rgba(15,23,42,0.24)]">
                    <div className="mb-4 flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-indigo-500/20 bg-indigo-500/10 text-indigo-600 dark:text-indigo-300">
                        <Clock3 className="h-5 w-5" />
                      </div>
                      <div>
                        <h4 className="text-base font-semibold text-slate-900 dark:text-slate-50">
                          Time Taken
                        </h4>
                      </div>
                    </div>
                    <p className="text-3xl font-bold text-slate-900 dark:text-slate-100">
                      {response.timeTakenSeconds ?? analysis.timeTaken ?? 0}
                      <span className="ml-1 text-base font-medium text-slate-500 dark:text-slate-400">s</span>
                    </p>
                  </div>

                  <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_18px_60_rgba(15,23,42,0.08)] dark:border-slate-700/70 dark:bg-slate-900/80 dark:shadow-[0_18px_60_rgba(15,23,42,0.24)]">
                    <div className="mb-4 flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-300">
                        <CheckCircle className="h-5 w-5" />
                      </div>
                      <div>
                        <h4 className="text-base font-semibold text-slate-900 dark:text-slate-50">
                          Correct Hits
                        </h4>
                      </div>
                    </div>
                    <p className="text-3xl font-bold text-slate-900 dark:text-slate-100">
                      {correctHighlights}
                      <span className="ml-1 text-base font-medium text-slate-500 dark:text-slate-400">words</span>
                    </p>
                  </div>
                </div>
              </div>

              <div className="min-w-0 flex flex-col gap-5">
                <div className="rounded-3xl border border-slate-200 bg-white shadow-[0_18px_60_rgba(15,23,42,0.08)] dark:border-slate-700/70 dark:bg-slate-900/80 dark:shadow-[0_18px_60px_rgba(15,23,42,0.24)]">
                  <div className="border-b border-slate-200 px-5 py-4 dark:border-white/10">
                    <div className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-200">
                      <ListChecks className="h-4 w-4 text-slate-500 dark:text-slate-400" />
                      Highlight Breakdown
                    </div>
                  </div>

                  <div className="px-5 py-5 space-y-5 overflow-y-auto max-h-[500px] custom-scrollbar">
                    {/* Your Highlights */}
                    <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-4 dark:border-slate-800 dark:bg-slate-950/50">
                       <div className="mb-3 flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-sky-500" />
                          <span className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-slate-100">Your Highlights</span>
                       </div>
                       {highlightedWords.length > 0 ? (
                         <div className="flex flex-wrap gap-2">
                           {highlightedWords.map((word, idx) => (
                             <span key={idx} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
                               {word}
                             </span>
                           ))}
                         </div>
                       ) : (
                         <p className="text-xs text-slate-500 dark:text-slate-400">No words highlighted.</p>
                       )}
                    </div>

                    {/* Missed Words */}
                    {missedIncorrectWords.length > 0 && (
                      <div className="rounded-2xl border border-amber-100 bg-amber-50/20 p-4 dark:border-amber-500/10 dark:bg-amber-500/5">
                         <div className="mb-3 flex items-center gap-2 text-amber-600 dark:text-amber-400">
                            <Target className="h-4 w-4" />
                            <span className="text-sm font-bold uppercase tracking-wider">Missed Incorrect Words</span>
                         </div>
                         <div className="flex flex-wrap gap-2">
                           {missedIncorrectWords.map((word, idx) => (
                             <span key={idx} className="rounded-xl border border-amber-200 bg-white px-3 py-2 text-xs font-medium text-amber-700 dark:border-amber-500/20 dark:bg-slate-900 dark:text-amber-300">
                               {word}
                             </span>
                           ))}
                         </div>
                      </div>
                    )}

                    {/* Incorrect Highlights */}
                    {incorrectlyHighlightedWords.length > 0 && (
                      <div className="rounded-2xl border border-rose-100 bg-rose-50/20 p-4 dark:border-rose-500/10 dark:bg-rose-500/5">
                         <div className="mb-3 flex items-center gap-2 text-rose-600 dark:text-rose-400">
                            <XCircle className="h-4 w-4" />
                            <span className="text-sm font-bold uppercase tracking-wider">Incorrectly Highlighted</span>
                         </div>
                         <div className="flex flex-wrap gap-2">
                           {incorrectlyHighlightedWords.map((word, idx) => (
                             <span key={idx} className="rounded-xl border border-rose-200 bg-white px-3 py-2 text-xs font-medium text-rose-700 dark:border-rose-500/20 dark:bg-slate-900 dark:text-rose-300">
                               {word}
                             </span>
                           ))}
                         </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {explanationParagraphs.length > 0 && (
              <div className="mt-5 rounded-3xl border border-amber-200 bg-amber-50/50 p-6 shadow-sm dark:border-amber-500/10 dark:bg-amber-500/5">
                <div className="mb-5 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-amber-500/20 bg-amber-500/10 text-amber-600 dark:text-amber-400">
                    <HelpCircle className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold text-slate-900 dark:text-slate-50">
                      Performance Summary
                    </h4>
                    <p className="text-sm text-amber-700/70 dark:text-amber-400/70">
                      Feedback on your listening and transcription matching skills.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  {explanationParagraphs.map((paragraph: string, index: number) => (
                    <div
                      key={index}
                      className="group relative rounded-2xl border border-white bg-white/60 p-4 shadow-sm transition-all hover:bg-white/80 dark:border-slate-700/30 dark:bg-slate-900/40 dark:hover:bg-slate-900/60"
                    >
                      <div className="flex items-start gap-3">
                        <div className="mt-1 flex-shrink-0">
                          <ChevronRight className="h-4 w-4 text-amber-500/50 group-hover:text-amber-500" />
                        </div>
                        <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300">
                          {paragraph}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResponseDetailModal;
