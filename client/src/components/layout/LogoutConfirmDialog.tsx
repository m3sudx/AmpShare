import { useEffect, useRef } from "react";
import { LogOut, X } from "lucide-react";

interface LogoutConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export default function LogoutConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
}: LogoutConfirmDialogProps) {
  const cancelBtnRef = useRef<HTMLButtonElement>(null);

  // Focus cancel button on open so inadvertent Enter keypresses won't trigger logout
  useEffect(() => {
    if (isOpen) {
      cancelBtnRef.current?.focus();
    }
  }, [isOpen]);

  // Handle ESC key to dismiss dialog
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      role="presentation"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs transition-opacity duration-150"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="logout-dialog-title"
        aria-describedby="logout-dialog-description"
        className="relative w-full max-w-sm sm:max-w-md rounded-2xl bg-white p-5 sm:p-6 shadow-2xl border border-slate-100 transition-all duration-150"
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close dialog"
          className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Content */}
        <div className="flex items-start gap-3.5 sm:gap-4">
          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-red-50 text-red-600 flex items-center justify-center shrink-0 border border-red-100">
            <LogOut className="w-5 h-5 text-red-600" />
          </div>

          <div className="flex-1 pr-4">
            <h3
              id="logout-dialog-title"
              className="text-base sm:text-lg font-bold text-slate-900 tracking-tight"
            >
              Log out of AmpShare?
            </h3>
            <p
              id="logout-dialog-description"
              className="text-xs sm:text-sm text-slate-500 mt-1.5 leading-relaxed"
            >
              Are you sure you want to log out? You will remain signed in if you stay, or you can sign back in anytime.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-6 flex flex-col-reverse sm:flex-row sm:justify-end gap-2.5">
          <button
            ref={cancelBtnRef}
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-slate-300"
          >
            Stay logged in
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 active:bg-red-800 text-sm font-semibold text-white shadow-xs transition-colors cursor-pointer inline-flex items-center justify-center gap-1.5 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
          >
            <LogOut className="w-4 h-4" />
            <span>Yes, log out</span>
          </button>
        </div>
      </div>
    </div>
  );
}
