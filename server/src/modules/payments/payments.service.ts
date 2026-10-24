import crypto from "crypto";
import type { PoolClient } from "pg";
import { pool } from "../../config/db";
import { AppError } from "../../utils/app-error";
import { withTransaction } from "../../utils/db-helpers";
import { getPaymentProvider } from "./payments.provider";

export interface PaymentDto {
  id: string;
  bookingId: string;
  provider: string;
  providerReference: string | null;
  idempotencyKey: string;
  amount: number;
  currency: string;
  status: "PENDING" | "SUCCEEDED" | "FAILED" | "REFUNDED";
  customerPhone: string | null;
  errorMessage: string | null;
  completedAt: string | null;
  createdAt: string;
}

function toPaymentDto(row: any): PaymentDto {
  return {
    id: row.id,
    bookingId: row.booking_id,
    provider: row.provider,
    providerReference: row.provider_reference,
    idempotencyKey: row.idempotency_key,
    amount: Number(row.amount),
    currency: row.currency.trim(),
    status: row.status,
    customerPhone: row.customer_phone,
    errorMessage: row.error_message,
    completedAt: row.completed_at ? new Date(row.completed_at).toISOString() : null,
    createdAt: new Date(row.created_at).toISOString(),
  };
}

/**
 * Initiates direct Telebirr payment for a completed charging session.
 * Enforces strict authorization, row locking, and idempotency.
 */
export async function initiatePayment(driverId: string, bookingId: string, customerPhone: string) {
  const provider = getPaymentProvider();

  return withTransaction(async (client: PoolClient) => {
    // 1. Lock the booking and verify charging session completion
    const { rows: bookingRows } = await client.query(
      `SELECT b.id, b.driver_id, b.charger_id, b.status, b.final_cost,
              c.host_id,
              cs.id AS session_id, cs.ended_at, cs.energy_delivered_kwh
       FROM bookings b
       JOIN chargers c ON c.id = b.charger_id
       LEFT JOIN charging_sessions cs ON cs.booking_id = b.id
       WHERE b.id = $1
       FOR UPDATE OF b`,
      [bookingId],
    );

    const booking = bookingRows[0];
    if (!booking || booking.driver_id !== driverId) {
      throw new AppError("Booking not found", 404);
    }

    if (booking.status !== "COMPLETED" || !booking.ended_at) {
      throw new AppError("Payment can only be initiated for completed charging sessions", 400);
    }

    const finalCost = Number(booking.final_cost);
    if (isNaN(finalCost) || finalCost <= 0) {
      throw new AppError("No outstanding balance due for this session", 400);
    }

    // 2. Check existing payment attempts for this booking
    const { rows: paymentRows } = await client.query(
      `SELECT * FROM payments WHERE booking_id = $1 ORDER BY created_at DESC FOR UPDATE`,
      [bookingId],
    );

    const successfulPayment = paymentRows.find((p) => p.status === "SUCCEEDED");
    if (successfulPayment) {
      throw new AppError("This charging session has already been paid for", 409);
    }

    // 3. Handle pending payment: verify with gateway first before allowing a new charge
    const pendingPayment = paymentRows.find((p) => p.status === "PENDING");
    if (pendingPayment && pendingPayment.provider_reference) {
      try {
        const verifyResult = await provider.verifyTransaction(pendingPayment.provider_reference);
        if (verifyResult.status === "SUCCEEDED") {
          await client.query(
            `UPDATE payments
             SET status = 'SUCCEEDED', provider_status = 'SUCCEEDED', completed_at = now(), error_message = NULL
             WHERE id = $1`,
            [pendingPayment.id],
          );

          // Ensure host payout is pending
          await client.query(
            `INSERT INTO host_payouts (
               booking_id, host_id, provider, amount, currency, status,
               commission_rate, commission_amount, net_amount
             ) VALUES ($1, $2, 'TELEBIRR', $3, 'ETB', 'PENDING', 0.0000, 0.00, $3)
             ON CONFLICT (booking_id) DO NOTHING`,
            [bookingId, booking.host_id, finalCost],
          );

          pendingPayment.status = "SUCCEEDED";
          return {
            payment: toPaymentDto(pendingPayment),
            instructions: "Payment has already been authorized and verified.",
          };
        } else if (verifyResult.status === "PENDING") {
          // Still waiting for customer authorization - return current pending transaction
          return {
            payment: toPaymentDto(pendingPayment),
            instructions:
              "Payment authorization is already pending. Please approve the prompt on your phone.",
          };
        } else if (verifyResult.status === "FAILED") {
          // Mark previous attempt failed so user can safely retry
          await client.query(
            `UPDATE payments
             SET status = 'FAILED', provider_status = 'FAILED', error_message = $2
             WHERE id = $1`,
            [pendingPayment.id, verifyResult.errorMessage || "Payment authorization failed"],
          );
        }
      } catch {
        // If provider verification is temporarily unreachable, return the pending payment safely
        return {
          payment: toPaymentDto(pendingPayment),
          instructions:
            "A previous payment request is being processed. Please check your phone for the Telebirr prompt.",
        };
      }
    }

    // 4. Create a new payment attempt
    const idempotencyKey = crypto.randomUUID();
    const merchantReference = `AMP-${bookingId.slice(0, 8)}-${Date.now().toString(36).toUpperCase()}`;

    // Call payment provider
    const initResult = await provider.initiateDirectPayment({
      bookingId,
      amount: finalCost,
      currency: "ETB",
      customerPhone,
      idempotencyKey,
      merchantReference,
      description: `AmpShare EV Charging #${bookingId.slice(0, 8)}`,
      metadata: { bookingId, driverId, hostId: booking.host_id },
    });

    const initialStatus = initResult.providerStatus;

    const { rows: insertedRows } = await client.query(
      `INSERT INTO payments (
         booking_id, provider, provider_reference, idempotency_key,
         amount, currency, status, customer_phone, provider_status,
         completed_at, error_message
       )
       VALUES ($1, 'TELEBIRR', $2, $3, $4, 'ETB', $5, $6, $7, $8, $9)
       RETURNING *`,
      [
        bookingId,
        initResult.providerReference,
        idempotencyKey,
        finalCost,
        initialStatus,
        customerPhone,
        initialStatus,
        initialStatus === "SUCCEEDED" ? new Date() : null,
        initialStatus === "FAILED" ? "Transaction declined by provider" : null,
      ],
    );

    // Initialize host payout record (status = PENDING)
    await client.query(
      `INSERT INTO host_payouts (
         booking_id, host_id, provider, amount, currency, status,
         commission_rate, commission_amount, net_amount
       ) VALUES ($1, $2, 'TELEBIRR', $3, 'ETB', 'PENDING', 0.0000, 0.00, $3)
       ON CONFLICT (booking_id) DO NOTHING`,
      [bookingId, booking.host_id, finalCost],
    );

    return {
      payment: toPaymentDto(insertedRows[0]),
      instructions: initResult.instructions,
      checkoutUrl: initResult.checkoutUrl,
    };
  });
}

