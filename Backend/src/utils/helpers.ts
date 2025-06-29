// src/utils/sendResponse.ts
import { Response } from 'express';
import { HttpStatusCode } from './constants';

// Define the response format
interface ApiResponse<T> {
  success: boolean;
  data: T | null;
  message: string;
  statusCode: HttpStatusCode;
}

// Updated sendResponse function
export const sendResponse = <T>(
  res: Response,
  status: HttpStatusCode,
  data: T | null = null, // Make data optional with default null
  message: string
) => {
  // Determine success boolean: true for 2xx status codes, false otherwise
  const isSuccess = status >= 200 && status < 300;

  // Construct response object
  const response: ApiResponse<T> = {
    success: isSuccess,
    data,
    message,
    statusCode: status,
  };

  res.status(status).json(response);
};
