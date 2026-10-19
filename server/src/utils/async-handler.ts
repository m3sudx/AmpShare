import type { RequestHandler, Response } from "express";
import type { AuthedRequest } from "../middleware/authenticate";

export const asyncHandler =
  (fn: (req: AuthedRequest, res: Response) => Promise<void>): RequestHandler =>
  (req, res, next) => {
    fn(req as AuthedRequest, res).catch(next);
  };
