import { api } from "./api";
import type { ApiResponse } from "../types/auth";
import type { NotificationsData } from "../types/notification";

export async function listNotifications(limit = 20): Promise<NotificationsData> {
  const res = await api.get<ApiResponse<NotificationsData>>("/notifications", {
    params: { limit },
  });
  return res.data.data;
}

export async function markNotificationRead(id: string): Promise<void> {
  await api.patch(`/notifications/${id}/read`);
}

export async function markAllNotificationsRead(): Promise<void> {
  await api.post("/notifications/read-all");
}