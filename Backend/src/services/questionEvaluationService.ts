import openai from '../config/openAi';
import { PteQuestionTypeName } from '@prisma/client';

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
  userResponse: any,
  timeTakenSeconds?: number
): Promise<QuestionEvaluationResult> {
  const prompt = `
    Evaluate this PTE Read Aloud response:
    
    Original Text: "${question.textContent}"
    User Audio Response: [Audio file provided - assume clear pronunciation]
    Time Taken: ${timeTakenSeconds || 'Not specified'} seconds
    
    Evaluate based on:
    1. Pronunciation clarity (0-25 points)
    2. Fluency and rhythm (0-25 points)
    3. Content accuracy (0-25 points)
    4. Stress and intonation (0-25 points)
    
    Provide:
    - Overall score (0-100)
    - Specific feedback on pronunciation, fluency, and areas for improvement
    - 3 actionable suggestions for improvement
    
    Format as JSON: {
      "score": number,
      "isCorrect": boolean,
      "feedback": "string",
      "detailedAnalysis": {
        "pronunciation": number,
        "fluency": number,
        "content": number,
        "intonation": number
      },
      "suggestions": ["suggestion1", "suggestion2", "suggestion3"]
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
      isCorrect: evaluation.score >= 65, // PTE passing threshold
      feedback: evaluation.feedback || 'No feedback available',
      detailedAnalysis: evaluation.detailedAnalysis || {},
      suggestions: evaluation.suggestions || [],
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
  console.log(userResponse, 'LLLL');

  const userText = userResponse.text || '';
  const wordCount = userText
    .split(/\s+/)
    .filter((word: string | any[]) => word.length > 0).length;

  console.log(wordCount, 'MMMM');

  const prompt = `
    Evaluate this PTE Summarize Written Text response:
    
    Original Text: "${question.textContent}"
    User Summary: "${userText}"
    Word Count: ${wordCount} (Required: ${question.wordCountMin}-${
    question.wordCountMax
  } words)
    Time Taken: ${timeTakenSeconds || 'Not specified'} seconds
    
    Evaluate based on:
    1. Content accuracy - captures main ideas (0-30 points)
    2. Grammar and vocabulary (0-25 points)
    3. Word count compliance (0-20 points)
    4. Coherence and cohesion (0-25 points)
    
    Provide detailed feedback on summary quality and adherence to requirements.
    
    Format as JSON: {
      "score": number,
      "isCorrect": boolean,
      "feedback": "string",
      "detailedAnalysis": {
        "contentAccuracy": number,
        "grammar": number,
        "wordCount": number,
        "coherence": number,
        "actualWordCount": number,
        "wordCountCompliant": boolean
      },
      "suggestions": ["suggestion1", "suggestion2", "suggestion3"]
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
  const userText = userResponse.textResponse || '';
  const wordCount = userText
    .split(/\s+/)
    .filter((word: string | any[]) => word.length > 0).length;

  const prompt = `
    Evaluate this PTE Write Essay response:
    
    Essay Prompt: "${question.textContent}"
    User Essay: "${userText}"
    Word Count: ${wordCount} (Required: ${question.wordCountMin}-${
    question.wordCountMax
  } words)
    Time Taken: ${timeTakenSeconds || 'Not specified'} seconds
    
    Evaluate based on:
    1. Content and ideas development (0-25 points)
    2. Organization and structure (0-25 points)
    3. Grammar and vocabulary (0-25 points)
    4. Word count and task response (0-25 points)
    
    Provide comprehensive feedback on essay quality, structure, and language use.
    
    Format as JSON with detailed analysis including specific areas for improvement.
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
