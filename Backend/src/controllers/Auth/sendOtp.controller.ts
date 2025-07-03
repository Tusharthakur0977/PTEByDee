import { OtpType } from '@prisma/client';
import bcrypt from 'bcrypt';
import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import prisma from '../../config/prismaInstance';
import { STATUS_CODES } from '../../utils/constants';
import { generateOTP, sendOTPEmail } from '../../utils/emailService';
import { sendResponse } from '../../utils/helpers';

/**
 * @desc    Send OTP for login/registration/password reset
 * @route   POST /api/auth/send-otp
 * @access  Public
 */
export const sendOtp = asyncHandler(async (req: Request, res: Response) => {
  const { email, type } = req.body;

  try {
    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (type === 'registration' && existingUser) {
      return sendResponse(
        res,
        STATUS_CODES.CONFLICT,
        null,
        'An account with this email already exists. Please use login instead.'
      );
    }

    if (type === 'login' && !existingUser) {
      return sendResponse(
        res,
        STATUS_CODES.NOT_FOUND,
        null,
        'No account found with this email. Please register first.'
      );
    }

    if (type === 'password_reset' && !existingUser) {
      return sendResponse(
        res,
        STATUS_CODES.NOT_FOUND,
        null,
        'No account found with this email address.'
      );
    }

    // Check for existing valid OTP (rate limiting)
    const otpType =
      type === 'login'
        ? OtpType.LOGIN
        : type === 'registration'
        ? OtpType.REGISTRATION
        : OtpType.PASSWORD_RESET;

    const existingOtp = await prisma.otpCode.findFirst({
      where: {
        email,
        type: otpType,
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

    // Generate new OTP
    const otp = generateOTP();
    const hashedOtp = await bcrypt.hash(otp, 10);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Save OTP to database
    await prisma.otpCode.create({
      data: {
        email,
        code: hashedOtp,
        type: otpType,
        expiresAt,
        userId: existingUser?.id || null,
      },
    });

    // Send OTP email
    const emailSent = await sendOTPEmail(
      email,
      otp,
      type as 'login' | 'registration' | 'password_reset'
    );

    if (!emailSent) {
      // Clean up the OTP if email failed
      await prisma.otpCode.deleteMany({
        where: {
          email,
          code: hashedOtp,
        },
      });

      return sendResponse(
        res,
        STATUS_CODES.INTERNAL_SERVER_ERROR,
        null,
        'Failed to send OTP email. Please try again.'
      );
    }

    // Success response
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
