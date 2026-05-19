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

const punctuationOnlyRegex = /^[.,!?;:"'()\[\]{}\-–—\n\r]+$/;

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

// Main function to render text with error highlights and inline suggestions for Summarize Spoken Text
export const renderSSTHighlightedText = (
  text: string,
  errorAnalysis: any,
) => {
  if (!text || !errorAnalysis) return <span className="whitespace-pre-wrap">{text}</span>;

  const validErrors = collectNormalizedErrors(errorAnalysis);

  // Split on whitespace to get word-level spans
  const wordSpans: Array<{ start: number; end: number }> = [];
  const wordRegex = /\S+/g;
  let match: RegExpExecArray | null;
  while ((match = wordRegex.exec(text)) !== null) {
    wordSpans.push({ start: match.index, end: match.index + match[0].length });
  }

  // We will build a list of non-overlapping error highlights: { startChar, endChar, error }
  const matchedRanges: Array<{ start: number; end: number; error: AnalysisErrorItem }> = [];

  // Helper to check if a character range overlaps with already matched ranges
  const isOverlapping = (start: number, end: number) => {
    return matchedRanges.some(
      (r) => (start >= r.start && start < r.end) || (end > r.start && start < r.end)
    );
  };

  // Phase 1: Try to use valid backend positions (if and only if they match the expected text)
  validErrors.forEach((error) => {
    const startWordIdx = error.position?.start;
    const endWordIdxExclusive = error.position?.end;
    if (
      typeof startWordIdx === "number" &&
      typeof endWordIdxExclusive === "number" &&
      startWordIdx >= 0 &&
      endWordIdxExclusive > startWordIdx &&
      startWordIdx < wordSpans.length
    ) {
      const lastWordIdx = Math.min(wordSpans.length - 1, endWordIdxExclusive - 1);
      const startChar = wordSpans[startWordIdx]?.start;
      const endChar = wordSpans[lastWordIdx]?.end;
      
      if (typeof startChar === "number" && typeof endChar === "number") {
        const textAtPosition = text.substring(startChar, endChar).toLowerCase().trim();
        const expectedErrorText = (error.text || "").toLowerCase().trim();
        
        const cleanTextAtPosition = textAtPosition.replace(/[.,!?;:"'()\[\]{}]/g, "");
        const cleanExpected = expectedErrorText.replace(/[.,!?;:"'()\[\]{}]/g, "");
        
        if (cleanTextAtPosition.includes(cleanExpected) || cleanExpected.includes(cleanTextAtPosition)) {
          if (!isOverlapping(startChar, endChar)) {
            matchedRanges.push({
              start: startChar,
              end: endChar,
              error,
            });
          }
        }
      }
    }
  });

  // Phase 2: Fallback to substring matching for errors that weren't matched in Phase 1 (e.g. if the LLM provided wrong positions)
  const remainingErrors = validErrors.filter(
    (err) => !matchedRanges.some((m) => m.error === err)
  );

  // Sort remaining errors by text length descending so we match larger phrases first
  const sortedRemaining = [...remainingErrors].sort(
    (a, b) => (b.text || "").length - (a.text || "").length
  );

  const lowerText = text.toLowerCase();

  sortedRemaining.forEach((error) => {
    const errorTextLower = (error.text || "")
      .toLowerCase()
      .replace(/[.,!?;:"'()]/g, "");
    if (!errorTextLower) return;
    
    let searchStart = 0;
    let pos = -1;
    
    while ((pos = lowerText.indexOf(errorTextLower, searchStart)) !== -1) {
      const end = pos + errorTextLower.length;
      if (!isOverlapping(pos, end)) {
        matchedRanges.push({
          start: pos,
          end: end,
          error,
        });
        break; // matched this error, move to next
      }
      searchStart = pos + 1;
    }
  });

  // Sort matched ranges by start character position
  matchedRanges.sort((a, b) => a.start - b.start);

  // Render the text with high-quality highlighted segments
  const result: React.ReactNode[] = [];
  let currentPos = 0;
  
  matchedRanges.forEach((ep) => {
    if (currentPos < ep.start) {
      result.push(
        <span key={`text-${currentPos}`} className="whitespace-pre-wrap">
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
      <span key={`text-${currentPos}`} className="whitespace-pre-wrap">{text.substring(currentPos)}</span>,
    );
  }

  return <span>{result}</span>;
};
