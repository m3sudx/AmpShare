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

/**
 * List only the current user's vehicles
 * GET /api/vehicles
 */
export const getVehiclesHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const driverId = req.user?.id;
    if (!driverId) {
      throw new AppError("Authentication required", 401);
    }

    const data = await vehicleService.getVehiclesByDriver(driverId);

    res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get one owned vehicle
 * GET /api/vehicles/:id
 */
export const getVehicleByIdHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const driverId = req.user?.id;
    if (!driverId) {
      throw new AppError("Authentication required", 401);
    }

    const vehicle = await vehicleService.getVehicleById(driverId, req.params.id);

    res.status(200).json({
      success: true,
      data: { vehicle },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update permitted vehicle fields
 * PATCH /api/vehicles/:id
 */
export const updateVehicleHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const driverId = req.user?.id;
    if (!driverId) {
      throw new AppError("Authentication required", 401);
    }

    const vehicle = await vehicleService.updateVehicle(
      driverId,
      req.params.id,
      req.body
    );

    res.status(200).json({
      success: true,
      data: { vehicle },
    });
  } catch (error) {
    next(error);
  }
};
