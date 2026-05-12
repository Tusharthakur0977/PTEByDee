import React from 'react';

export interface RepeatSentenceWordAnalysisItem {
  word: string;
  status: string;
}

export interface RepeatSentencePauseMarker {
  afterWord: string;
  beforeWord: string;
  afterWordIndex: number;
  beforeWordIndex: number;
  durationMs: number;
  durationSeconds: number;
  severity: 'hesitation' | 'pause' | 'long_pause';
}

const normalizeWord = (value: string) =>
  String(value || '')
    .toLowerCase()
    .replace(/^[^\w]+|[^\w]+$/g, '');

const getStatusClass = (statusRaw: string) => {
  const status = String(statusRaw || '').toLowerCase();
  if (status === 'omitted') {
    return 'bg-red-100 text-red-800 border border-red-200 dark:bg-red-900/20 dark:text-red-200 dark:border-red-800 line-through';
  }
  if (status === 'mispronounced') {
    return 'bg-orange-100 text-orange-800 border border-orange-200 dark:bg-orange-900/20 dark:text-orange-200 dark:border-orange-800';
  }
  if (status === 'inserted') {
    return 'bg-blue-100 text-blue-800 border border-blue-200 dark:bg-blue-900/20 dark:text-blue-200 dark:border-blue-800';
  }
  return '';
};

const getPauseGapClass = (severity: RepeatSentencePauseMarker['severity']) => {
  if (severity === 'long_pause') return 'border-yellow-600/80 bg-yellow-500/20';
  if (severity === 'pause') return 'border-amber-500/80 bg-amber-500/20';
  return 'border-yellow-500/80 bg-yellow-500/20';
};

const getPauseGapWidthClass = (severity: RepeatSentencePauseMarker['severity']) => {
  if (severity === 'long_pause') return 'w-14 sm:w-16';
  if (severity === 'pause') return 'w-10 sm:w-12';
  return 'w-8 sm:w-10';
};

const getPauseLabel = (severity: RepeatSentencePauseMarker['severity']) => {
  if (severity === 'long_pause') return 'Long pause';
  if (severity === 'pause') return 'Pause';
  return 'Hesitation';
};

function buildLcsOperations(
  originalWords: string[],
  spokenWords: string[],
): Array<
  | { type: 'matched'; originalIndex: number; spokenIndex: number }
  | { type: 'omitted'; originalIndex: number }
  | { type: 'inserted'; spokenIndex: number }
> {
  const originalLength = originalWords.length;
  const spokenLength = spokenWords.length;

  const dp: number[][] = Array.from({ length: originalLength + 1 }, () =>
    Array(spokenLength + 1).fill(0),
  );

  for (let i = originalLength - 1; i >= 0; i -= 1) {
    for (let j = spokenLength - 1; j >= 0; j -= 1) {
      if (normalizeWord(originalWords[i]) === normalizeWord(spokenWords[j])) {
        dp[i][j] = 1 + dp[i + 1][j + 1];
      } else {
        dp[i][j] = Math.max(dp[i + 1][j], dp[i][j + 1]);
      }
    }
  }

  const ops: Array<
    | { type: 'matched'; originalIndex: number; spokenIndex: number }
    | { type: 'omitted'; originalIndex: number }
    | { type: 'inserted'; spokenIndex: number }
  > = [];

  let i = 0;
  let j = 0;

  while (i < originalLength || j < spokenLength) {
    if (
      i < originalLength &&
      j < spokenLength &&
      normalizeWord(originalWords[i]) === normalizeWord(spokenWords[j])
    ) {
      ops.push({ type: 'matched', originalIndex: i, spokenIndex: j });
      i += 1;
      j += 1;
      continue;
    }

    if (i >= originalLength) {
      ops.push({ type: 'inserted', spokenIndex: j });
      j += 1;
      continue;
    }

    if (j >= spokenLength) {
      ops.push({ type: 'omitted', originalIndex: i });
      i += 1;
      continue;
    }

    if (dp[i + 1][j] >= dp[i][j + 1]) {
      ops.push({ type: 'omitted', originalIndex: i });
      i += 1;
    } else {
      ops.push({ type: 'inserted', spokenIndex: j });
      j += 1;
    }
  }

  return ops;
}

