import { Router } from "express";
import authRouter from "../modules/auth/auth.routes";
import chargersRoute from "../modules/chargers/chargers.routes";

const apiRouters = Router();

apiRouters.use("/auth", authRouter);
apiRouters.use("/chargers", chargersRoute);

export default apiRouters;

