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


/**
 * Like authenticate, but anonymous requests are allowed.
 * No Authorization header -> continue without req.user.
 * Header present but invalid -> 401 (a bad token is never treated as anonymous).
 */
export const optionalAuthenticate = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (!req.headers.authorization) {
    return next();
  }
  authenticate(req, res, next);
};

/**
 * Use after authenticate. Allows the request only if the user has at least one
 * of the given roles, e.g. requireRole("HOST").
 */
export const requireRole =
  (...allowedRoles: string[]) =>
  (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new AppError("Authentication required", 401));
    }
    const allowed = req.user.roles.some((role) => allowedRoles.includes(role));
    if (!allowed) {
      return next(new AppError("You do not have permission to perform this action", 403));
    }
    next();
  };
