import { Router } from "express";
import authRouter from "../modules/auth/auth.routes";
import chargersRoute from "../modules/chargers/chargers.routes";
import schedulesRouter from '../modules/schedules/schedules.routes'

const apiRouters = Router();

apiRouters.use("/auth", authRouter);
apiRouters.use("/chargers", chargersRoute);
apiRouters.use('/',schedulesRouter)

export default apiRouters;

