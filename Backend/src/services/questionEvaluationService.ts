import { PteQuestionTypeName } from '@prisma/client';
import openai from '../config/openAi';
import { QuestionEvaluationResult } from '../types/evaluationResponse';

/**
 * Converts legacy evaluation results to standardized format
 */

interface Question {
  id: string;
  questionCode: string;
  textContent?: string | null;
  questionStatement?: string | null;
  audioUrl?: string | null;
  imageUrl?: string | null;
  options?: any;
  correctAnswers?: any;
  wordCountMin?: number | null;
  wordCountMax?: number | null;
  originalTextWithErrors?: string | null;
  incorrectWords?: any;
  questionType: {
    name: PteQuestionTypeName;
    pteSection: {
      name: string;
    };
  };
}

/**
 * Main function to evaluate question responses using OpenAI
 */
export async function evaluateQuestionResponse(
  question: Question,
  userResponse: any,
  timeTakenSeconds?: number,
): Promise<QuestionEvaluationResult> {
  const questionType = question.questionType.name;

  switch (questionType) {
    case PteQuestionTypeName.ANSWER_SHORT_QUESTION:
      return evaluateAnswerShortQuestion(
        question,
        userResponse,
        timeTakenSeconds,
      );

    case PteQuestionTypeName.READ_ALOUD:
      return evaluateReadAloud(question, userResponse, timeTakenSeconds);

    case PteQuestionTypeName.REPEAT_SENTENCE:
      return evaluateRepeatSentence(question, userResponse, timeTakenSeconds);

    case PteQuestionTypeName.DESCRIBE_IMAGE:
      return evaluateDescribeImage(question, userResponse, timeTakenSeconds);

    case PteQuestionTypeName.RESPOND_TO_A_SITUATION:
      return evaluateRespondToASituation(
        question,
        userResponse,
        timeTakenSeconds,
      );
    case PteQuestionTypeName.RE_TELL_LECTURE:
      return evaluateRetellLecture(question, userResponse, timeTakenSeconds);

    case PteQuestionTypeName.SUMMARIZE_GROUP_DISCUSSION:
      return evaluateSummarizeGroupDiscussion(
        question,
        userResponse,
        timeTakenSeconds,
      );

    case PteQuestionTypeName.SUMMARIZE_WRITTEN_TEXT:
      return evaluateSummarizeWrittenText(
        question,
        userResponse,
        timeTakenSeconds,
      );

    case PteQuestionTypeName.WRITE_ESSAY:
      return evaluateWriteEssay(question, userResponse, timeTakenSeconds);

    case PteQuestionTypeName.MULTIPLE_CHOICE_SINGLE_ANSWER_READING:
    case PteQuestionTypeName.MULTIPLE_CHOICE_SINGLE_ANSWER_LISTENING:
      return evaluateMultipleChoiceSingle(
        question,
        userResponse,
        timeTakenSeconds,
      );

    case PteQuestionTypeName.MULTIPLE_CHOICE_MULTIPLE_ANSWERS_READING:
    case PteQuestionTypeName.MULTIPLE_CHOICE_MULTIPLE_ANSWERS_LISTENING:
      return evaluateMultipleChoiceMultiple(
        question,
        userResponse,
        timeTakenSeconds,
      );

    case PteQuestionTypeName.RE_ORDER_PARAGRAPHS:
      return evaluateReorderParagraphs(
        question,
        userResponse,
        timeTakenSeconds,
      );

    case PteQuestionTypeName.READING_FILL_IN_THE_BLANKS:
    case PteQuestionTypeName.FILL_IN_THE_BLANKS_DRAG_AND_DROP:
      return evaluateFillInTheBlanks(question, userResponse, timeTakenSeconds);

    case PteQuestionTypeName.LISTENING_FILL_IN_THE_BLANKS:
      return evaluateListeningFillInTheBlanks(
        question,
        userResponse,
        timeTakenSeconds,
      );

    case PteQuestionTypeName.SUMMARIZE_SPOKEN_TEXT:
      return evaluateSummarizeSpokenText(
        question,
        userResponse,
        timeTakenSeconds,
      );

    case PteQuestionTypeName.HIGHLIGHT_CORRECT_SUMMARY:
      return evaluateHighlightCorrectSummary(
        question,
        userResponse,
        timeTakenSeconds,
      );

    case PteQuestionTypeName.SELECT_MISSING_WORD:
      return evaluateSelectMissingWord(
        question,
        userResponse,
        timeTakenSeconds,
      );

    case PteQuestionTypeName.HIGHLIGHT_INCORRECT_WORDS:
      return evaluateHighlightIncorrectWords(
        question,
        userResponse,
        timeTakenSeconds,
      );

    case PteQuestionTypeName.WRITE_FROM_DICTATION:
      return evaluateWriteFromDictation(
        question,
        userResponse,
        timeTakenSeconds,
      );

    default:
      throw new Error(`Unsupported question type: ${questionType}`);
  }
}

// SPEAKING QUESTION EVALUATION
/**
 * Corrects error positions for audio-based questions (Read Aloud, Repeat Sentence, etc.)
 * Handles pronunciationErrors, fluencyErrors, and contentErrors
 */
function correctAudioErrorPositions(errorAnalysis: any, userText: string): any {
  if (!errorAnalysis) return errorAnalysis;

  // Split the text into words (same method as backend)
  const words = userText.split(/\s+/).filter((word: string) => word.length > 0);

  // Normalize function - removes punctuation for comparison
  const normalize = (text: string): string =>
    text.toLowerCase().replace(/[.,!?;:\-()[\]{}""'']/g, '');

  // Omitted/missing words do not exist in the user's transcript. If we attach a
  // word index for an omitted item, the frontend will highlight the wrong word
  // in userText (especially when the same word appears multiple times).
  // Instead, we keep the error but strip its position so it is not highlighted.
  const isOmissionLikeContentError = (error: any): boolean => {
    const text = typeof error?.text === 'string' ? error.text : '';
    const correction =
      typeof error?.correction === 'string' ? error.correction : '';

    const normText = normalize(text);
    const normCorrection = normalize(correction);
    if (!normText || !normCorrection) return false;

    // Most omission objects coming from the model use identical text/correction.
    if (normText !== normCorrection) return false;

    // Extra signal when provided (not required).
    const explanation =
      typeof error?.explanation === 'string' ? error.explanation : '';
    if (!explanation) return true;
    return /\bomitted\b|\bmissing\b|\bleft out\b/i.test(explanation);
  };

  // Helper function to find the correct position of an error word using context
  const findWordPosition = (
    errorText: string,
    originalPosition?: { start: number; end: number },
    context?: { before?: string; after?: string },
  ): { start: number; end: number } | null => {
    const normalizedError = normalize(errorText);

    // Split error into words to handle multi-word errors
    const errorWords = errorText
      .split(/\s+/)
      .filter((w: string) => w.length > 0);
    const allOccurrences: Array<{
      start: number;
      end: number;
      contextScore: number;
    }> = [];

    if (errorWords.length === 1) {
      // Single word error - find all occurrences
      for (let i = 0; i < words.length; i++) {
        const normalizedWord = normalize(words[i]);
        if (normalizedWord === normalizedError) {
          let contextScore = 0;

          // Score based on context matching
          if (context) {
            // Check word before
            if (context.before && i > 0) {
              const wordBefore = normalize(words[i - 1]);
              const contextBefore = normalize(context.before);
              if (wordBefore === contextBefore) {
                contextScore += 50;
              }
            }

            // Check word after
            if (context.after && i < words.length - 1) {
              const wordAfter = normalize(words[i + 1]);
              const contextAfter = normalize(context.after);
              if (wordAfter === contextAfter) {
                contextScore += 50;
              }
            }
          }

          allOccurrences.push({
            start: i,
            end: i + 1,
            contextScore,
          });
        }
      }
    } else {
      // Multi-word error - find all sequences
      for (let i = 0; i <= words.length - errorWords.length; i++) {
        let match = true;
        for (let j = 0; j < errorWords.length; j++) {
          const normalizedWord = normalize(words[i + j]);
          const normalizedErrorWord = normalize(errorWords[j]);
          if (normalizedWord !== normalizedErrorWord) {
            match = false;
            break;
          }
        }

        if (match) {
          let contextScore = 0;

          // Score based on context matching
          if (context) {
            // Check word before
            if (context.before && i > 0) {
              const wordBefore = normalize(words[i - 1]);
              const contextBefore = normalize(context.before);
              if (wordBefore === contextBefore) {
                contextScore += 50;
              }
            }

            // Check word after
            if (context.after && i + errorWords.length < words.length) {
              const wordAfter = normalize(words[i + errorWords.length]);
              const contextAfter = normalize(context.after);
              if (wordAfter === contextAfter) {
                contextScore += 50;
              }
            }
          }

          allOccurrences.push({
            start: i,
            end: i + errorWords.length,
            contextScore,
          });
        }
      }
    }

    if (allOccurrences.length === 0) {
      return null;
    }

    // If only one occurrence, return it
    if (allOccurrences.length === 1) {
      return { start: allOccurrences[0].start, end: allOccurrences[0].end };
    }

    // Multiple occurrences - use intelligent selection strategy
    // Strategy 1: Context-based matching (highest priority)
    const contextMatches = allOccurrences.filter((occ) => occ.contextScore > 0);
    if (contextMatches.length > 0) {
      // Sort by context score (descending)
      contextMatches.sort((a, b) => b.contextScore - a.contextScore);
      const best = contextMatches[0];
      return { start: best.start, end: best.end };
    }

    // Strategy 2: Use original position as a weak hint
    if (originalPosition && originalPosition.start >= 0) {
      const targetIndex = originalPosition.start;

      // Find occurrence closest to target, but with a reasonable threshold
      let bestOccurrence = allOccurrences[0];
      let bestDistance = Math.abs(allOccurrences[0].start - targetIndex);

      for (const occurrence of allOccurrences) {
        const distance = Math.abs(occurrence.start - targetIndex);
        // Only update if significantly closer (tolerance: within 5 words)
        if (distance < bestDistance - 5) {
          bestDistance = distance;
          bestOccurrence = occurrence;
        }
      }

      return { start: bestOccurrence.start, end: bestOccurrence.end };
    }

    // Strategy 3: No context or position hint - prefer occurrences later in the text
    const last = allOccurrences[allOccurrences.length - 1];
    return { start: last.start, end: last.end };
  };

  // Function to correct positions in an error array
  const correctErrorArray = (errors: any[]): any[] => {
    return errors.map((error: any) => {
      if (isOmissionLikeContentError(error)) {
        return {
          ...error,
          // Prevent misleading highlight; UI can show omissions via word analysis.
          position: undefined,
        };
      }

      const correctedPosition = findWordPosition(
        error.text,
        error.position,
        error.context,
      );
      if (correctedPosition) {
        return {
          ...error,
          position: correctedPosition,
        };
      }
      return error;
    });
  };

  return {
    pronunciationErrors: correctErrorArray(
      errorAnalysis.pronunciationErrors || [],
    ),
    fluencyErrors: correctErrorArray(errorAnalysis.fluencyErrors || []),
    contentErrors: correctErrorArray(errorAnalysis.contentErrors || []),
  };
}

function normalizeSpokenToken(token: string): string {
  return token
    .toLowerCase()
    .replace(/[.,!?;:\-()[\]{}""'']/g, '')
    .trim();
}

function getTranscriptionWordsFromResponse(userResponse: any): Array<{
  word: string;
  start: number;
  end: number;
}> {
  const candidates =
    userResponse?.transcriptionMeta?.words ||
    userResponse?.transcriptionWords ||
    [];

  if (!Array.isArray(candidates)) return [];

  const normalizedWords = candidates
    .map((word: any) => ({
      word: String(word?.word || '').trim(),
      start: Number(word?.start),
      end: Number(word?.end),
    }))
    .filter(
      (word) =>
        word.word.length > 0 &&
        Number.isFinite(word.start) &&
        Number.isFinite(word.end) &&
        word.end >= word.start,
    );

  if (normalizedWords.length > 0) {
    return normalizedWords;
  }

  // Fallback: some transcriptions return only segment-level timestamps.
  // Build approximate per-word timing so pause detection can still work.
  const segments = Array.isArray(userResponse?.transcriptionMeta?.segments)
    ? userResponse.transcriptionMeta.segments
    : [];
  const approximatedWords: Array<{ word: string; start: number; end: number }> =
    [];

  segments.forEach((segment: any) => {
    const text = String(segment?.text || '').trim();
    const start = Number(segment?.start);
    const end = Number(segment?.end);
    if (
      !text ||
      !Number.isFinite(start) ||
      !Number.isFinite(end) ||
      end <= start
    ) {
      return;
    }

    const tokens = text
      .split(/\s+/)
      .filter((token: string) => token.length > 0);
    if (!tokens.length) return;

    const duration = end - start;
    const slice = duration / tokens.length;

    tokens.forEach((token: string, index: number) => {
      const tokenStart = start + slice * index;
      const tokenEnd =
        index === tokens.length - 1 ? end : start + slice * (index + 1);
      approximatedWords.push({
        word: token,
        start: tokenStart,
        end: tokenEnd,
      });
    });
  });

  return approximatedWords.filter(
    (word) =>
      word.word.length > 0 &&
      Number.isFinite(word.start) &&
      Number.isFinite(word.end) &&
      word.end >= word.start,
  );
}

function detectPauseMarkers(
  transcribedText: string,
  transcriptionWords: Array<{ word: string; start: number; end: number }>,
  options?: {
    pauseSeconds?: number;
    longPauseSeconds?: number;
  },
) {
  const PAUSE_SECONDS = options?.pauseSeconds ?? 1.3;
  const LONG_PAUSE_SECONDS = options?.longPauseSeconds ?? 1.8;

  const transcriptWords = transcribedText
    .split(/\s+/)
    .filter((word: string) => word.length > 0);
  const normalizedTranscript = transcriptWords.map(normalizeSpokenToken);

  const mappedWords: Array<{
    word: string;
    start: number;
    end: number;
    transcriptIndex: number;
  }> = [];

  let cursor = 0;
  transcriptionWords.forEach((timedWord) => {
    const normalizedTimedWord = normalizeSpokenToken(timedWord.word);
    if (!normalizedTimedWord) return;

    for (let idx = cursor; idx < normalizedTranscript.length; idx++) {
      if (normalizedTranscript[idx] === normalizedTimedWord) {
        mappedWords.push({
          ...timedWord,
          transcriptIndex: idx,
        });
        cursor = idx + 1;
        return;
      }
    }
  });

  const pauseMarkers: Array<{
    afterWord: string;
    beforeWord: string;
    afterWordIndex: number;
    beforeWordIndex: number;
    durationMs: number;
    durationSeconds: number;
    severity: 'pause' | 'long_pause';
  }> = [];

  const pauseErrors: any[] = [];
  let totalPausedMs = 0;
  let longestPauseMs = 0;

  for (let idx = 1; idx < mappedWords.length; idx++) {
    const previousWord = mappedWords[idx - 1];
    const currentWord = mappedWords[idx];
    const pauseSeconds = currentWord.start - previousWord.end;

    if (!Number.isFinite(pauseSeconds) || pauseSeconds < PAUSE_SECONDS) {
      continue;
    }

    const severity: 'pause' | 'long_pause' =
      pauseSeconds >= LONG_PAUSE_SECONDS ? 'long_pause' : 'pause';

    const durationMs = Math.round(pauseSeconds * 1000);
    totalPausedMs += durationMs;
    longestPauseMs = Math.max(longestPauseMs, durationMs);

    pauseMarkers.push({
      afterWord: previousWord.word,
      beforeWord: currentWord.word,
      afterWordIndex: previousWord.transcriptIndex,
      beforeWordIndex: currentWord.transcriptIndex,
      durationMs,
      durationSeconds: Number(pauseSeconds.toFixed(2)),
      severity,
    });

    pauseErrors.push({
      text: currentWord.word,
      type: 'fluency',
      position: {
        start: currentWord.transcriptIndex,
        end: currentWord.transcriptIndex + 1,
      },
      correction: '',
      explanation: `A ${pauseSeconds.toFixed(2)}s ${severity.replace('_', ' ')} before "${currentWord.word}" interrupted your fluency.`,
      context: {
        before: previousWord.word,
        after: mappedWords[idx + 1]?.word || '',
      },
      meta: {
        category: 'pause',
        severity,
        durationMs,
        durationSeconds: Number(pauseSeconds.toFixed(2)),
      },
    });
  }

  return {
    pauseErrors,
    speechFlow: {
      pauseMarkers,
      totalPauseCount: pauseMarkers.length,
      totalPausedMs,
      longestPauseMs,
      timingAvailable: transcriptionWords.length > 0,
      timedWordCount: transcriptionWords.length,
      mappedWordCount: mappedWords.length,
    },
  };
}

function mergePauseErrorsIntoErrorAnalysis(
  errorAnalysis: any,
  pauseErrors: any[],
) {
  const merged = {
    pronunciationErrors: [...(errorAnalysis?.pronunciationErrors || [])],
    fluencyErrors: [...(errorAnalysis?.fluencyErrors || [])],
    contentErrors: [...(errorAnalysis?.contentErrors || [])],
  };

  if (!pauseErrors.length) return merged;

  const existingFluencySignature = new Set(
    merged.fluencyErrors.map((error: any) => {
      const start =
        typeof error?.position?.start === 'number' ? error.position.start : -1;
      return `${String(error?.text || '').toLowerCase()}::${start}`;
    }),
  );

  pauseErrors.forEach((pauseError) => {
    const signature = `${String(pauseError?.text || '').toLowerCase()}::${
      pauseError?.position?.start
    }`;
    if (!existingFluencySignature.has(signature)) {
      merged.fluencyErrors.push(pauseError);
      existingFluencySignature.add(signature);
    }
  });

  return merged;
}

function mergeAdditionalFluencyErrors(
  errorAnalysis: any,
  additionalFluencyErrors: any[],
) {
  const merged = {
    pronunciationErrors: [...(errorAnalysis?.pronunciationErrors || [])],
    fluencyErrors: [...(errorAnalysis?.fluencyErrors || [])],
    contentErrors: [...(errorAnalysis?.contentErrors || [])],
  };

  if (!additionalFluencyErrors.length) return merged;

  const existingSignatures = new Set(
    merged.fluencyErrors.map((error: any) => {
      const start =
        typeof error?.position?.start === 'number' ? error.position.start : -1;
      return `${String(error?.text || '').toLowerCase()}::${start}`;
    }),
  );

  additionalFluencyErrors.forEach((error) => {
    const signature = `${String(error?.text || '').toLowerCase()}::${
      error?.position?.start
    }`;
    if (!existingSignatures.has(signature)) {
      merged.fluencyErrors.push(error);
      existingSignatures.add(signature);
    }
  });

  return merged;
}

function inferRepeatSentencePauseMarkersFromFluencyErrors(params: {
  transcribedText: string;
  fluencyErrors: any[];
}) {
  const { transcribedText, fluencyErrors } = params;
  const transcriptWords = String(transcribedText || '')
    .split(/\s+/)
    .filter((word) => word.length > 0);

  if (transcriptWords.length === 0 || !Array.isArray(fluencyErrors)) {
    return [];
  }

  const fillerPattern = /^(uh|um|er|ah|oh)$/i;
  const candidateStarts = Array.from(
    new Set(
      fluencyErrors
        .filter((error: any) => {
          const text = String(error?.text || '').trim();
          const explanation = String(error?.explanation || '').toLowerCase();
          return (
            fillerPattern.test(text) ||
            /filler|hesitation|pause|false start|repetition/.test(explanation)
          );
        })
        .map((error: any) => Number(error?.position?.start))
        .filter((start: number) => Number.isFinite(start) && start > 0),
    ),
  ).sort((a, b) => a - b);

  const markers: Array<{
    afterWord: string;
    beforeWord: string;
    afterWordIndex: number;
    beforeWordIndex: number;
    durationMs: number;
    durationSeconds: number;
    severity: 'hesitation';
  }> = [];

  candidateStarts.forEach((start) => {
    const beforeWordIndex = Math.min(start, transcriptWords.length - 1);
    const afterWordIndex = beforeWordIndex - 1;
    if (afterWordIndex < 0 || beforeWordIndex < 0) return;
    const beforeWord = transcriptWords[beforeWordIndex];
    const afterWord = transcriptWords[afterWordIndex];
    if (!beforeWord || !afterWord) return;

    markers.push({
      afterWord,
      beforeWord,
      afterWordIndex,
      beforeWordIndex,
      durationMs: 650,
      durationSeconds: 0.65,
      severity: 'hesitation',
    });
  });

  return markers;
}

function buildRepeatSentenceFluencyFeedback(params: {
  fluencyErrors: any[];
  pauseMarkers?: Array<{
    severity: 'hesitation' | 'pause' | 'long_pause';
    durationSeconds: number;
  }>;
}): string {
  const { fluencyErrors, pauseMarkers = [] } = params;
  const fillerErrors = fluencyErrors.filter((error) => {
    const text = String(error?.text || '').toLowerCase();
    const explanation = String(error?.explanation || '').toLowerCase();
    return (
      /um|uh|er|ah|oh/.test(text) ||
      /filler|hesitation|pause|false start|repetition/.test(explanation)
    );
  });

  const pauseCount = pauseMarkers.length;
  const hasBriefPause = pauseMarkers.some(
    (pause) => pause.severity === 'hesitation',
  );
  const hasLongerPause = pauseMarkers.some(
    (pause) => pause.severity === 'pause' || pause.severity === 'long_pause',
  );

  if (fillerErrors.length === 0 && pauseCount === 0) {
    return 'Speech was smooth and continuous, with no major fluency issues detected.';
  }

  const parts: string[] = [];
  if (fillerErrors.length > 0) {
    parts.push(
      `Speech included ${fillerErrors.length} fluency signal${
        fillerErrors.length > 1 ? 's' : ''
      } such as fillers or self-corrections.`,
    );
  }
  if (hasLongerPause) {
    parts.push('A noticeable pause briefly interrupted the flow.');
  } else if (hasBriefPause) {
    parts.push('A brief hesitation slightly affected rhythm.');
  } else if (pauseCount > 0) {
    parts.push('Minor pauses slightly affected rhythm.');
  }

  if (parts.length === 0) {
    return 'Speech was mostly smooth, with minor fluency variation.';
  }

  return `${parts.join(' ')} It did not significantly disrupt the overall flow.`;
}

