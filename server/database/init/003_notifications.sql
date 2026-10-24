CREATE TYPE notification_type AS ENUM (
    'BOOKING_CREATED',
    'BOOKING_CONFIRMED',
    'BOOKING_CANCELLED'
);

CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type notification_type NOT NULL,
    title VARCHAR(120) NOT NULL,
    body TEXT NOT NULL,
    booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE,
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_notifications_user_created
ON notifications (user_id, created_at DESC);

CREATE INDEX idx_notifications_user_unread
ON notifications (user_id) WHERE read_at IS NULL;