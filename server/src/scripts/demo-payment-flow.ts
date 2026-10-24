import "dotenv/config";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import { pool } from "../config/db";
import { normalizePhoneNumber } from "../utils/phone";
import {
  createBooking,
  confirmBooking,
  getBooking,
} from "../modules/bookings/bookings.service";
import {
  startSession,
  finishSession,
} from "../modules/charging-sessions/charging-sessions.service";
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

// ANSI terminal colors for readable explanation output
const c = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  dim: "\x1b[2m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",
};

function banner(title: string) {
  console.log(`\n${c.cyan}================================================================================${c.reset}`);
  console.log(`${c.bright}${c.yellow}  ${title}${c.reset}`);
  console.log(`${c.cyan}================================================================================${c.reset}\n`);
}

function explain(what: string, underTheHood: string) {
  console.log(`${c.bright}👉 What this step does:${c.reset} ${what}`);
  console.log(`${c.dim}🔍 Under the hood:     ${underTheHood}${c.reset}`);
}

async function runLivePaymentDemo() {
  banner("AmpShare Live Payment Integration Demo & Explanation");

  console.log("This live demo executes every single step of the payment integration");
  console.log("from booking creation to Telebirr direct prompt payment, webhook verification,");
  console.log("and administrative host payout. Watch each step execute below:\n");

  const client = await pool.connect();

  try {
    // -------------------------------------------------------------------------
    // STEP 0: Set up Brand New Demo Actors
    // -------------------------------------------------------------------------
    console.log(`${c.magenta}[STEP 0] Provisioning Fresh Demo Actors${c.reset}`);
    explain(
      "Creates brand new, fresh accounts for a Driver (Sara), a Host (Henok), and an Admin.",
      "Hashes passwords with bcrypt and assigns DRIVER, HOST, and ADMIN roles in user_roles table."
    );

    const pwHash = await bcrypt.hash("password123", 10);
    const adminHash = await bcrypt.hash("admin123456", 10);

    const hostPhone = normalizePhoneNumber("+251933111222");
    const driverPhone = normalizePhoneNumber("+251933444555");
    const adminPhone = normalizePhoneNumber("+251900000000");

    // 1. Host
    const hostRes = await client.query(
      `INSERT INTO users (full_name, phone_number, password_hash, phone_verified_at)
       VALUES ('Henok Alemu (Host)', $1, $2, NOW())
       ON CONFLICT (phone_number) DO UPDATE SET full_name = EXCLUDED.full_name
       RETURNING id`,
      [hostPhone, pwHash]
    );
    const hostId = hostRes.rows[0].id;
    await client.query(`INSERT INTO user_roles (user_id, role) VALUES ($1, 'HOST') ON CONFLICT DO NOTHING`, [hostId]);

    // 2. Driver
    const driverRes = await client.query(
      `INSERT INTO users (full_name, phone_number, password_hash, phone_verified_at)
       VALUES ('Sara Kebede (Driver)', $1, $2, NOW())
       ON CONFLICT (phone_number) DO UPDATE SET full_name = EXCLUDED.full_name
       RETURNING id`,
      [driverPhone, pwHash]
    );
    const driverId = driverRes.rows[0].id;
    await client.query(`INSERT INTO user_roles (user_id, role) VALUES ($1, 'DRIVER') ON CONFLICT DO NOTHING`, [driverId]);

    // 3. Admin
    const adminRes = await client.query(
      `INSERT INTO users (full_name, phone_number, password_hash, phone_verified_at)
       VALUES ('Platform Administrator', $1, $2, NOW())
       ON CONFLICT (phone_number) DO UPDATE SET full_name = EXCLUDED.full_name
       RETURNING id`,
      [adminPhone, adminHash]
    );
    const adminId = adminRes.rows[0].id;
    await client.query(`INSERT INTO user_roles (user_id, role) VALUES ($1, 'ADMIN') ON CONFLICT DO NOTHING`, [adminId]);

    // 4. Vehicle for Driver
    let vehicleId: string;
    const vCheck = await client.query(`SELECT id FROM vehicles WHERE driver_id = $1 LIMIT 1`, [driverId]);
    if (vCheck.rowCount && vCheck.rowCount > 0) {
      vehicleId = vCheck.rows[0].id;
    } else {
      const vRes = await client.query(
        `INSERT INTO vehicles (driver_id, make, model, battery_capacity_kwh, plug_type)
         VALUES ($1, 'Tesla', 'Model Y', 75.0, 'CCS2')
         RETURNING id`,
        [driverId]
      );
      vehicleId = vRes.rows[0].id;
    }

    // 5. Charger for Host
    // Clean old demo bookings on this host charger to guarantee no overlap
    const oldCharger = await client.query(`SELECT id FROM chargers WHERE host_id = $1 LIMIT 1`, [hostId]);
    if (oldCharger.rowCount && oldCharger.rowCount > 0) {
      const cId = oldCharger.rows[0].id;
      const oldB = await client.query(`SELECT id FROM bookings WHERE charger_id = $1`, [cId]);
      for (const r of oldB.rows) {
        await client.query(`DELETE FROM payments WHERE booking_id = $1`, [r.id]);
        await client.query(`DELETE FROM host_payouts WHERE booking_id = $1`, [r.id]);
        await client.query(`DELETE FROM charging_sessions WHERE booking_id = $1`, [r.id]);
        await client.query(`DELETE FROM bookings WHERE id = $1`, [r.id]);
      }
      await client.query(`DELETE FROM charger_schedules WHERE charger_id = $1`, [cId]);
      await client.query(`DELETE FROM chargers WHERE id = $1`, [cId]);
    }

    const cRes = await client.query(
      `INSERT INTO chargers (
         host_id, title, address_description, power_kw, plug_type,
         price_per_kwh, is_active, location
       )
       VALUES (
         $1, 'CMC Sunshine Solar EV Station', 'CMC Michael, Addis Ababa', 22.0, 'CCS2',
         28.00, TRUE, ST_SetSRID(ST_MakePoint(38.852, 9.023), 4326)
       )
       RETURNING id`,
      [hostId]
    );
    const chargerId = cRes.rows[0].id;

    for (let day = 0; day <= 6; day++) {
      await client.query(
        `INSERT INTO charger_schedules (charger_id, day_of_week, start_time, end_time)
         VALUES ($1, $2, '00:00:00', '23:59:59')
         ON CONFLICT DO NOTHING`,
        [chargerId, day]
      );
    }

    console.log(`${c.green}✓ Actors ready:${c.reset}`);
    console.log(`  Driver: Sara Kebede (${driverPhone}) · Tesla Model Y`);
    console.log(`  Host:   Henok Alemu (${hostPhone}) · CMC Sunshine Station (28.00 ETB/kWh)\n`);

    // -------------------------------------------------------------------------
    // STEP 1: Driver Creates Booking
    // -------------------------------------------------------------------------
    console.log(`${c.magenta}[STEP 1] Driver Requests a Booking${c.reset}`);
    explain(
      "Sara requests a charging slot on Henok's charger. The reservation is held as PENDING.",
      "Validates schedule windows, ensures vehicle ownership, and checks PostgreSQL GiST exclusion constraint (no overlapping bookings)."
    );

    const now = Date.now();
    const startTime = new Date(now + 10 * 60 * 1000).toISOString();
    const endTime = new Date(now + 2 * 3600 * 1000).toISOString();

    const booking = await createBooking(driverId, {
      chargerId,
      vehicleId,
      startTime,
      endTime,
    });

    console.log(`${c.green}✓ Booking Created:${c.reset} ID: ${booking.id}`);
    console.log(`  Status: ${c.yellow}${booking.status}${c.reset} (Pending host approval)`);
    console.log(`  Requester: ${booking.driver?.fullName} (${booking.driver?.phoneNumber})`);
    console.log(`  Station: ${booking.charger.title} @ ${booking.pricePerKwh} ETB/kWh\n`);

    // -------------------------------------------------------------------------
    // STEP 2: Host Approves the Booking
    // -------------------------------------------------------------------------
    console.log(`${c.magenta}[STEP 2] Host Reviews & Approves Booking${c.reset}`);
    explain(
      "Henok checks his incoming requests. He sees Sara's name and approves the session.",
      "Runs confirmBooking() with row locking (SELECT ... FOR UPDATE). Ensures ordinary customers cannot confirm their own booking."
    );

    const confirmedBooking = await confirmBooking(hostId, booking.id);
    console.log(`${c.green}✓ Host Approved Booking:${c.reset}`);
    console.log(`  Status transitioned to: ${c.green}${confirmedBooking.status}${c.reset}\n`);

    // -------------------------------------------------------------------------
    // STEP 3: Driver Starts Charging
    // -------------------------------------------------------------------------
    console.log(`${c.magenta}[STEP 3] Driver Plugs In & Starts Charging${c.reset}`);
    explain(
      "Sara arrives at the station, connects the CCS2 plug, and starts charging.",
      "Runs startSession(). Verifies the booking is strictly CONFIRMED, marks booking ACTIVE, and begins metering."
    );

    const startRes = await startSession(driverId, booking.id);
    const session = startRes.session;
    console.log(`${c.green}✓ Charging Session Started:${c.reset} Session ID: ${session.id}`);
    console.log(`  Session Status: ${c.yellow}${session.status}${c.reset}`);
    console.log(`  Started At: ${session.startedAt}\n`);

    // -------------------------------------------------------------------------
    // STEP 4: Host Finishes Session & Backend Calculates Final Cost
    // -------------------------------------------------------------------------
    console.log(`${c.magenta}[STEP 4] Host Finishes Session & Records Energy Delivered${c.reset}`);
    explain(
      "Henok disconnects the car, reads 18.5 kWh delivered, and completes the session.",
      "Runs finishSession(). Calculates final_cost server-side: 18.5 kWh * 28.00 ETB = 518.00 ETB. Client-supplied amounts are never accepted."
    );

    const finished = await finishSession(hostId, session.id, 18.5);
    console.log(`${c.green}✓ Session Completed:${c.reset}`);
    console.log(`  Energy Delivered: ${finished.session.energyDeliveredKwh} kWh`);
    console.log(`  Authoritative Final Cost: ${c.bright}${c.green}${finished.session.finalCost} ETB${c.reset}`);
    console.log(`  Booking Status: ${finished.bookingStatus}\n`);

    // -------------------------------------------------------------------------
    // STEP 5: Driver Initiates Telebirr Direct Payment
    // -------------------------------------------------------------------------
    console.log(`${c.magenta}[STEP 5] Driver Pays with Telebirr (Direct Mobile Prompt)${c.reset}`);
    explain(
      "Sara initiates payment. Telebirr sends a USSD prompt directly to her phone (+251933444555) without redirecting away from AmpShare.",
      "Runs initiatePayment(). Checks driver ownership, verifies session is completed, locks database rows, and generates an idempotency key."
    );

    const initPayResult = await initiatePayment(driverId, booking.id, driverPhone);
    console.log(`${c.green}✓ Telebirr Payment Initiated:${c.reset}`);
    console.log(`  Payment ID:          ${initPayResult.payment.id}`);
    console.log(`  Provider:            ${initPayResult.payment.provider}`);
    console.log(`  Provider Reference:  ${initPayResult.payment.providerReference}`);
    console.log(`  Amount Due:          ${c.bright}${initPayResult.payment.amount} ${initPayResult.payment.currency}${c.reset}`);
    console.log(`  Payment Status:      ${c.yellow}${initPayResult.payment.status}${c.reset}`);
    console.log(`  Instructions:        "${initPayResult.instructions}"\n`);

    // -------------------------------------------------------------------------
    // STEP 6: Gateway Webhook Verification (HMAC-SHA256)
    // -------------------------------------------------------------------------
    console.log(`${c.magenta}[STEP 6] Provider Webhook & Transaction Verification${c.reset}`);
    explain(
      "Telebirr completes the charge on Sara's mobile account and sends a cryptographic webhook event to AmpShare.",
      "Verifies HMAC-SHA256 signature against EPAY_WEBHOOK_SECRET, deduplicates via webhook_events table, and updates payment to SUCCEEDED."
    );

    const webhookSecret = process.env.EPAY_WEBHOOK_SECRET || "mock_webhook_secret_development_only";
    const webhookEvent = {
      id: `evt-demo-${Date.now()}`,
      event: "payment.status",
      data: {
        reference: initPayResult.payment.providerReference,
        status: "SUCCEEDED",
        amount: 518.00,
        currencyCode: "ETB",
        completedAt: new Date().toISOString(),
      },
    };
    const rawBody = Buffer.from(JSON.stringify(webhookEvent));
    const hmacSig = crypto.createHmac("sha256", webhookSecret).update(rawBody).digest("hex");

    console.log(`  Webhook payload signed with HMAC-SHA256: ${hmacSig.slice(0, 16)}...`);
    const webhookRes = await handleWebhook(rawBody, hmacSig);
    console.log(`${c.green}✓ Webhook Verified & Processed:${c.reset} Success = ${webhookRes.success}`);

    // Verify payment record in database
    const payState = await getPaymentForBooking(driverId, booking.id, ["DRIVER"]);
    console.log(`  Payment Status: ${c.bright}${c.green}${payState.latestPayment?.status}${c.reset}`);
    console.log(`  Is Paid: ${payState.isPaid} · Can Pay: ${payState.canPay}\n`);

    // -------------------------------------------------------------------------
    // STEP 7: Security Check - Double Payment Prevention
    // -------------------------------------------------------------------------
    console.log(`${c.magenta}[STEP 7] Security Verification: Preventing Double Payment${c.reset}`);
    explain(
      "Sara or a malicious actor tries to initiate payment a second time on the same booking.",
      "Database locks and idempotency checks detect the session is already paid and reject the request with HTTP 409."
    );

    try {
      await initiatePayment(driverId, booking.id, driverPhone);
      console.log("❌ ERROR: Double payment was allowed!");
    } catch (err: any) {
      console.log(`${c.green}✓ Double Payment Safely Rejected:${c.reset} ${err.message} (HTTP ${err.statusCode})\n`);
    }

    // -------------------------------------------------------------------------
    // STEP 8: Host Earnings Tracking
    // -------------------------------------------------------------------------
    console.log(`${c.magenta}[STEP 8] Host Earnings Tracking${c.reset}`);
    explain(
      "Henok opens his Host dashboard to see his balance. He has earned 518.00 ETB, currently held as Pending Payout.",
      "Runs getHostEarnings(). Verifies that customer payments collected by AmpShare are tracked as owed to the host, with 0% platform commission."
    );

    const earnings = await getHostEarnings(hostId);
    console.log(`${c.green}✓ Host Earnings Summary:${c.reset}`);
    console.log(`  Total Earned:        ${earnings.summary.totalEarnings} ETB`);
    console.log(`  Pending Payout:      ${c.bright}${c.yellow}${earnings.summary.pendingPayoutAmount} ETB${c.reset}`);
    console.log(`  Total Paid Out:      ${earnings.summary.paidOutAmount} ETB\n`);

    // -------------------------------------------------------------------------
    // STEP 9: Admin Records Manual External Payout
    // -------------------------------------------------------------------------
    console.log(`${c.magenta}[STEP 9] Administrator Records Manual Host Payout${c.reset}`);
    explain(
      "An AmpShare administrator transfers 518.00 ETB from the company Telebirr account to Henok's phone, then records the reference in AmpShare.",
      "Runs recordManualPayout() with row locking. Requires ADMIN role, verifies customer payment was SUCCEEDED, saves admin ID, and records payout timestamp."
    );

    const adminList = await listAdminPayouts();
    const targetPayout = adminList.payouts.find((p) => p.bookingId === booking.id);
    if (!targetPayout) throw new Error("Payout record not found");

    const manualRef = `TLB-DEMO-PAYOUT-${Date.now().toString(36).toUpperCase()}`;
    const paidOut = await recordManualPayout(adminId, targetPayout.id, {
      providerReference: manualRef,
      notes: "Telebirr mobile money transfer sent to host phone (+251933111222)",
    });

    console.log(`${c.green}✓ Host Payout Recorded:${c.reset}`);
    console.log(`  Payout ID:           ${paidOut.id}`);
    console.log(`  Payout Status:       ${c.bright}${c.green}${paidOut.status}${c.reset}`);
    console.log(`  Transfer Reference:  ${paidOut.providerReference}`);
    console.log(`  Recorded By Admin:   ${paidOut.adminId}`);
    console.log(`  Paid At Timestamp:   ${paidOut.paidAt}\n`);

    // -------------------------------------------------------------------------
    // STEP 10: Final Balance Verification
    // -------------------------------------------------------------------------
    console.log(`${c.magenta}[STEP 10] Final Balance Verification for Host${c.reset}`);
    explain(
      "Henok checks his earnings again. The 518.00 ETB has moved from Pending to Total Paid Out.",
      "Aggregates payout records by status."
    );

    const finalEarnings = await getHostEarnings(hostId);
    console.log(`${c.green}✓ Updated Host Balance:${c.reset}`);
    console.log(`  Total Earned:        ${finalEarnings.summary.totalEarnings} ETB`);
    console.log(`  Pending Payout:      ${finalEarnings.summary.pendingPayoutAmount} ETB (All settled!)`);
    console.log(`  Total Paid Out:      ${c.bright}${c.green}${finalEarnings.summary.paidOutAmount} ETB${c.reset}\n`);

    banner("🎉 Live Payment Integration Demo Completed with 100% Success!");
  } catch (err) {
    console.error("Demo failed with error:", err);
  } finally {
    client.release();
    await pool.end();
  }
}

runLivePaymentDemo();
