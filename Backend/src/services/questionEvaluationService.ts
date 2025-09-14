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
      return evaluateAnswerShortQuestion(
        question,
        userResponse,
        timeTakenSeconds
      );

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

/**
 * Evaluate Read Aloud responses (audio-based)
 */
async function evaluateReadAloud(
  question: Question,
  userResponse: any, // userResponse should contain textResponse (transcribed text)
  timeTakenSeconds?: number
): Promise<QuestionEvaluationResult> {
  const transcribedText = userResponse.textResponse;
  // The new, detailed prompt for the AI evaluator
  const prompt = `
    **Your Role:** You are an expert AI evaluator for the PTE Academic test. Your task is to analyze a user's "Read Aloud" speaking performance with extreme precision.

    **Objective:** You will be given an original text and a transcription of a user's spoken response. Compare the transcription word-for-word to the original, score it based on official PTE criteria for Content, Pronunciation, and Oral Fluency, and provide detailed, actionable feedback. You must infer pronunciation and fluency issues based on the transcription's accuracy, hesitations (like 'uh', 'um'), and omissions.

    ---
    ### **Evaluation and Scoring Instructions**

    **1. Content Analysis:**
    * Compare the \`transcribedText\` to the \`originalText\` to perform a \`wordAnalysis\`.
    * For each word, assign a \`status\`: 'correct', 'mispronounced' (if a word is a near-match but incorrect), 'omitted', or 'inserted'.
    * The **Content score** is the total number of words from the original text that are correctly spoken.

    **2. Pronunciation and Oral Fluency Scoring (0-5 scale):**
    * **Pronunciation:** Score based on the accuracy of the transcribed words. A high number of mispronounced, omitted, or inserted words indicates lower pronunciation quality.
        * 5: Perfect transcription.
        * 4: One or two minor errors in transcription.
        * 3: Several errors that suggest pronunciation issues but the text is mostly understandable.
        * 2: Many errors, making the text difficult to follow.
        * 1: The transcription is mostly incorrect, indicating very poor pronunciation.
    * **Oral Fluency:** Score based on filler words ('uh', 'um'), hesitations (inferred from odd phrasing or breaks), and pace (if time is provided).
        * 5: Smooth, natural flow with no fillers.
        * 4: Mostly smooth with one minor hesitation.
        * 3: Noticeable hesitations or filler words that disrupt the flow.
        * 2: Uneven, slow, or fragmented speech.
        * 1: Very halting speech with many pauses or fillers.

    ---
    ### **Required Output Format**
    Your final output **must** be a single JSON object. Do not include any text or explanations outside of the JSON structure.

    \`\`\`json
    {
      "scores": {
        "content": { "score": 0, "maxScore": 0 },
        "pronunciation": 0,
        "oralFluency": 0,
        "estimatedPTE": 0
      },
      "analysis": {
        "recognizedText": "",
        "wordAnalysis": []
      },
      "feedback": {
        "summary": "",
        "suggestions": []
      }
    }
    \`\`\`
    ---

    **BEGIN EVALUATION**

    * **Original Text**: "${question.textContent}"
    * **Transcribed User Text**: "${transcribedText}"
    * **Time Taken**: ${timeTakenSeconds || 'Not specified'} seconds
  `;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4-turbo', // Use a model that supports JSON mode
      messages: [
        {
          role: 'system',
          content: 'You are a helpful assistant designed to output JSON.',
        },
        { role: 'user', content: prompt },
      ],
      response_format: { type: 'json_object' }, // Enable JSON mode
      temperature: 0.2,
    });

    const evaluation = JSON.parse(response.choices[0].message.content || '{}');

    // Map the detailed AI response to the function's return structure
    return {
      score: evaluation.scores.estimatedPTE || 0,
      isCorrect: (evaluation.scores.estimatedPTE || 0) >= 65, // Example passing threshold
      feedback: evaluation.feedback.summary || 'No feedback available.',
      detailedAnalysis: {
        contentScore: evaluation.scores.content.score,
        contentMaxScore: evaluation.scores.content.maxScore,
        pronunciationScore: evaluation.scores.pronunciation,
        fluencyScore: evaluation.scores.oralFluency,
        recognizedText: evaluation.analysis.recognizedText,
        wordByWordAnalysis: evaluation.analysis.wordAnalysis,
      },
      suggestions: evaluation.feedback.suggestions || [],
    };
  } catch (error) {
    console.error('OpenAI evaluation error for Read Aloud:', error);
    return {
      score: 0,
      isCorrect: false,
      feedback: 'Unable to evaluate response at this time.',
      detailedAnalysis: {},
      suggestions: ['Please try again later'],
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
  // Similar to Read Aloud but focuses on exact repetition
  const prompt = `
    Evaluate this PTE Repeat Sentence response:
    
    Original Audio Content: [Audio sentence provided]
    User Audio Response: [Audio file provided]
    Time Taken: ${timeTakenSeconds || 'Not specified'} seconds
    
    Evaluate based on:
    1. Content accuracy - exact repetition (0-40 points)
    2. Pronunciation clarity (0-30 points)
    3. Fluency and rhythm (0-30 points)
    
    Provide detailed feedback and score.
    
    Format as JSON with score, feedback, detailedAnalysis, and suggestions.
  `;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
    });

    const evaluation = JSON.parse(response.choices[0].message.content || '{}');
    return {
      score: evaluation.score || 0,
      isCorrect: evaluation.score >= 65,
      feedback: evaluation.feedback || 'No feedback available',
      detailedAnalysis: evaluation.detailedAnalysis || {},
      suggestions: evaluation.suggestions || [],
    };
  } catch (error) {
    console.error('OpenAI evaluation error for Repeat Sentence:', error);
    return {
      score: 0,
      isCorrect: false,
      feedback: 'Unable to evaluate response at this time.',
      detailedAnalysis: {},
      suggestions: ['Please try again later'],
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
  const prompt = `
    Evaluate this PTE Describe Image response:
    
    Image Description Task: User should describe the image in detail
    User Audio Response: [Audio file provided - assume transcribed text: "${
      userResponse.transcribedText || 'Audio response provided'
    }"]
    Time Taken: ${timeTakenSeconds || 'Not specified'} seconds
    
    Evaluate based on:
    1. Content relevance and detail (0-30 points)
    2. Vocabulary usage and variety (0-25 points)
    3. Grammar and sentence structure (0-25 points)
    4. Fluency and pronunciation (0-20 points)
    
    Provide comprehensive feedback focusing on descriptive language use.
    
    Format as JSON with score, feedback, detailedAnalysis, and suggestions.
  `;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
    });

    const evaluation = JSON.parse(response.choices[0].message.content || '{}');
    return {
      score: evaluation.score || 0,
      isCorrect: evaluation.score >= 65,
      feedback: evaluation.feedback || 'No feedback available',
      detailedAnalysis: evaluation.detailedAnalysis || {},
      suggestions: evaluation.suggestions || [],
    };
  } catch (error) {
    console.error('OpenAI evaluation error for Describe Image:', error);
    return {
      score: 0,
      isCorrect: false,
      feedback: 'Unable to evaluate response at this time.',
      detailedAnalysis: {},
      suggestions: ['Please try again later'],
    };
  }
}

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
    You are an official PTE Academic grader. Your task is to evaluate a user's summary of a provided text, strictly following the PTE Academic scoring rubric. The final score should be on a scale of 10-90.

    **Original Text:**
    "${question.textContent}"

    **User's Summary:**
    "${userText}"

    **Word Count:** ${wordCount}

    Evaluate the user's summary based on the following four scoring traits from the official PTE rubric:

    1.  **Content (0-4 points):**
        -   **4 points:** The summary is comprehensive, accurate, and captures all main ideas. It uses effective paraphrasing to remove extraneous details and synthesizes ideas smoothly.
        -   **3 points:** The summary is adequate, but may have minor omissions or an unclear synthesis of ideas. Paraphrasing is used but not consistently well.
        -   **2 points:** The summary is partial, demonstrating basic comprehension. It relies heavily on repeating excerpts from the original text without synthesis.
        -   **1 point:** The summary is relevant but lacks a meaningful summarization. Ideas are disconnected, and main points are misrepresented or omitted.
        -   **0 points:** The response is too limited or demonstrates no comprehension.

    2.  **Form (0-1 point):**
        -   **1 point:** The response is a single, complete sentence. The word count is between 5 and 75 words.
        -   **0 points:** The response is not a single sentence, or the word count is outside the 5-75 word range, or it is written in all capital letters.

    3.  **Grammar (0-2 points):**
        -   **2 points:** The response has correct grammatical structure.
        -   **1 point:** The response contains grammatical errors that do not hinder communication.
        -   **0 points:** The response has defective grammatical structure that could hinder communication.

    4.  **Vocabulary (0-2 points):**
        -   **2 points:** The response uses appropriate word choice.
        -   **1 point:** The response contains lexical errors that do not hinder communication.
        -   **0 points:** The response has defective word choice that could hinder communication.
    
    Now, provide your evaluation and final score. Do not include any additional text outside of the JSON object.

    **JSON Format:**
    {
      "score": number, // Calculate an overall score (10-90) based on the traits above
      "isCorrect": boolean, // A simple true/false based on score
      "feedback": "string", // A concise summary of performance based on the rubric
      "detailedAnalysis": {
        "contentPoints": number,
        "formPoints": number,
        "grammarPoints": number,
        "vocabularyPoints": number,
        "actualWordCount": number,
        "isSingleSentence": boolean
      },
      "suggestions": [
        "string", // 3-4 actionable tips for improvement
        "string",
        "string"
      ]
    }
