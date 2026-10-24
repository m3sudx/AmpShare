import type { PoolClient } from "pg";
import { pool } from "../../config/db";
import { AppError } from "../../utils/app-error";
import { withTransaction } from "../../utils/db-helpers";

export interface HostPayoutDto {
  id: string;
  bookingId: string;
  hostId: string;
  provider: string;
  providerReference: string | null;
  amount: number;
  commissionRate: number;
  commissionAmount: number;
  netAmount: number;
  currency: string;
  status: "PENDING" | "PROCESSING" | "PAID" | "FAILED";
  paidAt: string | null;
  adminId: string | null;
  notes: string | null;
  createdAt: string;
  // Associated info
  chargerTitle?: string;
  hostName?: string;
  hostPhone?: string;
  customerPaymentStatus?: string;
  customerPaymentReference?: string | null;
}

function toPayoutDto(row: any): HostPayoutDto {
  return {
    id: row.id,
    bookingId: row.booking_id,
    hostId: row.host_id,
    provider: row.provider,
    providerReference: row.provider_reference,
    amount: Number(row.amount),
    commissionRate: Number(row.commission_rate ?? 0),
    commissionAmount: Number(row.commission_amount ?? 0),
    netAmount: Number(row.net_amount ?? row.amount),
    currency: row.currency.trim(),
    status: row.status,
    paidAt: row.paid_at ? new Date(row.paid_at).toISOString() : null,
    adminId: row.admin_id,
    notes: row.notes,
    createdAt: new Date(row.created_at).toISOString(),
    chargerTitle: row.charger_title,
    hostName: row.host_name,
    hostPhone: row.host_phone,
    customerPaymentStatus: row.customer_payment_status,
    customerPaymentReference: row.customer_payment_reference,
  };
}

/**
 * Returns earnings summary and payout history for an authenticated host.
 */
export async function getHostEarnings(hostId: string) {
  const { rows } = await pool.query(
    `SELECT hp.*,
            c.title AS charger_title,
            p.status AS customer_payment_status,
            p.provider_reference AS customer_payment_reference
     FROM host_payouts hp
     JOIN bookings b ON b.id = hp.booking_id
     JOIN chargers c ON c.id = b.charger_id
     LEFT JOIN payments p ON p.booking_id = b.id AND p.status = 'SUCCEEDED'
     WHERE hp.host_id = $1
     ORDER BY hp.created_at DESC`,
    [hostId],
  );

  let totalEarnings = 0;
  let paidOutAmount = 0;
  let pendingPayoutAmount = 0;

  for (const row of rows) {
    const net = Number(row.net_amount || row.amount);
    const isCustomerPaid = row.customer_payment_status === "SUCCEEDED";

    if (row.status === "PAID") {
      paidOutAmount += net;
      totalEarnings += net;
    } else if (row.status === "PENDING" && isCustomerPaid) {
      pendingPayoutAmount += net;
      totalEarnings += net;
    }
  }

  return {
    summary: {
      totalEarnings: Number(totalEarnings.toFixed(2)),
      paidOutAmount: Number(paidOutAmount.toFixed(2)),
      pendingPayoutAmount: Number(pendingPayoutAmount.toFixed(2)),
      currency: "ETB",
    },
    payouts: rows.map(toPayoutDto),
  };
}

/**
 * Lists all host payouts and platform financial metrics for authorized administrators.
 */