async function inferFluencyFromTranscriptWithAI(params: {
  originalSentence: string;
  transcribedText: string;
  existingFluencyErrors?: any[];
}): Promise<any[]> {
  const {
    originalSentence,
    transcribedText,
    existingFluencyErrors = [],
  } = params;

  const trimmedTranscript = String(transcribedText || '').trim();
  if (!trimmedTranscript) return [];

  const prompt = `
You are evaluating PTE Repeat Sentence oral fluency from transcript text only.

Goal:
- Detect likely hesitations, fillers, repetitions, false starts, self-corrections, and pause-like breaks from textual evidence.
- If evidence is weak, return empty list.

Rules:
- Word index starts at 0 based on splitting Transcribed User Text by whitespace.
- Return only JSON with this exact shape:
{
  "fluencyErrors": [
    {
      "text": "word or short phrase at issue",
      "type": "fluency",
      "position": { "start": 0, "end": 1 },
      "correction": "",
      "explanation": "what hesitation/disfluency happened",
      "meta": {
        "category": "hesitation|pause|filler|repetition|false_start",
        "source": "ai_inferred",
        "estimated": true,
        "confidence": 0.0
      }
    }
  ]
}

Constraints:
- Do not invent many items. Max 4 errors.
- Confidence must be between 0 and 1.
- If transcript is fluent and no textual evidence exists, return {"fluencyErrors":[]}.

Original Sentence: "${originalSentence}"
Transcribed User Text: "${trimmedTranscript}"
Existing Fluency Errors (if any): ${JSON.stringify(existingFluencyErrors)}
`;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content:
            'You are a strict JSON generator for fluency error extraction.',
        },
        { role: 'user', content: prompt },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.1,
    });

    const parsed = JSON.parse(response.choices[0].message.content || '{}');
    const words = trimmedTranscript
      .split(/\s+/)
      .filter((word: string) => word.length > 0);
    const maxIndex = Math.max(words.length - 1, 0);

    const errors = Array.isArray(parsed?.fluencyErrors)
      ? parsed.fluencyErrors
      : [];

    return errors
      .map((error: any) => {
        const rawStart =
          typeof error?.position?.start === 'number'
            ? Math.floor(error.position.start)
            : -1;
        const rawEnd =
          typeof error?.position?.end === 'number'
            ? Math.floor(error.position.end)
            : rawStart + 1;

        if (rawStart < 0 || rawStart > maxIndex) return null;
        const clampedEnd = Math.max(
          rawStart + 1,
          Math.min(rawEnd, words.length),
        );
        if (clampedEnd <= rawStart) return null;

        const confidence =
          typeof error?.meta?.confidence === 'number'
            ? Math.max(0, Math.min(1, error.meta.confidence))
            : 0.6;

        return {
          text: String(error?.text || words[rawStart] || '').trim(),
          type: 'fluency',
          position: { start: rawStart, end: clampedEnd },
          correction: '',
          explanation: String(
            error?.explanation ||
              'Likely hesitation or pause affecting fluency.',
          ).trim(),
          meta: {
            category: String(error?.meta?.category || 'hesitation'),
            source: 'ai_inferred',
            estimated: true,
            confidence,
          },
        };
      })
      .filter((error: any) => error && error.text);
  } catch (error) {
    console.error('AI fluency inference failed:', error);
    return [];
  }
}

/**
 * Evaluate Read Aloud responses (audio-based)
 */
async function evaluateReadAloud(
  question: Question,
  userResponse: any,
  timeTakenSeconds?: number,
): Promise<QuestionEvaluationResult> {
  const transcribedText = userResponse.textResponse;
  const transcriptionWords = getTranscriptionWordsFromResponse(userResponse);
  const timingAnalysis =
    transcriptionWords.length > 0
      ? detectPauseMarkers(transcribedText, transcriptionWords)
      : {
          pauseErrors: [] as any[],
          speechFlow: {
            pauseMarkers: [] as Array<{
              afterWord: string;
              beforeWord: string;
              afterWordIndex: number;
              beforeWordIndex: number;
              durationMs: number;
              durationSeconds: number;
              severity: 'hesitation' | 'pause' | 'long_pause';
            }>,
            totalPauseCount: 0,
            totalPausedMs: 0,
            longestPauseMs: 0,
            timingAvailable: false,
            timedWordCount: 0,
            mappedWordCount: 0,
          },
        };

  const prompt = `
    **Your Role:** You are an expert AI evaluator for the PTE Academic test. Your task is to analyze a user's "Read Aloud" speaking performance with extreme precision.

    **Objective:** You will be given an original text and a transcription of a user's spoken response. Compare the transcription word-for-word to the original, score it based on official PTE criteria for Content, Pronunciation, and Oral Fluency, and provide detailed, actionable feedback.

    ---
    ### **Evaluation and Scoring Instructions**

      **1. Content Analysis:**
      * Compare the transcribedText to the originalText to perform a wordAnalysis.
      * For each word, assign a status: 'correct', 'mispronounced', 'omitted', or 'inserted'.
      * The **Content score** should primarily reflect how much of the original text was spoken correctly in the right order.
      * If the response contains nearly all of the original text and only adds a few extra words, keep the content score high.
      * Extra inserted words should be a minor penalty when the original sentence is otherwise mostly intact.
      * **Important**: Each replacement or omission counts as a stronger content error than an inserted word.
      * Do not over-penalize content just because the user added short fillers or a few extra words.
      * If the speaker reads the full sentence correctly but adds a small number of extra words, do not "cut" the content score sharply.
      * Content should drop mainly when original words are missing, substituted, or badly reordered.
      * Example: if the prompt is "The bus for London will be scheduled once a week" and the response is
        "The bus for London, uh, will be scheduled once a week", this should still score high on content.
      * Example: "If you have a chronic disease such as heart disease, diabetes, asthma, or back or joint pain..." plus
        a few extra inserted words should still remain in the top content band if the original wording is mostly preserved.
      * Maximum score: depends on the length of the question prompt
    
    **2. Pronunciation and Oral Fluency Scoring (0-5 scale):**
    * **Pronunciation:** Score based on the accuracy of the transcribed words.
        * 5: Perfect transcription with all words correct.
        * 4: One or two minor errors in transcription.
        * 3: Several errors that suggest pronunciation issues but text is mostly understandable.
        * 2: Many errors, making the text difficult to follow.
        * 1: The transcription is mostly incorrect, indicating very poor pronunciation.
    * **Oral Fluency:** Score based on filler words, hesitations, and natural flow.
        * 5: Smooth, natural flow with no fillers or hesitations.
        * 4: Mostly smooth with one minor hesitation.
        * 3: Noticeable hesitations or filler words that disrupt the flow.
        * 2: Uneven, slow, or fragmented speech.
        * 1: Very halting speech with many pauses or fillers.

    ---
    ### **Error Analysis Instructions**

    **CRITICAL:** You must provide detailed error analysis by identifying specific mistakes in the user's transcribed speech.

    **POSITION CALCULATION (MOST IMPORTANT):**
      - Word indexing starts from 0 (first word is position 0)
      - Words are counted by splitting on whitespace ONLY. Punctuation is NOT a separate word.
      - For SINGLE-WORD errors: {"start": <word_index>, "end": <word_index + 1>}
      - For MULTI-WORD errors (e.g., "old people"): {"start": <first_word_index>, "end": <last_word_index + 1>}
      - If incorrect word appears MULTIPLE TIMES, identify the SPECIFIC occurrence not give position of first occurence directly first check which occurence is wrong and give that in positions

      **For each error you find:**
      1. Identify the EXACT word or phrase that contains the error
      2. Count its position carefully using the indexing method above
      3. Include surrounding context: provide 1-2 words BEFORE and AFTER the error (if available)
      - Example: Error "is" with context: {"before": "people", "after": "not"}
      - This helps confirm the correct occurrence when words repeat
      4. Provide the correct replacement
      5. Give a clear explanation
      6. DOUBLE-CHECK: The position should point to the actual error location in the response

    **Error Types to Look For:**
    - **Pronunciation**: Mispronounced words, incorrect stress, unclear articulation
    - **Fluency**: Hesitations, filler words (um, uh, er), unnatural pauses
    - **Content**: Omitted words, inserted words, word substitutions

    **IMPORTANT:**
      - Only include errors that actually exist
      - For "text" field, provide ONLY the incorrect word/phrase, nothing else
      - Be very specific with the exact word that's wrong
      - When checking for grammatical mistakes, make sure that if a synonym is used but the grammar is correct, it should **not** be marked as an error.
      - **Connector Immunity:** Do NOT mark the usage of the connecting words **"but", "whereas", "as", "and", "so"** as grammar errors (e.g., run-on sentences). These connectors are required for the PTE single-sentence format. Treat clauses linked by these words as grammatically valid.
      - **Error Prioritization:** A single error MUST be categorized only ONCE. Use this strict priority:
        1. **Spelling:** If a word is misspelled (e.g., "goverment"), it MUST go into "spellingErrors" ONLY. Do not list it in grammar or vocabulary.
        2. **Grammar:** If spelling is correct, but the word or phrase breaks a sentence rule (e.g., "he go" instead of "he goes"), it MUST go into "grammarErrors" ONLY.
        3. **Vocabulary:** Only if spelling and grammar are correct, but the word choice is poor or inappropriate (e.g., using "big" instead of "significant"), it MUST go into "vocabularyIssues".
   

    ### **Required Output Format**
    Your final output **must** be a single JSON object.

    **Original Text**: "${question.textContent}"
    **Transcribed User Text**: "${transcribedText}"
    **Time Taken**: ${timeTakenSeconds || 'Not specified'} seconds

    Provide your evaluation as a JSON object with error analysis:
    {
      "content": {
        "score": <number_0_to_3>,
        "maxScore": 3,
        "wordAnalysis": []
      },
      "pronunciation": {
        "score": <number_0_to_5>,
        "maxScore": 5
      },
      "oralFluency": {
        "score": <number_0_to_5>,
        "maxScore": 5
      },
      "feedback": {
        "content": "Content feedback",
        "pronunciation": "Pronunciation feedback",
        "oralFluency": "Fluency feedback",
      },
      "errorAnalysis": {
        "pronunciationErrors": [
          {
            "text": "mispronounced word",
            "type": "pronunciation",
            "position": { "start": 0, "end": 1 },
            "correction": "correct pronunciation",
            "explanation": "explanation of pronunciation error"
          }
        ],
        "fluencyErrors": [
          {
            "text": "um",
            "type": "fluency",
            "position": { "start": 0, "end": 1 },
            "correction": "",
            "explanation": "filler word that disrupts fluency"
          }
        ],
        "contentErrors": [
          {
            "text": "omitted word",
            "type": "content",
            "position": { "start": 0, "end": 1 },
            "correction": "correct word from original",
            "explanation": "word was omitted from original text"
          }
        ]
      }
    }
  `;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content:
            'You are a helpful assistant designed to output JSON for PTE Academic evaluation.',
        },
        { role: 'user', content: prompt },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.2,
    });

    const evaluation = JSON.parse(response.choices[0].message.content || '{}');

    // Parse the actual OpenAI response format for Repeat Sentence
    // Handle the nested structure: evaluation.content.score, evaluation.pronunciation.score, etc.
    const contentScore = evaluation.content?.score || 0;
    const maxContentScore = evaluation.content?.maxScore || 3;
    const pronunciationScore = evaluation.pronunciation?.score || 0;
    const pronunciationMaxScore = evaluation.pronunciation?.maxScore || 5;
    const fluencyScore = evaluation.oralFluency?.score || 0;
    const fluencyMaxScore = evaluation.oralFluency?.maxScore || 5;
    const wordAnalysis = evaluation.content?.wordAnalysis || [];

    // Calculate overall score as sum of component scores (points)
    const overallScore = Math.round(
      contentScore + pronunciationScore + fluencyScore,
    );

    // Calculate max possible score
    const maxPossibleScore =
      maxContentScore + pronunciationMaxScore + fluencyMaxScore;

    // Calculate percentage for isCorrect check (65% threshold)
    const percentageScore = Math.round((overallScore / maxPossibleScore) * 100);

    return {
      score: { scored: overallScore, max: maxPossibleScore },
      isCorrect: percentageScore >= 65,
      feedback:
        evaluation.feedback?.summary ||
        evaluation.feedback?.content ||
        'Audio response evaluated successfully.',
      suggestions: evaluation.feedback?.suggestions || [
        'Practice reading aloud regularly',
        'Focus on clear pronunciation',
        'Maintain steady pace and rhythm',
      ],
      detailedAnalysis: {
        scores: {
          content: { score: contentScore, max: maxContentScore },
          pronunciation: {
            score: pronunciationScore,
            max: pronunciationMaxScore,
          },
          oralFluency: { score: fluencyScore, max: fluencyMaxScore },
        },
        feedback: {
          content: evaluation.feedback?.content || '',
          pronunciation: evaluation.feedback?.pronunciation || '',
          oralFluency: evaluation.feedback?.oralFluency || '',
        },
        timeTaken: timeTakenSeconds || 0,
        userText: transcribedText,
        correctAnswer: question.textContent || undefined,
        wordByWordAnalysis: wordAnalysis,
        errorAnalysis: correctAudioErrorPositions(
          evaluation.errorAnalysis,
          transcribedText,
        ),
        speechFlow: {
          ...timingAnalysis.speechFlow,
          aiInferredFluencyCount: Array.isArray(
            evaluation.errorAnalysis?.fluencyErrors,
          )
            ? evaluation.errorAnalysis.fluencyErrors.length
            : 0,
        },
      },
    };
  } catch (error) {
    console.error('OpenAI evaluation error for Read Aloud:', error);
    return {
      score: { scored: 0, max: 13 },
      isCorrect: false,
      feedback: 'Unable to evaluate response at this time. Please try again.',
      suggestions: [
        'Please try again later',
        'Contact support if the issue persists',
      ],
      detailedAnalysis: {
        scores: {
          content: { score: 0, max: 3 },
          pronunciation: { score: 0, max: 5 },
          oralFluency: { score: 0, max: 5 },
        },
        feedback: { summary: 'Unable to evaluate response at this time.' },
        timeTaken: timeTakenSeconds || 0,
        userText: transcribedText,
        correctAnswer: question.textContent || undefined,
        errorAnalysis: {
          pronunciationErrors: [],
          fluencyErrors: [],
          contentErrors: [],
        },
        speechFlow: {
          pauseMarkers: [],
          totalPauseCount: 0,
          totalPausedMs: 0,
          longestPauseMs: 0,
          timingAvailable: transcriptionWords.length > 0,
          timedWordCount: transcriptionWords.length,
          mappedWordCount: 0,
          aiInferredFluencyCount: 0,
        },
      },
    };
  }
}

/**
 * Evaluate Repeat Sentence responses (audio-based)
 */
async function evaluateRepeatSentence(
  question: Question,
  userResponse: any,
  timeTakenSeconds?: number,
): Promise<QuestionEvaluationResult> {
  const transcribedText = String(userResponse?.textResponse || '').trim();
  const originalSentence =
    question.textContent || question.correctAnswers?.[0] || '';
  const enableFluencyInsights = Boolean(
    userResponse?.evaluationOptions?.enableFluencyInsights,
  );
  const transcriptionWords = enableFluencyInsights
    ? getTranscriptionWordsFromResponse(userResponse)
    : [];
  const { pauseErrors, speechFlow } = enableFluencyInsights
    ? detectPauseMarkers(transcribedText, transcriptionWords)
    : {
        pauseErrors: [] as any[],
        speechFlow: undefined as
          | ReturnType<typeof detectPauseMarkers>['speechFlow']
          | undefined,
      };

  const prompt = `
  **Your Role:** You are an expert AI evaluator for the PTE Academic test. Your task is to analyze a user's "Repeat Sentence" speaking performance with extreme precision.

  **Objective:** You will be given an original sentence and a transcription of a user's spoken response. Compare the transcription word-for-word to the original, score it based on official PTE criteria for Content, Pronunciation, and Oral Fluency, and provide detailed, actionable feedback.

  ---
  ### **Evaluation and Scoring Instructions**

  **1. Content Analysis:**
  * Compare the transcribedText to the originalText to perform a wordAnalysis.
  * For each word, assign a status: 'correct', 'mispronounced', 'omitted', or 'inserted'.
  * **wordAnalysis order must follow the spoken response order.** Do not move all inserted words to the end of the array. Keep inserted words inline at the point they were spoken.
  * **Important**: Hesitations, mispronounced, filled or unfilled pauses, and leading or trailing material are **not the main driver** of content reduction.
  * **Content should primarily reflect coverage of the original sentence.** If the response contains most of the original words in the correct order and only adds extra words, keep the content score relatively high.
  * **Errors = replacements, omissions and insertions only**, but inserted words by themselves should cause only a minor content penalty when the original sentence is otherwise mostly intact.
  * Prioritize missing or substituted original words over extra inserted words when deciding the final content score.
    
  **Content Scoring (0-3 scale):**
  * **3 points** - The response contains nearly all of the original sentence in the correct order, and any extra words are minor.
  * **2 points** - The response contains most of the original sentence, but there are some missing or substituted words.
  * **1 point** - The response contains only a small portion of the original sentence or has many missing/substituted words.
  * **0 points** - Almost nothing from the prompt is in the response.

  **2. Pronunciation and Oral Fluency Scoring (0-5 scale):**
  * **Pronunciation:** 
      * 5: Speech is very clear. Most words are pronounced accurately, and sounds are easy to understand.
      * 4: Speech is generally clear, with a few minor pronunciation issues, but meaning is still easy to follow.
      * 3: Speech is understandable, but several words sound unclear or mispronounced.
      * 2: Speech has many unclear sounds, making it difficult to understand several words.
      * 1: Speech is mostly unclear, with poor sound formation and very low intelligibility.
  * **Oral Fluency:**
      * 5: Speech is smooth, natural, and continuous. Minor self-corrections or tiny slips are acceptable if they do not break the flow.
      * 4: Speech is mostly smooth, with slight hesitation, uneven rhythm, or minor pauses, but still easy to follow.
      * 3: Speech has noticeable pauses, fillers, or repeated corrections that interrupt the flow.
      * 2: Speech is slow, broken, or frequently interrupted by long pauses.
      * 1: Speech is very halting, unnatural, and difficult to follow.

  ---
  ### **Required Output Format**
  Your final output **must** be a single JSON object with the following structure:

  {
    "evaluation": {
      "content": {
        "score": number, 
        "maxScore": 3,
        "wordAnalysis": [
          { "word": string, "status": "correct" | "mispronounced" | "omitted" | "inserted" }
        ]
      },
      "pronunciation": {
        "score": number,
        "maxScore": 5
      },
      "oralFluency": {
        "score": number,
        "maxScore": 5
      }
    },
    "feedback": {
      "content": string,              // Specific feedback on content accuracy
      "pronunciation": string,        // Specific feedback on pronunciation
      "oralFluency": string,          // Specific feedback on fluency
      "suggestions": [string, ...]    // Actionable improvement tips
    },
    "errorAnalysis": {
      "pronunciationErrors": [
        {
          "text": "mispronounced word",
          "type": "pronunciation",
          "position": { "start": 0, "end": 1 },
          "correction": "correct pronunciation",
          "explanation": "explanation of pronunciation error"
        }
      ],
      "fluencyErrors": [
        {
          "text": "um",
          "type": "fluency",
          "position": { "start": 0, "end": 1 },
          "correction": "",
          "explanation": "filler word that disrupts fluency"
        }
      ],
      "contentErrors": [
        {
          "text": "wrong word",
          "type": "content",
          "position": { "start": 0, "end": 1 },
          "correction": "correct word from original",
          "explanation": "word substitution or omission error"
        }
      ]
    },
    "analysis": {
      "recognizedText": string
    }
  }

  ---
  **Original Sentence**: "${originalSentence}"
  **Transcribed User Text**: "${transcribedText}"
  **Time Taken**: ${timeTakenSeconds || 'Not specified'} seconds
`;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content:
            'You are a helpful assistant designed to output JSON for PTE Academic evaluation.',
        },
        { role: 'user', content: prompt },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.2,
    });

    const evaluation = JSON.parse(response.choices[0].message.content || '{}');

    // Parse the actual OpenAI response format
    // Handle the actual response structure from OpenAI
    const contentScore = evaluation.evaluation?.content?.score || 0;
    const maxContentScore = evaluation.evaluation?.content?.maxScore || 3;
    const pronunciationScore = evaluation.evaluation?.pronunciation?.score || 0;
    const fluencyScore = evaluation.evaluation?.oralFluency?.score || 0;
    const wordAnalysis = evaluation.evaluation?.content?.wordAnalysis || [];
    const baseErrorAnalysis = {
      pronunciationErrors: [
        ...(evaluation.errorAnalysis?.pronunciationErrors || []),
      ],
      fluencyErrors: [...(evaluation.errorAnalysis?.fluencyErrors || [])],
      contentErrors: [...(evaluation.errorAnalysis?.contentErrors || [])],
    };

    const timestampMergedErrorAnalysis = enableFluencyInsights
      ? mergePauseErrorsIntoErrorAnalysis(baseErrorAnalysis, pauseErrors)
      : baseErrorAnalysis;
    const aiInferredFluencyErrors = enableFluencyInsights
      ? await inferFluencyFromTranscriptWithAI({
          originalSentence,
          transcribedText,
          existingFluencyErrors: timestampMergedErrorAnalysis.fluencyErrors,
        })
      : [];
    const mergedErrorAnalysis = enableFluencyInsights
      ? mergeAdditionalFluencyErrors(
          timestampMergedErrorAnalysis,
          aiInferredFluencyErrors,
        )
      : timestampMergedErrorAnalysis;
    const inferredPauseMarkers =
      enableFluencyInsights && speechFlow?.pauseMarkers?.length === 0
        ? inferRepeatSentencePauseMarkersFromFluencyErrors({
            transcribedText,
            fluencyErrors: mergedErrorAnalysis.fluencyErrors,
          })
        : [];
    const effectiveSpeechFlow =
      enableFluencyInsights && speechFlow
        ? {
            ...speechFlow,
            pauseMarkers:
              speechFlow.pauseMarkers.length > 0
                ? speechFlow.pauseMarkers
                : inferredPauseMarkers,
            totalPauseCount:
              speechFlow.pauseMarkers.length > 0
                ? speechFlow.totalPauseCount
                : inferredPauseMarkers.length,
            totalPausedMs:
              speechFlow.pauseMarkers.length > 0
                ? speechFlow.totalPausedMs
                : inferredPauseMarkers.reduce(
                    (sum, marker) => sum + marker.durationMs,
                    0,
                  ),
            longestPauseMs:
              speechFlow.pauseMarkers.length > 0
                ? speechFlow.longestPauseMs
                : inferredPauseMarkers.reduce(
                    (longest, marker) => Math.max(longest, marker.durationMs),
                    0,
                  ),
          }
        : speechFlow;
    const repeatSentenceOralFluencyFeedback =
      buildRepeatSentenceFluencyFeedback({
        fluencyErrors: mergedErrorAnalysis.fluencyErrors,
        pauseMarkers: enableFluencyInsights
          ? effectiveSpeechFlow?.pauseMarkers || []
          : [],
      });

    // Calculate overall score as sum of component scores (points)
    const overallScore = Math.round(
      contentScore + pronunciationScore + fluencyScore,
    );

    // Calculate max possible score
    const maxPossibleScore = maxContentScore + 5 + 5;

    // Calculate percentage for isCorrect check (65% threshold)
    const percentageScore = Math.round((overallScore / maxPossibleScore) * 100);

    return {
      score: { scored: overallScore, max: maxPossibleScore },
      isCorrect: percentageScore >= 65,
      feedback: evaluation.feedback?.summary,
      suggestions: evaluation.feedback?.suggestions || [
        'Practice repeating sentences clearly',
        'Focus on accurate pronunciation',
        'Maintain natural speech rhythm',
      ],
      detailedAnalysis: {
        scores: {
          content: { score: contentScore, max: maxContentScore },
          pronunciation: { score: pronunciationScore, max: 5 },
          oralFluency: { score: fluencyScore, max: 5 },
        },
        feedback: {
          content: evaluation.feedback?.content || '',
          pronunciation: evaluation.feedback?.pronunciation || '',
          oralFluency:
            repeatSentenceOralFluencyFeedback ||
            evaluation.feedback?.oralFluency ||
            '',
        },
        timeTaken: timeTakenSeconds || 0,
        userText: transcribedText,
        correctAnswer: originalSentence || undefined,
        wordByWordAnalysis: wordAnalysis,
        ...(enableFluencyInsights && effectiveSpeechFlow
          ? {
              speechFlow: {
                ...effectiveSpeechFlow,
                aiInferredFluencyCount: aiInferredFluencyErrors.length,
              },
            }
          : {}),
        errorAnalysis: correctAudioErrorPositions(
          mergedErrorAnalysis,
          transcribedText,
        ),
      },
    };
  } catch (error) {
    console.error('OpenAI evaluation error for Repeat Sentence:', error);
    return {
      score: { scored: 0, max: 13 },
      isCorrect: false,
      feedback: 'Error occurred during evaluation.',
      suggestions: ['Please try again.', 'Ensure clear pronunciation.'],
      detailedAnalysis: {
        scores: {
          content: { score: 0, max: 3 },
          pronunciation: { score: 0, max: 5 },
          oralFluency: { score: 0, max: 5 },
        },
        feedback: { summary: 'Error occurred during evaluation.' },
        timeTaken: timeTakenSeconds || 0,
        userText: transcribedText,
        correctAnswer: originalSentence || undefined,
        wordByWordAnalysis: [],
        ...(enableFluencyInsights && speechFlow
          ? {
              speechFlow: {
                ...speechFlow,
                aiInferredFluencyCount: 0,
              },
            }
          : {}),
        errorAnalysis: {
          pronunciationErrors: [],
          fluencyErrors: enableFluencyInsights ? pauseErrors : [],
          contentErrors: [],
        },
      },
    };
  }
}

