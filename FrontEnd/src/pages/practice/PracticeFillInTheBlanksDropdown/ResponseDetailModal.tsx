import {
  AlertCircle,
  CheckCircle,
  Clock3,
  FileText,
  HelpCircle,
  TrendingUp,
  X,
} from "lucide-react";
import React, { useEffect } from "react";
import {
  Cell,
  Legend,
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

interface BlankResult {
  userAnswer?: string;
  correctAnswer?: string;
  isCorrect?: boolean;
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

  if (percentage >= 80) return "text-emerald-600 dark:text-emerald-400";
  if (percentage >= 60) return "text-amber-600 dark:text-amber-400";
  return "text-rose-600 dark:text-rose-400";
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

  const itemResults = Object.entries(
    (analysis.itemResults || {}) as Record<string, BlankResult>,
  ).map(([key, value], index) => ({
    key,
    label: `Blank ${index + 1}`,
    userAnswer: value?.userAnswer || "No answer",
    correctAnswer: value?.correctAnswer || "Not available",
    isCorrect: Boolean(value?.isCorrect),
  }));

  const explanationParagraphs =
    typeof analysis.explanation === "string"
      ? analysis.explanation
          .split(/\n\s*\n/)
          .map((paragraph: string) => paragraph.trim())
          .filter(Boolean)
      : [];

  const renderScoringChart = () => {
    const colors = ["#3b82f6", "#8b5cf6", "#ec4899", "#f59e0b"];
    const data = scoreEntries.map((item) => ({
      name: item.label,
      value: item.score,
      max: item.max,
    }));

    if (!data.length) {
      return (
        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-800">
          <div className="rounded-xl border border-dashed border-gray-300 p-6 text-sm text-gray-500 dark:border-gray-700 dark:text-gray-400">
            Score details are not available for this attempt.
          </div>
        </div>
      );
    }

    return (
      <div className="rounded-2xl border border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50 p-5 dark:border-blue-800 dark:from-blue-900/20 dark:to-indigo-900/20">
        <div className="mb-6 flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          <h3 className="text-base font-semibold text-gray-900 dark:text-white">
            Score Breakdown
          </h3>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="space-y-3">
            {scoreEntries.map((item, index) => {
              const itemPercentage = Math.round((item.score / item.max) * 100);

              return (
                <div
                  key={item.key}
                  className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800/80"
                >
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <div
                        className="h-3 w-3 rounded-full"
                        style={{
                          backgroundColor: colors[index % colors.length],
                        }}
                      />
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
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

                  <div className="h-2 rounded-full bg-gray-200 dark:bg-gray-700">
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
          className="fixed inset-0 bg-gray-500/75 dark:bg-gray-900/75"
          onClick={onClose}
        />

        <div className="relative z-[201] inline-block w-full max-w-5xl overflow-hidden rounded-lg border border-gray-200 bg-white text-left align-middle shadow-2xl transition-all dark:border-gray-700 dark:bg-gray-800">
          <div className="flex items-start justify-between gap-4 border-b border-gray-200 px-6 py-4 dark:border-gray-700">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Fill In The Blanks Dropdown Response Analysis
              </h3>
              <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
                {typeof questionNumber === "number" && (
                  <span className="rounded-full bg-blue-100 px-2.5 py-1 text-xs font-semibold text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                    Question {questionNumber}
                  </span>
                )}
                <span>{formatDate(response.createdAt)}</span>
              </div>
            </div>

            <button
              onClick={onClose}
              className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-200 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-200"
              aria-label="Close response details"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="p-6">
            <div className="max-h-[70vh] space-y-6 overflow-y-auto overscroll-contain pr-1">
              {renderScoringChart()}

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-800">
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Your Score:{" "}
                    <span className={getScoreColor(totalScore, totalMax || 1)}>
                      {totalScore}
                    </span>
                    {totalMax > 0 && (
                      <span className="ml-2 text-gray-500 dark:text-gray-400">
                        / {totalMax} points
                      </span>
                    )}
                  </h4>
                </div>

                <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-800">
                  <div className="flex items-center gap-2">
                    <Clock3 className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                    <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                      Time Taken
                    </h4>
                  </div>
                  <p className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">
                    {response.timeTakenSeconds ?? analysis.timeTaken ?? 0}s
                  </p>
                </div>
              </div>

              <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-800">
                <div className="mb-4 flex items-center gap-2">
                  <FileText className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                  <h4 className="text-base font-semibold text-gray-900 dark:text-white">
                    Blank-by-Blank Result
                  </h4>
                </div>

                {itemResults.length > 0 ? (
                  <div className="space-y-4">
                    {itemResults.map((item) => (
                      <div
                        key={item.key}
                        className={`rounded-xl border p-4 ${
                          item.isCorrect
                            ? "border-emerald-200 bg-emerald-50/70 dark:border-emerald-500/20 dark:bg-emerald-500/5"
                            : "border-rose-200 bg-rose-50/70 dark:border-rose-500/20 dark:bg-rose-500/5"
                        }`}
                      >
                        <div className="mb-3 flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2">
                            {item.isCorrect ? (
                              <CheckCircle className="h-5 w-5 text-emerald-500" />
                            ) : (
                              <AlertCircle className="h-5 w-5 text-rose-500" />
                            )}
                            <span className="font-semibold text-gray-900 dark:text-white">
                              {item.label}
                            </span>
                          </div>
                          <span
                            className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                              item.isCorrect
                                ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300"
                                : "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300"
                            }`}
                          >
                            {item.isCorrect ? "Correct" : "Incorrect"}
                          </span>
                        </div>

                        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                          <div className="rounded-lg border border-gray-200 bg-white p-3 dark:border-gray-700 dark:bg-gray-900/40">
                            <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                              Your Answer
                            </p>
                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                              {item.userAnswer}
                            </p>
                          </div>

                          <div className="rounded-lg border border-gray-200 bg-white p-3 dark:border-gray-700 dark:bg-gray-900/40">
                            <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                              Correct Answer
                            </p>
                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                              {item.correctAnswer}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-xl border border-dashed border-gray-300 p-6 text-sm text-gray-500 dark:border-gray-700 dark:text-gray-400">
                    Blank-level analysis is not available for this attempt.
                  </div>
                )}
              </div>

              {explanationParagraphs.length > 0 && (
                <div className="rounded-2xl border border-amber-200 bg-amber-50/80 p-5 dark:border-amber-500/20 dark:bg-amber-500/5">
                  <div className="mb-4 flex items-center gap-2">
                    <HelpCircle className="h-5 w-5 text-amber-500" />
                    <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                      Explanation
                    </h4>
                  </div>

                  <div className="space-y-3">
                    {explanationParagraphs.map(
                      (paragraph: string, index: number) => (
                        <div
                          key={`${paragraph.slice(0, 24)}-${index}`}
                          className="rounded-xl border border-amber-100 bg-white/70 p-4 text-sm leading-relaxed text-gray-700 dark:border-amber-500/10 dark:bg-gray-900/40 dark:text-gray-300"
                        >
                          {paragraph}
                        </div>
                      ),
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-end border-t border-gray-200 pt-4 dark:border-gray-700">
              <button
                onClick={onClose}
                className="rounded-lg bg-gray-600 px-6 py-2 font-medium text-white transition-colors hover:bg-gray-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResponseDetailModal;
