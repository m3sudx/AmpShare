import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { AppError } from "../utils/app-error";

export interface AuthedRequest extends Request {
  user?: { id: string };
}

export function authenticate(
  req: AuthedRequest,
  _res: Response,
  next: NextFunction,
) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    return next(new AppError("Authentication required", 401));
  }
  const secret = process.env.JWT_SECRET;
  if (!secret) return next(new AppError("Server auth is not configured", 500));

  try {
    const payload = jwt.verify(header.slice(7), secret) as jwt.JwtPayload;
    const id = payload.sub ?? payload.id ?? payload.userId;
    if (typeof id !== "string") return next(new AppError("Invalid token", 401));
    req.user = { id };
    next();
  } catch {
    next(new AppError("Invalid or expired token", 401));
  }
}
