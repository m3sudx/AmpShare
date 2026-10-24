import { useEffect, useState } from "react";
import { CheckCircle2, Clock, CreditCard, Loader2, RefreshCw, Smartphone } from "lucide-react";
import { getPaymentForBooking, verifyPayment } from "../../services/payments.api";
import type { BookingPaymentDetails } from "../../types/payment";
import { formatEtb } from "../../utils/booking";
import { formatDate, formatTime } from "../../utils/format";
import DirectPaymentModal from "./DirectPaymentModal";

interface PaymentSectionProps {
  bookingId: string;
  finalCost: number | null;
  isDriver: boolean;
  defaultPhone?: string;
  onPaymentSuccess?: () => void;
}

export default function PaymentSection({
  bookingId,
  finalCost,
  isDriver,
  defaultPhone = "",
  onPaymentSuccess,
}: PaymentSectionProps) {
  const [details, setDetails] = useState<BookingPaymentDetails | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [verifying, setVerifying] = useState(false);

  const refreshPayment = () => {
    getPaymentForBooking(bookingId)
      .then((res) => setDetails(res))
      .catch(() => setDetails(null));
  };

  useEffect(() => {
    let cancelled = false;
    getPaymentForBooking(bookingId)
      .then((res) => {
        if (!cancelled) setDetails(res);
      })
      .catch(() => {
        if (!cancelled) setDetails(null);
      });
    return () => {
      cancelled = true;
    };
  }, [bookingId]);

  const handleVerifyLatest = async (paymentId: string) => {
    setVerifying(true);
    try {
      const updated = await verifyPayment(paymentId);
      refreshPayment();
      if (updated.status === "SUCCEEDED" && onPaymentSuccess) {
        onPaymentSuccess();
      }
    } finally {
      setVerifying(false);
    }
  };

  if (finalCost === null || finalCost <= 0) {
    return (
      <section aria-labelledby="payment-heading" className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 id="payment-heading" className="text-base font-semibold text-slate-900 flex items-center gap-2">
          <CreditCard className="h-4 w-4 text-slate-400" />
          Payment
        </h2>
        <p className="mt-2 text-sm text-slate-500">
          Payment will be calculated and ready once the charging session finishes.
        </p>
      </section>
    );
  }

  const latest = details?.latestPayment;
  const isPaid = details?.isPaid || latest?.status === "SUCCEEDED";
  const isPending = latest?.status === "PENDING";
  const isFailed = latest?.status === "FAILED";

  return (
    <section aria-labelledby="payment-heading" className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <h2 id="payment-heading" className="text-base font-semibold text-slate-900 flex items-center gap-2">
          <CreditCard className="h-4 w-4 text-[#0F9468]" />
          Payment Status
        </h2>
        {isPaid ? (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700 ring-1 ring-inset ring-emerald-200">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
            Paid
          </span>
        ) : isPending ? (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700 ring-1 ring-inset ring-amber-200">
            <Clock className="h-3.5 w-3.5 text-amber-600 animate-pulse" />
            Authorization Pending
          </span>
        ) : isFailed ? (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-3 py-1 text-xs font-bold text-red-700 ring-1 ring-inset ring-red-200">
            Declined
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700 ring-1 ring-inset ring-slate-200">
            Awaiting Payment
          </span>
        )}
      </div>

      <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-t border-slate-100 pt-4">
        <div>
          <p className="text-xs font-semibold uppercase text-slate-500">Amount Due</p>
          <p className="text-2xl font-black text-slate-900">{formatEtb(finalCost)}</p>
          <p className="text-xs text-slate-500">Includes all delivered energy</p>
        </div>

        {isPaid ? (
          <div className="text-right text-xs text-slate-600 space-y-0.5">
            <p className="font-semibold text-emerald-700">Verified via Telebirr</p>
            {latest?.providerReference && (
              <p className="font-mono text-slate-500">Ref: {latest.providerReference}</p>
            )}
            {latest?.completedAt && (
              <p className="text-slate-400">
                {formatDate(latest.completedAt)} at {formatTime(latest.completedAt)}
              </p>
            )}
          </div>
        ) : isDriver ? (
          <div className="flex flex-wrap items-center gap-2">
            {isPending && latest && (
              <button
                type="button"
                onClick={() => handleVerifyLatest(latest.id)}
                disabled={verifying}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
              >
                {verifying ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <RefreshCw className="h-3.5 w-3.5" />
                )}
                Check Status
              </button>
            )}
            <button
              type="button"
              onClick={() => setModalOpen(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-[#0F9468] px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-[#0c7d58] focus:ring-2 focus:ring-[#0F9468] focus:outline-none"
            >
              <Smartphone className="h-4 w-4" />
              {isPending ? "Authorize on Phone" : isFailed ? "Retry with Telebirr" : "Pay with Telebirr"}
            </button>
          </div>
        ) : (
          <p className="text-sm text-slate-500 italic">Waiting for customer to complete payment.</p>
        )}
      </div>

      {latest?.errorMessage && isFailed && (
        <div className="mt-3 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700">
          <p className="font-semibold">Payment attempt failed:</p>
          <p className="mt-0.5">{latest.errorMessage}</p>
        </div>
      )}

      {modalOpen && (
        <DirectPaymentModal
          bookingId={bookingId}
          amount={finalCost}
          defaultPhone={latest?.customerPhone || defaultPhone}
          onClose={() => setModalOpen(false)}
          onSuccess={() => {
            refreshPayment();
            if (onPaymentSuccess) onPaymentSuccess();
          }}
        />
      )}
    </section>
  );
}
