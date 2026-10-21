import { AlertTriangle, CarFront, Loader2, X } from "lucide-react";
import type { Vehicle } from "../../types/vehicle";

interface DeleteVehicleDialogProps {
  isOpen: boolean;
  vehicle: Vehicle | null;
  onClose: () => void;
  onConfirm: () => void;
  isDeleting?: boolean;
}

export default function DeleteVehicleDialog({
  isOpen,
  vehicle,
  onClose,
  onConfirm,
  isDeleting = false,
}: DeleteVehicleDialogProps) {
  if (!isOpen || !vehicle) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-dialog-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150"
    >
      <div
        className="bg-white border border-slate-200 rounded-2xl sm:rounded-3xl max-w-md w-full p-4.5 sm:p-6 shadow-2xl relative animate-in zoom-in-95 duration-150 max-h-[92vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Icon */}
        <button
          type="button"
          onClick={onClose}
          disabled={isDeleting}
          aria-label="Close dialog"
          className="absolute top-4 right-4 sm:top-5 sm:right-5 p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors disabled:opacity-50 cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header Icon + Title */}
        <div className="flex items-start gap-3.5 sm:gap-4">
          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl bg-red-50 text-red-600 flex items-center justify-center shrink-0 border border-red-100">
            <AlertTriangle className="w-5 h-5 text-red-600" />
          </div>

          <div className="flex-1 pr-4 sm:pr-6">
            <h3 id="delete-dialog-title" className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
              Delete vehicle?
            </h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Are you sure you want to remove this vehicle from your account? If this vehicle is referenced by any bookings or active charging sessions, it cannot be deleted.
            </p>

            {/* Vehicle Card Preview Pill */}
            <div className="mt-3.5 sm:mt-4 p-2.5 sm:p-3 bg-slate-50 rounded-xl border border-slate-200/80 flex items-center gap-2.5">
              <CarFront className="w-4 h-4 text-emerald-600 shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-slate-900 truncate">
                  {vehicle.make} {vehicle.model}
                </p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  {vehicle.batteryCapacityKwh.toFixed(2)} kWh · {vehicle.plugType}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons - stacked full-width on mobile */}
        <div className="mt-5 sm:mt-6 pt-3.5 sm:pt-4 border-t border-slate-100 flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-2 sm:gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="w-full sm:w-auto px-4 py-2.5 text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer disabled:opacity-50 text-center"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={isDeleting}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-red-600 hover:bg-red-700 active:bg-red-800 text-white rounded-xl text-xs font-semibold shadow-sm transition-all cursor-pointer disabled:opacity-60"
          >
            {isDeleting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Deleting...</span>
              </>
            ) : (
              <span>Delete vehicle</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
