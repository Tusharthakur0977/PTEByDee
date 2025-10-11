import { PteQuestionTypeName } from '@prisma/client';
import { Response } from 'express';
import asyncHandler from 'express-async-handler';
import prisma from '../../config/prismaInstance';
import { CustomRequest } from '../../types';
import { STATUS_CODES } from '../../utils/constants';
import { sendResponse } from '../../utils/helpers';
import { generateQuestionCode } from '../../utils/questionCodeGenerator';
import { transcribeAudioWithRetry } from '../../services/audioTranscriptionService';
import openai from '../../config/openAi';
import { generateImageSignedUrl } from '../../config/cloudFrontConfig';

/**
 * @desc    Create a new PTE question
 * @route   POST /api/admin/questions
 * @access  Private/Admin
 */
export const createQuestion = asyncHandler(
  async (req: CustomRequest, res: Response) => {
    const {
      questionCode: providedQuestionCode, // Allow optional manual override
      questionTypeId,
      difficultyLevel = 'MEDIUM', // Default to MEDIUM if not provided
      textContent,
      questionStatement,
      audioKey,
      imageKey,
      options,
      correctAnswers,
      wordCountMin,
      wordCountMax,
      durationMillis,
      originalTextWithErrors,
      incorrectWords,
      blanks,
      paragraphs, // For RE_ORDER_PARAGRAPHS questions
    } = req.body;

    try {
      // Input validation
      if (!questionTypeId) {
        return sendResponse(
          res,
          STATUS_CODES.BAD_REQUEST,
          null,
          'Question type ID is required.'
        );
      }

      // Validate ObjectId formats
      if (questionTypeId.length !== 24) {
        return sendResponse(
          res,
          STATUS_CODES.BAD_REQUEST,
          null,
          'Invalid question type ID'
        );
      }

      // Generate question code automatically or use provided one
      let questionCode: string;
      if (providedQuestionCode && providedQuestionCode.trim()) {
        // If question code is provided, check if it already exists
        const existingQuestion = await prisma.question.findUnique({
          where: { questionCode: providedQuestionCode.trim() },
        });

        if (existingQuestion) {
          return sendResponse(
            res,
            STATUS_CODES.CONFLICT,
            null,
            'Question code already exists. Please use a unique code.'
          );
        }
        questionCode = providedQuestionCode.trim();
      } else {
        // Generate automatic question code
        questionCode = await generateQuestionCode(questionTypeId);
      }

      // Verify question type exists
      const questionType = await prisma.questionType.findUnique({
        where: { id: questionTypeId },
      });

      if (!questionType) {
        return sendResponse(
          res,
          STATUS_CODES.NOT_FOUND,
          null,
          'Question type not found.'
        );
      }

      // Validate question content based on question type
      const validationResult = validateQuestionContent(questionType.name, {
        textContent,
        questionStatement,
        audioKey,
        imageKey,
        options,
        correctAnswers,
        wordCountMin,
        wordCountMax,
        durationMillis,
        originalTextWithErrors,
        incorrectWords,
        blanks,
        paragraphs,
      });

      if (!validationResult.isValid) {
        return sendResponse(
          res,
          STATUS_CODES.BAD_REQUEST,
          null,
          validationResult.message
        );
      }

      // For Answer Short Question, transcribe audio and extract correct answers
      let finalCorrectAnswers = correctAnswers;
      let audioTranscript;
      if (questionType.name === 'ANSWER_SHORT_QUESTION' && audioKey) {
        try {
          console.log('Transcribing audio for Answer Short Question...');
          const transcriptionResult = await transcribeAudioWithRetry(audioKey);
          const transcribedText = transcriptionResult.text;

          audioTranscript = transcribedText;
          // Extract correct answers from transcribed text using OpenAI
          const extractedAnswers = await extractCorrectAnswers(transcribedText);
          console.log('Extracted correct answers:', extractedAnswers);

          // Use extracted answers if no manual answers provided
          if (!correctAnswers || correctAnswers.length === 0) {
            finalCorrectAnswers = extractedAnswers;
          }

          console.log(
            'Final correct answers for question:',
            finalCorrectAnswers
          );
        } catch (error) {
          console.error(
            'Error transcribing audio for Answer Short Question:',
            error
          );
          // Continue with question creation even if transcription fails
          console.log(
            'Continuing with question creation without auto-generated answers'
          );
        }
      }

      // Transcribe audio for Speaking question types that need transcripts
      if (
        (questionType.name === 'REPEAT_SENTENCE' ||
          questionType.name === 'RE_TELL_LECTURE') &&
        audioKey
      ) {
        try {
          console.log(`Transcribing audio for ${questionType.name}...`);
          const transcriptionResult = await transcribeAudioWithRetry(audioKey);
          const transcribedText = transcriptionResult.text;

          audioTranscript = transcribedText;
        } catch (error) {
          console.error(
            `Error transcribing audio for ${questionType.name}:`,
            error
          );
        }
      }

      // Transcribe audio for ALL Listening question types that use audio
      const listeningQuestionTypesWithAudio = [
        'SUMMARIZE_SPOKEN_TEXT',
        'MULTIPLE_CHOICE_MULTIPLE_ANSWERS_LISTENING',
        'LISTENING_FILL_IN_THE_BLANKS',
        'HIGHLIGHT_CORRECT_SUMMARY',
        'MULTIPLE_CHOICE_SINGLE_ANSWER_LISTENING',
        'SELECT_MISSING_WORD',
        'HIGHLIGHT_INCORRECT_WORDS',
        'WRITE_FROM_DICTATION',
      ];

      if (
        listeningQuestionTypesWithAudio.includes(questionType.name) &&
        audioKey
      ) {
        try {
          console.log(`Transcribing audio for ${questionType.name}...`);
          const transcriptionResult = await transcribeAudioWithRetry(audioKey);
          const transcribedText = transcriptionResult.text;

          audioTranscript = transcribedText;
          console.log(
            `Audio transcription completed for ${questionType.name}. Length: ${transcribedText.length} characters`
          );
        } catch (error) {
          console.error(
            `Error transcribing audio for ${questionType.name}:`,
            error
          );
          // Continue with question creation even if transcription fails
          console.log(
            `Continuing with question creation for ${questionType.name} without transcript`
          );
        }
      }

      // Auto-generate fill-in-the-blanks content for LISTENING_FILL_IN_THE_BLANKS
      let autoGeneratedBlanks;
      let autoGeneratedTextWithBlanks;
      if (
        questionType.name === 'LISTENING_FILL_IN_THE_BLANKS' &&
        audioTranscript &&
        !textContent
      ) {
        try {
          console.log(
            'Auto-generating fill-in-the-blanks content from transcript...'
          );
          const blanksResult = await generateFillInTheBlanksFromTranscript(
            audioTranscript
          );
          autoGeneratedTextWithBlanks = blanksResult.textWithBlanks;
          autoGeneratedBlanks = blanksResult.blanks;
          console.log(
            `Generated ${autoGeneratedBlanks.length} blanks from transcript`
          );
        } catch (error) {
          console.error(
            'Error auto-generating fill-in-the-blanks content:',
            error
          );
          // Continue without auto-generation
        }
      }

      // Auto-generate incorrect words content for HIGHLIGHT_INCORRECT_WORDS
      let autoGeneratedTextWithErrors;
      let autoGeneratedIncorrectWords;
      if (
        questionType.name === 'HIGHLIGHT_INCORRECT_WORDS' &&
        audioTranscript &&
        !textContent
      ) {
        try {
          console.log(
            'Auto-generating incorrect words content from transcript...'
          );
          const incorrectWordsResult =
            await generateIncorrectWordsFromTranscript(audioTranscript);
          autoGeneratedTextWithErrors = incorrectWordsResult.textWithErrors;
          autoGeneratedIncorrectWords = incorrectWordsResult.incorrectWords;
          console.log(
            `Generated ${autoGeneratedIncorrectWords.length} incorrect words from transcript`
          );
        } catch (error) {
          console.error(
            'Error auto-generating incorrect words content:',
            error
          );
          // Continue without auto-generation
        }
      }

      // Handle Describe Image question creation with AI analysis
      let finalContent = textContent;
      if (!finalCorrectAnswers) {
        finalCorrectAnswers = correctAnswers;
      }

      if (questionType.name === 'DESCRIBE_IMAGE' && imageKey) {
        try {
          console.log('Analyzing image for Describe Image question...');

          // Generate secure URL for image analysis
          const secureUrl = generateImageSignedUrl(imageKey, 5);
          const imageAnalysis = await analyzeImageForKeyElements(secureUrl);

          if (imageAnalysis) {
            // Store the analysis data in textContent as JSON
            finalContent = JSON.stringify({
              imageType: imageAnalysis.imageType,
              mainTopic: imageAnalysis.mainTopic,
              keyElements: imageAnalysis.keyElements,
              conclusion: imageAnalysis.conclusion,
              analysisGenerated: true,
              generatedAt: new Date().toISOString(),
            });

            // Store key elements in correctAnswers for evaluation
            finalCorrectAnswers = imageAnalysis.keyElements;

            console.log('Image analysis completed:', {
              imageType: imageAnalysis.imageType,
              mainTopic: imageAnalysis.mainTopic,
              keyElementsCount: imageAnalysis.keyElements.length,
            });
          }
        } catch (error) {
          console.error('Error analyzing image for Describe Image:', error);

          // Create question without analysis but with basic structure
          finalContent = JSON.stringify({
            imageType: 'Unknown',
            mainTopic: 'Image description required',
            keyElements: ['Describe the main elements visible in the image'],
            conclusion: 'Provide a comprehensive description of the image',
            analysisGenerated: false,
            error: 'AI analysis failed',
            generatedAt: new Date().toISOString(),
          });

          console.log(
            'Created Describe Image question without AI analysis due to error'
          );
        }
      }

      // Handle blanks data for fill-in-the-blanks questions
      let finalOptions = options;
      if (
        blanks &&
        Array.isArray(blanks) &&
        questionType.name.includes('FILL_IN_THE_BLANKS')
      ) {
        // Transform blanks array into the format expected by the database
        const processedBlanks = blanks.map((blank: any, index: number) => ({
          id: blank.id || `blank_${index + 1}`,
          position: blank.position || index + 1,
          correctAnswer: blank.correctAnswer,
          options: blank.options || [],
        }));
        finalOptions = processedBlanks;

        // Update correct answers from blanks if not already provided
        // Check for empty array or null/undefined
        if (
          !finalCorrectAnswers ||
          (Array.isArray(finalCorrectAnswers) &&
            finalCorrectAnswers.length === 0)
        ) {
          const processedCorrectAnswers = blanks.reduce(
            (acc: any, blank: any, index: number) => {
              acc[`blank${index + 1}`] = blank.correctAnswer;
              return acc;
            },
            {}
          );
          finalCorrectAnswers = processedCorrectAnswers;
        }
      }

      // Handle paragraphs data for re-order paragraphs questions
      if (
        paragraphs &&
        Array.isArray(paragraphs) &&
        questionType.name === 'RE_ORDER_PARAGRAPHS'
      ) {
        // Store paragraphs in options field
        finalOptions = paragraphs.map((paragraph: any) => ({
          id: paragraph.id || `para_${Date.now()}_${Math.random()}`,
          text: paragraph.text,
          correctOrder: paragraph.correctOrder,
        }));

        // Store correct order in correctAnswers field
        const correctOrder = paragraphs
          .sort((a: any, b: any) => a.correctOrder - b.correctOrder)
          .map((p: any) => p.id || `para_${Date.now()}_${Math.random()}`);

        finalCorrectAnswers = { correctOrder };
      }

      // Use auto-generated content for LISTENING_FILL_IN_THE_BLANKS if available
      let finalTextContent =
        autoGeneratedTextWithBlanks || finalContent || audioTranscript || null;

      // Use auto-generated content for HIGHLIGHT_INCORRECT_WORDS if available
      if (
        autoGeneratedTextWithErrors &&
        questionType.name === 'HIGHLIGHT_INCORRECT_WORDS'
      ) {
        finalTextContent = autoGeneratedTextWithErrors;
      }

      // Update finalOptions with auto-generated blanks if available
      if (
        autoGeneratedBlanks &&
        questionType.name === 'LISTENING_FILL_IN_THE_BLANKS'
      ) {
        finalOptions = autoGeneratedBlanks;

        // Also update correct answers from auto-generated blanks
        // Check for empty array or null/undefined
        if (
          !finalCorrectAnswers ||
          (Array.isArray(finalCorrectAnswers) &&
            finalCorrectAnswers.length === 0)
        ) {
          const autoCorrectAnswers = autoGeneratedBlanks.reduce(
            (acc: any, blank: any, index: number) => {
              acc[`blank${index + 1}`] = blank.correctAnswer;
              return acc;
            },
            {}
          );
          finalCorrectAnswers = autoCorrectAnswers;
        }
      }

      // Use auto-generated incorrect words for HIGHLIGHT_INCORRECT_WORDS if available
      let finalIncorrectWords = incorrectWords;
      if (
        autoGeneratedIncorrectWords &&
        questionType.name === 'HIGHLIGHT_INCORRECT_WORDS'
      ) {
        finalIncorrectWords = autoGeneratedIncorrectWords;
      }

      // Create the question
      const question = await prisma.question.create({
        data: {
          questionCode,
          questionTypeId,
          difficultyLevel,
          textContent: finalTextContent,
          questionStatement: questionStatement || null,
          audioUrl: audioKey || null, // Store S3 key in audioUrl field
          imageUrl: imageKey || null, // Store S3 key in imageUrl field
          options: finalOptions || null,
          correctAnswers: finalCorrectAnswers || null,
          wordCountMin: wordCountMin || null,
          wordCountMax: wordCountMax || null,
          durationMillis: durationMillis || null,
          originalTextWithErrors: originalTextWithErrors || null,
          incorrectWords: finalIncorrectWords || null,
        },
        include: {
          questionType: {
            include: {
              pteSection: true,
            },
          },
        },
      });

      return sendResponse(
        res,
        STATUS_CODES.CREATED,
        question,
        'Question created successfully.'
      );
    } catch (error: any) {
      console.error('Create question error:', error);

      if (error.code === 'P2002') {
        return sendResponse(
          res,
          STATUS_CODES.CONFLICT,
          null,
          'Question code already exists.'
        );
      }

      return sendResponse(
        res,
        STATUS_CODES.INTERNAL_SERVER_ERROR,
        null,
        'An error occurred while creating the question. Please try again.'
      );
    }
  }
);

