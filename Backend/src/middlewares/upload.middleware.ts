import { Request, Response, NextFunction } from 'express';
import {
  courseImageUpload,
  courseVideoUpload,
  questionAudioUpload,
  questionImageUpload,
} from '../config/s3Config';
import { sendResponse } from '../utils/helpers';
import { STATUS_CODES } from '../utils/constants';

/**
 * Middleware to handle course image upload with proper error handling
 */
export const handleCourseImageUpload = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const upload = courseImageUpload.single('courseImage');

  upload(req, res, (error: any) => {
    if (error) {
      console.error('Multer upload error:', error);

      // Handle specific multer errors
      if (error.code === 'LIMIT_FILE_SIZE') {
        return sendResponse(
          res,
          STATUS_CODES.BAD_REQUEST,
          null,
          'File size too large. Maximum size allowed is 5MB.'
        );
      }

      if (error.message && error.message.includes('Invalid file type')) {
        return sendResponse(
          res,
          STATUS_CODES.BAD_REQUEST,
          null,
          'Invalid file type. Only JPEG, PNG, and WebP images are allowed.'
        );
      }

      // Handle AWS S3 errors
      if (error.code === 'NoSuchBucket') {
        return sendResponse(
          res,
          STATUS_CODES.INTERNAL_SERVER_ERROR,
          null,
          'S3 bucket not found. Please check AWS configuration.'
        );
      }

      if (error.code === 'AccessDenied') {
        return sendResponse(
          res,
          STATUS_CODES.INTERNAL_SERVER_ERROR,
          null,
          'Access denied to S3 bucket. Please check AWS credentials.'
        );
      }

      // Generic error
      return sendResponse(
        res,
        STATUS_CODES.INTERNAL_SERVER_ERROR,
        null,
        'An error occurred while uploading the image. Please try again.'
      );
    }

    // No error, proceed to next middleware
    next();
  });
};

/**
 * Middleware to handle course video upload with proper error handling
 */
export const handleCourseVideoUpload = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const upload = courseVideoUpload.single('courseVideo');

  upload(req, res, (error: any) => {
    if (error) {
      console.error('Multer video upload error:', error);

      // Handle specific multer errors
      if (error.code === 'LIMIT_FILE_SIZE') {
        return sendResponse(
          res,
          STATUS_CODES.BAD_REQUEST,
          null,
          'File size too large. Maximum size allowed is 100MB.'
        );
      }

      if (error.message && error.message.includes('Invalid file type')) {
        return sendResponse(
          res,
          STATUS_CODES.BAD_REQUEST,
          null,
          'Invalid file type. Only MP4, WebM, MOV, and AVI videos are allowed.'
        );
      }

      // Handle AWS S3 errors
      if (error.code === 'NoSuchBucket') {
        return sendResponse(
          res,
          STATUS_CODES.INTERNAL_SERVER_ERROR,
          null,
          'S3 bucket not found. Please check AWS configuration.'
        );
      }

      if (error.code === 'AccessDenied') {
        return sendResponse(
          res,
          STATUS_CODES.INTERNAL_SERVER_ERROR,
          null,
          'Access denied to S3 bucket. Please check AWS credentials.'
        );
      }

      // Generic error
      return sendResponse(
        res,
        STATUS_CODES.INTERNAL_SERVER_ERROR,
        null,
        'An error occurred while uploading the video. Please try again.'
      );
    }

    // No error, proceed to next middleware
    next();
  });
};

/**
 * Middleware to handle section video upload with proper error handling
 */
export const handleSectionVideoUpload = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const upload = courseVideoUpload.single('sectionVideo');

  upload(req, res, (error: any) => {
    if (error) {
      console.error('Multer section video upload error:', error);

      // Handle specific multer errors
      if (error.code === 'LIMIT_FILE_SIZE') {
        return sendResponse(
          res,
          STATUS_CODES.BAD_REQUEST,
          null,
          'File size too large. Maximum size allowed is 100MB.'
        );
      }

      if (error.message && error.message.includes('Invalid file type')) {
        return sendResponse(
          res,
          STATUS_CODES.BAD_REQUEST,
          null,
          'Invalid file type. Only MP4, WebM, MOV, and AVI videos are allowed.'
        );
      }

      // Handle AWS S3 errors
      if (error.code === 'NoSuchBucket') {
        return sendResponse(
          res,
          STATUS_CODES.INTERNAL_SERVER_ERROR,
          null,
          'S3 bucket not found. Please check AWS configuration.'
        );
      }

      if (error.code === 'AccessDenied') {
        return sendResponse(
          res,
          STATUS_CODES.INTERNAL_SERVER_ERROR,
          null,
          'Access denied to S3 bucket. Please check AWS credentials.'
        );
      }

      // Generic error
      return sendResponse(
        res,
        STATUS_CODES.INTERNAL_SERVER_ERROR,
        null,
        'An error occurred while uploading the section video. Please try again.'
      );
    }

    // No error, proceed to next middleware
    next();
  });
};

