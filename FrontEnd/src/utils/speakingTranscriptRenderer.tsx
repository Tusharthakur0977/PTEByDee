import React from 'react';

export interface SpeechPauseMarker {
  afterWord: string;
  beforeWord: string;
  afterWordIndex: number;
  beforeWordIndex: number;
  durationMs: number;
  durationSeconds: number;
  severity: 'hesitation' | 'pause' | 'long_pause';
}

export interface SpeechTranscriptError {
  text?: string;
  type?: string;
  correction?: string;
  explanation?: string;
  position?: { start?: number; end?: number };
}

export interface RenderSpeechTranscriptParams {
  spokenText: string;
  pronunciationErrors?: ReadonlyArray<SpeechTranscriptError> | null;
  fluencyErrors?: ReadonlyArray<SpeechTranscriptError> | null;
  pauseMarkers?: ReadonlyArray<SpeechPauseMarker> | null;
}

export interface SpeechTranscriptRenderOptions {
  pauseSeconds?: number;
  longPauseSeconds?: number;
}

const normalizeTranscriptWord = (value: string) =>
  String(value || '')
    .toLowerCase()
    .replace(/^[^\w]+|[^\w]+$/g, '');

const formatPauseSeverity = (severity: SpeechPauseMarker['severity']) => {
  if (severity === 'long_pause') return 'Long pause';
  if (severity === 'pause') return 'Pause';
  return 'Hesitation';
};

const getPauseGapClass = (severity: SpeechPauseMarker['severity']) => {
  if (severity === 'long_pause') {
    return 'border-yellow-600/80 bg-yellow-500/20 dark:border-yellow-400/90 dark:bg-yellow-400/20';
  }
  if (severity === 'pause') {
    return 'border-amber-500/80 bg-amber-500/20 dark:border-amber-400/90 dark:bg-amber-400/20';
  }
  return 'border-yellow-500/80 bg-yellow-500/20 dark:border-yellow-400/90 dark:bg-yellow-400/20';
};

const getPauseGapWidthClass = (severity: SpeechPauseMarker['severity']) => {
  if (severity === 'long_pause') return 'w-14 sm:w-16';
  if (severity === 'pause') return 'w-10 sm:w-12';
  return 'w-8 sm:w-10';
};

const getTranscriptWordClass = (kind?: 'pronunciation' | 'fluency') => {
  if (kind === 'pronunciation') {
    return 'bg-orange-100 text-orange-800 border border-orange-200 dark:bg-orange-900/20 dark:text-orange-200 dark:border-orange-800';
  }
  if (kind === 'fluency') {
    return 'bg-yellow-100 text-yellow-800 border border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-200 dark:border-yellow-800';
  }
  return '';
};

const getPauseWordClass = (severity: SpeechPauseMarker['severity']) => {
  if (severity === 'long_pause') return 'text-yellow-800 dark:text-yellow-300';
  if (severity === 'pause') return 'text-amber-700 dark:text-amber-300';
  return 'text-yellow-700 dark:text-yellow-300';
};

