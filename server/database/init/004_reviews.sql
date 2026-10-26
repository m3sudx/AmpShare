-- One review per booking, written by the driver after the session is paid.
CREATE TABLE IF NOT EXISTS reviews (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id  uuid NOT NULL UNIQUE REFERENCES bookings(id) ON DELETE CASCADE,
  charger_id  uuid NOT NULL REFERENCES chargers(id) ON DELETE CASCADE,
  driver_id   uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  rating      smallint NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment     text CHECK (comment IS NULL OR char_length(comment) <= 500),
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS reviews_charger_idx
  ON reviews (charger_id, created_at DESC);