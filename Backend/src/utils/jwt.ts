import jwt from 'jsonwebtoken';
import type { StringValue } from 'ms';

interface TokenPayload {
  id: string;
  role: string;
  [key: string]: any;
}

/**
 * Generates a JSON Web Token (JWT) for access.
 */
export const generateToken = (payload: TokenPayload): string => {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET is not defined in environment variables.');
  }

  const expiresIn: StringValue =
    (process.env.JWT_EXPIRES_IN as StringValue | undefined) || '15m'; // Shorter expiry for access tokens

  return jwt.sign(payload, process.env.JWT_SECRET as string, {
    expiresIn: expiresIn,
  });
};

/**
 * Generates a refresh token with longer expiry.
 */
export const generateRefreshToken = (payload: TokenPayload): string => {
  if (!process.env.JWT_REFRESH_SECRET) {
    throw new Error(
      'JWT_REFRESH_SECRET is not defined in environment variables.'
    );
  }

  const expiresIn: StringValue =
    (process.env.JWT_REFRESH_EXPIRES_IN as StringValue | undefined) || '7d';

  return jwt.sign(payload, process.env.JWT_REFRESH_SECRET as string, {
    expiresIn: expiresIn,
  });
};

/**
 * Verifies and decodes a JWT token.
 */
export const verifyToken = (
  token: string,
  isRefreshToken = false
): TokenPayload => {
  const secret = isRefreshToken
    ? process.env.JWT_REFRESH_SECRET
    : process.env.JWT_SECRET;

  if (!secret) {
    throw new Error(
      `${isRefreshToken ? 'JWT_REFRESH_SECRET' : 'JWT_SECRET'} is not defined.`
    );
  }

  return jwt.verify(token, secret) as TokenPayload;
};
