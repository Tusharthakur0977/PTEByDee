import { S3Client, DeleteObjectCommand } from '@aws-sdk/client-s3';
import multer from 'multer';
import multerS3 from 'multer-s3';
import path from 'path';

// Create S3 client instance
const s3 = new S3Client({
  region: process.env.AWS_REGION || 'ap-southeast-2',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

// File filter function for images
const imageFileFilter = (
  _req: any,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  // Check file type
  const allowedMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new Error(
        'Invalid file type. Only JPEG, PNG, and WebP images are allowed.'
      )
    );
  }
};

// File filter function for videos
const videoFileFilter = (
  _req: any,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  // Check file type
  const allowedMimes = [
    'video/mp4',
    'video/webm',
    'video/quicktime',
    'video/x-msvideo',
  ];

  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new Error(
        'Invalid file type. Only MP4, WebM, MOV, and AVI videos are allowed.'
      )
    );
  }
};

// File filter function for audio files
const audioFileFilter = (
  _req: any,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  // Check file type
  const allowedMimes = [
    'audio/mpeg',
    'audio/mp3',
    'audio/wav',
    'audio/ogg',
    'audio/m4a',
    'audio/aac',
  ];

  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new Error(
        'Invalid file type. Only MP3, WAV, OGG, M4A, and AAC audio files are allowed.'
      )
    );
  }
};

// Generate unique filename for images
const generateImageFileName = (originalName: string): string => {
  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substring(2, 15);
  const extension = path.extname(originalName);
  return `course-images/${timestamp}-${randomString}${extension}`;
};

// Generate unique filename for videos
const generateVideoFileName = (originalName: string): string => {
  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substring(2, 15);
  const extension = path.extname(originalName);
  return `course-videos/${timestamp}-${randomString}${extension}`;
};

// Generate unique filename for audio files
const generateAudioFileName = (originalName: string): string => {
  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substring(2, 15);
  const extension = path.extname(originalName);
  return `question-audio/${timestamp}-${randomString}${extension}`;
};

// Multer S3 configuration for course images
// Files are uploaded as private (no ACL specified) for security
export const courseImageUpload = multer({
  storage: multerS3({
    s3: s3,
    bucket: process.env.AWS_S3_BUCKET_NAME!,
    // acl: 'public-read', // Removed for security - files are now private
    key: (_req: any, file: Express.Multer.File, cb: any) => {
      const fileName = generateImageFileName(file.originalname);
      cb(null, fileName);
    },
    contentType: multerS3.AUTO_CONTENT_TYPE,
    metadata: (_req: any, file: Express.Multer.File, cb: any) => {
      cb(null, {
        fieldName: file.fieldname,
        originalName: file.originalname,
        uploadedAt: new Date().toISOString(),
      });
    },
  }),
  fileFilter: imageFileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
});

// Multer S3 configuration for course videos
// Files are uploaded as private (no ACL specified) for security
export const courseVideoUpload = multer({
  storage: multerS3({
    s3: s3,
    bucket: process.env.AWS_S3_BUCKET_NAME!,
    // acl: 'public-read', // Removed for security - files are now private
    key: (_req: any, file: Express.Multer.File, cb: any) => {
      const fileName = generateVideoFileName(file.originalname);
      cb(null, fileName);
    },
    contentType: multerS3.AUTO_CONTENT_TYPE,
    metadata: (_req: any, file: Express.Multer.File, cb: any) => {
      cb(null, {
        fieldName: file.fieldname,
        originalName: file.originalname,
        uploadedAt: new Date().toISOString(),
      });
    },
  }),
  fileFilter: videoFileFilter,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB limit for videos
  },
});

// Multer S3 configuration for question audio files
// Files are uploaded as private (no ACL specified) for security
export const questionAudioUpload = multer({
  storage: multerS3({
    s3: s3,
    bucket: process.env.AWS_S3_BUCKET_NAME!,
    key: (_req: any, file: Express.Multer.File, cb: any) => {
      const fileName = generateAudioFileName(file.originalname);
      cb(null, fileName);
    },
    contentType: multerS3.AUTO_CONTENT_TYPE,
    metadata: (_req: any, file: Express.Multer.File, cb: any) => {
      cb(null, {
        fieldName: file.fieldname,
        originalName: file.originalname,
        uploadedAt: new Date().toISOString(),
        type: 'question-audio',
      });
    },
  }),
  fileFilter: audioFileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit for audio files
  },
});

// Function to delete file from S3
export const deleteFileFromS3 = async (fileUrl: string): Promise<boolean> => {
  try {
    // Check if bucket name is configured
    const bucketName = process.env.AWS_S3_BUCKET_NAME;
    if (!bucketName) {
      console.error(
        'AWS_S3_BUCKET_NAME environment variable is not configured'
      );
      return false;
    }

    // Extract key from URL
    const urlParts = fileUrl.split('/');
    const key = urlParts.slice(-2).join('/'); // Get 'course-images/filename'

    const command = new DeleteObjectCommand({
      Bucket: bucketName,
      Key: key,
    });

    await s3.send(command);
    return true;
  } catch (error) {
    console.error('Error deleting file from S3:', error);
    return false;
  }
};

// Function to check if S3 is properly configured
export const checkS3Configuration = (): boolean => {
  const requiredEnvVars = [
    'AWS_ACCESS_KEY_ID',
    'AWS_SECRET_ACCESS_KEY',
    'AWS_S3_BUCKET_NAME',
  ];

  const missingVars = requiredEnvVars.filter(
    (varName) => !process.env[varName]
  );

  if (missingVars.length > 0) {
    console.error('Missing required AWS environment variables:', missingVars);
    return false;
  }

  return true;
};

export { s3 };
