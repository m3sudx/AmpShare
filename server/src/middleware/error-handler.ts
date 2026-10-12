import type { ErrorRequestHandler } from "express";
import { AppError } from "../utils/app-error";

const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  let statusCode = 500;
  let message = "Internal server error";

  if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;
  }

  console.error(err);

  const response: {
    success: boolean;
    message: string;
    stack?: string;
  } = {
    success: false,
    message,
  };



  res.status(statusCode).json(response);
};

export default errorHandler;