/**
 * Validate question content based on question type
 */
function validateQuestionContent(
  questionType: PteQuestionTypeName,
  content: any
): { isValid: boolean; message: string } {
  const {
    textContent,
    questionStatement,
    audioKey,
    imageKey,
    options,
    correctAnswers,
    wordCountMin,
    wordCountMax,
    originalTextWithErrors,
    incorrectWords,
    blanks,
    paragraphs,
  } = content;

  switch (questionType) {
    case 'READ_ALOUD':
      if (!textContent) {
        return {
          isValid: false,
          message: 'Text content is required for Read Aloud questions.',
        };
      }
      break;

    case 'REPEAT_SENTENCE':
    case 'RE_TELL_LECTURE':
    case 'ANSWER_SHORT_QUESTION':
      if (!audioKey) {
        return {
          isValid: false,
          message: 'Audio file is required for this question type.',
        };
      }
      break;

    case 'DESCRIBE_IMAGE':
      if (!imageKey) {
        return {
          isValid: false,
          message: 'Image is required for Describe Image questions.',
        };
      }
      break;

    case 'SUMMARIZE_WRITTEN_TEXT':
    case 'WRITE_ESSAY':
      if (!textContent) {
        return {
          isValid: false,
          message: 'Text content is required for this question type.',
        };
      }
      if (!wordCountMin || !wordCountMax) {
        return {
          isValid: false,
          message: 'Word count limits are required for writing questions.',
        };
      }
      break;

    case 'MULTIPLE_CHOICE_SINGLE_ANSWER_READING':
    case 'MULTIPLE_CHOICE_MULTIPLE_ANSWERS_READING':
    case 'MULTIPLE_CHOICE_SINGLE_ANSWER_LISTENING':
    case 'MULTIPLE_CHOICE_MULTIPLE_ANSWERS_LISTENING':
      if (!textContent && !audioKey) {
        return {
          isValid: false,
          message:
            'Text content or audio is required for multiple choice questions.',
        };
      }
      if (!questionStatement) {
        return {
          isValid: false,
          message:
            'Question statement is required for multiple choice questions.',
        };
      }
      if (!options || !Array.isArray(options) || options.length < 2) {
        return {
          isValid: false,
          message:
            'At least 2 options are required for multiple choice questions.',
        };
      }
      if (!correctAnswers) {
        return {
          isValid: false,
          message:
            'Correct answers are required for multiple choice questions.',
        };
      }
      break;

    case 'READING_FILL_IN_THE_BLANKS':
    case 'FILL_IN_THE_BLANKS_DRAG_AND_DROP':
      if (!textContent) {
        return {
          isValid: false,
          message:
            'Text content is required for reading fill in the blanks questions.',
        };
      }
      if (!correctAnswers && !blanks) {
        return {
          isValid: false,
          message:
            'Correct answers or blanks configuration is required for fill in the blanks questions.',
        };
      }
      break;

    case 'LISTENING_FILL_IN_THE_BLANKS':
      if (!audioKey) {
        return {
          isValid: false,
          message:
            'Audio file is required for listening fill in the blanks questions.',
        };
      }
      // For listening fill in the blanks, text content and blanks can be auto-generated from audio
      // So we don't require them to be provided manually

      // Validate blanks structure if provided manually
      if (blanks && Array.isArray(blanks)) {
        for (let i = 0; i < blanks.length; i++) {
          const blank = blanks[i];
          if (!blank.correctAnswer) {
            return {
              isValid: false,
              message: `Blank ${i + 1} must have a correct answer.`,
            };
          }
          if (
            !blank.options ||
            !Array.isArray(blank.options) ||
            blank.options.length < 2
          ) {
            return {
              isValid: false,
              message: `Blank ${i + 1} must have at least 2 dropdown options.`,
            };
          }
          // Ensure correct answer is included in options
          if (!blank.options.includes(blank.correctAnswer)) {
            return {
              isValid: false,
              message: `Blank ${
                i + 1
              }: correct answer must be included in the dropdown options.`,
            };
          }
        }
      }
      break;

    case 'RE_ORDER_PARAGRAPHS':
      if (!paragraphs || !Array.isArray(paragraphs) || paragraphs.length < 2) {
        return {
          isValid: false,
          message:
            'At least 2 paragraphs are required for Re-order Paragraphs questions.',
        };
      }

      // Validate each paragraph has required fields
      for (let i = 0; i < paragraphs.length; i++) {
        const paragraph = paragraphs[i];
        if (!paragraph.text || !paragraph.text.trim()) {
          return {
            isValid: false,
            message: `Paragraph ${i + 1}: text is required.`,
          };
        }
        if (!paragraph.correctOrder || paragraph.correctOrder < 1) {
          return {
            isValid: false,
            message: `Paragraph ${
              i + 1
            }: correct order is required and must be greater than 0.`,
          };
        }
      }

      // Validate correct order sequence (should be 1, 2, 3, ...)
      const orders = paragraphs
        .map((p) => p.correctOrder)
        .sort((a, b) => a - b);
      for (let i = 0; i < orders.length; i++) {
        if (orders[i] !== i + 1) {
          return {
            isValid: false,
            message:
              'Paragraph correct order must be a sequence starting from 1 (1, 2, 3, ...).',
          };
        }
      }
      break;

    case 'HIGHLIGHT_INCORRECT_WORDS':
      // Allow auto-generation from audio OR manual content
      if (!audioKey && !textContent) {
        return {
          isValid: false,
          message:
            'Either audio file (for auto-generation) or text content is required for Highlight Incorrect Words questions.',
        };
      }
      // If manual content is provided, validate it
      if (
        textContent &&
        (!incorrectWords ||
          !Array.isArray(incorrectWords) ||
          incorrectWords.length === 0)
      ) {
        return {
          isValid: false,
          message:
            'When providing manual text content, incorrect words array is required for Highlight Incorrect Words questions.',
        };
      }
      break;

    case 'SUMMARIZE_SPOKEN_TEXT':
    case 'WRITE_FROM_DICTATION':
      if (!audioKey) {
        return {
          isValid: false,
          message: 'Audio file is required for this question type.',
        };
      }
      break;

    case 'HIGHLIGHT_CORRECT_SUMMARY':
    case 'SELECT_MISSING_WORD':
      if (!audioKey) {
        return {
          isValid: false,
          message: 'Audio file is required for this question type.',
        };
      }
      if (!options || !Array.isArray(options)) {
        return {
          isValid: false,
          message: 'Options are required for this question type.',
        };
      }
      break;

    default:
      return { isValid: false, message: 'Unknown question type.' };
  }

  return { isValid: true, message: 'Valid' };
}

