import { PteQuestionTypeName } from '@prisma/client';
import openai from '../config/openAi';
import {
  StandardizedEvaluationResponse,
  createComponentScore,
  createItemAnalysis,
  createStandardizedResponse,
} from '../types/evaluationResponse';

interface QuestionEvaluationResult {
  score: number; // 0-100
  isCorrect: boolean;
  feedback: string;
  detailedAnalysis: any; // Keep as any for now, will be converted to StandardizedEvaluationResponse
  suggestions: string[];
}

// Legacy interface for backward compatibility
interface LegacyQuestionEvaluationResult {
  score: number;
  isCorrect: boolean;
  feedback: string;
  detailedAnalysis: any;
  suggestions: string[];
}

/**
 * Converts legacy evaluation results to standardized format
 */
function convertToStandardizedFormat(
  legacyResult: LegacyQuestionEvaluationResult,
  questionType: PteQuestionTypeName,
  timeTaken: number = 0
): StandardizedEvaluationResponse {
  const { score, isCorrect, feedback, detailedAnalysis, suggestions } =
    legacyResult;

  // Create base scoring structure (will be updated based on components)
  let scoring: StandardizedEvaluationResponse['scoring'] = {
    overall: {
      score,
      maxScore: 100,
      percentage: score,
      passingThreshold: 65,
    },
  };

  // Create base analysis structure
  const analysis: StandardizedEvaluationResponse['analysis'] = {
    questionType: questionType.toString(),
    timeTaken,
  };

  // Add question-type specific data based on legacy structure
  if (detailedAnalysis) {
    // Handle audio questions (Read Aloud, Repeat Sentence, etc.)
    if (
      detailedAnalysis.contentScore !== undefined ||
      detailedAnalysis.pronunciationScore !== undefined
    ) {
      const components: any = {};
      let totalMaxScore = 0;

      if (detailedAnalysis.contentScore !== undefined) {
        const contentMaxScore = detailedAnalysis.contentMaxScore || 5;
        components.content = createComponentScore(
          detailedAnalysis.contentScore,
          contentMaxScore,
          0.4,
          'Content accuracy and completeness'
        );
        totalMaxScore += contentMaxScore;
      }

      if (detailedAnalysis.pronunciationScore !== undefined) {
        const pronunciationMaxScore =
          detailedAnalysis.pronunciationMaxScore || 5;
        components.pronunciation = createComponentScore(
          detailedAnalysis.pronunciationScore,
          pronunciationMaxScore,
          0.4,
          'Pronunciation clarity and accuracy'
        );
        totalMaxScore += pronunciationMaxScore;
      }

      if (detailedAnalysis.fluencyScore !== undefined) {
        const fluencyMaxScore = detailedAnalysis.fluencyMaxScore || 5;
        components.fluency = createComponentScore(
          detailedAnalysis.fluencyScore,
          fluencyMaxScore,
          0.2,
          'Speech fluency and rhythm'
        );
        totalMaxScore += fluencyMaxScore;
      }

      scoring.components = components;

      // Update overall scoring with correct max score and percentage
      const percentageScore =
        totalMaxScore > 0 ? Math.round((score / totalMaxScore) * 100) : 0;
      scoring.overall = {
        score,
        maxScore: totalMaxScore,
        percentage: percentageScore,
        passingThreshold: 65,
      };

      analysis.audioAnalysis = {
        recognizedText:
          detailedAnalysis.recognizedText || detailedAnalysis.userText || '',
        pronunciationScore: detailedAnalysis.pronunciationScore || 0,
        fluencyScore: detailedAnalysis.fluencyScore || 0,
        contentAccuracy: detailedAnalysis.contentScore || 0,
        wordByWordAnalysis: detailedAnalysis.wordByWordAnalysis || [],
      };
    }

    // Handle writing questions
    else if (
      detailedAnalysis.scores &&
      typeof detailedAnalysis.scores === 'object'
    ) {
      const components: any = {};
      let totalMaxScore = 0;

      Object.entries(detailedAnalysis.scores).forEach(
        ([key, scoreData]: [string, any]) => {
          if (
            scoreData &&
            typeof scoreData === 'object' &&
            scoreData.score !== undefined
          ) {
            const maxScore = scoreData.max || 1;
            components[key] = createComponentScore(
              scoreData.score,
              maxScore,
              1 / Object.keys(detailedAnalysis.scores).length,
              `${key.charAt(0).toUpperCase() + key.slice(1)} evaluation`
            );
            totalMaxScore += maxScore;
          }
        }
      );

      scoring.components = components;

      // Update overall scoring with correct max score and percentage
      const percentageScore =
        totalMaxScore > 0 ? Math.round((score / totalMaxScore) * 100) : 0;
      scoring.overall = {
        score,
        maxScore: totalMaxScore,
        percentage: percentageScore,
        passingThreshold: 65,
      };

      analysis.textAnalysis = {
        originalText: detailedAnalysis.userText || '',
        grammarScore: detailedAnalysis.scores.grammar?.score || 0,
        vocabularyScore: detailedAnalysis.scores.vocabulary?.score || 0,
        spellingScore: detailedAnalysis.scores.spelling?.score || 0,
        coherenceScore: detailedAnalysis.scores.content?.score || 0,
        errorAnalysis: detailedAnalysis.errorAnalysis || {
          grammarErrors: [],
          spellingErrors: [],
          vocabularyIssues: [],
        },
      };

      if (detailedAnalysis.actualWordCount) {
        analysis.wordCount = detailedAnalysis.actualWordCount;
      }
    }

    // Handle choice-based questions (MCQ, etc.)
    else if (
      detailedAnalysis.selectedOption !== undefined ||
      detailedAnalysis.selectedOptions !== undefined
    ) {
      analysis.choiceAnalysis = {
        selectedOptions: detailedAnalysis.selectedOptions || [
          detailedAnalysis.selectedOption,
        ],
        correctOptions: detailedAnalysis.correctAnswers || [],
        incorrectSelections: [],
        missedCorrectOptions: [],
        explanations: {},
      };
    }

    // Handle fill-in-the-blanks and similar item-based questions
    else if (
      detailedAnalysis.correctCount !== undefined &&
      detailedAnalysis.totalBlanks !== undefined
    ) {
      scoring.itemAnalysis = createItemAnalysis(
        detailedAnalysis.totalBlanks,
        detailedAnalysis.correctCount,
        detailedAnalysis.blankResults
      );
    }
  }

  return createStandardizedResponse(
    {
      score,
      isCorrect,
      feedback,
      questionType: questionType.toString(),
      timeTaken,
    },
    scoring,
    analysis,
    suggestions,
    {
      evaluationMethod: detailedAnalysis?.evaluationMethod || 'legacy',
      confidence: detailedAnalysis?.confidence,
    }
  );
}

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
  timeTakenSeconds?: number
): Promise<QuestionEvaluationResult> {
  const questionType = question.questionType.name;

  // Get legacy evaluation result
  let legacyResult: LegacyQuestionEvaluationResult;

  switch (questionType) {
    case PteQuestionTypeName.READ_ALOUD:
      legacyResult = await evaluateReadAloud(
        question,
        userResponse,
        timeTakenSeconds
      );
      break;

    case PteQuestionTypeName.REPEAT_SENTENCE:
      legacyResult = await evaluateRepeatSentence(
        question,
        userResponse,
        timeTakenSeconds
      );
      break;

    case PteQuestionTypeName.DESCRIBE_IMAGE:
      legacyResult = await evaluateDescribeImage(
        question,
        userResponse,
        timeTakenSeconds
      );
      break;

    case PteQuestionTypeName.RE_TELL_LECTURE:
      legacyResult = await evaluateRetellLecture(
        question,
        userResponse,
        timeTakenSeconds
      );
      break;

    case PteQuestionTypeName.SUMMARIZE_GROUP_DISCUSSION:
      legacyResult = await evaluateSummarizeGroupDiscussion(
        question,
        userResponse,
        timeTakenSeconds
      );
      break;

    case PteQuestionTypeName.RESPOND_TO_A_SITUATION:
      legacyResult = await evaluateRespondToASituation(
        question,
        userResponse,
        timeTakenSeconds
      );
      break;

    case PteQuestionTypeName.ANSWER_SHORT_QUESTION:
      legacyResult = await evaluateAnswerShortQuestion(question, userResponse);
      break;

    case PteQuestionTypeName.SUMMARIZE_WRITTEN_TEXT:
      legacyResult = await evaluateSummarizeWrittenText(
        question,
        userResponse,
        timeTakenSeconds
      );
      break;

    case PteQuestionTypeName.WRITE_ESSAY:
      legacyResult = await evaluateWriteEssay(
        question,
        userResponse,
        timeTakenSeconds
      );
      break;

    case PteQuestionTypeName.MULTIPLE_CHOICE_SINGLE_ANSWER_READING:
    case PteQuestionTypeName.MULTIPLE_CHOICE_SINGLE_ANSWER_LISTENING:
      legacyResult = await evaluateMultipleChoiceSingle(
        question,
        userResponse,
        timeTakenSeconds
      );
      break;

    case PteQuestionTypeName.MULTIPLE_CHOICE_MULTIPLE_ANSWERS_READING:
    case PteQuestionTypeName.MULTIPLE_CHOICE_MULTIPLE_ANSWERS_LISTENING:
      legacyResult = await evaluateMultipleChoiceMultiple(
        question,
        userResponse,
        timeTakenSeconds
      );
      break;

    case PteQuestionTypeName.RE_ORDER_PARAGRAPHS:
      legacyResult = await evaluateReorderParagraphs(
        question,
        userResponse,
        timeTakenSeconds
      );
      break;

    case PteQuestionTypeName.READING_FILL_IN_THE_BLANKS:
    case PteQuestionTypeName.FILL_IN_THE_BLANKS_DRAG_AND_DROP:
      legacyResult = await evaluateFillInTheBlanks(
        question,
        userResponse,
        timeTakenSeconds
      );
      break;

    case PteQuestionTypeName.LISTENING_FILL_IN_THE_BLANKS:
      legacyResult = await evaluateListeningFillInTheBlanks(
        question,
        userResponse,
        timeTakenSeconds
      );
      break;

    case PteQuestionTypeName.SUMMARIZE_SPOKEN_TEXT:
      legacyResult = await evaluateSummarizeSpokenText(
        question,
        userResponse,
        timeTakenSeconds
      );
      break;

    case PteQuestionTypeName.HIGHLIGHT_CORRECT_SUMMARY:
      legacyResult = await evaluateHighlightCorrectSummary(
        question,
        userResponse,
        timeTakenSeconds
      );
      break;

    case PteQuestionTypeName.SELECT_MISSING_WORD:
      legacyResult = await evaluateSelectMissingWord(
        question,
        userResponse,
        timeTakenSeconds
      );
      break;

    case PteQuestionTypeName.HIGHLIGHT_INCORRECT_WORDS:
      legacyResult = await evaluateHighlightIncorrectWords(
        question,
        userResponse,
        timeTakenSeconds
      );
      break;

    case PteQuestionTypeName.WRITE_FROM_DICTATION:
      legacyResult = await evaluateWriteFromDictation(
        question,
        userResponse,
        timeTakenSeconds
      );
      break;

    default:
      throw new Error(`Unsupported question type: ${questionType}`);
  }

  // For Describe Image, Re-tell Lecture, Repeat Sentence, Read Aloud, Answer Short Question, Summarize Spoken Text, Summarize Written Text, Write Essay, Write from Dictation, and Reading questions, keep the original detailedAnalysis structure
  // For other question types, convert to standardized format
  let detailedAnalysisToReturn = legacyResult.detailedAnalysis;

  if (
    questionType !== PteQuestionTypeName.DESCRIBE_IMAGE &&
    questionType !== PteQuestionTypeName.RE_TELL_LECTURE &&
    questionType !== PteQuestionTypeName.REPEAT_SENTENCE &&
    questionType !== PteQuestionTypeName.READ_ALOUD &&
    questionType !== PteQuestionTypeName.ANSWER_SHORT_QUESTION &&
    questionType !== PteQuestionTypeName.SUMMARIZE_GROUP_DISCUSSION &&
    questionType !== PteQuestionTypeName.RESPOND_TO_A_SITUATION &&
    questionType !== PteQuestionTypeName.SUMMARIZE_SPOKEN_TEXT &&
    questionType !== PteQuestionTypeName.SUMMARIZE_WRITTEN_TEXT &&
    questionType !== PteQuestionTypeName.WRITE_ESSAY &&
    questionType !== PteQuestionTypeName.WRITE_FROM_DICTATION &&
    questionType !==
      PteQuestionTypeName.MULTIPLE_CHOICE_SINGLE_ANSWER_READING &&
    questionType !==
      PteQuestionTypeName.MULTIPLE_CHOICE_MULTIPLE_ANSWERS_READING &&
    questionType !== PteQuestionTypeName.RE_ORDER_PARAGRAPHS &&
    questionType !== PteQuestionTypeName.READING_FILL_IN_THE_BLANKS &&
    questionType !== PteQuestionTypeName.FILL_IN_THE_BLANKS_DRAG_AND_DROP &&
    questionType !== PteQuestionTypeName.HIGHLIGHT_CORRECT_SUMMARY &&
    questionType !== PteQuestionTypeName.HIGHLIGHT_INCORRECT_WORDS &&
    questionType !== PteQuestionTypeName.LISTENING_FILL_IN_THE_BLANKS &&
    questionType !==
      PteQuestionTypeName.MULTIPLE_CHOICE_MULTIPLE_ANSWERS_LISTENING &&
    questionType !==
      PteQuestionTypeName.MULTIPLE_CHOICE_SINGLE_ANSWER_LISTENING &&
    questionType !== PteQuestionTypeName.SELECT_MISSING_WORD
  ) {
    // Convert legacy result to standardized format for non-detailed question types
    const standardizedAnalysis = convertToStandardizedFormat(
      legacyResult,
      questionType,
      timeTakenSeconds || 0
    );
    detailedAnalysisToReturn = standardizedAnalysis;
  }

  // Return result with appropriate detailed analysis
  return {
    score: legacyResult.score,
    isCorrect: legacyResult.isCorrect,
    feedback: legacyResult.feedback,
    detailedAnalysis: detailedAnalysisToReturn,
    suggestions: legacyResult.suggestions,
  };
}

