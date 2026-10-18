import { Router } from "express";
import chargersRoute from "../modules/chargers/chargers.routes"

const apiRouters= Router();

apiRouters.use('/chargers',chargersRoute)

export default apiRouters;

