import { PteQuestionTypeName } from '@prisma/client';
import openai from '../config/openAi';

interface QuestionEvaluationResult {
  score: number; // 0-100
  isCorrect: boolean;
  feedback: string;
  detailedAnalysis: any;
  suggestions: string[];
}

interface Question {
  id: string;
  questionCode: string;
  textContent?: string | null;
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

  switch (questionType) {
    case PteQuestionTypeName.READ_ALOUD:
      return evaluateReadAloud(question, userResponse, timeTakenSeconds);

    case PteQuestionTypeName.REPEAT_SENTENCE:
      return evaluateRepeatSentence(question, userResponse, timeTakenSeconds);

    case PteQuestionTypeName.DESCRIBE_IMAGE:
      return evaluateDescribeImage(question, userResponse, timeTakenSeconds);

    case PteQuestionTypeName.RE_TELL_LECTURE:
      return evaluateRetellLecture(question, userResponse, timeTakenSeconds);

    case PteQuestionTypeName.ANSWER_SHORT_QUESTION:
      return evaluateAnswerShortQuestion(question, userResponse);

    case PteQuestionTypeName.SUMMARIZE_WRITTEN_TEXT:
      return evaluateSummarizeWrittenText(
        question,
        userResponse,
        timeTakenSeconds
      );

    case PteQuestionTypeName.WRITE_ESSAY:
      return evaluateWriteEssay(question, userResponse, timeTakenSeconds);

    case PteQuestionTypeName.MULTIPLE_CHOICE_SINGLE_ANSWER_READING:
    case PteQuestionTypeName.MULTIPLE_CHOICE_SINGLE_ANSWER_LISTENING:
      return evaluateMultipleChoiceSingle(
        question,
        userResponse,
        timeTakenSeconds
      );

    case PteQuestionTypeName.MULTIPLE_CHOICE_MULTIPLE_ANSWERS_READING:
    case PteQuestionTypeName.MULTIPLE_CHOICE_MULTIPLE_ANSWERS_LISTENING:
      return evaluateMultipleChoiceMultiple(
        question,
        userResponse,
        timeTakenSeconds
      );

    case PteQuestionTypeName.RE_ORDER_PARAGRAPHS:
      return evaluateReorderParagraphs(
        question,
        userResponse,
        timeTakenSeconds
      );

    case PteQuestionTypeName.READING_FILL_IN_THE_BLANKS:
    case PteQuestionTypeName.READING_WRITING_FILL_IN_THE_BLANKS:
    case PteQuestionTypeName.LISTENING_FILL_IN_THE_BLANKS:
      return evaluateFillInTheBlanks(question, userResponse, timeTakenSeconds);

    case PteQuestionTypeName.SUMMARIZE_SPOKEN_TEXT:
      return evaluateSummarizeSpokenText(
        question,
        userResponse,
        timeTakenSeconds
      );

    case PteQuestionTypeName.HIGHLIGHT_CORRECT_SUMMARY:
      return evaluateHighlightCorrectSummary(
        question,
        userResponse,
        timeTakenSeconds
      );

    case PteQuestionTypeName.SELECT_MISSING_WORD:
      return evaluateSelectMissingWord(
        question,
        userResponse,
        timeTakenSeconds
      );

    case PteQuestionTypeName.HIGHLIGHT_INCORRECT_WORDS:
      return evaluateHighlightIncorrectWords(
        question,
        userResponse,
        timeTakenSeconds
      );

    case PteQuestionTypeName.WRITE_FROM_DICTATION:
      return evaluateWriteFromDictation(
        question,
        userResponse,
        timeTakenSeconds
      );

    default:
      throw new Error(`Unsupported question type: ${questionType}`);
  }
}

