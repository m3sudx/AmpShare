import type { Request, Response, NextFunction } from "express";
import type { ZodType } from "zod";
import { AppError } from "../utils/app-error";

export interface RequestValidationSchema {
  body?: ZodType;
  query?: ZodType;
  params?: ZodType;
}

export const validate = (schema: RequestValidationSchema) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      if (schema.params) {
        const parsedParams = schema.params.safeParse(req.params);
        if (!parsedParams.success) {
          const errors = parsedParams.error.issues.map((issue) => ({
            field: issue.path.join("."),
            message: issue.message,
          }));
          return next(new AppError("Validation failed: invalid path parameters", 400, errors));
        }
        req.params = parsedParams.data as typeof req.params;
      }

      if (schema.query) {
        const parsedQuery = schema.query.safeParse(req.query);
        if (!parsedQuery.success) {
          const errors = parsedQuery.error.issues.map((issue) => ({
            field: issue.path.join("."),
            message: issue.message,
          }));
          return next(new AppError("Validation failed: invalid query parameters", 400, errors));
        }
        req.query = parsedQuery.data as typeof req.query;
      }

      if (schema.body) {
        const parsedBody = schema.body.safeParse(req.body);
        if (!parsedBody.success) {
          const errors = parsedBody.error.issues.map((issue) => ({
            field: issue.path.join("."),
            message: issue.message,
          }));
          return next(new AppError("Validation failed: invalid request body", 400, errors));
        }
        req.body = parsedBody.data;
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};
