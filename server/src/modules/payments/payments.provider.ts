import crypto from "crypto";
import { AppError } from "../../utils/app-error";

export interface InitiatePaymentParams {
  bookingId: string;
  amount: number;
  currency: string;
  customerPhone: string;
  idempotencyKey: string;
  merchantReference: string;
  description: string;
  metadata?: Record<string, unknown>;
}

export interface ProviderInitiateResult {
  success: boolean;
  providerReference: string;
  providerStatus: "PENDING" | "SUCCEEDED" | "FAILED";
  checkoutUrl?: string;
  instructions: string;
  rawResponse?: unknown;
}

export interface ProviderVerifyResult {
  providerReference: string;
  merchantReference: string;
  status: "PENDING" | "SUCCEEDED" | "FAILED";
  amount: number;
  currency: string;
  paidAt?: string;
  errorMessage?: string;
  rawResponse?: unknown;
}

export interface NormalizedWebhookEvent {
  eventId: string;
  eventType: string;
  providerReference: string;
  merchantReference: string;
  status: "PENDING" | "SUCCEEDED" | "FAILED";
  amount: number;
  currency: string;
  paidAt?: string;
  errorMessage?: string;
  rawPayload: unknown;
}

export interface PaymentProvider {
  readonly name: string;
  readonly isMock: boolean;
  initiateDirectPayment(params: InitiatePaymentParams): Promise<ProviderInitiateResult>;
  verifyTransaction(providerReference: string): Promise<ProviderVerifyResult>;
  verifyWebhookSignature(rawBody: Buffer | string, signatureHeader?: string): boolean;
  parseWebhookPayload(body: unknown): NormalizedWebhookEvent;
}

/**
 * Real ePay Ethiopia Direct Payment Provider.
 * Integrates with Telebirr via ePay Ethiopia's direct-payment REST API.
 */
export class EPayDirectProvider implements PaymentProvider {
  readonly name = "ePay Ethiopia (Telebirr Direct)";
  readonly isMock = false;

  private baseUrl: string;
  private secretKey: string;
  private webhookSecret: string;

  constructor() {
    this.baseUrl = (process.env.EPAY_API_BASE_URL || "https://api.epayethiopia.com/v1").replace(/\/+$/, "");
    this.secretKey = process.env.EPAY_SECRET_KEY || "";
    this.webhookSecret = process.env.EPAY_WEBHOOK_SECRET || "";

    if (!this.secretKey) {
      throw new AppError("EPAY_SECRET_KEY is not configured for production payment provider", 500);
    }
  }

