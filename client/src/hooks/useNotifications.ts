import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { useAuth } from "../context/useAuth";
import {
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from "../services/notifications.api";
import { socket } from "../services/socket";
import type { AppNotification, NotificationsData } from "../types/notification";

export const NOTIFICATIONS_KEY = ["notifications"] as const;

export function useNotificationsQuery() {
  const { isAuthenticated } = useAuth();
  return useQuery({
    queryKey: NOTIFICATIONS_KEY,
    queryFn: () => listNotifications(),
    enabled: isAuthenticated,
  });
}

// Connects the socket while signed in and pushes new notifications into the cache
export function useRealtimeNotifications() {
  const { accessToken } = useAuth();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!accessToken) return;

    socket.auth = { token: accessToken };
    socket.connect();
    const onNotification = (n: AppNotification) => {
      const cached = queryClient.getQueryData<NotificationsData>(NOTIFICATIONS_KEY);
      if (cached) {
        queryClient.setQueryData<NotificationsData>(NOTIFICATIONS_KEY, {
          notifications: [n, ...cached.notifications.filter((x) => x.id !== n.id)].slice(0, 20),
          unreadCount: cached.unreadCount + 1,
        });
      } else {
        queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_KEY });
      }
      // Refresh booking lists and details so statuses update live
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
    };

    socket.on("notification", onNotification);
    return () => {
      socket.off("notification", onNotification);
      socket.disconnect();
    };
  }, [accessToken, queryClient]);
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: markNotificationRead,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_KEY }),
  });
}

export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: markAllNotificationsRead,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_KEY }),
  });
}