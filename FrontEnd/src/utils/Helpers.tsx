// Utility shuffle function
export function shuffleArray(array: any[]) {
  return array
    .map((item) => ({ item, sort: Math.random() }))
    .sort((a, b) => a.sort - b.sort)
    .map(({ item }) => item);
}

export const formatScoringText = (text: string) => {
  if (text === "content") {
    return "Content";
  }
  if (text === "oralFluency") {
    return "Oral Fluency";
  }
  if (text === "pronunciation") {
    return "Pronunciation";
  }
  if (text === "vocabulary") {
    return "Vocabulary";
  }
  if (text === "form") {
    return "Form";
  }
  if (text === "grammar") {
    return "Grammar";
  }
  if (text === "developmentStructureCoherence") {
    return "Development Structure Coherence";
  }
  if (text === "generalLinguisticRange") {
    return "General Linguistic Range";
  }
  if (text === "spelling") {
    return "Spelling";
  }
  if (text === "vocabularyRange") {
    return "Vocabulary Range";
  }
  if (text === "reading") {
    return "Reading";
  }
  if (text === "listening") {
    return "Listening";
  }
  if (text === "summary") {
    return "Summary";
  }
};

const punctuationOnlyRegex = /^[.,!?;:"'()\[\]{}\-–—]+$/;

const normalizeErrorItem = (error: any, fallbackType: string) => ({
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

const collectNormalizedErrors = (errorAnalysis: any) => {
  const allErrors = [
    // Writing question errors
    ...(errorAnalysis?.grammarErrors || []).map((error: any) =>
      normalizeErrorItem(error, "grammar"),
    ),
    ...(errorAnalysis?.spellingErrors || []).map((error: any) =>
      normalizeErrorItem(error, "spelling"),
    ),
    ...(errorAnalysis?.vocabularyIssues || []).map((error: any) =>
      normalizeErrorItem(error, "vocabulary"),
    ),
    // Speaking question errors
    ...(errorAnalysis?.pronunciationErrors || []).map((error: any) =>
      normalizeErrorItem(error, "pronunciation"),
    ),
    ...(errorAnalysis?.fluencyErrors || []).map((error: any) =>
      normalizeErrorItem(error, "fluency"),
    ),
    ...(errorAnalysis?.contentErrors || []).map((error: any) =>
      normalizeErrorItem(error, "content"),
    ),
  ];

  return allErrors.filter((error: any) => {
    const text = typeof error.text === "string" ? error.text.trim() : "";
    if (!text) return false;
    if (punctuationOnlyRegex.test(text)) return false;
    return true;
  });
};

const renderHighlightedTextUsingPositions = (
  text: string,
  positionedErrors: any[],
  onPressError: any,
) => {
  const wordSpans: Array<{ start: number; end: number }> = [];
  const wordRegex = /\S+/g;
  let match: RegExpExecArray | null;
  while ((match = wordRegex.exec(text)) !== null) {
    wordSpans.push({ start: match.index, end: match.index + match[0].length });
  }

  const errorPositions: Array<{ start: number; end: number; error: any }> = [];

  positionedErrors.forEach((error: any) => {
    const startWordIdx = error.position.start;
    const endWordIdxExclusive = error.position.end;
    if (
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

  // Sort and de-overlap (keep first range when overlaps occur).
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
            : ep.error.type === "grammar"
              ? "bg-red-200 dark:bg-red-800 text-red-800 dark:text-red-200 border border-red-300 dark:border-red-600"
              : ep.error.type === "pronunciation"
                ? "bg-orange-200 dark:bg-orange-800 text-orange-800 dark:text-orange-200 border border-orange-300 dark:border-orange-600"
                : ep.error.type === "fluency"
                  ? "bg-yellow-200 dark:bg-yellow-800 text-yellow-800 dark:text-yellow-200 border border-yellow-300 dark:border-yellow-600"
                  : ep.error.type === "content"
                    ? "bg-pink-200 dark:bg-pink-800 text-pink-800 dark:text-pink-200 border border-pink-300 dark:border-pink-600"
                    : "bg-gray-200 dark:bg-gray-800 text-gray-800 dark:text-gray-200 border border-gray-300 dark:border-gray-600";

    result.push(
      <span
        key={`error-${ep.start}-${ep.end}`}
        className={`${colorClass} px-1 py-0.5 rounded cursor-pointer hover:shadow-md transition-all duration-200 font-medium`}
        onClick={() => onPressError(ep.error)}
        title={`Click to see ${ep.error.type} error details`}
      >
        {errorText}
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

// Function to render text with error highlighting
// Handles omitted words, inserted words, and other corrections
export const renderHighlightedText = (
  text: string,
  errorAnalysis: any,
  onPressError: any,
) => {
  if (!text || !errorAnalysis) return <span>{text}</span>;

  const validErrors = collectNormalizedErrors(errorAnalysis);

  // Prefer backend-provided word positions when available (fixes cases where the
  // same word appears multiple times, e.g. highlighting every "or" incorrectly).
  const positionedErrors = validErrors.filter(
    (error: any) =>
      typeof error.position?.start === "number" &&
      typeof error.position?.end === "number" &&
      error.position.end > error.position.start,
  );

  if (positionedErrors.length > 0) {
    return renderHighlightedTextUsingPositions(
      text,
      positionedErrors,
      onPressError,
    );
  }

  // Convert text to lowercase for matching but keep original for display
  const lowerText = text.toLowerCase();
  const result: React.ReactNode[] = [];

  // Sort errors by position in text (longest first to avoid partial matches)
  const sortedErrors = [...validErrors].sort((a, b) => {
    const aPos = lowerText.indexOf(a.text.toLowerCase());
    const bPos = lowerText.indexOf(b.text.toLowerCase());
    return b.text.length - a.text.length || aPos - bPos;
  });

  // Create a map of error positions
  const errorPositions: Array<{
    start: number;
    end: number;
    error: any;
  }> = [];

  sortedErrors.forEach((error) => {
    const errorTextLower = error.text
      .toLowerCase()
      .replace(/[.,!?;:"'()]/g, "");
    let searchStart = 0;
    let pos = -1;

    // Find all occurrences of this error in the text
    while ((pos = lowerText.indexOf(errorTextLower, searchStart)) !== -1) {
      // Check if this position overlaps with existing errors
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

  // Build the result with highlighted errors
  let currentPos = 0;
  errorPositions.forEach((ep) => {
    // Add text before this error
    if (currentPos < ep.start) {
      result.push(
        <span key={`text-${currentPos}`}>
          {text.substring(currentPos, ep.start)}
        </span>,
      );
    }

    // Add highlighted error
    const errorText = text.substring(ep.start, ep.end);
    const colorClass =
      ep.error.type === "unnecessary_word"
        ? "bg-red-200 dark:bg-red-800 text-red-800 dark:text-red-200 border border-red-300 dark:border-red-600"
        : ep.error.type === "spelling" || ep.error.type === "spelling_error"
          ? "bg-blue-200 dark:bg-blue-800 text-blue-800 dark:text-blue-200 border border-blue-300 dark:border-blue-600"
          : ep.error.type === "missing_word" || ep.error.type === "vocabulary"
            ? "bg-purple-200 dark:bg-purple-800 text-purple-800 dark:text-purple-200 border border-purple-300 dark:border-purple-600"
            : ep.error.type === "grammar"
              ? "bg-red-200 dark:bg-red-800 text-red-800 dark:text-red-200 border border-red-300 dark:border-red-600"
              : ep.error.type === "pronunciation"
                ? "bg-orange-200 dark:bg-orange-800 text-orange-800 dark:text-orange-200 border border-orange-300 dark:border-orange-600"
                : ep.error.type === "fluency"
                  ? "bg-yellow-200 dark:bg-yellow-800 text-yellow-800 dark:text-yellow-200 border border-yellow-300 dark:border-yellow-600"
                  : ep.error.type === "content"
                    ? "bg-pink-200 dark:bg-pink-800 text-pink-800 dark:text-pink-200 border border-pink-300 dark:border-pink-600"
                    : "bg-gray-200 dark:bg-gray-800 text-gray-800 dark:text-gray-200 border border-gray-300 dark:border-gray-600";

    result.push(
      <span
        key={`error-${ep.start}`}
        className={`${colorClass} px-1 py-0.5 rounded cursor-pointer hover:shadow-md transition-all duration-200 font-medium`}
        onClick={() => onPressError(ep.error)}
        title={`Click to see ${ep.error.type} error details`}
      >
        {errorText}
      </span>,
    );

    currentPos = ep.end;
  });

  // Add remaining text
  if (currentPos < text.length) {
    result.push(
      <span key={`text-${currentPos}`}>{text.substring(currentPos)}</span>,
    );
  }

  return <span>{result}</span>;
};

// Repeat Sentence uses very short transcripts where naive substring matching can
// easily highlight the wrong occurrence. This variant only highlights when the
// backend provides word-index positions, otherwise it renders plain text.
export const renderHighlightedTextRepeatSentence = (
  text: string,
  errorAnalysis: any,
  onPressError: any,
) => {
  if (!text || !errorAnalysis) return <span>{text}</span>;

  const validErrors = collectNormalizedErrors(errorAnalysis);
  const positionedErrors = validErrors.filter(
    (error: any) =>
      typeof error.position?.start === "number" &&
      typeof error.position?.end === "number" &&
      error.position.end > error.position.start,
  );

  if (positionedErrors.length === 0) {
    return <span>{text}</span>;
  }

  return renderHighlightedTextUsingPositions(
    text,
    positionedErrors,
    onPressError,
  );
};

// Function to render text with word-by-word analysis showing omitted words
// Used for ANSWER_SHORT_QUESTION where words are missing from the user's response
export const renderWordByWordAnalysis = (
  wordAnalysis: Array<{ word: string; status: string }>,
  errorAnalysis: any,
  onPressError: any,
) => {
  if (!wordAnalysis || wordAnalysis.length === 0)
    return <span>No words to analyze</span>;

  const result: React.ReactNode[] = [];

  wordAnalysis.forEach((wordData, index) => {
    const { word, status } = wordData;

    if (status === "correct") {
      // Correct word - no highlighting
      result.push(
        <span key={`word-${index}`}>
          {word}
          {index < wordAnalysis.length - 1 ? " " : ""}
        </span>,
      );
    } else if (status === "omitted") {
      // Omitted word - show in pink with strike-through
      const error = errorAnalysis?.contentErrors?.find(
        (e: any) => e.text === word,
      );
      result.push(
        <span
          key={`word-${index}`}
          className="bg-pink-200 dark:bg-pink-800 text-pink-800 dark:text-pink-200 border border-pink-300 dark:border-pink-600 px-1 py-0.5 rounded cursor-pointer hover:shadow-md transition-all duration-200 font-medium line-through"
          onClick={() => error && onPressError(error)}
          title={`Click to see details about missing word: ${word}`}
        >
          {word}
        </span>,
      );
      result.push(index < wordAnalysis.length - 1 ? " " : "");
    }
  });

  return <span>{result}</span>;
};

// Speaking (Read Aloud / Repeat Sentence etc.)
// Renders the backend-provided word-by-word alignment so omitted words can be
// shown *in the correct position* (relative to the reference text), without
// trying to "insert" them into the raw transcript string.
export const renderSpeakingWordAnalysisInline = (
  wordAnalysis: Array<{ word: string; status: string }>,
  onPressWord?: (
    wordData: { word: string; status: string },
    index: number,
  ) => void,
) => {
  if (!wordAnalysis || wordAnalysis.length === 0) return <span />;

  const result: React.ReactNode[] = [];

  const classForStatus = (statusRaw: string) => {
    const status = String(statusRaw || "").toLowerCase();
    if (status === "omitted") {
      return "bg-red-100 text-red-800 border border-red-200 dark:bg-red-900/20 dark:text-red-200 dark:border-red-800";
    }
    if (status === "mispronounced") {
      return "bg-orange-100 text-orange-800 border border-orange-200 dark:bg-orange-900/20 dark:text-orange-200 dark:border-orange-800";
    }
    if (status === "inserted") {
      return "bg-blue-100 text-blue-800 border border-blue-200 dark:bg-blue-900/20 dark:text-blue-200 dark:border-blue-800";
    }
    return "";
  };

  wordAnalysis.forEach((wordData, index) => {
    const word = String(wordData?.word || "").trim();
    const status = String(wordData?.status || "").toLowerCase();
    if (!word) return;
    if (punctuationOnlyRegex.test(word)) {
      result.push(
        <span key={`w-${index}`}>
          {word}
          {index < wordAnalysis.length - 1 ? " " : ""}
        </span>,
      );
      return;
    }
    const cls = classForStatus(status);

    const content = word;

    if (!cls) {
      result.push(
        <span key={`w-${index}`}>
          {content}
          {index < wordAnalysis.length - 1 ? " " : ""}
        </span>,
      );
      return;
    }

    result.push(
      <span
        key={`w-${index}`}
        className={`${cls} px-1 py-0.5 rounded font-semibold`}
        onClick={() => onPressWord?.(wordData, index)}
        title={
          status === "omitted"
            ? "Missing word"
            : status === "mispronounced"
              ? "Mispronounced"
              : status === "inserted"
                ? "Extra word"
                : undefined
        }
        style={onPressWord ? { cursor: "pointer" } : undefined}
      >
        {content}
      </span>,
    );

    result.push(index < wordAnalysis.length - 1 ? " " : "");
  });

  return <span>{result}</span>;
};

// Function to render text with error highlighting using WORD INDICES
// This version uses word-based positioning instead of character-based
export const renderHighlightedTextByWords = (
  text: string,
  errorAnalysis: any,
  onPressError: any,
) => {
  if (!text || !errorAnalysis) return <span>{text}</span>;

  // Split text into words (same method as backend)
  const words = text.split(/\s+/).filter((word: string) => word.length > 0);

  // Collect all errors
  const allErrors = [
    // Writing question errors
    ...(errorAnalysis.grammarErrors || []).map((error: any) =>
      normalizeErrorItem(error, "grammar"),
    ),
    ...(errorAnalysis.spellingErrors || []).map((error: any) =>
      normalizeErrorItem(error, "spelling"),
    ),
    ...(errorAnalysis.vocabularyIssues || []).map((error: any) =>
      normalizeErrorItem(error, "vocabulary"),
    ),
    // Speaking question errors
    ...(errorAnalysis.pronunciationErrors || []).map((error: any) =>
      normalizeErrorItem(error, "pronunciation"),
    ),
    ...(errorAnalysis.fluencyErrors || []).map((error: any) =>
      normalizeErrorItem(error, "fluency"),
    ),
    ...(errorAnalysis.contentErrors || []).map((error: any) =>
      normalizeErrorItem(error, "content"),
    ),
  ];

  // Filter and sort errors by word position
  const errorPositions: Array<{
    start: number;
    end: number;
    error: any;
  }> = [];

  allErrors.forEach((error) => {
    if (
      typeof error.position?.start === "number" &&
      typeof error.position?.end === "number"
    ) {
      errorPositions.push({
        start: error.position.start,
        end: error.position.end,
        error,
      });
    }
  });

  // Sort by word position
  errorPositions.sort((a, b) => a.start - b.start);

  // Get color class for error type
  const getColorClass = (errorType: string) => {
    switch (errorType) {
      case "unnecessary_word":
        return "bg-red-200 dark:bg-red-800 text-red-800 dark:text-red-200 border border-red-300 dark:border-red-600";
      case "spelling":
      case "spelling_error":
        return "bg-blue-200 dark:bg-blue-800 text-blue-800 dark:text-blue-200 border border-blue-300 dark:border-blue-600";
      case "missing_word":
      case "vocabulary":
        return "bg-purple-200 dark:bg-purple-800 text-purple-800 dark:text-purple-200 border border-purple-300 dark:border-purple-600";
      case "grammar":
        return "bg-red-200 dark:bg-red-800 text-red-800 dark:text-red-200 border border-red-300 dark:border-red-600";
      case "pronunciation":
        return "bg-orange-200 dark:bg-orange-800 text-orange-800 dark:text-orange-200 border border-orange-300 dark:border-orange-600";
      case "fluency":
        return "bg-yellow-200 dark:bg-yellow-800 text-yellow-800 dark:text-yellow-200 border border-yellow-300 dark:border-yellow-600";
      case "content":
        return "bg-pink-200 dark:bg-pink-800 text-pink-800 dark:text-pink-200 border border-pink-300 dark:border-pink-600";
      default:
        return "bg-gray-200 dark:bg-gray-800 text-gray-800 dark:text-gray-200 border border-gray-300 dark:border-gray-600";
    }
  };

  // Build result by iterating through words
  const result: React.ReactNode[] = [];
  let currentWordIdx = 0;

  errorPositions.forEach((ep) => {
    // Add words before this error
    while (currentWordIdx < ep.start) {
      result.push(
        <span key={`word-${currentWordIdx}`}>
          {words[currentWordIdx]}
          {currentWordIdx < words.length - 1 ? " " : ""}
        </span>,
      );
      currentWordIdx++;
    }

    // Add highlighted error words
    const errorWords = words.slice(ep.start, ep.end);
    const colorClass = getColorClass(ep.error.type);

    result.push(
      <span
        key={`error-${ep.start}-${ep.end}`}
        className={`${colorClass} px-1 py-0.5 rounded cursor-pointer hover:shadow-md transition-all duration-200 font-medium`}
        onClick={() => onPressError(ep.error)}
        title={`Click to see ${ep.error.type} error details`}
      >
        {errorWords.join(" ")}
      </span>,
    );

    // Add space after error if not at end
    if (ep.end < words.length) {
      result.push(" ");
    }

    currentWordIdx = ep.end;
  });

  // Add remaining words
  while (currentWordIdx < words.length) {
    result.push(
      <span key={`word-${currentWordIdx}`}>
        {words[currentWordIdx]}
        {currentWordIdx < words.length - 1 ? " " : ""}
      </span>,
    );
    currentWordIdx++;
  }

  return <span>{result}</span>;
};

export const playBeep = () => {
  const audioContext = new (
    window.AudioContext || (window as any).webkitAudioContext
  )();
  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();

  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);

  oscillator.frequency.value = 1000; // 1000 Hz beep
  oscillator.type = "sine";

  gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(
    0.01,
    audioContext.currentTime + 0.5,
  );

  oscillator.start(audioContext.currentTime);
  oscillator.stop(audioContext.currentTime + 0.5);
};