export async function listAdminPayouts(statusFilter?: string) {
  let query = `
    SELECT hp.*,
           u.full_name AS host_name,
           u.phone_number AS host_phone,
           c.title AS charger_title,
           c.address_description,
           b.final_cost,
           cs.energy_delivered_kwh,
           p.status AS customer_payment_status,
           p.provider_reference AS customer_payment_reference,
           p.completed_at AS customer_paid_at
    FROM host_payouts hp
    JOIN users u ON u.id = hp.host_id
    JOIN bookings b ON b.id = hp.booking_id
    JOIN chargers c ON c.id = b.charger_id
    LEFT JOIN charging_sessions cs ON cs.booking_id = b.id
    LEFT JOIN LATERAL (
      SELECT status, provider_reference, completed_at
      FROM payments
      WHERE booking_id = b.id
      ORDER BY (status = 'SUCCEEDED') DESC, created_at DESC
      LIMIT 1
    ) p ON true
  `;

  const params: any[] = [];
  if (statusFilter && ["PENDING", "PROCESSING", "PAID", "FAILED"].includes(statusFilter.toUpperCase())) {
    query += ` WHERE hp.status = $1`;
    params.push(statusFilter.toUpperCase());
  }

  query += ` ORDER BY hp.created_at DESC`;

  const { rows } = await pool.query(query, params);

  // Platform totals
  const { rows: metricsRows } = await pool.query(`
    SELECT
      COALESCE(SUM(CASE WHEN p.status = 'SUCCEEDED' THEN p.amount ELSE 0 END), 0) AS total_collected,
      COALESCE(SUM(CASE WHEN hp.status = 'PAID' THEN hp.net_amount ELSE 0 END), 0) AS total_paid_out,
      COALESCE(SUM(CASE WHEN hp.status = 'PENDING' AND p.status = 'SUCCEEDED' THEN hp.net_amount ELSE 0 END), 0) AS total_pending_payout
    FROM host_payouts hp
    LEFT JOIN payments p ON p.booking_id = hp.booking_id AND p.status = 'SUCCEEDED'
  `);

  const metrics = metricsRows[0] || {};

  return {
    overview: {
      totalCollected: Number(Number(metrics.total_collected || 0).toFixed(2)),
      totalPaidOut: Number(Number(metrics.total_paid_out || 0).toFixed(2)),
      totalPendingPayout: Number(Number(metrics.total_pending_payout || 0).toFixed(2)),
      currency: "ETB",
    },
    payouts: rows.map(toPayoutDto),
  };
}

/**
 * Records an external manual payout performed by an administrator.
 * Strictly verifies that the customer payment succeeded and that the payout is not duplicated.
 */
export async function recordManualPayout(
  adminId: string,
  payoutId: string,
  data: { providerReference: string; notes?: string },
) {
  return withTransaction(async (client: PoolClient) => {
    // 1. Lock host_payout row
    const { rows: payoutRows } = await client.query(
      `SELECT hp.*, b.status AS booking_status
       FROM host_payouts hp
       JOIN bookings b ON b.id = hp.booking_id
       WHERE hp.id = $1
       FOR UPDATE OF hp`,
      [payoutId],
    );

    const payout = payoutRows[0];
    if (!payout) {
      throw new AppError("Host payout record not found", 404);
    }

    if (payout.status === "PAID") {
      throw new AppError("This host payout has already been recorded as completed", 409);
    }

    // 2. Verify that the customer payment was verified and completed
    const { rows: paymentRows } = await client.query(
      `SELECT * FROM payments WHERE booking_id = $1 AND status = 'SUCCEEDED'`,
      [payout.booking_id],
    );

    if (paymentRows.length === 0) {
      throw new AppError(
        "Cannot record host payout: The customer payment for this session has not succeeded yet.",
        400,
      );
    }

    // 3. Prevent duplicate provider_reference
    const { rows: existingRef } = await client.query(
      `SELECT id FROM host_payouts WHERE provider_reference = $1 AND id <> $2`,
      [data.providerReference, payoutId],
    );
    if (existingRef.length > 0) {
      throw new AppError("This payment or transfer reference has already been used for another payout", 409);
    }

    // 4. Update payout record
    const { rows: updatedRows } = await client.query(
      `UPDATE host_payouts
       SET status = 'PAID',
           provider_reference = $1,
           paid_at = now(),
           admin_id = $2,
           notes = $3
       WHERE id = $4
       RETURNING *`,
      [data.providerReference.trim(), adminId, data.notes?.trim() || null, payoutId],
    );

    return toPayoutDto(updatedRows[0]);
  });
}