/**
 * Retrieves payment status and history for a booking.
 */
export async function getPaymentForBooking(userId: string, bookingId: string, userRoles: string[] = []) {
  const { rows: bookingRows } = await pool.query(
    `SELECT b.id, b.driver_id, b.status, b.final_cost, c.host_id,
            cs.id AS session_id, cs.ended_at
     FROM bookings b
     JOIN chargers c ON c.id = b.charger_id
     LEFT JOIN charging_sessions cs ON cs.booking_id = b.id
     WHERE b.id = $1`,
    [bookingId],
  );

  const booking = bookingRows[0];
  if (!booking) {
    throw new AppError("Booking not found", 404);
  }

  const isDriver = booking.driver_id === userId;
  const isHost = booking.host_id === userId;
  const isAdmin = userRoles.includes("ADMIN");

  if (!isDriver && !isHost && !isAdmin) {
    throw new AppError("Booking not found", 404);
  }

  const { rows: payments } = await pool.query(
    `SELECT * FROM payments WHERE booking_id = $1 ORDER BY created_at DESC`,
    [bookingId],
  );

  const latestPayment = payments[0] ? toPaymentDto(payments[0]) : null;
  const isPaid = payments.some((p) => p.status === "SUCCEEDED");
  const canPay = isDriver && booking.status === "COMPLETED" && Number(booking.final_cost) > 0 && !isPaid;

  return {
    bookingId,
    finalCost: Number(booking.final_cost || 0),
    isPaid,
    canPay,
    latestPayment,
    payments: payments.map(toPaymentDto),
  };
}

/**
 * Verifies transaction with provider and updates the payment record accordingly.
 */