/**
 * Evaluate Describe Image responses (audio-based)
 */
async function evaluateDescribeImage(
  question: Question,
  userResponse: any,
  timeTakenSeconds?: number,
): Promise<QuestionEvaluationResult> {
  const transcribedText = userResponse.textResponse;
  const transcriptionWords = getTranscriptionWordsFromResponse(userResponse);

  // Parse the stored image analysis data
  let imageAnalysis = null;
  try {
    if (question.textContent) {
      imageAnalysis = JSON.parse(question.textContent);
    }
  } catch (error) {
    console.error('Error parsing image analysis data:', error);
  }

  const keyElements =
    imageAnalysis?.keyElements || question.correctAnswers || [];
  const imageType = imageAnalysis?.imageType || 'image';
  const mainTopic = imageAnalysis?.mainTopic || 'the image content';

  const prompt = `You are an official PTE Academic grader specialized in "Describe Image" tasks. Evaluate this response focusing strictly on **Fluency**, **Pronunciation**, and **Content Coverage**.

    **Image Analysis Reference:**
    - Image Type: ${imageType}
    - Main Topic: ${mainTopic}
    - Key Elements to Mention: ${keyElements.join(', ')}

    **User's Description:** "${transcribedText}"
    **Time Taken:** ${timeTakenSeconds || 'Not specified'} seconds

    **IMPORTANT GRADING RULES:**
      - **IGNORE GRAMMAR:** Do not evaluate grammar, sentence structure, prepositions, or tenses. This is a content, fluency, and pronunciation test only.
      - **CONTENT FLEXIBILITY (CRITICAL - MUST FOLLOW):** Accept partial information and equivalent descriptions. Be lenient. Examples:
        * User mentions ONE gender when BOTH exist? = STILL 6 PTS (partial valid)
        * User says "35%" when graph shows "40%"? = STILL 6 PTS (minor number variation ±5% acceptable)
        * User says "peaks at 35-44" when BOTH genders peak at different ages? = STILL 6 PTS (valid observation)
        * User mentions different keywords than reference? = STILL 6 PTS (equivalent meaning)
      - **NO FIXED ANSWERS:** Do NOT penalize for any variation in wording, detail level, or specific numbers (±5%).
      - **KEY RULE FOR 6 PTS:** If student clearly shows: (1) chart type identified, (2) topic identified, (3) at least one trend or number mentioned = AWARD 6 PTS. DO NOT lower to 5 pts.
      
    **Scoring Rubrics:**
      **1. Content (Score from 0 to 6):**
        - **6 pts:** Student identifies the chart/image type (e.g., "line graph", "bar chart") AND identifies the main topic/subject (e.g., "volunteer rates by age") AND mentions at least one key trend or specific number (e.g., "peaks at 35-44", "drops to 10%"). If all three elements are present, award 6 pts regardless of what is missing.
        - **5 pts:** Student identifies chart type AND topic but lacks clear trend/number information.
        - **4 pts:** Student identifies topic and type but provides very limited trend/number details.
        - **3 pts:** Student mentions topic with some basic elements.
        - **2 pts:** Student vaguely mentions only topic or type; unclear understanding.
        - **1 pt:** Barely relevant response.
        - **0 pts:** Irrelevant, non-English, or no meaningful response

      **2. Pronunciation (Score from 0 to 5):**
        * **5 pts:** Speech is mostly clear and understandable. Most words are pronounced correctly. Minor accent or occasional mispronunciations do not significantly affect intelligibility. Stress and intonation are generally appropriate.
        * **4 pts:** Speech is generally clear with some accent. Most key words pronounced correctly, but some sounds may be distorted or unclear. Minor word stress issues. At least 80% of speech is easily understood.
        * **3 pts:** Speech is understandable with noticeable accent. Some pronunciation errors but overall meaning is clear. May require listener to adjust. Around 70% intelligibility maintained.
        * **2 pts:** Speech has significant pronunciation issues. Foreign accent is strong but speech remains largely intelligible. Many words may be distorted but main ideas are still understandable. Around 60% intelligibility.
        * **1 pt:** Pronunciation is heavily affected by accent or many errors. Speech is still mostly intelligible but challenging for listeners. Around 50% intelligibility.
        * **0 pts:** Unintelligible or no meaningful speech produced.

      **3. Oral Fluency (Score from 0 to 5):**
        * **5 pts:** Speech flows smoothly and naturally. Good pacing and rhythm. Few or no hesitations. Words and phrases are spoken clearly in natural groupings.
        * **4 pts:** Speech is generally fluent with good flow. Some minor hesitations or pauses but overall natural pacing. Most utterances are smooth.
        * **3 pts:** Speech is reasonably fluent but may have some hesitations, pauses, or repetitions. Overall pace is acceptable though may slow down occasionally. Most of speech is continuous.
        * **2 pts:** Speech is somewhat choppy with noticeable hesitations, pauses, or repetitions. Pacing may be uneven but still mostly understandable. Some staccato rhythm but maintains basic coherence.
        * **1 pt:** Speech is jerky with frequent hesitations, pauses, or repetitions. Pacing is uneven and may be difficult to follow. Still conveys basic meaning.
        * **0 pts:** Severely disrupted speech, unintelligible patterns, or no meaningful speech produced.

    **Error Analysis Instructions:**
    MANDATORY: Analyze the user's transcribed text for errors. Return empty arrays if no errors exist in that category.

    Analyze for these error types:
    1. **Pronunciation Errors**: Words that sound mispronounced (e.g., "wuz" instead of "was")
    2. **Fluency Errors**: Filler words (um, uh, like, you know), hesitations, repetitions, false starts, or unnatural pauses
    3. **Content Errors**: ONLY mark as errors if: user provides factually wrong information that contradicts the image data, misunderstands the data, or contradicts themselves. DO NOT mark as errors when user provides partial/subset information, minor inaccuracies in specific numbers (±5%), or alternative descriptions of the same fact.

    CRITICAL REQUIREMENTS:
    - Return empty arrays if NO errors exist in that category
    - For each error found, provide: exact text, type, correction, and explanation
    - **CONTENT ERRORS POLICY**: Only flag major inaccuracies or misunderstandings, not missing information or minor variations. Examples of ACCEPTABLE variations:
        * Says "35%" instead of "40%" = NOT an error (minor variation)
        * Says "females peak at 35-44" instead of "both genders peak" = NOT an error (subset information)
        * Says "decline after peak" instead of "sharp decline after peak" = NOT an error (equivalent description)
    - **Do not** mark the correct use of conjunctions or connectors (e.g., 'and', 'but', 'whereas', 'as') as grammatical errors. These are essential for linking ideas.
    - **Error Prioritization:** A single error MUST be categorized only ONCE. Use this strict priority:
        1. **Pronunciation:** If a word is mispronounced, categorize here ONLY.
        2. **Fluency:** If it's a filler word or hesitation, categorize here ONLY.
        3. **Content:** ONLY for factually incorrect statements, not for partial information or minor variations.
        POSITION HANDLING (CRITICAL):
    - DO NOT attempt to calculate character index positions.
    - DO NOT return long phrases or full sentences as error.text.
    - error.text MUST be:
      - A short word or short phrase (1–5 words max)
      - Exactly as it appears in the user's transcribed text
    - If an error occurs multiple times (e.g., repetition),
      return ONE representative short phrase only.
    - The frontend will locate and highlight occurrences.

    **Required Output Format:**
    Respond with a single, minified JSON object in this exact format. Use camelCase for keys.
    {
      "scores": {
        "content": <number_0_to_6>,
        "pronunciation": <number_0_to_5>,
        "oralFluency": <number_0_to_5>
      },
      "feedback": {
        "content": "<Detailed feedback specifically on the content - acknowledge what they covered well, note any significant gaps if relevant>",
        "pronunciation": "<Detailed feedback specifically on pronunciation>",
        "oralFluency": "<Detailed feedback specifically on oral fluency>"
      },
      "suggestions": ["<Actionable suggestion 1>", "<Actionable suggestion 2>"],
      "errorAnalysis": {
        "pronunciationErrors": [
          {
            "text": "mispronounced word",
            "type": "pronunciation",
            "position": { "start": null, "end":null },
            "correction": "correct pronunciation",
            "explanation": "explanation of pronunciation error"
          }
        ],
        "fluencyErrors": [
          {
            "text": "um",
            "type": "fluency",
            "position": { "start": null, "end":null },
            "correction": "",
            "explanation": "filler word that disrupts fluency"
          }
        ],
        "grammarErrors": [],
        "contentErrors": [
          {
            "text": "factually incorrect statement",
            "type": "content",
            "position": { "start": null, "end":null },
            "correction": "accurate description",
            "explanation": "this directly contradicts or misrepresents the image data"
          }
        ]
      }
    }
  `;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content:
            'You are a helpful assistant designed to output JSON for PTE Academic evaluation.',
        },
        { role: 'user', content: prompt },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.2,
    });

    const evaluation = JSON.parse(response.choices[0].message.content || '{}');
    const timingAnalysis =
      transcriptionWords.length > 0
        ? detectPauseMarkers(transcribedText, transcriptionWords)
        : {
            pauseErrors: [] as any[],
            speechFlow: {
              pauseMarkers: [] as Array<{
                afterWord: string;
                beforeWord: string;
                afterWordIndex: number;
                beforeWordIndex: number;
                durationMs: number;
                durationSeconds: number;
                severity: 'hesitation' | 'pause' | 'long_pause';
              }>,
              totalPauseCount: 0,
              totalPausedMs: 0,
              longestPauseMs: 0,
              timingAvailable: false,
              timedWordCount: 0,
              mappedWordCount: 0,
            },
          };

    const mergedErrorAnalysis = mergePauseErrorsIntoErrorAnalysis(
      {
        pronunciationErrors:
          evaluation?.errorAnalysis?.pronunciationErrors || [],
        fluencyErrors: evaluation?.errorAnalysis?.fluencyErrors || [],
        grammarErrors: evaluation?.errorAnalysis?.grammarErrors || [],
        contentErrors: evaluation?.errorAnalysis?.contentErrors || [],
      },
      timingAnalysis.pauseErrors,
    );

    // Parse the OpenAI response format for Describe Image
    const contentScore = evaluation?.scores?.content || 0;
    const contentMaxScore = 6;
    const pronunciationScore = evaluation?.scores?.pronunciation || 0;
    const pronunciationMaxScore = 5;
    const oralFluencyScore = evaluation?.scores?.oralFluency || 0;
    const oralFluencyMaxScore = 5;

    // Calculate overall score as sum of component scores (points)
    const overallScore = contentScore + oralFluencyScore + pronunciationScore;

    // Calculate max possible score
    const maxPossibleScore =
      contentMaxScore + oralFluencyMaxScore + pronunciationMaxScore;

    // Calculate percentage for isCorrect check (65% threshold)
    const percentageScore = Math.round((overallScore / maxPossibleScore) * 100);

    // Get feedback from OpenAI response
    const feedbackData = evaluation.feedback || {};
    const feedbackText =
      feedbackData.summary || 'Image description response evaluated.';

    return {
      score: { scored: overallScore, max: maxPossibleScore },
      isCorrect: percentageScore >= 65,
      feedback: feedbackText,
      suggestions: evaluation.suggestions || [
        'Describe all key elements visible in the image',
        'Use specific vocabulary related to the image content',
        'Organize your description logically (overview → details → conclusion)',
        'Speak clearly and maintain natural pace',
        'Include relationships between elements when relevant',
      ],
      detailedAnalysis: {
        scores: {
          content: { score: contentScore, max: contentMaxScore },
          oralFluency: { score: oralFluencyScore, max: oralFluencyMaxScore },
          pronunciation: {
            score: pronunciationScore,
            max: pronunciationMaxScore,
          },
        },
        feedback: {
          content: feedbackData.content || '',
          pronunciation: feedbackData.pronunciation || '',
          oralFluency: feedbackData.oralFluency || '',
        },
        timeTaken: timeTakenSeconds || 0,
        userText: transcribedText,
        errorAnalysis: mergedErrorAnalysis,
        speechFlow: {
          ...timingAnalysis.speechFlow,
          aiInferredFluencyCount: Array.isArray(
            evaluation?.errorAnalysis?.fluencyErrors,
          )
            ? evaluation.errorAnalysis.fluencyErrors.length
            : 0,
        },
      },
    };
  } catch (error) {
    console.error('OpenAI evaluation error for Describe Image:', error);
    return {
      score: { scored: 0, max: 16 },
      isCorrect: false,
      feedback: 'Error occurred during evaluation.',
      suggestions: [
        'Please try again.',
        'Focus on describing key visual elements.',
        'Ensure clear pronunciation and logical organization.',
      ],
      detailedAnalysis: {
        scores: {
          content: { score: 0, max: 6 },
          oralFluency: { score: 0, max: 5 },
          pronunciation: { score: 0, max: 5 },
        },
        feedback: { summary: 'Error occurred during evaluation.' },
        timeTaken: timeTakenSeconds || 0,
        userText: transcribedText,
        errorAnalysis: {
          pronunciationErrors: [],
          fluencyErrors: [],
          grammarErrors: [],
          contentErrors: [],
        },
        speechFlow: {
          pauseMarkers: [],
          totalPauseCount: 0,
          totalPausedMs: 0,
          longestPauseMs: 0,
          timingAvailable: transcriptionWords.length > 0,
          timedWordCount: transcriptionWords.length,
          mappedWordCount: transcriptionWords.length,
          aiInferredFluencyCount: 0,
        },
      },
    };
  }
}

/**
 * Evaluate Re-tell Lecture responses (audio-based)
 */
async function evaluateRetellLecture(
  question: Question,
  userResponse: any,
  timeTakenSeconds?: number,
): Promise<QuestionEvaluationResult> {
  const transcribedText = String(userResponse?.textResponse || '').trim();
  const originalLecture = question.textContent || '';
  const transcriptionWords = getTranscriptionWordsFromResponse(userResponse);
  const timingAnalysis = detectPauseMarkers(
    transcribedText,
    transcriptionWords,
  );

  const prompt = `
**Your Role:** You are an expert AI evaluator for the PTE Academic test.
**Objective:** Evaluate the user's "Re-tell Lecture" response.

---
### **Evaluation and Scoring Instructions**
  **1. Content Analysis (0-6 scale):**
    **STEP 1: THE "LIST vs. SPEECH" GATEKEEPER (Mandatory Check)**
      Before awarding points, analyze the **grammatical structure** of the transcribed text.
      - The Check:** Look for **Finite Verbs** (e.g., "is," "means," "helps," "reduces") and **Connectors** (e.g., "because," "and," "so," "which").
      - The Trap:** Does the response consist of a string of Nouns/Adjectives separated by pauses or periods? (e.g., *"Sustainable farming. Environmental. Chemicals. Water."*)
      - THE RULING:**
          - IF "YES" (It is a list):** You **MUST** assign a score of **2** (or 1). **DO NOT** give a 3, 4, 5, or 6, even if the user lists every single keyword from the lecture. A list is not a summary.
          - IF "NO" (It is connected speech):** Proceed to Step 2.

    **STEP 2: STANDARD SCORING (Only for Connected Speech)**
      - 6 pts (Perfect):** Seamless summary covering **5-6+ Key Points** in complex sentences. Flawless logic.
      - 5 pts (Excellent):** Covers **4-5 Key Points** using natural connectors and complete sentences.
          * *Constraint:* If the user sounds robotic or lacks flow, cap at 4.
      - 4 pts (Good):** Covers **3-4 Key Points** in simple but complete sentences (e.g., "It reduces chemicals and saves water").
      - 3 pts (Fragmented):** Covers 2-3 Key Points in sentences, OR uses long exact phrases (3-4 words) without connectors.
      - 2 pts (The Keyword List):** **(Applicable if Step 1 triggered)**. The response contains valid keywords but lacks sentence structure (verbs/connectors).
          * *Example:* "Water. Carbon. Food security." -> **Score 2**.
      - 1 pt (Poor):** Highly minimal (1-2 words total) or irrelevant.
      - 0 pts:** No meaningful response.

    **Important Content Guidelines:**
      - Logic Check: Verify the student hasn't stated the opposite of the lecture.
      - Distinction:
          - Input:* "Farming. Water. Chemicals." -> **Score 2** (List).
          - Input:* "Farming uses water and chemicals." -> **Score 4** (Sentence).

  **2. Pronunciation (0-5 scale):** Score based on the accuracy of the transcribed words.
    - 5 pts:** Clear/accurate; minor isolated errors only.
    - 4 pts:** Several errors; text mostly understandable.
    - 3 pts:** Many errors; text difficult to follow.
    - 2 pts:** Mostly incorrect.
    - 1 pt:** Almost entirely incorrect.

  **3. Oral Fluency (0-5 scale):** Score based on filler words, hesitations, and natural flow.
    - 5 pts:** Smooth, flowing; natural phrasing.
    - 4 pts:** Noticeable hesitations/fillers.
    - 3 pts:** Uneven, slow, or fragmented speech.
    - 2 pts:** Very halting; many pauses/fillers.
    - 1 pt:** Extremely halting.

---
### **Error Analysis Instructions**

  **CRITICAL:** Provide detailed error analysis identifying specific mistakes.

  **For each error:**
  1.  Identify the EXACT word/phrase (no surrounding text).
  2.  Provide the correct replacement.
  3.  Explain the issue (pronunciation, fluency, or content).
  4. Set position to {"start": 0, "end": 1} (we'll match by word content, not position)

  **Error Types:**
  * **Pronunciation:** Mispronounced/unclear words.
  * **Fluency:** Hesitations, fillers (um, uh), unnatural pauses.
  * **Content:** Omitted key points, incorrect info, logic errors.

  **IMPORTANT:**
  * **Connector Immunity:** Do NOT mark **"but", "whereas", "as", "and", "so"** as grammar errors.
  * **Synonym Immunity:** If a student uses a valid synonym, do **NOT** mark it as a content error.
  * **Error Priority:** 1. Spelling -> 2. Grammar -> 3. Vocabulary.

---
### **Required Output Format**
  Your final output **must** be a single JSON object:

  **Original Lecture**: "${originalLecture}"
  **User's Transcribed Response**: "${transcribedText}"
  **Time Taken**: ${timeTakenSeconds || 'Not specified'} seconds

{
  "Content": <number_0_to_6>,
  "Oral Fluency": <number_0_to_5>,
  "Pronunciation": <number_0_to_5>,
  "feedback": {
    "content": "Specific feedback. *If score is 2 due to keyword listing, explicitly state: 'You provided a list of keywords. You must speak in full sentences to score higher.'*",
    "oralFluency": "Feedback on flow/hesitations.",
    "pronunciation": "Feedback on clarity."
  },
  "suggestions": ["Actionable tip 1", "Actionable tip 2", "Actionable tip 3"],
  "errorAnalysis": {
    "pronunciationErrors": [ { "text": "...", "type": "pronunciation", "position": {...}, "correction": "...", "explanation": "..." } ],
    "fluencyErrors": [ { "text": "...", "type": "fluency", "position": {...}, "correction": "", "explanation": "..." } ],
    "contentErrors": [ { "text": "...", "type": "content", "position": {...}, "correction": "...", "explanation": "..." } ]
  }
}
`;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content:
            'You are a helpful assistant designed to output JSON for PTE Academic evaluation.',
        },
        { role: 'user', content: prompt },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.2,
    });

    const evaluation = JSON.parse(response.choices[0].message.content || '{}');

    const mergedErrorAnalysis = mergePauseErrorsIntoErrorAnalysis(
      correctAudioErrorPositions(
        evaluation.errorAnalysis || {
          pronunciationErrors: [],
          fluencyErrors: [],
          contentErrors: [],
        },
        transcribedText,
      ),
      timingAnalysis.pauseErrors,
    );

    // Parse the OpenAI response format for Re-tell Lecture
    // Handle the actual response structure from OpenAI
    const contentScore = evaluation.Content || 0;
    const contentMaxScore = 6;
    const oralFluencyScore = evaluation['Oral Fluency'] || 0;
    const oralFluencyMaxScore = 5;
    const pronunciationScore = evaluation.Pronunciation || 0;
    const pronunciationMaxScore = 5;

    // Calculate overall score as sum of component scores (points)
    const overallScore = contentScore + oralFluencyScore + pronunciationScore;

    // Calculate max possible score
    const maxPossibleScore =
      contentMaxScore + oralFluencyMaxScore + pronunciationMaxScore;

    // Calculate percentage for isCorrect check (65% threshold)
    const percentageScore = Math.round((overallScore / maxPossibleScore) * 100);

    return {
      score: { scored: overallScore, max: maxPossibleScore },
      isCorrect: percentageScore >= 65,
      feedback:
        evaluation.feedback?.summary ||
        evaluation.feedback?.content ||
        'Re-tell Lecture response evaluated successfully.',
      suggestions: evaluation.feedback?.suggestions || [
        'Focus on main ideas and key points',
        'Organize your response logically',
        'Use clear pronunciation and natural pace',
      ],
      detailedAnalysis: {
        scores: {
          content: { score: contentScore, max: contentMaxScore },
          oralFluency: { score: oralFluencyScore, max: oralFluencyMaxScore },
          pronunciation: {
            score: pronunciationScore,
            max: pronunciationMaxScore,
          },
        },
        feedback: {
          content:
            evaluation.feedback?.content ||
            'Focus on main ideas and key points',
          oralFluency:
            evaluation.feedback?.oralFluency ||
            buildRepeatSentenceFluencyFeedback({
              fluencyErrors: mergedErrorAnalysis.fluencyErrors,
              pauseMarkers: timingAnalysis.speechFlow.pauseMarkers,
            }),
          pronunciation:
            evaluation.feedback?.pronunciation ||
            'Work on clear articulation and stress patterns',
        },
        timeTaken: timeTakenSeconds || 0,
        userText: transcribedText,
        errorAnalysis: mergedErrorAnalysis,
        speechFlow: {
          ...timingAnalysis.speechFlow,
          aiInferredFluencyCount: Array.isArray(
            mergedErrorAnalysis.fluencyErrors,
          )
            ? mergedErrorAnalysis.fluencyErrors.length
            : 0,
        },
      },
    };
  } catch (error) {
    console.error('OpenAI evaluation error for Re-tell Lecture:', error);
    return {
      score: { scored: 0, max: 16 },
      isCorrect: false,
      feedback: 'Error occurred during evaluation.',
      suggestions: [
        'Please try again.',
        'Focus on capturing key points from the lecture.',
        'Ensure clear pronunciation and logical organization.',
      ],
      detailedAnalysis: {
        scores: {
          content: { score: 0, max: 6 },
          oralFluency: { score: 0, max: 5 },
          pronunciation: { score: 0, max: 5 },
        },
        feedback: { summary: 'Error occurred during evaluation.' },
        timeTaken: timeTakenSeconds || 0,
        userText: transcribedText,
        errorAnalysis: {
          pronunciationErrors: [],
          fluencyErrors: [],
          contentErrors: [],
        },
        speechFlow: {
          pauseMarkers: [],
          totalPauseCount: 0,
          totalPausedMs: 0,
          longestPauseMs: 0,
          timingAvailable: transcriptionWords.length > 0,
          timedWordCount: transcriptionWords.length,
          mappedWordCount: transcriptionWords.length,
          aiInferredFluencyCount: 0,
        },
      },
    };
  }
}

