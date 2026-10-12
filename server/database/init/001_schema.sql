

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS btree_gist;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";


-- 2. ENUM TYPES
CREATE TYPE user_role AS ENUM (
    'DRIVER',
    'HOST',
    'ADMIN'
);

CREATE TYPE plug_standard AS ENUM (
    'GB/T',
    'TYPE_2',
    'CCS2'
);

CREATE TYPE booking_status AS ENUM (
    'PENDING',
    'CONFIRMED',
    'ACTIVE',
    'COMPLETED',
    'CANCELLED',
    'EXPIRED'
);

-- Telebirr is the only configured provider for the MVP.
CREATE TYPE money_provider AS ENUM (
    'TELEBIRR'
);

CREATE TYPE payment_status AS ENUM (
    'PENDING',
    'SUCCEEDED',
    'FAILED',
    'REFUNDED'
);

CREATE TYPE payout_status AS ENUM (
    'PENDING',
    'PROCESSING',
    'PAID',
    'FAILED'
);


-- 3. USERS
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    full_name VARCHAR(100) NOT NULL,
    phone_number VARCHAR(20) NOT NULL UNIQUE,
    phone_verified_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);


-- 4. USER ROLES
CREATE TABLE user_roles (
    user_id UUID NOT NULL
        REFERENCES users(id) ON DELETE CASCADE,
    role user_role NOT NULL,
    PRIMARY KEY (user_id, role)
);


-- 5. VEHICLES
CREATE TABLE vehicles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    driver_id UUID NOT NULL
        REFERENCES users(id) ON DELETE RESTRICT,
    make VARCHAR(50) NOT NULL,
    model VARCHAR(50) NOT NULL,
    battery_capacity_kwh NUMERIC(6, 2) NOT NULL
        CHECK (battery_capacity_kwh > 0),
    plug_type plug_standard NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    -- Required as the referenced key for the composite booking FK.
    CONSTRAINT vehicles_id_driver_id_unique UNIQUE (id, driver_id)
);

CREATE INDEX idx_vehicles_driver_id
ON vehicles (driver_id);


-- 6. CHARGERS
CREATE TABLE chargers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    host_id UUID NOT NULL
        REFERENCES users(id) ON DELETE RESTRICT,
    title VARCHAR(100) NOT NULL,
    address_description TEXT NOT NULL,
    power_kw NUMERIC(6, 2) NOT NULL
        CHECK (power_kw > 0),
    plug_type plug_standard NOT NULL,
    price_per_kwh NUMERIC(8, 2) NOT NULL
        CHECK (price_per_kwh > 0),
    is_active BOOLEAN NOT NULL DEFAULT FALSE,
    timezone_name VARCHAR(64) NOT NULL DEFAULT 'Africa/Addis_Ababa',

    -- GPS point in WGS 84; longitude is first, latitude second.
    location GEOGRAPHY(POINT, 4326) NOT NULL,

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Speeds up spatial filtering for nearby-charger queries.
CREATE INDEX idx_chargers_location_gix
ON chargers USING GIST (location);

CREATE INDEX idx_chargers_host_id
ON chargers (host_id);


-- 7. RECURRING CHARGER SCHEDULES
CREATE TABLE charger_schedules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    charger_id UUID NOT NULL
        REFERENCES chargers(id) ON DELETE CASCADE,
    day_of_week SMALLINT NOT NULL
        CHECK (day_of_week BETWEEN 0 AND 6),
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT valid_schedule_time
        CHECK (end_time > start_time),

    CONSTRAINT charger_schedules_unique_window
        UNIQUE (charger_id, day_of_week, start_time, end_time)
);

-- Prevent overlapping recurring windows for the same charger/day.
-- The fixed date is a technical device for comparing TIME ranges.
ALTER TABLE charger_schedules
ADD CONSTRAINT no_overlapping_daily_schedules
EXCLUDE USING GIST (
    charger_id WITH =,
    day_of_week WITH =,
    (
        tsrange(
            DATE '2000-01-01' + start_time,
            DATE '2000-01-01' + end_time,
            '[)'
        )
    ) WITH &&
);


