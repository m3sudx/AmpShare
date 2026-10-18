import type { ErrorRequestHandler } from "express";
import { AppError } from "../utils/app-error";

const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  let statusCode = 500;
  let message = "Internal server error";
  let details: unknown = undefined;

  if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;
    details = err.details;
  } else if ((err as { code?: string })?.code === "23505") {
    // PostgreSQL unique constraint violation
    statusCode = 409;
    const detail = (err as { detail?: string })?.detail ?? "";
    if (detail.includes("phone_number")) {
      message = "Phone number is already registered";
    } else {
      message = "Resource already exists";
    }
  } else if ((err as { code?: string })?.code === "23503") {
    // PostgreSQL foreign key violation (ON DELETE RESTRICT)
    statusCode = 409;
    message = "Resource cannot be modified or deleted because it is referenced by another entity";
  }

  if (statusCode === 500) {
    console.error("Unhandled server error:", err);
  }

  const response: {
    success: boolean;
    message: string;
    details?: unknown;
  } = {
    success: false,
    message,
    ...(details !== undefined ? { details } : {}),
  };

  res.status(statusCode).json(response);
};

export default errorHandler;
