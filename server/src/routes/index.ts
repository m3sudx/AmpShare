import { Router } from "express";
import chargersRoute from "../modules/chargers/chargers.routes"
import schedulesRouter from "../modules/schedules/schedules.routes"

const apiRouters= Router();

apiRouters.use('/chargers',chargersRoute)
apiRouters.use('/',schedulesRouter)

export default apiRouters;

