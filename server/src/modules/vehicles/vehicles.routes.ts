import { Router } from "express";
import { authenticate } from "../../middleware/auth";
import { validate } from "../../middleware/validate";
import { createVehicleSchema, vehicleIdParamSchema } from "./vehicles.validation";
import {
  createVehicleHandler,
  getVehiclesHandler,
  getVehicleByIdHandler,
} from "./vehicles.controller";

const vehiclesRouter = Router();

// All vehicle endpoints require valid JWT authentication
vehiclesRouter.use(authenticate);

vehiclesRouter.post(
  "/",
  validate({ body: createVehicleSchema }),
  createVehicleHandler
);

vehiclesRouter.get("/", getVehiclesHandler);

vehiclesRouter.get(
  "/:id",
  validate({ params: vehicleIdParamSchema }),
  getVehicleByIdHandler
);

export default vehiclesRouter;