/**
 * Middleware to handle lesson video upload with proper error handling
 */
export const handleLessonVideoUpload = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const upload = courseVideoUpload.single('lessonVideo');

  upload(req, res, (error: any) => {
    if (error) {
      console.error('Multer lesson video upload error:', error);

      // Handle specific multer errors
      if (error.code === 'LIMIT_FILE_SIZE') {
        return sendResponse(
          res,
          STATUS_CODES.BAD_REQUEST,
          null,
          'File size too large. Maximum size allowed is 100MB.'
        );
      }

      if (error.message && error.message.includes('Invalid file type')) {
        return sendResponse(
          res,
          STATUS_CODES.BAD_REQUEST,
          null,
          'Invalid file type. Only MP4, WebM, MOV, and AVI videos are allowed.'
        );
      }

      // Handle AWS S3 errors
      if (error.code === 'NoSuchBucket') {
        return sendResponse(
          res,
          STATUS_CODES.INTERNAL_SERVER_ERROR,
          null,
          'S3 bucket not found. Please check AWS configuration.'
        );
      }

      if (error.code === 'AccessDenied') {
        return sendResponse(
          res,
          STATUS_CODES.INTERNAL_SERVER_ERROR,
          null,
          'Access denied to S3 bucket. Please check AWS credentials.'
        );
      }

      // Generic error
      return sendResponse(
        res,
        STATUS_CODES.INTERNAL_SERVER_ERROR,
        null,
        'An error occurred while uploading the lesson video. Please try again.'
      );
    }

    // No error, proceed to next middleware
    next();
  });
};

/**
 * Middleware to handle question audio upload with proper error handling
 */
export const handleQuestionAudioUpload = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const upload = questionAudioUpload.single('questionAudio');

  upload(req, res, (error: any) => {
    if (error) {
      console.error('Multer question audio upload error:', error);

      // Handle specific multer errors
      if (error.code === 'LIMIT_FILE_SIZE') {
        return sendResponse(
          res,
          STATUS_CODES.BAD_REQUEST,
          null,
          'File size too large. Maximum size allowed is 50MB.'
        );
      }

      if (error.message && error.message.includes('Invalid file type')) {
        return sendResponse(
          res,
          STATUS_CODES.BAD_REQUEST,
          null,
          'Invalid file type. Only MP3, WAV, OGG, M4A, and AAC audio files are allowed.'
        );
      }

      // Handle AWS S3 errors
      if (error.code === 'NoSuchBucket') {
        return sendResponse(
          res,
          STATUS_CODES.INTERNAL_SERVER_ERROR,
          null,
          'S3 bucket not found. Please check AWS configuration.'
        );
      }

      if (error.code === 'AccessDenied') {
        return sendResponse(
          res,
          STATUS_CODES.INTERNAL_SERVER_ERROR,
          null,
          'Access denied to S3 bucket. Please check AWS credentials.'
        );
      }

      // Generic error
      return sendResponse(
        res,
        STATUS_CODES.INTERNAL_SERVER_ERROR,
        null,
        'An error occurred while uploading the audio file. Please try again.'
      );
    }

    // No error, proceed to next middleware
    next();
  });
};

/**
 * Middleware to handle question image upload with proper error handling
 */
export const handleQuestionImageUpload = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const upload = questionImageUpload.single('questionImage');

  upload(req, res, (error: any) => {
    if (error) {
      console.error('Multer question image upload error:', error);

      // Handle specific multer errors
      if (error.code === 'LIMIT_FILE_SIZE') {
        return sendResponse(
          res,
          STATUS_CODES.BAD_REQUEST,
          null,
          'File size too large. Maximum size allowed is 5MB.'
        );
      }

      if (error.message && error.message.includes('Invalid file type')) {
        return sendResponse(
          res,
          STATUS_CODES.BAD_REQUEST,
          null,
          'Invalid file type. Only JPEG, PNG, and WebP images are allowed.'
        );
      }

      // Handle AWS S3 errors
      if (error.code === 'NoSuchBucket') {
        return sendResponse(
          res,
          STATUS_CODES.INTERNAL_SERVER_ERROR,
          null,
          'S3 bucket not found. Please check AWS configuration.'
        );
      }

      if (error.code === 'AccessDenied') {
        return sendResponse(
          res,
          STATUS_CODES.INTERNAL_SERVER_ERROR,
          null,
          'Access denied to S3 bucket. Please check AWS credentials.'
        );
      }

      // Generic error
      return sendResponse(
        res,
        STATUS_CODES.INTERNAL_SERVER_ERROR,
        null,
        'An error occurred while uploading the question image. Please try again.'
      );
    }

    // No error, proceed to next middleware
    next();
  });
};

/**
 * Middleware to validate that a file was uploaded
 */
export const validateFileUpload = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (!req.file) {
    return sendResponse(
      res,
      STATUS_CODES.BAD_REQUEST,
      null,
      'No file provided. Please select a file to upload.'
    );
  }

  next();
};