/**
 * Extract correct answers from transcribed audio text for Answer Short Question using OpenAI
 */
async function extractCorrectAnswers(
  transcribedText: string
): Promise<string[]> {
  if (!transcribedText || typeof transcribedText !== 'string') {
    return [];
  }

  try {
    const prompt = `
You are an expert at analyzing PTE (Pearson Test of English) "Answer Short Question" audio transcriptions and extracting the correct answers.

Given the following transcribed question text, identify and extract the possible correct answers that a student should provide.

Transcribed Question: "${transcribedText}"

**Rules:**
- Your response MUST be a valid JSON array of strings.
- The answers must be short, concise (typically 1-3 words), and in lowercase.
- Include all common variations of an answer (e.g., "the sun", "sun").
- If the provided text is not a coherent question or is unanswerable, return an empty array \`[]\`.
- Do not include any explanations or text outside of the JSON array.

Return your response as a JSON array of strings containing only the answers, like this:
["answer1", "answer2", "answer3"]

Examples:
- Question: "What color do you get when you mix red and blue?" → ["purple"]
- Question: "Name two primary colors" → ["red", "blue", "yellow"]
- Question: "What is the capital of France?" → ["Paris"]
- Question: "What are the days of the weekend?" → ["Saturday", "Sunday"]
`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.3, // Lower temperature for more consistent results
      max_tokens: 200,
    });

    const aiResponse = response.choices[0]?.message?.content?.trim();
    console.log('OpenAI response for answer extraction:', aiResponse);

    if (!aiResponse) {
      console.log('No response from OpenAI, falling back to empty array');
      return [];
    }

    // Parse the JSON response
    try {
      const extractedAnswers = JSON.parse(aiResponse);

      if (Array.isArray(extractedAnswers)) {
        // Clean and validate the answers
        const cleanedAnswers = extractedAnswers
          .filter(
            (answer) => typeof answer === 'string' && answer.trim().length > 0
          )
          .map((answer) => answer.trim().toLowerCase())
          .filter((answer) => answer.length <= 50) // Reasonable length limit
          .slice(0, 5); // Maximum 5 answers

        console.log('Cleaned extracted answers:', cleanedAnswers);
        return cleanedAnswers;
      } else {
        console.log(
          'OpenAI response is not an array, falling back to empty array'
        );
        return [];
      }
    } catch (parseError) {
      console.error('Error parsing OpenAI JSON response:', parseError);

      // Fallback: try to extract answers from the response text
      const fallbackAnswers = extractAnswersFromText(aiResponse);
      console.log('Fallback extracted answers:', fallbackAnswers);
      return fallbackAnswers;
    }
  } catch (error) {
    console.error('Error using OpenAI to extract answers:', error);

    // Fallback to simple text processing if OpenAI fails
    console.log('Falling back to simple text processing...');
    return extractAnswersFromText(transcribedText);
  }
}

