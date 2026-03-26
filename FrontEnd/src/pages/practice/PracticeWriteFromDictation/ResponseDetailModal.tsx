import { Clock3, FileText, TrendingUp, X, XCircle } from "lucide-react";
import React, { useEffect, useState } from "react";
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

  if (percentage >= 80) return "text-emerald-600 dark:text-emerald-400";
  if (percentage >= 60) return "text-amber-600 dark:text-amber-400";
  return "text-rose-600 dark:text-rose-400";
};

const getErrorColor = (type?: string) => {
  if (type === "grammar" || type === "unnecessary_word") {
    return "bg-red-500";
  }
  if (type === "spelling" || type === "spelling_error") {
    return "bg-orange-500";
  }
  if (type === "vocabulary" || type === "missing_word") {
    return "bg-purple-500";
  }
  if (type === "content") {
    return "bg-pink-500";
  }
  return "bg-gray-500";
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

const renderDictationHighlightedText = (
  userText: string,
  correctText: string,
  errorAnalysis: any,
  onPressError: (error: AnalysisErrorItem) => void,
) => {
  const operations = alignDictationWords(correctText || "", userText || "");

  const spellingErrors = [...(errorAnalysis?.spellingErrors || [])];
  const missingErrors = [...(errorAnalysis?.vocabularyIssues || [])].filter(
    (e: any) => e?.type === "missing_word",
  );
  const extraErrors = [...(errorAnalysis?.grammarErrors || [])].filter(
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
          className="text-teal-600 dark:text-teal-300"
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
          className="cursor-pointer font-medium text-red-600 dark:text-red-400"
          onClick={() => onPressError(error)}
          title="Missing word - click for details"
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
          className="cursor-pointer text-gray-500 line-through dark:text-gray-400"
          onClick={() => onPressError(error)}
          title="Extra word - click for details"
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
          className="cursor-pointer font-medium text-orange-500 line-through dark:text-orange-400"
          onClick={() => onPressError(error)}
          title="Wrong or misspelled word - click for details"
        >
          {op.user.raw}
        </span>,
      );
      parts.push(" ");
      parts.push(
        <span
          key={`dict-spelling-correction-${idx}`}
          className="cursor-pointer font-semibold text-orange-600 dark:text-orange-400"
          onClick={() => onPressError(error)}
          title="Wrong or misspelled word - click for details"
        >
          ({op.correct.raw})
        </span>,
      );
    }

    if (idx < operations.length - 1) {
      parts.push(" ");
    }
  });

  return <span>{parts}</span>;
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
  const feedback = analysis.feedback || {};
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
  const timeTaken =
    typeof response.timeTakenSeconds === "number"
      ? response.timeTakenSeconds
      : typeof analysis.timeTaken === "number"
        ? analysis.timeTaken
        : 0;
  const typedWordCount = userAnswer.split(/\s+/).filter(Boolean).length;

  const missingWordErrors = normalizedErrorAnalysis.vocabularyIssues.filter(
    (error: AnalysisErrorItem) => error.type === "missing_word",
  );
  const extraWordErrors = normalizedErrorAnalysis.grammarErrors.filter(
    (error: AnalysisErrorItem) => error.type === "unnecessary_word",
  );
  const wrongWordErrors = normalizedErrorAnalysis.spellingErrors;
  const contentErrors =
    normalizedErrorAnalysis.contentErrors as AnalysisErrorItem[];

  const detailedFeedbackEntries = Object.entries(feedback).filter(([, value]) =>
    isNonEmptyString(value),
  );

  const renderScoringChart = () => {
    const colors = ["#3b82f6", "#8b5cf6", "#ec4899", "#f59e0b", "#10b981"];
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
                Write From Dictation Response Analysis
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

              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
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
                    {timeTaken}s
                  </p>
                </div>
              </div>

              <div className="rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
                <div className="flex flex-col justify-between gap-3 border-b border-gray-100 px-6 py-4 dark:border-gray-700 lg:flex-row lg:items-center">
                  <div className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                    <h4 className="font-bold text-gray-800 dark:text-gray-200">
                      Your Response
                    </h4>
                  </div>
                  <div className="flex flex-wrap items-center gap-4 text-xs">
                    <div className="flex items-center gap-1.5">
                      <span className="inline-block h-3 w-3 rounded-full bg-teal-500" />
                      <span className="text-gray-600 dark:text-gray-400">
                        Correct
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="inline-block h-3 w-3 rounded-full bg-red-500" />
                      <span className="text-gray-600 dark:text-gray-400">
                        Missing word
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="inline-block h-3 w-3 rounded-full bg-gray-400" />
                      <span className="text-gray-600 dark:text-gray-400">
                        Extra word
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="inline-block h-3 w-3 rounded-full bg-orange-500" />
                      <span className="text-gray-600 dark:text-gray-400">
                        Wrong / misspelled
                      </span>
                    </div>
                    <span className="text-gray-500 dark:text-gray-400">
                      Click highlighted words for details
                    </span>
                  </div>
                </div>

                <div className="p-6 text-base italic leading-relaxed text-gray-700 dark:text-gray-300">
                  {correctText ? (
                    renderDictationHighlightedText(
                      userAnswer,
                      correctText,
                      normalizedErrorAnalysis,
                      (error: AnalysisErrorItem) => setSelectedError(error),
                    )
                  ) : (
                    <p className="whitespace-pre-wrap">{userAnswer}</p>
                  )}
                </div>

                {isNonEmptyString(correctText) && (
                  <div className="px-6 pb-5">
                    <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 dark:border-emerald-700 dark:bg-emerald-900/20">
                      <p className="mb-1 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                        Correct sentence
                      </p>
                      <p className="text-sm italic text-emerald-800 dark:text-emerald-300">
                        {correctText}
                      </p>
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

        {selectedError && (
          <div className="fixed inset-0 z-[220] flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-md rounded-lg border border-gray-200 bg-white p-4 shadow-xl dark:border-gray-700 dark:bg-gray-800">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div
                    className={`h-3 w-3 rounded-full ${getErrorColor(
                      selectedError.type,
                    )}`}
                  />
                  <h3 className="text-base font-semibold capitalize text-gray-900 dark:text-white">
                    {selectedError.type === "unnecessary_word"
                      ? "Unnecessary Word"
                      : selectedError.type === "missing_word"
                        ? "Missing Word"
                        : selectedError.type === "spelling_error"
                          ? "Spelling Mistake"
                          : (selectedError.type || "dictation").replace(
                              /_/g,
                              " ",
                            )}{" "}
                    Error
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
                        Your text:
                      </label>
                      <div className="rounded border border-red-200 bg-red-50 p-2 dark:border-red-800 dark:bg-red-900/20">
                        <span className="text-sm font-medium text-red-800 dark:text-red-200">
                          "{selectedError.text}"
                        </span>
                      </div>
                    </div>
                  )}

                {selectedError.type === "missing_word" && (
                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">
                      Missing word:
                    </label>
                    <div className="rounded border border-red-200 bg-red-50 p-2 dark:border-red-800 dark:bg-red-900/20">
                      <span className="text-sm font-medium text-red-800 dark:text-red-200">
                        "{selectedError.text}"
                      </span>
                    </div>
                  </div>
                )}

                {selectedError.type === "unnecessary_word" && (
                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">
                      Extra word:
                    </label>
                    <div className="rounded border border-orange-200 bg-orange-50 p-2 dark:border-orange-800 dark:bg-orange-900/20">
                      <span className="text-sm font-medium text-orange-800 dark:text-orange-200">
                        "{selectedError.text}"
                      </span>
                    </div>
                  </div>
                )}

                {isNonEmptyString(selectedError.correction) &&
                  selectedError.type !== "unnecessary_word" && (
                    <div>
                      <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">
                        Suggested correction:
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
                    Explanation:
                  </label>
                  <div className="rounded border border-blue-200 bg-blue-50 p-2 dark:border-blue-800 dark:bg-blue-900/20">
                    <span className="text-xs leading-relaxed text-blue-800 dark:text-blue-200">
                      {selectedError.explanation ||
                        "Review this issue and compare it with the correct sentence."}
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
