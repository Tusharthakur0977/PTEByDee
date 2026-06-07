import {
  AlertCircle,
  CheckCircle,
  FileText,
  Mic,
  TrendingUp,
  Volume2,
  X,
} from "lucide-react";
import React, { useEffect } from "react";
import {
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { PreviousResponse } from "../../../services/questionResponse";
import { formatScoringText } from "../../../utils/Helpers";
import {
  renderSpeechTranscriptWithPauses,
  SpeechPauseMarker,
} from "../../../utils/speakingTranscriptRenderer";

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

interface SpeechFlow {
  pauseMarkers?: SpeechPauseMarker[];
}

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === "string" && value.trim().length > 0;

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

  if (percentage >= 80) return "text-emerald-600 dark:text-emerald-400";
  if (percentage >= 60) return "text-amber-600 dark:text-amber-400";
  return "text-rose-600 dark:text-rose-400";
};

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
    typeof response.questionScore === "number"
      ? response.questionScore
      : scoreEntries.reduce((sum, item) => sum + item.score, 0);
  const totalMax = scoreEntries.reduce((sum, item) => sum + item.max, 0);

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
      "#3b82f6",
      "#8b5cf6",
      "#ec4899",
      "#f59e0b",
      "#10b981",
      "#ef4444",
    ];

    const donutData =
      totalMax > 0
        ? [
            {
              name: "Scored",
              value: Math.min(totalScore, totalMax),
            },
            {
              name: "Remaining",
              value: Math.max(totalMax - totalScore, 0),
            },
          ]
        : [];

    if (!scoreEntries.length) {
      return (
        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-800">
          <div className="rounded-xl border border-dashed border-gray-300 p-6 text-sm text-gray-500 dark:border-gray-700 dark:text-gray-400">
            Score details are not available for this attempt.
          </div>
        </div>
      );
    }

    return (
      <div className="rounded-3xl border border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50 p-5 dark:border-blue-800 dark:from-blue-900/20 dark:to-indigo-900/20">
        <div className="mb-5 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-cyan-500/20 bg-cyan-500/10 text-cyan-600 dark:text-cyan-300">
            <TrendingUp className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-slate-900 dark:text-slate-50">
              Score Breakdown
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              A quick view of how this response was scored.
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
                  <Tooltip
                    formatter={(value: number) => `${value}/${totalMax}`}
                  />
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

                  <div className="h-2 rounded-full bg-slate-200 dark:bg-slate-700">
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

        <div className="relative z-[201] flex w-full max-w-7xl max-h-[calc(100vh-2rem)] flex-col overflow-hidden rounded-3xl border border-slate-200 bg-slate-50 text-left align-middle shadow-[0_30px_120px_rgba(15,23,42,0.22)] transition-all dark:border-slate-700/70 dark:bg-slate-950 dark:shadow-[0_30px_120px_rgba(15,23,42,0.55)]">
          <div className="border-b border-slate-200 bg-gradient-to-r from-sky-50 via-white to-indigo-50 px-6 py-5 sm:px-8 dark:border-white/10 dark:from-slate-900 dark:via-slate-900 dark:to-indigo-950">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="space-y-3 flex-1">
                <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/20 bg-cyan-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-cyan-700 dark:text-cyan-300">
                  Speaking Practice
                </div>
                <div className="flex flex-1 flex-row justify-between gap-4">
                  <div className="space-y-3">
                    <div>
                      <h3 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-50">
                        Re-Tell Lecture Response Analysis
                      </h3>
                      <p className="mt-1 max-w-2xl text-sm text-slate-600 dark:text-slate-400">
                        Review score breakdown, spoken response highlights, and fluency details in one place.
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
                      {typeof questionNumber === "number" && (
                        <span className="rounded-full border border-sky-500/20 bg-sky-500/10 px-3 py-1 text-xs font-semibold text-sky-700 dark:text-sky-300">
                          Question {questionNumber}
                        </span>
                      )}
                      <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs text-slate-600 dark:border-slate-700 dark:bg-slate-900/80 dark:text-slate-300">
                        {formatDate(response.createdAt)}
                      </span>
                    </div>
                  </div>
                  <div className="rounded-3xl self-start border border-slate-200 bg-white px-5 py-4 shadow-[0_18px_60px_rgba(15,23,42,0.08)] dark:border-slate-700/70 dark:bg-slate-900/80 dark:shadow-[0_18px_60px_rgba(15,23,42,0.24)]">
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

          <div className="custom-scrollbar flex-1 min-h-0 overflow-y-auto p-4 sm:p-6">
            <div className="grid gap-5 xl:grid-cols-2">
              <div className="min-w-0 flex flex-col gap-5">
                <div className="rounded-3xl border border-slate-200 bg-white shadow-[0_18px_60px_rgba(15,23,42,0.08)] dark:border-slate-700/70 dark:bg-slate-900/80 dark:shadow-[0_18px_60px_rgba(15,23,42,0.24)]">
                  <div className="border-b border-slate-200 px-5 py-4 dark:border-white/10">
                    <div className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-200">
                      <Mic className="h-4 w-4 text-slate-500 dark:text-slate-400" />
                      Spoken Response
                    </div>
                  </div>
                  <div className="p-5">
                    <div className="flex flex-wrap items-center gap-3 text-[11px]">
                      <span className="inline-flex items-center gap-2 rounded-full border border-orange-200 bg-orange-50 px-3 py-1 text-orange-700 dark:border-orange-500/20 dark:bg-orange-500/10 dark:text-orange-200">
                        <span className="h-2 w-2 rounded-full bg-orange-500 dark:bg-orange-400" />
                        Pronunciation
                      </span>
                      <span className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-amber-700 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-200">
                        <span className="h-2 w-2 rounded-full bg-amber-500 dark:bg-amber-400" />
                        Pause / hesitation
                      </span>
                    </div>

                    <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-base leading-8 text-slate-900 dark:border-slate-700/70 dark:bg-slate-950 dark:text-slate-100">
                      {isNonEmptyString(analysis.userText) ? (
                        <p className="leading-8 break-words whitespace-normal">
                          {renderSpeechTranscriptWithPauses({
                            spokenText: analysis.userText,
                            pronunciationErrors:
                              errorAnalysis.pronunciationErrors || [],
                            fluencyErrors: errorAnalysis.fluencyErrors || [],
                            pauseMarkers: speechFlow.pauseMarkers || [],
                          })}
                        </p>
                      ) : (
                        <p className="whitespace-pre-wrap text-sm leading-6 text-slate-700 dark:text-slate-200">
                          {response.textResponse || "No answer captured."}
                        </p>
                      )}
                    </div>

                    <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
                      Orange highlights indicate pronunciation issues. Yellow highlights and gaps indicate fluency notes.
                    </p>
                  </div>
                </div>
              </div>

              <div className="min-w-0 flex flex-col gap-5">
                {renderScoringChart()}

                <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_18px_60px_rgba(15,23,42,0.08)] dark:border-slate-700/70 dark:bg-slate-900/80 dark:shadow-[0_18px_60px_rgba(15,23,42,0.24)]">
                  <div className="mb-3 flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-200">
                    <Volume2 className="h-4 w-4 text-slate-500 dark:text-slate-400" />
                    Audio Response
                  </div>
                  {response.audioResponseUrl ? (
                    <audio
                      controls
                      src={response.audioResponseUrl}
                      className="w-full"
                      preload="metadata"
                    >
                      Your browser does not support the audio element.
                    </audio>
                  ) : (
                    <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-950/40 dark:text-slate-400">
                      Audio response not available.
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div
              className={`mt-5 rounded-3xl border p-5 shadow-[0_18px_60px_rgba(15,23,42,0.24)] ${
                response.isCorrect
                  ? "border-emerald-200 bg-emerald-50 dark:border-emerald-500/20 dark:bg-emerald-500/10"
                  : "border-rose-200 bg-rose-50 dark:border-rose-500/20 dark:bg-rose-500/10"
              }`}
            >
              <div className="flex items-start gap-4">
                <div className="mt-1">
                  {response.isCorrect ? (
                    <CheckCircle className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                  ) : (
                    <AlertCircle className="h-6 w-6 text-rose-600 dark:text-rose-400" />
                  )}
                </div>

                <div className="min-w-0">
                  <h4 className="text-lg font-semibold text-slate-900 dark:text-slate-50">
                    Overall Feedback
                  </h4>
                  <p className="mt-1 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
                    {response.aiFeedback ||
                      feedback.summary ||
                      "No summary available."}
                  </p>

                  <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
                    {detailedFeedbackEntries.map(([key, value]) => (
                      <div
                        key={key}
                        className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-900/50"
                      >
                        <p className="mb-1 text-sm font-bold text-slate-700 dark:text-slate-300">
                          {formatScoringText(key)}
                        </p>
                        <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                          {value as string}
                        </p>
                      </div>
                    ))}
                  </div>

                  {/* {suggestions.length > 0 && (
                    <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-950/40">
                      <p className="mb-2 text-sm font-semibold text-slate-800 dark:text-slate-200">
                        Suggestions
                      </p>
                      <ul className="list-disc space-y-1 pl-5 text-sm text-slate-600 dark:text-slate-400">
                        {suggestions.slice(0, 4).map((suggestion, index) => (
                          <li key={`${suggestion}-${index}`}>{suggestion}</li>
                        ))}
                      </ul>
                    </div>
                  )} */}
                </div>
              </div>
            </div>
          </div>

          {/* <div className="border-t border-white/10 bg-slate-50 px-6 py-4 sm:px-8 dark:bg-slate-950">
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
