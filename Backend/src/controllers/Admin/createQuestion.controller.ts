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
      audioKey,
      imageKey,
      options,
      correctAnswers,
      wordCountMin,
      wordCountMax,
      durationMillis,
      originalTextWithErrors,
      incorrectWords,
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
        audioKey,
        imageKey,
        options,
        correctAnswers,
        wordCountMin,
        wordCountMax,
        durationMillis,
        originalTextWithErrors,
        incorrectWords,
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

      if (
        (questionType.name === 'REPEAT_SENTENCE' ||
          questionType.name === 'RE_TELL_LECTURE') &&
        audioKey
      ) {
        try {
          console.log('Transcribing audio for Repeat Sentence...');
          const transcriptionResult = await transcribeAudioWithRetry(audioKey);
          const transcribedText = transcriptionResult.text;

          audioTranscript = transcribedText;
        } catch (error) {
          console.error('Error transcribing audio for Repeat Sentence:', error);
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

      // Create the question
      const question = await prisma.question.create({
        data: {
          questionCode,
          questionTypeId,
          difficultyLevel,
          textContent: finalContent || audioTranscript || null,
          audioUrl: audioKey || null, // Store S3 key in audioUrl field
          imageUrl: imageKey || null, // Store S3 key in imageUrl field
          options: options || null,
          correctAnswers: finalCorrectAnswers || null,
          wordCountMin: wordCountMin || null,
          wordCountMax: wordCountMax || null,
          durationMillis: durationMillis || null,
          originalTextWithErrors: originalTextWithErrors || null,
          incorrectWords: incorrectWords || null,
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
    audioKey,
    imageKey,
    options,
    correctAnswers,
    wordCountMin,
    wordCountMax,
    originalTextWithErrors,
    incorrectWords,
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
    case 'READING_WRITING_FILL_IN_THE_BLANKS':
    case 'LISTENING_FILL_IN_THE_BLANKS':
      if (!textContent && !audioKey) {
        return {
          isValid: false,
          message:
            'Text content or audio is required for fill in the blanks questions.',
        };
      }
      if (!correctAnswers) {
        return {
          isValid: false,
          message:
            'Correct answers are required for fill in the blanks questions.',
        };
      }
      break;

    case 'RE_ORDER_PARAGRAPHS':
      if (!textContent) {
        return {
          isValid: false,
          message:
            'Text content is required for Re-order Paragraphs questions.',
        };
      }
      if (!correctAnswers) {
        return {
          isValid: false,
          message:
            'Correct order is required for Re-order Paragraphs questions.',
        };
      }
      break;

    case 'HIGHLIGHT_INCORRECT_WORDS':
      if (!originalTextWithErrors) {
        return {
          isValid: false,
          message:
            'Original text with errors is required for Highlight Incorrect Words questions.',
        };
      }
      if (!incorrectWords || !Array.isArray(incorrectWords)) {
        return {
          isValid: false,
          message:
            'Incorrect words array is required for Highlight Incorrect Words questions.',
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
