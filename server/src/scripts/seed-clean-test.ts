import "dotenv/config";
import bcrypt from "bcryptjs";
import { pool } from "../config/db";
import { normalizePhoneNumber } from "../utils/phone";

async function setupCleanTest() {
  console.log("Setting up completely clean test state...\n");
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const pwHash = await bcrypt.hash("password123", 10);
    const adminHash = await bcrypt.hash("admin123456", 10);

    const hostPhone = normalizePhoneNumber("+251911111111");
    const driverPhone = normalizePhoneNumber("+251922222222");
    const adminPhone = normalizePhoneNumber("+251900000000");

    // 1. Admin
    const adminRes = await client.query(
      `INSERT INTO users (full_name, phone_number, password_hash, phone_verified_at)
       VALUES ('Platform Administrator', $1, $2, NOW())
       ON CONFLICT (phone_number) DO UPDATE SET full_name = EXCLUDED.full_name
       RETURNING id`,
      [adminPhone, adminHash]
    );
    const adminId = adminRes.rows[0].id;
    for (const r of ["ADMIN", "HOST", "DRIVER"]) {
      await client.query(
        `INSERT INTO user_roles (user_id, role) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
        [adminId, r]
      );
    }

    // 2. Host
    const hostRes = await client.query(
      `INSERT INTO users (full_name, phone_number, password_hash, phone_verified_at)
       VALUES ('Abebe (Host)', $1, $2, NOW())
       ON CONFLICT (phone_number) DO UPDATE SET full_name = EXCLUDED.full_name
       RETURNING id`,
      [hostPhone, pwHash]
    );
    const hostId = hostRes.rows[0].id;
    for (const r of ["HOST", "DRIVER"]) {
      await client.query(
        `INSERT INTO user_roles (user_id, role) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
        [hostId, r]
      );
    }

    // 3. Driver
    const driverRes = await client.query(
      `INSERT INTO users (full_name, phone_number, password_hash, phone_verified_at)
       VALUES ('Dawit (Driver)', $1, $2, NOW())
       ON CONFLICT (phone_number) DO UPDATE SET full_name = EXCLUDED.full_name
       RETURNING id`,
      [driverPhone, pwHash]
    );
    const driverId = driverRes.rows[0].id;
    await client.query(
      `INSERT INTO user_roles (user_id, role) VALUES ($1, 'DRIVER') ON CONFLICT DO NOTHING`,
      [driverId]
    );

    // 4. Vehicle for Driver
    let vehicleId: string;
    const vCheck = await client.query(`SELECT id FROM vehicles WHERE driver_id = $1 LIMIT 1`, [driverId]);
    if (vCheck.rowCount && vCheck.rowCount > 0) {
      vehicleId = vCheck.rows[0].id;
    } else {
      const vRes = await client.query(
        `INSERT INTO vehicles (driver_id, make, model, battery_capacity_kwh, plug_type)
         VALUES ($1, 'BYD', 'Atto 3', 60.5, 'CCS2')
         RETURNING id`,
        [driverId]
      );
      vehicleId = vRes.rows[0].id;
    }

    // 5. Clean up ALL previous bookings/sessions/payments/payouts for host & driver
    const hostChargers = await client.query(`SELECT id FROM chargers WHERE host_id = $1`, [hostId]);
    for (const c of hostChargers.rows) {
      const bList = await client.query(`SELECT id FROM bookings WHERE charger_id = $1`, [c.id]);
      for (const b of bList.rows) {
        await client.query(`DELETE FROM payments WHERE booking_id = $1`, [b.id]);
        await client.query(`DELETE FROM host_payouts WHERE booking_id = $1`, [b.id]);
        await client.query(`DELETE FROM charging_sessions WHERE booking_id = $1`, [b.id]);
      }
      await client.query(`DELETE FROM bookings WHERE charger_id = $1`, [c.id]);
      await client.query(`DELETE FROM charger_schedules WHERE charger_id = $1`, [c.id]);
      await client.query(`DELETE FROM chargers WHERE id = $1`, [c.id]);
    }

    // Also clean any leftover driver bookings
    const driverBookings = await client.query(`SELECT id FROM bookings WHERE driver_id = $1`, [driverId]);
    for (const b of driverBookings.rows) {
      await client.query(`DELETE FROM payments WHERE booking_id = $1`, [b.id]);
      await client.query(`DELETE FROM host_payouts WHERE booking_id = $1`, [b.id]);
      await client.query(`DELETE FROM charging_sessions WHERE booking_id = $1`, [b.id]);
      await client.query(`DELETE FROM bookings WHERE id = $1`, [b.id]);
    }

    // 6. Create ONE single active Charger for the Host
    const chargerRes = await client.query(
      `INSERT INTO chargers (
         host_id, title, address_description, power_kw, plug_type,
         price_per_kwh, is_active, location
       )
       VALUES (
         $1, 'Bole Medhanialem EV Station', 'Near Edna Mall, Bole, Addis Ababa', 22.0, 'CCS2',
         25.00, TRUE, ST_SetSRID(ST_MakePoint(38.7892, 8.9984), 4326)
       )
       RETURNING id`,
      [hostId]
    );
    const chargerId = chargerRes.rows[0].id;

    // 7. Add 24/7 schedule for every day of the week
    for (let day = 0; day <= 6; day++) {
      await client.query(
        `INSERT INTO charger_schedules (charger_id, day_of_week, start_time, end_time)
         VALUES ($1, $2, '00:00:00', '23:59:59')`,
        [chargerId, day]
      );
    }

    await client.query("COMMIT");

    console.log("========================================================");
    console.log("✓ CLEAN TEST STATE READY (ZERO BOOKINGS)");
    console.log("========================================================");
    console.log("1. Host:   Abebe (Host)     -> +251911111111 (password123)");
    console.log("   - Charger: 'Bole Medhanialem EV Station' (25 ETB/kWh)");
    console.log("2. Driver: Dawit (Driver)   -> +251922222222 (password123)");
    console.log("   - Vehicle: BYD Atto 3 (CCS2)");
    console.log("3. Admin:  Platform Admin   -> +251900000000 (admin123456)");
    console.log("========================================================");
    console.log("Total Bookings: 0 (Ready for you to create Booking #1!)\n");
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Clean test setup failed:", err);
  } finally {
    client.release();
    await pool.end();
  }
}

setupCleanTest();
