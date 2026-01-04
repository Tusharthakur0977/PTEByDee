// Utility shuffle function
export function shuffleArray(array: any[]) {
  return array
    .map((item) => ({ item, sort: Math.random() }))
    .sort((a, b) => a.sort - b.sort)
    .map(({ item }) => item);
}

export const formatScoringText = (text: string) => {
  if (text === 'content') {
    return 'Content';
  }
  if (text === 'oralFluency') {
    return 'Oral Fluency';
  }
  if (text === 'pronunciation') {
    return 'Pronunciation';
  }
  if (text === 'vocabulary') {
    return 'Vocabulary';
  }
  if (text === 'form') {
    return 'Form';
  }
  if (text === 'grammar') {
    return 'Grammar';
  }
  if (text === 'developmentStructureCoherence') {
    return 'Development Structure Coherence';
  }
  if (text === 'generalLinguisticRange') {
    return 'General Linguistic Range';
  }
  if (text === 'spelling') {
    return 'Spelling';
  }
  if (text === 'vocabularyRange') {
    return 'Vocabulary Range';
  }
  if (text === 'reading') {
    return 'Reading';
  }
  if (text === 'listening') {
    return 'Listening';
  }
  if (text === 'summary') {
    return 'Summary';
  }
};

// Function to render text with error highlighting
export const renderHighlightedText = (
  text: string,
  errorAnalysis: any,
  onPressError: any
) => {
  if (!text || !errorAnalysis) return <span>{text}</span>;

  const allErrors = [
    // Writing question errors
    ...(errorAnalysis.grammarErrors || []).map((error: any) => ({
      ...error,
      type: error.type === 'unnecessary_word' ? 'unnecessary_word' : 'grammar',
    })),
    ...(errorAnalysis.spellingErrors || []).map((error: any) => ({
      ...error,
      type: error.type === 'spelling_error' ? 'spelling_error' : 'spelling',
    })),
    ...(errorAnalysis.vocabularyIssues || []).map((error: any) => ({
      ...error,
      type: error.type === 'missing_word' ? 'missing_word' : 'vocabulary',
    })),
    // Speaking question errors
    ...(errorAnalysis.pronunciationErrors || []).map((error: any) => ({
      ...error,
      type: 'pronunciation',
    })),
    ...(errorAnalysis.fluencyErrors || []).map((error: any) => ({
      ...error,
      type: 'fluency',
    })),
    ...(errorAnalysis.contentErrors || []).map((error: any) => ({
      ...error,
      type: 'content',
    })),
  ];

  // Convert text to lowercase for matching but keep original for display
  const lowerText = text.toLowerCase();
  const result: React.ReactNode[] = [];

  // Sort errors by position in text (longest first to avoid partial matches)
  const sortedErrors = [...allErrors].sort((a, b) => {
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
      .replace(/[.,!?;:"'()]/g, '');
    let searchStart = 0;
    let pos = -1;

    // Find all occurrences of this error in the text
    while ((pos = lowerText.indexOf(errorTextLower, searchStart)) !== -1) {
      // Check if this position overlaps with existing errors
      const overlaps = errorPositions.some(
        (ep) =>
          (pos >= ep.start && pos < ep.end) ||
          (pos + errorTextLower.length > ep.start && pos < ep.end)
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
        </span>
      );
    }

    // Add highlighted error
    const errorText = text.substring(ep.start, ep.end);
    const colorClass =
      ep.error.type === 'unnecessary_word'
        ? 'bg-red-200 dark:bg-red-800 text-red-800 dark:text-red-200 border border-red-300 dark:border-red-600'
        : ep.error.type === 'spelling' || ep.error.type === 'spelling_error'
        ? 'bg-blue-200 dark:bg-blue-800 text-blue-800 dark:text-blue-200 border border-blue-300 dark:border-blue-600'
        : ep.error.type === 'missing_word' || ep.error.type === 'vocabulary'
        ? 'bg-purple-200 dark:bg-purple-800 text-purple-800 dark:text-purple-200 border border-purple-300 dark:border-purple-600'
        : ep.error.type === 'grammar'
        ? 'bg-red-200 dark:bg-red-800 text-red-800 dark:text-red-200 border border-red-300 dark:border-red-600'
        : ep.error.type === 'pronunciation'
        ? 'bg-orange-200 dark:bg-orange-800 text-orange-800 dark:text-orange-200 border border-orange-300 dark:border-orange-600'
        : ep.error.type === 'fluency'
        ? 'bg-yellow-200 dark:bg-yellow-800 text-yellow-800 dark:text-yellow-200 border border-yellow-300 dark:border-yellow-600'
        : ep.error.type === 'content'
        ? 'bg-pink-200 dark:bg-pink-800 text-pink-800 dark:text-pink-200 border border-pink-300 dark:border-pink-600'
        : 'bg-gray-200 dark:bg-gray-800 text-gray-800 dark:text-gray-200 border border-gray-300 dark:border-gray-600';

    result.push(
      <span
        key={`error-${ep.start}`}
        className={`${colorClass} px-1 py-0.5 rounded cursor-pointer hover:shadow-md transition-all duration-200 font-medium`}
        onClick={() => onPressError(ep.error)}
        title={`Click to see ${ep.error.type} error details`}
      >
        {errorText}
      </span>
    );

    currentPos = ep.end;
  });

  // Add remaining text
  if (currentPos < text.length) {
    result.push(
      <span key={`text-${currentPos}`}>{text.substring(currentPos)}</span>
    );
  }

  return <span>{result}</span>;
};

// Function to render text with error highlighting using WORD INDICES
// This version uses word-based positioning instead of character-based
export const renderHighlightedTextByWords = (
  text: string,
  errorAnalysis: any,
  onPressError: any
) => {
  if (!text || !errorAnalysis) return <span>{text}</span>;

  // Split text into words (same method as backend)
  const words = text.split(/\s+/).filter((word: string) => word.length > 0);

  // Collect all errors
  const allErrors = [
    // Writing question errors
    ...(errorAnalysis.grammarErrors || []).map((error: any) => ({
      ...error,
      type: error.type === 'unnecessary_word' ? 'unnecessary_word' : 'grammar',
    })),
    ...(errorAnalysis.spellingErrors || []).map((error: any) => ({
      ...error,
      type: error.type === 'spelling_error' ? 'spelling_error' : 'spelling',
    })),
    ...(errorAnalysis.vocabularyIssues || []).map((error: any) => ({
      ...error,
      type: error.type === 'missing_word' ? 'missing_word' : 'vocabulary',
    })),
    // Speaking question errors
    ...(errorAnalysis.pronunciationErrors || []).map((error: any) => ({
      ...error,
      type: 'pronunciation',
    })),
    ...(errorAnalysis.fluencyErrors || []).map((error: any) => ({
      ...error,
      type: 'fluency',
    })),
    ...(errorAnalysis.contentErrors || []).map((error: any) => ({
      ...error,
      type: 'content',
    })),
  ];

  // Filter and sort errors by word position
  const errorPositions: Array<{
    start: number;
    end: number;
    error: any;
  }> = [];

  allErrors.forEach((error) => {
    if (
      typeof error.position?.start === 'number' &&
      typeof error.position?.end === 'number'
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
      case 'unnecessary_word':
        return 'bg-red-200 dark:bg-red-800 text-red-800 dark:text-red-200 border border-red-300 dark:border-red-600';
      case 'spelling':
      case 'spelling_error':
        return 'bg-blue-200 dark:bg-blue-800 text-blue-800 dark:text-blue-200 border border-blue-300 dark:border-blue-600';
      case 'missing_word':
      case 'vocabulary':
        return 'bg-purple-200 dark:bg-purple-800 text-purple-800 dark:text-purple-200 border border-purple-300 dark:border-purple-600';
      case 'grammar':
        return 'bg-red-200 dark:bg-red-800 text-red-800 dark:text-red-200 border border-red-300 dark:border-red-600';
      case 'pronunciation':
        return 'bg-orange-200 dark:bg-orange-800 text-orange-800 dark:text-orange-200 border border-orange-300 dark:border-orange-600';
      case 'fluency':
        return 'bg-yellow-200 dark:bg-yellow-800 text-yellow-800 dark:text-yellow-200 border border-yellow-300 dark:border-yellow-600';
      case 'content':
        return 'bg-pink-200 dark:bg-pink-800 text-pink-800 dark:text-pink-200 border border-pink-300 dark:border-pink-600';
      default:
        return 'bg-gray-200 dark:bg-gray-800 text-gray-800 dark:text-gray-200 border border-gray-300 dark:border-gray-600';
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
          {currentWordIdx < words.length - 1 ? ' ' : ''}
        </span>
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
        {errorWords.join(' ')}
      </span>
    );

    // Add space after error if not at end
    if (ep.end < words.length) {
      result.push(' ');
    }

    currentWordIdx = ep.end;
  });

  // Add remaining words
  while (currentWordIdx < words.length) {
    result.push(
      <span key={`word-${currentWordIdx}`}>
        {words[currentWordIdx]}
        {currentWordIdx < words.length - 1 ? ' ' : ''}
      </span>
    );
    currentWordIdx++;
  }

  return <span>{result}</span>;
};