/**
 * Evaluate Summarize Group Discussion responses
 * Similar to Re-tell Lecture but evaluates a summary of a discussion
 */
async function evaluateSummarizeGroupDiscussion(
  question: Question,
  userResponse: any,
  timeTakenSeconds?: number,
): Promise<QuestionEvaluationResult> {
  const transcribedText = String(userResponse?.textResponse || '').trim();
  const discussionTranscript = question.textContent || '';
  const transcriptionWords = getTranscriptionWordsFromResponse(userResponse);
  const timingAnalysis = detectPauseMarkers(
    transcribedText,
    transcriptionWords,
  );

  const prompt = `
  **Your Role:** You are an expert AI evaluator for the PTE Academic test. Your task is to analyze a user's "Summarize Group Discussion" speaking performance with extreme precision.
  **Objective:** You will be given a transcript of a group discussion and a transcription of a user's spoken summary. Evaluate the response based on official PTE criteria for Content, Oral Fluency, and Pronunciation, and provide detailed, actionable feedback.

    ---
   ## 1. CONTENT ANALYSIS (0–6 SCALE)

    **STEP 1: LIST vs. SPEECH GATEKEEPER (MANDATORY)**
      Before assigning a Content score, analyze the **grammatical structure** of the user's transcribed response.
      **Check for:**
      - **Finite verbs** (e.g., *is, are, was, means, helps, reduces*)
      - **Logical connectors** (e.g., *and, but, because, so, which, while*)

      **Identify the trap:**
      - Does the response consist mainly of **nouns or adjectives listed separately**, possibly divided by pauses or periods?
      - Example: *"Environment. Water usage. Chemicals. Farming."*

      ### **RULING (STRICT):**
      - **IF YES (It is a list):**
      - You MUST assign **Content = 2** (or 1 if extremely minimal).
      - **DO NOT** award 3, 4, 5, or 6 — even if all keywords from the discussion are mentioned.
      - A list is **NOT** a summary.

      - **IF NO (It is connected speech):**
      - Proceed to **Step 2: Standard Scoring**.


    **STEP 2: STANDARD CONTENT SCORING (Connected Speech Only)**
      Evaluate how accurately and effectively the user summarized the discussion.
      
      **KEY PRINCIPLE:** Score based on **distinct concepts/ideas captured**, NOT on exact wording or phrase matching. Paraphrasing, synonyms, and alternative expressions are fully acceptable and should NOT result in lower scores.

      - 6 pts (Excellent)**
        - Captures **4–5 or more distinct concepts/ideas** from the discussion in any wording.
        - Accurately represents multiple viewpoints/perspectives (paraphrased is acceptable).
        - Uses complete sentences with logical connectors.
        - Ideas are logically structured with clear relationships between perspectives.
        - No major factual distortions.
        - **Example:** If discussion mentions "environmental impact" and user says "affects the ecosystem," this is acceptable and counts as a captured concept.
      - 5 pts (Very Good)**
        - Captures **3–4 distinct concepts/ideas** from the discussion.
        - Uses complete sentences and appropriate connectors.
        - Accurate understanding demonstrated through own words/paraphrasing.
        - Minor omissions or simplifications may exist.
        - If delivery is robotic or poorly connected, **cap at 4**.
      - 4 pts (Good)**
        - Captures **2-3 distinct concepts/ideas** accurately.
        - Uses simple but complete sentences.
        - Demonstrates comprehension even if not all relationships between viewpoints are explained.
        - Organization may be basic but meaning is clear.
      - 3 pts (Limited / Fragmented)**
        - Captures **2–3 concepts/ideas** using sentences, OR
        - Relies on **long exact phrases (3–4 words)** from the discussion without connectors.
        - Logical connections are weak or unclear.
      - 2 pts (Keyword List)**
        - **Applied ONLY if Step 1 is triggered.**
        - Response contains relevant keywords but lacks sentence structure.
        - Example: *"Water. Carbon. Food security."*
      - 1 pt (Poor)**
        - Highly minimal response (1–2 relevant words total) OR
        - Mostly irrelevant to the discussion.
      - 0 pts**
        - No meaningful response or completely non-English.

       **IMPORTANT CONTENT GUIDELINES**
        - **Logic Check:** Ensure the user has not stated the opposite of what speakers said.
        - **Accuracy Check:** Only penalize when user demonstrates fundamental misunderstanding or directly contradicts discussion content.
        - **Flexibility Rules:**
          * Accept any wording variation, synonym, or paraphrase that conveys the same concept (e.g., "uses water" = "depends on H2O")
          * Accept different order of ideas/viewpoints
          * Accept selective coverage (mentioning some but not all viewpoints is acceptable if accurate)
          * Accept different emphasis or reorganization of the discussion content
          * Do NOT penalize for not using exact phrases from the original discussion
        - **Distinction Rule:**
        - *"Climate. Farming. Water."* → **Score 2** (isolated words, no sentences)
        - *"Farming impacts water and climate."* → **Score 4** (2-3 concepts in sentences, paraphrased is fine)

    ## 2. Pronunciation (0-5 scale):** Score based on the accuracy of the transcribed words.
        * **5 pts:** Transcription is clear and accurate, with only very minor, isolated errors that do not impact understanding.
        * **4 pts:** Several errors that suggest pronunciation issues but text is mostly understandable.
        * **3 pts:** Many errors, making the text difficult to follow.
        * **2 pts:** The transcription is mostly incorrect, indicating very poor pronunciation.
        * **1 pt:** The transcription is almost entirely incorrect, with only a few recognizable words.
        * **0 pts:** The transcription is completely incorrect, contains no recognizable English words, or no meaningful speech transcribed.
        
    ## 3. Oral Fluency (0-5 scale):** Score based on filler words, hesitations, and natural flow.
        * **5 pts:** Smooth and flowing speech with almost no hesitations or filler words. Delivered in natural phrases.
        * **4 pts:** Noticeable hesitations or filler words that disrupt the flow.
        * **3 pts:** Uneven, slow, or fragmented speech.
        * **2 pts:** Very halting speech with many pauses or fillers.
        * **1 pt:** Extremely halting, with long pauses and many fillers.
        * **0 pts:** Mostly isolated words, not delivered in phrases, or no meaningful speech.

      **Important Guidelines:**
        - **PRIMARY FOCUS:** Evaluate whether the user captured distinct concepts/ideas from the discussion, regardless of how they're worded
        - **Accept Paraphrasing:** User doesn't need to use exact words from the discussion—any equivalent phrasing counts toward the score
        - **Accept Synonyms:** "environmental impact" = "harm to nature" = "affects ecosystem"—these are equivalent and should earn equal credit
        - **Accept Different Order:** Ideas can be presented in any sequence; don't penalize for reorganizing the discussion
        - **Accept Selective Coverage:** It's acceptable to mention some viewpoints but not all (as long as what IS mentioned is accurate)
        - **Flexible Representations:** The user can explain concepts in their own words using entirely different vocabulary
        - **No Word Matching Required:** This is NOT a word-matching exercise. Focus on understanding and concept capture, not memorization
        - **Content Accuracy Over Wording:** If the core idea is accurately conveyed with different wording, award full credit for that concept
        - Focus on content accuracy and relevance to the group discussion
        - Consider how well the user captured multiple viewpoints
        - Evaluate pronunciation based on transcription quality and clarity
        - Assess fluency through speech patterns evident in the transcription

  ### **Error Analysis Instructions**

    **CRITICAL:** Provide detailed error analysis identifying specific mistakes.

      **For each error:**
      1.  Identify the EXACT word/phrase (no surrounding text).
      2.  Provide the correct replacement.
      3.  Explain the issue (pronunciation, fluency, or content).
      4. Set position to {"start": 0, "end": 1} (we'll match by word content, not position)

      **Error Types:**
      * **Pronunciation:** Mispronounced/unclear words.
      * **Fluency:** Hesitations, fillers (um, uh, er), unnatural pauses.
      * **Content:** ONLY factually incorrect statements, logical contradictions, or fundamental misunderstandings of discussion content.

      **CRITICAL CONTENT ERROR RULES:**
      * **DO NOT MARK AS CONTENT ERRORS:**
        - Synonyms or alternative wording (e.g., "environmental damage" vs "harm to ecosystem")
        - Different phrasing of the same concept
        - Reordering of ideas/viewpoints
        - Omitted information (just means lower score, not an error)
        - Using paraphrased language instead of exact phrases
        - Selective coverage of viewpoints (if what IS mentioned is accurate)
        - Different emphasis or reorganization of concepts
      * **ONLY MARK AS CONTENT ERRORS:**
        - Statements that directly contradict the discussion (e.g., speaker said "X is bad," user said "X is good")
        - Fundamental misunderstandings (e.g., user misidentified who said what, or reversed the meaning)
        - Logically impossible statements that contradict themselves
        - Factually incorrect numbers/data that was explicitly stated in the discussion (not approximations)

      **IMPORTANT:**
      * **Connector Immunity:** Do NOT mark **"but", "whereas", "as", "and", "so"** as grammar errors.
      * **Synonym Immunity:** If a student uses a valid synonym, do **NOT** mark it as a content error.
      * **Error Priority:** 1. Spelling -> 2. Grammar -> 3. Vocabulary.

  ---
  ### **Required Output Format**
  Your final output **must** be a single JSON object with the following structure:

  **Group Discussion Transcript**: "${discussionTranscript}"
  **User's Transcribed Summary**: "${transcribedText}"
  **Time Taken**: ${timeTakenSeconds || 'Not specified'} seconds

{
  "Content": <number_0_to_6>,
  "Oral Fluency": <number_0_to_5>,
  "Pronunciation": <number_0_to_5>,
  "feedback": {
    "summary": "A concise overview of the overall performance and core areas for improvement.",
    "content": "Specific feedback. *If score is 2 due to keyword listing, warn user: 'You are listing keywords. You must use full sentences and phrases to summarize the discussion.'*",
    "oralFluency": "Specific feedback on speech flow.",
    "pronunciation": "Specific feedback on clarity."
  },
  "suggestions": ["Actionable tip 1", "Actionable tip 2", "Actionable tip 3"],
  "errorAnalysis": {
    "pronunciationErrors": [
      {
        "text": "mispronounced word",
        "type": "pronunciation",
        "position": { "start": 0, "end": 1 },
        "correction": "correct pronunciation",
        "explanation": "explanation of pronunciation error"
      }
    ],
    "fluencyErrors": [
      {
        "text": "um",
        "type": "fluency",
        "position": { "start": 0, "end": 1 },
        "correction": "",
        "explanation": "filler word that disrupts fluency"
      }
    ],
    "contentErrors": [
      {
        "text": "incorrect information",
        "type": "content",
        "position": { "start": 0, "end": 1 },
        "correction": "correct information",
        "explanation": "content accuracy issue"
      }
    ]
  }
}
  `;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content:
            'You are a helpful assistant designed to output JSON for PTE Academic evaluation.',
        },
        { role: 'user', content: prompt },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.2,
    });

    const evaluation = JSON.parse(response.choices[0].message.content || '{}');

    const mergedErrorAnalysis = mergePauseErrorsIntoErrorAnalysis(
      correctAudioErrorPositions(
        evaluation.errorAnalysis || {
          pronunciationErrors: [],
          fluencyErrors: [],
          contentErrors: [],
        },
        transcribedText,
      ),
      timingAnalysis.pauseErrors,
    );

    const contentScore = evaluation.Content || 0;
    const contentMaxScore = 6;
    const oralFluencyScore = evaluation['Oral Fluency'] || 0;
    const oralFluencyMaxScore = 5;
    const pronunciationScore = evaluation.Pronunciation || 0;
    const pronunciationMaxScore = 5;

    const overallScore = contentScore + oralFluencyScore + pronunciationScore;
    const maxPossibleScore =
      contentMaxScore + oralFluencyMaxScore + pronunciationMaxScore;

    const percentageScore = Math.round((overallScore / maxPossibleScore) * 100);

    return {
      score: { scored: overallScore, max: maxPossibleScore },
      isCorrect: percentageScore >= 65,
      feedback: evaluation.feedback?.summary,
      suggestions: evaluation.feedback?.suggestions || [
        'Focus on capturing all key viewpoints',
        'Organize your summary logically',
        'Use clear pronunciation and natural pace',
      ],
      detailedAnalysis: {
        scores: {
          content: { score: contentScore, max: contentMaxScore },
          oralFluency: { score: oralFluencyScore, max: oralFluencyMaxScore },
          pronunciation: {
            score: pronunciationScore,
            max: pronunciationMaxScore,
          },
        },
        feedback: {
          summary:
            evaluation.feedback?.summary ||
            'Summarize Group Discussion response evaluated successfully.',
          content:
            evaluation.feedback?.content ||
            'Focus on main ideas and diverse viewpoints',
          oralFluency:
            evaluation.feedback?.oralFluency ||
            buildRepeatSentenceFluencyFeedback({
              fluencyErrors: mergedErrorAnalysis.fluencyErrors,
              pauseMarkers: timingAnalysis.speechFlow.pauseMarkers,
            }),
          pronunciation:
            evaluation.feedback?.pronunciation ||
            'Work on clear articulation and stress patterns',
        },
        timeTaken: timeTakenSeconds || 0,
        userText: transcribedText,
        errorAnalysis: mergedErrorAnalysis,
        speechFlow: {
          ...timingAnalysis.speechFlow,
          aiInferredFluencyCount: Array.isArray(
            mergedErrorAnalysis.fluencyErrors,
          )
            ? mergedErrorAnalysis.fluencyErrors.length
            : 0,
        },
      },
    };
  } catch (error) {
    console.error(
      'OpenAI evaluation error for Summarize Group Discussion:',
      error,
    );
    return {
      score: { scored: 0, max: 16 },
      isCorrect: false,
      feedback: 'Error occurred during evaluation.',
      suggestions: [
        'Please try again.',
        'Focus on capturing diverse viewpoints from the discussion.',
        'Ensure clear pronunciation and logical organization.',
      ],
      detailedAnalysis: {
        scores: {
          content: { score: 0, max: 6 },
          oralFluency: { score: 0, max: 5 },
          pronunciation: { score: 0, max: 5 },
        },
        feedback: { summary: 'Error occurred during evaluation.' },
        timeTaken: timeTakenSeconds || 0,
        userText: transcribedText,
        errorAnalysis: {
          pronunciationErrors: [],
          fluencyErrors: [],
          contentErrors: [],
        },
        speechFlow: {
          pauseMarkers: [],
          totalPauseCount: 0,
          totalPausedMs: 0,
          longestPauseMs: 0,
          timingAvailable: transcriptionWords.length > 0,
          timedWordCount: transcriptionWords.length,
          mappedWordCount: transcriptionWords.length,
          aiInferredFluencyCount: 0,
        },
      },
    };
  }
}

/**
 * Evaluate Respond to a Situation responses
 * Similar to SUMMARIZE_GROUP_DISCUSSION but for responding to a situational prompt
 */
