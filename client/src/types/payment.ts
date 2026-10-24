export type PaymentStatus = "PENDING" | "SUCCEEDED" | "FAILED" | "REFUNDED";
export type PayoutStatus = "PENDING" | "PROCESSING" | "PAID" | "FAILED";

export interface Payment {
  id: string;
  bookingId: string;
  provider: string;
  providerReference: string | null;
  idempotencyKey: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  customerPhone: string | null;
  errorMessage: string | null;
  completedAt: string | null;
  createdAt: string;
}

export interface BookingPaymentDetails {
  bookingId: string;
  finalCost: number;
  isPaid: boolean;
  canPay: boolean;
  latestPayment: Payment | null;
  payments: Payment[];
}

export interface HostPayout {
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
  status: PayoutStatus;
  paidAt: string | null;
  adminId: string | null;
  notes: string | null;
  createdAt: string;
  chargerTitle?: string;
  hostName?: string;
  hostPhone?: string;
  customerPaymentStatus?: string;
  customerPaymentReference?: string | null;
}

export interface HostEarningsSummary {
  summary: {
    totalEarnings: number;
    paidOutAmount: number;
    pendingPayoutAmount: number;
    currency: string;
  };
  payouts: HostPayout[];
}

export interface AdminPayoutsOverview {
  overview: {
    totalCollected: number;
    totalPaidOut: number;
    totalPendingPayout: number;
    currency: string;
  };
  payouts: HostPayout[];
}
