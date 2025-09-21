import fs from 'fs';
import http from 'http';
import https from 'https';
import path from 'path';
import { promisify } from 'util';
import { generateAudioSignedUrl } from '../config/cloudFrontConfig';
import openai from '../config/openAi';

interface TranscriptionResult {
  text: string;
  confidence?: number;
  language?: string;
  duration?: number;
}

/**
 * Download audio file using secure URL and save temporarily
 */
async function downloadAudioFromSecureUrl(audioKey: string): Promise<string> {
  try {
    console.log(`Attempting to download audio file: ${audioKey}`);

    // Generate secure URL for the audio file
    const secureUrlResponse = generateAudioSignedUrl(audioKey, 5);

    console.log(secureUrlResponse, 'secureUrlResponseXXXX');

    console.log(`Generated secure URL for audio download`);

    // Create temporary file path
    const tempDir = path.join(process.cwd(), 'temp');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    const tempFileName = `audio_${Date.now()}_${Math.random()
      .toString(36)
      .substring(7)}.webm`;
    const tempFilePath = path.join(tempDir, tempFileName);

    // Download the file using the secure URL with Node.js https
    await new Promise<void>((resolve, reject) => {
      const url = new URL(secureUrlResponse);
      const client = url.protocol === 'https:' ? https : http;

      const request = client.get(secureUrlResponse, (response) => {
        if (response.statusCode !== 200) {
          reject(new Error(`HTTP error! status: ${response.statusCode}`));
          return;
        }

        const fileStream = fs.createWriteStream(tempFilePath);
        response.pipe(fileStream);

        fileStream.on('finish', () => {
          fileStream.close();
          resolve();
        });

        fileStream.on('error', (error) => {
          fs.unlink(tempFilePath, () => {}); // Clean up on error
          reject(error);
        });
      });

      request.on('error', (error) => {
        reject(error);
      });

      request.setTimeout(30000, () => {
        request.destroy();
        reject(new Error('Download timeout'));
      });
    });

    console.log(`Audio file downloaded successfully to: ${tempFilePath}`);
    return tempFilePath;
  } catch (error: any) {
    console.error('Error downloading audio from secure URL:', error);

    // Provide specific error messages based on error type
    if (error.message?.includes('CloudFront')) {
      throw new Error(
        'CloudFront configuration error: Unable to generate secure URL for audio file.'
      );
    } else if (
      error.message?.includes('403') ||
      error.message?.includes('Access')
    ) {
      throw new Error(
        'Access denied: Unable to access audio file. Please check permissions.'
      );
    } else if (
      error.message?.includes('404') ||
      error.message?.includes('Not Found')
    ) {
      throw new Error('Audio file not found in storage.');
    } else if (error.message?.includes('HTTP error')) {
      throw new Error(`Failed to download audio file: ${error.message}`);
    } else {
      throw new Error(`Failed to download audio file: ${error.message}`);
    }
  }
}

/**
 * Clean up temporary file
 */
async function cleanupTempFile(filePath: string): Promise<void> {
  try {
    if (fs.existsSync(filePath)) {
      await promisify(fs.unlink)(filePath);
    }
  } catch (error) {
    console.error('Error cleaning up temp file:', error);
    // Don't throw error for cleanup failures
  }
}

/**
 * Transcribe audio using OpenAI Whisper API
 */
export async function transcribeAudio(audioKey: string): Promise<TranscriptionResult> {
  try {
    const secureUrl = generateAudioSignedUrl(audioKey, 5);

    const response = await fetch(secureUrl);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    // 1. Get the audio data as an ArrayBuffer from the fetch response.
    const audioData = await response.arrayBuffer();

    // 2. Extract the original filename from the audioKey.
    const fileName = audioKey.split('/').pop() || 'audio.webm';

    // 3. Get the content type from the response headers.
    const contentType = response.headers.get('content-type') || 'audio/webm';

    // 4. Construct a File object with the data and metadata.
    const audioFile = new File([audioData], fileName, { type: contentType });

    console.log(`Created file object: ${fileName}, Type: ${contentType}`);
    console.log('Sending file to OpenAI Whisper...');

    // 5. Pass the newly created File object to the OpenAI SDK.
    const transcription = await openai.audio.transcriptions.create({
      file: audioFile,
      model: 'whisper-1',
      language: 'en',
      response_format: 'verbose_json',
      temperature: 0.0,
    });

    console.log(
      `Transcription completed. Text length: ${transcription.text.length} characters`
    );

    return {
      text: transcription.text.trim(),
      language: transcription.language,
      duration: transcription.duration,
    };
  } catch (error: any) {
    console.error('Error transcribing audio:', error);
    // Your existing error handling logic remains valid
    throw new Error(
      `Failed to transcribe audio: ${error.message || 'Unknown error'}`
    );
  }
}

/**
 * Transcribe audio with retry logic
 */
export async function transcribeAudioWithRetry(
  audioKey: string,
  maxRetries: number = 3
): Promise<TranscriptionResult> {
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await transcribeAudio(audioKey);
    } catch (error: any) {
      lastError = error;
      console.error(`Transcription attempt ${attempt} failed:`, error.message);

      // Don't retry for certain types of errors
      if (
        error.message?.includes('Unsupported audio format') ||
        error.message?.includes('File too large') ||
        error.message?.includes('Authentication')
      ) {
        throw error;
      }

      // Wait before retrying (exponential backoff)
      if (attempt < maxRetries) {
        const delay = Math.pow(2, attempt) * 1000; // 2s, 4s, 8s
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError || new Error('Transcription failed after multiple attempts');
}

/**
 * Validate audio file before transcription
 */
export function validateAudioFile(audioKey: string): boolean {
  console.log('Validating audio file:', audioKey);

  // Check if audio key has valid format
  if (!audioKey || typeof audioKey !== 'string') {
    console.log('Validation failed: audioKey is not a valid string');
    return false;
  }

  // Check if it's in the expected S3 path
  if (!audioKey.startsWith('audio/user-recordings/')) {
    console.log(
      'Validation failed: audioKey does not start with "audio/user-recordings/"'
    );
    console.log('Actual start:', audioKey.substring(0, 30));
    return false;
  }

  // Check file extension
  const validExtensions = ['.webm', '.mp3', '.wav', '.m4a', '.ogg'];
  const hasValidExtension = validExtensions.some((ext) =>
    audioKey.toLowerCase().endsWith(ext)
  );

  if (!hasValidExtension) {
    console.log('Validation failed: invalid file extension');
    console.log('Valid extensions:', validExtensions);
    console.log('Actual ending:', audioKey.substring(audioKey.length - 10));
  }

  console.log('Validation result:', hasValidExtension);
  return hasValidExtension;
}