// SPEAKING QUESTION EVALUATION
/**
 * Corrects error positions for audio-based questions (Read Aloud, Repeat Sentence, etc.)
 * Handles pronunciationErrors, fluencyErrors, and contentErrors
 */
function correctAudioErrorPositions(
  errorAnalysis: any,
  userText: string
): any {
  if (!errorAnalysis) return errorAnalysis;

  // Split the text into words (same method as backend)
  const words = userText.split(/\s+/).filter((word: string) => word.length > 0);

  // Normalize function - removes punctuation for comparison
  const normalize = (text: string): string =>
    text.toLowerCase().replace(/[.,!?;:\-()[\]{}""'']/g, '');

  // Helper function to find the correct position of an error word using context
  const findWordPosition = (
    errorText: string,
    originalPosition?: { start: number; end: number },
    context?: { before?: string; after?: string }
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
    const contextMatches = allOccurrences.filter(
      (occ) => occ.contextScore > 0
    );
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
      const correctedPosition = findWordPosition(
        error.text,
        error.position,
        error.context
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
    pronunciationErrors: correctErrorArray(errorAnalysis.pronunciationErrors || []),
    fluencyErrors: correctErrorArray(errorAnalysis.fluencyErrors || []),
    contentErrors: correctErrorArray(errorAnalysis.contentErrors || []),
  };
}

/**
 * Evaluate Read Aloud responses (audio-based)
 */
async function evaluateReadAloud(
  question: Question,
  userResponse: any,
  timeTakenSeconds?: number
): Promise<QuestionEvaluationResult> {
  const transcribedText = userResponse.textResponse;

  const prompt = `
    **Your Role:** You are an expert AI evaluator for the PTE Academic test. Your task is to analyze a user's "Read Aloud" speaking performance with extreme precision.

    **Objective:** You will be given an original text and a transcription of a user's spoken response. Compare the transcription word-for-word to the original, score it based on official PTE criteria for Content, Pronunciation, and Oral Fluency, and provide detailed, actionable feedback.

    ---
    ### **Evaluation and Scoring Instructions**

    **1. Content Analysis:**
    * Compare the transcribedText to the originalText to perform a wordAnalysis.
    * For each word, assign a status: 'correct', 'mispronounced', 'omitted', or 'inserted'.
    * The **Content score** is the percentage of words from the original text that are correctly spoken.
    * **Important**: Each replacement, omission or insertion of a word counts as one error.
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
        "summary": "Overall feedback"
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

    const contentPercentage =
      maxContentScore > 0 ? (contentScore / maxContentScore) * 100 : 0;
    const pronunciationPercentage =
      pronunciationMaxScore > 0
        ? (pronunciationScore / pronunciationMaxScore) * 100
        : 0;
    const fluencyPercentage =
      fluencyMaxScore > 0 ? (fluencyScore / fluencyMaxScore) * 100 : 0;

    // Calculate overall score as sum of component scores (points)
    const overallScore = Math.round(
      contentScore + pronunciationScore + fluencyScore
    );

    // Calculate max possible score
    const maxPossibleScore =
      maxContentScore + pronunciationMaxScore + fluencyMaxScore;

    // Calculate percentage for isCorrect check (65% threshold)
    const percentageScore = Math.round((overallScore / maxPossibleScore) * 100);

    return {
      score: overallScore,
      isCorrect: percentageScore >= 65,
      feedback:
        evaluation.feedback?.content ||
        evaluation.feedback?.summary ||
        'Audio response evaluated successfully.',
      detailedAnalysis: {
        overallScore,
        contentScore,
        contentMaxScore: maxContentScore,
        contentPercentage: Math.round(contentPercentage),
        pronunciationScore,
        pronunciationMaxScore: pronunciationMaxScore,
        pronunciationPercentage: Math.round(pronunciationPercentage),
        fluencyScore,
        fluencyMaxScore: fluencyMaxScore,
        fluencyPercentage: Math.round(fluencyPercentage),
        recognizedText: evaluation.analysis?.recognizedText || transcribedText,
        wordByWordAnalysis: wordAnalysis,
        timeTaken: timeTakenSeconds || 0,
        // fullEvaluation: evaluation, // Store the complete OpenAI response
        // Add structured scores for consistent frontend display
        scores: {
          content: { score: contentScore, max: maxContentScore },
          pronunciation: {
            score: pronunciationScore,
            max: pronunciationMaxScore,
          },
          oralFluency: { score: fluencyScore, max: fluencyMaxScore },
        },
        errorAnalysis: correctAudioErrorPositions(
          evaluation.errorAnalysis,
          transcribedText
        ),
        userText: transcribedText, // Include transcribed text for highlighting
      },
      suggestions: evaluation.feedback?.suggestions || [
        'Practice reading aloud regularly',
        'Focus on clear pronunciation',
        'Maintain steady pace and rhythm',
      ],
    };
  } catch (error) {
    console.error('OpenAI evaluation error for Read Aloud:', error);
    return {
      score: 0,
      isCorrect: false,
      feedback: 'Unable to evaluate response at this time. Please try again.',
      detailedAnalysis: {
        error: 'Evaluation service temporarily unavailable',
        transcribedText,
        timeTaken: timeTakenSeconds || 0,
      },
      suggestions: [
        'Please try again later',
        'Contact support if the issue persists',
      ],
    };
  }
}

/**
 * Evaluate Repeat Sentence responses (audio-based)
 */
async function evaluateRepeatSentence(
  question: Question,
  userResponse: any,
  timeTakenSeconds?: number
): Promise<QuestionEvaluationResult> {
  const transcribedText = userResponse.textResponse;
  const originalSentence =
    question.textContent || question.correctAnswers?.[0] || '';

  const prompt = `
  **Your Role:** You are an expert AI evaluator for the PTE Academic test. Your task is to analyze a user's "Repeat Sentence" speaking performance with extreme precision.

  **Objective:** You will be given an original sentence and a transcription of a user's spoken response. Compare the transcription word-for-word to the original, score it based on official PTE criteria for Content, Pronunciation, and Oral Fluency, and provide detailed, actionable feedback.

  ---
  ### **Evaluation and Scoring Instructions**

  **1. Content Analysis:**
  * Compare the transcribedText to the originalText to perform a wordAnalysis.
  * For each word, assign a status: 'correct', 'mispronounced', 'omitted', or 'inserted'.
  * **Important**: Hesitations, filled or unfilled pauses, and leading or trailing material are **ignored** in the scoring of content.
  * **Errors = replacements, omissions and insertions only**
    
  **Content Scoring (0-3 scale):**
  * **3 points** - All words in the response are from the prompt and in the correct sequence.
  * **2 points** - At least 50% of the words in the response are from the prompt and in the correct sequence.
  * **1 point** - Less than 50% of the words in the response are from the prompt and in the correct sequence.
  * **0 points** - Almost nothing from the prompt is in the response.

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
      "summary": string,              // Overall feedback in 1–2 sentences
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
    const maxContentScore = evaluation.scores?.content?.maxScore || 3;
    const pronunciationScore = evaluation.evaluation?.pronunciation?.score || 0;
    const fluencyScore = evaluation.evaluation?.oralFluency?.score || 0;
    const wordAnalysis = evaluation.evaluation?.content?.wordAnalysis || [];

    // Calculate percentages
    const contentPercentage = (contentScore / maxContentScore) * 100;
    const pronunciationPercentage = (pronunciationScore / 5) * 100;
    const fluencyPercentage = (fluencyScore / 5) * 100;

    // Calculate overall score as sum of component scores (points)
    const overallScore = Math.round(
      contentScore + pronunciationScore + fluencyScore
    );

    // Calculate max possible score
    const maxPossibleScore = maxContentScore + 5 + 5;

    // Calculate percentage for isCorrect check (65% threshold)
    const percentageScore = Math.round((overallScore / maxPossibleScore) * 100);

    return {
      score: overallScore,
      isCorrect: percentageScore >= 65,
      feedback:
        evaluation.feedback?.content ||
        evaluation.feedback?.summary ||
        'Audio response evaluated successfully.',
      detailedAnalysis: {
        overallScore,
        contentScore,
        contentMaxScore: maxContentScore,
        contentPercentage: Math.round(contentPercentage),
        pronunciationScore,
        pronunciationPercentage: Math.round(pronunciationPercentage),
        fluencyScore,
        fluencyPercentage: Math.round(fluencyPercentage),
        recognizedText: evaluation.analysis?.recognizedText || transcribedText,
        wordByWordAnalysis: wordAnalysis,
        timeTaken: timeTakenSeconds || 0,
        // fullEvaluation: evaluation, // Store the complete OpenAI response
        // Add structured scores for consistent frontend display
        scores: {
          content: { score: contentScore, max: maxContentScore },
          pronunciation: { score: pronunciationScore, max: 5 },
          oralFluency: { score: fluencyScore, max: 5 },
        },
        errorAnalysis: correctAudioErrorPositions(
          evaluation.errorAnalysis,
          transcribedText
        ),
        userText: transcribedText, // Include transcribed text for highlighting
      },
      suggestions: evaluation.feedback?.suggestions || [
        'Practice repeating sentences clearly',
        'Focus on accurate pronunciation',
        'Maintain natural speech rhythm',
      ],
    };
  } catch (error) {
    console.error('OpenAI evaluation error for Repeat Sentence:', error);
    return {
      score: 0,
      isCorrect: false,
      feedback: 'Error occurred during evaluation.',
      detailedAnalysis: {
        contentScore: 0,
        contentMaxScore: 3,
        contentPercentage: 0,
        pronunciationScore: 0,
        pronunciationMaxScore: 5,
        pronunciationPercentage: 0,
        fluencyScore: 0,
        fluencyMaxScore: 5,
        fluencyPercentage: 0,
        recognizedText: transcribedText,
        wordByWordAnalysis: [],
        timeTaken: timeTakenSeconds || 0,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      suggestions: ['Please try again.', 'Ensure clear pronunciation.'],
    };
  }
}

/**
 * Evaluate Describe Image responses (audio-based)
 */
async function evaluateDescribeImage(
  question: Question,
  userResponse: any,
  timeTakenSeconds?: number
): Promise<QuestionEvaluationResult> {
  const transcribedText = userResponse.textResponse;

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

    **Required Output Format:**
    Respond with a single, minified JSON object in this exact format. Use camelCase for keys.
    {
      "scores": {
        "content": <number_0_to_6>,
        "pronunciation": <number_0_to_5>,
        "oralFluency": <number_0_to_5>
      },
      "feedback": {
        "summary": "<A brief, overall summary of the performance>",
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
        "grammarErrors": [],
        "contentErrors": [
          {
            "text": "factually incorrect statement",
            "type": "content",
            "position": { "start": 0, "end": 1 },
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

    // Parse the OpenAI response format for Describe Image
    const contentScore = evaluation?.scores?.content || 0;
    const contentMaxScore = 6;
    const pronunciationScore = evaluation?.scores?.pronunciation || 0;
    const pronunciationMaxScore = 5;
    const oralFluencyScore = evaluation?.scores?.oralFluency || 0;
    const oralFluencyMaxScore = 5;

    // Calculate percentages
    const contentPercentage = (contentScore / contentMaxScore) * 100;
    const oralFluencyPercentage =
      (oralFluencyScore / oralFluencyMaxScore) * 100;
    const pronunciationPercentage =
      (pronunciationScore / pronunciationMaxScore) * 100;

    // Calculate overall score as sum of component scores (points)
    const overallScore = contentScore + oralFluencyScore + pronunciationScore;

    // Calculate max possible score
    const maxPossibleScore =
      contentMaxScore + oralFluencyMaxScore + pronunciationMaxScore;

    // Calculate percentage for isCorrect check (65% threshold)
    const percentageScore = Math.round((overallScore / maxPossibleScore) * 100);

    // Get feedback from OpenAI response
    const feedbackData = evaluation.feedback || {};
    let feedbackText =
      feedbackData.summary || 'Image description response evaluated.';

    return {
      score: overallScore,
      isCorrect: percentageScore >= 65,
      feedback: feedbackText,
      detailedAnalysis: {
        scores: {
          content: { score: contentScore, max: contentMaxScore },
          oralFluency: { score: oralFluencyScore, max: oralFluencyMaxScore },
          pronunciation: {
            score: pronunciationScore,
            max: pronunciationMaxScore,
          },
        },
        feedback: feedbackData,
        contentScore,
        contentMaxScore,
        contentPercentage: Math.round(contentPercentage),
        oralFluencyScore,
        oralFluencyMaxScore,
        oralFluencyPercentage: Math.round(oralFluencyPercentage),
        pronunciationScore,
        pronunciationMaxScore,
        pronunciationPercentage: Math.round(pronunciationPercentage),
        recognizedText: transcribedText,
        timeTaken: timeTakenSeconds || 0,
        imageAnalysis: imageAnalysis,
        keyElementsCovered: keyElements,
        contentFeedback: feedbackData.content || '',
        oralFluencyFeedback: feedbackData.oralFluency || '',
        pronunciationFeedback: feedbackData.pronunciation || '',
        errorAnalysis: evaluation.errorAnalysis || {
          pronunciationErrors: [],
          fluencyErrors: [],
          grammarErrors: [],
          contentErrors: [],
        },
        userText: transcribedText, // Include transcribed text for highlighting
      },
      suggestions: [
        'Describe all key elements visible in the image',
        'Use specific vocabulary related to the image content',
        'Organize your description logically (overview → details → conclusion)',
        'Speak clearly and maintain natural pace',
        'Include relationships between elements when relevant',
      ],
    };
  } catch (error) {
    console.error('OpenAI evaluation error for Describe Image:', error);
    return {
      score: 0,
      isCorrect: false,
      feedback: 'Error occurred during evaluation.',
      detailedAnalysis: {
        contentScore: 0,
        contentMaxScore: 6,
        contentPercentage: 0,
        oralFluencyScore: 0,
        oralFluencyMaxScore: 5,
        oralFluencyPercentage: 0,
        pronunciationScore: 0,
        pronunciationMaxScore: 5,
        pronunciationPercentage: 0,
        recognizedText: transcribedText,
        timeTaken: timeTakenSeconds || 0,
        error: error instanceof Error ? error.message : 'Unknown error',
        errorAnalysis: {
          pronunciationErrors: [],
          fluencyErrors: [],
          grammarErrors: [],
          contentErrors: [],
        },
      },
      suggestions: [
        'Please try again.',
        'Focus on describing key visual elements.',
        'Ensure clear pronunciation and logical organization.',
      ],
    };
  }
}

/**
 * Evaluate Re-tell Lecture responses (audio-based)
 */
async function evaluateRetellLecture(
  question: Question,
  userResponse: any,
  timeTakenSeconds?: number
): Promise<QuestionEvaluationResult> {
  const transcribedText = userResponse.textResponse;
  const originalLecture = question.textContent || '';

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

    // Parse the OpenAI response format for Re-tell Lecture
    // Handle the actual response structure from OpenAI
    const contentScore = evaluation.Content || 0;
    const contentMaxScore = 6;
    const oralFluencyScore = evaluation['Oral Fluency'] || 0;
    const oralFluencyMaxScore = 5;
    const pronunciationScore = evaluation.Pronunciation || 0;
    const pronunciationMaxScore = 5;

    // Calculate percentages
    const contentPercentage = (contentScore / contentMaxScore) * 100;
    const oralFluencyPercentage =
      (oralFluencyScore / oralFluencyMaxScore) * 100;
    const pronunciationPercentage =
      (pronunciationScore / pronunciationMaxScore) * 100;

    // Calculate overall score as sum of component scores (points)
    const overallScore = contentScore + oralFluencyScore + pronunciationScore;

    // Calculate max possible score
    const maxPossibleScore =
      contentMaxScore + oralFluencyMaxScore + pronunciationMaxScore;

    // Calculate percentage for isCorrect check (65% threshold)
    const percentageScore = Math.round((overallScore / maxPossibleScore) * 100);

    return {
      score: overallScore,
      isCorrect: percentageScore >= 65,
      feedback:
        evaluation.feedback?.content ||
        evaluation.feedback?.summary ||
        'Re-tell Lecture response evaluated successfully.',
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
            'Practice smooth, natural speech rhythm',
          pronunciation:
            evaluation.feedback?.pronunciation ||
            'Work on clear articulation and stress patterns',
        },
        contentScore,
        contentMaxScore: contentMaxScore,
        contentPercentage: Math.round(contentPercentage),
        oralFluencyScore,
        oralFluencyMaxScore: oralFluencyMaxScore,
        oralFluencyPercentage: Math.round(oralFluencyPercentage),
        pronunciationScore,
        pronunciationMaxScore: pronunciationMaxScore,
        pronunciationPercentage: Math.round(pronunciationPercentage),
        recognizedText: evaluation.analysis?.recognizedText || transcribedText,
        timeTaken: timeTakenSeconds || 0,
        errorAnalysis: evaluation.errorAnalysis || {
          pronunciationErrors: [],
          fluencyErrors: [],
          contentErrors: [],
        },
        userText: transcribedText, // Include transcribed text for highlighting
      },
      suggestions: evaluation.feedback?.suggestions || [
        'Focus on main ideas and key points',
        'Organize your response logically',
        'Use clear pronunciation and natural pace',
      ],
    };
  } catch (error) {
    console.error('OpenAI evaluation error for Re-tell Lecture:', error);
    return {
      score: 0,
      isCorrect: false,
      feedback: 'Error occurred during evaluation.',
      detailedAnalysis: {
        contentScore: 0,
        contentMaxScore: 6,
        contentPercentage: 0,
        oralFluencyScore: 0,
        oralFluencyMaxScore: 5,
        oralFluencyPercentage: 0,
        pronunciationScore: 0,
        pronunciationMaxScore: 5,
        pronunciationPercentage: 0,
        recognizedText: transcribedText,
        timeTaken: timeTakenSeconds || 0,
        error: error instanceof Error ? error.message : 'Unknown error',
        errorAnalysis: {
          pronunciationErrors: [],
          fluencyErrors: [],
          contentErrors: [],
        },
      },
      suggestions: [
        'Please try again.',
        'Focus on capturing key points from the lecture.',
        'Ensure clear pronunciation and logical organization.',
      ],
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
  timeTakenSeconds?: number
): Promise<QuestionEvaluationResult> {
  const transcribedText = userResponse.textResponse;
  const discussionTranscript = question.textContent || '';

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

      - 6 pts (Excellent)**
        - Seamless and coherent summary covering **4–5 or more key points** from the discussion.
        - Accurately represents multiple viewpoints.
        - Uses complete sentences with logical connectors.
        - Ideas are logically structured with clear relationships between perspectives.
        - No major factual distortions.
      - 5 pts (Very Good)**
        - Covers **3–4 key points** from the discussion.
        - Uses complete sentences and appropriate connectors.
        - Captures the general direction of the discussion.
        - Minor omissions or simplifications may exist.
        - If delivery is robotic or poorly connected, **cap at 4**.
      - 4 pts (Good)**
        - Covers **2-3 key points** accurately.
        - Uses simple but complete sentences.
        - Focuses more on individual ideas than relationships between viewpoints.
        - Organization may be basic but meaning is clear.
      - 3 pts (Limited / Fragmented)**
        - Covers **2–3 key points** using sentences, OR
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
        - **Accuracy Check:** Incorrect attribution or distortion of viewpoints must be penalized.
        - **Distinction Rule:**
        - *"Climate. Farming. Water."* → **Score 2**
        - *"Farming uses water and affects the climate."* → **Score 4**

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
      * **Content:** Omitted key points, incorrect info, logic errors.

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

    const contentScore = evaluation.Content || 0;
    const contentMaxScore = 6;
    const oralFluencyScore = evaluation['Oral Fluency'] || 0;
    const oralFluencyMaxScore = 5;
    const pronunciationScore = evaluation.Pronunciation || 0;
    const pronunciationMaxScore = 5;

    const contentPercentage = (contentScore / contentMaxScore) * 100;
    const oralFluencyPercentage =
      (oralFluencyScore / oralFluencyMaxScore) * 100;
    const pronunciationPercentage =
      (pronunciationScore / pronunciationMaxScore) * 100;

    const overallScore = contentScore + oralFluencyScore + pronunciationScore;
    const maxPossibleScore =
      contentMaxScore + oralFluencyMaxScore + pronunciationMaxScore;

    const percentageScore = Math.round((overallScore / maxPossibleScore) * 100);

    return {
      score: overallScore,
      isCorrect: percentageScore >= 65,
      feedback:
        evaluation.feedback?.content ||
        evaluation.feedback?.summary ||
        'Summarize Group Discussion response evaluated successfully.',
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
            'Focus on main ideas and diverse viewpoints',
          oralFluency:
            evaluation.feedback?.oralFluency ||
            'Practice smooth, natural speech rhythm',
          pronunciation:
            evaluation.feedback?.pronunciation ||
            'Work on clear articulation and stress patterns',
        },
        contentScore,
        contentMaxScore: contentMaxScore,
        contentPercentage: Math.round(contentPercentage),
        oralFluencyScore,
        oralFluencyMaxScore: oralFluencyMaxScore,
        oralFluencyPercentage: Math.round(oralFluencyPercentage),
        pronunciationScore,
        pronunciationMaxScore: pronunciationMaxScore,
        pronunciationPercentage: Math.round(pronunciationPercentage),
        recognizedText: evaluation.analysis?.recognizedText || transcribedText,
        timeTaken: timeTakenSeconds || 0,
        // fullEvaluation: evaluation,
        errorAnalysis: evaluation.errorAnalysis || {
          pronunciationErrors: [],
          fluencyErrors: [],
          contentErrors: [],
        },
        userText: transcribedText,
      },
      suggestions: evaluation.feedback?.suggestions || [
        'Focus on capturing all key viewpoints',
        'Organize your summary logically',
        'Use clear pronunciation and natural pace',
      ],
    };
  } catch (error) {
    console.error(
      'OpenAI evaluation error for Summarize Group Discussion:',
      error
    );
    return {
      score: 0,
      isCorrect: false,
      feedback: 'Error occurred during evaluation.',
      detailedAnalysis: {
        contentScore: 0,
        contentMaxScore: 6,
        contentPercentage: 0,
        oralFluencyScore: 0,
        oralFluencyMaxScore: 5,
        oralFluencyPercentage: 0,
        pronunciationScore: 0,
        pronunciationMaxScore: 5,
        pronunciationPercentage: 0,
        recognizedText: transcribedText,
        timeTaken: timeTakenSeconds || 0,
        error: error instanceof Error ? error.message : 'Unknown error',
        errorAnalysis: {
          pronunciationErrors: [],
          fluencyErrors: [],
          contentErrors: [],
        },
      },
      suggestions: [
        'Please try again.',
        'Focus on capturing diverse viewpoints from the discussion.',
        'Ensure clear pronunciation and logical organization.',
      ],
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
  timeTakenSeconds?: number
): Promise<QuestionEvaluationResult> {
  const transcribedText = userResponse.textResponse;
  const situationPrompt = question.textContent || '';
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

    const contentPercentage = (contentScore / contentMaxScore) * 100;
    const oralFluencyPercentage =
      (oralFluencyScore / oralFluencyMaxScore) * 100;
    const pronunciationPercentage =
      (pronunciationScore / pronunciationMaxScore) * 100;

    const overallScore = contentScore + oralFluencyScore + pronunciationScore;
    const maxPossibleScore =
      contentMaxScore + oralFluencyMaxScore + pronunciationMaxScore;

    const percentageScore = Math.round((overallScore / maxPossibleScore) * 100);

    return {
      score: overallScore,
      isCorrect: percentageScore >= 65,
      feedback:
        evaluation.feedback?.content ||
        evaluation.feedback?.summary ||
        'Respond to a Situation response evaluated successfully.',
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
        contentScore,
        contentMaxScore: contentMaxScore,
        contentPercentage: Math.round(contentPercentage),
        oralFluencyScore,
        oralFluencyMaxScore: oralFluencyMaxScore,
        oralFluencyPercentage: Math.round(oralFluencyPercentage),
        pronunciationScore,
        pronunciationMaxScore: pronunciationMaxScore,
        pronunciationPercentage: Math.round(pronunciationPercentage),
        recognizedText: evaluation.analysis?.recognizedText || transcribedText,
        timeTaken: timeTakenSeconds || 0,
        // fullEvaluation: evaluation,
        errorAnalysis: {
          pronunciationErrors:
            evaluation.errorAnalysis?.pronunciationErrors || [],
          fluencyErrors: evaluation.errorAnalysis?.fluencyErrors || [],
          contentErrors: evaluation.errorAnalysis?.contentErrors || [],
        },
        userText: transcribedText,
      },
      suggestions: evaluation.feedback?.suggestions || [
        'Address all aspects of the situation',
        'Use clear and appropriate language',
        'Maintain natural pace and intonation',
      ],
    };
  } catch (error) {
    console.error('OpenAI evaluation error for Respond to a Situation:', error);
    return {
      score: 0,
      isCorrect: false,
      feedback: 'Error occurred during evaluation.',
      detailedAnalysis: {
        contentScore: 0,
        contentMaxScore: 6,
        oralFluencyScore: 0,
        oralFluencyMaxScore: 5,
        pronunciationScore: 0,
        pronunciationMaxScore: 5,
        feedback: 'Evaluation service error',
        errorAnalysis: {
          pronunciationErrors: [],
          fluencyErrors: [],
          contentErrors: [],
        },
        userText: transcribedText,
      },
      suggestions: [
        'Please ensure clear audio recording',
        'Try recording again with better microphone quality',
        'Ensure quiet background environment',
      ],
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
    normalizedUserTranscript.includes(answer.toLowerCase().trim())
  );
}

/**
 * Evaluate Answer Short Question responses using a fast, code-based partial match check.
 */
function evaluateAnswerShortQuestion(question: Question, userResponse: any) {
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
        score: 1,
        isCorrect: true,
        feedback: 'Your answer is correct.',
        detailedAnalysis: {
          overallScore: 1,
          evaluationMethod: 'Partial Match',
          transcribedText,
          correctAnswers,
          scores: {
            vocabulary: { score: 1, max: 1 },
          },
          errorAnalysis,
          userText: transcribedText, // Include transcribed text for highlighting
        },
        suggestions: ['Excellent! Your answer was concise and accurate.'],
      };
    } else {
      return {
        score: 0,
        isCorrect: false,
        feedback: 'Your answer is incorrect.',
        detailedAnalysis: {
          overallScore: 0,
          evaluationMethod: 'Partial Match',
          transcribedText,
          correctAnswers,
          // Add structured scores for consistent frontend display
          scores: {
            vocabulary: { score: 0, max: 1 },
          },
          errorAnalysis,
          userText: transcribedText, // Include transcribed text for highlighting
        },
        suggestions: [
          'Listen carefully and ensure your answer directly addresses the question.',
          'Keep your answer brief and to the point.',
        ],
      };
    }
  } catch (error) {
    console.error('Error evaluating Answer Short Question:', error);
    return {
      score: 0,
      isCorrect: false,
      feedback: 'Error occurred during evaluation.',
      detailedAnalysis: {
        evaluationMethod: 'Error',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      suggestions: ['Please try again.'],
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
  timeTakenSeconds?: number
): Promise<QuestionEvaluationResult> {
  const userText = userResponse.text || '';
  const wordCount = userText
    .split(/\s+/)
    .filter((word: string | any[]) => word.length > 0).length;

  const prompt = `
    **Your Role:** You are an expert PTE Academic grader specializing in the "Summarize Written Text" task.
    **Objective:** Evaluate the user's summary of the provided text. You must score the response on four distinct traits: Content, Form, Grammar, and Vocabulary, using the detailed rubrics below.

    ### **Input for Evaluation**
      **Original Text: "${question.textContent}"
      **User's Summary: "${userText}"
      **Word Count: ${wordCount}

    ---
    ### **Scoring Rubrics**
      1. Content (Score from 0 to 4):**
        **Evaluate comprehension and condensation.
        **Special Copy-Paste Rule (STRICT & MANDATORY):**
          Before evaluating Content meaning, check whether the user's summary is
          copied directly from the source text.

          Definition of DIRECT COPYING:
          - If the user's summary (even if it is one sentence) contains more than
            40–45% of words, phrases, or clauses taken directly from the source text
            WITHOUT meaningful changes
          - AND fewer than 3–4 content words have been replaced with synonyms or
            equivalent expressions

          RULING (NON-NEGOTIABLE):
          - IF direct copying is detected:
            → Content score MUST be capped at 1 (or 0 if off-topic)
            → Do NOT award 2, 3, or 4 under any circumstance
            → Add to feedback.content:
              "Flag: direct copying detected; content capped."

          - IF at least 3–4 content words are replaced:
            → Treat the response as a legitimate paraphrase
            → Proceed to normal Content scoring

         **Content scoring (apply only after copy-paste check):**
        - **4:** Comprehensive, concise paraphrase capturing all main ideas; passes semantic coverage vs internal reference (connected clauses, ideas logically synthesized).
        - **3:** Adequate summary that captures most main ideas but omits minor points or is slightly disorganized.
        - **2:** Partial summary; identifies some main points but relies on short quoted phrases or fails to synthesize.
        - **1:** Relevant but minimal; captures one main idea only or is mostly verbatim copy (per copy-paste rule).
        - **0:** No comprehension; off-topic or unintelligible.
        **Notes:**
        - Up to **3–4 foreign-word replacements** inside the student's summary are acceptable for Content **if** overall meaning remains clear.
        - Use your internal reference (4–5 joined sentences with 3–4 replacements) to judge semantic coverage — do not require exact wording.

      2. Form (Score from 0 to 1):**
        **1:** Exactly one complete sentence, **5–75 words**, not in ALL CAPS, uses connectors allowed (but, as, so, whereas, and) to join clauses.
        **0:** Not a single sentence, or word count <5 or >75, or ALL CAPS.

      3. Grammar (Score from 0 to 2):**
        **Connector Immunity:** **Do NOT** penalize use of connectors "but", "whereas", "as", "so", "and" as grammar errors (they are permitted to join clauses in the single-sentence format).
        **Replacement Immunity:** If a student’s summary is primarily a slightly modified copy (i.e., they have replaced 3–4 words as allowed), then **do not mark minor grammatical shifts that result solely from those replacements** as grammar errors — only mark grammatical problems that impair clarity.
        Scoring:
        **2:** Correct grammatical structure; rare minor errors.
        **1:** Some grammatical errors but meaning remains clear.
        **0:** Grave structural errors that hinder comprehension.

      4. Vocabulary (Score from 0 to 2):**
        **2:** Appropriate word choice; synonyms/paraphrases demonstrate control.
        **1:** Some lexical inaccuracies but communication not hindered.
        **0:** Poor word choice that obscures meaning.
        NOTE: If up to **3 non-English words** are used as part of permissible replacements and the meaning is still clear, do NOT automatically penalize Vocabulary for that — only penalize if comprehension is affected.
    
    ---
    ### **Error Analysis Instructions**
      **CRITICAL:** You must provide detailed error analysis by identifying specific mistakes in the user's text.

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

      **Special copy-paste detection note:** If you detect verbatim copying of ≥3 sentences without the allowed 3–4 word replacements, include a short note in 'feedback.content' stating: "Flag: verbatim copy detected; content penalized per copy-paste rule."

      **Error Types to Look For:**
      - **Grammar**: Subject-verb disagreement, wrong tenses, missing/incorrect articles, preposition errors.
      - **Spelling**: Misspelled words (Check strictly).
      - **Vocabulary**: Wrong word choice, repetitive words, unclear expressions.

      **IMPORTANT:**
      - Do NOT report minor grammar shifts that are direct consequences of permitted word replacements (3–4 words) in an otherwise correct paraphrase.
      - **Connector Immunity:** Do NOT mark "but", "whereas", "as", "and", "so" as grammar errors.
      - **Synonym Validity:** If a student uses a valid synonym (conceptually relevant) but the grammar is correct, do **not** mark as an error.
      - **Error Prioritization:** 1. **Spelling:** (Highest Priority/Penalty).
      2. **Grammar:** If spelling is correct but rule is broken.
      3. **Vocabulary:** If word choice is poor.

    ---
    ### ADDITIONAL JUDGMENTS & IMPLEMENTATION NOTES
    - Build the internal reference (4–5 sentences joined + 3–4 replacements) **every time**; use it to test whether the student's summary semantically covers the core ideas.
    - If the student's summary mirrors the internal reference semantically (even with different wording or small foreign-word replacements), credit Content fully.
    - If the student's submission is a literal copy of source sentences but contains only trivial punctuation changes (no 3–4 word replacements), apply the copy-paste penalty.
    - When in doubt about whether a replaced non-English word preserves meaning, favor semantic comprehension: **if overall meaning is clear, do not penalize Content**; you may note the non-English tokens in 'vocabularyIssues' only if they impede understanding.

    ---
    ### **Required Output Format**
    Your final output **must** be a single, minified JSON object with NO markdown. Adhere strictly to this schema:
    {
      "scores": {
        "content": <number_0_to_4>,
        "form": <number_0_to_1>,
        "grammar": <number_0_to_2>,
        "vocabulary": <number_0_to_2>
      },
      "feedback": {
        "summary": "A brief overall assessment of the summary.",
        "content": "Specific feedback on content.",
        "form": "Specific feedback on form.",
        "grammar": "Specific feedback on grammar.",
        "vocabulary": "Specific feedback on vocabulary."
      },
      "errorAnalysis": {
        "grammarErrors": [
          {
            "text": "word or phrase with error",
            "type": "grammar",
            "position": { "start": 0, "end": 5 },
            "correction": "suggested correction",
            "explanation": "explanation of the error"
          }
        ],
        "spellingErrors": [
          {
            "text": "misspelled word",
            "type": "spelling",
            "position": { "start": 10, "end": 15 },
            "correction": "correct spelling",
            "explanation": "spelling correction needed"
          }
        ],
        "vocabularyIssues": [
          {
            "text": "inappropriate word choice",
            "type": "vocabulary",
            "position": { "start": 20, "end": 30 },
            "correction": "better word choice",
            "explanation": "more appropriate vocabulary"
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
      temperature: 0.3,
    });

    const evaluation = JSON.parse(response.choices[0].message.content || '{}');

    // Extract individual scores for each trait
    const contentScore = evaluation.scores?.content || 0;
    const formScore = evaluation.scores?.form || 0;
    const grammarScore = evaluation.scores?.grammar || 0;
    const vocabularyScore = evaluation.scores?.vocabulary || 0;

    // Define the maximum possible score for each trait
    const maxContentScore = 4;
    const maxFormScore = 1;
    const maxGrammarScore = 2;
    const maxVocabularyScore = 2;

    // Calculate the total achieved score and the total possible score
    const totalAchievedScore =
      contentScore + formScore + grammarScore + vocabularyScore;
    const totalMaxScore =
      maxContentScore + maxFormScore + maxGrammarScore + maxVocabularyScore; // Total is 9

    // Calculate the overall score as actual points earned
    const overallScore = totalAchievedScore;

    // Calculate percentage for isCorrect check (65% threshold)
    const percentageScore = Math.round(
      (totalAchievedScore / totalMaxScore) * 100
    );

    return {
      score: overallScore,
      isCorrect: percentageScore >= 65,
      feedback:
        evaluation.feedback?.summary || 'Summary evaluated successfully.',
      detailedAnalysis: {
        overallScore,
        scores: {
          content: { score: contentScore, max: maxContentScore },
          form: {
            score: formScore,
            max: maxFormScore,
          },
          grammar: { score: grammarScore, max: maxGrammarScore },
          vocabulary: { score: vocabularyScore, max: maxVocabularyScore },
        },
        contentScore,
        maxContentScore,
        formScore,
        maxFormScore,
        grammarScore,
        maxGrammarScore,
        vocabularyScore,
        maxVocabularyScore,
        actualWordCount: wordCount,
        timeTaken: timeTakenSeconds || 0,
        feedback: evaluation.feedback,
        errorAnalysis: correctErrorPositions(
          evaluation.errorAnalysis,
          userText
        ),
        // errorAnalysis: evaluation.errorAnalysis || {
        //   grammarErrors: [],
        //   spellingErrors: [],
        //   vocabularyIssues: [],
        // },
        userText: userText, // Include original text for highlighting
      },
      suggestions: [], // SWT has no single correct answer, so no suggestions provided
    };
  } catch (error) {
    console.error('OpenAI evaluation error for Summarize Written Text:', error);
    return {
      score: 0,
      isCorrect: false,
      feedback: 'Unable to evaluate response at this time.',
      detailedAnalysis: {
        actualWordCount: wordCount,
        timeTaken: timeTakenSeconds || 0,
      },
      suggestions: ['Please try again later'],
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
    context?: { before?: string; after?: string }
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
        error.context
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
  timeTakenSeconds?: number
): Promise<QuestionEvaluationResult> {
  const userText = userResponse.text || '';
  const wordCount = userText
    .split(/\s+/)
    .filter((word: string | any[]) => word.length > 0).length;

  const prompt = `
  **Your Role:** You are an expert PTE Academic grader for the "Write Essay" task.
  **Objective:** Evaluate the user's essay based on the provided prompt. You must score the response on seven distinct traits using the detailed rubrics below.

  ### **Input for Evaluation**
    Essay Prompt: "${question.textContent}"
    User's Essay: "${userText}"
    Word Count: ${wordCount}

  ### **Pre-Scoring Evaluation Strategy (CRITICAL INSTRUCTIONS)**

  **1. AI Topic Relevance Detector (Content Scoring Rule):**
    - Do NOT judge Content based on full paragraphs.
    - Do NOT require formal structure for Content scoring.
    - Use **semantic understanding**, not keyword matching.
    - Detect **meaningful idea chunks**, even if written in simple language.

  #### What counts as a valid "Idea Chunk":
    A phrase or sentence that expresses a **topic-relevant concept**, such as:
    - learning practical skills
    - gaining hands-on experience
    - solving real-world problems
    - learning by doing
    - applying theory to practice
    - improving creativity or confidence
    - experiential learning improves productivity
    - working on real projects

    These ideas may appear:
    - Anywhere in the essay
    - In simple sentences
    - Using synonyms or paraphrasing
    - Even inside a templated structure

    If the student contributes **40–80 words of genuinely relevant ideas**, they MUST receive a **HIGH Content score (4–6)**, even if:
    - The rest of the essay is generic
    - The structure is weak
    - The wording is simple

  ### 2. LOW CONTENT SCORE TRIGGERS (STRICT)

    Assign **low Content scores (0–2)** ONLY if:
    - The essay is clearly off-topic
    - The ideas are random or unrelated
    - The essay is mostly a memorized template with NO real topic-specific ideas
    - Only isolated keywords are inserted without explanation

    Length alone must NEVER reduce Content.

  ### 3. PENALTY LOGIC (STRICT AND CONSISTENT)

    - **Spelling:** Heavy penalty  
      → Approx **–0.5 marks per spelling error**
    - **Grammar & Vocabulary:** Moderate penalty  
      → Approx **–0.2 marks per error**
    - Small grammar mistakes should reduce the score gradually, not destroy it unless meaning is unclear.

  
  ### **Scoring Rubrics**

    1. Content (Score from 0 to 6):**
      *Note: Evaluate based on the presence of relevant idea chunks, not full paragraphs.*
      **6 – Strong Relevance**
        - Contains **40–80+ words** of clear, topic-related ideas
        - Ideas show understanding and explanation
        - Synonyms and paraphrasing are used effectively

      **5 – Good Relevance**
        - Main topic addressed with multiple relevant idea chunks
        - Support may be uneven but clearly related

      **4 – Adequate Relevance**
        - Some meaningful topic-related ideas are present
        - Argument may be shallow or generic but relevant

      **3 – Partial Relevance**
        - Mostly templated writing
        - Only a few specific topic-related ideas

      **2 – Weak Relevance**
        - Barely addresses the topic
        - Mostly generic or random ideas

      **1 – Minimal**
        - Almost no relevant information

      **0 – Off-topic**
        - Does not deal with the prompt

    2. Form (Score from 0 to 2):**
      **2:** Length is between 200 and 300 words.
      **1:** Length is between 120-199 or 301-380 words.
      **0:** Length is less than 120 or more than 380 words; or written in all caps.

    3. Development, Structure & Coherence (Score from 0 to 6):**
      This trait is SEPARATE from Content.
      **6:** Logical flow; recognizable essay structure
      **5:** Simple structure; ideas connected
      **4:** Weak organization; some order
      **3:** Disconnected ideas
      **2:** Very disorganized
      **1:** Almost no coherence
      **0:** No recognizable structure

    4. Grammar (Score from 0 to 2):**
      - Start from a score of **2**
      - Deduct **0.2 marks for EACH grammar error**
      - Minimum score is **0**
      - Do NOT mark these as grammar errors: but, whereas, as, and, so

    5. General Linguistic Range (Score from 0 to 6):**
      * **6:** Sufficient range for basic ideas; occasional lapses.
      * **5:** Narrow range; simple expressions used repeatedly.
      * **4:** Limited vocabulary dominates.
      * **3:** Highly restricted vocabulary.
      * **2:** Extremely restricted.
      * **1:** Isolated words only.
      * **0:** Meaning not accessible.

    6. Vocabulary Range (Score from 0 to 2):**
      * **2:** Good range for academic topics.
      * **1:** Basic vocabulary; sufficient.
      * **0:** Very limited; meaning often obscured.

    7. Spelling (Score from 0 to 2):**
      - Start from a score of **2**
      - Deduct **0.5 marks for EACH spelling error**
      - Minimum score is **0**
      - Spelling errors must NOT be duplicated under grammar or vocabulary.

  ### **Error Analysis Instructions**

  **CRITICAL:** You must provide detailed error analysis by identifying specific mistakes in the user's text.

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
  - **Grammar**: Subject-verb disagreement, wrong tenses, missing/incorrect articles, preposition errors.
  - **Spelling**: Misspelled words (Check strictly).
  - **Vocabulary**: Wrong word choice, repetitive words, unclear expressions.

  **IMPORTANT:**
    - **Connector Immunity:** Do NOT mark "but", "whereas", "as", "and", "so" as grammar errors.
    - **Synonym Validity:** If a student uses a valid synonym (conceptually relevant) but the grammar is correct, do **not** mark as an error.
    - **Error Prioritization:** 1. **Spelling:** (Highest Priority/Penalty).
      2. **Grammar:** If spelling is correct but rule is broken.
      3. **Vocabulary:** If word choice is poor.

  ### **Required Output Format**
    Your final output **must** be a single, minified JSON object with NO markdown. Adhere strictly to this schema:
    {
      "scores": {
        "content": <number_0_to_6>,
        "form": <number_0_to_2>,
        "developmentStructureCoherence": <number_0_to_6>,
        "grammar": <number_0_to_2>,
        "generalLinguisticRange": <number_0_to_6>,
        "vocabularyRange": <number_0_to_2>,
        "spelling": <number_0_to_2>
      },
      "feedback": {
        "summary": "A brief overall assessment.",
        "content": "Feedback on idea relevance (mention if 'idea chunks' were found).",
        "form": "Feedback on form.",
        "developmentStructureCoherence": "Feedback on structure.",
        "grammar": "Feedback on grammar.",
        "generalLinguisticRange": "Feedback on linguistic range.",
        "vocabularyRange": "Feedback on vocabulary.",
        "spelling": "Feedback on spelling."
      },
      "errorAnalysis": {
        "grammarErrors": [
          {
            "text": "error text",
            "type": "grammar",
            "position": { "start": start position of word, "end": end position of word },
            "context": { "before": "word before error (or empty string)", "after": "word after error (or empty string)" },
            "correction": "correction",
            "explanation": "explanation"
          }
        ],
        "spellingErrors": [
          {
            "text": "error text",
            "type": "spelling",
            "position": { "start": start position of word, "end": end position of word },
            "context": { "before": "word before error (or empty string)", "after": "word after error (or empty string)" },
            "correction": "correction",
            "explanation": "explanation"
          }
        ],
        "vocabularyIssues": [
          {
            "text": "error text",
            "type": "vocabulary",
            "position": { "start": start position of word, "end": end position of word },
            "context": { "before": "word before error (or empty string)", "after": "word after error (or empty string)" },
            "correction": "correction",
            "explanation": "explanation"
          }
        ]
      },
      "suggestions": ["Actionable tip 1.", "Actionable tip 2."]
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
      (totalAchievedScore / totalMaxScore) * 100
    );

    return {
      score: overallScore,
      isCorrect: percentageScore >= 65,
      feedback: evaluation.feedback?.summary || 'Essay evaluated successfully.',
      detailedAnalysis: {
        overallScore,
        actualWordCount: wordCount,
        timeTaken: timeTakenSeconds || 0,
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
        feedback: evaluation.feedback,
        errorAnalysis: correctErrorPositions(
          evaluation.errorAnalysis,
          userText
        ),
        // errorAnalysis: correctErrorPositions(
        //   evaluation.errorAnalysis,
        //   userText
        // ),
        userText: userText, // Include original text for highlighting
      },
      suggestions: evaluation.suggestions || [
        'Ensure your essay directly addresses all parts of the prompt.',
        'Develop your main points with specific reasons and examples.',
        'Check your essay for grammatical accuracy and spelling before submitting.',
      ],
    };
  } catch (error) {
    console.error('OpenAI evaluation error for Write Essay:', error);
    return {
      score: 0,
      isCorrect: false,
      feedback: 'Unable to evaluate response at this time.',
      detailedAnalysis: {
        actualWordCount: wordCount,
        timeTaken: timeTakenSeconds || 0,
      },
      suggestions: ['Please try again later'],
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
  timeTakenSeconds?: number
): Promise<QuestionEvaluationResult> {
  const selectedOption = userResponse.selectedOption;
  const correctAnswers = question.options
    .filter((opt: any) => opt.isCorrect)
    .map((opt: any) => opt.id);

  const isCorrect = correctAnswers.includes(selectedOption);

  // Get the selected option text for feedback
  const options = question.options || [];
  const selectedOptionText =
    options.find((opt: any) => opt.id === selectedOption)?.text ||
    'Unknown option';
  const correctOptionText =
    options.find((opt: any) => correctAnswers.includes(opt.id))?.text ||
    'Unknown option';

  // Determine if this is a reading or listening question based on question type
  const isReadingQuestion = question.questionType.name.includes('READING');
  const skillType = isReadingQuestion ? 'reading' : 'listening';
  const actualScore = isCorrect ? 1 : 0;

  // Generate detailed explanation for both reading and listening questions using AI
  let explanation = '';
  if (!isCorrect) {
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
  }

  return {
    score: actualScore,
    isCorrect,
    feedback: isCorrect
      ? `Correct! You selected: "${selectedOptionText}"`
      : `Incorrect. You selected: "${selectedOptionText}". The correct answer is: "${correctOptionText}"`,
    detailedAnalysis: {
      overallScore: actualScore,
      selectedOption,
      correctAnswers,
      selectedOptionText,
      correctOptionText,
      explanation: explanation || undefined,
      timeTaken: timeTakenSeconds || 0,
      // Add structured scores for consistent frontend display
      scores: {
        [skillType]: { score: actualScore, max: 1 },
      },
    },
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
  };
}

/**
 * Evaluate Multiple Choice Multiple Answers responses
 */
async function evaluateMultipleChoiceMultiple(
  question: Question,
  userResponse: any,
  timeTakenSeconds?: number
): Promise<QuestionEvaluationResult> {
  const selectedOptions = userResponse.selectedOptions || [];
  const correctAnswers = question.options
    .filter((opt: any) => opt.isCorrect)
    .map((opt: any) => opt.id);

  // Count how many of the user's selections are correct
  const correctSelected = selectedOptions.filter((option: string) =>
    correctAnswers.includes(option)
  ).length;

  // Count how many of the user's selections are incorrect
  const incorrectSelected = selectedOptions.filter(
    (option: string) => !correctAnswers.includes(option)
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
      options.find((opt: any) => opt.id === optId)?.text || 'Unknown option'
  );
  const correctOptionTexts = correctAnswers.map(
    (optId: string) =>
      options.find((opt: any) => opt.id === optId)?.text || 'Unknown option'
  );
  const incorrectlySelectedTexts = selectedOptions
    .filter((optId: string) => !correctAnswers.includes(optId))
    .map(
      (optId: string) =>
        options.find((opt: any) => opt.id === optId)?.text || 'Unknown option'
    );
  const missedCorrectTexts = correctAnswers
    .filter((optId: string) => !selectedOptions.includes(optId))
    .map(
      (optId: string) =>
        options.find((opt: any) => opt.id === optId)?.text || 'Unknown option'
    );

  // Generate detailed explanation for both reading and listening questions using AI
  let explanation = '';
  if (!isCorrect) {
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
  }

  return {
    score,
    isCorrect,
    feedback: `You selected ${correctSelected} correct and ${incorrectSelected} incorrect options out of ${correctAnswers.length} total correct answers.`,
    detailedAnalysis: {
      overallScore: score,
      selectedOptions,
      correctAnswers,
      correctSelected,
      incorrectSelected,
      totalCorrect: correctAnswers.length,
      totalOptions: correctAnswers.length, // For consistent display
      partialScore: score,
      selectedOptionTexts,
      correctOptionTexts,
      incorrectlySelectedTexts,
      missedCorrectTexts,
      explanation: explanation || undefined,
      // Add structured scores for consistent frontend display
      scores: {
        [skillType]: { score: correctSelected, max: totalCorrectAnswers },
      },
    },
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
  };
}

/**
 * Evaluate Re-order Paragraphs responses
 */
async function evaluateReorderParagraphs(
  question: Question,
  userResponse: any,
  timeTakenSeconds?: number
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

  // Get paragraph texts for detailed feedback
  // const paragraphs = question.content?.paragraphs || [];
  // const userOrderTexts = userOrder.map((id: string) => {
  //   const paragraph = paragraphs.find((p: any) => p.id === id);
  //   return paragraph
  //     ? paragraph.text.substring(0, 50) + '...'
  //     : 'Unknown paragraph';
  // });
  // const correctOrderTexts = correctOrder.map((id: string) => {
  //   const paragraph = paragraphs.find((p: any) => p.id === id);
  //   return paragraph
  //     ? paragraph.text.substring(0, 50) + '...'
  //     : 'Unknown paragraph';
  // });

  // Generate detailed explanation using AI
  let explanation = '';
  if (!isCorrect) {
    try {
      explanation = await generateDynamicExplanationReorder({
        questionType: question.questionType.name,
        textContent: question.textContent,
        userOrder,
        correctOrder,
        correctPairs,
        maxPairs,
        paragraphs: question.options, // Paragraphs are stored in options
      });
    } catch (error) {
      console.error('Error generating explanation:', error);
      // Fallback to static explanation
      explanation = `You got ${correctPairs} out of ${maxPairs} adjacent pairs correct. Look for logical flow, chronological order, and connecting words between paragraphs.`;
    }
  }

  const correctOrderText = question.correctAnswers.correctOrder.map(
    (id: string) => {
      const item = question.options.find((opt: any) => opt.id === id);
      return item ? item.text : null;
    }
  );
  const userOrderText = userResponse.orderedParagraphs.map((id: string) => {
    const item = question.options.find((opt: any) => opt.id === id);
    return item ? item.text : null;
  });

  return {
    score,
    isCorrect,
    feedback: `You got ${correctPairs} out of ${maxPairs} paragraph pairs in the correct order.`,
    detailedAnalysis: {
      overallScore: score,
      userOrder,
      correctOrder,
      correctPairs,
      maxPairs,
      totalPairs: maxPairs, // For consistent display
      explanation: explanation || undefined,
      // Add structured scores for consistent frontend display
      userOrderText,
      correctOrderText,
      scores: {
        reading: { score: correctPairs, max: maxPairs },
      },
    },
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
  };
}

/**
 * Evaluate Fill in the Blanks responses
 */
async function evaluateFillInTheBlanks(
  question: Question,
  userResponse: any,
  timeTakenSeconds?: number
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

  // Generate AI feedback
  const aiFeedback = await generateFillInTheBlanksAIFeedback(
    question,
    userResponse,
    blankResults,
    score
  );

  // Determine if this is a reading or listening question
  const isReadingQuestion =
    question.questionType.name.includes('READING') ||
    question.questionType.name === 'FILL_IN_THE_BLANKS_DRAG_AND_DROP';
  const skillType = isReadingQuestion ? 'reading' : 'reading'; // Both are reading-based

  // Generate detailed explanation for reading questions using AI
  let explanation = '';
  if (!isCorrect && isReadingQuestion) {
    try {
      explanation = await generateDynamicExplanationFillBlanks({
        questionType: question.questionType.name,
        textContent: question.textContent,
        blankResults,
        correctCount,
        totalBlanks,
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
  }

  return {
    score,
    isCorrect,
    feedback: aiFeedback.feedback,
    detailedAnalysis: {
      overallScore: score,
      blankResults,
      correctCount,
      totalBlanks,
      explanation: explanation || undefined,
      timeTaken: timeTakenSeconds || 0,
      // Add structured scores for consistent frontend display
      scores: {
        [skillType]: { score: correctCount, max: totalBlanks },
      },
      ...aiFeedback.detailedAnalysis,
    },
    suggestions: isCorrect
      ? ['Great work! You understood the context well.']
      : isReadingQuestion
      ? [
          'Read the entire passage first to understand the overall meaning',
          'Look for grammatical clues around each blank (verb forms, articles, etc.)',
          'Consider the logical flow and meaning of the sentence',
          'Pay attention to collocations (words that commonly go together)',
          'Check if your answer fits grammatically and semantically',
        ]
      : aiFeedback.suggestions,
  };
}

/**
 * Generate AI feedback for Fill in the Blanks responses
 */
async function generateFillInTheBlanksAIFeedback(
  question: any,
  userResponse: any,
  blankResults: any,
  score: number
): Promise<{
  feedback: string;
  detailedAnalysis: any;
  suggestions: string[];
}> {
  try {
    const prompt = `
You are an expert PTE Academic evaluator specializing in Fill in the Blanks questions.

**Question Text:**
${question.textContent}

**Question Type:** ${question.questionType.name}

**User's Answers:**
${Object.entries(blankResults)
  .map(
    ([key, result]: [string, any]) =>
      `${key}: "${result.userAnswer}" (Correct: "${result.correctAnswer}") - ${
        result.isCorrect ? '✓' : '✗'
      }`
  )
  .join('\n')}

### **Scoring Rubrics**
    1 Each correctly completed blank
    0 Minimum score

**Overall Score:** ${score}%

Please provide:
1. **Feedback**: Constructive feedback on the user's performance (2-3 sentences)
2. **Detailed Analysis**: Analysis of vocabulary, grammar, and context understanding
3. **Suggestions**: 3-4 specific improvement tips

Respond in JSON format:
{
  "feedback": "Your feedback here",
  "detailedAnalysis": {
    "vocabularyAccuracy": 85,
    "grammarUnderstanding": 90,
    "contextComprehension": 80,
    "commonMistakes": ["mistake1", "mistake2"]
  },
  "suggestions": ["suggestion1", "suggestion2", "suggestion3"]
}
`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
      max_tokens: 800,
      response_format: { type: 'json_object' },
    });

    const aiResponse = response.choices[0]?.message?.content;
    if (!aiResponse) {
      throw new Error('No response from AI');
    }

    const parsedResponse = JSON.parse(aiResponse);
    return {
      feedback: parsedResponse.feedback || 'Response evaluated successfully.',
      detailedAnalysis: parsedResponse.detailedAnalysis || {},
      suggestions: parsedResponse.suggestions || [],
    };
  } catch (error) {
    console.error(
      'Error generating AI feedback for fill in the blanks:',
      error
    );

    // Fallback feedback based on score
    let feedback = '';
    let suggestions = [];

    if (score >= 80) {
      feedback =
        'Excellent work! You demonstrated strong vocabulary and context understanding.';
      suggestions = [
        'Continue practicing with more challenging texts',
        'Focus on academic vocabulary expansion',
        'Practice identifying word forms and collocations',
      ];
    } else if (score >= 60) {
      feedback =
        "Good effort! You got most answers correct but there's room for improvement.";
      suggestions = [
        'Pay attention to grammatical context around blanks',
        'Consider word forms (noun, verb, adjective, adverb)',
        'Read the entire sentence before selecting answers',
        'Practice more vocabulary in academic contexts',
      ];
    } else {
      feedback =
        'Keep practicing! Focus on understanding context and grammar patterns.';
      suggestions = [
        'Read the entire passage first to understand the topic',
        'Look for grammatical clues around each blank',
        'Study common academic vocabulary and collocations',
        'Practice identifying parts of speech',
      ];
    }

    return {
      feedback,
      detailedAnalysis: {
        vocabularyAccuracy: Math.max(0, score - 10),
        grammarUnderstanding: Math.max(0, score - 5),
        contextComprehension: score,
        aiEvaluationFailed: true,
      },
      suggestions,
    };
  }
}

// LISTENING QUESTION EVALUATION
/**
 * Evaluate Summarize Spoken Text responses
 */
async function evaluateSummarizeSpokenText(
  question: Question,
  userResponse: any,
  timeTakenSeconds?: number
): Promise<QuestionEvaluationResult> {
  const userText = userResponse.text || '';
  const wordCount = userText
    .split(/\s+/)
    .filter((word: string | any[]) => word.length > 0).length;

  const prompt = `
  **Your Role:** You are an expert PTE Academic grader for the "Summarize Spoken Text" task.
  **Objective:** Evaluate the user's summary based on the official PTE scoring rubric. You must score the response on five distinct traits using the detailed rubrics below.

  ---
  ### **Input for Evaluation**

  * Task: Listen to audio and write a summary (50-70 words)
  * Audio Transcript: "${question.textContent}"
  * User's Summary: "${userText}"
  * **Word Count:** ${wordCount}
  * **Required Word Range:** ${question.wordCountMin || 50}-${
    question.wordCountMax || 70
  } words

  ---
  ### **Evaluation Strategy (CRITICAL INSTRUCTIONS)**

  CONTENT EVALUATION HIERARCHY (MANDATORY):
    ### **Step 1 — IDEA COVERAGE CHECK (PRIMARY)**
    Evaluate whether the user's summary accurately captures the **CORE MESSAGE** and **MAIN IDEAS** of the audio, regardless of wording.

    Main ideas may include:
    - the central topic or comparison,
    - key causes or reasons,
    - key effects or consequences,
    - limitations or challenges,
    - and the final conclusion or outcome.

    **RULE:**
    If **ALL main ideas are present and correct**, the response **MUST be eligible for Content = 4**, even if:
    - wording is fully paraphrased,
    - ideas are combined or compressed,
    - examples are removed,
    - or the summary is concise.

    ### **CONTENT SUFFICIENCY RULE (MANDATORY)**
    A summary is considered **sufficient** if it communicates the full meaning of the audio.
    Do NOT require every reason or explanation to be stated separately.

    ### **CONTENT COMPRESSION RULE (STRICT)**
    When multiple related reasons, limitations, or explanations from the audio
    are accurately **combined into one clause or sentence**, this MUST be treated as
    **FULL idea coverage**, not missing detail.

    Do NOT penalize Content for:
    - merging multiple causes into one sentence,
    - summarizing explanations at a higher level,
    - removing examples while keeping meaning intact.

    ### **Step 2 — PHRASE SUPPORT CHECK (SECONDARY)**
    Scan for meaningful phrases (3–5 connected words) from the Audio Transcript.
    Phrase matching may be used **ONLY as supporting evidence** of comprehension.

    **IMPORTANT:**
    - Exact phrase reuse is NOT required for full marks.
    - Phrase matching must NEVER override accurate idea coverage.
    - Penalize Content ONLY when ideas are missing, incorrect, or listed without synthesis.

    ### **CONTENT–FORM SEPARATION RULE (STRICT)**
    Word count and Form penalties MUST NOT influence Content scoring.
    If all main ideas are present, Content MUST be scored independently.
    
  ---
  ### **Scoring Rubrics**

  **1. Content (Score from 0 to 4):**
    4 — Full comprehension:
      - Accurately summarizes ALL main ideas from the audio
      - Ideas are logically connected and condensed
      - Paraphrasing is accurate and meaningful
      - Phrase overlap may exist but is NOT required
    3 — Adequate comprehension:
      - Most main ideas are captured
      - Minor omissions or inefficient synthesis
      - May rely on some phrase reuse OR partial paraphrasing
    2 — Partial comprehension:
      - Some main ideas identified
      - Heavy repetition, weak synthesis, or over-reliance on copied fragments
    1 — Limited comprehension:
      - Disconnected ideas or keyword listing
    0 — No comprehension:
      - Irrelevant, unintelligible, or keyword-only response

  **2. Form (Score from 0 to 2):**
    * **2:** Contains 50-70 words.
    * **1:** Contains 40-49 words or 71-100 words.
    * **0:** Contains less than 40 words or more than 100 words; or written in all caps/bullet points.

  **3. Grammar (Score from 0 to 2):**
    * **2:** **Correct:** Correct grammatical structures. No Article or Verb form errors.
    * **1:** **Minor Errors:** Contains 1-2 grammatical errors (e.g., a missing article or slight verb slip) but communication is not hindered.
    * **0:** **Defective:** Contains multiple basic errors (Articles, V1/V3/V4 violations) or defective structure (e.g., "Promote use of technology" instead of "Promoting the use...").

  **4. Vocabulary (Score from 0 to 2):**
    * **2:** Appropriate choice of words.
    * **1:** Some lexical errors but with no hindrance to communication.
    * **0:** Defective word choice which could hinder communication.

  **5. Spelling (Score from 0 to 2):**
    * **2:** Correct spelling.
    * **1:** One spelling error.
    * **0:** More than one spelling error.
    * NOTE : Spelling errors must NOT be duplicated under grammar or vocabulary.

  ---
  ### **Error Analysis Instructions**

  **CRITICAL:** You must provide detailed error analysis by identifying specific mistakes in the user's text.

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
  - **Grammar (High Priority):**
    - **Articles:** Missing/Wrong 'a', 'an', 'the'.
    - **Verb Forms:** Incorrect form after to/be/have.
    - **Agreement:** Subject-verb mismatches.
  - **Spelling:** Misspelled words (Strict check).
  - **Vocabulary:** Wrong word choice.

  **IMPORTANT:**
    - **Connector Immunity:** Do NOT mark "but", "whereas", "as", "and", "so" as grammar errors.
    - **Error Prioritization:** 1. Spelling -> 2. Grammar -> 3. Vocabulary.

  ### **Required Output Format**
  Your final output **must** be a single, minified JSON object with NO markdown. Adhere strictly to this schema:
  {
    "scores": {
      "content": <number_0_to_4>,
      "form": <number_0_to_2>,
      "grammar": <number_0_to_2>,
      "vocabulary": <number_0_to_2>,
      "spelling": <number_0_to_2>
    },
    "feedback": {
      "summary": "A brief overall assessment.",
      "content": "Feedback on phrase usage (mention if phrases were found or if it was just keywords).",
      "form": "Feedback on length.",
      "grammar": "Feedback on articles and verb forms.",
      "vocabulary": "Feedback on word choice.",
      "spelling": "Feedback on spelling."
    },
    "suggestions": ["Actionable tip 1 (e.g., 'Use more 3-5 word phrases from audio').", "Actionable tip 2."],
    "errorAnalysis": {
      "grammarErrors": [
        {
          "text": "error text",
          "type": "grammar",
          "position": { "start": 0, "end": 1 },
          "correction": "correction",
          "explanation": "Specific rule explanation (e.g., 'Verb should be base form after to')"
        }
      ],
      "spellingErrors": [
        {
          "text": "error text",
          "type": "spelling",
          "position": { "start": 0, "end": 1 },
          "correction": "correction",
          "explanation": "explanation"
        }
      ],
      "vocabularyIssues": [
        {
          "text": "error text",
          "type": "vocabulary",
          "position": { "start": 0, "end": 1 },
          "correction": "correction",
          "explanation": "explanation"
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
      (totalAchievedScore / totalMaxScore) * 100
    );

    return {
      score: overallScore,
      isCorrect: percentageScore >= 65,
      feedback:
        evaluation.feedback?.summary ||
        'Spoken text summary evaluated successfully.',
      detailedAnalysis: {
        overallScore,
        actualWordCount: wordCount,
        requiredWordRange: `${question.wordCountMin || 50}-${
          question.wordCountMax || 70
        }`,
        timeTakenSeconds: timeTakenSeconds || 0,
        scores: {
          content: { score: contentScore, max: 4 },
          form: { score: formScore, max: 2 },
          grammar: { score: grammarScore, max: 2 },
          vocabulary: { score: vocabularyScore, max: 2 },
          spelling: { score: spellingScore, max: 2 },
        },
        breakdown: {
          content: `${contentScore}/4 - Content relevance and comprehension`,
          form: `${formScore}/2 - Word count and format`,
          grammar: `${grammarScore}/2 - Grammatical structures`,
          vocabulary: `${vocabularyScore}/2 - Word choice and usage`,
          spelling: `${spellingScore}/2 - Spelling accuracy`,
        },
        feedback: evaluation.feedback || {},
        errorAnalysis: evaluation.errorAnalysis || {
          grammarErrors: [],
          spellingErrors: [],
          vocabularyIssues: [],
        },
        userText: userText, // Include original text for highlighting
      },
      suggestions: evaluation.suggestions || [
        'Focus on main ideas from the audio',
        'Stay within word count limits (50-70 words)',
        'Use proper grammar and vocabulary',
      ],
    };
  } catch (error) {
    console.error('OpenAI evaluation error for Summarize Spoken Text:', error);
    return {
      score: 0,
      isCorrect: false,
      feedback: 'Unable to evaluate response at this time.',
      detailedAnalysis: {
        overallScore: 0,
        actualWordCount: wordCount,
        requiredWordRange: `${question.wordCountMin || 50}-${
          question.wordCountMax || 70
        }`,
        timeTakenSeconds: timeTakenSeconds || 0,
        scores: {
          content: { score: 0, max: 4 },
          form: { score: 0, max: 2 },
          grammar: { score: 0, max: 2 },
          vocabulary: { score: 0, max: 2 },
          spelling: { score: 0, max: 2 },
        },
        breakdown: {
          content: '0/4 - Content relevance and comprehension',
          form: '0/2 - Word count and format',
          grammar: '0/2 - Grammatical structures',
          vocabulary: '0/2 - Word choice and usage',
          spelling: '0/2 - Spelling accuracy',
        },
        feedback: {},
      },
      suggestions: ['Please try again later'],
    };
  }
}

/**
 * Evaluate Highlight Incorrect Words responses
 */
async function evaluateHighlightIncorrectWords(
  question: Question,
  userResponse: any,
  timeTakenSeconds?: number
): Promise<QuestionEvaluationResult> {
  const highlightedWords = userResponse.highlightedWords || [];
  const incorrectWords = question.incorrectWords || [];

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

  // Use correct/total format like Fill in the Blanks
  const score = correctHighlights; // Show actual correct highlights count
  const isCorrect =
    correctHighlights === incorrectWords.length && incorrectHighlights === 0;

  return {
    score,
    isCorrect,
    feedback: `You correctly identified ${correctHighlights} out of ${incorrectWords.length} incorrect words and incorrectly highlighted ${incorrectHighlights} correct words.`,
    detailedAnalysis: {
      overallScore: score,
      highlightedWords,
      incorrectWords,
      cleanedHighlighted,
      cleanedIncorrect,
      correctHighlights,
      incorrectHighlights,
      totalIncorrectWords: incorrectWords.length,
      // Add structured scores for consistent frontend display
      scores: {
        listening: { score: correctHighlights, max: incorrectWords.length },
      },
    },
    suggestions: [
      'Listen carefully to identify differences between audio and text',
      'Focus on pronunciation and word stress patterns',
      'Practice with different accents and speaking speeds',
    ],
  };
}

/**
 * Evaluate Write from Dictation responses
 */
async function evaluateWriteFromDictation(
  question: Question,
  userResponse: any,
  timeTakenSeconds?: number
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
      score: 0,
      isCorrect: false,
      feedback: 'No correct answer defined for this question.',
      detailedAnalysis: {
        overallScore: 0,
        userText: userResponse.text || '',
        correctText: correctTextOriginal,
        userWords,
        correctWords,
        correctWordCount: 0,
        totalWords: 0,
        accuracy: 0,
        missingWords: [],
        extraWords: [],
        scores: {
          listening: { score: 0, max: 0 },
        },
        errorAnalysis: {
          spellingErrors: [],
          grammarErrors: [],
          vocabularyIssues: [],
        },
      },
      suggestions: [
        'Focus on spelling accuracy',
        'Listen for punctuation cues in the audio',
        'Practice typing while listening to improve speed and accuracy',
      ],
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
      (w, idx) => w === correctWord && !userWordsUsed.has(idx)
    );
    if (index !== -1) {
      correctWordCount++;
      userWordsUsed.add(index);
    }
  }

  // Second pass: find spelling mistakes (similar words for unmatched correct words)
  for (const correctWord of correctWords) {
    const hasExactMatch = userWordsCopy.some(
      (w, idx) => w === correctWord && userWordsUsed.has(idx)
    );
    if (!hasExactMatch) {
      const similarIndex = userWordsCopy.findIndex(
        (w, idx) => !userWordsUsed.has(idx) && areSimilar(w, correctWord)
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
    (_, idx) => !userWordsUsed.has(idx)
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
    score,
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
    detailedAnalysis: {
      overallScore: score,
      userText: userResponse.text || '',
      correctText: correctTextOriginal,
      userWords,
      correctWords,
      correctWordCount,
      totalWords: correctWords.length,
      accuracy,
      missingWords,
      extraWords: extraWordsInResponse,
      // Add structured scores for consistent frontend display
      scores: {
        listening: { score: correctWordCount, max: correctWords.length },
      },
      errorAnalysis,
    },
    suggestions: [
      'Focus on spelling accuracy',
      'Listen for punctuation cues in the audio',
      'Practice typing while listening to improve speed and accuracy',
      'Make sure all words are present and no extra words are added',
    ],
  };
}

/**
 * Evaluate Highlight Correct Summary responses
 */
async function evaluateHighlightCorrectSummary(
  question: Question,
  userResponse: any,
  timeTakenSeconds?: number
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
    (option: any) => option.id === selectedSummary
  )[0].text;

  const correctOptionText = correctAnswers[0].text;

  // Generate explanation for incorrect answers
  let explanation = '';
  if (!isCorrect) {
    try {
      explanation = await generateDynamicExplanationListening({
        questionType: 'HIGHLIGHT_CORRECT_SUMMARY',
        questionStatement: question.questionStatement,
        selectedAnswer: userSelectedText,
        correctAnswer: correctOptionText,
        allOptions: question.options,
      });
    } catch (error) {
      console.error(
        'Error generating explanation for HIGHLIGHT_CORRECT_SUMMARY:',
        error
      );
      explanation = '';
    }
  }

  return {
    score,
    isCorrect,
    feedback: isCorrect
      ? 'Correct! You selected the best summary.'
      : 'Incorrect. The selected summary does not best represent the audio content.',
    detailedAnalysis: {
      overallScore: score,
      selectedSummary,
      correctAnswerIds,
      timeTaken: timeTakenSeconds || 0,
      scores: {
        listening: { score: score, max: 1 },
      },
      selectedOptionText: userSelectedText,
      correctOptionText: correctOptionText,
      explanation: explanation,
    },
    suggestions: isCorrect
      ? ['Excellent listening comprehension!']
      : [
          'Focus on main ideas rather than details',
          'Listen for the overall theme and purpose',
          'Practice identifying key information in audio content',
        ],
  };
}

/**
 * Evaluate Select Missing Word responses
 */
async function evaluateSelectMissingWord(
  question: Question,
  userResponse: any,
  timeTakenSeconds?: number
): Promise<QuestionEvaluationResult> {
  const selectedWord =
    userResponse.selectedWord || userResponse.selectedOptions?.[0];
  const correctAnswers = question.options.filter((opt: any) => opt.isCorrect);
  const correctAnswerIds = correctAnswers.map((opt: any) => opt.id);

  const isCorrect = correctAnswerIds.includes(selectedWord);
  // Use 1/0 format for single answer questions
  const score = isCorrect ? 1 : 0;

  console.log(question);

  const selectedOptionText = question.options.filter(
    (opt: any) => opt.id === selectedWord
  )[0].text;
  const correctOptionText = correctAnswers[0].text;

  console.log(correctOptionText, 'MMMM');

  // Generate explanation for incorrect answers
  let explanation = '';
  if (!isCorrect) {
    try {
      explanation = await generateDynamicExplanationListening({
        questionType: 'SELECT_MISSING_WORD',
        questionStatement: question.questionStatement,
        selectedAnswer: selectedOptionText,
        correctAnswer: correctOptionText,
        allOptions: question.options,
      });
    } catch (error) {
      console.error(
        'Error generating explanation for SELECT_MISSING_WORD:',
        error
      );
      explanation = '';
    }
  }

  return {
    score,
    isCorrect,
    feedback: isCorrect
      ? 'Correct! You identified the missing word accurately.'
      : 'Incorrect. Listen again for context clues about the missing word.',
    detailedAnalysis: {
      overallScore: score,
      selectedWord,
      correctAnswers: correctAnswerIds,
      timeTaken: timeTakenSeconds || 0,
      // Add structured scores for consistent frontend display
      scores: {
        listening: { score: score, max: 1 },
      },
      selectedOptionText,
      correctOptionText,
      explanation: explanation,
    },
    suggestions: isCorrect
      ? ['Great listening skills!']
      : [
          'Pay attention to context and meaning',
          'Listen for grammatical clues',
          'Consider the logical flow of the sentence',
        ],
  };
}

/**
 * Evaluate Listening Fill in the Blanks responses with flexible text matching
 */
async function evaluateListeningFillInTheBlanks(
  question: Question,
  userResponse: any,
  timeTakenSeconds?: number
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
    score
  );

  // Generate formal explanation for incorrect blanks
  let explanation = '';
  if (!isCorrect) {
    try {
      // Get first incorrect blank for explanation
      const firstIncorrectBlank = Object.entries(blankResults).find(
        ([_, result]: [string, any]) => !result.isCorrect
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
        error
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
    isCorrect,
    score,
    feedback: aiFeedback.feedback,
    suggestions: aiFeedback.suggestions,
    detailedAnalysis: {
      overallScore: score,
      correctCount,
      totalBlanks,
      timeTakenSeconds,
      // // Add structured scores for consistent frontend display
      scores: {
        listening: { score: correctCount, max: totalBlanks },
      },
      blankResults,
      errorAnalysis,
      userText, // Include text representation for highlighting
      explanation: explanation,
    },
  };
}

/**
 * Check if listening answer is correct.
 * This now requires an exact match after cleaning.
 */
function isListeningAnswerCorrect(
  userAnswer: string,
  correctAnswer: string
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
  score: number
): Promise<{ feedback: string; suggestions: string[] }> {
  const correctCount = Object.values(blankResults).filter(
    (result: any) => result.isCorrect
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
}): Promise<string> {
  const {
    questionType,
    textContent,
    questionStatement,
    selectedAnswer,
    correctAnswer,
    allOptions,
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

Provide a brief explanation (2-3 lines maximum) that:
1. Clearly states why the correct answer is right with evidence from the passage
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
      error
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
  userOrder: string[];
  correctOrder: string[];
  correctPairs: number;
  maxPairs: number;
  paragraphs?: any;
}): Promise<string> {
  const {
    questionType,
    textContent,
    userOrder,
    correctOrder,
    correctPairs,
    maxPairs,
    paragraphs,
  } = params;

  try {
    // Get paragraph texts for context
    const paragraphTexts =
      paragraphs?.map((p: any) => `${p.id}: ${p.text.substring(0, 100)}...`) ||
      [];

    const prompt = `
You are an expert PTE Academic tutor providing detailed explanations for reorder paragraphs reading questions.

**Question Type:** ${questionType}

**Paragraphs:**
${paragraphTexts.join('\n')}

**Your Order:** ${userOrder.join(' → ')}
**Correct Order:** ${correctOrder.join(' → ')}
**Score:** ${correctPairs} out of ${maxPairs} adjacent pairs correct

Provide a brief explanation (3-4 lines maximum) that:
1. Explains the logical flow of the correct order
2. Identifies where your ordering went wrong and what you should have done instead

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
            'You are an expert PTE Academic tutor specializing in reorder paragraphs reading questions.',
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
      'Error generating dynamic explanation for reorder paragraphs:',
      error
    );
    throw error;
  }
}

/**
 * Generate dynamic explanation using AI for fill in the blanks questions
 */
async function generateDynamicExplanationFillBlanks(params: {
  questionType: string;
  textContent?: string | null;
  blankResults: any;
  correctCount: number;
  totalBlanks: number;
}): Promise<string> {
  const { questionType, textContent, blankResults, correctCount, totalBlanks } =
    params;

  try {
    // Get incorrect blanks for detailed analysis
    const incorrectBlanks = Object.entries(blankResults)
      .filter(([_, result]: [string, any]) => !result.isCorrect)
      .map(([blankKey, result]: [string, any]) => {
        const blankNumber = blankKey.replace('blank', '');
        return `Blank ${blankNumber}: You wrote "${
          result.userAnswer || '(empty)'
        }", correct answer is "${result.correctAnswer}"`;
      });

    const prompt = `
You are an expert PTE Academic tutor. Analyze the fill-in-the-blanks performance and provide a concise, educational explanation.

**Passage Context:**
${textContent || 'No passage provided'}

**Your Performance:** ${correctCount}/${totalBlanks} correct

**Your Incorrect Answers:**
${
  incorrectBlanks.length > 0
    ? incorrectBlanks.join('\n')
    : 'All answers were correct'
}

Generate a 2-3 sentence explanation that:
1. Points out the grammatical or contextual reason why your incorrect answers don't fit
2. Explains what the correct answers reveal about the intended meaning or grammar

Guidelines:
- Address the user directly in second person: "Your answers showed...", "The text suggests..."
- Focus on understanding patterns and word relationships
- Be specific about grammatical rules (e.g., verb tense, word form, collocations)
- Keep it educational and encouraging
`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content:
            'You are an expert PTE Academic tutor specializing in fill in the blanks reading questions.',
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
      'Error generating dynamic explanation for fill in the blanks:',
      error
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
}): Promise<string> {
  const {
    questionType,
    questionStatement,
    audioTranscript,
    selectedAnswer,
    correctAnswer,
    allOptions,
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

Provide a brief explanation (2-3 lines maximum) that:
1. Clearly states why the correct answer is right with evidence from the audio
2. Clearly explains why **your selected answers** were incorrect or incomplete.

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
                `• You wrote: "${b.userAnswer}", Correct: "${b.correctAnswer}"`
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
      error
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
      error
    );
    throw error;
  }
}
