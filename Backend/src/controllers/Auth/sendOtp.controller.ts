import { OtpType } from '@prisma/client';
import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import prisma from '../../config/prismaInstance';
import { STATUS_CODES } from '../../utils/constants';
import { generateOTP, sendOTPEmail } from '../../utils/emailService';
import { sendResponse } from '../../utils/helpers';
import bcrypt from 'bcrypt';

/**
 * @desc    Send OTP for login/registration
 * @route   POST /api/auth/send-otp
 * @access  Public
 * @param   {Request} req - Express Request object (expects { email, type } in body)
 * @param   {Response} res - Express Response object
 */

export const sendOtp = asyncHandler(async (req: Request, res: Response) => {
  const { email, type } = req.body;

  // 1. Input Validation
  if (!email || !type) {
    return sendResponse(
      res,
      STATUS_CODES.BAD_REQUEST,
      null,
      'Please provide email and type (login/registration).'
    );
  }

  if (!['login', 'registration'].includes(type)) {
    return sendResponse(
      res,
      STATUS_CODES.BAD_REQUEST,
      null,
      'Type must be either "login" or "registration".'
    );
  }

  // 2. Email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return sendResponse(
      res,
      STATUS_CODES.BAD_REQUEST,
      null,
      'Please provide a valid email address.'
    );
  }

  try {
    // 3. Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (type === 'registration' && existingUser) {
      // User already exists, suggest login instead
      return sendResponse(
        res,
        STATUS_CODES.CONFLICT,
        null,
        'An account with this email already exists. Please use login instead.'
      );
    }

    if (type === 'login' && !existingUser) {
      // User doesn't exist, suggest registration
      return sendResponse(
        res,
        STATUS_CODES.NOT_FOUND,
        null,
        'No account found with this email. Please register first.'
      );
    }

    // 4. Check for existing valid OTP (rate limiting)
    const existingOtp = await prisma.otpCode.findFirst({
      where: {
        email,
        type: type === 'login' ? OtpType.LOGIN : OtpType.REGISTRATION,
        used: false,
        expiresAt: {
          gt: new Date(),
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    if (existingOtp) {
      const timeLeft = Math.ceil(
        (existingOtp.expiresAt.getTime() - Date.now()) / 1000 / 60
      );
      return sendResponse(
        res,
        STATUS_CODES.TOO_MANY_REQUESTS,
        null,
        `An OTP was already sent to this email. Please wait ${timeLeft} minutes before requesting a new one.`
      );
    }

    // 5. Generate new OTP
    const otp = generateOTP();
    const hashedOtp = await bcrypt.hash(otp, 10); // <--- HASH THE OTP HERE
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now

    // 6. Save OTP to database
    await prisma.otpCode.create({
      data: {
        email,
        code: hashedOtp,
        type: type === 'login' ? OtpType.LOGIN : OtpType.REGISTRATION,
        expiresAt,
        userId: existingUser?.id || null,
      },
    });

    // 7. Send OTP email
    const emailSent = await sendOTPEmail(
      email,
      otp,
      type as 'login' | 'registration'
    );

    if (!emailSent) {
      // Clean up the OTP if email failed
      await prisma.otpCode.deleteMany({
        where: {
          email,
          code: otp,
        },
      });

      return sendResponse(
        res,
        STATUS_CODES.INTERNAL_SERVER_ERROR,
        null,
        'Failed to send OTP email. Please try again.'
      );
    }

    // 8. Success response
    return sendResponse(
      res,
      STATUS_CODES.OK,
      {
        email,
        type,
        expiresIn: 600, // 10 minutes in seconds
      },
      `OTP sent successfully to ${email}. Please check your email and enter the 6-digit code.`
    );
  } catch (error: any) {
    console.error('Send OTP error:', error);
    return sendResponse(
      res,
      STATUS_CODES.INTERNAL_SERVER_ERROR,
      null,
      'An error occurred while sending OTP. Please try again.'
    );
  }
});
