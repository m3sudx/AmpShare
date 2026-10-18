import { Router } from "express";
import { authenticate } from "../../middleware/auth";
import { validate } from "../../middleware/validate";
import { registerSchema, loginSchema } from "./auth.validation";
import { registerHandler, loginHandler, getMeHandler } from "./auth.controller";

const authRouter = Router();

authRouter.post("/register", validate({ body: registerSchema }), registerHandler);
authRouter.post("/login", validate({ body: loginSchema }), loginHandler);
authRouter.get("/me", authenticate, getMeHandler);

export default authRouter;
