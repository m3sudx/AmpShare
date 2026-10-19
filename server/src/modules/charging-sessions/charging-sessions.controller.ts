import { asyncHandler } from "../../utils/async-handler";
import { parseOrThrow } from "../../utils/validate";
import * as service from "./charging-sessions.service";
import {
  finishSessionSchema,
  sessionIdParamSchema,
  startSessionSchema,
} from "./charging-sessions.validation";

export const start = asyncHandler(async (req, res) => {
  const { bookingId } = parseOrThrow(startSessionSchema, req.body);
  const data = await service.startSession(req.user!.id, bookingId);
  res.status(201).json({ success: true, data });
});

export const list = asyncHandler(async (req, res) => {
  const sessions = await service.listSessions(req.user!.id);
  res
    .status(200)
    .json({ success: true, data: { sessions, count: sessions.length } });
});

export const getOne = asyncHandler(async (req, res) => {
  const { id } = parseOrThrow(sessionIdParamSchema, req.params);
  const data = await service.getSession(req.user!.id, id);
  res.status(200).json({ success: true, data });
});

export const finish = asyncHandler(async (req, res) => {
  const { id } = parseOrThrow(sessionIdParamSchema, req.params);
  const { energyDeliveredKwh } = parseOrThrow(finishSessionSchema, req.body);
  const data = await service.finishSession(
    req.user!.id,
    id,
    energyDeliveredKwh,
  );
  res.status(200).json({ success: true, data });
});