  async initiateDirectPayment(params: InitiatePaymentParams): Promise<ProviderInitiateResult> {
    const url = `${this.baseUrl}/transactions/direct`;
    const payload = {
      amount: Number(params.amount.toFixed(2)),
      currencyCode: params.currency || "ETB",
      customerPhone: params.customerPhone,
      pspCode: "TELEBIRR",
      merchantReference: params.merchantReference,
      description: params.description,
      metadata: params.metadata,
    };

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.secretKey}`,
          "x-idempotency-key": params.idempotencyKey,
        },
        body: JSON.stringify(payload),
      });

      const data = (await response.json().catch(() => ({}))) as Record<string, any>;

      if (!response.ok) {
        const errorMsg = data.message || data.error || `ePay direct payment failed with HTTP ${response.status}`;
        throw new AppError(errorMsg, 400);
      }

      const reference = data.reference || data.transactionId || data.id || params.merchantReference;
      const statusRaw = String(data.status || "").toUpperCase();
      let providerStatus: "PENDING" | "SUCCEEDED" | "FAILED" = "PENDING";
      if (["SUCCEEDED", "COMPLETED", "SUCCESS"].includes(statusRaw)) {
        providerStatus = "SUCCEEDED";
      } else if (["FAILED", "DECLINED", "CANCELLED"].includes(statusRaw)) {
        providerStatus = "FAILED";
      }

      return {
        success: true,
        providerReference: reference,
        providerStatus,
        checkoutUrl: data.checkoutUrl,
        instructions:
          data.instructions ||
          "Please check your phone. Telebirr has sent a payment authorization prompt to approve.",
        rawResponse: data,
      };
    } catch (err: unknown) {
      if (err instanceof AppError) throw err;
      throw new AppError(
        `Failed to reach ePay payment gateway: ${err instanceof Error ? err.message : String(err)}`,
        502,
      );
    }
  }

  async verifyTransaction(providerReference: string): Promise<ProviderVerifyResult> {
    const url = `${this.baseUrl}/transactions/${encodeURIComponent(providerReference)}/verify`;
    try {
      const response = await fetch(url, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${this.secretKey}`,
        },
      });

      const data = (await response.json().catch(() => ({}))) as Record<string, any>;
      if (!response.ok) {
        throw new AppError(
          data.message || `ePay transaction verification failed with status ${response.status}`,
          400,
        );
      }

      const statusRaw = String(data.status || "").toUpperCase();
      let status: "PENDING" | "SUCCEEDED" | "FAILED" = "PENDING";
      if (["SUCCEEDED", "COMPLETED", "SUCCESS", "PAID"].includes(statusRaw)) {
        status = "SUCCEEDED";
      } else if (["FAILED", "DECLINED", "CANCELLED", "EXPIRED"].includes(statusRaw)) {
        status = "FAILED";
      }

      return {
        providerReference: data.reference || providerReference,
        merchantReference: data.merchantReference || "",
        status,
        amount: Number(data.amount || 0),
        currency: data.currencyCode || "ETB",
        paidAt: data.paidAt || data.completedAt,
        errorMessage: data.failureReason || data.errorMessage,
        rawResponse: data,
      };
    } catch (err: unknown) {
      if (err instanceof AppError) throw err;
      throw new AppError(
        `Failed to verify transaction with ePay gateway: ${err instanceof Error ? err.message : String(err)}`,
        502,
      );
    }
  }

  verifyWebhookSignature(rawBody: Buffer | string, signatureHeader?: string): boolean {
    if (!signatureHeader || !this.webhookSecret) {
      return false;
    }

    const cleanSignature = signatureHeader.startsWith("sha256=")
      ? signatureHeader.slice(7).trim()
      : signatureHeader.trim();

    const hmac = crypto.createHmac("sha256", this.webhookSecret);
    hmac.update(rawBody);
    const expectedSignature = hmac.digest("hex");

    try {
      const sigBuf = Buffer.from(cleanSignature, "hex");
      const expBuf = Buffer.from(expectedSignature, "hex");
      if (sigBuf.length !== expBuf.length) return false;
      return crypto.timingSafeEqual(sigBuf, expBuf);
    } catch {
      return false;
    }
  }

  parseWebhookPayload(body: unknown): NormalizedWebhookEvent {
    const data = (body && typeof body === "object" ? body : {}) as Record<string, any>;
    const event = data.event || data.eventType || "payment.status";
    const payload = data.data || data.payload || data;

    const statusRaw = String(payload.status || "").toUpperCase();
    let status: "PENDING" | "SUCCEEDED" | "FAILED" = "PENDING";
    if (["SUCCEEDED", "COMPLETED", "SUCCESS", "PAID"].includes(statusRaw)) {
      status = "SUCCEEDED";
    } else if (["FAILED", "DECLINED", "CANCELLED", "EXPIRED"].includes(statusRaw)) {
      status = "FAILED";
    }

    const eventId = String(data.id || data.eventId || `${payload.reference || payload.id}-${Date.now()}`);

    return {
      eventId,
      eventType: event,
      providerReference: payload.reference || payload.id || "",
      merchantReference: payload.merchantReference || "",
      status,
      amount: Number(payload.amount || 0),
      currency: payload.currencyCode || "ETB",
      paidAt: payload.paidAt || payload.completedAt || new Date().toISOString(),
      errorMessage: payload.failureReason || payload.errorMessage,
      rawPayload: body,
    };
  }
}

/**
 * In-memory state store for the mock payment provider so that transactions
 * can be verified, simulated, and tested across HTTP requests.
 */
interface MockTx {
  providerReference: string;
  merchantReference: string;
  amount: number;
  currency: string;
  customerPhone: string;
  status: "PENDING" | "SUCCEEDED" | "FAILED";
  createdAt: number;
  failureReason?: string;
}

const mockTxStore = new Map<string, MockTx>();

/**
 * Safe Mock Payment Provider for local development, integration tests, and staging.
 * Strictly forbidden from running in production.
 */
export class MockPaymentProvider implements PaymentProvider {
  readonly name = "AmpShare Mock Telebirr Provider (Dev Only)";
  readonly isMock = true;

  private webhookSecret: string;

  constructor() {
    if (process.env.NODE_ENV === "production") {
      throw new AppError(
        "FATAL: MockPaymentProvider cannot be initialized in production environment! Configure real gateway credentials.",
        500,
      );
    }
    this.webhookSecret = process.env.EPAY_WEBHOOK_SECRET || "mock_webhook_secret_development_only";
  }

  async initiateDirectPayment(params: InitiatePaymentParams): Promise<ProviderInitiateResult> {
    const providerReference = `MOCK-TLB-${Date.now()}-${params.idempotencyKey.slice(0, 8)}`;

    // Magic phone numbers for testing:
    // - Ending in 00 or 1111: immediate decline / insufficient balance
    // - Ending in 99: permanently pending (to test timeout / background polling)
    // - All other phones: pending authorization prompt, will succeed on verify
    const phone = params.customerPhone.trim();
    let initialStatus: "PENDING" | "SUCCEEDED" | "FAILED" = "PENDING";
    let failureReason: string | undefined;

    if (phone.endsWith("00") || phone.endsWith("1111")) {
      initialStatus = "FAILED";
      failureReason = "Customer Telebirr account declined: Insufficient funds or PIN rejected.";
    }

    mockTxStore.set(providerReference, {
      providerReference,
      merchantReference: params.merchantReference,
      amount: params.amount,
      currency: params.currency,
      customerPhone: params.customerPhone,
      status: initialStatus,
      createdAt: Date.now(),
      failureReason,
    });

    return {
      success: initialStatus !== "FAILED",
      providerReference,
      providerStatus: initialStatus,
      instructions:
        initialStatus === "FAILED"
          ? "Mock payment simulation: Transaction declined."
          : `Mock Telebirr USSD prompt sent to ${params.customerPhone}. Enter PIN on your phone to complete payment.`,
      rawResponse: {
        mock: true,
        reference: providerReference,
        status: initialStatus,
        failureReason,
      },
    };
  }

