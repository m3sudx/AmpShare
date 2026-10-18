import { Router } from "express";
import { authenticate } from "../../middleware/auth";
import { validate } from "../../middleware/validate";
import { createVehicleSchema } from "./vehicles.validation";
import { createVehicleHandler } from "./vehicles.controller";

const vehiclesRouter = Router();

// All vehicle endpoints require valid JWT authentication
vehiclesRouter.use(authenticate);

vehiclesRouter.post(
  "/",
  validate({ body: createVehicleSchema }),
  createVehicleHandler
);

export default vehiclesRouter;
