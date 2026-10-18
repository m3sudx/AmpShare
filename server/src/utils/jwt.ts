import jwt from "jsonwebtoken";
import { AppError } from "./app-error";

export interface AuthTokenPayload {
  sub: string;
  roles?: string[];
}

export interface DecodedAuthToken extends AuthTokenPayload {
  iat: number;
  exp: number;
}

const getJwtSecret = (): string => {
  const secret = process.env.JWT_SECRET;
  if (!secret && process.env.NODE_ENV === "production") {
    throw new AppError("JWT_SECRET environment variable is missing", 500);
  }
  return secret || "development_fallback_secret_key_123456789";
};

const getJwtExpiresIn = (): string => {
  return process.env.JWT_EXPIRES_IN || "1h";
};

/**
 * Signs a JWT access token with user UUID as sub and optional roles.
 */
export function signAccessToken(payload: AuthTokenPayload): string {
  const secret = getJwtSecret();
  const expiresIn = getJwtExpiresIn();

  return jwt.sign(payload, secret, {
    expiresIn,
  } as jwt.SignOptions);
}

/**
 * Verifies a JWT access token and returns the decoded payload.
 * Throws AppError 401 if invalid or expired.
 */
export function verifyAccessToken(token: string): DecodedAuthToken {
  try {
    const secret = getJwtSecret();
    const decoded = jwt.verify(token, secret) as unknown as DecodedAuthToken;
    return decoded;
  } catch (_error) {
    throw new AppError("Authentication required: invalid or expired token", 401);
  }
}