/**
 * Fallback function to extract answers using simple text processing
 */
function extractAnswersFromText(text: string): string[] {
  if (!text || typeof text !== 'string') {
    return [];
  }

  // Clean and normalize the text
  const cleanText = text.trim().toLowerCase();

  // Look for quoted strings or bracketed content first
  const quotedMatches = cleanText.match(/"([^"]+)"/g);
  if (quotedMatches) {
    return quotedMatches
      .map((match) => match.replace(/"/g, '').trim())
      .filter((answer) => answer.length > 0 && answer.length <= 50)
      .slice(0, 5);
  }

  // Split by common separators and clean each answer
  const answers = cleanText
    .split(/[,;|&\n]|and|or/)
    .map((answer) => answer.trim())
    .filter((answer) => answer.length > 0)
    .map((answer) => {
      // Remove common question words and clean up
      return answer
        .replace(
          /^(the|a|an|is|are|was|were|will|would|could|should|may|might)\s+/i,
          ''
        )
        .replace(/[.!?]+$/, '')
        .trim();
    })
    .filter((answer) => answer.length > 0 && answer.length <= 50);

  // Return unique answers, limited to reasonable number
  return [...new Set(answers)].slice(0, 5);
}

/**
 * Analyzes an image using GPT-4o to extract key descriptive elements for a PTE task.
 * @param imageUrl The public URL of the image to analyze.
 * @returns An object containing the image analysis, or null if an error occurs.
 */
async function analyzeImageForKeyElements(imageUrl: string): Promise<{
  imageType: string;
  mainTopic: string;
  keyElements: string[];
  conclusion: string;
} | null> {
  if (!imageUrl) {
    return null;
  }

  try {
    const prompt = `
      You are an expert AI assistant specializing in analyzing images for the PTE "Describe Image" academic task.
      Your task is to analyze the provided image and extract key information that a student should mention in their description.

      Analyze the image and provide the following details in a strict JSON format:
      1.  **imageType**: The type of image (e.g., "bar chart", "line graph", "pie chart", "map", "diagram", "process flow", "photograph").
      2.  **mainTopic**: A concise title or summary of what the image is about.
      3.  **keyElements**: An array of 5-7 strings, each describing a crucial feature, trend, data point, or component in the image. These should be the most important things to mention.
      4.  **conclusion**: A single sentence that summarizes the main takeaway or implication of the image.

      Your response MUST be a single, minified JSON object and nothing else.
    `;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: prompt },
            {
              type: 'image_url',
              image_url: {
                url: imageUrl,
              },
            },
          ],
        },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.3,
      max_tokens: 500,
    });

    const aiResponse = response.choices[0]?.message?.content?.trim();
    if (!aiResponse) {
      console.error('No response from OpenAI for image analysis');
      return null;
    }

    const analysisResult = JSON.parse(aiResponse);

    // Basic validation of the parsed object
    if (
      analysisResult.mainTopic &&
      Array.isArray(analysisResult.keyElements) &&
      analysisResult.conclusion
    ) {
      return analysisResult;
    } else {
      console.error('Parsed OpenAI response is missing required fields.');
      return null;
    }
  } catch (error) {
    console.error('Error using OpenAI to analyze image:', error);
    return null;
  }
}

