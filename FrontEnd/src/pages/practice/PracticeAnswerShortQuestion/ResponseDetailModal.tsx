import {
  AlertCircle,
  CheckCircle2,
  Clock3,
  FileText,
  Lightbulb,
  MessageSquareText,
  Mic,
  TrendingUp,
  Volume2,
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

interface AnalysisErrorItem {
  text?: string;
  type?: string;
  correction?: string;
  explanation?: string;
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
  const contentErrors: AnalysisErrorItem[] =
    analysis.errorAnalysis?.contentErrors || [];

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
  const remainingScore = Math.max(totalMax - totalScore, 0);
  const scorePercentage =
    totalMax > 0 ? Math.round((totalScore / totalMax) * 100) : 0;

  const chartData = totalMax
    ? [
        {
          name: "Scored",
          value: totalScore,
          fill: response.isCorrect ? "#10b981" : "#f59e0b",
        },
        {
          name: "Remaining",
          value: remainingScore,
          fill: "#e5e7eb",
        },
      ]
    : [];

  const userAnswer =
    response.textResponse || analysis.userText || "No answer captured.";
  const correctAnswer = analysis.correctAnswer;

  const suggestions = Array.from(
    new Set(
      [
        feedback.vocabulary,
        feedback.content,
        ...contentErrors.map((error) => error.explanation),
      ].filter(isNonEmptyString),
    ),
  );

  const renderScoringChart = () => {
    const COLORS = [
      "#3b82f6", // blue
      "#8b5cf6", // purple
      "#ec4899", // pink
      "#f59e0b", // amber
      "#10b981", // green
      "#ef4444", // red
      "#06b6d4", // cyan
      "#eab308", // yellow
      "#6366f1", // indigo
      "#14b8a6", // teal
      "#f97316", // orange
      "#84cc16", // lime
      "#a855f7", // violet
      "#d946ef", // fuchsia
      "#0ea5e9", // sky blue
    ];

    const data = Object.entries(response.detailedAnalysis?.scores || {}).map(
      ([name, values]: any) => ({
        name: formatScoringText(name),
        value: values.score,
        max: values.max,
      }),
    );

    const showChart = data.some((item: any) => item.value > 0);

    return (
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg p-6 border border-blue-200 dark:border-blue-800">
        <div className="flex items-center space-x-2 mb-6">
          <TrendingUp className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          <h4 className="font-semibold text-gray-900 dark:text-white">
            Score Breakdown
          </h4>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Pie Chart */}
          {showChart && (
            <div className="flex justify-center items-center">
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={data}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value, max }) => `${name}: ${value}/${max}`}
                    outerRadius={80}
                    innerRadius={40}
                    fill="#8884d8"
                    dataKey="value"
                    activeShape
                  >
                    {data.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: any, name: string, props: any) =>
                      `${value}/${props.payload.max}`
                    }
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Component Scores */}
          <div className="space-y-3">
            {data.map((item, index) => (
              <div
                key={item.name}
                className="bg-white dark:bg-gray-700 rounded-lg p-3 border border-gray-200 dark:border-gray-600 flex items-center justify-between mb-2"
              >
                <div className="flex items-center space-x-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: COLORS[index] }}
                  ></div>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {item.name}
                  </span>
                </div>
                <span className="text-lg font-bold text-gray-900 dark:text-white">
                  {item.value}/{item.max}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div className="flex min-h-screen items-center justify-center px-4 py-6 text-center sm:p-6">
        {/* Background overlay */}
        <div
          className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75 dark:bg-gray-900 dark:bg-opacity-75"
          onClick={onClose}
        ></div>

        {/* Modal */}
        <div className="inline-block w-full max-w-5xl overflow-hidden rounded-lg border border-gray-200 bg-white text-left align-middle shadow-2xl transition-all transform dark:border-gray-700 dark:bg-gray-800">
          <div className="flex items-start justify-between gap-4 border-b border-gray-200 bg-gray-50 px-6 py-5 dark:border-gray-700 dark:bg-gray-800/80">
            <div className="space-y-2 flex justify-between flex-1">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Answer Short Question Details
                </h2>

                <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                  {typeof questionNumber === "number" && (
                    <span className="rounded-full bg-blue-100 px-2.5 py-1 font-semibold text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                      Question {questionNumber}
                    </span>
                  )}
                  <span>{formatDate(response.createdAt)}</span>
                </div>
              </div>

              <button
                onClick={onClose}
                className="rounded-lg p-2 text-gray-500 transition-colors hover:bg-gray-200 hover:text-gray-700 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-white"
                aria-label="Close response details"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          <div className="p-6">
            <div className="max-h-[70vh] overflow-y-auto overscroll-contain pr-1">
              <div className="space-y-6">
                {renderScoringChart()}

                <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-800">
                  <div className="mb-4 flex items-center gap-2">
                    <Mic className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                    <h3 className="text-base font-semibold text-gray-900 dark:text-white">
                      Your Response
                    </h3>
                  </div>

                  <div className="space-y-4">
                    {response.audioResponseUrl && (
                      <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-900/20">
                        <div className="mb-3 flex items-center gap-2 text-sm font-medium text-blue-700 dark:text-blue-300">
                          <Volume2 className="h-4 w-4" />
                          Recorded Audio
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
                      <div className="mb-2 flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-200">
                        <FileText className="h-4 w-4" />
                        User Answer
                      </div>
                      <p className="whitespace-pre-wrap text-sm leading-6 text-gray-900 dark:text-white">
                        {userAnswer}
                      </p>
                    </div>
                  </div>
                </div>

                {(contentErrors.length || isNonEmptyString(correctAnswer)) && (
                  <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-800">
                    <div className="mb-4 flex items-center gap-2">
                      <MessageSquareText className="h-5 w-5 text-violet-600 dark:text-violet-400" />
                      <h3 className="text-base font-semibold text-gray-900 dark:text-white">
                        Answer Review
                      </h3>
                    </div>

                    <div className="space-y-4">
                      {!response.isCorrect &&
                        isNonEmptyString(correctAnswer) && (
                          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-800 dark:bg-emerald-900/20">
                            <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-300">
                              Correct Answer
                            </p>
                            <p className="mt-2 text-base font-semibold text-emerald-900 dark:text-emerald-100">
                              {correctAnswer}
                            </p>
                          </div>
                        )}

                      {contentErrors.map((error, index) => (
                        <div
                          key={`${error.text || "content-error"}-${index}`}
                          className="rounded-xl border border-rose-200 bg-rose-50 p-4 dark:border-rose-800 dark:bg-rose-900/20"
                        >
                          <div className="grid gap-4 md:grid-cols-2">
                            <div>
                              <p className="text-xs font-semibold uppercase tracking-wide text-rose-700 dark:text-rose-300">
                                Your Answer
                              </p>
                              <p className="mt-2 text-sm text-rose-900 dark:text-rose-100">
                                {error.text || userAnswer}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
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
      </div>
    </div>
  );
};

export default ResponseDetailModal;
