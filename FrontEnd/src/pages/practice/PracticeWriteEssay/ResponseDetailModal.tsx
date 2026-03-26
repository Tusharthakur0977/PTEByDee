import {
  AlertCircle,
  CheckCircle,
  FileText,
  TrendingUp,
  Volume2,
  X,
  XCircle,
} from "lucide-react";
import React, { useEffect, useState } from "react";
import {
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { PreviousResponse } from "../../../services/questionResponse";
import {
  formatScoringText,
  renderHighlightedText,
} from "../../../utils/Helpers";

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
  suggestion?: string;
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

const getErrorColor = (type?: string) => {
  if (type === "grammar" || type === "unnecessary_word") {
    return "bg-red-500";
  }
  if (type === "spelling" || type === "spelling_error") {
    return "bg-blue-500";
  }
  if (type === "vocabulary" || type === "missing_word") {
    return "bg-purple-500";
  }
  return "bg-gray-500";
};

const ResponseDetailModal: React.FC<ResponseDetailModalProps> = ({
  response,
  isOpen,
  onClose,
  questionNumber,
}) => {
  const [selectedError, setSelectedError] = useState<AnalysisErrorItem | null>(
    null,
  );

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

  const userAnswer =
    response.textResponse || analysis.userText || "No response captured.";
  const essayWordCount =
    typeof analysis.wordCount === "number"
      ? analysis.wordCount
      : typeof analysis.actualWordCount === "number"
        ? analysis.actualWordCount
        : userAnswer.split(/\s+/).filter(Boolean).length;

  const writingErrors = [
    ...(errorAnalysis.grammarErrors || []),
    ...(errorAnalysis.spellingErrors || []),
    ...(errorAnalysis.vocabularyIssues || []),
  ] as AnalysisErrorItem[];

  const suggestions = Array.from(
    new Set(
      [
        ...(Array.isArray((response as any).suggestions)
          ? (response as any).suggestions
          : []),
        feedback.content,
        feedback.form,
        feedback.developmentStructureCoherence,
        feedback.grammar,
        feedback.generalLinguisticRange,
        feedback.vocabularyRange,
        feedback.spelling,
        ...writingErrors.map(
          (error) => error.explanation || error.suggestion || error.correction,
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
      "#6366f1",
    ];

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
          <div className="flex items-center justify-center">
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value, max }) => `${name}: ${value}/${max}`}
                  outerRadius={80}
                  dataKey="value"
                >
                  {data.map((entry, index) => (
                    <Cell
                      key={`${entry.name}-${index}`}
                      fill={colors[index % colors.length]}
                    />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: number, _name: string, props: any) =>
                    `${value}/${props.payload.max}`
                  }
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>

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
                Write Essay Response Analysis
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
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Word Count
                  </h4>
                  <p className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">
                    {essayWordCount}
                  </p>
                </div>
              </div>

              <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-800">
                <div className="mb-4 flex items-center gap-2">
                  <FileText className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                  <h4 className="text-base font-semibold text-gray-900 dark:text-white">
                    Your Response
                  </h4>
                </div>

                <div className="space-y-4">
                  {response.audioResponseUrl && (
                    <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-900/20">
                      <div className="mb-3 flex items-center gap-2 text-sm font-medium text-blue-700 dark:text-blue-300">
                        <Volume2 className="h-4 w-4" />
                        Audio Response
                      </div>
                      <audio
                        controls
                        src={response.audioResponseUrl}
                        className="w-full"
                        preload="metadata"
                      >
                        Your browser does not support the audio element.
                      </audio>
                    </div>
                  )}

                  <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-900/50">
                    <div className="mb-3 flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-200">
                      <FileText className="h-4 w-4" />
                      Submitted Essay
                    </div>

                    {isNonEmptyString(userAnswer) &&
                    writingErrors.length > 0 ? (
                      <div className="space-y-3">
                        <div className="flex flex-wrap items-center gap-4 text-xs">
                          <span className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-400">
                            <span className="h-3 w-3 rounded-full bg-red-500" />
                            Grammar
                          </span>
                          <span className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-400">
                            <span className="h-3 w-3 rounded-full bg-blue-500" />
                            Spelling
                          </span>
                          <span className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-400">
                            <span className="h-3 w-3 rounded-full bg-purple-500" />
                            Vocabulary
                          </span>
                          <span className="text-gray-500 dark:text-gray-400">
                            Click colored words for explanation
                          </span>
                        </div>

                        <div className="whitespace-pre-wrap text-sm leading-7 text-gray-700 dark:text-gray-300">
                          {renderHighlightedText(
                            userAnswer,
                            errorAnalysis,
                            (error: AnalysisErrorItem) =>
                              setSelectedError(error),
                          )}
                        </div>
                      </div>
                    ) : (
                      <p className="whitespace-pre-wrap text-sm leading-6 text-gray-900 dark:text-white">
                        {userAnswer}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div
                className={`rounded-2xl border-2 p-6 ${
                  response.isCorrect
                    ? "border-emerald-100 bg-emerald-50/50 dark:border-emerald-500/20 dark:bg-emerald-500/5"
                    : "border-rose-100 bg-rose-50/50 dark:border-rose-500/20 dark:bg-rose-500/5"
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className="mt-1">
                    {response.isCorrect ? (
                      <CheckCircle className="h-6 w-6 text-emerald-500" />
                    ) : (
                      <AlertCircle className="h-6 w-6 text-rose-500" />
                    )}
                  </div>

                  <div className="w-full">
                    <h4 className="text-lg font-bold text-gray-900 dark:text-white">
                      Overall Feedback
                    </h4>
                    <p className="mt-1 text-sm leading-relaxed text-gray-700 dark:text-gray-300">
                      {response.aiFeedback ||
                        feedback.summary ||
                        "No summary available."}
                    </p>

                    {detailedFeedbackEntries.length > 0 && (
                      <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                        {detailedFeedbackEntries.map(([key, value]) => (
                          <div
                            key={key}
                            className="rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-900/50"
                          >
                            <p className="mb-1 text-sm font-bold text-gray-700 dark:text-gray-300">
                              {formatScoringText(key) || key}
                            </p>
                            <p className="text-sm leading-relaxed text-gray-600 dark:text-gray-400">
                              {value as string}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
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

        {selectedError && (
          <div className="fixed inset-0 z-[220] flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-md rounded-lg border border-gray-200 bg-white p-4 shadow-xl dark:border-gray-700 dark:bg-gray-800">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div
                    className={`h-3 w-3 rounded-full ${
                      selectedError.type === "grammar" ||
                      selectedError.type === "unnecessary_word"
                        ? "bg-red-500"
                        : selectedError.type === "spelling" ||
                            selectedError.type === "spelling_error"
                          ? "bg-blue-500"
                          : selectedError.type === "vocabulary" ||
                              selectedError.type === "missing_word"
                            ? "bg-purple-500"
                            : selectedError.type === "pronunciation"
                              ? "bg-orange-500"
                              : selectedError.type === "fluency"
                                ? "bg-yellow-500"
                                : selectedError.type === "content"
                                  ? "bg-pink-500"
                                  : "bg-gray-500"
                    }`}
                  />
                  <h3 className="text-base font-semibold capitalize text-gray-900 dark:text-white">
                    Wrong Answer Error
                  </h3>
                </div>
                <button
                  onClick={() => setSelectedError(null)}
                  className="rounded-full p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-gray-200"
                >
                  <XCircle className="h-4 w-4" />
                </button>
              </div>

              <div className="space-y-3">
                {selectedError.type !== "missing_word" &&
                  selectedError.type !== "unnecessary_word" && (
                    <div>
                      <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">
                        ❌ Your text:
                      </label>
                      <div className="rounded border border-red-200 bg-red-50 p-2 dark:border-red-800 dark:bg-red-900/20">
                        <span className="text-sm font-medium text-red-800 dark:text-red-200">
                          "{selectedError.text}"
                        </span>
                      </div>
                    </div>
                  )}

                {selectedError.correction &&
                  selectedError.type !== "missing_word" &&
                  selectedError.type !== "unnecessary_word" && (
                    <div>
                      <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">
                        ✅ Suggested correction:
                      </label>
                      <div className="rounded border border-green-200 bg-green-50 p-2 dark:border-green-800 dark:bg-green-900/20">
                        <span className="text-sm font-medium text-green-800 dark:text-green-200">
                          "{selectedError.correction}"
                        </span>
                      </div>
                    </div>
                  )}

                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">
                    💡 Explanation:
                  </label>
                  <div className="rounded border border-blue-200 bg-blue-50 p-2 dark:border-blue-800 dark:bg-blue-900/20">
                    <span className="text-xs leading-relaxed text-blue-800 dark:text-blue-200">
                      {selectedError.explanation}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-4 flex justify-end">
                <button
                  onClick={() => setSelectedError(null)}
                  className="rounded bg-gray-500 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-gray-600"
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
