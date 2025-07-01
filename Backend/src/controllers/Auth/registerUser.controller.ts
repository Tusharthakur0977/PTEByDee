// import { AuthProviders, UserRole } from '@prisma/client';
// import bcrypt from 'bcrypt';
// import { Request, Response } from 'express';
// import asyncHandler from 'express-async-handler';
// import { sendResponse } from '../../utils/helpers';
// import { generateToken } from '../../utils/jwt';
// import prisma from '../../config/prismaInstance';
// import { STATUS_CODES } from './../../utils/constants';

// /**
//  * @desc    Register User
//  * @route   POST /api/auth/register
//  * @access  Public
//  * @param   {Request} req - Express Request object (expects { name, email, password } in body)
//  * @param   {Response} res - Express Response object
//  */

// export const registerUser = asyncHandler(
//   async (req: Request, res: Response) => {
//     const { name, email, password } = req.body;

//     // 1. Input Validation (Basic)
//     if (!name || !email || !password) {
//       return sendResponse(
//         res,
//         STATUS_CODES.BAD_REQUEST,
//         null,
//         'Please enter all required fields: name, email, and password.'
//       );
//     }

//     // 2. Check if user with this email already exists
//     const userExists = await prisma.user.findUnique({
//       where: { email },
//     });

//     if (userExists) {
//       if (userExists.provider === AuthProviders.EMAIL_PASSWORD) {
//         // More specific error for existing email/password user trying to re-register
//         return sendResponse(
//           res,
//           STATUS_CODES.CONFLICT, // Suggestion: Use 409 Conflict
//           null,
//           'User with this email already exists. Please log in or use a different email.'
//         );
//       } else {
//         // User exists via social login, prevent direct password registration
//         return sendResponse(
//           res,
//           STATUS_CODES.CONFLICT, // Suggestion: Use 409 Conflict
//           null,
//           `User with this email is already registered via ${userExists.provider}. Please use that method to sign in.`
//         );
//       }
//     }

//     // 3. Hash Password
//     const salt = await bcrypt.genSalt(10);
//     const hashedPassword = await bcrypt.hash(password, salt);

//     // 4. Create the User in the database
//     const user = await prisma.user.create({
//       data: {
//         name,
//         email,
//         password: hashedPassword,
//         isVerified: false,
//         role: UserRole.USER,
//         provider: AuthProviders.EMAIL_PASSWORD, // Explicitly set the provider
//       },
//     });

//     // 5. Respond with User Data and Token
//     if (user) {
//       const { password: _, ...userWithoutPassword } = user; // Destructure to exclude password
//       return sendResponse(
//         res,
//         STATUS_CODES.CREATED, // Suggestion: Use STATUS_CODES.CREATED if available
//         {
//           ...userWithoutPassword,
//           token: generateToken({ id: user.id, role: user.role }),
//         },
//         'User registered successfully.' // Added period for consistency
//       );
//     } else {
//       // This 'else' block for `if (user)` is technically hard to reach with Prisma,
//       // as `prisma.create` would typically throw an error on failure, which `asyncHandler` catches.
//       // However, if it *were* to be hit, it implies a server-side issue.
//       return sendResponse(
//         res,
//         STATUS_CODES.INTERNAL_SERVER_ERROR, // Suggestion: Use 500 for server error
//         null,
//         'User registration failed due to an unexpected server error.'
//       );
//     }
//   }
// );
