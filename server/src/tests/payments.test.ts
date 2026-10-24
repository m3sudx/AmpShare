import "dotenv/config";
import test, { describe, it, before, after } from "node:test";
import assert from "node:assert/strict";
import crypto from "crypto";
import { pool } from "../config/db";
import { AppError } from "../utils/app-error";
import {
  initiatePayment,
  getPaymentForBooking,
  verifyPayment,
  handleWebhook,
} from "../modules/payments/payments.service";
import {
  getHostEarnings,
  listAdminPayouts,
  recordManualPayout,
} from "../modules/host-payouts/host-payouts.service";

describe("AmpShare Payment & Payout Integration Tests", () => {
  let hostId: string;
  let driverId: string;
  let otherDriverId: string;
  let adminId: string;
  let chargerId: string;
  let vehicleId: string;
  let completedBookingId: string;
  let activeBookingId: string;

  before(async () => {
    // Clean up test data if any leftovers exist
    await pool.query("DELETE FROM webhook_events WHERE event_id LIKE 'test-%'");

    // 1. Create test Host
    const hostRes = await pool.query(
      `INSERT INTO users (full_name, phone_number, password_hash)
       VALUES ('Test Host', '+251911000001', 'hash_test_123')
       ON CONFLICT (phone_number) DO UPDATE SET full_name = EXCLUDED.full_name
       RETURNING id`,
    );
    hostId = hostRes.rows[0].id;
    await pool.query(
      `INSERT INTO user_roles (user_id, role) VALUES ($1, 'HOST') ON CONFLICT DO NOTHING`,
      [hostId],
    );

    // 2. Create test Driver
    const driverRes = await pool.query(
      `INSERT INTO users (full_name, phone_number, password_hash)
       VALUES ('Test Driver', '+251911000002', 'hash_test_123')
       ON CONFLICT (phone_number) DO UPDATE SET full_name = EXCLUDED.full_name
       RETURNING id`,
    );
    driverId = driverRes.rows[0].id;
    await pool.query(
      `INSERT INTO user_roles (user_id, role) VALUES ($1, 'DRIVER') ON CONFLICT DO NOTHING`,
      [driverId],
    );

    // 3. Create another Driver (unauthorized)
    const otherRes = await pool.query(
      `INSERT INTO users (full_name, phone_number, password_hash)
       VALUES ('Other Driver', '+251911000003', 'hash_test_123')
       ON CONFLICT (phone_number) DO UPDATE SET full_name = EXCLUDED.full_name
       RETURNING id`,
    );
    otherDriverId = otherRes.rows[0].id;
    await pool.query(
      `INSERT INTO user_roles (user_id, role) VALUES ($1, 'DRIVER') ON CONFLICT DO NOTHING`,
      [otherDriverId],
    );

    // 4. Create test Admin
    const adminRes = await pool.query(
      `INSERT INTO users (full_name, phone_number, password_hash)
       VALUES ('Test Admin', '+251911000004', 'hash_test_123')
       ON CONFLICT (phone_number) DO UPDATE SET full_name = EXCLUDED.full_name
       RETURNING id`,
    );
    adminId = adminRes.rows[0].id;
    await pool.query(
      `INSERT INTO user_roles (user_id, role) VALUES ($1, 'ADMIN') ON CONFLICT DO NOTHING`,
      [adminId],
    );

    // 5. Create Charger for Host
    const chargerRes = await pool.query(
      `INSERT INTO chargers (
         host_id, title, address_description, power_kw, plug_type,
         price_per_kwh, is_active, location
       )
       VALUES (
         $1, 'Test Station Bole', 'Airport Rd, Addis Ababa', 22.0, 'CCS2',
         25.00, true, ST_SetSRID(ST_MakePoint(38.790, 8.995), 4326)
       )
       RETURNING id`,
      [hostId],
    );
    chargerId = chargerRes.rows[0].id;

    // 6. Create Vehicle for Driver
    const vehicleRes = await pool.query(
      `INSERT INTO vehicles (driver_id, make, model, battery_capacity_kwh, plug_type)
       VALUES ($1, 'BYD', 'Atto 3', 60.5, 'CCS2')
       RETURNING id`,
      [driverId],
    );
    vehicleId = vehicleRes.rows[0].id;

    // 7. Create a completed booking with completed charging session
    const startTime1 = new Date(Date.now() - 4 * 3600 * 1000);
    const endTime1 = new Date(Date.now() - 2 * 3600 * 1000);
    const completedBookingRes = await pool.query(
      `INSERT INTO bookings (
         driver_id, charger_id, vehicle_id, start_time, end_time,
         status, price_per_kwh_at_booking, estimated_cost, final_cost
       )
       VALUES (
         $1, $2, $3, $4, $5,
         'COMPLETED', 25.00, 375.00, 350.00
       )
       RETURNING id`,
      [driverId, chargerId, vehicleId, startTime1, endTime1],
    );
    completedBookingId = completedBookingRes.rows[0].id;

    await pool.query(
      `INSERT INTO charging_sessions (
         booking_id, started_at, ended_at, energy_delivered_kwh
       )
       VALUES ($1, $2, $3, 14.000)`,
      [completedBookingId, startTime1, endTime1],
    );

    // 8. Create an active (in-progress) booking
    const startTime2 = new Date(Date.now() - 1 * 3600 * 1000);
    const endTime2 = new Date(Date.now() + 1 * 3600 * 1000);
    const activeBookingRes = await pool.query(
      `INSERT INTO bookings (
         driver_id, charger_id, vehicle_id, start_time, end_time,
         status, price_per_kwh_at_booking, estimated_cost
       )
       VALUES (
         $1, $2, $3, $4, $5,
         'ACTIVE', 25.00, 250.00
       )
       RETURNING id`,
      [driverId, chargerId, vehicleId, startTime2, endTime2],
    );
    activeBookingId = activeBookingRes.rows[0].id;

    await pool.query(
      `INSERT INTO charging_sessions (booking_id, started_at)
       VALUES ($1, $2)`,
      [activeBookingId, startTime2],
    );
  });

  after(async () => {
    // Clean up test records
    await pool.query("DELETE FROM payments WHERE booking_id IN ($1, $2)", [
      completedBookingId,
      activeBookingId,
    ]);
    await pool.query("DELETE FROM host_payouts WHERE booking_id IN ($1, $2)", [
      completedBookingId,
      activeBookingId,
    ]);
    await pool.query("DELETE FROM charging_sessions WHERE booking_id IN ($1, $2)", [
      completedBookingId,
      activeBookingId,
    ]);
    await pool.query("DELETE FROM bookings WHERE id IN ($1, $2)", [
      completedBookingId,
      activeBookingId,
    ]);
    await pool.query("DELETE FROM vehicles WHERE id = $1", [vehicleId]);
    await pool.query("DELETE FROM chargers WHERE id = $1", [chargerId]);
    await pool.query("DELETE FROM user_roles WHERE user_id IN ($1, $2, $3, $4)", [
      hostId,
      driverId,
      otherDriverId,
      adminId,
    ]);
    await pool.query("DELETE FROM users WHERE id IN ($1, $2, $3, $4)", [
      hostId,
      driverId,
      otherDriverId,
      adminId,
    ]);
    await pool.query("DELETE FROM webhook_events WHERE event_id LIKE 'test-%'");

    await pool.end();
  });

  it("1. Rejects payment initiation if charging session is not yet completed", async () => {
    await assert.rejects(
      async () => {
        await initiatePayment(driverId, activeBookingId, "+251911223344");
      },
      (err: any) => {
        assert.ok(err instanceof AppError);
        assert.strictEqual(err.statusCode, 400);
        assert.match(err.message, /completed charging sessions/i);
        return true;
      },
    );
  });

  it("2. Rejects payment initiation if requester is not the booking driver", async () => {
    await assert.rejects(
      async () => {
        await initiatePayment(otherDriverId, completedBookingId, "+251911223344");
      },
      (err: any) => {
        assert.ok(err instanceof AppError);
        assert.strictEqual(err.statusCode, 404);
        assert.match(err.message, /Booking not found/i);
        return true;
      },
    );
  });

  it("3. Valid customer initiates payment: uses authoritative final_cost from database", async () => {
    const res = await initiatePayment(driverId, completedBookingId, "+251911223399");

    assert.ok(res.payment);
    assert.strictEqual(res.payment.bookingId, completedBookingId);
    assert.strictEqual(res.payment.amount, 350.0); // Exact final_cost in DB
    assert.strictEqual(res.payment.currency, "ETB");
    assert.strictEqual(res.payment.provider, "TELEBIRR");
    assert.strictEqual(res.payment.status, "PENDING");
    assert.strictEqual(res.payment.customerPhone, "+251911223399");
    assert.ok(res.payment.providerReference);
    assert.ok(res.instructions);

    // Verify host payout record is created in PENDING state with 0% commission
    const { rows: payoutRows } = await pool.query(
      `SELECT * FROM host_payouts WHERE booking_id = $1`,
      [completedBookingId],
    );
    assert.strictEqual(payoutRows.length, 1);
    assert.strictEqual(payoutRows[0].status, "PENDING");
    assert.strictEqual(Number(payoutRows[0].amount), 350.0);
    assert.strictEqual(Number(payoutRows[0].net_amount), 350.0);
    assert.strictEqual(Number(payoutRows[0].commission_rate), 0.0);
  });

  it("4. Duplicate payment initiation returns existing active transaction safely", async () => {
    // Calling initiatePayment again while transaction is pending must return the same pending transaction
    const res = await initiatePayment(driverId, completedBookingId, "+251911223399");

    assert.ok(res.payment);
    assert.strictEqual(res.payment.status, "PENDING");

    // Check that we didn't create multiple payment rows
    const { rows: paymentRows } = await pool.query(
      `SELECT * FROM payments WHERE booking_id = $1`,
      [completedBookingId],
    );
    assert.strictEqual(paymentRows.length, 1);
  });

  it("5. Verifies transaction result with provider and updates payment to SUCCEEDED", async () => {
    const detailsBefore = await getPaymentForBooking(driverId, completedBookingId, ["DRIVER"]);
    assert.strictEqual(detailsBefore.isPaid, false);
    assert.strictEqual(detailsBefore.canPay, true);

    const paymentId = detailsBefore.latestPayment!.id;
    const providerRef = detailsBefore.latestPayment!.providerReference!;

    // Deliver verified webhook from provider
    const secret = process.env.EPAY_WEBHOOK_SECRET || "mock_webhook_secret_development_only";
    const payloadObj = {
      id: `evt-succ-${Date.now()}`,
      event: "payment.status",
      data: {
        reference: providerRef,
        status: "SUCCEEDED",
        amount: 350.0,
      },
    };
    const rawBody = Buffer.from(JSON.stringify(payloadObj));
    const sig = crypto.createHmac("sha256", secret).update(rawBody).digest("hex");
    await handleWebhook(rawBody, sig);

    const verified = await verifyPayment(driverId, paymentId, ["DRIVER"]);

    assert.strictEqual(verified.status, "SUCCEEDED");
    assert.ok(verified.completedAt);

    const detailsAfter = await getPaymentForBooking(driverId, completedBookingId, ["DRIVER"]);
    assert.strictEqual(detailsAfter.isPaid, true);
    assert.strictEqual(detailsAfter.canPay, false);
  });

  it("6. Completed customer payment does NOT automatically mark host payout as completed", async () => {
    const { rows: payoutRows } = await pool.query(
      `SELECT * FROM host_payouts WHERE booking_id = $1`,
      [completedBookingId],
    );
    assert.strictEqual(payoutRows.length, 1);
    // MUST still be PENDING until an admin manually transfers money and records it
    assert.strictEqual(payoutRows[0].status, "PENDING");
    assert.strictEqual(payoutRows[0].paid_at, null);
    assert.strictEqual(payoutRows[0].admin_id, null);
  });

  it("7. Initiating payment after session is already paid throws an error", async () => {
    await assert.rejects(
      async () => {
        await initiatePayment(driverId, completedBookingId, "+251911223344");
      },
      (err: any) => {
        assert.ok(err instanceof AppError);
        assert.strictEqual(err.statusCode, 409);
        assert.match(err.message, /already been paid for/i);
        return true;
      },
    );
  });

  it("8. Webhook rejects invalid HMAC signatures with 401", async () => {
    const payload = JSON.stringify({
      id: "test-evt-001",
      event: "payment.status",
      data: {
        reference: "NON-EXISTENT",
        status: "SUCCEEDED",
        amount: 350.0,
      },
    });

    await assert.rejects(
      async () => {
        await handleWebhook(Buffer.from(payload), "sha256=invalid_forged_signature_hex");
      },
      (err: any) => {
        assert.ok(err instanceof AppError);
        assert.strictEqual(err.statusCode, 401);
        assert.match(err.message, /signature/i);
        return true;
      },
    );
  });

  it("9. Webhook accepts valid signature and performs durable event deduplication", async () => {
    const secret = process.env.EPAY_WEBHOOK_SECRET || "mock_webhook_secret_development_only";
    const eventId = `test-evt-${Date.now()}`;
    const payloadObj = {
      id: eventId,
      event: "payment.status",
      data: {
        reference: "MOCK-TEST-REFERENCE",
        status: "SUCCEEDED",
        amount: 350.0,
      },
    };
    const rawBody = Buffer.from(JSON.stringify(payloadObj));
    const signature = crypto.createHmac("sha256", secret).update(rawBody).digest("hex");

    // First attempt -> processed
    const firstAttempt = await handleWebhook(rawBody, signature);
    assert.strictEqual(firstAttempt.success, true);
    assert.strictEqual((firstAttempt as any).duplicate, undefined);

    // Duplicate attempt with same eventId -> deduplicated
    const secondAttempt = await handleWebhook(rawBody, signature);
    assert.strictEqual(secondAttempt.success, true);
    assert.strictEqual((secondAttempt as any).duplicate, true);
  });

  it("10. Host earnings reflects verified customer payment and pending payout status", async () => {
    const earnings = await getHostEarnings(hostId);
    assert.strictEqual(earnings.summary.totalEarnings, 350.0);
    assert.strictEqual(earnings.summary.pendingPayoutAmount, 350.0);
    assert.strictEqual(earnings.summary.paidOutAmount, 0.0);
    assert.strictEqual(earnings.payouts.length, 1);
    assert.strictEqual(earnings.payouts[0].bookingId, completedBookingId);
  });

  it("11. Admin can list payouts and record manual external Telebirr transfer", async () => {
    // Admin list
    const adminList = await listAdminPayouts();
    assert.ok(adminList.overview.totalCollected >= 350.0);
    const targetPayout = adminList.payouts.find((p) => p.bookingId === completedBookingId);
    assert.ok(targetPayout);
    assert.strictEqual(targetPayout.status, "PENDING");

    // Record manual payout
    const updated = await recordManualPayout(adminId, targetPayout.id, {
      providerReference: "TLB-MANUAL-EXT-REF-12345",
      notes: "Telebirr mobile money transfer sent to host phone",
    });

    assert.strictEqual(updated.status, "PAID");
    assert.strictEqual(updated.providerReference, "TLB-MANUAL-EXT-REF-12345");
    assert.strictEqual(updated.adminId, adminId);
    assert.ok(updated.paidAt);

    // Host earnings should now reflect 350 paidOutAmount and 0 pendingPayoutAmount
    const earningsAfter = await getHostEarnings(hostId);
    assert.strictEqual(earningsAfter.summary.paidOutAmount, 350.0);
    assert.strictEqual(earningsAfter.summary.pendingPayoutAmount, 0.0);
  });

  it("12. Duplicate manual payout recording is rejected with 409", async () => {
    const adminList = await listAdminPayouts();
    const targetPayout = adminList.payouts.find((p) => p.bookingId === completedBookingId);
    assert.ok(targetPayout);

    await assert.rejects(
      async () => {
        await recordManualPayout(adminId, targetPayout.id, {
          providerReference: "TLB-MANUAL-EXT-REF-DUPLICATE",
        });
      },
      (err: any) => {
        assert.ok(err instanceof AppError);
        assert.strictEqual(err.statusCode, 409);
        assert.match(err.message, /already been recorded/i);
        return true;
      },
    );
  });
});
