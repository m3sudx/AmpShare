import { Router } from "express";
import { authenticate } from "../../middleware/auth";

const vehiclesRouter = Router();

// All vehicle endpoints require valid JWT authentication
vehiclesRouter.use(authenticate);

export default vehiclesRouter;
