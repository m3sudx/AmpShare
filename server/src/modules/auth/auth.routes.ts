import { Router } from "express";
import { validate } from "../../middleware/validate";
import { registerSchema } from "./auth.validation";
import { registerHandler } from "./auth.controller";

const authRouter = Router();

authRouter.post("/register", validate({ body: registerSchema }), registerHandler);

export default authRouter;
