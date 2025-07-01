import { AuthProviders, UserRole } from '@prisma/client';
import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import { OAuth2Client } from 'google-auth-library';
import { STATUS_CODES } from '../../utils/constants';
import { sendResponse } from '../../utils/helpers';
import { generateToken } from '../../utils/jwt';
import prisma from '../../config/prismaInstance';

// Ensure GOOGLE_CLIENT_ID is set in your .env file
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

/**
 * @desc    Google Sign In
 * @route   POST /api/auth/google
 * @access  Public
 * @param   {Request} req - Express Request object (expects { idToken } in body)
 * @param   {Response} res - Express Response object
 */

export const googleLogin = asyncHandler(async (req: Request, res: Response) => {
  const { idToken } = req.body; // The ID token sent from the frontend

  if (!idToken) {
    return sendResponse(
      res,
      STATUS_CODES.BAD_REQUEST,
      null,
      'Google ID token is required.'
    );
  }

  if (!process.env.GOOGLE_CLIENT_ID) {
    console.error('GOOGLE_CLIENT_ID is not defined in environment variables.');
    return sendResponse(
      res,
      STATUS_CODES.INTERNAL_SERVER_ERROR,
      null,
      'Server configuration error: Google Client ID missing.'
    );
  }

  try {
    // 1. Verify the ID Token with Google
    const ticket = await googleClient.verifyIdToken({
      idToken: idToken,
      audience: process.env.GOOGLE_CLIENT_ID, // Audience must match your configured Client ID
    });

    const payload = ticket.getPayload(); // Get the decoded payload from the ID token

    if (!payload || !payload.email) {
      return sendResponse(
        res,
        STATUS_CODES.UNAUTHORIZED, // 401 Unauthorized
        null,
        'Invalid Google ID token payload or missing email.'
      );
    }

    // Extract relevant user info from the payload
    const { email, name, sub: googleId, picture } = payload;

    // 2. Check if user exists in your database by email (preferred for linking)
    let user = await prisma.user.findUnique({
      where: { email: email },
    });

    if (user) {
      // User found with this email (potential login or account linking)
      if (user.provider === AuthProviders.EMAIL_OTP) {
        // Case A: Existing EMAIL_PASSWORD user is now signing in with Google.
        // Link the Google account to their existing email/password account.
        user = await prisma.user.update({
          where: { id: user.id },
          data: {
            googleId: googleId,
            profilePictureUrl: picture,
            provider: AuthProviders.GOOGLE, // Update their primary provider to Google
            updatedAt: new Date(),
          },
        });
        console.log(`Account for ${email} successfully linked to Google.`);
      } else if (user.provider === AuthProviders.GOOGLE) {
        // Case B: Existing Google user, just log them in.
        // Update googleId or profile picture if they changed (rare but good for consistency)
        if (user.googleId !== googleId || user.profilePictureUrl !== picture) {
          console.warn(
            `User ${email} found with existing Google provider but inconsistencies. Updating.`
          );
          user = await prisma.user.update({
            where: { id: user.id },
            data: {
              googleId: googleId,
              profilePictureUrl: picture || user.profilePictureUrl, // Update picture if new, otherwise keep existing
              updatedAt: new Date(),
            },
          });
        }
      } else {
        // Case C: User exists but with a different social provider (e.g., Apple if added later).
        // Prevent linking automatically to avoid unintended mergers.
        return sendResponse(
          res,
          STATUS_CODES.CONFLICT, // 409 Conflict
          null,
          `This email is already registered with ${user.provider}. Please use that method to sign in.`
        );
      }
    } else {
      // 3. New user: Create a new account for them
      user = await prisma.user.create({
        data: {
          name: name || email.split('@')[0], // Use name from Google, or derive from email
          email: email,
          googleId: googleId,
          profilePictureUrl: picture,
          isVerified: true, // Google verified emails are considered verified
          role: UserRole.USER,
          provider: AuthProviders.GOOGLE,
          // password will be null for social logins
        },
      });
      console.log(`New user registered via Google: ${email}`);
    }

    // 4. Respond with User Data and Token (after either login or registration)
    const User = user; // Exclude password from response
    return sendResponse(
      res,
      STATUS_CODES.OK, // 200 OK
      {
        User,
        token: generateToken({ id: user.id, role: user.role }),
      },
      'Google login successful.'
    );
  } catch (error: any) {
    console.error('Google login error:', error.message);
    // Generic error for client-side to prevent exposing internal details
    return sendResponse(
      res,
      STATUS_CODES.UNAUTHORIZED, // 401 Unauthorized for authentication failure
      null,
      'Google authentication failed. Please try again.'
    );
  }
});