/**
 * Generate fill-in-the-blanks content from audio transcript using OpenAI
 */
async function generateFillInTheBlanksFromTranscript(
  transcript: string
): Promise<{ textWithBlanks: string; blanks: any[] }> {
  if (!transcript || typeof transcript !== 'string') {
    throw new Error('Invalid transcript provided');
  }

  try {
    const prompt = `
You are an expert at creating PTE (Pearson Test of English) "Listening Fill in the Blanks" questions.

Given the following audio transcript, create a fill-in-the-blanks exercise by:
1. Selecting 4-6 key words to remove (focus on content words: nouns, verbs, adjectives, adverbs)
2. Avoid removing function words (articles, prepositions, conjunctions) unless they're crucial
3. Choose words that test vocabulary and comprehension
4. Ensure the blanks are distributed throughout the text, not clustered
5. For each blank, provide 3-4 plausible options including the correct answer

Audio Transcript: "${transcript}"

**Rules:**
- Your response MUST be a valid JSON object with exactly this structure:
{
  "textWithBlanks": "The text with _____ where blanks should be",
  "blanks": [
    {
      "position": 1,
      "correctAnswer": "correct_word",
      "options": ["correct_word", "option2", "option3", "option4"]
    }
  ]
}
- Replace selected words with _____ in the textWithBlanks
- Each blank should have 3-4 options total (including the correct answer)
- Options should be shuffled (correct answer not always first)
- Make distractors plausible but clearly incorrect in context
- Ensure the text flows naturally even with blanks

Return only the JSON object, no additional text or explanations.`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content:
            'You are an expert PTE question creator. Always respond with valid JSON only.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.3,
      max_tokens: 2000,
    });

    const responseText = completion.choices[0]?.message?.content?.trim();
    if (!responseText) {
      throw new Error('No response from OpenAI');
    }

    console.log('OpenAI response for fill-in-the-blanks:', responseText);

    // Parse the JSON response
    const result = JSON.parse(responseText);

    // Validate the response structure
    if (!result.textWithBlanks || !Array.isArray(result.blanks)) {
      throw new Error('Invalid response structure from OpenAI');
    }

    // Validate each blank
    for (const blank of result.blanks) {
      if (
        !blank.correctAnswer ||
        !Array.isArray(blank.options) ||
        blank.options.length < 3
      ) {
        throw new Error('Invalid blank structure in OpenAI response');
      }
    }

    return result;
  } catch (error) {
    console.error('Error using OpenAI to generate fill-in-the-blanks:', error);

    // Fallback to simple word removal if OpenAI fails
    console.log('Falling back to simple word removal...');
    return generateSimpleFillInTheBlanks(transcript);
  }
}

