import type { RequestHandler } from "express";
import type { ZodError } from "zod";
import { AppError } from "../../utils/app-error.js";
import {
  chargerScheduleParamsSchema,
  createScheduleSchema,
  scheduleIdParamsSchema,
  updateScheduleSchema,
} from "./schedules.validation";
import {
  createSchedule,
  deleteSchedule,
  listSchedulesByCharger,
  updateSchedule,
} from "./schedules.service";

function validationError(error: ZodError): AppError {
  const details = error.issues
    .map((issue) => `${issue.path.join(".") || "body"}: ${issue.message}`)
    .join("; ");
  return new AppError(`Validation failed: ${details}`, 400);
}

// POST /api/chargers/:chargerId/schedules
export const createScheduleHandler: RequestHandler = async (req, res, next) => {
  try {
    const hostId = req.user?.id;
    if (!hostId) return next(new AppError("Authentication required", 401));

    const params = chargerScheduleParamsSchema.safeParse(req.params);
    if (!params.success) return next(validationError(params.error));

    const body = createScheduleSchema.safeParse(req.body);
    if (!body.success) return next(validationError(body.error));

    const schedule = await createSchedule(params.data.chargerId, hostId, body.data);
    if (!schedule) return next(new AppError("Charger not found", 404));

    res.status(201).json({ success: true, data: { schedule } });
  } catch (error) {
    next(error);
  }
};

// GET /api/chargers/:chargerId/schedules
export const listSchedulesHandler: RequestHandler = async (req, res, next) => {
  try {
    const params = chargerScheduleParamsSchema.safeParse(req.params);
    if (!params.success) return next(validationError(params.error));

    const schedules = await listSchedulesByCharger(params.data.chargerId, req.user?.id);
    if (!schedules) return next(new AppError("Charger not found", 404));

    res.status(200).json({
      success: true,
      data: { schedules, count: schedules.length },
    });
  } catch (error) {
    next(error);
  }
};

// PATCH /api/schedules/:id
export const updateScheduleHandler: RequestHandler = async (req, res, next) => {
  try {
    const hostId = req.user?.id;
    if (!hostId) return next(new AppError("Authentication required", 401));

    const params = scheduleIdParamsSchema.safeParse(req.params);
    if (!params.success) return next(validationError(params.error));

    const body = updateScheduleSchema.safeParse(req.body);
    if (!body.success) return next(validationError(body.error));

    const schedule = await updateSchedule(params.data.id, hostId, body.data);
    if (!schedule) return next(new AppError("Schedule not found", 404));

    res.status(200).json({ success: true, data: { schedule } });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/schedules/:id
export const deleteScheduleHandler: RequestHandler = async (req, res, next) => {
  try {
    const hostId = req.user?.id;
    if (!hostId) return next(new AppError("Authentication required", 401));

    const params = scheduleIdParamsSchema.safeParse(req.params);
    if (!params.success) return next(validationError(params.error));

    const deleted = await deleteSchedule(params.data.id, hostId);
    if (!deleted) return next(new AppError("Schedule not found", 404));

    res.status(204).send();
  } catch (error) {
    next(error);
  }
};