-- 8. BOOKINGS
CREATE TABLE bookings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    driver_id UUID NOT NULL
        REFERENCES users(id) ON DELETE RESTRICT,
    charger_id UUID NOT NULL
        REFERENCES chargers(id) ON DELETE RESTRICT,
    vehicle_id UUID NOT NULL,

    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    status booking_status NOT NULL DEFAULT 'PENDING',

    -- Preserve the agreed tariff even if the listing price changes.
    price_per_kwh_at_booking NUMERIC(8, 2) NOT NULL
        CHECK (price_per_kwh_at_booking > 0),

    estimated_energy_kwh NUMERIC(8, 3)
        CHECK (
            estimated_energy_kwh IS NULL
            OR estimated_energy_kwh >= 0
        ),

    estimated_cost NUMERIC(10, 2) NOT NULL
        CHECK (estimated_cost >= 0),

    final_cost NUMERIC(10, 2)
        CHECK (final_cost IS NULL OR final_cost >= 0),

    -- Required while status is PENDING; application logic must expire holds.
    expires_at TIMESTAMPTZ,

    -- Keep this token private; validate authorization and expiry server-side.
    qr_handshake_token UUID NOT NULL UNIQUE DEFAULT uuid_generate_v4(),
    qr_expires_at TIMESTAMPTZ,
    qr_used_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT valid_booking_time
        CHECK (end_time > start_time),

    CONSTRAINT pending_booking_requires_expiry
        CHECK (status <> 'PENDING' OR expires_at IS NOT NULL),

    -- Ensures the selected vehicle belongs to the booking's driver.
    CONSTRAINT booking_vehicle_belongs_to_driver
        FOREIGN KEY (vehicle_id, driver_id)
        REFERENCES vehicles (id, driver_id)
        ON DELETE RESTRICT
);

-- Prevent overlapping active/held reservations for the same charger.
ALTER TABLE bookings
ADD CONSTRAINT no_overlapping_charger_bookings
EXCLUDE USING GIST (
    charger_id WITH =,
    tstzrange(start_time, end_time, '[)') WITH &&
)
WHERE (
    status IN ('PENDING', 'CONFIRMED', 'ACTIVE')
);

CREATE INDEX idx_bookings_driver_start
ON bookings (driver_id, start_time DESC);

CREATE INDEX idx_bookings_charger_start
ON bookings (charger_id, start_time);

CREATE INDEX idx_bookings_vehicle_id
ON bookings (vehicle_id);


-- 9. CHARGING SESSIONS
-- MVP assumption: at most one session per booking.
CREATE TABLE charging_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_id UUID NOT NULL UNIQUE
        REFERENCES bookings(id) ON DELETE RESTRICT,
    started_at TIMESTAMPTZ,
    ended_at TIMESTAMPTZ,
    energy_delivered_kwh NUMERIC(10, 3) NOT NULL DEFAULT 0
        CHECK (energy_delivered_kwh >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT valid_session_time
        CHECK (
            ended_at IS NULL
            OR (
                started_at IS NOT NULL
                AND ended_at >= started_at
            )
        )
);


-- 10. PAYMENTS (DRIVER -> AMPSHARE)
CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_id UUID NOT NULL
        REFERENCES bookings(id) ON DELETE RESTRICT,
    provider money_provider NOT NULL DEFAULT 'TELEBIRR',
    provider_reference VARCHAR(150) UNIQUE,

    -- Reuse the same key for retries of the same payment operation.
    idempotency_key UUID NOT NULL UNIQUE,

    amount NUMERIC(10, 2) NOT NULL
        CHECK (amount > 0),
    currency CHAR(3) NOT NULL DEFAULT 'ETB',
    status payment_status NOT NULL DEFAULT 'PENDING',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_payments_booking_id
ON payments (booking_id);


-- 11. HOST PAYOUTS 
-- MVP assumption: one payout record per booking.
CREATE TABLE host_payouts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_id UUID NOT NULL UNIQUE
        REFERENCES bookings(id) ON DELETE RESTRICT,
    host_id UUID NOT NULL
        REFERENCES users(id) ON DELETE RESTRICT,
    provider money_provider NOT NULL DEFAULT 'TELEBIRR',
    provider_reference VARCHAR(150) UNIQUE,
    amount NUMERIC(10, 2) NOT NULL
        CHECK (amount > 0),
    currency CHAR(3) NOT NULL DEFAULT 'ETB',
    status payout_status NOT NULL DEFAULT 'PENDING',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_host_payouts_host_id
ON host_payouts (host_id);