async function evaluateRespondToASituation(
  question: Question,
  userResponse: any,
  timeTakenSeconds?: number,
): Promise<QuestionEvaluationResult> {
  const transcribedText = String(userResponse?.textResponse || '').trim();
  const situationPrompt = question.textContent || '';
  const transcriptionWords = getTranscriptionWordsFromResponse(userResponse);
  const timingAnalysis =
    transcriptionWords.length > 0
      ? detectPauseMarkers(transcribedText, transcriptionWords, {
          pauseSeconds: 1,
          longPauseSeconds: 1.6,
        })
      : {
          pauseErrors: [] as any[],
          speechFlow: {
            pauseMarkers: [] as Array<{
              afterWord: string;
              beforeWord: string;
              afterWordIndex: number;
              beforeWordIndex: number;
              durationMs: number;
              durationSeconds: number;
              severity: 'hesitation' | 'pause' | 'long_pause';
            }>,
            totalPauseCount: 0,
            totalPausedMs: 0,
            longestPauseMs: 0,
            timingAvailable: false,
            timedWordCount: 0,
            mappedWordCount: 0,
          },
        };
  const prompt = `
    **Your Role:** You are an expert AI evaluator for the PTE Academic test. Your task is to analyze a user's "Respond to a Situation" speaking performance with extreme precision.

    **Objective:** You will be given a situational prompt and a transcription of a user's spoken response. Evaluate the response based on official PTE criteria for Content, Oral Fluency, and Pronunciation, and provide detailed, actionable feedback.
0
    ---
    ### **Evaluation and Scoring Instructions**

    **1. Content Analysis (0-6 scale):**
      Evaluate how well the user responded to the situation using the specific criteria below:
      ### 6 pts
      - The response fully and effectively addresses the situation and achieves the primary communication goal.
      - Demonstrates clear understanding of the context and the expectations of the situation.
      - Includes **appropriate development**, such as explanation, reasoning, reassurance, or justification relevant to the situation.
      - Ideas are logically connected and clearly expressed.
      - Uses original language rather than repeating the prompt.
      ### 5 pts
      - The response addresses the situation effectively and achieves the communication goal.
      - Context is understood, but development is limited or incomplete.
      - Meaning is clear, but the response lacks depth, elaboration, or nuance.
      ### 4 pts
      - The response generally addresses the situation and achieves most of the communication goal.
      - Some elements are underdeveloped, unclear, or missing.
      - Language is simple but appropriate.
      ### 3 pts
      - The response addresses only the basic requirement of the situation.
      - Development is minimal or abrupt.
      - Overall meaning is understandable but incomplete.
      ### 2 pts
      - The response contains some relevant content but does not clearly achieve the communication goal.
      - Important aspects of the situation are missing or misunderstood.
      ### 1 pt
      - The response shows minimal understanding of the situation.
      - Uses isolated relevant words or phrases with little or no elaboration.
      ### 0 pts
      - The response is relevant but too limited to assign a higher score.

      * **Pronunciation (0-5 scale):** Score based on the accuracy of the transcribed words.
        ### 5 pts
        - Speech is clear and understandable throughout.
        - Minor pronunciation errors may exist but do not affect understanding.
      ### 4 pts
      - Some pronunciation errors are noticeable.
      - The response is understandable without significant effort.
      ### 3 pts
      - Frequent pronunciation errors.
      - Most of the message is understandable with some effort.
      ### 2 pts
      - Many pronunciation errors significantly affect clarity.
      - Listener must make considerable effort to understand.
      ### 1 pt
      - Very poor pronunciation.
      - Only a few recognizable English words.
        ### 0 pts
        - No recognizable English words or meaningful speech.

      **Pronunciation Error Detection Guidance:**
        - If any word or short phrase appears distorted, substituted, or unusually unclear in the transcript, include it in 
          pronunciationErrors.
        - Do not leave pronunciationErrors empty if there is evidence of articulation issues, even if the overall meaning is clear.
        - Keep each pronunciation error focused on a single word or a very short phrase.
          
      * **Oral Fluency (0-5 scale):** Score based on filler words, hesitations, and natural flow.
      ### 5 pts
      - Speech is mostly smooth and continuous.
      - Some hesitations or fillers may occur but do not seriously disrupt flow.
      ### 4 pts
      - Speech is uneven with noticeable pauses or fillers.
      - Overall message is still delivered clearly.
      ### 3 pts
      - Speech is halting with frequent pauses.
      - Message is understandable but lacks smooth flow.
      ### 2 pts
      - Speech is very slow and fragmented.
      - Long pauses and fillers interfere with meaning.
      ### 1 pt
      - Mostly isolated words or short phrases.
      - Very little connected speech.
      ### 0 pts
      - No meaningful speech or only unintelligible sounds.

    **Important Guidelines:**
      - Focus on how well the user addressed the specific situation
      - Evaluate appropriateness and relevance of the response
      - Consider if the user provided clear strategies for handling the situation
      - Evaluate pronunciation based on transcription quality and clarity
      - Assess fluency through speech patterns evident in the transcription

    ---
    ### **Error Analysis Instructions**

    **CRITICAL:** You must provide detailed error analysis by identifying specific mistakes in the user's transcribed speech.

    **For each error you find:**
      1. Identify the EXACT word or phrase that contains the error (just the word, not surrounding text)
      2. Provide the correct replacement
      3. Give a clear explanation of the pronunciation, fluency, or content issue
      4. Set position to {"start": 0, "end": 1} (we'll match by word content, not position)

    **Error Types to Look For:**
      - **Pronunciation**: Mispronounced words, incorrect stress, unclear articulation
      - **Fluency**: Hesitations, filler words (um, uh, er), unnatural pauses
      - **Content**: Vague responses, incomplete ideas, off-topic information

     CRITICAL REQUIREMENTS:
      - Identify EVERY grammar error, no matter how small
      - Do NOT return empty arrays if errors exist
      - For each error, provide: exact text, type, correction, and explanation
      - Be strict and thorough in error detection
      - When checking for grammatical mistakes, make sure that if a synonym is used but the grammar is correct, it should **not** be marked as an error.
        - **Do not** mark the correct use of conjunctions or connectors (e.g., 'and', 'but', 'whereas', 'as') as grammatical errors. These are essential for linking ideas into the required single-sentence format.
      - **Error Prioritization:** A single error MUST be categorized only ONCE. Use this strict priority:
          1. **Spelling:** If a word is misspelled (e.g., "goverment"), it MUST go into "spellingErrors" ONLY. Do not list it in grammar or vocabulary.
          2. **Vocabulary:** Only if spelling and grammar are correct, but the word choice is poor or inappropriate (e.g., using "big" instead of "significant"), it MUST go into "vocabularyIssues".

    ---
    ### **Required Output Format**
    Your final output **must** be a single JSON object with the following structure:

    **Situation Prompt**: "${situationPrompt}"
    **User's Transcribed Response**: "${transcribedText}"
    **Time Taken**: ${timeTakenSeconds || 'Not specified'} seconds

    {
      "Content": <number_0_to_6>,
      "Oral Fluency": <number_0_to_5>,
      "Pronunciation": <number_0_to_5>,
      "feedback": {
      "summary": "A concise overview of the overall performance and core areas for improvement.",
        "content": "Specific feedback on how well the user addressed the situation",
        "oralFluency": "Specific feedback on speech flow and fluency",
        "pronunciation": "Specific feedback on pronunciation clarity"
      },
      "suggestions": ["Actionable tip 1", "Actionable tip 2", "Actionable tip 3"],
       "errorAnalysis": {
        "pronunciationErrors": [
          {
            "text": "mispronounced word",
            "type": "pronunciation",
            "position": { "start": 0, "end": 1 },
            "correction": "correct pronunciation",
            "explanation": "explanation of pronunciation error"
          }
        ],
        "fluencyErrors": [
          {
            "text": "um",
            "type": "fluency",
            "position": { "start": 0, "end": 1 },
            "correction": "",
            "explanation": "filler word that disrupts fluency"
          }
        ],
        "contentErrors": [
          {
            "text": "unclear response",
            "type": "content",
            "position": { "start": 0, "end": 1 },
            "correction": "clearer response",
            "explanation": "content clarity issue"
          }
        ]
      }
    }
  `;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content:
            'You are a helpful assistant designed to output JSON for PTE Academic evaluation.',
        },
        { role: 'user', content: prompt },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.2,
    });

    const evaluation = JSON.parse(response.choices[0].message.content || '{}');

    const contentScore = evaluation.Content || 0;
    const contentMaxScore = 6;
    const oralFluencyScore = evaluation['Oral Fluency'] || 0;
    const oralFluencyMaxScore = 5;
    const pronunciationScore = evaluation.Pronunciation || 0;
    const pronunciationMaxScore = 5;

    const overallScore = contentScore + oralFluencyScore + pronunciationScore;
    const maxPossibleScore =
      contentMaxScore + oralFluencyMaxScore + pronunciationMaxScore;

    const percentageScore = Math.round((overallScore / maxPossibleScore) * 100);
    const correctedErrorAnalysis = correctAudioErrorPositions(
      evaluation.errorAnalysis,
      transcribedText,
    );
    const mergedErrorAnalysis = mergePauseErrorsIntoErrorAnalysis(
      correctedErrorAnalysis,
      timingAnalysis.pauseErrors,
    );

    return {
      score: { scored: overallScore, max: maxPossibleScore },
      isCorrect: percentageScore >= 65,
      feedback: evaluation.feedback?.summary,
      suggestions: evaluation.feedback?.suggestions || [
        'Address all aspects of the situation',
        'Use clear and appropriate language',
        'Maintain natural pace and intonation',
      ],
      detailedAnalysis: {
        scores: {
          content: { score: contentScore, max: contentMaxScore },
          oralFluency: { score: oralFluencyScore, max: oralFluencyMaxScore },
          pronunciation: {
            score: pronunciationScore,
            max: pronunciationMaxScore,
          },
        },
        feedback: {
          content:
            evaluation.feedback?.content ||
            'Focus on clearly addressing the situation',
          oralFluency:
            evaluation.feedback?.oralFluency ||
            'Practice smooth, natural speech rhythm',
          pronunciation:
            evaluation.feedback?.pronunciation || 'Work on clear articulation',
        },
        timeTaken: timeTakenSeconds || 0,
        userText: transcribedText,
        errorAnalysis: {
          pronunciationErrors: mergedErrorAnalysis?.pronunciationErrors || [],
          fluencyErrors: mergedErrorAnalysis?.fluencyErrors || [],
          contentErrors: mergedErrorAnalysis?.contentErrors || [],
        },
        speechFlow: {
          ...timingAnalysis.speechFlow,
          aiInferredFluencyCount: Array.isArray(
            evaluation.errorAnalysis?.fluencyErrors,
          )
            ? evaluation.errorAnalysis.fluencyErrors.length
            : 0,
        },
      },
    };
  } catch (error) {
    console.error('OpenAI evaluation error for Respond to a Situation:', error);
    return {
      score: { scored: 0, max: 16 },
      isCorrect: false,
      feedback: 'Error occurred during evaluation.',
      suggestions: [
        'Please ensure clear audio recording',
        'Try recording again with better microphone quality',
        'Ensure quiet background environment',
      ],
      detailedAnalysis: {
        scores: {
          content: { score: 0, max: 6 },
          oralFluency: { score: 0, max: 5 },
          pronunciation: { score: 0, max: 5 },
        },
        feedback: { summary: 'Error occurred during evaluation.' },
        timeTaken: timeTakenSeconds || 0,
        userText: transcribedText,
        errorAnalysis: {
          pronunciationErrors: [],
          fluencyErrors: [],
          contentErrors: [],
        },
        speechFlow: {
          pauseMarkers: [],
          totalPauseCount: 0,
          totalPausedMs: 0,
          longestPauseMs: 0,
          timingAvailable: transcriptionWords.length > 0,
          timedWordCount: transcriptionWords.length,
          mappedWordCount: 0,
          aiInferredFluencyCount: 0,
        },
      },
    };
  }
}

/**
 * Checks if a user's answer contains any of the correct answer keywords.
 * This is a case-insensitive, partial match check.
 */
function isAnswerCorrect(userTranscript: string, correctAnswers: string[]) {
  if (
    !userTranscript ||
    typeof userTranscript !== 'string' ||
    !Array.isArray(correctAnswers)
  ) {
    return false;
  }
  const normalizedUserTranscript = userTranscript.toLowerCase().trim();
  return correctAnswers.some((answer) =>
    normalizedUserTranscript.includes(answer.toLowerCase().trim()),
  );
}

/**
 * Evaluate Answer Short Question responses using a fast, code-based partial match check.
 */
function evaluateAnswerShortQuestion(
  question: Question,
  userResponse: any,
  timeTakenSeconds?: number,
): QuestionEvaluationResult {
  const transcribedText = userResponse.textResponse;
  const correctAnswers = question.correctAnswers; // This is an array

  try {
    const isCorrect = isAnswerCorrect(transcribedText, correctAnswers);

    // Generate error analysis for incorrect answers
    const errorAnalysis = {
      pronunciationErrors: [] as any[],
      fluencyErrors: [] as any[],
      contentErrors: [] as any[],
    };

    if (!isCorrect && transcribedText) {
      // Add content error for incorrect answer
      errorAnalysis.contentErrors.push({
        text: transcribedText,
        type: 'content',
        position: { start: 0, end: 1 },
        correction: correctAnswers?.[0] || 'Expected answer',
        explanation: `Incorrect answer. Expected one of: ${
          correctAnswers?.join(', ') || 'correct answer'
        }`,
      });
    }

    if (isCorrect) {
      return {
        score: { scored: 1, max: 1 },
        isCorrect: true,
        feedback: 'Your answer is correct.',
        suggestions: ['Excellent! Your answer was concise and accurate.'],
        detailedAnalysis: {
          scores: { vocabulary: { score: 1, max: 1 } },
          feedback: { summary: 'Your answer is correct.' },
          timeTaken: timeTakenSeconds || 0,
          userText: transcribedText,
          correctAnswer: question.correctAnswers?.[0],
          errorAnalysis,
        },
      };
    } else {
      return {
        score: { scored: 0, max: 1 },
        isCorrect: false,
        feedback: 'Your answer is incorrect.',
        suggestions: [
          'Listen carefully and ensure your answer directly addresses the question.',
          'Keep your answer brief and to the point.',
        ],
        detailedAnalysis: {
          scores: { vocabulary: { score: 0, max: 1 } },
          feedback: {
            summary: 'Your answer is incorrect.',
            vocabulary: `Expected one of: ${correctAnswers?.join(', ') || 'correct answer'}`,
          },
          timeTaken: timeTakenSeconds || 0,
          userText: transcribedText,
          correctAnswer: question.correctAnswers?.[0],
          errorAnalysis,
        },
      };
    }
  } catch (error) {
    console.error('Error evaluating Answer Short Question:', error);
    return {
      score: { scored: 0, max: 1 },
      isCorrect: false,
      feedback: 'Error occurred during evaluation.',
      suggestions: ['Please try again.'],
      detailedAnalysis: {
        scores: { vocabulary: { score: 0, max: 1 } },
        feedback: { summary: 'Error occurred during evaluation.' },
        timeTaken: timeTakenSeconds || 0,
      },
    };
  }
}

// WRITING QUESTION EVALUATION
/**
 * Evaluate Summarize Written Text responses
 */
async function evaluateSummarizeWrittenText(
  question: Question,
  userResponse: any,
  timeTakenSeconds?: number,
): Promise<QuestionEvaluationResult> {
  const originalText = question.textContent || '';
  const userText = userResponse.text || '';
  const wordCount = userText
    .split(/\s+/)
    .filter((word: string | any[]) => word.length > 0).length;

const prompt = `
**Your Role:** Expert PTE Academic grader for "Summarize Written Text" (SWT) acting strictly like an automated computer scoring engine.
**Objective:** Evaluate the user's summary against the original text. Return ONLY minified JSON.

### **Input Data**
- **Original Text:** ${JSON.stringify(originalText)}
- **User's Summary:** ${JSON.stringify(userText)}
- **Word Count:** ${wordCount}

---
### **Step 1: Core Selection & Matching Rules**
- **Identify Core Concept Keywords:** Main topics, advantages, material properties, and cause-effect facts mentioned in the text.
- **PTE Grading Reality:** SWT is a text-extraction and compression task. If the user successfully extracts key facts, links them together using connectors, and maintains a clear relationship to the topic, they must be rewarded. 
- **CRITICAL GENERAL RULE:** Do NOT search for specific "mandatory" human-selected key details or specific omissions to penalize the response. If the summary captures a broad, substantial layout of the text's factual ecosystem (around 70%+ coverage of any valid core points combined), award full marks.

---
### **Step 2: Scoring Rubrics & Strict Criteria**

1. Content (0–4)
- **4 (Comprehensive):** Summary captures 70% or more of the main ideas/facts from the text, logically linking them into a single coherent sentence. Direct extraction of phrases connected cleanly must receive full marks. Do NOT reduce to 3 for "missing details" if the coverage threshold is met.
- **3 (Adequate):** Summary captures between 50% to 69% of the main ideas/facts. Minor structural gaps or omissions.
- **2 (Partial):** Summary captures around 40% to 49% of the main ideas/facts, showing a basic connection to the core topic.
- **1 (Minimal):** Captures less than 40% of the ideas, lacks proper sentence logic, or has weak relevance to the topic.
- **0:** Off-topic or completely unintelligible.

*Feedback Rule for Content:* If the score is 4, the feedback must be entirely positive. Do NOT include phrases like "but misses details regarding..." or "omits information about...".

2. Form (0–1)
- **1:** Exactly ONE complete sentence, 5–75 words, not ALL CAPS.
- **0:** Multiple sentences, fragments, <5 or >75 words, or ALL CAPS.

3. Grammar (0–2)
- **2:** Correct structure. Ignore minor punctuation issues, comma splices, or connector-heavy structures unless meaning becomes completely unclear.
- **1:** Some noticeable grammar issues, but meaning remains clear.
- **0:** Serious structural errors that distort meaning.

4. Vocabulary (0–2)
- **2:** Words used are contextually accurate and relevant to the topic (using direct words/phrases extracted from the source text is perfectly acceptable and expected).
- **1:** Includes a few incorrect or mismatched word choices, but the overall meaning is still understandable.
- **0:** Major word choice errors or nonsense words that disrupt communication.

---
### **Step 3: Error Analysis Instructions**
- **Index:** Starts at 0. Split ONLY on whitespace. Punctuation is NOT a separate word.
- **Format:** Single-word error: {"start": index, "end": index + 1}. Include "before" and "after" words for context.
- **Types:** 'spelling', 'grammar', 'vocabulary'.

---
### **Expected Output Format**
Return ONLY a single, minified JSON object. No markdown wrapping. No trailing text.

{
  "scores": {"content": 0, "form": 0, "grammar": 0, "vocabulary": 0},
  "feedback": {"content": "", "form": "", "grammar": "", "vocabulary": ""},
  "errorAnalysis": {
    "grammarErrors": [],
    "spellingErrors": [],
    "vocabularyIssues": []
  }
}
`;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content:
            'You are a helpful assistant designed to output JSON for PTE Academic evaluation. Return ONLY valid minified JSON. Do not add any markdown, explanations, or extra text.',
        },
        { role: 'user', content: prompt },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.2,
    });

    const evaluation = JSON.parse(
      response.choices?.[0]?.message?.content || '{}',
    );

    const normalizeErrors = (rawErrors: any[], textWordCount: number) => {
      if (!Array.isArray(rawErrors)) return [];

      return rawErrors
        .map((error) => {
          if (!error || typeof error !== 'object' || !error.text) return null;

          const normalized = {
            text: String(error.text).trim(),
            type: String(error.type || 'vocabulary').toLowerCase(),
            position: error.position || { start: 0, end: 1 },
            correction: String(error.correction || '').trim(),
            explanation: String(error.explanation || '').trim(),
            before: String(error.before || '').trim(),
            after: String(error.after || '').trim(),
          };

          const start = Number(normalized.position.start);
          const end = Number(normalized.position.end);

          if (!isNaN(start) && !isNaN(end) && start >= 0 && start < end) {
            normalized.position = { start, end };
            return normalized;
          }

          return null;
        })
        .filter((e) => e !== null);
    };

    const contentScore = evaluation.scores?.content || 0;
    const formScore = evaluation.scores?.form || 0;
    const grammarScore = evaluation.scores?.grammar || 0;
    const vocabularyScore = evaluation.scores?.vocabulary || 0;

    const maxContentScore = 4;
    const maxFormScore = 1;
    const maxGrammarScore = 2;
    const maxVocabularyScore = 2;

    const totalAchievedScore =
      contentScore + formScore + grammarScore + vocabularyScore;
    const totalMaxScore =
      maxContentScore + maxFormScore + maxGrammarScore + maxVocabularyScore;

    const overallScore = totalAchievedScore;
    const percentageScore = Math.round(
      (totalAchievedScore / totalMaxScore) * 100,
    );

    // Get errors from the unified errors array or individual categories
    const rawErrors = evaluation.errorAnalysis?.errors || [];
    const normalizedErrors = normalizeErrors(rawErrors, wordCount);

    // Convert unified errors array to the expected structure for compatibility
    const errorAnalysis = {
      grammarErrors: normalizeErrors(
        evaluation.errorAnalysis?.grammarErrors || [],
        wordCount,
      ),
      spellingErrors: normalizeErrors(
        evaluation.errorAnalysis?.spellingErrors || [],
        wordCount,
      ),
      vocabularyIssues: normalizeErrors(
        evaluation.errorAnalysis?.vocabularyIssues || [],
        wordCount,
      ),
    };

    normalizedErrors.forEach((error) => {
      if (error.type === 'spelling') {
        errorAnalysis.spellingErrors.push(error);
      } else if (error.type === 'grammar') {
        errorAnalysis.grammarErrors.push(error);
      } else {
        errorAnalysis.vocabularyIssues.push(error);
      }
    });

    const correctedErrorAnalysis = correctErrorPositions(
      errorAnalysis,
      userText,
    );

    return {
      score: { scored: overallScore, max: totalMaxScore },
      isCorrect: percentageScore >= 65,
      feedback:
        evaluation.feedback?.summary || 'Summary evaluated successfully.',
      suggestions: evaluation.suggestions || [],
      detailedAnalysis: {
        scores: {
          content: { score: contentScore, max: maxContentScore },
          form: { score: formScore, max: maxFormScore },
          grammar: { score: grammarScore, max: maxGrammarScore },
          vocabulary: { score: vocabularyScore, max: maxVocabularyScore },
        },
        feedback: {
          content: evaluation.feedback?.content || '',
          form: evaluation.feedback?.form || '',
          grammar: evaluation.feedback?.grammar || '',
          vocabulary: evaluation.feedback?.vocabulary || '',
        },
        timeTaken: timeTakenSeconds || 0,
        userText: userText,
        wordCount: wordCount,
        errorAnalysis: correctedErrorAnalysis,
      },
    };
  } catch (error) {
    console.error('OpenAI evaluation error for Summarize Written Text:', error);
    return {
      score: { scored: 0, max: 9 },
      isCorrect: false,
      feedback: 'Unable to evaluate response at this time.',
      suggestions: ['Please try again later'],
      detailedAnalysis: {
        scores: {
          content: { score: 0, max: 4 },
          form: { score: 0, max: 1 },
          grammar: { score: 0, max: 2 },
          vocabulary: { score: 0, max: 2 },
        },
        feedback: { summary: 'Unable to evaluate response at this time.' },
        timeTaken: timeTakenSeconds || 0,
        userText: userText,
        wordCount: wordCount,
        errorAnalysis: {
          grammarErrors: [],
          spellingErrors: [],
          vocabularyIssues: [],
        },
      },
    };
  }
}

/**
 * Corrects error positions in the error analysis by finding the actual word indices
 * in the user text. Uses context-based matching to identify the correct occurrence
 * when words appear multiple times in the essay.
 */
function correctErrorPositions(errorAnalysis: any, userText: string): any {
  if (!errorAnalysis) return errorAnalysis;

  // Split the text into words (same way as in the prompt)
  const words = userText.split(/\s+/).filter((word: string) => word.length > 0);

  // Normalize function - removes punctuation for comparison
  const normalize = (text: string): string =>
    text.toLowerCase().replace(/[.,!?;:\-()[\]{}""'']/g, '');

  // Helper function to find the correct position of an error word using context
  const findWordPosition = (
    errorText: string,
    originalPosition?: { start: number; end: number },
    context?: { before?: string; after?: string },
  ): { start: number; end: number } | null => {
    const normalizedError = normalize(errorText);

    // Split error into words to handle multi-word errors
    const errorWords = errorText
      .split(/\s+/)
      .filter((w: string) => w.length > 0);
    const allOccurrences: Array<{
      start: number;
      end: number;
      contextScore: number;
    }> = [];

    if (errorWords.length === 1) {
      // Single word error - find all occurrences
      for (let i = 0; i < words.length; i++) {
        const normalizedWord = normalize(words[i]);
        if (normalizedWord === normalizedError) {
          let contextScore = 0;

          // Score based on context matching
          if (context) {
            // Check word before
            if (context.before && i > 0) {
              const wordBefore = normalize(words[i - 1]);
              const contextBefore = normalize(context.before);
              if (wordBefore === contextBefore) {
                contextScore += 50;
              }
            }

            // Check word after
            if (context.after && i < words.length - 1) {
              const wordAfter = normalize(words[i + 1]);
              const contextAfter = normalize(context.after);
              if (wordAfter === contextAfter) {
                contextScore += 50;
              }
            }
          }

          allOccurrences.push({
            start: i,
            end: i + 1,
            contextScore,
          });
        }
      }
    } else {
      // Multi-word error - find all sequences
      for (let i = 0; i <= words.length - errorWords.length; i++) {
        let match = true;
        for (let j = 0; j < errorWords.length; j++) {
          const normalizedWord = normalize(words[i + j]);
          const normalizedErrorWord = normalize(errorWords[j]);
          if (normalizedWord !== normalizedErrorWord) {
            match = false;
            break;
          }
        }

        if (match) {
          let contextScore = 0;

          // Score based on context matching
          if (context) {
            // Check word before
            if (context.before && i > 0) {
              const wordBefore = normalize(words[i - 1]);
              const contextBefore = normalize(context.before);
              if (wordBefore === contextBefore) {
                contextScore += 50;
              }
            }

            // Check word after
            if (context.after && i + errorWords.length < words.length) {
              const wordAfter = normalize(words[i + errorWords.length]);
              const contextAfter = normalize(context.after);
              if (wordAfter === contextAfter) {
                contextScore += 50;
              }
            }
          }

          allOccurrences.push({
            start: i,
            end: i + errorWords.length,
            contextScore,
          });
        }
      }
    }

    if (allOccurrences.length === 0) {
      return null;
    }

    // If only one occurrence, return it
    if (allOccurrences.length === 1) {
      return { start: allOccurrences[0].start, end: allOccurrences[0].end };
    }

    // Multiple occurrences - use intelligent selection strategy
    // Strategy 1: Context-based matching (highest priority)
    const contextMatches = allOccurrences.filter((occ) => occ.contextScore > 0);
    if (contextMatches.length > 0) {
      // Sort by context score (descending)
      contextMatches.sort((a, b) => b.contextScore - a.contextScore);
      const best = contextMatches[0];
      return { start: best.start, end: best.end };
    }

    // Strategy 2: Use original position as a weak hint
    if (originalPosition && originalPosition.start >= 0) {
      const targetIndex = originalPosition.start;

      // Find occurrence closest to target, but with a reasonable threshold
      let bestOccurrence = allOccurrences[0];
      let bestDistance = Math.abs(allOccurrences[0].start - targetIndex);

      for (const occurrence of allOccurrences) {
        const distance = Math.abs(occurrence.start - targetIndex);
        // Only update if significantly closer (tolerance: within 5 words)
        if (distance < bestDistance - 5) {
          bestDistance = distance;
          bestOccurrence = occurrence;
        }
      }

      return { start: bestOccurrence.start, end: bestOccurrence.end };
    }

    // Strategy 3: No context or position hint - prefer occurrences later in the text
    // (errors tend to accumulate towards the end of essays)
    const last = allOccurrences[allOccurrences.length - 1];
    return { start: last.start, end: last.end };
  };

  // Function to correct positions in an error array
  const correctErrorArray = (errors: any[]): any[] => {
    return errors.map((error: any) => {
      const correctedPosition = findWordPosition(
        error.text,
        error.position,
        error.context,
      );
      if (correctedPosition) {
        return {
          ...error,
          position: correctedPosition,
        };
      }
      return error;
    });
  };

  return {
    grammarErrors: correctErrorArray(errorAnalysis.grammarErrors || []),
    spellingErrors: correctErrorArray(errorAnalysis.spellingErrors || []),
    vocabularyIssues: correctErrorArray(errorAnalysis.vocabularyIssues || []),
  };
}

