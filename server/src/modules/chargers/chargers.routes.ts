import { Router } from "express";
import { authenticate, optionalAuthenticate, requireRole } from "../../middleware/auth";
import {
  getNearbyChargers,
  createChargerHandler,
  listChargersHandler,
  getChargerByIdHandler,
  listMyChargersHandler,
  updateChargerHandler,
  deleteChargerHandler,
} from "./chargers.controller";

const chargersRoute = Router();

chargersRoute.get("/nearby", getNearbyChargers);
chargersRoute.get("/mine", authenticate, requireRole("HOST"), listMyChargersHandler);
chargersRoute.get("/", listChargersHandler);
chargersRoute.post("/", authenticate, requireRole("HOST"), createChargerHandler);
chargersRoute.get("/:id", optionalAuthenticate, getChargerByIdHandler);
chargersRoute.patch("/:id", authenticate, requireRole("HOST"), updateChargerHandler);
chargersRoute.delete("/:id", authenticate, requireRole("HOST"), deleteChargerHandler);

export default chargersRoute;