import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import type { ChargingSession } from "../../types/booking";

interface FinishDialogProps {
  session: ChargingSession;
  busy: boolean;
  error: string | null;
  onClose: () => void;
  onSubmit: (energyKwh: number) => void;
}

export default function FinishSessionDialog({ session, busy, error, onClose, onSubmit }: FinishDialogProps) {
  const [value, setValue] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !busy) onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [busy, onClose]);

  const submit = (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (busy) return;
    const kwh = Number(value);
    if (value.trim() === "" || !Number.isFinite(kwh) || kwh < 0) {
      setLocalError("Enter the energy delivered in kWh (0 or more).");
      return;
    }
    setLocalError(null);
    onSubmit(kwh);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4"
      role="presentation"
    >
      <form
        onSubmit={submit}
        role="dialog"
        aria-modal="true"
        aria-labelledby="finish-title"
        className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
      >
        <h2 id="finish-title" className="text-lg font-semibold text-slate-900">
          Finish this session?
        </h2>
        <p className="mt-1 text-sm text-slate-600">
          {session.charger.title} · {session.vehicle.make} {session.vehicle.model}.
          Enter the energy delivered so the final cost can be calculated.
        </p>

        <label
          htmlFor="energy-kwh"
          className="mt-4 block text-sm font-medium text-slate-700"
        >
          Energy delivered (kWh)
        </label>
        <input
          id="energy-kwh"
          type="number"
          inputMode="decimal"
          min={0}
          step="0.1"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          disabled={busy}
          autoFocus
          className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
        />

        {(localError || error) && (
          <p
            role="alert"
            className="mt-3 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700"
          >
            {localError ?? error}
          </p>
        )}

        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
          >
            Keep charging
          </button>
          <button
            type="submit"
            disabled={busy}
            className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-70"
          >
            {busy && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
            {busy ? "Finishing..." : "Finish session"}
          </button>
        </div>
      </form>
    </div>
  );
}
