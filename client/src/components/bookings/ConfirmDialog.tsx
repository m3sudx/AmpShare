import { useEffect } from "react";
import { Loader2, TriangleAlert } from "lucide-react";

interface Props {
  title: string;
  message: string;
  confirmLabel: string;
  busyLabel: string;
  closeLabel: string;
  tone?: "danger" | "primary";
  busy: boolean;
  error: string | null;
  onConfirm: () => void;
  onClose: () => void;
}

export default function ConfirmDialog({
  title,
  message,
  confirmLabel,
  busyLabel,
  closeLabel,
  tone = "danger",
  busy,
  error,
  onConfirm,
  onClose,
}: Props) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !busy) onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [busy, onClose]);

  const confirmStyle =
    tone === "danger"
      ? "bg-red-600 hover:bg-red-700"
      : "bg-[#0F9468] hover:bg-[#0c7d58]";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4"
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
      >
        <div className="flex items-start gap-3">
          <TriangleAlert
            className="mt-0.5 h-6 w-6 shrink-0 text-amber-500"
            aria-hidden="true"
          />
          <div>
            <h2
              id="confirm-title"
              className="text-lg font-semibold text-slate-900"
            >
              {title}
            </h2>
            <p className="mt-1 text-sm text-slate-600">{message}</p>
          </div>
        </div>

        {error && (
          <p
            role="alert"
            className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700"
          >
            {error}
          </p>
        )}

        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
          >
            {closeLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={busy}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold text-white disabled:opacity-70 ${confirmStyle}`}
          >
            {busy && (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            )}
            {busy ? busyLabel : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