/**
 * Fallback function to generate simple fill-in-the-blanks content
 */
function generateSimpleFillInTheBlanks(transcript: string): {
  textWithBlanks: string;
  blanks: any[];
} {
  const words = transcript.split(/\s+/);
  const contentWords = words.filter((word) => {
    // Remove punctuation for analysis
    const cleanWord = word.replace(/[^\w]/g, '').toLowerCase();

    // Skip short words, common words, and function words
    const skipWords = [
      'the',
      'a',
      'an',
      'and',
      'or',
      'but',
      'in',
      'on',
      'at',
      'to',
      'for',
      'of',
      'with',
      'by',
      'is',
      'are',
      'was',
      'were',
      'be',
      'been',
      'have',
      'has',
      'had',
      'do',
      'does',
      'did',
      'will',
      'would',
      'could',
      'should',
      'may',
      'might',
      'can',
      'this',
      'that',
      'these',
      'those',
      'i',
      'you',
      'he',
      'she',
      'it',
      'we',
      'they',
      'me',
      'him',
      'her',
      'us',
      'them',
    ];

    return cleanWord.length > 3 && !skipWords.includes(cleanWord);
  });

  // Select 4-6 words to remove (or fewer if not enough content words)
  const numBlanks = Math.min(
    Math.max(4, Math.floor(contentWords.length * 0.15)),
    6
  );
  const selectedIndices: number[] = [];

  // Randomly select words to remove, ensuring they're spread out
  for (
    let i = 0;
    i < numBlanks && selectedIndices.length < contentWords.length;
    i++
  ) {
    let randomIndex: number;
    let attempts = 0;
    do {
      randomIndex = Math.floor(Math.random() * words.length);
      attempts++;
    } while (
      (selectedIndices.includes(randomIndex) ||
        words[randomIndex].replace(/[^\w]/g, '').toLowerCase().length <= 3 ||
        selectedIndices.some((idx) => Math.abs(idx - randomIndex) < 3)) &&
      attempts < 50
    );

    if (attempts < 50) {
      selectedIndices.push(randomIndex);
    }
  }

  selectedIndices.sort((a, b) => a - b);

  // Create text with blanks and blanks array
  let textWithBlanks = '';
  const blanks = [];
  let blankPosition = 1;

  for (let i = 0; i < words.length; i++) {
    if (selectedIndices.includes(i)) {
      textWithBlanks += '_____';
      const correctAnswer = words[i].replace(/[^\w]/g, '');

      // Generate simple distractors (this is basic - OpenAI version is much better)
      const options = [correctAnswer];

      // Add some basic distractors
      const commonWords = [
        'important',
        'significant',
        'major',
        'primary',
        'essential',
        'critical',
        'fundamental',
        'basic',
        'simple',
        'complex',
        'difficult',
        'easy',
        'large',
        'small',
        'great',
        'good',
        'bad',
        'new',
        'old',
        'high',
        'low',
      ];
      while (options.length < 4) {
        const randomWord =
          commonWords[Math.floor(Math.random() * commonWords.length)];
        if (!options.includes(randomWord)) {
          options.push(randomWord);
        }
      }

      blanks.push({
        position: blankPosition++,
        correctAnswer,
        options: options.sort(() => Math.random() - 0.5), // Shuffle options
      });
    } else {
      textWithBlanks += words[i];
    }

    if (i < words.length - 1) {
      textWithBlanks += ' ';
    }
  }

  return {
    textWithBlanks,
    blanks,
  };
}

