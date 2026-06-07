import {
  Clock3,
  FileText,
  TrendingUp,
  X,
  XCircle,
  AlertCircle,
  CheckCircle,
  HelpCircle,
  Info,
  ChevronRight,
  Keyboard,
  Target,
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

interface AnalysisErrorItem {
  position?: number | { start?: number; end?: number };
  text?: string;
  error?: string;
  type?: string;
  correction?: string;
  explanation?: string;
  suggestion?: string;
}

type DictationToken = {
  raw: string;
  normalized: string;
};

type DictationAlignmentOp =
  | { type: "correct"; correct: DictationToken; user: DictationToken }
  | { type: "spelling"; correct: DictationToken; user: DictationToken }
  | { type: "missing"; correct: DictationToken }
  | { type: "extra"; user: DictationToken };

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === "string" && value.trim().length > 0;

const normalizeWord = (word: string) =>
  word.toLowerCase().replace(/^[^a-z0-9']+|[^a-z0-9']+$/gi, "");

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
  const parent: ("diag_exact" | "diag_similar" | "up" | "left" | null)[][] =
    Array.from({ length: n + 1 }, () => Array(m + 1).fill(null));

  dp[0][0] = 0;

  for (let i = 1; i <= n; i++) {
    dp[i][0] = dp[i - 1][0] + GAP;
    parent[i][0] = "up";
  }

  for (let j = 1; j <= m; j++) {
    dp[0][j] = dp[0][j - 1] + GAP;
    parent[0][j] = "left";
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
        parent[i][j] = "diag_exact";
      } else if (best === similar) {
        parent[i][j] = "diag_similar";
      } else if (best === up) {
        parent[i][j] = "up";
      } else {
        parent[i][j] = "left";
      }
    }
  }

  const ops: DictationAlignmentOp[] = [];
  let i = n;
  let j = m;

  while (i > 0 || j > 0) {
    const move = parent[i][j];

    if (move === "diag_exact") {
      ops.push({ type: "correct", correct: correct[i - 1], user: user[j - 1] });
      i--;
      j--;
      continue;
    }

    if (move === "diag_similar") {
      ops.push({
        type: "spelling",
        correct: correct[i - 1],
        user: user[j - 1],
      });
      i--;
      j--;
      continue;
    }

    if (move === "up") {
      ops.push({ type: "missing", correct: correct[i - 1] });
      i--;
      continue;
    }

    ops.push({ type: "extra", user: user[j - 1] });
    j--;
  }

  return ops.reverse();
};

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

