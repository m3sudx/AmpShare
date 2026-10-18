import { Router } from "express";
import { authenticate } from "../../middleware/auth";
import { validate } from "../../middleware/validate";
import { createVehicleSchema } from "./vehicles.validation";
import { createVehicleHandler, getVehiclesHandler } from "./vehicles.controller";

const vehiclesRouter = Router();

// All vehicle endpoints require valid JWT authentication
vehiclesRouter.use(authenticate);

vehiclesRouter.post(
  "/",
  validate({ body: createVehicleSchema }),
  createVehicleHandler
);

vehiclesRouter.get("/", getVehiclesHandler);

export default vehiclesRouter;