/**
 * Generate incorrect words content from audio transcript using OpenAI
 */
async function generateIncorrectWordsFromTranscript(
  transcript: string
): Promise<{ textWithErrors: string; incorrectWords: string[] }> {
  if (!transcript || typeof transcript !== 'string') {
    throw new Error('Invalid transcript provided');
  }

  try {
    // Try up to 2 times to get a good result
    let attempts = 0;
    const maxAttempts = 2;

    while (attempts < maxAttempts) {
      attempts++;
      console.log(`Attempt ${attempts} to generate incorrect words...`);

      const prompt = `
You are an expert at creating PTE (Pearson Test of English) "Highlight Incorrect Words" questions.

Given the following audio transcript, create a text with intentional errors by:
1. MUST replace exactly 4-5 words with similar but incorrect words
2. Choose words that sound similar or are contextually related but wrong
3. Ensure the errors are realistic mistakes a student might not notice
4. Keep the overall meaning and structure intact
5. Focus on content words (nouns, verbs, adjectives) rather than function words

Audio Transcript: "${transcript}"

**CRITICAL REQUIREMENTS:**
- You MUST replace at least 4 words minimum, preferably 5
- Your response MUST be a valid JSON object with exactly this structure:
{
  "textWithErrors": "The modified text with incorrect words",
  "incorrectWords": ["incorrect_word1", "incorrect_word2", "incorrect_word3", "incorrect_word4", "incorrect_word5"]
}
- The incorrectWords array MUST contain at least 4 words
- Choose words that are plausible but clearly wrong when compared to audio
- The incorrectWords array should contain only the incorrect words (not the original ones)
- Ensure the text flows naturally and is grammatically correct

**Examples of good replacements:**
- "pressure" → "pleasure" (similar sound)
- "research" → "studies" (contextually related)
- "performance" → "presentation" (similar meaning)
- "accurate" → "precise" (synonyms but contextually wrong)

Return only the JSON object, no additional text or explanations.`;

      const completion = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content:
              'You are an expert PTE question creator. Always respond with valid JSON only.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.3,
        max_tokens: 1500,
      });

      const responseText = completion.choices[0]?.message?.content?.trim();
      if (!responseText) {
        throw new Error('No response from OpenAI');
      }

      console.log('OpenAI response for incorrect words:', responseText);

      // Parse the JSON response
      const result = JSON.parse(responseText);

      console.log('Parsed result:', {
        textWithErrors: result.textWithErrors?.substring(0, 100) + '...',
        incorrectWordsCount: result.incorrectWords?.length,
        incorrectWords: result.incorrectWords,
      });

      // Validate the response structure
      if (!result.textWithErrors || !Array.isArray(result.incorrectWords)) {
        console.log(
          `Attempt ${attempts}: Invalid response structure from OpenAI`
        );
        if (attempts < maxAttempts) {
          continue; // Try again
        } else {
          throw new Error(
            'Invalid response structure from OpenAI after all attempts'
          );
        }
      }

      // Validate that we have enough incorrect words
      if (result.incorrectWords.length < 3) {
        console.log(
          `Attempt ${attempts}: OpenAI generated only ${result.incorrectWords.length} incorrect words, minimum 3 required`
        );
        if (attempts < maxAttempts) {
          continue; // Try again
        } else {
          throw new Error(
            `OpenAI generated only ${result.incorrectWords.length} incorrect words after ${maxAttempts} attempts, minimum 3 required`
          );
        }
      }

      // Success! Return the result
      console.log(
        `Successfully generated ${result.incorrectWords.length} incorrect words on attempt ${attempts}`
      );
      return result;
    }

    // If we get here, all attempts failed
    throw new Error(
      `Failed to generate enough incorrect words after ${maxAttempts} attempts`
    );
  } catch (error) {
    console.error('Error using OpenAI to generate incorrect words:', error);

    // Fallback to simple word replacement if OpenAI fails
    console.log('Falling back to simple word replacement...');
    return generateSimpleIncorrectWords(transcript);
  }
}

