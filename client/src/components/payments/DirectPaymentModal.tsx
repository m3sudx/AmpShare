import { useEffect, useState } from "react";
import {
  CheckCircle2,
  Clock,
  Loader2,
  Phone,
  RefreshCw,
  Smartphone,
  X,
  XCircle,
} from "lucide-react";
import { initiatePayment, verifyPayment } from "../../services/payments.api";
import type { Payment } from "../../types/payment";
import { formatEtb } from "../../utils/booking";
import { getErrorMessage } from "../../utils/errors";

interface DirectPaymentModalProps {
  bookingId: string;
  amount: number;
  defaultPhone?: string;
  onClose: () => void;
  onSuccess: (payment: Payment) => void;
}

type PaymentFlowState =
  | { step: "confirm_phone" }
  | { step: "initiating" }
  | { step: "awaiting_approval"; payment: Payment; secondsLeft: number }
  | { step: "success"; payment: Payment }
  | { step: "failed"; message: string; payment?: Payment };

export default function DirectPaymentModal({
  bookingId,
  amount,
  defaultPhone = "",
  onClose,
  onSuccess,
}: DirectPaymentModalProps) {
  const [phone, setPhone] = useState(defaultPhone);
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [state, setState] = useState<PaymentFlowState>({ step: "confirm_phone" });
  const [isVerifying, setIsVerifying] = useState(false);

  const awaitingPaymentId = state.step === "awaiting_approval" ? state.payment.id : null;

  const handleClose = () => {
    if (state.step === "success") {
      onSuccess(state.payment);
    }
    onClose();
  };

  // Auto-polling for transaction verification during awaiting_approval step
  useEffect(() => {
    if (!awaitingPaymentId) return;

    let cancelled = false;

    // Tick countdown timer
    const countdownTimer = setInterval(() => {
      setState((prev) => {
        if (prev.step !== "awaiting_approval") return prev;
        if (prev.secondsLeft <= 1) {
          clearInterval(countdownTimer);
          return {
            step: "failed",
            message:
              "Authorization timed out. If you already entered your PIN, please click 'Check Status' or try again.",
            payment: prev.payment,
          };
        }
        return { ...prev, secondsLeft: prev.secondsLeft - 1 };
      });
    }, 1000);

    // Poll payment status every 3.5 seconds
    const pollTimer = setInterval(async () => {
      if (cancelled) return;
      try {
        const verified = await verifyPayment(awaitingPaymentId);
        if (cancelled) return;

        if (verified.status === "SUCCEEDED") {
          clearInterval(pollTimer);
          clearInterval(countdownTimer);
          setState({ step: "success", payment: verified });
        } else if (verified.status === "FAILED") {
          clearInterval(pollTimer);
          clearInterval(countdownTimer);
          setState({
            step: "failed",
            message: verified.errorMessage || "Telebirr payment was declined or canceled.",
            payment: verified,
          });
        }
      } catch {
        // Continue polling until countdown expires
      }
    }, 3500);

    return () => {
      cancelled = true;
      clearInterval(countdownTimer);
      clearInterval(pollTimer);
    };
  }, [awaitingPaymentId]);

  async function handleStartPayment() {
    const trimmed = phone.trim();
    if (!trimmed) {
      setPhoneError("Phone number is required");
      return;
    }
    setPhoneError(null);
    setState({ step: "initiating" });

    try {
      const response = await initiatePayment(bookingId, trimmed);
      const payment = response.payment;

      if (payment.status === "SUCCEEDED") {
        setState({ step: "success", payment });
      } else if (payment.status === "FAILED") {
        setState({
          step: "failed",
          message: payment.errorMessage || "Telebirr payment was declined.",
          payment,
        });
      } else {
        // Awaiting direct mobile USSD prompt / PIN authorization
        setState({
          step: "awaiting_approval",
          payment,
          secondsLeft: 60,
        });
      }
    } catch (err: unknown) {
      setState({
        step: "failed",
        message: getErrorMessage(err, "Failed to initiate payment. Please check your connection and try again."),
      });
    }
  }

  async function handleManualVerify() {
    const paymentId =
      state.step === "awaiting_approval"
        ? state.payment.id
        : state.step === "failed" && state.payment
        ? state.payment.id
        : null;

    if (!paymentId) return;

    setIsVerifying(true);
    try {
      const verified = await verifyPayment(paymentId);
      if (verified.status === "SUCCEEDED") {
        setState({ step: "success", payment: verified });
      } else if (verified.status === "FAILED") {
        setState({
          step: "failed",
          message: verified.errorMessage || "Payment was declined by the provider.",
          payment: verified,
        });
      }
    } catch {
      // keep current state
    } finally {
      setIsVerifying(false);
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="payment-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs"
    >
      <div className="relative w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl ring-1 ring-slate-900/5 sm:p-8">
        <button
          type="button"
          onClick={handleClose}
          className="absolute top-5 right-5 rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          aria-label="Close payment modal"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Step 1: Confirm phone number */}
        {state.step === "confirm_phone" && (
          <div className="space-y-5">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#0F9468]/10 text-[#0F9468]">
                <Smartphone className="h-6 w-6" />
              </div>
              <div>
                <h2 id="payment-modal-title" className="text-xl font-bold text-slate-900">
                  Pay with Telebirr
                </h2>
                <p className="text-xs text-slate-500">Direct mobile prompt payment</p>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-100 bg-slate-50/80 p-4">
              <p className="text-xs font-semibold uppercase text-slate-500">Total Amount Due</p>
              <p className="mt-1 text-2xl font-black text-slate-900">{formatEtb(amount)}</p>
            </div>

            <div>
              <label htmlFor="customer-phone" className="block text-sm font-semibold text-slate-700">
                Telebirr Mobile Number
              </label>
              <div className="relative mt-2">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                  <Phone className="h-4 w-4" />
                </div>
                <input
                  id="customer-phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="0911234567"
                  className="block w-full rounded-xl border border-slate-300 py-2.5 pr-3 pl-10 text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:border-[#0F9468] focus:ring-2 focus:ring-[#0F9468]/20 focus:outline-none"
                />
              </div>
              {phoneError && <p className="mt-1.5 text-xs text-red-600">{phoneError}</p>}
              <p className="mt-2 text-xs text-slate-500">
                A prompt will appear directly on your phone. Enter your Telebirr PIN to authorize the payment.
              </p>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 rounded-xl border border-slate-200 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleStartPayment}
                className="flex-1 rounded-xl bg-[#0F9468] py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-[#0c7d58] focus:ring-2 focus:ring-[#0F9468] focus:outline-none"
              >
                Send Prompt
              </button>
            </div>
          </div>
        )}

        {/* Step: Initiating */}
        {state.step === "initiating" && (
          <div className="flex flex-col items-center py-8 text-center space-y-4">
            <Loader2 className="h-12 w-12 animate-spin text-[#0F9468]" />
            <h2 className="text-lg font-bold text-slate-900">Connecting to Telebirr...</h2>
            <p className="max-w-xs text-xs text-slate-500">
              Initializing direct payment prompt with ePay Ethiopia gateway. Please wait...
            </p>
          </div>
        )}

        {/* Step 2: Awaiting Authorization Prompt */}
        {state.step === "awaiting_approval" && (
          <div className="flex flex-col items-center text-center space-y-4">
            <div className="relative">
              <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-emerald-50 text-[#0F9468] ring-8 ring-emerald-50/50 animate-pulse">
                <Smartphone className="h-8 w-8" />
              </div>
              <span className="absolute -top-1 -right-1 flex h-4 w-4">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex h-4 w-4 rounded-full bg-[#0F9468]"></span>
              </span>
            </div>

            <div>
              <h2 className="text-xl font-bold text-slate-900">Check Your Phone</h2>
              <p className="mt-1 text-sm font-medium text-emerald-800">
                Telebirr authorization prompt sent to <span className="font-bold">{phone}</span>
              </p>
            </div>

            <div className="w-full rounded-2xl border border-emerald-100 bg-emerald-50/60 p-4 text-xs text-slate-700 space-y-1.5 text-left">
              <div className="flex justify-between font-semibold">
                <span>Amount:</span>
                <span className="text-slate-900">{formatEtb(amount)}</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>Reference:</span>
                <span className="font-mono">{state.payment.providerReference}</span>
              </div>
              <p className="mt-2 text-slate-600 border-t border-emerald-100 pt-2 text-[11px]">
                Please enter your Telebirr PIN on your phone to complete this charge. AmpShare will automatically detect the payment.
              </p>
            </div>

            <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
              <Clock className="h-4 w-4 text-slate-400" />
              <span>Prompt expires in {state.secondsLeft}s</span>
            </div>

            <div className="w-full space-y-2 pt-2">
              <button
                type="button"
                onClick={handleManualVerify}
                disabled={isVerifying}
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-[#0F9468] py-2.5 text-sm font-semibold text-white hover:bg-[#0c7d58] disabled:opacity-60"
              >
                {isVerifying ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Checking...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4" />
                    I've Approved on My Phone
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="w-full rounded-xl py-2 text-xs font-medium text-slate-500 hover:text-slate-800"
              >
                Close and check later
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Success */}
        {state.step === "success" && (
          <div className="flex flex-col items-center py-4 text-center space-y-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-emerald-100 text-emerald-600">
              <CheckCircle2 className="h-10 w-10" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">Payment Verified!</h2>
              <p className="mt-1 text-sm text-slate-600">
                Your payment of <span className="font-bold">{formatEtb(amount)}</span> has been confirmed.
              </p>
            </div>

            <div className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-3.5 text-xs text-slate-600 text-left space-y-1">
              <div className="flex justify-between">
                <span>Method:</span>
                <span className="font-semibold text-slate-900">Telebirr Direct</span>
              </div>
              <div className="flex justify-between">
                <span>Ref Code:</span>
                <span className="font-mono text-slate-900">{state.payment.providerReference}</span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleClose}
              className="w-full rounded-xl bg-[#0F9468] py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-[#0c7d58]"
            >
              Done
            </button>
          </div>
        )}

        {/* Step 4: Failed */}
        {state.step === "failed" && (
          <div className="flex flex-col items-center py-4 text-center space-y-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-red-100 text-red-600">
              <XCircle className="h-10 w-10" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">Payment Not Completed</h2>
              <p className="mt-1 text-xs text-red-600 max-w-xs">{state.message}</p>
            </div>

            <div className="flex w-full gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 rounded-xl border border-slate-200 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => setState({ step: "confirm_phone" })}
                className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-[#0F9468] py-2.5 text-sm font-semibold text-white hover:bg-[#0c7d58]"
              >
                <RefreshCw className="h-4 w-4" />
                Retry Payment
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
