import type { RequestHandler } from "express";

import {
  createCharger,
  deleteCharger,
  findNearbyChargers,
  getChargerById,
  listChargers,
  listChargersByHost,
  updateCharger,
} from "./chargers.service";
import {
  chargerIdParamsSchema,
  createChargerSchema,
  listChargersQuerySchema,
  nearbyChargersQuerySchema,
  updateChargerSchema,
} from "./chargers.validation";
import { AppError } from "../../utils/app-error.js";

// ---------- GET /api/chargers/nearby ----------

export const getNearbyChargers: RequestHandler = async (req, res, next) => {
  const parsedQuery = nearbyChargersQuerySchema.safeParse(req.query);

  if (!parsedQuery.success) {
    return next(new AppError("Invalid nearby charger search parameters", 400));
  }

  try {
    const chargers = await findNearbyChargers(parsedQuery.data);
    res.status(200).json({
      success: true,
      data: {
        chargers,
        count: chargers.length,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ---------- POST /api/chargers ----------

export const createChargerHandler: RequestHandler = async (req, res, next) => {
  const hostId = req.user?.id;

  if (!hostId) {
    return next(new AppError("Authentication required", 401));
  }

  const parsedBody = createChargerSchema.safeParse(req.body);

  if (!parsedBody.success) {
    const details = parsedBody.error.issues
      .map((issue) => `${issue.path.join(".") || "body"}: ${issue.message}`)
      .join("; ");

    return next(new AppError(`Invalid charger data - ${details}`, 400));
  }

  try {
    const charger = await createCharger(hostId, parsedBody.data);

    res.status(201).json({
      success: true,
      data: { charger },
    });
  } catch (error) {
    next(error);
  }
};

// ---------- GET /api/chargers ----------

export const listChargersHandler: RequestHandler = async (req, res, next) => {
  const parsedQuery = listChargersQuerySchema.safeParse(req.query);

  if (!parsedQuery.success) {
    const details = parsedQuery.error.issues
      .map((issue) => `${issue.path.join(".") || "query"}: ${issue.message}`)
      .join("; ");

    return next(
      new AppError(`Invalid charger list parameters - ${details}`, 400),
    );
  }

  try {
    const { page, limit } = parsedQuery.data;
    const { chargers, total } = await listChargers(parsedQuery.data);

    res.status(200).json({
      success: true,
      data: {
        chargers,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// ---------- GET /api/chargers/:id ----------

export const getChargerByIdHandler: RequestHandler = async (req, res, next) => {
  const parsedParams = chargerIdParamsSchema.safeParse(req.params);

  if (!parsedParams.success) {
    return next(new AppError("Invalid charger id", 400));
  }

  try {
    // Optional auth: viewerId is undefined when nobody is logged in.
    const viewerId = req.user?.id;

    const charger = await getChargerById(parsedParams.data.id, viewerId);

    if (!charger) {
      return next(new AppError("Charger not found", 404));
    }

    res.status(200).json({
      success: true,
      data: { charger },
    });
  } catch (error) {
    next(error);
  }
};


// ---------- GET /api/chargers/mine ----------

export const listMyChargersHandler: RequestHandler = async (
  req,
  res,
  next
) => {
  const hostId = req.user?.id;

  if (!hostId) {
    return next(new AppError("Authentication required", 401));
  }

  try {
    const chargers = await listChargersByHost(hostId);

    res.status(200).json({
      success: true,
      data: {
        chargers,
        count: chargers.length,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ---------- PATCH /api/chargers/:id ----------

export const updateChargerHandler: RequestHandler = async (
  req,
  res,
  next
) => {
  const hostId = req.user?.id;

  if (!hostId) {
    return next(new AppError("Authentication required", 401));
  }

  const parsedParams = chargerIdParamsSchema.safeParse(req.params);

  if (!parsedParams.success) {
    return next(new AppError("Invalid charger id", 400));
  }

  const parsedBody = updateChargerSchema.safeParse(req.body);

  if (!parsedBody.success) {
    const details = parsedBody.error.issues
      .map((issue) => `${issue.path.join(".") || "body"}: ${issue.message}`)
      .join("; ");

    return next(new AppError(`Invalid charger data - ${details}`, 400));
  }

  try {
    const charger = await updateCharger(
      parsedParams.data.id,
      hostId,
      parsedBody.data
    );

    if (!charger) {
      return next(new AppError("Charger not found", 404));
    }

    res.status(200).json({
      success: true,
      data: { charger },
    });
  } catch (error) {
    next(error);
  }
};


// ---------- DELETE /api/chargers/:id ----------

export const deleteChargerHandler: RequestHandler = async (
  req,
  res,
  next
) => {
  const hostId = req.user?.id;

  if (!hostId) {
    return next(new AppError("Authentication required", 401));
  }

  const parsedParams = chargerIdParamsSchema.safeParse(req.params);

  if (!parsedParams.success) {
    return next(new AppError("Invalid charger id", 400));
  }

  try {
    const result = await deleteCharger(parsedParams.data.id, hostId);

    if (result === "not_found") {
      return next(new AppError("Charger not found", 404));
    }

    if (result === "has_bookings") {
      return next(
        new AppError(
          "This charger has bookings and cannot be deleted. Deactivate it instead.",
          409
        )
      );
    }

    res.status(204).send();
  } catch (error) {
    next(error);
  }
};