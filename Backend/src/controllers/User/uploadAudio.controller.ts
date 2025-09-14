import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import multer from 'multer';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { STATUS_CODES } from '../../utils/constants';
import { sendResponse } from '../../utils/helpers';
import { CustomRequest } from '../../types';

// Configure S3 client
const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  },
  fileFilter: (req, file, cb) => {
    // Accept audio files
    if (file.mimetype.startsWith('audio/')) {
      cb(null, true);
    } else {
      cb(new Error('Only audio files are allowed'));
    }
  },
});

/**
 * @desc    Upload audio file to S3
 * @route   POST /api/user/upload-audio
 * @access  Private (requires authentication)
 */
export const uploadAudio = [
  upload.single('audio'),
  asyncHandler(async (req: CustomRequest, res: Response) => {
    const userId = req.user?.id;

    try {
      if (!userId) {
        return sendResponse(
          res,
          STATUS_CODES.UNAUTHORIZED,
          null,
          'Authentication required.'
        );
      }

      if (!req.file) {
        return sendResponse(
          res,
          STATUS_CODES.BAD_REQUEST,
          null,
          'No audio file provided.'
        );
      }

      // Generate unique filename
      const timestamp = Date.now();
      const fileExtension = req.file.originalname.split('.').pop() || 'webm';
      const fileName = `audio/user-recordings/${userId}/${timestamp}.${fileExtension}`;

      // Upload to S3
      const uploadCommand = new PutObjectCommand({
        Bucket: process.env.AWS_S3_BUCKET_NAME!,
        Key: fileName,
        Body: req.file.buffer,
        ContentType: req.file.mimetype,
        Metadata: {
          userId: userId,
          uploadedAt: new Date().toISOString(),
        },
      });

      await s3Client.send(uploadCommand);

      return sendResponse(
        res,
        STATUS_CODES.OK,
        {
          audioKey: fileName,
          fileName: req.file.originalname,
          size: req.file.size,
          mimeType: req.file.mimetype,
        },
        'Audio file uploaded successfully.'
      );
    } catch (error: any) {
      console.error('Audio upload error:', error);
      return sendResponse(
        res,
        STATUS_CODES.INTERNAL_SERVER_ERROR,
        null,
        'An error occurred while uploading the audio file.'
      );
    }
  }),
];

export default uploadAudio;