export const renderSpeechTranscriptWithPauses = (params: {
  spokenText: string;
  pronunciationErrors?: ReadonlyArray<SpeechTranscriptError> | null;
  fluencyErrors?: ReadonlyArray<SpeechTranscriptError> | null;
  pauseMarkers?: ReadonlyArray<SpeechPauseMarker> | null;
  options?: SpeechTranscriptRenderOptions;
}): React.ReactNode => {
  const {
    spokenText,
    pronunciationErrors,
    fluencyErrors,
    pauseMarkers,
    options,
  } = params;

  const safePronunciationErrors: SpeechTranscriptError[] = Array.isArray(
    pronunciationErrors,
  )
    ? [...pronunciationErrors]
    : [];
  const safeFluencyErrors: SpeechTranscriptError[] = Array.isArray(fluencyErrors)
    ? [...fluencyErrors]
    : [];
  const safePauseMarkers: SpeechPauseMarker[] = Array.isArray(pauseMarkers)
    ? [...pauseMarkers]
    : [];

  const spokenWords = String(spokenText || '')
    .split(/\s+/)
    .filter((word) => word.length > 0);

  if (!spokenWords.length) return null;

  const pauseMap = new Map<number, SpeechPauseMarker[]>();
  const pauseWordSeverity = new Map<number, SpeechPauseMarker['severity']>();
  const severityRank: Record<SpeechPauseMarker['severity'], number> = {
    hesitation: 1,
    pause: 2,
    long_pause: 3,
  };

  safePauseMarkers.forEach((pause) => {
    const existing = pauseMap.get(pause.afterWordIndex) || [];
    existing.push(pause);
    pauseMap.set(pause.afterWordIndex, existing);

    const currentAfter = pauseWordSeverity.get(pause.afterWordIndex);
    const currentBefore = pauseWordSeverity.get(pause.beforeWordIndex);
    if (!currentAfter || severityRank[pause.severity] > severityRank[currentAfter]) {
      pauseWordSeverity.set(pause.afterWordIndex, pause.severity);
    }
    if (!currentBefore || severityRank[pause.severity] > severityRank[currentBefore]) {
      pauseWordSeverity.set(pause.beforeWordIndex, pause.severity);
    }
  });

  const statusMap = new Map<number, 'pronunciation' | 'fluency'>();
  const usedPronunciation = new Set<number>();
  const usedFluency = new Set<number>();

  const markErrors = (
    errors: SpeechTranscriptError[],
    kind: 'pronunciation' | 'fluency',
    usedSet: Set<number>,
  ) => {
    errors.forEach((error) => {
      const positionStart = error?.position?.start;
      const positionEnd = error?.position?.end;
      if (
        typeof positionStart === 'number' &&
        typeof positionEnd === 'number' &&
        Number.isInteger(positionStart) &&
        Number.isInteger(positionEnd) &&
        positionEnd > positionStart
      ) {
        const startIndex = Math.trunc(positionStart);
        const endIndex = Math.trunc(positionEnd);
        let canApply = true;
        for (let index = startIndex; index < endIndex; index += 1) {
          if (index < 0 || index >= spokenWords.length || usedSet.has(index)) {
            canApply = false;
            break;
          }
        }

        if (canApply) {
          for (let index = startIndex; index < endIndex; index += 1) {
            usedSet.add(index);
            if (kind === 'pronunciation' || !statusMap.has(index)) {
              statusMap.set(index, kind);
            }
          }
          return;
        }
      }

      const targetTokens = String(error?.text || '')
        .split(/\s+/)
        .map(normalizeTranscriptWord)
        .filter((token) => token.length > 0);

      if (!targetTokens.length) return;

      // Fluency notes often arrive as full-sentence descriptions from the model.
      // Those should not be painted inline, otherwise the transcript ends up
      // highlighting an entire clause instead of just the actual hesitation.
      const shouldInlineHighlight =
        kind === 'pronunciation' || targetTokens.length <= 4;

      if (!shouldInlineHighlight) return;

      let foundIndex = -1;
      for (let start = 0; start <= spokenWords.length - targetTokens.length; start += 1) {
        let matches = true;
        for (let offset = 0; offset < targetTokens.length; offset += 1) {
          const spokenIndex = start + offset;
          if (usedSet.has(spokenIndex)) {
            matches = false;
            break;
          }
          if (
            normalizeTranscriptWord(String(spokenWords[spokenIndex] || '')) !==
            targetTokens[offset]
          ) {
            matches = false;
            break;
          }
        }
        if (matches) {
          foundIndex = start;
          break;
        }
      }

      if (foundIndex >= 0) {
        targetTokens.forEach((_, offset) => {
          const spokenIndex = foundIndex + offset;
          usedSet.add(spokenIndex);
          if (kind === 'pronunciation' || !statusMap.has(spokenIndex)) {
            statusMap.set(spokenIndex, kind);
          }
        });
      }
    });
  };

  markErrors(safePronunciationErrors, 'pronunciation', usedPronunciation);
  markErrors(safeFluencyErrors, 'fluency', usedFluency);

  const result: React.ReactNode[] = [];
  spokenWords.forEach((word, index) => {
    const isPunctuationOnly = /^[\s.,!?;:'"()\-]+$/.test(word);
    const wordSeverity = pauseWordSeverity.get(index);
    const status = statusMap.get(index);

    result.push(
      <span
        key={`word-${index}`}
        className={`whitespace-pre-wrap ${
          !isPunctuationOnly
            ? `rounded-md px-1 py-0.5 ${getTranscriptWordClass(status)} ${
                wordSeverity ? `${getPauseWordClass(wordSeverity)} font-medium` : ''
              }`
            : ''
        }`}
      >
        {word}
      </span>,
    );

    const pauseList = pauseMap.get(index);
    if (pauseList && pauseList.length > 0) {
      const pause = [...pauseList].sort((a, b) => b.durationMs - a.durationMs)[0];
      if (pause.durationSeconds < (options?.pauseSeconds ?? 0)) {
        return;
      }
      result.push(
        <span
          key={`pause-${index}`}
          className={`group relative mx-1 inline-flex align-baseline items-end border-b-2 border-dashed ${getPauseGapClass(
            pause.severity,
          )} ${getPauseGapWidthClass(pause.severity)}`}
          title={`${formatPauseSeverity(pause.severity)} - ${pause.durationSeconds.toFixed(2)}s`}
        >
          <span className="sr-only">
            {formatPauseSeverity(pause.severity)} pause of{' '}
            {pause.durationSeconds.toFixed(2)} seconds
          </span>
          <span className="pointer-events-none absolute -top-5 left-1/2 hidden -translate-x-1/2 whitespace-nowrap rounded-full border border-slate-200 bg-white px-2 py-0.5 text-[10px] font-semibold text-slate-600 shadow-sm group-hover:block dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200">
            {formatPauseSeverity(pause.severity)} {pause.durationSeconds.toFixed(2)}s
          </span>
        </span>,
      );
    }

    if (index < spokenWords.length - 1) {
      result.push(
        <span key={`space-${index}`} className="whitespace-pre-wrap">
          {' '}
        </span>,
      );
    }
  });

  return <span>{result}</span>;
};
