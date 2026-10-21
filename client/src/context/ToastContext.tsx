import React, { useCallback, useState } from "react";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";
import { ToastContext, type Toast, type ToastType } from "./toastContextBase";

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const hideToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    (message: string, type: ToastType = "success", durationMs: number = 4000) => {
      const id = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      const newToast: Toast = { id, message, type };

      setToasts((prev) => [...prev, newToast]);

      if (durationMs > 0) {
        setTimeout(() => {
          hideToast(id);
        }, durationMs);
      }
    },
    [hideToast]
  );

  return (
    <ToastContext.Provider value={{ showToast, hideToast }}>
      {children}
      {/* Toast Notification Container */}
      <div
        aria-live="polite"
        className="fixed top-5 right-5 z-50 flex flex-col gap-2 pointer-events-none max-w-sm w-full px-4 sm:px-0"
      >
        {toasts.map((toast) => {
          const isSuccess = toast.type === "success";
          const isError = toast.type === "error";

          return (
            <div
              key={toast.id}
              role="status"
              className={`pointer-events-auto flex items-center justify-between gap-3 p-3.5 rounded-2xl shadow-lg border backdrop-blur-md transition-all duration-300 ${
                isSuccess
                  ? "bg-white/95 border-emerald-200 text-slate-800 shadow-emerald-950/5"
                  : isError
                  ? "bg-white/95 border-red-200 text-slate-800 shadow-red-950/5"
                  : "bg-white/95 border-slate-200 text-slate-800 shadow-slate-950/5"
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div
                  className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 ${
                    isSuccess
                      ? "bg-emerald-50 text-[#0F9468]"
                      : isError
                      ? "bg-red-50 text-red-600"
                      : "bg-slate-100 text-slate-600"
                  }`}
                >
                  {isSuccess ? (
                    <CheckCircle2 className="w-4 h-4 text-[#0F9468]" />
                  ) : isError ? (
                    <AlertCircle className="w-4 h-4 text-red-600" />
                  ) : (
                    <Info className="w-4 h-4 text-slate-600" />
                  )}
                </div>
                <p className="text-xs font-medium text-slate-800 leading-snug truncate">
                  {toast.message}
                </p>
              </div>

              <button
                type="button"
                onClick={() => hideToast(toast.id)}
                aria-label="Close notification"
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors shrink-0"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};
