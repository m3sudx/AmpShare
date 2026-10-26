import { Router } from "express";
import authRouter from "../modules/auth/auth.routes";
import chargersRoute from "../modules/chargers/chargers.routes";
import vehiclesRouter from "../modules/vehicles/vehicles.routes";
import schedulesRouter from "../modules/schedules/schedules.routes";
import bookingsRoutes from "../modules/bookings/bookings.routes";
import chargingSessionsRoutes from "../modules/charging-sessions/charging-sessions.routes";
import notificationsRoutes from "../modules/notifications/notifications.routes";
import paymentsRoutes from "../modules/payments/payments.routes";
import hostPayoutsRoutes from "../modules/host-payouts/host-payouts.routes";
import reviewsRoutes from "../modules/reviews/reviews.routes";

const apiRouters = Router();

apiRouters.use("/auth", authRouter);
apiRouters.use("/chargers", chargersRoute);
apiRouters.use("/vehicles", vehiclesRouter);
apiRouters.use("/", schedulesRouter);
apiRouters.use("/bookings", bookingsRoutes);
apiRouters.use("/charging-sessions", chargingSessionsRoutes);
apiRouters.use("/notifications", notificationsRoutes);
apiRouters.use("/payments", paymentsRoutes);
apiRouters.use("/host-payouts", hostPayoutsRoutes);
apiRouters.use('/', reviewsRoutes)

export default apiRouters;
