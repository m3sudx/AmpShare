export type NotificationType =
  | "BOOKING_CREATED"
  | "BOOKING_CONFIRMED"
  | "BOOKING_CANCELLED";

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  bookingId: string | null;
  readAt: string | null;
  createdAt: string;
}

export interface NotificationsData {
  notifications: AppNotification[];
  unreadCount: number;
}