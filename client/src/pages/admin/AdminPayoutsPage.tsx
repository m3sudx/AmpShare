import { useEffect, useState } from "react";
import {
  Banknote,
  CheckCircle2,
  CircleAlert,
  CircleCheck,
  Clock,
  Loader2,
  RefreshCw,
  Search,
  ShieldCheck,
  X,
} from "lucide-react";
import { listAdminPayouts, recordManualPayout } from "../../services/host-payouts.api";
import type { AdminPayoutsOverview, HostPayout } from "../../types/payment";
import { formatEtb } from "../../utils/booking";
import { getErrorMessage } from "../../utils/errors";
import { formatDate } from "../../utils/format";

type TabFilter = "ALL" | "PENDING" | "PAID";

export default function AdminPayoutsPage() {
  const [data, setData] = useState<AdminPayoutsOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<TabFilter>("ALL");
  const [search, setSearch] = useState("");

  const [payoutTarget, setPayoutTarget] = useState<HostPayout | null>(null);
  const [refInput, setRefInput] = useState("");
  const [notesInput, setNotesInput] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [dialogError, setDialogError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    listAdminPayouts()
      .then((res) => {
        if (!cancelled) {
          setData(res);
          setLoading(false);
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(getErrorMessage(err, "Failed to load host payouts."));
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [attempt]);

  const refreshPayouts = () => {
    setLoading(true);
    setAttempt((n) => n + 1);
  };

  const handleOpenDialog = (payout: HostPayout) => {
    setPayoutTarget(payout);
    setRefInput("");
    setNotesInput("");
    setDialogError(null);
  };

  const handleCloseDialog = () => {
    setPayoutTarget(null);
    setDialogError(null);
  };

  const handleRecordPayout = async () => {
    if (!payoutTarget) return;
    const ref = refInput.trim();
    if (!ref) {
      setDialogError("Please enter the Telebirr transfer or bank transaction reference");
      return;
    }

    setSubmitting(true);
    setDialogError(null);
    try {
      await recordManualPayout(payoutTarget.id, {
        providerReference: ref,
        notes: notesInput.trim() || undefined,
      });
      setNotice(`Payout of ${formatEtb(payoutTarget.netAmount)} to ${payoutTarget.hostName || "host"} recorded successfully!`);
      handleCloseDialog();
      refreshPayouts();
    } catch (err) {
      setDialogError(getErrorMessage(err, "Failed to record payout."));
    } finally {
      setSubmitting(false);
    }
  };

  const filteredPayouts = (data?.payouts || []).filter((p) => {
    if (tab === "PENDING" && p.status !== "PENDING") return false;
    if (tab === "PAID" && p.status !== "PAID") return false;

    if (search.trim()) {
      const s = search.toLowerCase();
      const host = (p.hostName || "").toLowerCase();
      const phone = (p.hostPhone || "").toLowerCase();
      const charger = (p.chargerTitle || "").toLowerCase();
      const ref = (p.providerReference || "").toLowerCase();
      return host.includes(s) || phone.includes(s) || charger.includes(s) || ref.includes(s);
    }
    return true;
  });

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-md bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-800">
              <ShieldCheck className="h-3.5 w-3.5" />
              Admin Portal
            </span>
          </div>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Host Payout Management
          </h1>
          <p className="text-sm text-slate-500">
            Track customer payments collected by AmpShare and record external Telebirr payouts to hosts.
          </p>
        </div>
        <button
          type="button"
          onClick={refreshPayouts}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </header>

      {notice && (
        <div
          role="status"
          className="flex items-center justify-between gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-3.5 text-sm text-emerald-800"
        >
          <span className="flex items-center gap-2 font-medium">
            <CircleCheck className="h-4 w-4" />
            {notice}
          </span>
          <button type="button" onClick={() => setNotice(null)} aria-label="Dismiss">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Financial Overview Cards */}
      <section aria-label="Financial Overview" className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <p className="text-xs font-semibold uppercase text-slate-500">Total Customer Collections</p>
          <p className="mt-2 text-3xl font-extrabold text-slate-900">
            {formatEtb(data?.overview.totalCollected ?? 0)}
          </p>
          <p className="mt-1 text-xs text-emerald-700 font-medium">Verified customer payments</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <p className="text-xs font-semibold uppercase text-slate-500">Total Paid Out to Hosts</p>
          <p className="mt-2 text-3xl font-extrabold text-[#0F9468]">
            {formatEtb(data?.overview.totalPaidOut ?? 0)}
          </p>
          <p className="mt-1 text-xs text-slate-500">Completed manual payouts</p>
        </div>
        <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-5 shadow-xs">
          <p className="text-xs font-semibold uppercase text-amber-800">Pending Host Payouts</p>
          <p className="mt-2 text-3xl font-extrabold text-amber-900">
            {formatEtb(data?.overview.totalPendingPayout ?? 0)}
          </p>
          <p className="mt-1 text-xs text-amber-700">Awaiting external transfer recording</p>
        </div>
      </section>

      {/* Filter and search bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-2">
          {(["ALL", "PENDING", "PAID"] as TabFilter[]).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={`rounded-xl px-4 py-2 text-xs font-semibold transition-colors ${
                tab === t
                  ? "bg-[#0F9468] text-white shadow-xs"
                  : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
              }`}
            >
              {t === "ALL" ? "All Payouts" : t === "PENDING" ? "Pending Payout" : "Completed Payouts"}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="pointer-events-none absolute inset-y-0 left-0 my-auto ml-3 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search host, phone, station..."
            className="w-full rounded-xl border border-slate-200 bg-white py-2 pr-3 pl-9 text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:border-[#0F9468] focus:ring-1 focus:ring-[#0F9468] focus:outline-none"
          />
        </div>
      </div>

      {loading && !data && (
        <div className="flex flex-col items-center justify-center p-12 text-slate-400 space-y-2">
          <Loader2 className="h-8 w-8 animate-spin text-[#0F9468]" />
          <p className="text-sm">Loading payout records...</p>
        </div>
      )}

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center space-y-3">
          <CircleAlert className="h-8 w-8 mx-auto text-red-500" />
          <p className="text-sm text-red-700">{error}</p>
          <button
            type="button"
            onClick={refreshPayouts}
            className="rounded-xl bg-red-600 px-4 py-2 text-xs font-semibold text-white hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      )}

      {/* Payouts Table */}
      {data && (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          {filteredPayouts.length === 0 ? (
            <div className="p-12 text-center text-sm text-slate-500">
              No host payout records found matching your filters.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="bg-slate-50 text-xs font-semibold uppercase text-slate-500 border-b border-slate-200">
                  <tr>
                    <th className="px-5 py-3">Host & Phone</th>
                    <th className="px-5 py-3">Charger Station</th>
                    <th className="px-5 py-3">Session Amount</th>
                    <th className="px-5 py-3">Customer Payment</th>
                    <th className="px-5 py-3">Payout Status</th>
                    <th className="px-5 py-3">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredPayouts.map((p) => {
                    const isCustomerPaid = p.customerPaymentStatus === "SUCCEEDED";
                    const isPending = p.status === "PENDING";
                    const isPaid = p.status === "PAID";

                    return (
                      <tr key={p.id} className="hover:bg-slate-50/60">
                        <td className="px-5 py-4">
                          <p className="font-semibold text-slate-900">{p.hostName || "Station Host"}</p>
                          <p className="text-xs text-slate-500 font-mono">{p.hostPhone || "—"}</p>
                        </td>
                        <td className="px-5 py-4">
                          <p className="font-medium text-slate-900">{p.chargerTitle || "Charger"}</p>
                          <p className="text-xs text-slate-400">{formatDate(p.createdAt)}</p>
                        </td>
                        <td className="px-5 py-4">
                          <p className="font-bold text-slate-900">{formatEtb(p.netAmount)}</p>
                          <p className="text-[11px] text-slate-400">Commission: 0%</p>
                        </td>
                        <td className="px-5 py-4">
                          {isCustomerPaid ? (
                            <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700">
                              <CheckCircle2 className="h-3.5 w-3.5" />
                              Customer Paid
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700">
                              <Clock className="h-3.5 w-3.5" />
                              Unpaid
                            </span>
                          )}
                          {p.customerPaymentReference && (
                            <p className="text-[10px] font-mono text-slate-400 truncate max-w-[120px]">
                              {p.customerPaymentReference}
                            </p>
                          )}
                        </td>
                        <td className="px-5 py-4">
                          {isPaid ? (
                            <div>
                              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-200">
                                Paid Out
                              </span>
                              {p.providerReference && (
                                <p className="mt-0.5 font-mono text-[11px] text-slate-500">
                                  Ref: {p.providerReference}
                                </p>
                              )}
                            </div>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-700 ring-1 ring-inset ring-amber-200">
                              Pending Transfer
                            </span>
                          )}
                        </td>
                        <td className="px-5 py-4">
                          {isPending ? (
                            <button
                              type="button"
                              onClick={() => handleOpenDialog(p)}
                              disabled={!isCustomerPaid}
                              className={`rounded-xl px-3.5 py-1.5 text-xs font-semibold shadow-xs ${
                                isCustomerPaid
                                  ? "bg-[#0F9468] text-white hover:bg-[#0c7d58]"
                                  : "bg-slate-100 text-slate-400 cursor-not-allowed"
                              }`}
                              title={
                                !isCustomerPaid
                                  ? "Customer has not paid for this session yet"
                                  : "Record external transfer to host"
                              }
                            >
                              Record Payout
                            </button>
                          ) : (
                            <span className="text-xs text-slate-400 italic">Completed</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Record Manual Payout Modal */}
      {payoutTarget && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="record-payout-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs"
        >
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl ring-1 ring-slate-900/5 sm:p-8 space-y-5">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-[#0F9468]">
                  <Banknote className="h-6 w-6" />
                </div>
                <div>
                  <h2 id="record-payout-title" className="text-lg font-bold text-slate-900">
                    Record Manual Host Payout
                  </h2>
                  <p className="text-xs text-slate-500">Confirm external Telebirr transfer</p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleCloseDialog}
                className="rounded-full p-1 text-slate-400 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Recipient Host:</span>
                <span className="font-semibold text-slate-900">{payoutTarget.hostName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Host Telebirr Phone:</span>
                <span className="font-mono font-semibold text-slate-900">{payoutTarget.hostPhone}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Station:</span>
                <span className="font-medium text-slate-900">{payoutTarget.chargerTitle}</span>
              </div>
              <div className="flex justify-between border-t border-slate-200 pt-2 text-sm font-bold">
                <span>Net Transfer Amount:</span>
                <span className="text-[#0F9468]">{formatEtb(payoutTarget.netAmount)}</span>
              </div>
            </div>

            <div>
              <label htmlFor="payout-ref" className="block text-xs font-semibold text-slate-700">
                Telebirr Transfer Reference / Tx ID *
              </label>
              <input
                id="payout-ref"
                type="text"
                value={refInput}
                onChange={(e) => setRefInput(e.target.value)}
                placeholder="e.g. MP241024.1234.A01234"
                className="mt-1.5 block w-full rounded-xl border border-slate-300 py-2.5 px-3 text-sm font-mono text-slate-900 focus:border-[#0F9468] focus:ring-1 focus:ring-[#0F9468] focus:outline-none"
              />
            </div>

            <div>
              <label htmlFor="payout-notes" className="block text-xs font-semibold text-slate-700">
                Notes / Memo (Optional)
              </label>
              <textarea
                id="payout-notes"
                rows={2}
                value={notesInput}
                onChange={(e) => setNotesInput(e.target.value)}
                placeholder="Transferred via business Telebirr account..."
                className="mt-1.5 block w-full rounded-xl border border-slate-300 py-2 px-3 text-xs text-slate-900 focus:border-[#0F9468] focus:ring-1 focus:ring-[#0F9468] focus:outline-none"
              />
            </div>

            {dialogError && (
              <p className="rounded-xl border border-red-200 bg-red-50 p-2.5 text-xs text-red-600 font-medium">
                {dialogError}
              </p>
            )}

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={handleCloseDialog}
                disabled={submitting}
                className="flex-1 rounded-xl border border-slate-200 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleRecordPayout}
                disabled={submitting}
                className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-[#0F9468] py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-[#0c7d58] disabled:opacity-60"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Recording...
                  </>
                ) : (
                  "Confirm Payout"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