/**
 * Fallback function to generate simple incorrect words content
 */
function generateSimpleIncorrectWords(transcript: string): {
  textWithErrors: string;
  incorrectWords: string[];
} {
  const words = transcript.split(/\s+/);

  // Simple word replacements for common words
  const replacements: { [key: string]: string } = {
    important: 'significant',
    significant: 'important',
    large: 'big',
    big: 'large',
    small: 'little',
    little: 'small',
    good: 'great',
    great: 'good',
    new: 'recent',
    recent: 'new',
    old: 'ancient',
    ancient: 'old',
    fast: 'quick',
    quick: 'fast',
    slow: 'gradual',
    gradual: 'slow',
    high: 'tall',
    tall: 'high',
    low: 'short',
    short: 'low',
  };

  const incorrectWords: string[] = [];
  const modifiedWords = [...words];

  // Replace 3-4 words minimum
  const minReplacements = 3;
  const maxReplacements = Math.min(
    4,
    Math.max(minReplacements, Math.floor(words.length / 15))
  );
  let replacements_made = 0;

  // First pass: try to replace words using the dictionary
  for (
    let i = 0;
    i < words.length && replacements_made < maxReplacements;
    i++
  ) {
    const cleanWord = words[i].replace(/[^\w]/g, '').toLowerCase();

    if (replacements[cleanWord] && Math.random() > 0.5) {
      const replacement = replacements[cleanWord];
      modifiedWords[i] = words[i].replace(
        new RegExp(cleanWord, 'i'),
        replacement
      );
      incorrectWords.push(replacement);
      replacements_made++;
    }
  }

  // Second pass: force additional replacements if we don't have enough
  const additionalReplacements = [
    'different',
    'various',
    'several',
    'multiple',
    'numerous',
  ];
  let additionalIndex = 0;

  while (incorrectWords.length < minReplacements && words.length > 5) {
    const randomIndex = Math.floor(Math.random() * (words.length - 2)) + 1;
    const originalWord = words[randomIndex].replace(/[^\w]/g, '');

    // Skip if we already modified this word
    if (
      originalWord.length > 3 &&
      !incorrectWords.some((word) =>
        modifiedWords[randomIndex].toLowerCase().includes(word.toLowerCase())
      )
    ) {
      const replacement =
        additionalReplacements[additionalIndex % additionalReplacements.length];
      modifiedWords[randomIndex] = words[randomIndex].replace(
        new RegExp(originalWord, 'i'),
        replacement
      );
      incorrectWords.push(replacement);
      additionalIndex++;
    }
  }

  return {
    textWithErrors: modifiedWords.join(' '),
    incorrectWords,
  };
}
