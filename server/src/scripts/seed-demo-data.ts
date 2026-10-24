import bcrypt from "bcryptjs";
import crypto from "crypto";
import "dotenv/config";
import { pool } from "../config/db";
import { normalizePhoneNumber } from "../utils/phone";

async function seedDemoData() {
  console.log("🌱 Starting AmpShare Demo Data Seeding...\n");
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // -------------------------------------------------------------
    // 1. Create or Update Demo Users
    // -------------------------------------------------------------
    const defaultPasswordHash = await bcrypt.hash("password123", 10);
    const adminPasswordHash = await bcrypt.hash("admin123456", 10);

    const usersData = [
      {
        fullName: "Abebe Bekele (Host)",
        phone: normalizePhoneNumber("+251911111111"),
        passwordHash: defaultPasswordHash,
        roles: ["HOST", "DRIVER"],
      },
      {
        fullName: "Dawit Haile (Driver)",
        phone: normalizePhoneNumber("+251922222222"),
        passwordHash: defaultPasswordHash,
        roles: ["DRIVER"],
      },
      {
        fullName: "Almaz Tadesse (Admin)",
        phone: normalizePhoneNumber("+251900000000"),
        passwordHash: adminPasswordHash,
        roles: ["ADMIN", "HOST", "DRIVER"],
      },
    ];

    const userIds: Record<string, string> = {};

    for (const u of usersData) {
      const userRes = await client.query(
        `INSERT INTO users (full_name, phone_number, password_hash, phone_verified_at)
         VALUES ($1, $2, $3, NOW())
         ON CONFLICT (phone_number) DO UPDATE
           SET full_name = EXCLUDED.full_name,
               password_hash = EXCLUDED.password_hash,
               phone_verified_at = NOW()
         RETURNING id`,
        [u.fullName, u.phone, u.passwordHash],
      );
      const uid = userRes.rows[0].id;
      userIds[u.phone] = uid;

      for (const role of u.roles) {
        await client.query(
          `INSERT INTO user_roles (user_id, role)
           VALUES ($1, $2)
           ON CONFLICT (user_id, role) DO NOTHING`,
          [uid, role],
        );
      }
    }

    const hostId = userIds[normalizePhoneNumber("+251911111111")];
    const driverId = userIds[normalizePhoneNumber("+251922222222")];
    const adminId = userIds[normalizePhoneNumber("+251900000000")];

    console.log("✓ Demo Users provisioned:");
    console.log("  - Host:   Abebe Bekele (+251911111111 / password123)");
    console.log("  - Driver: Dawit Haile  (+251922222222 / password123)");
    console.log("  - Admin:  Almaz Tadesse (+251900000000 / admin123456)");

    // -------------------------------------------------------------
    // 2. Create Vehicle for Driver
    // -------------------------------------------------------------
    let vehicleId: string;
    const existingVehicle = await client.query(
      `SELECT id FROM vehicles WHERE driver_id = $1 LIMIT 1`,
      [driverId],
    );

    if (existingVehicle.rowCount && existingVehicle.rowCount > 0) {
      vehicleId = existingVehicle.rows[0].id;
    } else {
      const vRes = await client.query(
        `INSERT INTO vehicles (driver_id, make, model, battery_capacity_kwh, plug_type)
         VALUES ($1, 'BYD', 'Atto 3', 60.50, 'CCS2')
         RETURNING id`,
        [driverId],
      );
      vehicleId = vRes.rows[0].id;
    }
    console.log("✓ Driver Vehicle provisioned: BYD Atto 3 (CCS2)");

    // -------------------------------------------------------------
    // 3. Create Chargers for Host
    // -------------------------------------------------------------
    // Clean previous demo bookings/chargers for this host to avoid exclusion constraint conflicts
    const prevChargers = await client.query(`SELECT id FROM chargers WHERE host_id = $1`, [hostId]);
    for (const cRow of prevChargers.rows) {
      const cId = cRow.id;
      const prevBookings = await client.query(`SELECT id FROM bookings WHERE charger_id = $1`, [cId]);
      for (const bRow of prevBookings.rows) {
        await client.query(`DELETE FROM payments WHERE booking_id = $1`, [bRow.id]);
        await client.query(`DELETE FROM host_payouts WHERE booking_id = $1`, [bRow.id]);
        await client.query(`DELETE FROM charging_sessions WHERE booking_id = $1`, [bRow.id]);
      }
      await client.query(`DELETE FROM bookings WHERE charger_id = $1`, [cId]);
      await client.query(`DELETE FROM charger_schedules WHERE charger_id = $1`, [cId]);
      await client.query(`DELETE FROM chargers WHERE id = $1`, [cId]);
    }

    // Charger 1: Bole Fast Charger
    const c1Res = await client.query(
      `INSERT INTO chargers (
         host_id, title, address_description, power_kw, plug_type,
         price_per_kwh, is_active, location
       )
       VALUES (
         $1, 'Bole Medhanialem Fast Charger', 'Near Edna Mall, Bole, Addis Ababa', 22.00, 'CCS2',
         25.00, TRUE, ST_SetSRID(ST_MakePoint(38.7892, 8.9984), 4326)
       )
       RETURNING id`,
      [hostId],
    );
    const charger1Id = c1Res.rows[0].id;

    // Charger 2: Kazanchis Executive Hub
    const c2Res = await client.query(
      `INSERT INTO chargers (
         host_id, title, address_description, power_kw, plug_type,
         price_per_kwh, is_active, location
       )
       VALUES (
         $1, 'Kazanchis Executive EV Hub', 'Menelik II Ave, Kazanchis, Addis Ababa', 50.00, 'CCS2',
         30.00, TRUE, ST_SetSRID(ST_MakePoint(38.7636, 9.0182), 4326)
       )
       RETURNING id`,
      [hostId],
    );
    const charger2Id = c2Res.rows[0].id;

    // Add 24/7 schedules for both chargers for all days of week (0 to 6)
    for (const chId of [charger1Id, charger2Id]) {
      for (let day = 0; day <= 6; day++) {
        await client.query(
          `INSERT INTO charger_schedules (charger_id, day_of_week, start_time, end_time)
           VALUES ($1, $2, '00:00:00', '23:59:59')
           ON CONFLICT DO NOTHING`,
          [chId, day],
        );
      }
    }
    console.log("✓ Host Chargers provisioned:");
    console.log("  1. Bole Medhanialem Fast Charger (22 kW, 25 ETB/kWh)");
    console.log("  2. Kazanchis Executive EV Hub   (50 kW, 30 ETB/kWh)");

    // -------------------------------------------------------------
    // 4. Create 5 Realistic Scenarios for Testing Every Workflow
    // -------------------------------------------------------------
    const now = Date.now();

    // -------------------------------------------------------------------------
    // Scenario 1: PENDING Booking (Ready for Host to Approve or Reject)
    // -------------------------------------------------------------------------
    const s1Start = new Date(now + 24 * 3600 * 1000); // Tomorrow
    const s1End = new Date(now + 26 * 3600 * 1000);
    const s1Expires = new Date(now + 12 * 3600 * 1000);
    const b1Res = await client.query(
      `INSERT INTO bookings (
         driver_id, charger_id, vehicle_id, start_time, end_time,
         status, price_per_kwh_at_booking, estimated_energy_kwh, estimated_cost, expires_at
       )
       VALUES ($1, $2, $3, $4, $5, 'PENDING', 25.00, 15.000, 375.00, $6)
       RETURNING id`,
      [driverId, charger1Id, vehicleId, s1Start, s1End, s1Expires],
    );
    const b1Id = b1Res.rows[0].id;

    // -------------------------------------------------------------------------
    // Scenario 2: CONFIRMED Booking (Ready for Driver to click "Start Charging")
    // -------------------------------------------------------------------------
    const s2Start = new Date(now + 1 * 3600 * 1000); // 1 hour from now
    const s2End = new Date(now + 3 * 3600 * 1000);
    const b2Res = await client.query(
      `INSERT INTO bookings (
         driver_id, charger_id, vehicle_id, start_time, end_time,
         status, price_per_kwh_at_booking, estimated_energy_kwh, estimated_cost
       )
       VALUES ($1, $2, $3, $4, $5, 'CONFIRMED', 25.00, 20.000, 500.00)
       RETURNING id`,
      [driverId, charger1Id, vehicleId, s2Start, s2End],
    );
    const b2Id = b2Res.rows[0].id;

    // -------------------------------------------------------------------------
    // Scenario 3: ACTIVE Charging Session (Ready for Host to "Finish Charging Session")
    // -------------------------------------------------------------------------
    const s3Start = new Date(now - 2 * 3600 * 1000); // 2 hours ago
    const s3End = new Date(now + 30 * 60 * 1000);    // ends in 30 mins
    const b3Res = await client.query(
      `INSERT INTO bookings (
         driver_id, charger_id, vehicle_id, start_time, end_time,
         status, price_per_kwh_at_booking, estimated_energy_kwh, estimated_cost
       )
       VALUES ($1, $2, $3, $4, $5, 'ACTIVE', 30.00, 25.000, 750.00)
       RETURNING id`,
      [driverId, charger2Id, vehicleId, s3Start, s3End],
    );
    const b3Id = b3Res.rows[0].id;

    await client.query(
      `INSERT INTO charging_sessions (booking_id, started_at, energy_delivered_kwh)
       VALUES ($1, $2, 0.000)`,
      [b3Id, s3Start],
    );

    // -------------------------------------------------------------------------
    // Scenario 4: COMPLETED Session with PAYMENT DUE (Ready for Driver to "Pay with Telebirr")
    // -------------------------------------------------------------------------
    const s4Start = new Date(now - 6 * 3600 * 1000);
    const s4End = new Date(now - 4 * 3600 * 1000);
    const b4Res = await client.query(
      `INSERT INTO bookings (
         driver_id, charger_id, vehicle_id, start_time, end_time,
         status, price_per_kwh_at_booking, estimated_energy_kwh, estimated_cost, final_cost
       )
       VALUES ($1, $2, $3, $4, $5, 'COMPLETED', 25.00, 18.000, 450.00, 455.00)
       RETURNING id`,
      [driverId, charger1Id, vehicleId, s4Start, s4End],
    );
    const b4Id = b4Res.rows[0].id;

    await client.query(
      `INSERT INTO charging_sessions (booking_id, started_at, ended_at, energy_delivered_kwh)
       VALUES ($1, $2, $3, 18.200)`,
      [b4Id, s4Start, s4End],
    );

    // -------------------------------------------------------------------------
    // Scenario 5: COMPLETED Session with PAYMENT SUCCEEDED (Ready for Admin Payout)
    // -------------------------------------------------------------------------
    const s5Start = new Date(now - 24 * 3600 * 1000);
    const s5End = new Date(now - 22 * 3600 * 1000);
    const b5Res = await client.query(
      `INSERT INTO bookings (
         driver_id, charger_id, vehicle_id, start_time, end_time,
         status, price_per_kwh_at_booking, estimated_energy_kwh, estimated_cost, final_cost
       )
       VALUES ($1, $2, $3, $4, $5, 'COMPLETED', 30.00, 24.000, 720.00, 720.00)
       RETURNING id`,
      [driverId, charger2Id, vehicleId, s5Start, s5End],
    );
    const b5Id = b5Res.rows[0].id;

    await client.query(
      `INSERT INTO charging_sessions (booking_id, started_at, ended_at, energy_delivered_kwh)
       VALUES ($1, $2, $3, 24.000)`,
      [b5Id, s5Start, s5End],
    );

    // Succeeded customer payment
    const paymentRef = `MOCK-TLB-DEMO-${Date.now()}`;
    await client.query(
      `INSERT INTO payments (
         booking_id, provider, provider_reference, idempotency_key,
         amount, currency, status, customer_phone, provider_status, completed_at
       )
       VALUES ($1, 'TELEBIRR', $2, $3, 720.00, 'ETB', 'SUCCEEDED', '+251922222222', 'SUCCEEDED', $4)`,
      [b5Id, paymentRef, crypto.randomUUID(), s5End],
    );

    // Host payout created in PENDING state (waiting for admin to record external transfer)
    await client.query(
      `INSERT INTO host_payouts (
         booking_id, host_id, provider, amount, currency, status,
         commission_rate, commission_amount, net_amount
       )
       VALUES ($1, $2, 'TELEBIRR', 720.00, 'ETB', 'PENDING', 0.0000, 0.00, 720.00)`,
      [b5Id, hostId],
    );

    await client.query("COMMIT");

    console.log("\n========================================================");
    console.log("🎉 AmpShare Demo Data Successfully Created!");
    console.log("========================================================");
    console.log("\nReady-To-Test Scenarios:");
    console.log(`1. [PENDING Booking] ID: ${b1Id}`);
    console.log("   -> Log in as Host (+251911111111) to Approve or Cancel.");
    console.log(`2. [CONFIRMED Booking] ID: ${b2Id}`);
    console.log("   -> Log in as Driver (+251922222222) to Start Charging.");
    console.log(`3. [ACTIVE Charging Session] ID: ${b3Id}`);
    console.log("   -> Log in as Host (+251911111111) to Finish Session (Enter kWh).");
    console.log(`4. [COMPLETED Session - PAYMENT DUE: 455.00 ETB] ID: ${b4Id}`);
    console.log("   -> Log in as Driver (+251922222222) to Pay with Telebirr.");
    console.log(`5. [COMPLETED Session - PAID: 720.00 ETB, PAYOUT PENDING] ID: ${b5Id}`);
    console.log("   -> Log in as Admin (+251900000000) at /admin/payouts to record manual Telebirr payout!");
    console.log("========================================================\n");
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Failed to seed demo data:", err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

seedDemoData();