`;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
    });

    const evaluation = JSON.parse(response.choices[0].message.content || '{}');
    return {
      score: evaluation.score || 0,
      isCorrect: evaluation.score >= 65,
      feedback: evaluation.feedback || 'No feedback available',
      detailedAnalysis: evaluation.detailedAnalysis || {},
      suggestions: evaluation.suggestions || [],
    };
  } catch (error) {
    console.error('OpenAI evaluation error for Summarize Written Text:', error);
    return {
      score: 0,
      isCorrect: false,
      feedback: 'Unable to evaluate response at this time.',
      detailedAnalysis: {},
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
    You are an official PTE Academic Writing grader. Your task is to evaluate a user's essay, strictly following the official PTE Academic scoring rubric. The final score should be on a scale of 10-90.

    **Essay Prompt:**
    "${question.textContent}"

    **User's Essay:**
    "${userText}"

    **Word Count:** ${wordCount}

    Analyze the user's essay and provide a detailed score report by evaluating each trait and its corresponding score points from the rubric:

    1.  **Content (0-6 points):**
        -   **6 points:** The essay fully addresses the prompt in depth, with a convincing, well-supported argument using relevant examples.
        -   **5 points:** Adequately addresses the prompt, with a persuasive argument and relevant ideas. Supporting details are mostly present.
        -   **4 points:** Addresses the main point, but lacks depth or nuance. Supporting details are inconsistent.
        -   **3 points:** Relevant to the prompt but does not adequately address main points. Supporting details are often missing or inappropriate.
        -   **2 points:** Addresses the prompt superficially with generic statements or heavy reliance on the prompt's language.
        -   **1 point:** Demonstrates an incomplete understanding of the prompt. Ideas are disjointed.
        -   **0 points:** The essay does not properly deal with the prompt.

    2.  **Form (0-2 points):**
        -   **2 points:** Length is between 200 and 300 words.
        -   **1 point:** Length is between 120-199 or 301-380 words.
        -   **0 points:** Length is less than 120 or more than 380 words, or the essay is improperly formatted (e.g., all caps, no punctuation).

    3.  **Development, Structure and Coherence (0-6 points):**
        -   **6 points:** Effective logical structure. The argument is clear, cohesive, and developed systematically with a well-developed introduction and conclusion.
        -   **5 points:** Conventional and appropriate structure. The argument is clear, with logical paragraphs and a clear introduction and conclusion.
        -   **4 points:** Conventional structure is mostly present but may be difficult to follow. Some elements lack development or links between them are weak.
        -   **3 points:** Traces of conventional structure are present, but the essay is composed of simple or disconnected ideas.
        -   **2 points:** Little recognizable structure. Ideas are disorganized and difficult to follow.
        -   **1 point:** Response consists of disconnected ideas with no hierarchy or coherence.
        -   **0 points:** No recognizable structure.

    4.  **Grammar (0-2 points):**
        -   **2 points:** Shows consistent grammatical control of complex language. Errors are rare.
        -   **1 point:** Shows a relatively high degree of grammatical control. No mistakes that would lead to misunderstandings.
        -   **0 points:** Contains mainly simple structures or several basic mistakes.

    5.  **General Linguistic Range (0-6 points):**
        -   **6 points:** A variety of expressions and vocabulary are used appropriately with ease and precision. No signs of limitations.
        -   **5 points:** A variety of expressions and vocabulary are used appropriately. Ideas are expressed clearly without much sign of restriction.
        -   **4 points:** The range of expression and vocabulary is sufficient for basic ideas, but limitations are evident with complex ideas.
        -   **3 points:** The range of expression and vocabulary is narrow and simple. Communication is restricted to simple ideas.
        -   **2 points:** Limited vocabulary and simple expressions dominate. Communication is compromised and ideas are unclear.
        -   **1 point:** Vocabulary and linguistic expression are highly restricted. Communication has significant limitations.
        -   **0 points:** Meaning is not accessible.

    6. **Spelling (0-2 points):**
        -   **2 points:** Correct spelling.
        -   **1 point:** One spelling error.
        -   **0 points:** More than one spelling error.

    Now, provide a detailed score report in a single JSON object. Do not include any additional text outside of the JSON.

    **JSON Format:**
    {
      "overallScore": number, // Overall score on a 10-90 scale based on a weighted calculation of the scores below
      "isCorrect": boolean, // True if overallScore is 65 or higher
      "feedback": "string", // A concise summary of performance, mentioning main strengths and weaknesses.
      "detailedAnalysis": {
        "contentPoints": number,
        "formPoints": number,
        "developmentStructureAndCoherencePoints": number,
        "grammarPoints": number,
        "generalLinguisticRangePoints": number,
        "spellingPoints": number,
        "actualWordCount": number,
        "wordCountCompliant": boolean // True if word count is in the 200-300 range
      },
      "suggestions": [
        "string", // 3-4 actionable tips
        "string",
        "string"
      ]
    }
`;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
    });

    const evaluation = JSON.parse(response.choices[0].message.content || '{}');

    return {
      score: evaluation.overallScore || 0,
      isCorrect: evaluation.isCorrect,
      feedback: evaluation.feedback || 'No feedback available',
      detailedAnalysis: evaluation.detailedAnalysis || {},
      suggestions: evaluation.suggestions || [],
    };
  } catch (error) {
    console.error('OpenAI evaluation error for Write Essay:', error);
    return {
      score: 0,
      isCorrect: false,
      feedback: 'Unable to evaluate response at this time.',
      detailedAnalysis: {},
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
  const selectedOption = userResponse.selectedOptions?.[0];
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
  const userOrder = userResponse.orderedItems || [];
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
  const userText = userResponse.textResponse?.toLowerCase().trim() || '';
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
 * Evaluate other question types with basic scoring
 */
async function evaluateRetellLecture(
  question: Question,
  userResponse: any,
  timeTakenSeconds?: number
): Promise<QuestionEvaluationResult> {
  // Placeholder for Re-tell Lecture evaluation
  return {
    score: 75, // Default score
    isCorrect: true,
    feedback: 'Response recorded. Detailed evaluation will be available soon.',
    detailedAnalysis: { placeholder: true },
    suggestions: [
      'Focus on main ideas',
      'Use clear pronunciation',
      'Organize your response logically',
    ],
  };
}

async function evaluateAnswerShortQuestion(
  question: Question,
  userResponse: any,
  timeTakenSeconds?: number
): Promise<QuestionEvaluationResult> {
  // Placeholder for Answer Short Question evaluation
  return {
    score: 80,
    isCorrect: true,
    feedback: 'Response recorded. Detailed evaluation will be available soon.',
    detailedAnalysis: { placeholder: true },
    suggestions: [
      'Keep answers brief and accurate',
      'Focus on factual information',
    ],
  };
}

async function evaluateSummarizeSpokenText(
  question: Question,
  userResponse: any,
  timeTakenSeconds?: number
): Promise<QuestionEvaluationResult> {
  // Similar to Summarize Written Text but for audio content
  const userText = userResponse.textResponse || '';
  const wordCount = userText
    .split(/\s+/)
    .filter((word: string | any[]) => word.length > 0).length;

  const prompt = `
    Evaluate this PTE Summarize Spoken Text response:
    
    Audio Content: [Lecture audio provided]
    User Summary: "${userText}"
    Word Count: ${wordCount} (Required: ${question.wordCountMin}-${
    question.wordCountMax
  } words)
    Time Taken: ${timeTakenSeconds || 'Not specified'} seconds
    
    Evaluate based on listening comprehension and summary writing skills.
    Focus on main ideas capture, grammar, and word count compliance.
    
    Format as JSON with score, feedback, detailedAnalysis, and suggestions.
  `;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
    });

    const evaluation = JSON.parse(response.choices[0].message.content || '{}');
    return {
      score: evaluation.score || 0,
      isCorrect: evaluation.score >= 65,
      feedback: evaluation.feedback || 'No feedback available',
      detailedAnalysis: evaluation.detailedAnalysis || {},
      suggestions: evaluation.suggestions || [],
    };
  } catch (error) {
    console.error('OpenAI evaluation error for Summarize Spoken Text:', error);
    return {
      score: 0,
      isCorrect: false,
      feedback: 'Unable to evaluate response at this time.',
      detailedAnalysis: {},
      suggestions: ['Please try again later'],
    };
  }
}

async function evaluateHighlightCorrectSummary(
  question: Question,
  userResponse: any,
  timeTakenSeconds?: number
): Promise<QuestionEvaluationResult> {
  const selectedSummary = userResponse.selectedOptions?.[0];
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

async function evaluateSelectMissingWord(
  question: Question,
  userResponse: any,
  timeTakenSeconds?: number
): Promise<QuestionEvaluationResult> {
  const selectedWord = userResponse.selectedOptions?.[0];
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