  async verifyTransaction(providerReference: string): Promise<ProviderVerifyResult> {
    const tx = mockTxStore.get(providerReference);

    if (!tx) {
      // In tests where providerReference was created elsewhere or simulated
      return {
        providerReference,
        merchantReference: `MOCK-${providerReference}`,
        status: "SUCCEEDED",
        amount: 100,
        currency: "ETB",
        paidAt: new Date().toISOString(),
      };
    }

    // If phone ends in 99, it simulates a user taking long or timing out
    if (tx.customerPhone.endsWith("99")) {
      return {
        providerReference: tx.providerReference,
        merchantReference: tx.merchantReference,
        status: "PENDING",
        amount: tx.amount,
        currency: tx.currency,
      };
    }

    // If it was already failed, keep it failed
    if (tx.status === "FAILED") {
      return {
        providerReference: tx.providerReference,
        merchantReference: tx.merchantReference,
        status: "FAILED",
        amount: tx.amount,
        currency: tx.currency,
        errorMessage: tx.failureReason || "Payment failed",
      };
    }

    // Otherwise, direct prompt authorization succeeds
    tx.status = "SUCCEEDED";
    return {
      providerReference: tx.providerReference,
      merchantReference: tx.merchantReference,
      status: "SUCCEEDED",
      amount: tx.amount,
      currency: tx.currency,
      paidAt: new Date().toISOString(),
    };
  }

  verifyWebhookSignature(rawBody: Buffer | string, signatureHeader?: string): boolean {
    if (!signatureHeader || !this.webhookSecret) {
      return false;
    }

    const cleanSignature = signatureHeader.startsWith("sha256=")
      ? signatureHeader.slice(7).trim()
      : signatureHeader.trim();

    const hmac = crypto.createHmac("sha256", this.webhookSecret);
    hmac.update(rawBody);
    const expectedSignature = hmac.digest("hex");

    try {
      const sigBuf = Buffer.from(cleanSignature, "hex");
      const expBuf = Buffer.from(expectedSignature, "hex");
      if (sigBuf.length !== expBuf.length) return false;
      return crypto.timingSafeEqual(sigBuf, expBuf);
    } catch {
      return false;
    }
  }

  parseWebhookPayload(body: unknown): NormalizedWebhookEvent {
    const data = (body && typeof body === "object" ? body : {}) as Record<string, any>;
    const event = data.event || data.eventType || "payment.status";
    const payload = data.data || data.payload || data;

    const statusRaw = String(payload.status || "").toUpperCase();
    let status: "PENDING" | "SUCCEEDED" | "FAILED" = "PENDING";
    if (["SUCCEEDED", "COMPLETED", "SUCCESS", "PAID"].includes(statusRaw)) {
      status = "SUCCEEDED";
    } else if (["FAILED", "DECLINED", "CANCELLED", "EXPIRED"].includes(statusRaw)) {
      status = "FAILED";
    }

    const eventId = String(data.id || data.eventId || `mock-evt-${Date.now()}`);

    return {
      eventId,
      eventType: event,
      providerReference: payload.reference || payload.id || "",
      merchantReference: payload.merchantReference || "",
      status,
      amount: Number(payload.amount || 0),
      currency: payload.currencyCode || "ETB",
      paidAt: payload.paidAt || payload.completedAt || new Date().toISOString(),
      errorMessage: payload.failureReason || payload.errorMessage,
      rawPayload: body,
    };
  }
}

/**
 * Provider Singleton Factory
 */
let providerInstance: PaymentProvider | null = null;

export function getPaymentProvider(): PaymentProvider {
  if (providerInstance) return providerInstance;

  const isMock = process.env.EPAY_MOCK === "true" || process.env.NODE_ENV === "test";

  if (process.env.NODE_ENV === "production") {
    if (isMock) {
      throw new AppError(
        "FATAL CONFIG ERROR: EPAY_MOCK=true is strictly forbidden in production! Please configure live ePay credentials.",
        500,
      );
    }
    providerInstance = new EPayDirectProvider();
  } else {
    // In dev / test, prefer mock if EPAY_MOCK is true or EPAY_SECRET_KEY is missing
    if (isMock || !process.env.EPAY_SECRET_KEY) {
      providerInstance = new MockPaymentProvider();
    } else {
      providerInstance = new EPayDirectProvider();
    }
  }

  return providerInstance;
}

export function resetPaymentProvider(): void {
  providerInstance = null;
}
