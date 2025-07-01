// import { Request, Response } from 'express';
// import asyncHandler from 'express-async-handler';
// import bcrypt from 'bcrypt';
// import prisma from '../../config/prismaInstance';
// import { sendResponse } from '../../utils/helpers';
// import { STATUS_CODES } from '../../utils/constants';
// import { generateToken } from '../../utils/jwt';
// import { AuthProviders } from '@prisma/client';
// import { CustomRequest } from 'src/types';

// /**
//  * @desc    Change authenticated user's password
//  * @route   PUT /api/user/change-password
//  * @access  Private (requires 'protect' middleware)
//  * @param   {Request} req - Express Request object (expects { currentPassword, newPassword } in body)
//  * @param   {Response} res - Express Response object
//  */
// export const changePassword = asyncHandler(
//   async (req: CustomRequest, res: Response) => {
//     // 1. Ensure user is authenticated
//     if (!req.user || !req.user.id) {
//       return sendResponse(
//         res,
//         STATUS_CODES.UNAUTHORIZED,
//         null,
//         'Not authorized, no user ID in token.'
//       );
//     }

//     const { currentPassword, newPassword } = req.body;

//     // 2. Input Validation
//     if (!currentPassword || !newPassword) {
//       return sendResponse(
//         res,
//         STATUS_CODES.BAD_REQUEST,
//         null,
//         'Please provide both current password and new password.'
//       );
//     }

//     // You might add additional validation for new password strength (length, complexity) here
//     if (newPassword.length < 6) {
//       // Example: minimum 6 characters
//       return sendResponse(
//         res,
//         STATUS_CODES.BAD_REQUEST,
//         null,
//         'New password must be at least 6 characters long.'
//       );
//     }

//     if (currentPassword === newPassword) {
//       return sendResponse(
//         res,
//         STATUS_CODES.BAD_REQUEST,
//         null,
//         'New password cannot be the same as the current password.'
//       );
//     }

//     // 3. Fetch the current user data from the database
//     // We need the password hash from the DB, so we must select it explicitly.
//     const user = await prisma.user.findUnique({
//       where: { id: req.user.id },
//       select: {
//         id: true,
//         email: true,
//         password: true, // IMPORTANT: Select the password hash for comparison
//         provider: true,
//         role: true,
//         name: true, // Include other necessary fields for the response or token generation
//         isVerified: true,
//         profilePictureUrl: true,
//         googleId: true,
//         createdAt: true,
//         updatedAt: true,
//       },
//     });

//     // 4. Check if user exists (should always be true if protect middleware passed)
//     if (!user) {
//       return sendResponse(res, STATUS_CODES.NOT_FOUND, null, 'User not found.');
//     }

//     // 5. Check if the user is an EMAIL_PASSWORD provider
//     if (user.provider !== AuthProviders.EMAIL_PASSWORD) {
//       return sendResponse(
//         res,
//         STATUS_CODES.BAD_REQUEST,
//         null,
//         `This account is registered via ${user.provider} and does not have a password set. Please use ${user.provider} to sign in.`
//       );
//     }

//     // 6. Verify current password
//     // Ensure user.password is not null before comparing (it should be for EMAIL_PASSWORD provider)
//     if (
//       !user.password ||
//       !(await bcrypt.compare(currentPassword, user.password))
//     ) {
//       return sendResponse(
//         res,
//         STATUS_CODES.UNAUTHORIZED, // 401 Unauthorized
//         null,
//         'Invalid current password.'
//       );
//     }

//     // 7. Hash the new password
//     const salt = await bcrypt.genSalt(10);
//     const hashedNewPassword = await bcrypt.hash(newPassword, salt);

//     // 8. Update the user's password in the database
//     const updatedUser = await prisma.user.update({
//       where: { id: user.id },
//       data: {
//         password: hashedNewPassword,
//         updatedAt: new Date(),
//       },
//       select: {
//         // Select non-sensitive fields for the response
//         id: true,
//         name: true,
//         email: true,
//         isVerified: true,
//         role: true,
//         provider: true,
//         profilePictureUrl: true,
//         googleId: true,
//         createdAt: true,
//         updatedAt: true,
//       },
//     });

//     // 9. Generate a new token
//     // It's good practice to issue a new token after a password change for security
//     // (old tokens will eventually expire naturally).
//     const token = generateToken({ id: updatedUser.id, role: updatedUser.role });

//     // 10. Respond with success
//     return sendResponse(
//       res,
//       STATUS_CODES.OK,
//       {
//         ...updatedUser,
//         token, // Include the new token
//       },
//       'Password changed successfully.'
//     );
//   }
// );
