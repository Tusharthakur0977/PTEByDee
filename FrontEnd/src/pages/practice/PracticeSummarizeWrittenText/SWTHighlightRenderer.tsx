import React from "react";

interface AnalysisErrorItem {
  text?: string;
  type?: string;
  correction?: string;
  explanation?: string;
  suggestion?: string;
  position?: { start: number; end: number };
  context?: { before?: string; after?: string };
}

const punctuationOnlyRegex = /^[.,!?;:"'()\[\]{}\-–—]+$/;

const normalizeErrorItem = (error: any, fallbackType: string): AnalysisErrorItem => ({
  ...error,
  text:
    typeof error?.text === "string"
      ? error.text
      : typeof error?.error === "string"
        ? error.error
        : "",
  type:
    fallbackType === "grammar"
      ? error?.type === "unnecessary_word"
        ? "unnecessary_word"
        : "grammar"
      : fallbackType === "spelling"
        ? error?.type === "spelling_error"
          ? "spelling_error"
          : "spelling"
        : fallbackType === "vocabulary"
          ? error?.type === "missing_word"
            ? "missing_word"
            : "vocabulary"
          : fallbackType,
});

const collectNormalizedErrors = (errorAnalysis: any): AnalysisErrorItem[] => {
  const allErrors = [
    ...(errorAnalysis?.grammarErrors || []).map((error: any) =>
      normalizeErrorItem(error, "grammar"),
    ),
    ...(errorAnalysis?.spellingErrors || []).map((error: any) =>
      normalizeErrorItem(error, "spelling"),
    ),
    ...(errorAnalysis?.vocabularyIssues || []).map((error: any) =>
      normalizeErrorItem(error, "vocabulary"),
    ),
  ];

  return allErrors.filter((error: any) => {
    const text = typeof error.text === "string" ? error.text.trim() : "";
    if (!text) return false;
    if (punctuationOnlyRegex.test(text)) return false;
    return true;
  });
};

const renderSWTHighlightedTextUsingPositions = (
  text: string,
  positionedErrors: AnalysisErrorItem[],
) => {
  const wordSpans: Array<{ start: number; end: number }> = [];
  const wordRegex = /\S+/g;
  let match: RegExpExecArray | null;
  while ((match = wordRegex.exec(text)) !== null) {
    wordSpans.push({ start: match.index, end: match.index + match[0].length });
  }

  const errorPositions: Array<{ start: number; end: number; error: AnalysisErrorItem }> = [];

  positionedErrors.forEach((error) => {
    const startWordIdx = error.position?.start;
    const endWordIdxExclusive = error.position?.end;
    if (
      typeof startWordIdx !== "number" ||
      typeof endWordIdxExclusive !== "number" ||
      startWordIdx < 0 ||
      endWordIdxExclusive <= startWordIdx ||
      startWordIdx >= wordSpans.length
    ) {
      return;
    }
    const lastWordIdx = Math.min(wordSpans.length - 1, endWordIdxExclusive - 1);
    const startChar = wordSpans[startWordIdx]?.start;
    const endChar = wordSpans[lastWordIdx]?.end;
    if (typeof startChar !== "number" || typeof endChar !== "number") return;

    errorPositions.push({
      start: startChar,
      end: endChar,
      error,
    });
  });

  // Sort and de-overlap
  errorPositions.sort((a, b) => a.start - b.start || a.end - b.end);
  const nonOverlapping: typeof errorPositions = [];
  errorPositions.forEach((ep) => {
    const last = nonOverlapping[nonOverlapping.length - 1];
    if (!last || ep.start >= last.end) {
      nonOverlapping.push(ep);
    }
  });

  const result: React.ReactNode[] = [];
  let currentPos = 0;
  nonOverlapping.forEach((ep) => {
    if (currentPos < ep.start) {
      result.push(
        <span key={`text-${currentPos}`}>
          {text.substring(currentPos, ep.start)}
        </span>,
      );
    }

    const errorText = text.substring(ep.start, ep.end);
    const colorClass =
      ep.error.type === "unnecessary_word"
        ? "bg-red-200 dark:bg-red-800 text-red-800 dark:text-red-200 border border-red-300 dark:border-red-600"
        : ep.error.type === "spelling" || ep.error.type === "spelling_error"
          ? "bg-blue-200 dark:bg-blue-800 text-blue-800 dark:text-blue-200 border border-blue-300 dark:border-blue-600"
          : ep.error.type === "missing_word" || ep.error.type === "vocabulary"
            ? "bg-purple-200 dark:bg-purple-800 text-purple-800 dark:text-purple-200 border border-purple-300 dark:border-purple-600"
            : "bg-red-200 dark:bg-red-800 text-red-800 dark:text-red-200 border border-red-300 dark:border-red-600";

    result.push(
      <span key={`error-${ep.start}-${ep.end}`} className="inline-flex flex-wrap items-center gap-1.5 mx-1">
        <span
          className={`${colorClass} line-through opacity-85 px-1 py-0.5 rounded font-medium cursor-help`}
          title={ep.error.explanation || `Incorrect ${ep.error.type}`}
        >
          {errorText}
        </span>
        {ep.error.correction && (
          <span className="bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 px-1 py-0.5 rounded font-bold text-xs">
            {ep.error.correction}
          </span>
        )}
      </span>,
    );

    currentPos = ep.end;
  });

  if (currentPos < text.length) {
    result.push(
      <span key={`text-${currentPos}`}>{text.substring(currentPos)}</span>,
    );
  }

  return <span>{result}</span>;
};

// Main function to render text with error highlights and inline suggestions for SWT
export const renderSWTHighlightedText = (
  text: string,
  errorAnalysis: any,
) => {
  if (!text || !errorAnalysis) return <span>{text}</span>;

  const validErrors = collectNormalizedErrors(errorAnalysis);

  // Prefer backend-provided word positions when available
  const positionedErrors = validErrors.filter(
    (error) =>
      typeof error.position?.start === "number" &&
      typeof error.position?.end === "number" &&
      error.position.end > error.position.start,
  );

  if (positionedErrors.length > 0) {
    return renderSWTHighlightedTextUsingPositions(text, positionedErrors);
  }

  const lowerText = text.toLowerCase();
  const result: React.ReactNode[] = [];

  // Sort errors by position in text (longest first to avoid partial matches)
  const sortedErrors = [...validErrors].sort((a, b) => {
    const aPos = lowerText.indexOf((a.text || "").toLowerCase());
    const bPos = lowerText.indexOf((b.text || "").toLowerCase());
    return (b.text || "").length - (a.text || "").length || aPos - bPos;
  });

  // Create a map of error positions
  const errorPositions: Array<{
    start: number;
    end: number;
    error: AnalysisErrorItem;
  }> = [];

  sortedErrors.forEach((error) => {
    const errorTextLower = (error.text || "")
      .toLowerCase()
      .replace(/[.,!?;:"'()]/g, "");
    if (!errorTextLower) return;
    let searchStart = 0;
    let pos = -1;

    while ((pos = lowerText.indexOf(errorTextLower, searchStart)) !== -1) {
      const overlaps = errorPositions.some(
        (ep) =>
          (pos >= ep.start && pos < ep.end) ||
          (pos + errorTextLower.length > ep.start && pos < ep.end),
      );

      if (!overlaps) {
        errorPositions.push({
          start: pos,
          end: pos + errorTextLower.length,
          error,
        });
      }
      searchStart = pos + 1;
    }
  });

  // Sort error positions by start index
  errorPositions.sort((a, b) => a.start - b.start);

  let currentPos = 0;
  errorPositions.forEach((ep) => {
    if (currentPos < ep.start) {
      result.push(
        <span key={`text-${currentPos}`}>
          {text.substring(currentPos, ep.start)}
        </span>,
      );
    }

    const errorText = text.substring(ep.start, ep.end);
    const colorClass =
      ep.error.type === "unnecessary_word"
        ? "bg-red-200 dark:bg-red-800 text-red-800 dark:text-red-200 border border-red-300 dark:border-red-600"
        : ep.error.type === "spelling" || ep.error.type === "spelling_error"
          ? "bg-blue-200 dark:bg-blue-800 text-blue-800 dark:text-blue-200 border border-blue-300 dark:border-blue-600"
          : ep.error.type === "missing_word" || ep.error.type === "vocabulary"
            ? "bg-purple-200 dark:bg-purple-800 text-purple-800 dark:text-purple-200 border border-purple-300 dark:border-purple-600"
            : "bg-red-200 dark:bg-red-800 text-red-800 dark:text-red-200 border border-red-300 dark:border-red-600";

    result.push(
      <span key={`error-${ep.start}`} className="inline-flex flex-wrap items-center gap-1.5 mx-1">
        <span
          className={`${colorClass} line-through opacity-85 px-1 py-0.5 rounded font-medium cursor-help`}
          title={ep.error.explanation || `Incorrect ${ep.error.type}`}
        >
          {errorText}
        </span>
        {ep.error.correction && (
          <span className="bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 px-1 py-0.5 rounded font-bold text-xs">
            {ep.error.correction}
          </span>
        )}
      </span>,
    );

    currentPos = ep.end;
  });

  if (currentPos < text.length) {
    result.push(
      <span key={`text-${currentPos}`}>{text.substring(currentPos)}</span>,
    );
  }

  return <span>{result}</span>;
};