const getErrorColorClass = (type?: string) => {
  if (type === "grammar" || type === "unnecessary_word") return "bg-rose-500";
  if (type === "spelling" || type === "spelling_error") return "bg-amber-500";
  if (type === "vocabulary" || type === "missing_word") return "bg-purple-500";
  if (type === "content") return "bg-sky-500";
  return "bg-slate-500";
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

const normalizeDictationErrors = (analysisError: any) => {
  const grammarErrors = Array.isArray(analysisError?.grammarErrors)
    ? analysisError.grammarErrors
    : [];
  const spellingErrors = Array.isArray(analysisError?.spellingErrors)
    ? analysisError.spellingErrors
    : [];
  const vocabularyIssues = Array.isArray(analysisError?.vocabularyIssues)
    ? analysisError.vocabularyIssues
    : [];

  return {
    grammarErrors: grammarErrors.map((error: any) => ({
      ...error,
      text:
        typeof error?.text === "string"
          ? error.text
          : typeof error?.error === "string"
            ? error.error
            : "",
      type: error?.type === "unnecessary_word" ? "unnecessary_word" : "grammar",
      correction:
        typeof error?.correction === "string"
          ? error.correction
          : typeof error?.suggestion === "string"
            ? error.suggestion
            : "",
      explanation:
        typeof error?.explanation === "string"
          ? error.explanation
          : typeof error?.suggestion === "string" &&
              typeof error?.text === "string"
            ? `"${error.text}" should be "${error.suggestion}".`
            : "Review this grammar issue in your response.",
      suggestion:
        typeof error?.suggestion === "string" ? error.suggestion : undefined,
    })),
    spellingErrors: spellingErrors.map((error: any) => ({
      ...error,
      text:
        typeof error?.text === "string"
          ? error.text
          : typeof error?.error === "string"
            ? error.error
            : "",
      type: "spelling_error",
      correction:
        typeof error?.correction === "string"
          ? error.correction
          : typeof error?.suggestion === "string"
            ? error.suggestion
            : "",
      explanation:
        typeof error?.explanation === "string"
          ? error.explanation
          : typeof error?.suggestion === "string" &&
              typeof error?.text === "string"
            ? `"${error.text}" should be "${error.suggestion}".`
            : "This word should be corrected.",
      suggestion:
        typeof error?.suggestion === "string" ? error.suggestion : undefined,
    })),
    vocabularyIssues: vocabularyIssues.map((error: any) => ({
      ...error,
      text:
        typeof error?.text === "string"
          ? error.text
          : typeof error?.error === "string"
            ? error.error
            : "",
      type: error?.type === "missing_word" ? "missing_word" : "vocabulary",
      correction:
        typeof error?.correction === "string"
          ? error.correction
          : typeof error?.suggestion === "string"
            ? error.suggestion
            : "",
      explanation:
        typeof error?.explanation === "string"
          ? error.explanation
          : error?.type === "missing_word" && typeof error?.text === "string"
            ? `You missed the word: "${error.text}".`
            : "Review this vocabulary issue.",
      suggestion:
        typeof error?.suggestion === "string" ? error.suggestion : undefined,
    })),
    contentErrors: Array.isArray(analysisError?.contentErrors)
      ? analysisError.contentErrors
      : [],
  };
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

  const analysis = parseDetailedAnalysis(response.detailedAnalysis);
  const scores = analysis.scores || {};
  const normalizedErrorAnalysis = normalizeDictationErrors(
    analysis.errorAnalysis || {},
  );

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
    response.textResponse ||
    analysis.userText ||
    analysis.recognizedText ||
    "No response captured.";
  const correctText = analysis.correctAnswer || analysis.correctText || "";

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
              Overall accuracy and spelling performance.
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

  const renderHighlightedText = () => {
    const operations = alignDictationWords(correctText || "", userAnswer || "");

    const spellingErrors = [...(normalizedErrorAnalysis.spellingErrors || [])];
    const missingErrors = [...(normalizedErrorAnalysis.vocabularyIssues || [])].filter(
      (e: any) => e?.type === "missing_word",
    );
    const extraErrors = [...(normalizedErrorAnalysis.grammarErrors || [])].filter(
      (e: any) => e?.type === "unnecessary_word",
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
      if (op.type === "correct") {
        parts.push(
          <span
            key={`dict-correct-${idx}`}
            className="text-emerald-600 dark:text-emerald-400"
          >
            {op.correct.raw}
          </span>,
        );
      }

      if (op.type === "missing") {
        const error = consumeMatchingError(
          missingErrors,
          (e) => normalizeWord(e?.text || "") === op.correct.normalized,
        ) || {
          text: op.correct.raw,
          type: "missing_word",
          correction: op.correct.raw,
          explanation: `You missed the word: "${op.correct.raw}"`,
        };

        parts.push(
          <span
            key={`dict-missing-${idx}`}
            className="cursor-pointer font-bold text-rose-500 underline decoration-rose-500/30 decoration-2 underline-offset-4 hover:bg-rose-500/10 transition-colors"
            onClick={() => setSelectedError(error)}
          >
            ({op.correct.raw})
          </span>,
        );
      }

      if (op.type === "extra") {
        const error = consumeMatchingError(
          extraErrors,
          (e) => normalizeWord(e?.text || "") === op.user.normalized,
        ) || {
          text: op.user.raw,
          type: "unnecessary_word",
          correction: "",
          explanation: `Unnecessary word that should be removed: "${op.user.raw}"`,
        };

        parts.push(
          <span
            key={`dict-extra-${idx}`}
            className="cursor-pointer text-slate-400 line-through decoration-slate-400/50 decoration-2 hover:bg-slate-500/10 transition-colors"
            onClick={() => setSelectedError(error)}
          >
            {op.user.raw}
          </span>,
        );
      }

      if (op.type === "spelling") {
        const error = consumeMatchingError(
          spellingErrors,
          (e) =>
            normalizeWord(e?.text || "") === op.user.normalized &&
            normalizeWord(e?.correction || e?.suggestion || "") ===
              op.correct.normalized,
        ) ||
          consumeMatchingError(
            spellingErrors,
            (e) => normalizeWord(e?.text || "") === op.user.normalized,
          ) || {
            text: op.user.raw,
            type: "spelling_error",
            correction: op.correct.raw,
            explanation: `Wrong word: "${op.user.raw}" should be "${op.correct.raw}"`,
          };

        parts.push(
          <span
            key={`dict-spelling-user-${idx}`}
            className="cursor-pointer font-bold text-amber-500 line-through decoration-amber-500/30 decoration-2 hover:bg-amber-500/10 transition-colors"
            onClick={() => setSelectedError(error)}
          >
            {op.user.raw}
          </span>,
        );
        parts.push(" ");
        parts.push(
          <span
            key={`dict-spelling-correction-${idx}`}
            className="cursor-pointer font-bold text-amber-600 dark:text-amber-400 underline decoration-amber-400/30 decoration-2 underline-offset-4"
            onClick={() => setSelectedError(error)}
          >
            ({op.correct.raw})
          </span>,
        );
      }

      if (idx < operations.length - 1) {
        parts.push(" ");
      }
    });

    return parts;
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
                        Write From Dictation Analysis
                      </h3>
                      <p className="mt-1 max-w-2xl text-sm text-slate-600 dark:text-slate-400">
                        Review your transcribed sentence against the original recording.
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

          <div className="custom-scrollbar flex-1 overflow-y-auto p-4 sm:p-6">
            <div className="grid gap-5 xl:grid-cols-2">
              <div className="min-w-0 flex flex-col gap-5">
                {renderScoringChart()}

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                   <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_18px_60px_rgba(15,23,42,0.08)] dark:border-slate-700/70 dark:bg-slate-900/80 dark:shadow-[0_18px_60px_rgba(15,23,42,0.24)]">
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

                  <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_18px_60px_rgba(15,23,42,0.08)] dark:border-slate-700/70 dark:bg-slate-900/80 dark:shadow-[0_18px_60px_rgba(15,23,42,0.24)]">
                    <div className="mb-4 flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-amber-500/20 bg-amber-500/10 text-amber-600 dark:text-amber-400">
                        <Keyboard className="h-5 w-5" />
                      </div>
                      <div>
                        <h4 className="text-base font-semibold text-slate-900 dark:text-slate-50">
                          Word Count
                        </h4>
                      </div>
                    </div>
                    <p className="text-3xl font-bold text-slate-900 dark:text-slate-100">
                      {userAnswer.split(/\s+/).filter(Boolean).length}
                      <span className="ml-1 text-base font-medium text-slate-500 dark:text-slate-400">words</span>
                    </p>
                  </div>
                </div>
              </div>

              <div className="min-w-0 flex flex-col gap-5">
                <div className="rounded-3xl border border-slate-200 bg-white shadow-[0_18px_60px_rgba(15,23,42,0.08)] dark:border-slate-700/70 dark:bg-slate-900/80 dark:shadow-[0_18px_60px_rgba(15,23,42,0.24)]">
                  <div className="border-b border-slate-200 px-5 py-4 dark:border-white/10">
                    <div className="flex flex-col gap-4">
                       <div className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-200">
                         <FileText className="h-4 w-4 text-slate-500 dark:text-slate-400" />
                         Transcript Comparison
                       </div>
                       <div className="flex flex-wrap gap-3 text-[10px] font-bold uppercase tracking-wider">
                          <div className="flex items-center gap-1.5 text-emerald-500">
                             <div className="h-2 w-2 rounded-full bg-emerald-500"></div>
                             Correct
                          </div>
                          <div className="flex items-center gap-1.5 text-rose-500">
                             <div className="h-2 w-2 rounded-full bg-rose-500"></div>
                             Missing
                          </div>
                          <div className="flex items-center gap-1.5 text-amber-500">
                             <div className="h-2 w-2 rounded-full bg-amber-500"></div>
                             Spelling
                          </div>
                          <div className="flex items-center gap-1.5 text-slate-400">
                             <div className="h-2 w-2 rounded-full bg-slate-400"></div>
                             Extra
                          </div>
                       </div>
                    </div>
                  </div>

                  <div className="px-5 py-6">
                     <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-5 dark:border-slate-800 dark:bg-slate-900/50">
                        <p className="text-lg leading-relaxed font-medium italic select-none">
                           {correctText ? renderHighlightedText() : userAnswer}
                        </p>
                     </div>
                     
                     {isNonEmptyString(correctText) && (
                       <div className="mt-6 space-y-2">
                          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 flex items-center gap-2">
                             <Target className="h-3 w-3" />
                             Correct Sentence
                          </p>
                          <div className="rounded-xl border border-emerald-500/10 bg-emerald-500/5 p-4">
                             <p className="text-sm italic text-emerald-700 dark:text-emerald-300">
                                {correctText}
                             </p>
                          </div>
                       </div>
                     )}
                  </div>
                </div>
              </div>
            </div>

            {selectedError && (
               <div className="mt-5 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700/70 dark:bg-slate-900/80 animate-in fade-in slide-in-from-bottom-4 duration-300">
                  <div className="flex items-start justify-between">
                     <div className="flex items-center gap-3">
                        <div className={`flex h-10 w-10 items-center justify-center rounded-2xl ${getErrorColorClass(selectedError.type)} text-white`}>
                           <Info className="h-5 w-5" />
                        </div>
                        <div>
                           <h4 className="text-lg font-semibold text-slate-900 dark:text-slate-50 capitalize">
                              {selectedError.type?.replace(/_/g, " ")} Error
                           </h4>
                           <p className="text-sm text-slate-500">Detailed feedback for the selected word.</p>
                        </div>
                     </div>
                     <button onClick={() => setSelectedError(null)} className="text-slate-400 hover:text-slate-600">
                        <X className="h-5 w-5" />
                     </button>
                  </div>
                  
                  <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
                     <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-4 dark:border-slate-800 dark:bg-slate-950/50">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Your Input</p>
                        <p className="mt-1 text-sm font-semibold text-rose-500">{selectedError.text || "(blank)"}</p>
                     </div>
                     <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-4 dark:border-slate-800 dark:bg-slate-950/50">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Correction</p>
                        <p className="mt-1 text-sm font-semibold text-emerald-500">{selectedError.correction || "N/A"}</p>
                     </div>
                  </div>
                  
                  <div className="mt-4 rounded-2xl border border-sky-500/10 bg-sky-500/5 p-4">
                     <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                        {selectedError.explanation}
                     </p>
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
