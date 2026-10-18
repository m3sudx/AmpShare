import { Router } from "express";
import authRouter from "../modules/auth/auth.routes";

const aipRouters = Router();

aipRouters.use("/auth", authRouter);

export default aipRouters;