import type { Request, Response, NextFunction } from "express";
import { AppError } from "../utils/app-error";
import { verifyAccessToken } from "../utils/jwt";

export interface AuthenticatedUser {
  id: string;
  roles: string[];
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

/**
 * Middleware that authenticates incoming requests using Bearer JWT tokens.
 * Verifies signature, expiry, and attaches the authenticated user payload to req.user.
 * Never logs raw authorization tokens.
 */
export const authenticate = (
  req: Request,
  _res: Response,
  next: NextFunction
): void => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new AppError("Authentication required: missing or invalid token", 401);
    }

    const token = authHeader.substring(7).trim();

    if (!token) {
      throw new AppError("Authentication required: missing or invalid token", 401);
    }

    const decoded = verifyAccessToken(token);

    req.user = {
      id: decoded.sub,
      roles: decoded.roles || [],
    };

    next();
  } catch (error) {
    next(error);
  }
};
