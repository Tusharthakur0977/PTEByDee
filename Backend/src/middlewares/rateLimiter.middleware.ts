import { Request, Response, NextFunction } from 'express';
import { sendResponse } from '../utils/helpers';
import { STATUS_CODES } from '../utils/constants';

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

const store: RateLimitStore = {};

// Clean up expired entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  Object.keys(store).forEach((key) => {
    if (store[key].resetTime < now) {
      delete store[key];
    }
  });
}, 5 * 60 * 1000);

export const createRateLimiter = (options: {
  windowMs: number;
  max: number;
  message?: string;
  keyGenerator?: (req: Request) => string;
}) => {
  const {
    windowMs,
    max,
    message = 'Too many requests, please try again later.',
    keyGenerator = (req: Request) => req.ip || 'unknown',
  } = options;

  return (req: Request, res: Response, next: NextFunction) => {
    const key = keyGenerator(req);
    const now = Date.now();
    const resetTime = now + windowMs;

    if (!store[key] || store[key].resetTime < now) {
      store[key] = {
        count: 1,
        resetTime,
      };
      return next();
    }

    store[key].count++;

    if (store[key].count > max) {
      const timeLeft = Math.ceil((store[key].resetTime - now) / 1000);
      return sendResponse(
        res,
        STATUS_CODES.TOO_MANY_REQUESTS,
        null,
        `${message} Try again in ${timeLeft} seconds.`
      );
    }

    next();
  };
};

// Specific rate limiters
export const authRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per 15 minutes
  message: 'Too many authentication attempts',
  keyGenerator: (req: Request) =>
    `auth:${req.ip}:${req.body.email || 'unknown'}`,
});

export const otpRateLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  max: 1, // 1 OTP request per minute per email
  message: 'OTP request limit exceeded',
  keyGenerator: (req: Request) => `otp:${req.body.email || req.ip}`,
});

export const generalRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per 15 minutes
  message: 'Too many requests from this IP',
});
