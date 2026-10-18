import { Router } from "express";
import { authenticate } from "../../middleware/auth";
import { validate } from "../../middleware/validate";
import {
  createVehicleSchema,
  updateVehicleSchema,
  vehicleIdParamSchema,
} from "./vehicles.validation";
import {
  createVehicleHandler,
  getVehiclesHandler,
  getVehicleByIdHandler,
  updateVehicleHandler,
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

vehiclesRouter.patch(
  "/:id",
  validate({
    params: vehicleIdParamSchema,
    body: updateVehicleSchema,
  }),
  updateVehicleHandler
);

export default vehiclesRouter;
