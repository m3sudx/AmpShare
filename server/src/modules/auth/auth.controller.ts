import type { Request, Response, NextFunction } from "express";
import * as authService from "./auth.service";

/**
 * Handles user registration
 * POST /api/auth/register
 */
export const registerHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const result = await authService.registerUser(req.body);

    res.status(201).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};