/**
 * Evaluate Write Essay responses
 */
async function evaluateWriteEssay(
  question: Question,
  userResponse: any,
  timeTakenSeconds?: number,
): Promise<QuestionEvaluationResult> {
  const userText = userResponse.text || '';
  const wordCount = userText
    .split(/\s+/)
    .filter((word: string | any[]) => word.length > 0).length;

  const prompt = `
**Role:** Expert PTE Grader (Write Essay).
**Input:** - Prompt: "${question.textContent}"
- Essay: "${userText}"
- Count: ${wordCount}

---
### **1. Pre-Scoring Evaluation (MANDATORY)**
**Step A: Detect Essay Type & Strategy:**
- Types: Opinion, Adv/Disadv, Problem/Solution, Both Views, Invention/Impact.
- Rule (Opinion): MUST take clear one-sided position. Mixing sides reduces Content/Structure.
- Rule (Adv/Disadv): MUST discuss both sides unless "outweigh" is asked.
- Rule (Invention): MUST identify one invention and take clear stance.

**Step B: Template vs. Real Content Check:**
- High Score requires: Intro (1-2 ideas), BP1 (Idea+Expl+Ex), BP2 (Idea+Expl+Ex), Conclusion (closing idea).
- If mostly template with no topic-specific ideas: Reduce Content score.
- **Safe Harbor:** If 40–80 words are genuinely relevant, MUST score Content 4–6 even if structure is weak.

---
### **2. Scoring Rubrics**
1. **Content (0-6):** Score based on "Idea Chunks" (topic-relevant concepts).
   - 6: Clear position; 40-80+ relevant words; strong logic in both BPs.
   - 5-4: Multiple chunks; minor imbalance or shallow argument.
   - 3-2: Mostly templated; barely addresses topic; unrelated ideas.
   - 1-0: Off-topic or random keywords only.

2. **Form (0-2):** 2: (200-300 words). 1: (120-199 or 301-380). 0: (<120, >380, or ALL CAPS).

3. **Development/Structure (0-6):** Logical flow and connectivity.
   - 6: Clear structure; both BPs well-developed. 4: Missing examples/depth. 0: No structure.

4. **Grammar (0-2):** Base 2. Deduct **0.2 per error**. Min 0. (Immunity: but, whereas, as, and, so).

5. **Linguistic Range (0-6):** Range of expression. 6: Variation. 4: Limited. 2: Very restricted.

6. **Vocabulary Range (0-2):** 2: Academic/Topic-specific. 1: Basic. 0: Meaning obscured.

7. **Spelling (0-2):** Base 2. Deduct **0.5 per error**. Min 0. (Do not double-count as grammar).

---
### **3. Error Analysis & Output**
**ARRAY EXCLUSIVITY RULE (CRITICAL):**
- **spellingErrors ONLY:** If a word is wrong because of its spelling (e.g., "achieveing", "knowladge"), it belongs HERE and ONLY here.
- **grammarErrors ONLY:** If a word is spelled correctly but used incorrectly (e.g., "people debates", "a engineer", "who has"), it belongs HERE.
- **CROSS-ARRAY BAN:** A single word/index MUST NOT appear in both arrays. If you find a misspelled word that also causes a grammar issue, categorize it ONLY as a spelling error to avoid double-penalizing the student's feedback.
**Positioning:** 0-indexed. Split on whitespace.
**Error Object:** {"text":"","type":"","position":{"start":0,"end":0},"context":{"before":"","after":""},"correction":"","explanation":""}

**Format:** Return ONLY minified JSON.
{
  "scores": {
    "content": 0, "form": 0, "developmentStructureCoherence": 0, "grammar": 0, 
    "generalLinguisticRange": 0, "vocabularyRange": 0, "spelling": 0
  },
  "feedback": {
    "content": "", "form": "", "developmentStructureCoherence": "", 
    "grammar": "", "generalLinguisticRange": "", "vocabularyRange": "", "spelling": ""
  },
  "errorAnalysis": { "grammarErrors": [], "spellingErrors": [], "vocabularyIssues": [] },
}
`;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content:
            'You are a helpful assistant designed to output JSON for PTE Academic evaluation.',
        },
        { role: 'user', content: prompt },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.3,
    });

    const evaluation = JSON.parse(response.choices[0].message.content || '{}');

    // Extract individual scores for each trait
    const scores = evaluation.scores || {};
    const contentScore = scores.content || 0;
    const formScore = scores.form || 0;
    const devScore = scores.developmentStructureCoherence || 0;
    const grammarScore = scores.grammar || 0;
    const lingRangeScore = scores.generalLinguisticRange || 0;
    const vocabScore = scores.vocabularyRange || 0;
    const spellingScore = scores.spelling || 0;

    // Define the maximum possible score for each trait
    const maxContentScore = 6;
    const maxFormScore = 2;
    const maxDevScore = 6;
    const maxGrammarScore = 2;
    const maxLingRangeScore = 6;
    const maxVocabScore = 2;
    const maxSpellingScore = 2;

    // Calculate the total achieved score and the total possible score
    const totalAchievedScore =
      contentScore +
      formScore +
      devScore +
      grammarScore +
      lingRangeScore +
      vocabScore +
      spellingScore;
    const totalMaxScore =
      maxContentScore +
      maxFormScore +
      maxDevScore +
      maxGrammarScore +
      maxLingRangeScore +
      maxVocabScore +
      maxSpellingScore; // Total is 26

    // Calculate the overall score as actual points earned
    const overallScore = totalAchievedScore;

    // Calculate percentage for isCorrect check (65% threshold)
    const percentageScore = Math.round(
      (totalAchievedScore / totalMaxScore) * 100,
    );

    return {
      score: { scored: overallScore, max: totalMaxScore },
      isCorrect: percentageScore >= 65,
      feedback: evaluation.feedback?.summary || 'Essay evaluated successfully.',
      suggestions: evaluation.suggestions || [
        'Ensure your essay directly addresses all parts of the prompt.',
        'Develop your main points with specific reasons and examples.',
        'Check your essay for grammatical accuracy and spelling before submitting.',
      ],
      detailedAnalysis: {
        scores: {
          content: { score: contentScore, max: maxContentScore },
          form: { score: formScore, max: maxFormScore },
          developmentStructureCoherence: { score: devScore, max: maxDevScore },
          grammar: { score: grammarScore, max: maxGrammarScore },
          generalLinguisticRange: {
            score: lingRangeScore,
            max: maxLingRangeScore,
          },
          vocabularyRange: { score: vocabScore, max: maxVocabScore },
          spelling: { score: spellingScore, max: maxSpellingScore },
        },
        feedback: {
          content: evaluation.feedback?.content || '',
          form: evaluation.feedback?.form || '',
          developmentStructureCoherence:
            evaluation.feedback?.developmentStructureCoherence || '',
          grammar: evaluation.feedback?.grammar || '',
          generalLinguisticRange:
            evaluation.feedback?.generalLinguisticRange || '',
          vocabularyRange: evaluation.feedback?.vocabularyRange || '',
          spelling: evaluation.feedback?.spelling || '',
        },
        timeTaken: timeTakenSeconds || 0,
        userText: userText,
        wordCount: wordCount,
        errorAnalysis: correctErrorPositions(
          evaluation.errorAnalysis,
          userText,
        ),
      },
    };
  } catch (error) {
    console.error('OpenAI evaluation error for Write Essay:', error);
    return {
      score: { scored: 0, max: 26 },
      isCorrect: false,
      feedback: 'Unable to evaluate response at this time.',
      suggestions: ['Please try again later'],
      detailedAnalysis: {
        scores: {
          content: { score: 0, max: 6 },
          form: { score: 0, max: 2 },
          developmentStructureCoherence: { score: 0, max: 6 },
          grammar: { score: 0, max: 2 },
          generalLinguisticRange: { score: 0, max: 6 },
          vocabularyRange: { score: 0, max: 2 },
          spelling: { score: 0, max: 2 },
        },
        feedback: { summary: 'Unable to evaluate response at this time.' },
        timeTaken: timeTakenSeconds || 0,
        userText: userText,
        wordCount: wordCount,
      },
    };
  }
}

// READING QUESTION EVALUATION
/**
 * Evaluate Multiple Choice Single Answer responses
 */
async function evaluateMultipleChoiceSingle(
  question: Question,
  userResponse: any,
  timeTakenSeconds?: number,
): Promise<QuestionEvaluationResult> {
  const selectedOption = userResponse.selectedOption;

  console.log(selectedOption, 'EIOWIOR');

  // Ensure options have IDs

  const correctAnswers = question.options
    .filter((opt: any) => opt.isCorrect)
    .map((opt: any) => opt.id || opt.option_id);

  const isCorrect = correctAnswers.includes(selectedOption);

  // Get the selected option text for feedback
  const selectedOptionText =
    question.options.find(
      (opt: any) => (opt.id || opt.option_id) === selectedOption,
    )?.text || 'Unknown option';
  const correctOptionText =
    question.options.find((opt: any) =>
      correctAnswers.includes(opt.id || opt.option_id),
    )?.text || 'Unknown option';

  // Determine if this is a reading or listening question based on question type
  const isReadingQuestion = question.questionType.name.includes('READING');
  const skillType = isReadingQuestion ? 'reading' : 'listening';
  const actualScore = isCorrect ? 1 : 0;

  // Generate detailed explanation for both reading and listening questions using AI
  let explanation = '';
  try {
    const generationFunction = isReadingQuestion
      ? generateDynamicExplanation
      : generateDynamicExplanationListening;

    explanation = await generationFunction({
      questionType: question.questionType.name,
      textContent: question.textContent,
      questionStatement: question.questionStatement,
      selectedAnswer: selectedOptionText,
      correctAnswer: correctOptionText,
      allOptions: question.options,
      isCorrect: isCorrect,
    });
  } catch (error) {
    console.error('Error generating explanation:', error);
    // Fallback to static explanation
    explanation = `The correct answer is "${correctOptionText}". Your selected answer "${selectedOptionText}" was incorrect. ${
      isReadingQuestion
        ? 'Review the passage carefully to find evidence supporting the correct answer.'
        : 'Listen again carefully to identify the correct information.'
    }`;
  }

  return {
    score: { scored: actualScore, max: 1 },
    isCorrect,
    feedback: isCorrect
      ? `Correct! You selected: "${selectedOptionText}"`
      : `Incorrect. You selected: "${selectedOptionText}". The correct answer is: "${correctOptionText}"`,
    suggestions: isCorrect
      ? ['Great job! Continue practicing similar questions.']
      : isReadingQuestion
        ? [
            'Re-read the passage carefully and identify key information',
            'Look for specific evidence that directly supports the correct answer',
            'Eliminate options that are only partially correct or off-topic',
            'Pay attention to qualifying words like "always", "never", "some", "most"',
            'Consider the main idea vs. specific details when answering',
          ]
        : [
            'Review the passage/audio more carefully',
            'Look for key information that supports the correct answer',
            'Practice elimination techniques for wrong options',
          ],
    detailedAnalysis: {
      scores: {
        [skillType]: { score: actualScore, max: 1 },
      },
      feedback: {
        summary: isCorrect
          ? `Correct! You selected: "${selectedOptionText}"`
          : `Incorrect. You selected: "${selectedOptionText}". The correct answer is: "${correctOptionText}"`,
      },
      timeTaken: timeTakenSeconds || 0,
      correctAnswer: correctOptionText,
      choiceResult: {
        selectedTexts: [selectedOptionText],
        correctTexts: [correctOptionText],
        incorrectlySelectedTexts: isCorrect ? [] : [selectedOptionText],
        missedCorrectTexts: isCorrect ? [] : [correctOptionText],
        explanation: explanation || undefined,
      },
    },
  };
}

/**
 * Evaluate Multiple Choice Multiple Answers responses
 */
async function evaluateMultipleChoiceMultiple(
  question: Question,
  userResponse: any,
  timeTakenSeconds?: number,
): Promise<QuestionEvaluationResult> {
  const selectedOptions = userResponse.selectedOptions || [];
  const correctAnswers = question.options
    .filter((opt: any) => opt.isCorrect)
    .map((opt: any) => opt.id);

  // Count how many of the user's selections are correct
  const correctSelected = selectedOptions.filter((option: string) =>
    correctAnswers.includes(option),
  ).length;

  // Count how many of the user's selections are incorrect
  const incorrectSelected = selectedOptions.filter(
    (option: string) => !correctAnswers.includes(option),
  ).length;

  const totalCorrectAnswers = correctAnswers.length;

  // Use correct/total format like Fill in the Blanks
  const score = correctSelected; // Show actual correct count
  const isCorrect =
    correctSelected === totalCorrectAnswers && incorrectSelected === 0;

  // Determine if this is a reading or listening question
  const isReadingQuestion = question.questionType.name.includes('READING');
  const skillType = isReadingQuestion ? 'reading' : 'listening';

  // Get option texts for detailed feedback
  const options = question.options || [];
  const selectedOptionTexts = selectedOptions.map(
    (optId: string) =>
      options.find((opt: any) => opt.id === optId)?.text || 'Unknown option',
  );
  const correctOptionTexts = correctAnswers.map(
    (optId: string) =>
      options.find((opt: any) => opt.id === optId)?.text || 'Unknown option',
  );
  const incorrectlySelectedTexts = selectedOptions
    .filter((optId: string) => !correctAnswers.includes(optId))
    .map(
      (optId: string) =>
        options.find((opt: any) => opt.id === optId)?.text || 'Unknown option',
    );
  const missedCorrectTexts = correctAnswers
    .filter((optId: string) => !selectedOptions.includes(optId))
    .map(
      (optId: string) =>
        options.find((opt: any) => opt.id === optId)?.text || 'Unknown option',
    );

  // Generate detailed explanation for both reading and listening questions using AI
  let explanation = '';
  try {
    const generationFunction = isReadingQuestion
      ? generateDynamicExplanationMultiple
      : generateDynamicExplanationListeningMultiple;

    explanation = await generationFunction({
      questionType: question.questionType.name,
      textContent: question.textContent,
      questionStatement: question.questionStatement,
      selectedAnswers: selectedOptionTexts,
      correctAnswers: correctOptionTexts,
      incorrectlySelected: incorrectlySelectedTexts,
      missedCorrect: missedCorrectTexts,
      allOptions: question.options,
    });
  } catch (error) {
    console.error('Error generating explanation:', error);
    // Fallback to static explanation
    explanation = `The correct answers are: ${correctOptionTexts
      .map((text: string) => `"${text}"`)
      .join(', ')}. `;

    if (incorrectlySelectedTexts.length > 0) {
      explanation += `You incorrectly selected: ${incorrectlySelectedTexts
        .map((text: string) => `"${text}"`)
        .join(', ')}. `;
    }

    if (missedCorrectTexts.length > 0) {
      explanation += `You missed: ${missedCorrectTexts
        .map((text: string) => `"${text}"`)
        .join(', ')}. `;
    }
  }

  return {
    score: { scored: correctSelected, max: totalCorrectAnswers },
    isCorrect,
    feedback: `You selected ${correctSelected} correct and ${incorrectSelected} incorrect options out of ${correctAnswers.length} total correct answers.`,
    suggestions: isCorrect
      ? ['Excellent! You identified all correct answers.']
      : isReadingQuestion
        ? [
            'Read the passage thoroughly to identify all relevant information',
            'Look for multiple pieces of evidence that support different correct answers',
            'Be careful not to select options that are only partially supported',
            'Check that each selected option is directly supported by the text',
            'Consider whether you might have missed any correct options',
          ]
        : [
            'Read all options carefully before selecting',
            'Look for multiple pieces of evidence in the text/audio',
            'Avoid selecting options that are only partially correct',
          ],
    detailedAnalysis: {
      scores: {
        [skillType]: { score: correctSelected, max: totalCorrectAnswers },
      },
      feedback: {
        summary: `You selected ${correctSelected} correct and ${incorrectSelected} incorrect options out of ${correctAnswers.length} total correct answers.`,
      },
      timeTaken: timeTakenSeconds || 0,
      correctAnswer: correctOptionTexts.join('; '),
      choiceResult: {
        selectedTexts: selectedOptionTexts,
        correctTexts: correctOptionTexts,
        incorrectlySelectedTexts,
        missedCorrectTexts,
        explanation: explanation || undefined,
      },
    },
  };
}

/**
 * Evaluate Re-order Paragraphs responses
 */
async function evaluateReorderParagraphs(
  question: Question,
  userResponse: any,
  timeTakenSeconds?: number,
): Promise<QuestionEvaluationResult> {
  const userOrder = userResponse.orderedParagraphs || [];
  const correctOrder = question.correctAnswers?.correctOrder || [];

  // Calculate adjacent pairs scoring (PTE scoring method)
  let correctPairs = 0;
  for (let i = 0; i < userOrder.length - 1; i++) {
    const currentIndex = correctOrder.indexOf(userOrder[i]);
    const nextIndex = correctOrder.indexOf(userOrder[i + 1]);
    if (
      currentIndex !== -1 &&
      nextIndex !== -1 &&
      nextIndex === currentIndex + 1
    ) {
      correctPairs++;
    }
  }

  const maxPairs = Math.max(0, correctOrder.length - 1);
  // Use correct/total format like Fill in the Blanks
  const score = correctPairs; // Show actual correct pairs count
  const isCorrect = correctPairs === maxPairs;

  // Map paragraph IDs to their text and order for explanation
  const paragraphMap = new Map<string, string>();
  question.options.forEach((opt: any) => {
    paragraphMap.set(opt.id, opt.text);
  });

  const userOrderText = userOrder.map((id: string) => ({
    id,
    text: paragraphMap.get(id) || '',
  }));

  const correctOrderText = correctOrder.map((id: string) => ({
    id,
    text: paragraphMap.get(id) || '',
  }));

  // Generate detailed explanation using AI
  let explanation = '';
  try {
    explanation = await generateDynamicExplanationReorder({
      questionType: question.questionType.name,
      textContent: question.textContent,
      correctOrderText, // Pass only correct order - explain why it's correct
    });
  } catch (error) {
    console.error('Error generating explanation:', error);
    // Fallback to static explanation
    explanation = `The correct paragraph order follows a logical flow that connects ideas through transitions, chronological sequencing, or cause-and-effect relationships. Look for topic connections and structural clues that indicate which paragraphs belong together.`;
  }

  return {
    score: { scored: correctPairs, max: maxPairs },
    isCorrect,
    feedback: `You got ${correctPairs} out of ${maxPairs} paragraph pairs in the correct order.`,
    suggestions: isCorrect
      ? ['Excellent! You identified the correct logical flow.']
      : [
          'Look for logical connectors (however, therefore, meanwhile, etc.)',
          'Identify the introduction paragraph (usually sets up the topic)',
          'Find the conclusion paragraph (usually summarizes or concludes)',
          'Follow chronological order when dealing with events or processes',
          'Look for pronouns and references that connect to previous paragraphs',
          'Consider cause-and-effect relationships between ideas',
        ],
    detailedAnalysis: {
      scores: {
        reading: { score: correctPairs, max: maxPairs },
      },
      feedback: {
        summary: `You got ${correctPairs} out of ${maxPairs} paragraph pairs in the correct order.`,
      },
      timeTaken: timeTakenSeconds || 0,
      reorderResult: {
        userOrderText: userOrderText.map((item: any) => item.text),
        correctOrderText: correctOrderText.map((item: any) => item.text),
        correctPairs,
        maxPairs,
        explanation: explanation || undefined,
      },
    },
  };
}

/**
 * Evaluate Fill in the Blanks responses
 */
