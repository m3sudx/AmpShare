import { Router } from "express";
import authRouter from "../modules/auth/auth.routes";
import chargersRoute from "../modules/chargers/chargers.routes";
import vehiclesRouter from "../modules/vehicles/vehicles.routes";
import schedulesRouter from "../modules/schedules/schedules.routes";
import bookingsRoutes from "../modules/bookings/bookings.routes";
import chargingSessionsRoutes from "../modules/charging-sessions/charging-sessions.routes";

const apiRouters = Router();

apiRouters.use("/auth", authRouter);
apiRouters.use("/chargers", chargersRoute);
apiRouters.use("/vehicles", vehiclesRouter);
apiRouters.use("/", schedulesRouter);
apiRouters.use("/bookings", bookingsRoutes);
apiRouters.use("/charging-sessions", chargingSessionsRoutes);

export default apiRouters;
