import { asyncHandler } from "../../utils/async-handler";
import { parseOrThrow } from "../../utils/validate";
import * as service from "./notifications.service";
import {
  listNotificationsQuerySchema,
  notificationIdParamSchema,
} from "./notifications.validation";

export const list = asyncHandler(async (req, res) => {
  const { unread, limit } = parseOrThrow(
    listNotificationsQuerySchema,
    req.query,
  );
  const data = await service.listNotifications(req.user!.id, {
    unreadOnly: unread === "true",
    limit,
  });
  res.status(200).json({ success: true, data });
});

export const read = asyncHandler(async (req, res) => {
  const { id } = parseOrThrow(notificationIdParamSchema, req.params);
  const notification = await service.markRead(req.user!.id, id);
  res.status(200).json({ success: true, data: { notification } });
});

export const readAll = asyncHandler(async (req, res) => {
  await service.markAllRead(req.user!.id);
  res.status(200).json({ success: true, data: {} });
});