async function evaluateFillInTheBlanks(
  question: Question,
  userResponse: any,
  timeTakenSeconds?: number,
): Promise<QuestionEvaluationResult> {
  const userBlanks = userResponse.blanks || {};

  // Extract correct answers from the options array
  const correctBlanks: { [key: string]: string } = {};

  // The question.options contains the blanks with their correct answers
  if (question.options && Array.isArray(question.options)) {
    question.options.forEach((blank: any, index: number) => {
      const blankKey = `blank${index + 1}`;
      correctBlanks[blankKey] = blank.correctAnswer;
    });
  }

  let correctCount = 0;
  let totalBlanks = 0;
  const blankResults: any = {};

  Object.keys(correctBlanks).forEach((blankKey) => {
    totalBlanks++;
    const userAnswer = userBlanks[blankKey]?.toLowerCase().trim();
    const correctAnswer = correctBlanks[blankKey]?.toLowerCase().trim();
    const isBlankCorrect = userAnswer === correctAnswer;

    if (isBlankCorrect) {
      correctCount++;
    }

    blankResults[blankKey] = {
      userAnswer: userBlanks[blankKey],
      correctAnswer: correctBlanks[blankKey],
      isCorrect: isBlankCorrect,
    };
  });

  // Use actual correct/total format instead of percentage
  const score = correctCount; // Show actual correct count
  const isCorrect = correctCount >= Math.ceil(totalBlanks * 0.65); // 65% threshold

  // // Generate AI feedback
  // const aiFeedback = await generateFillInTheBlanksAIFeedback(
  //   question,
  //   userResponse,
  //   blankResults,
  //   score,
  // );

  // Generate detailed explanation for reading questions using AI
  let explanation = '';
  try {
    // explanation = await generateDynamicExplanationFillBlanks({
    //   questionType: question.questionType.name,
    //   textContent: question.textContent,
    //   blankResults,
    //   correctCount,
    //   totalBlanks,
    // });

    explanation = await generateAnswerExplanation({
      questionText: question.textContent!,
      blankResults,
    });
  } catch (error) {
    console.error('Error generating explanation:', error);
    // Fallback to static explanation
    const incorrectBlanks = Object.entries(blankResults)
      .filter(([_, result]: [string, any]) => !result.isCorrect)
      .map(([blankKey, result]: [string, any]) => {
        const blankNumber = blankKey.replace('blank', '');
        return `Blank ${blankNumber}: You wrote "${
          result.userAnswer || '(empty)'
        }", correct answer is "${result.correctAnswer}"`;
      });

    if (incorrectBlanks.length > 0) {
      explanation = `Incorrect answers: ${incorrectBlanks.join('; ')}. `;
    }

    explanation += `Consider the context around each blank for grammatical and meaning clues.`;
  }

  return {
    score: { scored: correctCount, max: totalBlanks },
    isCorrect,
    feedback: `You filled ${correctCount} out of ${totalBlanks} blanks correctly.`,
    suggestions: isCorrect
      ? ['Great work! You understood the context well.']
      : [
          'Read the entire passage first to understand the overall meaning',
          'Look for grammatical clues around each blank (verb forms, articles, etc.)',
          'Consider the logical flow and meaning of the sentence',
          'Pay attention to collocations (words that commonly go together)',
          'Check if your answer fits grammatically and semantically',
        ],
    detailedAnalysis: {
      scores: {
        reading: { score: correctCount, max: totalBlanks },
      },
      feedback: {
        summary: `You filled ${correctCount} out of ${totalBlanks} blanks correctly.`,
      },
      timeTaken: timeTakenSeconds || 0,
      itemResults: blankResults,
      explanation,
    },
  };
}

async function generateAnswerExplanation({
  questionText,
  blankResults,
}: {
  questionText: string;
  blankResults: any;
}): Promise<string> {
  const prompt = `
You are a PTE expert trainer.

Your job is to explain the correct answers in a detailed, paragraph-style explanation (like a teacher).

**Passage:**
${questionText}

**Answers:**
${Object.entries(blankResults)
  .map(
    ([key, val]: any, index) =>
      `${index + 1}. User="${val.userAnswer}", Correct="${val.correctAnswer}"`,
  )
  .join('\n')}

### Instructions:
- Write explanation in structured paragraphs (NOT blank-wise labels)
- Explain:
  - why correct word fits (grammar + meaning)
  - why other options are incorrect
- Use simple teaching tone
- Keep it clear and readable
- Use numbering (1, 2, 3...) but NOT "Blank 1"

### Example Style:
1. The word that best fits is "enabled". The sentence requires...

2. The word that best fits is "interconnected"...

Do NOT return JSON. Return plain text.
`;

  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.3,
    max_tokens: 900,
  });

  return response.choices[0]?.message?.content || '';
}

// LISTENING QUESTION EVALUATION
/**
 * Evaluate Summarize Spoken Text responses
 */
async function evaluateSummarizeSpokenText(
  question: Question,
  userResponse: any,
  timeTakenSeconds?: number,
): Promise<QuestionEvaluationResult> {
  const userText = userResponse.text || '';
  const wordCount = userText
    .split(/\s+/)
    .filter((word: string | any[]) => word.length > 0).length;

  const prompt = `
**Role:** Expert PTE Grader (Summarize Spoken Text).
**Input:** - Transcript: "${question.textContent}"
- User Response: "${userText}"
- Count: ${wordCount}

---
### **1. Pre-Scoring Evaluation (MANDATORY)**
**Step A: Content selection:**
- Identify "Important Idea Phrases": Main idea, key supporting points, emphasized concepts, and results.
- **Rule:** Full paraphrasing is NOT required. Direct phrases from the lecture are ALLOWED.
- **Goal:** Minimum 4–5 relevant phrases for full marks.

**Step B: Sentence Formation Check (CRITICAL):**
- **Rule:** Must be ONE complete sentence.
- **Strict Fragment Check:** Phrases like "the speaker mentioned that..." MUST be followed by a complete clause (Subject + Verb). If only keywords follow, apply Grammar penalty.

---
### **2. Scoring Rubrics**
1. **Content (0-4):** Priority is idea coverage over grammar.
   - 4: Includes 4–5 key ideas logically connected.
   - 3: 3 relevant ideas. 2: 2 ideas. 1: 1 idea. 0: Off-topic.

2. **Form (0-2):**
   - 2: Exactly ONE complete sentence AND 5–75 words.
   - 0: Not one sentence OR outside 5–75 word limit.

3. **Grammar (0-2):** Base 2. Deduct **0.25 per error**.
   - **Articles:** Check for "the" before specific phrases and "of" phrases (e.g., "the importance of...").
   - **Continuous Form:** Verbs after "about, focuses on, related to, involves" MUST be in -ing form.
   - **Parallelism:** Ensure verb forms match in lists (e.g., "reducing and protecting").
   - **Connectors:** Words like "Firstly, Moreover, Overall" MUST be followed by a full clause.

4. **Vocabulary (0-2):** 2: Academic word choice. 1: Basic. 0: Poor choice/obscured meaning.

5. **Spelling (0-2):** Base 2. Deduct **0.5 per error**. Min 0.

---
### **3. Error Analysis & Output**
**Positioning:** 0-indexed. Split on whitespace only.
**Error Object:** {"text":"","type":"","position":{"start":0,"end":0},"context":{"before":"","after":""},"correction":"","explanation":""}

**Format:** Return ONLY minified JSON.
{
  "scores": {"content":0, "form":0, "grammar":0, "vocabulary":0, "spelling":0},
  "feedback": {"content":"","form":"","grammar":"","vocabulary":"","spelling":""},
  "errorAnalysis": {"grammarErrors":[], "spellingErrors":[], "vocabularyIssues":[] }
}
`;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content:
            'You are a helpful assistant designed to output JSON for PTE Academic evaluation.',
        },
        { role: 'user', content: prompt },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.3,
    });

    const evaluation = JSON.parse(response.choices[0].message.content || '{}');

    // Extract individual scores for each trait
    const scores = evaluation.scores || {};
    const contentScore = scores.content || 0;
    const formScore = scores.form || 0;
    const grammarScore = scores.grammar || 0;
    const vocabularyScore = scores.vocabulary || 0;
    const spellingScore = scores.spelling || 0;

    // Calculate the total achieved score and the total possible score
    const totalAchievedScore =
      contentScore + formScore + grammarScore + vocabularyScore + spellingScore;
    const totalMaxScore = 9;

    // Calculate the overall score as actual points earned
    const overallScore = totalAchievedScore;

    // Calculate percentage for isCorrect check (65% threshold)
    const percentageScore = Math.round(
      (totalAchievedScore / totalMaxScore) * 100,
    );

    return {
      score: { scored: overallScore, max: totalMaxScore },
      isCorrect: percentageScore >= 65,
      feedback:
        evaluation.feedback?.summary ||
        'Spoken text summary evaluated successfully.',
      suggestions: evaluation.suggestions || [
        'Focus on main ideas from the audio',
        'Stay within word count limits (50-70 words)',
        'Use proper grammar and vocabulary',
      ],
      detailedAnalysis: {
        scores: {
          content: { score: contentScore, max: 4 },
          form: { score: formScore, max: 2 },
          grammar: { score: grammarScore, max: 2 },
          vocabulary: { score: vocabularyScore, max: 2 },
          spelling: { score: spellingScore, max: 2 },
        },
        feedback: {
          content: evaluation.feedback?.content || '',
          form: evaluation.feedback?.form || '',
          grammar: evaluation.feedback?.grammar || '',
          vocabulary: evaluation.feedback?.vocabulary || '',
          spelling: evaluation.feedback?.spelling || '',
        },
        timeTaken: timeTakenSeconds || 0,
        userText: userText,
        wordCount: wordCount,
        errorAnalysis: evaluation.errorAnalysis || {
          grammarErrors: [],
          spellingErrors: [],
          vocabularyIssues: [],
        },
      },
    };
  } catch (error) {
    console.error('OpenAI evaluation error for Summarize Spoken Text:', error);
    return {
      score: { scored: 0, max: 9 },
      isCorrect: false,
      feedback: 'Unable to evaluate response at this time.',
      suggestions: ['Please try again later'],
      detailedAnalysis: {
        scores: {
          content: { score: 0, max: 4 },
          form: { score: 0, max: 2 },
          grammar: { score: 0, max: 2 },
          vocabulary: { score: 0, max: 2 },
          spelling: { score: 0, max: 2 },
        },
        feedback: { summary: 'Unable to evaluate response at this time.' },
        timeTaken: timeTakenSeconds || 0,
        userText: userText,
        wordCount: wordCount,
      },
    };
  }
}

/**
 * Evaluate Highlight Incorrect Words responses
 */
async function evaluateHighlightIncorrectWords(
  question: Question,
  userResponse: any,
  timeTakenSeconds?: number,
): Promise<QuestionEvaluationResult> {
  const highlightedWords = userResponse.highlightedWords || [];
  const incorrectWords = question.incorrectWords || [];
  const wordMapping = (question.correctAnswers as any)?.wordMapping || [];

  // Helper function to clean words (remove punctuation for comparison)
  const cleanWord = (word: string): string => {
    return word.replace(/[^\w]/g, '').toLowerCase();
  };

  // Create cleaned versions for comparison
  const cleanedHighlighted = highlightedWords.map(cleanWord);
  const cleanedIncorrect = incorrectWords.map(cleanWord);

  const correctHighlights = highlightedWords.filter((word: string) => {
    const cleanedWord = cleanWord(word);
    return cleanedIncorrect.includes(cleanedWord);
  }).length;

  const incorrectHighlights = highlightedWords.filter((word: string) => {
    const cleanedWord = cleanWord(word);
    return !cleanedIncorrect.includes(cleanedWord);
  }).length;

  // Build mapping info for analysis (shows what the correct words were)
  const mappingInfo =
    wordMapping.length > 0
      ? wordMapping.map((mapping: any) => ({
          correct: mapping.correct,
          incorrect: mapping.incorrect,
          wasHighlighted: cleanedHighlighted.includes(
            cleanWord(mapping.incorrect),
          ),
        }))
      : [];

  // Use correct/total format like Fill in the Blanks
  const score = correctHighlights; // Show actual correct highlights count
  const isCorrect =
    correctHighlights === incorrectWords.length && incorrectHighlights === 0;

  return {
    score: { scored: correctHighlights, max: incorrectWords.length },
    isCorrect,
    feedback: `You correctly identified ${correctHighlights} out of ${incorrectWords.length} incorrect words and incorrectly highlighted ${incorrectHighlights} correct words.`,
    suggestions: [
      'Listen carefully to identify differences between audio and text',
      'Focus on pronunciation and word stress patterns',
      'Practice with different accents and speaking speeds',
    ],
    detailedAnalysis: {
      scores: {
        listening: { score: correctHighlights, max: incorrectWords.length },
      },
      feedback: {
        summary: `You correctly identified ${correctHighlights} out of ${incorrectWords.length} incorrect words and incorrectly highlighted ${incorrectHighlights} correct words.`,
      },
      timeTaken: timeTakenSeconds || 0,
      correctAnswer: incorrectWords.join(', ') || undefined,
      highlightResult: {
        highlightedWords,
        incorrectWords,
        cleanedHighlighted,
        cleanedIncorrect,
        correctHighlights,
        incorrectHighlights,
        wordMapping: mappingInfo,
      },
    },
  };
}

/**
 * Evaluate Write from Dictation responses
 */
async function evaluateWriteFromDictation(
  question: Question,
  userResponse: any,
  timeTakenSeconds?: number,
): Promise<QuestionEvaluationResult> {
  const userText = userResponse.text?.toLowerCase().trim() || '';
  const correctTextLower = question.textContent?.toLowerCase().trim() || '';
  const correctTextOriginal = question.textContent?.trim() || '';

  // Calculate word-level accuracy (order-independent)
  const userWords = userText
    .split(/\s+/)
    .filter((word: string | any[]) => word.length > 0);
  const correctWords = correctTextLower
    .split(/\s+/)
    .filter((word: string | any[]) => word.length > 0);

  // Validate inputs
  if (correctWords.length === 0) {
    return {
      score: { scored: 0, max: 0 },
      isCorrect: false,
      feedback: 'No correct answer defined for this question.',
      suggestions: [
        'Focus on spelling accuracy',
        'Listen for punctuation cues in the audio',
        'Practice typing while listening to improve speed and accuracy',
      ],
      detailedAnalysis: {
        scores: { listening: { score: 0, max: 0 } },
        feedback: { summary: 'No correct answer defined for this question.' },
        timeTaken: timeTakenSeconds || 0,
        userText: userResponse.text || '',
        errorAnalysis: {
          spellingErrors: [],
          grammarErrors: [],
          vocabularyIssues: [],
        },
      },
    };
  }

  // Helper function to calculate Levenshtein distance (similarity)
  const levenshteinDistance = (str1: string, str2: string): number => {
    const m = str1.length;
    const n = str2.length;
    const dp: number[][] = Array(m + 1)
      .fill(null)
      .map(() => Array(n + 1).fill(0));

    for (let i = 0; i <= m; i++) dp[i][0] = i;
    for (let j = 0; j <= n; j++) dp[0][j] = j;

    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
        if (str1[i - 1] === str2[j - 1]) {
          dp[i][j] = dp[i - 1][j - 1];
        } else {
          dp[i][j] = 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
        }
      }
    }
    return dp[m][n];
  };

  // Helper function to check similarity (words are similar if distance is <= 2)
  const areSimilar = (word1: string, word2: string): boolean => {
    const distance = levenshteinDistance(word1, word2);
    const maxLen = Math.max(word1.length, word2.length);
    // Consider similar if distance is small relative to word length
    return distance <= Math.max(2, Math.ceil(maxLen * 0.25));
  };

  // Check if all correct words are present in user response (regardless of order)
  let correctWordCount = 0;
  const missingWords: string[] = [];
  const spellingMistakes: { userWord: string; correctWord: string }[] = [];
  const userWordsCopy = [...userWords];
  const userWordsUsed = new Set<number>(); // Track which user words have been matched

  // First pass: exact matches
  for (const correctWord of correctWords) {
    const index = userWordsCopy.findIndex(
      (w, idx) => w === correctWord && !userWordsUsed.has(idx),
    );
    if (index !== -1) {
      correctWordCount++;
      userWordsUsed.add(index);
    }
  }

  // Second pass: find spelling mistakes (similar words for unmatched correct words)
  for (const correctWord of correctWords) {
    const hasExactMatch = userWordsCopy.some(
      (w, idx) => w === correctWord && userWordsUsed.has(idx),
    );
    if (!hasExactMatch) {
      const similarIndex = userWordsCopy.findIndex(
        (w, idx) => !userWordsUsed.has(idx) && areSimilar(w, correctWord),
      );
      if (similarIndex !== -1) {
        spellingMistakes.push({
          userWord: userWordsCopy[similarIndex],
          correctWord,
        });
        userWordsUsed.add(similarIndex);
      } else {
        missingWords.push(correctWord);
      }
    }
  }

  // Remaining words in userWordsCopy are truly extra/unnecessary words
  const extraWordsInResponse = userWordsCopy.filter(
    (_, idx) => !userWordsUsed.has(idx),
  );

  const accuracy =
    correctWords.length > 0
      ? (correctWordCount / correctWords.length) * 100
      : 0;
  const isCorrect =
    accuracy === 100 &&
    extraWordsInResponse.length === 0 &&
    spellingMistakes.length === 0; // Must have all correct words, no extra words, and no spelling mistakes

  // Generate error analysis for incorrect words
  const errorAnalysis = {
    spellingErrors: [] as any[],
    grammarErrors: [] as any[],
    vocabularyIssues: [] as any[],
  };

  // Add spelling mistakes to error analysis
  for (const mistake of spellingMistakes) {
    errorAnalysis.spellingErrors.push({
      text: mistake.userWord,
      type: 'spelling_error',
      position: { start: 0, end: 1 },
      correction: mistake.correctWord,
      explanation: `Spelling mistake: "${mistake.userWord}" should be "${mistake.correctWord}"`,
    });
  }

  // Add missing words to error analysis (as vocabulary/listening issues)
  for (const missingWord of missingWords) {
    errorAnalysis.vocabularyIssues.push({
      text: missingWord,
      type: 'missing_word',
      position: { start: 0, end: 1 },
      correction: missingWord,
      explanation: `You missed the word: "${missingWord}"`,
    });
  }

  // Add extra words to error analysis (as unnecessary additions)
  for (const extraWord of extraWordsInResponse) {
    errorAnalysis.grammarErrors.push({
      text: extraWord,
      type: 'unnecessary_word',
      position: { start: 0, end: 1 },
      correction: '',
      explanation: `Unnecessary word that should be removed: "${extraWord}"`,
    });
  }

  // Use correct/total format
  const score = correctWordCount;

  return {
    score: { scored: correctWordCount, max: correctWords.length },
    isCorrect,
    feedback:
      correctWordCount === correctWords.length &&
      extraWordsInResponse.length === 0 &&
      spellingMistakes.length === 0
        ? `Perfect! You typed all ${correctWords.length} words correctly.`
        : `You typed ${correctWordCount} out of ${
            correctWords.length
          } words correctly.${
            spellingMistakes.length > 0
              ? ` Spelling mistakes: ${spellingMistakes
                  .map((m) => `"${m.userWord}" → "${m.correctWord}"`)
                  .join(', ')}.`
              : ''
          }${
            missingWords.length > 0
              ? ` Missing: ${missingWords.join(', ')}.`
              : ''
          }${
            extraWordsInResponse.length > 0
              ? ` Extra words: ${extraWordsInResponse.join(', ')}.`
              : ''
          }`,
    suggestions: [
      'Focus on spelling accuracy',
      'Listen for punctuation cues in the audio',
      'Practice typing while listening to improve speed and accuracy',
      'Make sure all words are present and no extra words are added',
    ],
    detailedAnalysis: {
      scores: {
        listening: { score: correctWordCount, max: correctWords.length },
      },
      feedback: {
        summary:
          correctWordCount === correctWords.length &&
          extraWordsInResponse.length === 0 &&
          spellingMistakes.length === 0
            ? `Perfect! You typed all ${correctWords.length} words correctly.`
            : `You typed ${correctWordCount} out of ${correctWords.length} words correctly.`,
      },
      timeTaken: timeTakenSeconds || 0,
      userText: userResponse.text || '',
      correctAnswer: correctTextOriginal || undefined,
      errorAnalysis,
    },
  };
}

/**
 * Evaluate Highlight Correct Summary responses
 */
async function evaluateHighlightCorrectSummary(
  question: Question,
  userResponse: any,
  timeTakenSeconds?: number,
): Promise<QuestionEvaluationResult> {
  const selectedSummary =
    userResponse.selectedSummary || userResponse.selectedOptions?.[0];
  const correctAnswers = question.options.filter((opt: any) => opt.isCorrect);

  const correctAnswerIds = correctAnswers.map((opt: any) => opt.id);

  const isCorrect = correctAnswerIds.includes(selectedSummary);
  // Use 1/0 format for single answer questions
  const score = isCorrect ? 1 : 0;

  // const correctOrderText = question.correctAnswers.correctOrder.map(
  //   (id: string) => {
  //     const item = question.options.find((opt: any) => opt.id === id);
  //     return item ? item.text : null;
  //   }
  // );
  // const userOrderText = userResponse.orderedParagraphs.map((id: string) => {
  //   const item = question.options.find((opt: any) => opt.id === id);
  //   return item ? item.text : null;
  // });
  const userSelectedText = question.options.filter(
    (option: any) => option.id === selectedSummary,
  )[0].text;

  const correctOptionText = correctAnswers[0].text;

  // Generate explanation for correct/incorrect answers
  let explanation = '';
  try {
    explanation = await generateDynamicExplanationListening({
      questionType: 'HIGHLIGHT_CORRECT_SUMMARY',
      questionStatement: question.questionStatement,
      selectedAnswer: userSelectedText,
      correctAnswer: correctOptionText,
      allOptions: question.options,
      isCorrect: isCorrect,
    });
  } catch (error) {
    console.error(
      'Error generating explanation for HIGHLIGHT_CORRECT_SUMMARY:',
      error,
    );
    explanation = '';
  }

  return {
    score: { scored: score, max: 1 },
    isCorrect,
    feedback: isCorrect
      ? 'Correct! You selected the best summary.'
      : 'Incorrect. The selected summary does not best represent the audio content.',
    suggestions: isCorrect
      ? ['Excellent listening comprehension!']
      : [
          'Focus on main ideas rather than details',
          'Listen for the overall theme and purpose',
          'Practice identifying key information in audio content',
        ],
    detailedAnalysis: {
      scores: {
        listening: { score, max: 1 },
      },
      feedback: {
        summary: isCorrect
          ? 'Correct! You selected the best summary.'
          : 'Incorrect. The selected summary does not best represent the audio content.',
      },
      timeTaken: timeTakenSeconds || 0,
      correctAnswer: correctOptionText,
      choiceResult: {
        selectedTexts: [userSelectedText],
        correctTexts: [correctOptionText],
        incorrectlySelectedTexts: isCorrect ? [] : [userSelectedText],
        missedCorrectTexts: isCorrect ? [] : [correctOptionText],
        explanation: explanation,
      },
    },
  };
}

/**
 * Evaluate Select Missing Word responses
 */
