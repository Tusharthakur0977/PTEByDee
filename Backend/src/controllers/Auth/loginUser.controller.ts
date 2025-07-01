// import { AuthProviders } from '@prisma/client';
// import bcrypt from 'bcrypt';
// import { Request, Response } from 'express';
// import asyncHandler from 'express-async-handler';
// import { STATUS_CODES } from '../../utils/constants';
// import { sendResponse } from '../../utils/helpers';
// import { generateToken } from '../../utils/jwt';
// import prisma from '../../config/prismaInstance';

// /**
//  * @desc    Login User
//  * @route   POST /api/auth/login
//  * @access  Public
//  * @param   {Request} req - Express Request object (expects { email, password } in body)
//  * @param   {Response} res - Express Response object
//  */

// export const loginUser = asyncHandler(async (req: Request, res: Response) => {
//   const { email, password } = req.body;

//   // 1. Input Validation
//   if (!email || !password) {
//     return sendResponse(
//       res,
//       STATUS_CODES.BAD_REQUEST,
//       null,
//       'Please provide both email and password.'
//     );
//   }

//   // 2. Find user by email
//   const user = await prisma.user.findUnique({ where: { email } });

//   // If no user found with the given email
//   if (!user) {
//     return sendResponse(
//       res,
//       STATUS_CODES.UNAUTHORIZED, // 401 Unauthorized
//       null,
//       'Invalid email or password.' // Generic message for security
//     );
//   }

//   // 3. Check authentication provider
//   if (user.provider === AuthProviders.EMAIL_PASSWORD) {
//     // This is an email/password user, compare passwords
//     // user.password will be non-null for EMAIL_PASSWORD provider based on your schema and registerUser logic
//     if (user.password && (await bcrypt.compare(password, user.password))) {
//       const { password: _, ...userWithoutPassword } = user; // Exclude password
//       return sendResponse(
//         res,
//         STATUS_CODES.OK, // 200 OK
//         {
//           ...userWithoutPassword,
//           token: generateToken({ id: user.id, role: user.role }),
//         },
//         'Login successful.'
//       );
//     } else {
//       // Passwords don't match
//       return sendResponse(
//         res,
//         STATUS_CODES.UNAUTHORIZED, // 401 Unauthorized
//         null,
//         'Invalid email or password.' // Generic message for security
//       );
//     }
//   } else if (user.provider === AuthProviders.GOOGLE) {
//     // User exists but is registered via Google, advise them to use Google Sign-In
//     return sendResponse(
//       res,
//       STATUS_CODES.UNAUTHORIZED, // 401 Unauthorized
//       null,
//       'This account is registered via Google. Please sign in with Google.'
//     );
//   } else {
//     // Fallback for an unknown provider (should not be hit if AuthProviders enum is comprehensive)
//     return sendResponse(
//       res,
//       STATUS_CODES.INTERNAL_SERVER_ERROR, // 500 Internal Server Error
//       null,
//       'Authentication method not recognized. Please use the correct sign-in method.'
//     );
//   }
// });