function renderPause(
  pause: RepeatSentencePauseMarker,
  keyPrefix: string,
): React.ReactNode {
  return React.createElement(
    'span',
    {
      key: `${keyPrefix}-pause`,
      className: `group relative mx-1 inline-flex align-baseline items-end border-b-2 border-dashed ${getPauseGapClass(
        pause.severity,
      )} ${getPauseGapWidthClass(pause.severity)}`,
      title: `${getPauseLabel(pause.severity)} - ${pause.durationSeconds.toFixed(2)}s`,
    },
    React.createElement(
      'span',
      {
        className:
          'pointer-events-none absolute -top-5 left-1/2 hidden -translate-x-1/2 whitespace-nowrap rounded-full border border-slate-200 bg-white px-2 py-0.5 text-[10px] font-semibold text-slate-600 shadow-sm group-hover:block dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200',
      },
      `${getPauseLabel(pause.severity)} ${pause.durationSeconds.toFixed(2)}s`,
    ),
  );
}

export function renderRepeatSentenceTranscriptAligned(params: {
  spokenText: string;
  originalText: string;
  wordAnalysis?: ReadonlyArray<RepeatSentenceWordAnalysisItem> | null;
  pauseMarkers?: ReadonlyArray<RepeatSentencePauseMarker> | null;
}): React.ReactNode {
  const spokenWords = String(params.spokenText || '')
    .split(/\s+/)
    .filter((word) => word.length > 0);
  const originalWords = String(params.originalText || '')
    .split(/\s+/)
    .filter((word) => word.length > 0);

  if (!spokenWords.length && !originalWords.length) return null;

  const pauseMap = new Map<number, RepeatSentencePauseMarker[]>();
  (Array.isArray(params.pauseMarkers) ? params.pauseMarkers : []).forEach((pause) => {
    const existing = pauseMap.get(pause.afterWordIndex) || [];
    existing.push(pause);
    pauseMap.set(pause.afterWordIndex, existing);
  });

  const referenceStatuses = (Array.isArray(params.wordAnalysis) ? params.wordAnalysis : [])
    .filter((word) => String(word?.status || '').toLowerCase() !== 'inserted')
    .map((word) => String(word?.status || 'correct').toLowerCase());

  const result: React.ReactNode[] = [];

  if (spokenWords.length > 0) {
    const analysisWords = Array.isArray(params.wordAnalysis) ? params.wordAnalysis : [];
    if (analysisWords.length > 0) {
      const spokenSequence = analysisWords.map((entry) => ({
        word: String(entry?.word || ''),
        status: String(entry?.status || 'correct').toLowerCase(),
      }));
      const originalSequence = originalWords.map((word) => normalizeWord(word));

      let spokenIndex = 0;
      let originalIndex = 0;

      const pushWord = (word: string, status: string, keyPrefix: string, pauseIndex?: number) => {
        const pauseList = pauseIndex !== undefined ? pauseMap.get(pauseIndex) || [] : [];
        const pause =
          pauseList.length > 0
            ? [...pauseList].sort((a, b) => b.durationMs - a.durationMs)[0]
            : null;

        result.push(
          React.createElement(
            'span',
            {
              key: keyPrefix,
              className: `whitespace-pre-wrap rounded-md px-1 py-0.5 ${getStatusClass(status)}`,
            },
            word,
          ),
        );

        if (pause) {
          result.push(renderPause(pause, keyPrefix));
        }
      };

      while (spokenIndex < spokenSequence.length || originalIndex < originalSequence.length) {
        const spoken = spokenSequence[spokenIndex];
        const original = originalWords[originalIndex];
        const originalNorm = originalSequence[originalIndex] || '';
        const spokenNorm = normalizeWord(spoken?.word || '');

        if (spoken && spoken.status === 'inserted') {
          pushWord(spoken.word, 'inserted', `inserted-${spokenIndex}`, spokenIndex);
          spokenIndex += 1;
          continue;
        }

        if (
          spoken &&
          original &&
          spokenNorm &&
          spokenNorm === originalNorm
        ) {
          const status =
            spoken.status === 'correct' || spoken.status === 'mispronounced'
              ? spoken.status
              : 'correct';
          pushWord(spoken.word || original, status, `spoken-${spokenIndex}`, spokenIndex);
          spokenIndex += 1;
          originalIndex += 1;
          continue;
        }

        if (originalIndex < originalWords.length) {
          pushWord(
            originalWords[originalIndex] || '',
            'omitted',
            `omitted-${originalIndex}`,
            spokenIndex > 0 ? spokenIndex - 1 : undefined,
          );
          originalIndex += 1;
          continue;
        }

        if (spoken) {
          pushWord(spoken.word, spoken.status, `tail-${spokenIndex}`, spokenIndex);
          spokenIndex += 1;
          continue;
        }

        break;
      }

      return React.createElement('span', null, result);
    }
  }

  const operations = buildLcsOperations(originalWords, spokenWords);
  let spokenRenderIndex = 0;
  operations.forEach((op, opIndex) => {
    if (op.type === 'matched') {
      const spokenWord = spokenWords[op.spokenIndex] || originalWords[op.originalIndex] || '';
      const status = referenceStatuses[op.originalIndex] || 'correct';
      const pauseList = pauseMap.get(spokenRenderIndex) || [];
      const pause =
        pauseList.length > 0
          ? [...pauseList].sort((a, b) => b.durationMs - a.durationMs)[0]
          : null;

      result.push(
        React.createElement(
          'span',
          {
            key: `matched-${opIndex}`,
            className: `whitespace-pre-wrap rounded-md px-1 py-0.5 ${getStatusClass(status)}`,
          },
          spokenWord,
        ),
      );

      if (pause) {
        result.push(renderPause(pause, `matched-${opIndex}`));
      }

      spokenRenderIndex += 1;
    } else if (op.type === 'inserted') {
      const spokenWord = spokenWords[op.spokenIndex] || '';
      const pauseList = pauseMap.get(spokenRenderIndex) || [];
      const pause =
        pauseList.length > 0
          ? [...pauseList].sort((a, b) => b.durationMs - a.durationMs)[0]
          : null;

      result.push(
        React.createElement(
          'span',
          {
            key: `inserted-${opIndex}`,
            className:
              'whitespace-pre-wrap rounded-md px-1 py-0.5 bg-blue-100 text-blue-800 border border-blue-200 dark:bg-blue-900/20 dark:text-blue-200 dark:border-blue-800',
          },
          spokenWord,
        ),
      );

      if (pause) {
        result.push(renderPause(pause, `inserted-${opIndex}`));
      }

      spokenRenderIndex += 1;
    } else {
      const originalWord = originalWords[op.originalIndex] || '';
      result.push(
        React.createElement(
          'span',
          {
            key: `omitted-${opIndex}`,
            className:
              'whitespace-pre-wrap rounded-md px-1 py-0.5 bg-red-100 text-red-800 border border-red-200 dark:bg-red-900/20 dark:text-red-200 dark:border-red-800 line-through',
          },
          originalWord,
        ),
      );
    }

    if (opIndex < operations.length - 1) {
      result.push(
        React.createElement(
          'span',
          { key: `space-${opIndex}`, className: 'whitespace-pre-wrap' },
          ' ',
        ),
      );
    }
  });

  return React.createElement('span', null, result);
}
