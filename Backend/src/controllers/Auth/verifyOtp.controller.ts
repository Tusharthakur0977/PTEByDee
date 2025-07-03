import { AuthProviders, OtpType, UserRole } from '@prisma/client';
import bcrypt from 'bcrypt';
import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import prisma from '../../config/prismaInstance';
import { STATUS_CODES } from '../../utils/constants';
import { sendWelcomeEmail } from '../../utils/emailService';
import { sendResponse } from '../../utils/helpers';
import { generateRefreshToken, generateToken } from '../../utils/jwt';

/**
 * @desc    Verify OTP and login/register user
 * @route   POST /api/auth/verify-otp
 * @access  Public
 */
export const verifyOtp = asyncHandler(async (req: Request, res: Response) => {
  const { email, otp, type, name } = req.body;

  try {
    // Find valid OTP record
    const otpRecord = await prisma.otpCode.findFirst({
      where: {
        email,
        type:
          type === 'login'
            ? OtpType.LOGIN
            : type === 'registration'
            ? OtpType.REGISTRATION
            : OtpType.PASSWORD_RESET,
        used: false,
        expiresAt: {
          gt: new Date(),
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    if (!otpRecord) {
      return sendResponse(
        res,
        STATUS_CODES.UNAUTHORIZED,
        null,
        'Invalid or expired OTP. Please request a new one.'
      );
    }

    // Verify OTP
    const isOtpValid = await bcrypt.compare(otp, otpRecord.code);

    if (!isOtpValid) {
      // Mark OTP as used to prevent brute-force attempts
      await prisma.otpCode.update({
        where: { id: otpRecord.id },
        data: { used: true },
      });
      return sendResponse(
        res,
        STATUS_CODES.UNAUTHORIZED,
        null,
        'Incorrect OTP. Please try again or request a new one.'
      );
    }

    // Mark OTP as used
    await prisma.otpCode.update({
      where: { id: otpRecord.id },
      data: { used: true },
    });

    let user;
    let isNewUser = false;

    if (type === 'registration') {
      // Check if user already exists
      const existingUser = await prisma.user.findUnique({
        where: { email },
      });

      if (existingUser) {
        user = existingUser;
        if (!user.isVerified) {
          user = await prisma.user.update({
            where: { id: user.id },
            data: { isVerified: true },
          });
        }
      } else {
        // Create new user
        user = await prisma.user.create({
          data: {
            name: name!.trim(),
            email,
            isVerified: true,
            role: UserRole.USER,
            provider: AuthProviders.EMAIL_OTP,
          },
        });
        isNewUser = true;
        console.log(`✅ New user registered via OTP: ${email}`);
      }
    } else {
      // Login flow
      user = await prisma.user.findUnique({
        where: { email },
      });

      if (!user) {
        return sendResponse(
          res,
          STATUS_CODES.NOT_FOUND,
          null,
          'User not found. Please register first.'
        );
      }

      // Update verification status if needed
      if (!user.isVerified) {
        user = await prisma.user.update({
          where: { id: user.id },
          data: { isVerified: true },
        });
      }

      console.log(`✅ User logged in via OTP: ${email}`);
    }

    // Clean up old OTPs
    await prisma.otpCode.deleteMany({
      where: {
        email,
        OR: [{ used: true }, { expiresAt: { lt: new Date() } }],
      },
    });

    // Generate tokens
    const accessToken = generateToken({ id: user.id, role: user.role });
    const refreshToken = generateRefreshToken({ id: user.id, role: user.role });

    // Prepare user response
    const {
      id,
      name: userName,
      email: userEmail,
      role,
      isVerified,
      provider,
      profilePictureUrl,
      createdAt,
      updatedAt,
    } = user;

    const userData = {
      id,
      name: userName,
      email: userEmail,
      role,
      isVerified,
      provider,
      profilePictureUrl,
      createdAt,
      updatedAt,
    };

    // Send welcome email for new users (async, don't wait)
    if (isNewUser) {
      sendWelcomeEmail(email, userName).catch((error) =>
        console.error('Failed to send welcome email:', error)
      );
    }

    return sendResponse(
      res,
      STATUS_CODES.OK,
      {
        User: userData,
        token: accessToken,
        refreshToken,
      },
      type === 'registration'
        ? 'Account created successfully! Welcome to PTEbyDee.'
        : 'Login successful! Welcome back.'
    );
  } catch (error: any) {
    console.error('Verify OTP error:', error);
    return sendResponse(
      res,
      STATUS_CODES.INTERNAL_SERVER_ERROR,
      null,
      'An error occurred during verification. Please try again.'
    );
  }
});
