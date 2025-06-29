import { NextFunction, Request, Response } from 'express';
import { sendResponse } from '../utils/helpers';
import { STATUS_CODES } from '../utils/constants'; // Adjust path based on your actual structure

interface CustomError extends Error {
  statusCode?: number;
  message: string;
  // Add more specific properties if you have custom error classes (e.g., errors: string[])
}

// 1. Not Found Middleware
export const notFound = (req: Request, res: Response, next: NextFunction) => {
  const error = new Error(`Not Found - ${req.originalUrl}`) as CustomError;
  res.status(404); // Set the status here before passing, so errorHandler can use it
  next(error);
};

export const errorHandler = (
  err: CustomError, // Using the CustomError interface for type safety
  req: Request,
  res: Response,
  next: NextFunction // next is required for Express error handlers
) => {
  console.error(err.stack);

  // Determine the status code
  let statusCode = err.statusCode || res.statusCode;
  if (statusCode < 400 || statusCode === STATUS_CODES.OK) {
    // Ensure it's an error status code
    statusCode = STATUS_CODES.INTERNAL_SERVER_ERROR; // Default to 500 if not explicitly an error status
  }

  // Determine the error message
  // Use a generic message in production to avoid leaking sensitive error details
  let message = err.message;
  if (
    process.env.NODE_ENV === 'production' &&
    statusCode === STATUS_CODES.INTERNAL_SERVER_ERROR
  ) {
    message = 'An unexpected server error occurred.'; // Generic message for unexpected production errors
  }

  // JWT Errors
  if (err instanceof Error && err.name === 'JsonWebTokenError') {
    message = 'Not authorized, invalid token.';
    statusCode = STATUS_CODES.UNAUTHORIZED;
  }
  if (err instanceof Error && err.name === 'TokenExpiredError') {
    message = 'Not authorized, token expired.';
    statusCode = STATUS_CODES.UNAUTHORIZED;
  }

  // PRISMA Errors
  if (err instanceof Error && 'code' in err && (err as any).code === 'P2025') {
    // Prisma RecordNotFound
    message = 'Resource not found.';
    statusCode = STATUS_CODES.NOT_FOUND;
  }

  // Send the error response using your consistent sendResponse utility
  return sendResponse(res, statusCode, null, message);
};