export async function verifyPayment(userId: string, paymentId: string, userRoles: string[] = []) {
  const provider = getPaymentProvider();

  return withTransaction(async (client: PoolClient) => {
    const { rows: paymentRows } = await client.query(
      `SELECT p.*, b.driver_id, b.status AS booking_status, b.final_cost, c.host_id
       FROM payments p
       JOIN bookings b ON b.id = p.booking_id
       JOIN chargers c ON c.id = b.charger_id
       WHERE p.id = $1
       FOR UPDATE OF p`,
      [paymentId],
    );

    const payment = paymentRows[0];
    if (!payment) {
      throw new AppError("Payment record not found", 404);
    }

    const isDriver = payment.driver_id === userId;
    const isHost = payment.host_id === userId;
    const isAdmin = userRoles.includes("ADMIN");

    if (!isDriver && !isHost && !isAdmin) {
      throw new AppError("Payment record not found", 404);
    }

    // If already finalized as succeeded or failed, return current state
    if (payment.status === "SUCCEEDED" || payment.status === "FAILED") {
      return toPaymentDto(payment);
    }

    if (!payment.provider_reference) {
      throw new AppError("Payment has no provider reference to verify", 400);
    }

    // Call provider verification
    const result = await provider.verifyTransaction(payment.provider_reference);

    if (result.status === "SUCCEEDED") {
      const { rows: updated } = await client.query(
        `UPDATE payments
         SET status = 'SUCCEEDED', provider_status = 'SUCCEEDED', completed_at = now(), error_message = NULL
         WHERE id = $1
         RETURNING *`,
        [paymentId],
      );

      // Ensure host payout is pending
      await client.query(
        `INSERT INTO host_payouts (
           booking_id, host_id, provider, amount, currency, status,
           commission_rate, commission_amount, net_amount
         ) VALUES ($1, $2, 'TELEBIRR', $3, 'ETB', 'PENDING', 0.0000, 0.00, $3)
         ON CONFLICT (booking_id) DO NOTHING`,
        [payment.booking_id, payment.host_id, payment.amount],
      );

      return toPaymentDto(updated[0]);
    } else if (result.status === "FAILED") {
      const { rows: updated } = await client.query(
        `UPDATE payments
         SET status = 'FAILED', provider_status = 'FAILED', error_message = $2
         WHERE id = $1
         RETURNING *`,
        [paymentId, result.errorMessage || "Payment declined or cancelled"],
      );
      return toPaymentDto(updated[0]);
    }

    return toPaymentDto(payment);
  });
}

/**
 * Handles incoming gateway webhooks with cryptographic HMAC signature verification
 * and durable event deduplication.
 */
export async function handleWebhook(rawBody: Buffer | string, signature?: string) {
  const provider = getPaymentProvider();

  const isValid = provider.verifyWebhookSignature(rawBody, signature);
  if (!isValid) {
    throw new AppError("Invalid or missing webhook signature", 401);
  }

  const payloadString = Buffer.isBuffer(rawBody) ? rawBody.toString("utf-8") : String(rawBody);
  let parsedJson: unknown;
  try {
    parsedJson = JSON.parse(payloadString);
  } catch {
    throw new AppError("Invalid JSON webhook body", 400);
  }

  const event = provider.parseWebhookPayload(parsedJson);

  return withTransaction(async (client: PoolClient) => {
    // 1. Durable event deduplication
    const { rowCount } = await client.query(
      `INSERT INTO webhook_events (event_id, event_type, payload)
       VALUES ($1, $2, $3)
       ON CONFLICT (event_id) DO NOTHING`,
      [event.eventId, event.eventType, JSON.stringify(parsedJson)],
    );

    if (rowCount === 0) {
      // Event has already been processed idempotently
      return { success: true, duplicate: true };
    }

    // 2. Find matching payment record
    const { rows: payments } = await client.query(
      `SELECT p.*, b.charger_id, c.host_id
       FROM payments p
       JOIN bookings b ON b.id = p.booking_id
       JOIN chargers c ON c.id = b.charger_id
       WHERE p.provider_reference = $1
       FOR UPDATE OF p`,
      [event.providerReference],
    );

    const payment = payments[0];
    if (!payment) {
      // Record event but log missing payment
      return { success: true, warning: "Payment record not found for provider reference" };
    }

    // If payment is already succeeded, do not downgrade
    if (payment.status === "SUCCEEDED") {
      return { success: true, message: "Payment already succeeded" };
    }

    if (event.status === "SUCCEEDED") {
      await client.query(
        `UPDATE payments
         SET status = 'SUCCEEDED', provider_status = 'SUCCEEDED', completed_at = now(), error_message = NULL
         WHERE id = $1`,
        [payment.id],
      );

      // Ensure host payout is pending
      await client.query(
        `INSERT INTO host_payouts (
           booking_id, host_id, provider, amount, currency, status,
           commission_rate, commission_amount, net_amount
         ) VALUES ($1, $2, 'TELEBIRR', $3, 'ETB', 'PENDING', 0.0000, 0.00, $3)
         ON CONFLICT (booking_id) DO NOTHING`,
        [payment.booking_id, payment.host_id, payment.amount],
      );
    } else if (event.status === "FAILED") {
      await client.query(
        `UPDATE payments
         SET status = 'FAILED', provider_status = 'FAILED', error_message = $2
         WHERE id = $1`,
        [payment.id, event.errorMessage || "Payment failed via webhook notification"],
      );
    }

    return { success: true, paymentId: payment.id, newStatus: event.status };
  });
}
