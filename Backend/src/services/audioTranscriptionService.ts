import openai from '../config/openAi';
import fs from 'fs';
import path from 'path';
import { promisify } from 'util';
import { SecureUrlService } from './secureUrlService';
import https from 'https';
import http from 'http';

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
    const secureUrlResponse = await SecureUrlService.generateSecureAudioUrl(
      audioKey,
      {
        expirationHours: 1, // Short expiration for transcription processing
      }
    );

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
      const url = new URL(secureUrlResponse.signedUrl);
      const client = url.protocol === 'https:' ? https : http;

      const request = client.get(secureUrlResponse.signedUrl, (response) => {
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
export async function transcribeAudio(
  audioKey: string
): Promise<TranscriptionResult> {
  let tempFilePath: string | null = null;

  try {
    console.log(`Starting transcription process for audio key: ${audioKey}`);

    // Validate audio key format
    if (!validateAudioFile(audioKey)) {
      throw new Error('Invalid audio file key format');
    }

    // Download audio file using secure URL
    tempFilePath = await downloadAudioFromSecureUrl(audioKey);

    // Check if file exists and has content
    const stats = await promisify(fs.stat)(tempFilePath);
    if (stats.size === 0) {
      throw new Error('Audio file is empty');
    }

    console.log(`Audio file size: ${stats.size} bytes`);

    // Create file stream for OpenAI API
    const audioFile = fs.createReadStream(tempFilePath);

    console.log('Sending audio to OpenAI Whisper for transcription...');

    // Transcribe using OpenAI Whisper
    const transcription = await openai.audio.transcriptions.create({
      file: audioFile,
      model: 'whisper-1',
      language: 'en', // Specify English for PTE
      response_format: 'verbose_json', // Get detailed response with timestamps
      temperature: 0.0, // Use deterministic output for consistency
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

    // Handle specific error types
    if (
      error.message?.includes('Access denied') ||
      error.message?.includes('permissions')
    ) {
      throw new Error(
        'Access denied: Unable to access audio file. Please check S3 permissions.'
      );
    } else if (error.message?.includes('Invalid file format')) {
      throw new Error(
        'Unsupported audio format. Please use a supported audio format.'
      );
    } else if (error.message?.includes('File too large')) {
      throw new Error('Audio file is too large. Please use a smaller file.');
    } else if (
      error.message?.includes('quota') ||
      error.message?.includes('rate limit')
    ) {
      throw new Error(
        'Transcription service temporarily unavailable. Please try again later.'
      );
    } else if (error.message?.includes('not found')) {
      throw new Error('Audio file not found. Please try recording again.');
    } else {
      throw new Error(`Failed to transcribe audio: ${error.message}`);
    }
  } finally {
    // Clean up temporary file
    if (tempFilePath) {
      await cleanupTempFile(tempFilePath);
    }
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
  // Check if audio key has valid format
  if (!audioKey || typeof audioKey !== 'string') {
    return false;
  }

  // Check if it's in the expected S3 path
  if (!audioKey.startsWith('audio/user-recordings/')) {
    return false;
  }

  // Check file extension
  const validExtensions = ['.webm', '.mp3', '.wav', '.m4a', '.ogg'];
  const hasValidExtension = validExtensions.some((ext) =>
    audioKey.toLowerCase().endsWith(ext)
  );

  return hasValidExtension;
}
