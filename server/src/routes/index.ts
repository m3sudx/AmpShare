import { Router } from "express";
import authRouter from "../modules/auth/auth.routes";
import chargersRoute from "../modules/chargers/chargers.routes";
import vehiclesRouter from "../modules/vehicles/vehicles.routes";

const apiRouters = Router();

apiRouters.use("/auth", authRouter);
apiRouters.use("/chargers", chargersRoute);
apiRouters.use("/vehicles", vehiclesRouter);

export default apiRouters;

