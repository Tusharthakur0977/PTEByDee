import { AuthProviders, OtpType, UserRole } from '@prisma/client';
import bcrypt from 'bcrypt'; // <--- Import bcrypt for comparing hashed OTP
import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import prisma from '../../config/prismaInstance';
import { STATUS_CODES } from '../../utils/constants';
import { sendResponse } from '../../utils/helpers';
import { generateToken } from '../../utils/jwt';

/**
 * @desc    Verify OTP and login/register user
 * @route   POST /api/auth/verify-otp
 * @access  Public
 * @param   {Request} req - Express Request object (expects { email, otp, type, name? } in body)
 * @param   {Response} res - Express Response object
 */

export const verifyOtp = asyncHandler(async (req: Request, res: Response) => {
  const { email, otp, type, name } = req.body;

  // 1. Input Validation
  if (!email || !otp || !type) {
    return sendResponse(
      res,
      STATUS_CODES.BAD_REQUEST,
      null,
      'Please provide email, OTP, and type.'
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

  if (type === 'registration' && !name) {
    return sendResponse(
      res,
      STATUS_CODES.BAD_REQUEST,
      null,
      'Name is required for registration.'
    );
  }

  // 2. OTP validation (format only, actual value checked against hash later)
  if (!/^\d{6}$/.test(otp)) {
    return sendResponse(
      res,
      STATUS_CODES.BAD_REQUEST,
      null,
      'OTP must be a 6-digit number.'
    );
  }

  try {
    // 3. Find valid OTP record based on email, type, and status
    // IMPORTANT: We only fetch by email, type, used, and expiry.
    // We DON'T include `code: otp` in the find query, because `otp` is clear text
    // and `code` in DB is hashed.
    const otpRecord = await prisma.otpCode.findFirst({
      where: {
        email,
        type: type === 'login' ? OtpType.LOGIN : OtpType.REGISTRATION,
        used: false,
        expiresAt: {
          gt: new Date(), // Check if OTP is still active
        },
      },
      orderBy: {
        createdAt: 'desc', // Get the most recent valid OTP
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

    // 4. Compare the provided OTP with the hashed OTP from the database
    // This is the crucial step that was missing.
    const isOtpValid = await bcrypt.compare(otp, otpRecord.code);

    if (!isOtpValid) {
      // Mark OTP as used to prevent brute-force attempts on incorrect OTPs
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

    // 5. If OTP is valid, mark it as used
    await prisma.otpCode.update({
      where: { id: otpRecord.id },
      data: { used: true },
    });

    let user;

    if (type === 'registration') {
      // Check if user already exists *after* OTP verification, to prevent race conditions
      const existingUser = await prisma.user.findUnique({
        where: { email: email.toLowerCase() },
      });

      if (existingUser) {
        // If user already exists, it means another session or concurrent request created it.
        // We can just log them in instead of throwing an error.
        user = existingUser;
        console.warn(
          `Attempted to register existing user ${email} with OTP. Logging in instead.`
        );
        // Optionally, ensure isVerified is true if it wasn't already
        if (!user.isVerified) {
          user = await prisma.user.update({
            where: { id: user.id },
            data: { isVerified: true },
          });
        }
      } else {
        // 5a. Registration flow - Create new user
        user = await prisma.user.create({
          data: {
            name: name!.trim(), // 'name' is guaranteed by validation above
            email: email.toLowerCase(),
            isVerified: true, // Email is verified through OTP
            role: UserRole.USER,
            provider: AuthProviders.EMAIL_OTP,
          },
        });
        console.log(`✅ New user registered via OTP: ${email}`);
      }
    } else {
      // type === 'login'
      // 5b. Login flow - Find existing user
      user = await prisma.user.findUnique({
        where: { email: email.toLowerCase() },
      });

      if (!user) {
        // This case should ideally be handled by send-otp, but as a fallback:
        return sendResponse(
          res,
          STATUS_CODES.NOT_FOUND,
          null,
          'User not found. Please register first.'
        );
      }

      // Update user verification status if not already verified
      if (!user.isVerified) {
        user = await prisma.user.update({
          where: { id: user.id },
          data: { isVerified: true },
        });
      }

      console.log(`✅ User logged in via OTP: ${email}`);
    }

    // 6. Clean up old OTPs for this email (including the one just used and expired ones)
    await prisma.otpCode.deleteMany({
      where: {
        email,
        OR: [
          { used: true }, // Delete the one just used, and any other marked used
          { expiresAt: { lt: new Date() } }, // Delete any truly expired ones
        ],
      },
    });

    // 7. Generate JWT token
    const token = generateToken({ id: user.id, role: user.role });

    // 8. Prepare user response (exclude sensitive data)
    // Destructure to ensure only desired fields are sent
    const {
      id,
      name: userName,
      email: userEmail,
      role,
      isVerified,
      provider,
      profilePictureUrl,
    } = user;

    const userData = {
      id,
      name: userName,
      email: userEmail,
      role,
      isVerified,
      provider,
      profilePictureUrl,
    };

    // 9. Success response
    return sendResponse(
      res,
      STATUS_CODES.OK,
      {
        User: userData, // Renamed from 'User' to 'userData' for clarity or match frontend expectation
        token,
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
