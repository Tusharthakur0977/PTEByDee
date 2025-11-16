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

    **For each error you find:**
    1. Identify the EXACT word or phrase that contains the error (just the word, not surrounding text)
    2. Provide the correct replacement from the original text
    3. Give a clear explanation of the pronunciation or fluency issue
    4. Set position to {"start": 0, "end": 1} (we'll match by word content, not position)

    **Error Types to Look For:**
    - **Pronunciation**: Mispronounced words, incorrect stress, unclear articulation
    - **Fluency**: Hesitations, filler words (um, uh, er), unnatural pauses
    - **Content**: Omitted words, inserted words, word substitutions

    **IMPORTANT:**
    - Only include errors that actually exist in the transcription
    - For "text" field, provide ONLY the incorrect word/phrase from transcription
    - Be very specific with the exact word that's wrong

    ---
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
        fullEvaluation: evaluation, // Store the complete OpenAI response
        // Add structured scores for consistent frontend display
        scores: {
          content: { score: contentScore, max: maxContentScore },
          pronunciation: {
            score: pronunciationScore,
            max: pronunciationMaxScore,
          },
          oralFluency: { score: fluencyScore, max: fluencyMaxScore },
        },
        errorAnalysis: evaluation.errorAnalysis || {
          pronunciationErrors: [],
          fluencyErrors: [],
          contentErrors: [],
        },
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
        fullEvaluation: evaluation, // Store the complete OpenAI response
        // Add structured scores for consistent frontend display
        scores: {
          content: { score: contentScore, max: maxContentScore },
          pronunciation: { score: pronunciationScore, max: 5 },
          oralFluency: { score: fluencyScore, max: 5 },
        },
        errorAnalysis: evaluation.errorAnalysis || {
          pronunciationErrors: [],
          fluencyErrors: [],
          contentErrors: [],
        },
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

  const prompt = `
    You are an official PTE Academic grader. Evaluate this "Describe Image" response strictly following the provided scoring rubric.

    **Image Analysis Reference:**
    - Image Type: ${imageType}
    - Main Topic: ${mainTopic}
    - Key Elements to Mention: ${keyElements.join(', ')}

    **User's Description:** "${transcribedText}"
    **Time Taken:** ${timeTakenSeconds || 'Not specified'} seconds

    **Scoring Rubrics:**
    **1. Content (Score from 0 to 6):**
      * **6 pts:** The response includes mainly superficial descriptions with minor inaccuracies. The vocabulary is narrow and expressions are used repeatedly. A listener could visualize **elements** of the image, but not a cohesive whole.
      * **5 pts:** The response includes minimal, superficial descriptions with some inaccuracies. Limited vocabulary and simple expressions dominate. A listener could visualize some elements **with effort**.
      * **4 pts:** The response is composed of disconnected elements or a list of points without description. Vocabulary is highly restricted. A listener would **struggle** to visualize the image.
      * **3 pts:** The response is relevant but too limited to assign a higher score.
      * **2 pts:** The response is highly minimal (e.g., one or two relevant words) but is not a coherent description.
      * **1 pt:** The response is relevant but almost meaningless (e.g., one relevant word).
      * **0 pts:** The response is irrelevant, non-English, or no meaningful response is provided.

    **2. Pronunciation (Score from 0 to 5):**
      * **5 pts:** All vowels and consonants are pronounced in a way that is easily understood by native speakers. Stress is placed correctly on all words. Intonation is appropriate. Any mispronunciations are rare and do not affect intelligibility.
      * **4 pts:** Most vowels and consonants are pronounced correctly. Some consistent errors might make a few words unclear. A few consonants in certain contexts may be regularly distorted, omitted or mispronounced. Stress- dependent vowel reduction may occur on a few words.
      * **3 pts:** Some consonants and vowels are consistently mispronounced. At least 2/3 of speech is intelligible, but listeners might need to adjust to the accent. Some consonants are regularly omitted, and consonant sequences may be simplified. Stress may be placed incorrectly on some words or be unclear.
      * **2 pts:** Many consonants and vowels are mispronounced, resulting in a strong intrusive foreign accent. Listeners may have difficulty understanding about 1/3 of the words. Many consonants may be distorted or omitted. Consonant sequences may be non-English. Stress is placed in a non-English manner; unstressed words may be reduced or omitted, and a few syllables added or missed.
      * **1 pt:** Pronunciation seems completely characteristic of another language. Many consonants and vowels are mispronounced, mis-ordered or omitted. Listeners may find more than 1/2 of the speech unintelligible. Stressed and unstressed syllables are realized in a non-English manner. Several words may have the wrong number of syllables
      * **0 pts:** Very few words are intelligible, OR Irrelevant, non-English, or no meaningful speech.

    **3. Oral Fluency (Score from 0 to 5):**
      * **5 pts:** Speech is smooth, effortless, and at a consistent native-like speed. Rhythm, phrasing, and word emphasis are natural. There are no hesitations, repetitions, or false starts.
      * **4 pts:** Speech has an acceptable rhythm with appropriate phrasing and word emphasis. There is no more than one hesitation, one repetition or a false start. There are no significant phonological simplifications.
      * **3 pts:** Speech is at an acceptable speed but may be uneven. There may be more than one hesitation, but most words are spoken in continuous phrases. There are few repetitions or false starts. There are no long pauses and speech does not sound staccato.
      * **2 pts:** Speech may be uneven or staccato. Speech (if >= 6 words) has at least one smooth three-word run, and no more than two or three hesitations, repetitions or false starts. There may be one long pause, but not two or more.
      * **1 pt:** Speech has irregular phrasing or sentence rhythm. Poor phrasing, staccato or syllabic timing, and/or multiple hesitations, repetitions, and/or false starts make spoken performance notably uneven or discontinuous. Long utterances may have one or two long pauses and inappropriate sentence-level word emphasis.
      * **0 pts:** Speech is slow and labored with little discernable phrase grouping, multiple hesitations, pauses, false starts, OR Irrelevant, non-English, or no meaningful speech.

    **Error Analysis Instructions:**
    MANDATORY: You MUST analyze the user's transcribed text and identify ALL errors. Do not return empty error arrays.

    Analyze for these error types:
    1. **Pronunciation Errors**: Words that sound mispronounced (e.g., "wuz" instead of "was")
    2. **Fluency Errors**: Filler words (um, uh, like, you know), hesitations, repetitions, false starts, or unnatural pauses
    3. **Grammar Errors**: ALL grammatical mistakes including:
        - Subject-verb agreement (e.g., "he go" → "he goes")
        - Tense errors (e.g., "I go yesterday" → "I went yesterday")
        - Article errors (e.g., "I see dog" → "I see a dog")
        - Preposition errors (e.g., "between X and with Y" → "between X and Y")
        - Word order errors (e.g., "quite decreasing" → "decreasing quite drastically")
        - Awkward phrasing or unnatural expressions
        - Incomplete phrases or missing words
    4. **Content Errors**: Inaccurate descriptions that don't match the image

    CRITICAL REQUIREMENTS:
    - Identify EVERY grammar error, no matter how small
    - Do NOT return empty arrays if errors exist
    - For each error, provide: exact text, type, correction, and explanation
    - Be strict and thorough in error detection

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
        "content": "<Detailed feedback specifically on the content>",
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
        "grammarErrors": [
          {
            "text": "incorrect grammar phrase",
            "type": "grammar",
            "position": { "start": 0, "end": 1 },
            "correction": "correct grammar phrase",
            "explanation": "explanation of grammar error (e.g., subject-verb agreement, tense, article usage, preposition, word order)"
          }
        ],
        "contentErrors": [
          {
            "text": "incorrect description",
            "type": "content",
            "position": { "start": 0, "end": 1 },
            "correction": "accurate description",
            "explanation": "description does not match image content"
          }
        ]
      }
    }

    CRITICAL: Return ALL errors found, including grammar errors. Do not return empty arrays if errors exist.
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
    **Your Role:** You are an expert AI evaluator for the PTE Academic test. Your task is to analyze a user's "Re-tell Lecture" speaking performance with extreme precision.

    **Objective:** You will be given an original lecture transcript and a transcription of a user's spoken response. Evaluate the response based on official PTE criteria for Content, Oral Fluency, and Pronunciation, and provide detailed, actionable feedback.

    ---
    ### **Evaluation and Scoring Instructions**

    **1. Content Analysis (0-5 scale):**
    Evaluate how well the user summarized the main ideas and important points of the lecture.
      * **6 pts:** Captures some main ideas and details but may have minor inaccuracies or focus on less important points. Attempts to paraphrase with some success. Listeners may need some effort to follow.
      * **5 pts:** Captures some ideas but may be inaccurate or not differentiate between main points and details. May contain irrelevant information or repetition. Vocabulary is narrow. Requires significant effort to follow.
      * **4 pts:** Mostly inaccurate or incomplete, missing main ideas. Relies heavily on repeating language from the lecture. Limited comprehension and vocabulary. Lacks coherence.
      * **3 pts:** Repeats isolated words/phrases without meaningful context. Does not communicate effectively.
      * **2 pts:** Response is related to the lecture but is too limited to be scored higher.
      * **1 pt:** Response is highly minimal (e.g., one or two relevant words) but not coherent.
      * **0 pts:** Response is irrelevant, non-English, or no meaningful response is provided.

    * **Pronunciation (0-5 scale):** Score based on the accuracy of the transcribed words.
        * **5 pts:** Transcription is clear and accurate, with only very minor, isolated errors that do not impact understanding.
        * **4 pts:** Several errors that suggest pronunciation issues but text is mostly understandable.
        * **3 pts:** Many errors, making the text difficult to follow.
        * **2 pts:** The transcription is mostly incorrect, indicating very poor pronunciation.
        * **1 pt:** The transcription is almost entirely incorrect, with only a few recognizable words.
        * **0 pts:** The transcription is completely incorrect, contains no recognizable English words, or no meaningful speech transcribed.
        
    * **Oral Fluency (0-5 scale):** Score based on filler words, hesitations, and natural flow.
        * **5 pts:** Smooth and flowing speech with almost no hesitations or filler words. Delivered in natural phrases.
        * **4 pts:** Noticeable hesitations or filler words that disrupt the flow.
        * **3 pts:** Uneven, slow, or fragmented speech.
        * **2 pts:** Very halting speech with many pauses or fillers.
        * **1 pt:** Extremely halting, with long pauses and many fillers.
        * **0 pts:** Mostly isolated words, not delivered in phrases, or no meaningful speech.

    **Important Guidelines:**
    * Focus on content accuracy and relevance to the original lecture
    * Consider the logical organization and coherence of the response
    * Evaluate pronunciation based on transcription quality and clarity
    * Assess fluency through speech patterns evident in the transcription

    ---
    ### **Error Analysis Instructions**

    **CRITICAL:** You must provide detailed error analysis by identifying specific mistakes in the user's transcribed speech.

    **For each error you find:**
    1. Identify the EXACT word or phrase that contains the error (just the word, not surrounding text)
    2. Provide the correct replacement from the original lecture
    3. Give a clear explanation of the pronunciation, fluency, or content issue
    4. Set position to {"start": 0, "end": 1} (we'll match by word content, not position)

    **Error Types to Look For:**
    - **Pronunciation**: Mispronounced words, incorrect stress, unclear articulation
    - **Fluency**: Hesitations, filler words (um, uh, er), unnatural pauses
    - **Content**: Omitted key points, incorrect information, word substitutions

    **IMPORTANT:**
    - Only include errors that actually exist in the transcription
    - For "text" field, provide ONLY the incorrect word/phrase from transcription
    - Be very specific with the exact word that's wrong

    ---
    ### **Required Output Format**
    Your final output **must** be a single JSON object with the following structure:

    **Original Lecture**: "${originalLecture}"
    **User's Transcribed Response**: "${transcribedText}"
    **Time Taken**: ${timeTakenSeconds || 'Not specified'} seconds

    {
      "Content": <number_0_to_6>,
      "Oral Fluency": <number_0_to_5>,
      "Pronunciation": <number_0_to_5>,
      "feedback": {
        "content": "Specific feedback on content accuracy and comprehension",
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
            "text": "incorrect information",
            "type": "content",
            "position": { "start": 0, "end": 1 },
            "correction": "correct information from lecture",
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
        fullEvaluation: evaluation,
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
        contentMaxScore: 5,
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

    ---
    ### **Input for Evaluation**

    * **Original Text:**
    "${question.textContent}"

    * **User's Summary:**
    "${userText}"

    * **Word Count:** ${wordCount}

    ---
    ### **Scoring Rubrics**

    **1. Content (Score from 0 to 4):**
    * **4 pts:** Comprehensively summarizes the source text, demonstrating full comprehension. Paraphrases effectively, removes extraneous details, and synthesizes all main ideas concisely and coherently.
    * **3 pts:** Adequately summarizes, demonstrating good comprehension. Paraphrasing is used, but extraneous details may interfere with clarity. Correctly identifies main ideas with some minor omissions.
    * **2 pts:** Partially summarizes, demonstrating basic comprehension. Does not discern between main points and details. Relies heavily on repeating excerpts from the source text.
    * **1 pt:** Is relevant but not meaningfully summarized, demonstrating limited comprehension. Composed of disconnected ideas or excerpts. Main ideas are omitted or misrepresented.
    * **0 pts:** Demonstrates no comprehension of the source text.

    **2. Form (Score from 0 to 1):**
    * **1 pt:** Is written as one, single, complete sentence. The word count is between 5 and 75 words (inclusive). The summary is not written in all capital letters.
    * **0 pts:** Is not written as one single, complete sentence, OR contains fewer than 5 or more than 75 words, OR is written in all capital letters.

    **3. Grammar (Score from 0 to 2):**
    * **2 pts:** Has correct grammatical structure.
    * **1 pt:** Contains grammatical errors, but they do not hinder communication.
    * **0 pts:** Has defective grammatical structure which could hinder communication.

    **4. Vocabulary (Score from 0 to 2):**
    * **2 pts:** Has appropriate choice of words.
    * **1 pt:** Contains lexical errors, but they do not hinder communication.
    * **0 pts:** Has defective word choice which could hinder communication.

    ---
    ### **Error Analysis Instructions**

    **CRITICAL:** You must provide detailed error analysis by identifying specific mistakes in the user's text.

    **For each error you find:**
    1. Identify the EXACT word or phrase that contains the error (just the word, not surrounding text)
    2. Provide the correct replacement
    3. Give a clear explanation
    4. Set position to {"start": 0, "end": 1} (we'll match by word content, not position)

    **Error Types to Look For:**
    - **Grammar**: Subject-verb disagreement, wrong tenses, missing/incorrect articles, preposition errors
    - **Spelling**: Misspelled words (check carefully)
    - **Vocabulary**: Wrong word choice, repetitive words, unclear expressions

    **IMPORTANT:**
    - Only include errors that actually exist
    - For "text" field, provide ONLY the incorrect word/phrase, nothing else
    - Be very specific with the exact word that's wrong
    - When checking for grammatical mistakes, make sure that if a synonym is used but the grammar is correct, it should **not** be marked as an error.
    - **Do not** mark the correct use of conjunctions or connectors (e.g., 'and', 'but', 'whereas', 'as') as grammatical errors. These are essential for linking ideas into the required single-sentence format.
    - **Error Prioritization:** A single error MUST be categorized only ONCE. Use this strict priority:
      1. **Spelling:** If a word is misspelled (e.g., "goverment"), it MUST go into "spellingErrors" ONLY. Do not list it in grammar or vocabulary.
      2. **Grammar:** If spelling is correct, but the word or phrase breaks a sentence rule (e.g., "he go" instead of "he goes"), it MUST go into "grammarErrors" ONLY.
      3. **Vocabulary:** Only if spelling and grammar are correct, but the word choice is poor or inappropriate (e.g., using "big" instead of "significant"), it MUST go into "vocabularyIssues".

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
        errorAnalysis: evaluation.errorAnalysis || {
          grammarErrors: [],
          spellingErrors: [],
          vocabularyIssues: [],
        },
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

    ---
    ### **Input for Evaluation**

    * **Essay Prompt:**
    "${question.textContent}"

    * **User's Essay:**
    "${userText}"

    * **Word Count:** ${wordCount}

    ---
    ### **Scoring Rubrics**

    **1. Content (Score from 0 to 6):**
    * **6:** Adequately addresses the main point; argument is convincing but lacks depth; support is inconsistent.
    * **5:** Relevant to the prompt but doesn't address main points adequately; support is often missing.
    * **4:** Superficial attempt to address the prompt; little relevant information; generic statements.
    * **3:** Incomplete understanding of the prompt; generic/repetitive phrasing.
    * **2:** Barely addresses the prompt; mostly generic/repetitive phrasing.
    * **1:** Almost no relevant information; very incomplete understanding.
    * **0:** Does not properly deal with the prompt.

    **2. Form (Score from 0 to 2):**
    * **2:** Length is between 200 and 300 words.
    * **1:** Length is between 120-199 or 301-380 words.
    * **0:** Length is less than 120 or more than 380 words; or the essay is written in all capital letters.

    **3. Development, Structure & Coherence (Score from 0 to 6):**
    * **6:** Conventional structure mostly present but requires some effort to follow; argument lacks some development; paragraphing is not always effective.
    * **5:** Traces of structure but composed of simple/disconnected ideas; a position is present but not a logical argument.
    * **4:** Little recognizable structure; disorganized and difficult to follow; lacks coherence.
    * **3:** Disconnected ideas; no hierarchy or coherence; no clear position.
    * **2:** Very disorganized; ideas are mostly disconnected.
    * **1:** Almost no coherence or structure.
    * **0:** No recognizable structure.

    **4. Grammar (Score from 0 to 2):**
    * **2:** Consistent grammatical control of complex language; errors are rare.
    * **1:** High degree of grammatical control; no mistakes that lead to misunderstanding.
    * **0:** Mainly simple structures and/or several basic mistakes that could hinder communication.

    **5. General Linguistic Range (Score from 0 to 6):**
    * **6:** Sufficient range for basic ideas, but limitations are evident with complex ideas; occasional lapses in clarity.
    * **5:** Narrow range, simple expressions used repeatedly; communication restricted to simple ideas.
    * **4:** Limited vocabulary and simple expressions dominate; communication is compromised.
    * **3:** Highly restricted vocabulary; significant limitations in communication.
    * **2:** Extremely restricted vocabulary; communication is very difficult.
    * **1:** Only isolated words or basic phrases.
    * **0:** Meaning is not accessible.

    **6. Vocabulary Range (Score from 0 to 2):**
    * **2:** Good range for general academic topics, but lexical shortcomings lead to imprecision.
    * **1:** Mainly basic vocabulary, insufficient for the topic.
    * **0:** Very limited basic vocabulary; meaning is often obscured.

    **7. Spelling (Score from 0 to 2):**
    * **2:** Correct spelling.
    * **1:** One spelling error.
    * **0:** More than one spelling error.

    ---
    ### **Error Analysis Instructions**

    **CRITICAL:** You must provide detailed error analysis by identifying specific mistakes in the user's text.

    **For each error you find:**
    1. Identify the EXACT word or phrase that contains the error (just the word, not surrounding text)
    2. Provide the correct replacement
    3. Give a clear explanation
    4. Set position to {"start": 0, "end": 1} (we'll match by word content, not position)

    **Error Types to Look For:**
    - **Grammar**: Subject-verb disagreement, wrong tenses, missing/incorrect articles, preposition errors
    - **Spelling**: Misspelled words (check carefully)
    - **Vocabulary**: Wrong word choice, repetitive words, unclear expressions

    **IMPORTANT:**
    - Only include errors that actually exist
    - For "text" field, provide ONLY the incorrect word/phrase, nothing else
    - Be very specific with the exact word that's wrong
    - **Error Prioritization:** A single error MUST be categorized only ONCE. Use this strict priority:
      1. **Spelling:** If a word is misspelled (e.g., "goverment"), it MUST go into "spellingErrors" ONLY. Do not list it in grammar or vocabulary.
      2. **Grammar:** If spelling is correct, but the word or phrase breaks a sentence rule (e.g., "he go" instead of "he goes"), it MUST go into "grammarErrors" ONLY.
      3. **Vocabulary:** Only if spelling and grammar are correct, but the word choice is poor or inappropriate (e.g., using "big" instead of "significant"), it MUST go into "vocabularyIssues".
    
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
        "summary": "A brief overall assessment of the essay.",
        "content": "Specific feedback on content.",
        "form": "Specific feedback on form.",
        "developmentStructureCoherence": "Specific feedback on structure.",
        "grammar": "Specific feedback on grammar.",
        "generalLinguisticRange": "Specific feedback on linguistic range.",
        "vocabularyRange": "Specific feedback on vocabulary.",
        "spelling": "Specific feedback on spelling."
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
        errorAnalysis: evaluation.errorAnalysis || {
          grammarErrors: [],
          spellingErrors: [],
          vocabularyIssues: [],
        },
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

  // Generate detailed explanation for reading questions using AI
  let explanation = '';
  if (!isCorrect && isReadingQuestion) {
    try {
      explanation = await generateDynamicExplanation({
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
      explanation = `The correct answer is "${correctOptionText}". Your selected answer "${selectedOptionText}" was incorrect. Review the passage carefully to find evidence supporting the correct answer.`;
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

  // Generate detailed explanation for reading questions using AI
  let explanation = '';
  if (!isCorrect && isReadingQuestion) {
    try {
      explanation = await generateDynamicExplanationMultiple({
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
  const isReadingQuestion = question.questionType.name.includes('READING');
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

    * **Task:** Listen to audio and write a summary (50-70 words)
    * **User's Summary:**
    "${userText}"

    * **Word Count:** ${wordCount}
    * **Required Word Range:** ${question.wordCountMin || 50}-${
    question.wordCountMax || 70
  } words

    ---
    ### **Scoring Rubrics**

    **1. Content (Score from 0 to 1):**
    * **1:** The response is relevant and meaningfully summarized, demonstrating good comprehension of the source text. Main ideas are captured and presented coherently with proper synthesis and the response is relevant but not meaningfully summarized, demonstrating limited comprehension of the source text. The response is composed of disconnected ideas or excerpts from the source text without any context or attempt at synthesis. Main ideas are omitted or misrepresented. The response lacks coherence and is difficult to follow.
    * **0:** Response is too limited to assign a higher score and demonstrates no comprehension of the source text.

    **2. Form (Score from 0 to 2):**
    * **2:** Contains 50-70 words
    * **1:** Contains 40-49 words or 71-100 words
    * **0:** Contains less than 40 words or more than 100 words. Summary is written in capital letters, contains no punctuation or consists only of bullet points or very short sentences.

    **3. Grammar (Score from 0 to 2):**
    * **2:** Correct grammatical structures
    * **1:** Contains grammatical errors with no hindrance to communication
    * **0:** Defective grammatical structure which could hinder communication

    **4. Vocabulary (Score from 0 to 2):**
    * **2:** Appropriate choice of words
    * **1:** Some lexical errors but with no hindrance to communication
    * **0:** Defective word choice which could hinder communication

    **5. Spelling (Score from 0 to 2):**
    * **2:** Correct spelling
    * **1:** One spelling error
    * **0:** More than one spelling error

    ---
    ### **Error Analysis Instructions**

    **CRITICAL:** You must provide detailed error analysis by identifying specific mistakes in the user's text.

    **For each error you find:**
    1. Identify the EXACT word or phrase that contains the error (just the word, not surrounding text)
    2. Provide the correct replacement
    3. Give a clear explanation
    4. Set position to {"start": 0, "end": 1} (we'll match by word content, not position)

    **Error Types to Look For:**
    - **Grammar**: Subject-verb disagreement, wrong tenses, missing/incorrect articles, preposition errors
    - **Spelling**: Misspelled words (check carefully)
    - **Vocabulary**: Wrong word choice, repetitive words, unclear expressions

    **IMPORTANT:**
    - Only include errors that actually exist
    - For "text" field, provide ONLY the incorrect word/phrase, nothing else
    - Be very specific with the exact word that's wrong
    - **Error Prioritization:** A single error MUST be categorized only ONCE. Use this strict priority:
      1. **Spelling:** If a word is misspelled (e.g., "goverment"), it MUST go into "spellingErrors" ONLY. Do not list it in grammar or vocabulary.
      2. **Grammar:** If spelling is correct, but the word or phrase breaks a sentence rule (e.g., "he go" instead of "he goes"), it MUST go into "grammarErrors" ONLY.
      3. **Vocabulary:** Only if spelling and grammar are correct, but the word choice is poor or inappropriate (e.g., using "big" instead of "significant"), it MUST go into "vocabularyIssues".

    ---
    ### **Required Output Format**
    Your final output **must** be a single, minified JSON object with NO markdown. Adhere strictly to this schema:
    {
      "scores": {
        "content": <number_0_to_1>,
        "form": <number_0_to_2>,
        "grammar": <number_0_to_2>,
        "vocabulary": <number_0_to_2>,
        "spelling": <number_0_to_2>
      },
      "feedback": {
        "summary": "A brief overall assessment of the summary.",
        "content": "Specific feedback on content comprehension and relevance.",
        "form": "Specific feedback on word count and format.",
        "grammar": "Specific feedback on grammatical structures.",
        "vocabulary": "Specific feedback on word choice and usage.",
        "spelling": "Specific feedback on spelling accuracy."
      },
      "suggestions": ["Actionable tip 1.", "Actionable tip 2.", "Actionable tip 3."],
      "errorAnalysis": {
        "grammarErrors": [
          {
            "text": "word or phrase with error",
            "type": "grammar",
            "position": { "start": 0, "end": 1 },
            "correction": "suggested correction",
            "explanation": "explanation of the error"
          }
        ],
        "spellingErrors": [
          {
            "text": "misspelled word",
            "type": "spelling",
            "position": { "start": 0, "end": 1 },
            "correction": "correct spelling",
            "explanation": "spelling correction needed"
          }
        ],
        "vocabularyIssues": [
          {
            "text": "inappropriate word choice",
            "type": "vocabulary",
            "position": { "start": 0, "end": 1 },
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
          content: { score: contentScore, max: 1 },
          form: { score: formScore, max: 2 },
          grammar: { score: grammarScore, max: 2 },
          vocabulary: { score: vocabularyScore, max: 2 },
          spelling: { score: spellingScore, max: 2 },
        },
        breakdown: {
          content: `${contentScore}/1 - Content relevance and comprehension`,
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
          content: { score: 0, max: 2 },
          form: { score: 0, max: 2 },
          grammar: { score: 0, max: 2 },
          vocabulary: { score: 0, max: 2 },
          spelling: { score: 0, max: 2 },
        },
        breakdown: {
          content: '0/2 - Content relevance and comprehension',
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
  const correctTextOriginal = question.textContent?.trim() || ''; // Keep original for display
  ``;
  // Calculate word-level accuracy
  const userWords = userText
    .split(/\s+/)
    .filter((word: string | any[]) => word.length > 0);
  const correctWords = correctTextLower
    .split(/\s+/)
    .filter((word: string | any[]) => word.length > 0);

  let correctWordCount = 0;
  const minLength = Math.min(userWords.length, correctWords.length);

  for (let i = 0; i < minLength; i++) {
    if (userWords[i] === correctWords[i]) {
      correctWordCount++;
    }
  }

  const accuracy =
    correctWords.length > 0
      ? (correctWordCount / correctWords.length) * 100
      : 0;
  const isCorrect = accuracy >= 80; // 80% accuracy threshold

  // Generate error analysis for incorrect words
  const errorAnalysis = {
    spellingErrors: [] as any[],
    grammarErrors: [] as any[],
    vocabularyIssues: [] as any[],
  };

  // Compare words and identify errors
  for (let i = 0; i < Math.max(userWords.length, correctWords.length); i++) {
    const userWord = userWords[i] || '';
    const correctWord = correctWords[i] || '';

    if (userWord !== correctWord) {
      if (correctWord && !userWord) {
        // Missing word
        errorAnalysis.spellingErrors.push({
          text: '(missing)',
          type: 'spelling',
          position: { start: 0, end: 1 },
          correction: correctWord,
          explanation: `Missing word: "${correctWord}"`,
        });
      } else if (userWord && !correctWord) {
        // Extra word
        errorAnalysis.spellingErrors.push({
          text: userWord,
          type: 'spelling',
          position: { start: 0, end: 1 },
          correction: '',
          explanation: `Extra word that should be removed`,
        });
      } else if (userWord && correctWord) {
        // Incorrect word
        errorAnalysis.spellingErrors.push({
          text: userWord,
          type: 'spelling',
          position: { start: 0, end: 1 },
          correction: correctWord,
          explanation: `Incorrect spelling or word`,
        });
      }
    }
  }

  // Use correct/total format like Fill in the Blanks
  const score = correctWordCount; // Show actual correct words count

  return {
    score,
    isCorrect,
    feedback: `You typed ${correctWordCount} out of ${correctWords.length} words correctly.`,
    detailedAnalysis: {
      overallScore: score,
      userText: userResponse.text || '', // Include original text for highlighting
      correctText: correctTextOriginal, // Use original text for display (not lowercase)
      userWords,
      correctWords,
      correctWordCount,
      totalWords: correctWords.length,
      accuracy,
      // Add structured scores for consistent frontend display
      scores: {
        listening: { score: correctWordCount, max: correctWords.length },
        // writing: { score: correctWordCount, max: correctWords.length }, // Also tests writing
      },
      errorAnalysis,
    },
    suggestions: [
      'Focus on spelling accuracy',
      'Listen for punctuation cues in the audio',
      'Practice typing while listening to improve speed and accuracy',
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
    ? allOptions
        .map((opt: any, index: number) => `${index + 1}. ${opt.text}`)
        .join('\n')
    : 'Options not available'
}

**Student's Answer:** ${selectedAnswer}
**Correct Answer:** ${correctAnswer}

Please provide a detailed, educational explanation that:
1. Clearly states why the correct answer is right
2. Explains why the student's answer was wrong
3. Points to specific evidence in the passage (if available)
4. Helps the student understand the reasoning process
5. Identifies any common misconceptions or traps

Keep the explanation concise but informative (2-3 sentences maximum).
Focus on teaching the student how to approach similar questions in the future.

**Response format:** Provide only the explanation text, no additional formatting.
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
    ? allOptions
        .map((opt: any, index: number) => `${index + 1}. ${opt.text}`)
        .join('\n')
    : 'Options not available'
}

**Student's Selected Answers:** ${selectedAnswers.join(', ')}
**Correct Answers:** ${correctAnswers.join(', ')}
**Incorrectly Selected:** ${
      incorrectlySelected.length > 0 ? incorrectlySelected.join(', ') : 'None'
    }
**Missed Correct Answers:** ${
      missedCorrect.length > 0 ? missedCorrect.join(', ') : 'None'
    }

Please provide a detailed, educational explanation that:
1. Explains why each correct answer is right with specific evidence from the passage
2. Explains why the incorrectly selected options were wrong
3. Helps the student understand what they missed and why
4. Provides guidance on how to identify all correct answers in similar questions

Keep the explanation concise but informative (3-4 sentences maximum).
Focus on teaching the student the systematic approach to multiple answer questions.

**Response format:** Provide only the explanation text, no additional formatting.
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

**Student's Order:** ${userOrder.join(' → ')}
**Correct Order:** ${correctOrder.join(' → ')}
**Score:** ${correctPairs} out of ${maxPairs} adjacent pairs correct

Please provide a detailed, educational explanation that:
1. Explains the logical flow of the correct order
2. Identifies where the student went wrong in their ordering
3. Points out key connecting words, chronological markers, or logical relationships
4. Helps the student understand how to identify the correct sequence

Keep the explanation concise but informative (3-4 sentences maximum).
Focus on teaching the student how to identify logical connections between paragraphs.

**Response format:** Provide only the explanation text, no additional formatting.
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
        return `Blank ${blankNumber}: Student wrote "${
          result.userAnswer || '(empty)'
        }", correct answer is "${result.correctAnswer}"`;
      });

    const prompt = `
You are an expert PTE Academic tutor providing detailed explanations for fill in the blanks reading questions.

**Question Type:** ${questionType}

**Passage with Blanks:**
${textContent || 'No passage provided'}

**Performance:** ${correctCount} out of ${totalBlanks} blanks correct

**Incorrect Answers:**
${
  incorrectBlanks.length > 0
    ? incorrectBlanks.join('\n')
    : 'All answers were correct'
}

Please provide a detailed, educational explanation that:
1. Explains why the correct answers fit grammatically and contextually
2. Identifies the specific grammatical or contextual clues that should guide the student
3. Explains common mistakes and how to avoid them
4. Provides strategies for approaching similar questions

Keep the explanation concise but informative (3-4 sentences maximum).
Focus on teaching the student how to use context and grammar clues effectively.

**Response format:** Provide only the explanation text, no additional formatting.
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