async function evaluateSelectMissingWord(
  question: Question,
  userResponse: any,
  timeTakenSeconds?: number,
): Promise<QuestionEvaluationResult> {
  const selectedWord =
    userResponse.selectedWord || userResponse.selectedOptions?.[0];
  const correctAnswers = question.options.filter((opt: any) => opt.isCorrect);
  const correctAnswerIds = correctAnswers.map((opt: any) => opt.id);

  const isCorrect = correctAnswerIds.includes(selectedWord);
  // Use 1/0 format for single answer questions
  const score = isCorrect ? 1 : 0;

  const selectedOptionText = question.options.filter(
    (opt: any) => opt.id === selectedWord,
  )[0].text;
  const correctOptionText = correctAnswers[0].text;

  // Generate explanation for incorrect answers
  let explanation = '';
  try {
    explanation = await generateDynamicExplanationListening({
      questionType: 'SELECT_MISSING_WORD',
      questionStatement: question.questionStatement,
      selectedAnswer: selectedOptionText,
      correctAnswer: correctOptionText,
      allOptions: question.options,
      isCorrect: isCorrect,
    });
  } catch (error) {
    console.error(
      'Error generating explanation for SELECT_MISSING_WORD:',
      error,
    );
    explanation = '';
  }

  return {
    score: { scored: score, max: 1 },
    isCorrect,
    feedback: isCorrect
      ? 'Correct! You identified the missing word accurately.'
      : 'Incorrect. Listen again for context clues about the missing word.',
    suggestions: isCorrect
      ? ['Great listening skills!']
      : [
          'Pay attention to context and meaning',
          'Listen for grammatical clues',
          'Consider the logical flow of the sentence',
        ],
    detailedAnalysis: {
      scores: {
        listening: { score, max: 1 },
      },
      feedback: {
        summary: isCorrect
          ? `Correct! You selected: "${selectedOptionText}"`
          : `Incorrect. You selected: "${selectedOptionText}". The correct answer is: "${correctOptionText}"`,
      },
      explanation: explanation,
      timeTaken: timeTakenSeconds || 0,
      correctAnswer: correctOptionText,
      choiceResult: {
        selectedTexts: [selectedOptionText],
        correctTexts: [correctOptionText],
        incorrectlySelectedTexts: isCorrect ? [] : [selectedOptionText],
        missedCorrectTexts: isCorrect ? [] : [correctOptionText],
      },
    },
  };
}

/**
 * Evaluate Listening Fill in the Blanks responses with flexible text matching
 */
async function evaluateListeningFillInTheBlanks(
  question: Question,
  userResponse: any,
  timeTakenSeconds?: number,
): Promise<QuestionEvaluationResult> {
  const userBlanks = userResponse.blanks || {};

  // Extract correct answers from the options array
  const correctBlanks: { [key: string]: string } = {};

  // The question.options contains the blanks with their correct answers
  if (question.options && Array.isArray(question.options)) {
    question.options.forEach((blank: any, index: number) => {
      const blankKey = `blank${index + 1}`;
      correctBlanks[blankKey] = blank.correctAnswer;
    });
  }

  let correctCount = 0;
  let totalBlanks = 0;
  const blankResults: any = {};

  Object.keys(correctBlanks).forEach((blankKey) => {
    totalBlanks++;
    const userAnswer = userBlanks[blankKey]?.toLowerCase().trim();
    const correctAnswer = correctBlanks[blankKey]?.toLowerCase().trim();

    // More flexible matching for listening questions
    const isBlankCorrect = isListeningAnswerCorrect(userAnswer, correctAnswer);

    if (isBlankCorrect) {
      correctCount++;
    }

    blankResults[blankKey] = {
      userAnswer: userBlanks[blankKey],
      correctAnswer: correctBlanks[blankKey],
      isCorrect: isBlankCorrect,
    };
  });

  // Use actual correct/total format instead of percentage
  const score = correctCount; // Show actual correct count
  const isCorrect = correctCount >= Math.ceil(totalBlanks * 0.6); // 60% threshold for listening

  // Generate AI feedback for listening
  const aiFeedback = await generateListeningFillInTheBlanksAIFeedback(
    question,
    userResponse,
    blankResults,
    score,
  );

  // Generate formal explanation for incorrect blanks
  let explanation = '';
  if (!isCorrect) {
    try {
      // Get first incorrect blank for explanation
      const firstIncorrectBlank = Object.entries(blankResults).find(
        ([_, result]: [string, any]) => !result.isCorrect,
      ) as [string, any] | undefined;

      if (firstIncorrectBlank) {
        const [blankKey, result] = firstIncorrectBlank;
        explanation = await generateDynamicExplanationListeningFillBlanks({
          questionType: 'LISTENING_FILL_IN_THE_BLANKS',
          userAnswer: result.userAnswer,
          correctAnswer: result.correctAnswer,
          blankContext: question.questionStatement || '',
          allIncorrectBlanks: Object.entries(blankResults)
            .filter(([_, b]: [string, any]) => !b.isCorrect)
            .map(([_, b]: [string, any]) => ({
              userAnswer: b.userAnswer,
              correctAnswer: b.correctAnswer,
            })),
        });
      }
    } catch (error) {
      console.error(
        'Error generating explanation for LISTENING_FILL_IN_THE_BLANKS:',
        error,
      );
      explanation = '';
    }
  }

  // Generate error analysis for incorrect blanks
  const errorAnalysis = {
    spellingErrors: [] as any[],
    grammarErrors: [] as any[],
    vocabularyIssues: [] as any[],
  };

  // Create a text representation for error highlighting
  let userText = '';
  let correctText = '';

  Object.keys(correctBlanks).forEach((blankKey, index) => {
    const userAnswer = userBlanks[blankKey] || '(blank)';
    const correctAnswer = correctBlanks[blankKey];
    const isBlankCorrect = blankResults[blankKey].isCorrect;

    if (index > 0) {
      userText += ' ';
      correctText += ' ';
    }

    userText += userAnswer;
    correctText += correctAnswer;

    // Add error if blank is incorrect
    if (!isBlankCorrect && userAnswer !== '(blank)') {
      errorAnalysis.spellingErrors.push({
        text: userAnswer,
        type: 'spelling',
        position: { start: 0, end: 1 },
        correction: correctAnswer,
        explanation: `Incorrect word for blank ${
          index + 1
        }. Expected: "${correctAnswer}"`,
      });
    }
  });

  return {
    score: { scored: correctCount, max: totalBlanks },
    isCorrect,
    feedback: aiFeedback.feedback,
    suggestions: aiFeedback.suggestions,
    detailedAnalysis: {
      scores: {
        listening: { score: correctCount, max: totalBlanks },
      },
      feedback: {
        summary: aiFeedback.feedback,
      },
      timeTaken: timeTakenSeconds || 0,
      userText,
      itemResults: blankResults,
      errorAnalysis,
    },
  };
}

/**
 * Check if listening answer is correct.
 * This now requires an exact match after cleaning.
 */
function isListeningAnswerCorrect(
  userAnswer: string,
  correctAnswer: string,
): boolean {
  if (!userAnswer || !correctAnswer) return false;

  const user = userAnswer.toLowerCase().trim();
  const correct = correctAnswer.toLowerCase().trim();

  // 1. Check for a direct exact match first
  if (user === correct) return true;

  // 2. Check for a match after removing punctuation and extra spaces
  // This allows for "end." to match "end"
  const cleanUser = user
    .replace(/[^\w\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  const cleanCorrect = correct
    .replace(/[^\w\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  // Only return true if the cleaned versions match exactly.
  // Misspellings like "discovry" vs "discovery" will now correctly
  // return false.
  return cleanUser === cleanCorrect;
}

/**
 * Generate AI feedback for listening fill in the blanks
 */
async function generateListeningFillInTheBlanksAIFeedback(
  question: Question,
  userResponse: any,
  blankResults: any,
  score: number,
): Promise<{ feedback: string; suggestions: string[] }> {
  const correctCount = Object.values(blankResults).filter(
    (result: any) => result.isCorrect,
  ).length;
  const totalBlanks = Object.keys(blankResults).length;

  let feedback = '';
  const suggestions: string[] = [];

  if (score >= 80) {
    feedback = `Excellent listening comprehension! You correctly identified ${correctCount} out of ${totalBlanks} words.`;
    suggestions.push('Continue practicing with varied audio content');
    suggestions.push('Focus on maintaining this level of accuracy');
  } else if (score >= 60) {
    feedback = `Good listening skills! You got ${correctCount} out of ${totalBlanks} words correct.`;
    suggestions.push('Listen for context clues to help identify missing words');
    suggestions.push('Pay attention to grammatical patterns');
    suggestions.push('Practice with similar audio content');
  } else {
    feedback = `Keep practicing your listening skills. You identified ${correctCount} out of ${totalBlanks} words correctly.`;
    suggestions.push('Listen to the audio multiple times if allowed');
    suggestions.push('Focus on understanding the overall meaning first');
    suggestions.push('Pay attention to word stress and pronunciation');
    suggestions.push('Practice with shorter audio clips to build confidence');
  }

  // Add specific feedback for incorrect answers
  const incorrectBlanks = Object.entries(blankResults)
    .filter(([_, result]: [string, any]) => !result.isCorrect)
    .slice(0, 2); // Limit to first 2 incorrect answers

  if (incorrectBlanks.length > 0) {
    feedback += '\n\nSpecific areas to focus on:\n';
    incorrectBlanks.forEach(([blankKey, result]: [string, any]) => {
      const blankNumber = blankKey.replace('blank', '');
      feedback += `• Blank ${blankNumber}: You wrote "${
        result.userAnswer || '(empty)'
      }", but the correct answer is "${result.correctAnswer}"\n`;
    });
  }

  return { feedback, suggestions };
}

/**
 * Generate dynamic explanation using AI for reading questions
 */
async function generateDynamicExplanation(params: {
  questionType: string;
  textContent?: string | null;
  questionStatement?: string | null;
  selectedAnswer: string;
  correctAnswer: string;
  allOptions?: any;
  isCorrect?: boolean;
}): Promise<string> {
  const {
    questionType,
    textContent,
    questionStatement,
    selectedAnswer,
    correctAnswer,
    allOptions,
    isCorrect,
  } = params;

  try {
    const prompt = `
You are an expert PTE Academic tutor providing detailed explanations for reading questions.

**Question Type:** ${questionType}

**Passage/Text:**
${textContent || 'No passage provided'}

**Question Statement:**
${questionStatement || 'No specific question statement'}

**All Answer Options:**
${
  allOptions
    ? allOptions.map((opt: any) => `• ${opt.text}`).join('\n')
    : 'Options not available'
}

**Your Answer:** ${selectedAnswer}
**Correct Answer:** ${correctAnswer}

${isCorrect ? "The user's answer is CORRECT." : "The user's answer is INCORRECT."}

Provide a brief explanation (2-3 lines maximum):
${
  !isCorrect &&
  `Explain why the correct answer is right with evidence from the passage, and explain why their selected answer was wrong or what they missed.`
}

IMPORTANT RULES:
- Always refer to the user in **second person** only.

- NEVER use:
  - "My answer"
  - "I selected"
  - "We chose"

Be direct and focus only on what is correct and what is wrong. No tips or additional advice needed.
Use line breaks to separate the two points.
`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content:
            'You are an expert PTE Academic tutor specializing in reading comprehension questions.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      max_tokens: 200,
      temperature: 0.3,
    });

    return (
      response.choices[0]?.message?.content?.trim() ||
      'Unable to generate explanation.'
    );
  } catch (error) {
    console.error('Error generating dynamic explanation:', error);
    throw error;
  }
}

/**
 * Generate dynamic explanation using AI for multiple choice multiple answers questions
 */
async function generateDynamicExplanationMultiple(params: {
  questionType: string;
  textContent?: string | null;
  questionStatement?: string | null;
  selectedAnswers: string[];
  correctAnswers: string[];
  incorrectlySelected: string[];
  missedCorrect: string[];
  allOptions?: any;
}): Promise<string> {
  const {
    questionType,
    textContent,
    questionStatement,
    selectedAnswers,
    correctAnswers,
    incorrectlySelected,
    missedCorrect,
    allOptions,
  } = params;

  try {
    const prompt = `
You are an expert PTE Academic tutor providing detailed explanations for multiple choice multiple answers reading questions.

**Question Type:** ${questionType}

**Passage/Text:**
${textContent || 'No passage provided'}

**Question Statement:**
${questionStatement || 'No specific question statement'}

**All Answer Options:**
${
  allOptions
    ? allOptions.map((opt: any) => `• ${opt.text}`).join('\n')
    : 'Options not available'
}

**Your Selected Answers:** ${selectedAnswers.join(', ')}
**Correct Answers:** ${correctAnswers.join(', ')}
**Incorrectly Selected:** ${
      incorrectlySelected.length > 0 ? incorrectlySelected.join(', ') : 'None'
    }
**Answers You Missed:** ${
      missedCorrect.length > 0 ? missedCorrect.join(', ') : 'None'
    }

Provide a brief explanation (3-4 lines maximum) that:
1. Explains why each correct answer is right with specific evidence from the passage
2. Explains why your incorrectly selected options were wrong or what you missed

IMPORTANT RULES:
- Always refer to the user in **second person** only.
- You MUST use phrases like:
  - "Your answer was incorrect because..."
  - "Your selection was incomplete because..."
- NEVER use:
  - "My answer"
  - "I selected"
  - "We chose"

Be direct and focus only on what is correct and what is wrong. No tips or additional advice needed.
`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content:
            'You are an expert PTE Academic tutor specializing in multiple choice multiple answers reading questions.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      max_tokens: 250,
      temperature: 0.3,
    });

    return (
      response.choices[0]?.message?.content?.trim() ||
      'Unable to generate explanation.'
    );
  } catch (error) {
    console.error(
      'Error generating dynamic explanation for multiple choice:',
      error,
    );
    throw error;
  }
}

/**
 * Generate dynamic explanation using AI for reorder paragraphs questions
 */
async function generateDynamicExplanationReorder(params: {
  questionType: string;
  textContent?: string | null;
  correctOrderText: Array<{ id: string; text: string }>;
}): Promise<string> {
  const { questionType, textContent, correctOrderText } = params;

  try {
    // Format the correct paragraph order with full text and indexes
    const correctOrderFormatted = correctOrderText
      .map((item, index) => `Paragraph ${index + 1}: "${item.text}"`)
      .join('\n\n');

    const prompt = `
You are an expert PTE Academic tutor explaining reading comprehension concepts.

**Question Type:** ${questionType}

**Correct Paragraph Order:**
${correctOrderFormatted}

Your task is to explain WHY this is the correct paragraph order.

Provide a clear explanation (4-5 sentences) that:
1. Describes the logical flow by referencing the ACTUAL paragraph text/content
2. Explains how each paragraph connects to the next
3. Identifies key transitions, topic connections, or structural clues
4. Helps the reader understand the coherent progression of ideas

Guidelines:
- Reference paragraphs by QUOTING their actual content or the START of the paragraph text
- Use quotes or paraphrasing directly from the paragraphs themselves
- Example: "The paragraph '...[actual start text]...' introduces X, which connects to the next paragraph '...[actual start text]...' because..."
- Explain the PURPOSE of each paragraph in the sequence
- Highlight CONNECTIONS between consecutive paragraphs by referencing their actual themes/content
- Focus on what makes this order CORRECT and logical
- Do NOT reference ordinal numbers like "first", "second", "third"
- Do NOT reference any incorrect ordering or user mistakes
- Use clear, teaching-friendly language
- Show HOW the paragraphs connect through their ACTUAL CONTENT

Example explanation style:
"The passage begins with 'The Japanese tea ceremony holds...' which introduces the foundational significance. This naturally connects to 'The ceremony originated from...' which provides the historical context needed to understand the traditions. This leads to 'The tea ceremony is far more than...' which deepens our understanding of its scope. Finally, 'Mindfulness and aesthetics form...' completes the narrative by exploring the spiritual dimensions that justify the earlier emphasis on its importance."

Do NOT return JSON. Return plain text explanation only.
`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content:
            'You are an expert PTE Academic tutor. Explain why paragraph orders are correct by focusing on logical flow, connections, and coherence using the ACTUAL paragraph content. Never use ordinal numbers like first/second/third. Always reference what the paragraphs actually SAY.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      max_tokens: 300,
      temperature: 0.3,
    });

    return (
      response.choices[0]?.message?.content?.trim() ||
      'The paragraphs are arranged in a logical sequence that creates coherent meaning through their connections and flow.'
    );
  } catch (error) {
    console.error(
      'Error generating dynamic explanation for reorder paragraphs:',
      error,
    );
    throw error;
  }
}

/**
 * Generate explanation for listening questions (single answer choice)
 */
async function generateDynamicExplanationListening(params: {
  questionType: string;
  questionStatement?: string | null;
  audioTranscript?: string | null;
  selectedAnswer: string;
  correctAnswer: string;
  allOptions?: any;
  isCorrect?: boolean;
}): Promise<string> {
  const {
    questionType,
    questionStatement,
    audioTranscript,
    selectedAnswer,
    correctAnswer,
    allOptions,
    isCorrect,
  } = params;

  try {
    const prompt = `
You are an expert PTE Academic tutor providing detailed explanations for listening questions.

**Question Type:** ${questionType}

**Question Statement:**
${questionStatement || 'No specific question statement'}

**Audio Transcript:**
${audioTranscript || 'Transcript not available'}

**All Answer Options:**
${
  allOptions
    ? allOptions.map((opt: any) => `• ${opt.text}`).join('\n')
    : 'Options not available'
}

**Your Answer:** ${selectedAnswer}
**Correct Answer:** ${correctAnswer}

${isCorrect ? "The user's answer is CORRECT." : "The user's answer is INCORRECT."}

Provide a brief explanation (2-3 lines maximum):
${
  isCorrect
    ? `Congratulate them on their correct answer and explain why this answer is right with evidence from the audio.`
    : `Explain why the correct answer is right with evidence from the audio, and explain why their selected answer was wrong or what they missed.`
}

IMPORTANT RULES:
- Always refer to the user in **second person** only.
${
  isCorrect
    ? `- Use encouraging phrases like:
  - "Correct! You selected the right answer because..."
  - "Well done! The correct answer is..."`
    : `- Use phrases like:
  - "Your answer was incorrect because..."
  - "Your selection was incomplete because..."`
}
- NEVER use:
  - "My answer"
  - "I selected"
  - "We chose"

Be direct and focus only on what is correct and what is wrong. No tips or additional advice needed.
Use line breaks to separate the two points.
`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content:
            'You are an expert PTE Academic tutor specializing in listening comprehension questions.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      max_tokens: 200,
      temperature: 0.3,
    });

    return (
      response.choices[0]?.message?.content?.trim() ||
      'Unable to generate explanation.'
    );
  } catch (error) {
    console.error('Error generating dynamic explanation for listening:', error);
    throw error;
  }
}

/**
 * Generate explanation for listening fill in the blanks questions
 */
async function generateDynamicExplanationListeningFillBlanks(params: {
  questionType: string;
  audioTranscript?: string | null;
  userAnswer: string;
  correctAnswer: string;
  blankContext?: string | null;
  allIncorrectBlanks?: any[];
}): Promise<string> {
  const {
    questionType,
    audioTranscript,
    userAnswer,
    correctAnswer,
    blankContext,
    allIncorrectBlanks,
  } = params;

  try {
    const incorrectBlanksText =
      allIncorrectBlanks && allIncorrectBlanks.length > 1
        ? `\n\nOther incorrect answers:\n${allIncorrectBlanks
            .map(
              (b: any) =>
                `• You wrote: "${b.userAnswer}", Correct: "${b.correctAnswer}"`,
            )
            .join('\n')}`
        : '';

    const prompt = `
You are an expert PTE Academic tutor providing detailed explanations for listening fill in the blanks questions.

**Question Type:** ${questionType}

**Question Context:**
${blankContext || 'Context not available'}

**Audio Transcript:**
${audioTranscript || 'Transcript not available'}

**This Blank:**
• Your Answer: "${userAnswer}"
• Correct Answer: "${correctAnswer}"
${incorrectBlanksText}

Provide a brief explanation (2-3 lines maximum) that:
1. Clearly states why the correct answer is right with evidence from the audio
2. Explains why your incorrectly selected options were wrong or what you missed

IMPORTANT RULES:
- Always refer to the user in **second person** only.
- You MUST use phrases like:
  - "Your answer was incorrect because..."
  - "Your selection was incomplete because..."
- NEVER use:
  - "My answer"
  - "I selected"
  - "We chose"

Be direct and focus only on what is correct and what is wrong. No tips or additional advice needed.
Use line breaks to separate the two points.
`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content:
            'You are an expert PTE Academic tutor specializing in listening fill in the blanks questions.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      max_tokens: 200,
      temperature: 0.3,
    });

    return (
      response.choices[0]?.message?.content?.trim() ||
      'Unable to generate explanation.'
    );
  } catch (error) {
    console.error(
      'Error generating dynamic explanation for listening fill in the blanks:',
      error,
    );
    throw error;
  }
}

/**
 * Generate explanation for listening multiple choice multiple answers questions
 */
async function generateDynamicExplanationListeningMultiple(params: {
  questionType: string;
  questionStatement?: string | null;
  audioTranscript?: string | null;
  selectedAnswers: string[];
  correctAnswers: string[];
  incorrectlySelected?: string[];
  missedCorrect?: string[];
  allOptions?: any;
}): Promise<string> {
  const {
    questionType,
    questionStatement,
    audioTranscript,
    selectedAnswers,
    correctAnswers,
    incorrectlySelected,
    missedCorrect,
    allOptions,
  } = params;

  try {
    const prompt = `
You are an expert PTE Academic tutor providing detailed explanations for listening questions with multiple answers.

**Question Type:** ${questionType}

**Question Statement:**
${questionStatement || 'No specific question statement'}

**Audio Transcript:**
${audioTranscript || 'Transcript not available'}

**All Answer Options:**
${
  allOptions
    ? allOptions.map((opt: any) => `• ${opt.text}`).join('\n')
    : 'Options not available'
}

**Correct Answers:** ${correctAnswers
      .map((ans: string) => `"${ans}"`)
      .join(', ')}
**Your Selected Answers:** ${selectedAnswers
      .map((ans: string) => `"${ans}"`)
      .join(', ')}
${
  incorrectlySelected && incorrectlySelected.length > 0
    ? `**Incorrectly Selected:** ${incorrectlySelected
        .map((ans: string) => `"${ans}"`)
        .join(', ')}`
    : ''
}
${
  missedCorrect && missedCorrect.length > 0
    ? `**Answers You Missed:** ${missedCorrect
        .map((ans: string) => `"${ans}"`)
        .join(', ')}`
    : ''
}

Provide a brief explanation (2-3 lines maximum) that:
1. Clearly states which answers are correct and why with evidence from the audio
2. Explains why your selection was incorrect or incomplete

IMPORTANT RULES:
- Always refer to the user in **second person** only.
- You MUST use phrases like:
  - "Your answer was incorrect because..."
  - "Your selection was incomplete because..."
- NEVER use:
  - "My answer"
  - "I selected"
  - "We chose"

Be direct and focus only on what is correct and what is wrong. No tips or additional advice needed.
Use line breaks to separate the two points.
`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content:
            'You are an expert PTE Academic tutor specializing in listening comprehension questions with multiple answers.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      max_tokens: 200,
      temperature: 0.3,
    });

    return (
      response.choices[0]?.message?.content?.trim() ||
      'Unable to generate explanation.'
    );
  } catch (error) {
    console.error(
      'Error generating dynamic explanation for listening multiple answers:',
      error,
    );
    throw error;
  }
}
