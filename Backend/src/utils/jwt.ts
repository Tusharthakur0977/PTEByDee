// src/utils/jwt.ts
import jwt from 'jsonwebtoken';
import type { StringValue } from 'ms'; // Import StringValue type from 'ms'

// Define a type for the payload to make it more specific
interface TokenPayload {
  id: string;
  role: string;
  [key: string]: any;
}

/**
 * Generates a JSON Web Token (JWT).
 *
 * @param payload The data to be encoded in the token.
 * @returns A signed JWT string.
 * @throws Error if JWT_SECRET is not defined in environment variables.
 */
export const generateToken = (payload: TokenPayload): string => {
  // Ensure JWT_SECRET is defined
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET is not defined in environment variables.');
  }

  const expiresIn: StringValue =
    (process.env.JWT_EXPIRES_IN as StringValue | undefined) || '7d';

  return jwt.sign(payload, process.env.JWT_SECRET as string, {
    expiresIn: expiresIn,
  });
};
