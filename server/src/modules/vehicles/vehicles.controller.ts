import type { Request, Response, NextFunction } from "express";
import { AppError } from "../../utils/app-error";
import * as vehicleService from "./vehicles.service";

/**
 * Register a vehicle for the authenticated user
 * POST /api/vehicles
 */
export const createVehicleHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const driverId = req.user?.id;
    if (!driverId) {
      throw new AppError("Authentication required", 401);
    }

    const vehicle = await vehicleService.createVehicle(driverId, req.body);

    res.status(201).json({
      success: true,
      data: { vehicle },
    });
  } catch (error) {
    next(error);
  }
};