// SPEAKING

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
    ### **Required Output Format**
    Your final output **must** be a single JSON object.

    **Original Text**: "${question.textContent}"
    **Transcribed User Text**: "${transcribedText}"
    **Time Taken**: ${timeTakenSeconds || 'Not specified'} seconds

    Provide your evaluation as a JSON object:
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

    const overallScore = Math.round(
      contentPercentage * 0.6 +
        pronunciationPercentage * 0.25 +
        fluencyPercentage * 0.15
    );

    return {
      score: overallScore,
      isCorrect: overallScore >= 65,
      feedback:
        evaluation.feedback?.content ||
        evaluation.feedback?.summary ||
        'Audio response evaluated successfully.',
      detailedAnalysis: {
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

    const overallScore = Math.round(
      contentPercentage * 0.6 +
        pronunciationPercentage * 0.25 +
        fluencyPercentage * 0.15
    );

    return {
      score: overallScore,
      isCorrect: overallScore >= 65,
      feedback:
        evaluation.feedback?.content ||
        evaluation.feedback?.summary ||
        'Audio response evaluated successfully.',
      detailedAnalysis: {
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
      * **6 pts:** Clear, accurate, and full comprehension. Paraphrases main ideas and expands on key points seamlessly and logically. Uses varied and precise vocabulary. Well-organized and easy to follow.
      * **5 pts:** Clear and accurate, capturing main ideas and some important details. Ideas are formulated well in the user's own words. Mostly smooth and easy to follow.
      * **4 pts:** Captures some main ideas and details but may have minor inaccuracies or focus on less important points. Attempts to paraphrase with some success. Listeners may need some effort to follow.
      * **3 pts:** Captures some ideas but may be inaccurate or not differentiate between main points and details. May contain irrelevant information or repetition. Vocabulary is narrow. Requires significant effort to follow.
      * **2 pts:** Mostly inaccurate or incomplete, missing main ideas. Relies heavily on repeating language from the lecture. Limited comprehension and vocabulary. Lacks coherence.
      * **1 pt:** Repeats isolated words/phrases without meaningful context. Does not communicate effectively.
      * **0 pts:** Response is related to the lecture but is too limited to be scored higher.

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

    **Important Guidelines:**
    * Focus on content accuracy and relevance to the original lecture
    * Consider the logical organization and coherence of the response
    * Evaluate pronunciation based on transcription quality and clarity
    * Assess fluency through speech patterns evident in the transcription

    ---
    ### **Required Output Format**
    Your final output **must** be a single JSON object.

    **Original Lecture**: "${originalLecture}"
    **User's Transcribed Response**: "${transcribedText}"
    **Time Taken**: ${timeTakenSeconds || 'Not specified'} seconds

    Provide your evaluation as a JSON object:
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

    // Weight the scores: Content 40%, Oral Fluency 35%, Pronunciation 25%
    const overallScore = Math.round(
      contentPercentage * 0.4 +
        oralFluencyPercentage * 0.35 +
        pronunciationPercentage * 0.25
    );

    return {
      score: overallScore,
      isCorrect: overallScore >= 65,
      feedback:
        evaluation.feedback?.content ||
        evaluation.feedback?.summary ||
        'Re-tell Lecture response evaluated successfully.',
      detailedAnalysis: {
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
      },
      suggestions: evaluation.feedback?.suggestions || [
        'Focus on main ideas and key points',
        'Organize your response logica`lly',
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
 * Evaluate Describe Image responses (audio-based)
 */
async function evaluateDescribeImage(
  question: Question,
  userResponse: any,
  timeTakenSeconds?: number
): Promise<QuestionEvaluationResult> {
  const transcribedText = userResponse.textResponse;

  console.log('Evaluating Describe Image:', {
    hasTranscribedText: !!transcribedText,
    textLength: transcribedText?.length,
    timeTaken: timeTakenSeconds,
  });

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
      * **6 pts:** The response describes the image fully and accurately and expands on the relationships between features to provide a nuanced interpretation. A variety of expressions and vocabulary are used with ease and precision. A listener could build a **complete** mental picture.
      * **5 pts:** The response describes the main features accurately and identifies some relationships without expanding in detail. A variety of expressions and vocabulary are used appropriately. A listener could build an **accurate** mental picture, with minor details missing.
      * **4 pts:** The response includes some accurate simple descriptions and basic relationships but may not cover all main features. The vocabulary is sufficient for basic descriptions with some repetition. A listener could build a **basic** mental picture.
      * **3 pts:** The response includes mainly superficial descriptions with minor inaccuracies. The vocabulary is narrow and expressions are used repeatedly. A listener could visualize **elements** of the image, but not a cohesive whole.
      * **2 pts:** The response includes minimal, superficial descriptions with some inaccuracies. Limited vocabulary and simple expressions dominate. A listener could visualize some elements **with effort**.
      * **1 pt:** The response is composed of disconnected elements or a list of points without description. Vocabulary is highly restricted. A listener would **struggle** to visualize the image.
      * **0 pts:** The response is relevant but too limited to assign a higher score.

    **2. Pronunciation (Score from 0 to 5):**
      * **5:** Native-like; all words are clear and correct.
      * **4:** Very clear; maybe one or two minor inaccuracies.
      * **3:** Mostly understandable but with several errors.
      * **2:** Difficult to follow due to many errors.
      * **1:** Mostly incorrect transcription.

    **3. Oral Fluency (Score from 0 to 5):**
      * **5:** Smooth, natural flow with no fillers or hesitations.
      * **4:** Mostly smooth with one or two minor hesitations.
      * **3:** Noticeable hesitations that disrupt the flow.
      * **2:** Uneven, slow, or fragmented speech.
      * **1:** Very halting speech.

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
      "suggestions": ["<Actionable suggestion 1>", "<Actionable suggestion 2>"]
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
    console.log(evaluation, 'DESCRIBE IMAGE EVALUATION');

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

    // Calculate weighted overall score (Content 50%, Oral Fluency 30%, Pronunciation 20%)
    const overallScore = Math.round(
      contentPercentage * 0.5 +
        oralFluencyPercentage * 0.3 +
        pronunciationPercentage * 0.2
    );

    console.log('DESCRIBE IMAGE SCORE CALCULATION:', {
      contentScore: `${contentScore}/${contentMaxScore} = ${Math.round(
        contentPercentage
      )}%`,
      oralFluencyScore: `${oralFluencyScore}/${oralFluencyMaxScore} = ${Math.round(
        oralFluencyPercentage
      )}%`,
      pronunciationScore: `${pronunciationScore}/${pronunciationMaxScore} = ${Math.round(
        pronunciationPercentage
      )}%`,
      overallScore: `${overallScore}/100`,
    });

    // Ensure feedback is always a string
    let feedbackText = 'Image description response evaluated.';

    return {
      score: overallScore,
      isCorrect: overallScore >= 65,
      feedback: feedbackText,
      detailedAnalysis: {
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
        contentFeedback: evaluation.Feedback?.Content || '',
        oralFluencyFeedback: evaluation.Feedback?.['Oral Fluency'] || '',
        pronunciationFeedback: evaluation.Feedback?.Pronunciation || '',
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
        'Focus on describing key visual elements.',
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

    if (isCorrect) {
      return {
        score: 100,
        isCorrect: true,
        feedback: 'Your answer is correct.',
        detailedAnalysis: {
          evaluationMethod: 'Partial Match',
          transcribedText,
          correctAnswers,
        },
        suggestions: ['Excellent! Your answer was concise and accurate.'],
      };
    } else {
      return {
        score: 0,
        isCorrect: false,
        feedback: 'Your answer is incorrect.',
        detailedAnalysis: {
          evaluationMethod: 'Partial Match',
          transcribedText,
          correctAnswers,
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

// WRITING

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
    You are an official PTE Academic grader. Evaluate this summary strictly following the PTE Academic scoring rubric.

    **Original Text:**
    "${question.textContent}"

    **User's Summary:**
    "${userText}"

    **Word Count:** ${wordCount}

    Evaluate based on PTE rubric traits:
    1. Content (0-4 points): Comprehensiveness and accuracy
    2. Form (0-1 point): Single sentence, 5-75 words
    3. Grammar (0-2 points): Grammatical control
    4. Vocabulary (0-2 points): Appropriate word choice

    Calculate overall score (10-90 scale) and provide detailed feedback.
    
    Respond with a JSON object containing overallScore, isCorrect, feedback, detailedAnalysis, and suggestions.
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

    return {
      score: evaluation.overallScore || 0,
      isCorrect: (evaluation.overallScore || 0) >= 65,
      feedback: evaluation.feedback || 'Summary evaluated successfully.',
      detailedAnalysis: evaluation.detailedAnalysis || {
        actualWordCount: wordCount,
        timeTaken: timeTakenSeconds || 0,
      },
      suggestions: evaluation.suggestions || [
        'Focus on main ideas only',
        'Use one complete sentence',
        'Stay within word limit (5-75 words)',
      ],
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
    You are an official PTE Academic Writing grader. Evaluate this essay strictly following the official PTE Academic scoring rubric.

    **Essay Prompt:**
    "${question.textContent}"

    **User's Essay:**
    "${userText}"

    **Word Count:** ${wordCount}

    Evaluate based on PTE rubric traits:
    1. Content (0-6 points): Addresses prompt, convincing argument
    2. Form (0-2 points): 200-300 words
    3. Development, Structure and Coherence (0-6 points): Logical structure
    4. Grammar (0-2 points): Grammatical control
    5. General Linguistic Range (0-6 points): Vocabulary variety
    6. Spelling (0-2 points): Spelling accuracy

    Calculate overall score (10-90 scale) and provide detailed feedback.
    
    Respond with a JSON object containing overallScore, isCorrect, feedback, detailedAnalysis, and suggestions.
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

    return {
      score: evaluation.overallScore || 0,
      isCorrect: (evaluation.overallScore || 0) >= 65,
      feedback: evaluation.feedback || 'Essay evaluated successfully.',
      detailedAnalysis: evaluation.detailedAnalysis || {
        actualWordCount: wordCount,
        timeTaken: timeTakenSeconds || 0,
      },
      suggestions: evaluation.suggestions || [
        'Develop your arguments with examples',
        'Ensure proper essay structure',
        'Stay within word limit (200-300 words)',
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

  console.log('Evaluating Summarize Spoken Text:', {
    wordCount,
    wordLimits: { min: question.wordCountMin, max: question.wordCountMax },
    timeTaken: timeTakenSeconds,
  });

  const prompt = `
    Evaluate this PTE Summarize Spoken Text response:
    
    Task: Listen to audio and write summary (${question.wordCountMin}-${
    question.wordCountMax
  } words)
    User Summary: "${userText}"
    Word Count: ${wordCount}
    Time Taken: ${timeTakenSeconds || 'Not specified'} seconds
    
    Evaluate based on listening comprehension and summary writing skills:
    1. Content accuracy and main ideas capture (0-5 points)
    2. Form compliance (word count within limits) (0-2 points)
    3. Grammar and vocabulary (0-3 points)
    
    Calculate overall score (0-100) and provide feedback.
    
    Respond with a JSON object containing score, isCorrect, feedback, detailedAnalysis, and suggestions.
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

    return {
      score: evaluation.score || 0,
      isCorrect: (evaluation.score || 0) >= 65,
      feedback: evaluation.feedback || 'Spoken text summary evaluated.',
      detailedAnalysis: evaluation.detailedAnalysis || {
        actualWordCount: wordCount,
        requiredRange: `${question.wordCountMin}-${question.wordCountMax}`,
        timeTaken: timeTakenSeconds || 0,
      },
      suggestions: evaluation.suggestions || [
        'Focus on main ideas from the audio',
        'Stay within word count limits',
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
        actualWordCount: wordCount,
        timeTaken: timeTakenSeconds || 0,
      },
      suggestions: ['Please try again later'],
    };
  }
}

/**
 * Evaluate Multiple Choice Single Answer responses
 */
async function evaluateMultipleChoiceSingle(
  question: Question,
  userResponse: any,
  timeTakenSeconds?: number
): Promise<QuestionEvaluationResult> {
  const selectedOption = userResponse.selectedOption;
  const correctAnswers = Array.isArray(question.correctAnswers)
    ? question.correctAnswers
    : [question.correctAnswers];

  const isCorrect = correctAnswers.includes(selectedOption);
  const score = isCorrect ? 100 : 0;

  // Get the selected option text for feedback
  const options = question.options || [];
  const selectedOptionText =
    options.find((opt: any) => opt.id === selectedOption)?.text ||
    'Unknown option';
  const correctOptionText =
    options.find((opt: any) => correctAnswers.includes(opt.id))?.text ||
    'Unknown option';

  return {
    score,
    isCorrect,
    feedback: isCorrect
      ? `Correct! You selected: "${selectedOptionText}"`
      : `Incorrect. You selected: "${selectedOptionText}". The correct answer is: "${correctOptionText}"`,
    detailedAnalysis: {
      selectedOption,
      correctAnswers,
      selectedOptionText,
      correctOptionText,
      timeTaken: timeTakenSeconds || 0,
    },
    suggestions: isCorrect
      ? ['Great job! Continue practicing similar questions.']
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
  const correctAnswers = Array.isArray(question.correctAnswers)
    ? question.correctAnswers
    : [question.correctAnswers];

  // Calculate partial scoring
  const correctSelected = selectedOptions.filter((option: string) =>
    correctAnswers.includes(option)
  ).length;

  const incorrectSelected = selectedOptions.filter(
    (option: string) => !correctAnswers.includes(option)
  ).length;

  const score =
    Math.max(0, (correctSelected - incorrectSelected) / correctAnswers.length) *
    100;
  const isCorrect = score === 100;

  return {
    score,
    isCorrect,
    feedback: `You selected ${correctSelected} correct and ${incorrectSelected} incorrect options out of ${correctAnswers.length} total correct answers.`,
    detailedAnalysis: {
      selectedOptions,
      correctAnswers,
      correctSelected,
      incorrectSelected,
      totalCorrect: correctAnswers.length,
      partialScore: score,
    },
    suggestions: [
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
  const correctOrder = question.correctAnswers || [];

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
  const score = maxPairs > 0 ? (correctPairs / maxPairs) * 100 : 0;
  const isCorrect = score === 100;

  return {
    score,
    isCorrect,
    feedback: `You got ${correctPairs} out of ${maxPairs} paragraph pairs in the correct order.`,
    detailedAnalysis: {
      userOrder,
      correctOrder,
      correctPairs,
      maxPairs,
      pairScore: score,
    },
    suggestions: [
      'Look for logical connectors between paragraphs',
      'Identify the introduction and conclusion paragraphs first',
      'Follow the chronological or logical flow of ideas',
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
  const correctBlanks = question.correctAnswers || {};

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

  const score = totalBlanks > 0 ? (correctCount / totalBlanks) * 100 : 0;
  const isCorrect = score === 100;

  return {
    score,
    isCorrect,
    feedback: `You filled ${correctCount} out of ${totalBlanks} blanks correctly.`,
    detailedAnalysis: {
      blankResults,
      correctCount,
      totalBlanks,
      accuracy: score,
    },
    suggestions: [
      'Pay attention to grammar and word forms',
      'Consider the context around each blank',
      'Review collocations and common word combinations',
    ],
  };
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

  const correctHighlights = highlightedWords.filter((word: string) =>
    incorrectWords.includes(word)
  ).length;

  const incorrectHighlights = highlightedWords.filter(
    (word: string) => !incorrectWords.includes(word)
  ).length;

  const score =
    Math.max(
      0,
      (correctHighlights - incorrectHighlights) / incorrectWords.length
    ) * 100;
  const isCorrect = score === 100;

  return {
    score,
    isCorrect,
    feedback: `You correctly identified ${correctHighlights} incorrect words and incorrectly highlighted ${incorrectHighlights} correct words.`,
    detailedAnalysis: {
      highlightedWords,
      incorrectWords,
      correctHighlights,
      incorrectHighlights,
      totalIncorrectWords: incorrectWords.length,
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
  const correctText = question.correctAnswers?.toLowerCase().trim() || '';

  // Calculate word-level accuracy
  const userWords = userText
    .split(/\s+/)
    .filter((word: string | any[]) => word.length > 0);
  const correctWords = correctText
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

  return {
    score: accuracy,
    isCorrect,
    feedback: `You typed ${correctWordCount} out of ${
      correctWords.length
    } words correctly (${Math.round(accuracy)}% accuracy).`,
    detailedAnalysis: {
      userText,
      correctText,
      userWords,
      correctWords,
      correctWordCount,
      totalWords: correctWords.length,
      accuracy,
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
  const correctAnswers = Array.isArray(question.correctAnswers)
    ? question.correctAnswers
    : [question.correctAnswers];

  const isCorrect = correctAnswers.includes(selectedSummary);
  const score = isCorrect ? 100 : 0;

  return {
    score,
    isCorrect,
    feedback: isCorrect
      ? 'Correct! You selected the best summary.'
      : 'Incorrect. The selected summary does not best represent the audio content.',
    detailedAnalysis: {
      selectedSummary,
      correctAnswers,
      timeTaken: timeTakenSeconds || 0,
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
  const correctAnswers = Array.isArray(question.correctAnswers)
    ? question.correctAnswers
    : [question.correctAnswers];

  const isCorrect = correctAnswers.includes(selectedWord);
  const score = isCorrect ? 100 : 0;

  return {
    score,
    isCorrect,
    feedback: isCorrect
      ? 'Correct! You identified the missing word accurately.'
      : 'Incorrect. Listen again for context clues about the missing word.',
    detailedAnalysis: {
      selectedWord,
      correctAnswers,
      timeTaken: timeTakenSeconds || 0,
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
