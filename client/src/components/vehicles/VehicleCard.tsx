import { BatteryCharging, Calendar, Edit3, Trash2, Zap } from "lucide-react";
import { Link } from "react-router";
import type { Vehicle } from "../../types/vehicle";
import { PLUG_TYPE_OPTIONS } from "../../types/vehicle";

interface VehicleCardProps {
  vehicle: Vehicle;
  onDeleteClick: (vehicle: Vehicle) => void;
  isPrimary?: boolean;
}

export default function VehicleCard({
  vehicle,
  onDeleteClick,
  isPrimary = false,
}: VehicleCardProps) {
  const plugMeta = PLUG_TYPE_OPTIONS.find((p) => p.value === vehicle.plugType);
  const plugLabel = plugMeta?.shortLabel || vehicle.plugType;

  // Format date nicely
  const formattedDate = vehicle.createdAt
    ? new Date(vehicle.createdAt).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : null;

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-[0_4px_20px_-4px_rgba(15,23,42,0.05)] hover:shadow-[0_12px_28px_-6px_rgba(15,23,42,0.09)] hover:border-emerald-500/40 transition-all duration-200 flex flex-col justify-between group">
      <div>
        {/* Header: Make & Model */}
        <div className="flex items-start justify-between gap-3">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800/80 bg-emerald-50/80 px-2 py-0.5 rounded-md border border-emerald-100">
              {vehicle.make}
            </span>
            <h3 className="text-lg font-bold text-slate-900 tracking-tight mt-1.5 group-hover:text-[#0F9468] transition-colors">
              {vehicle.make} {vehicle.model}
            </h3>
          </div>

          {isPrimary && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-[#ECFDF5] text-[#0F9468] border border-[#A7F3D0] shrink-0">
              <span className="w-1.5 h-1.5 rounded-full bg-[#0F9468]" />
              Primary
            </span>
          )}
        </div>

        {/* Divider */}
        <div className="h-px bg-slate-100 my-4" />

        {/* Specs List */}
        <div className="space-y-3 text-sm">
          {/* Battery Capacity */}
          <div className="flex items-center justify-between">
            <span className="text-slate-500 flex items-center gap-2 text-xs font-medium">
              <BatteryCharging className="w-4 h-4 text-emerald-600 shrink-0" />
              Battery Capacity
            </span>
            <span className="font-semibold text-slate-900 text-sm tracking-tight tabular-nums">
              {vehicle.batteryCapacityKwh.toFixed(2)} kWh
            </span>
          </div>

          {/* Plug Connector */}
          <div className="flex items-center justify-between">
            <span className="text-slate-500 flex items-center gap-2 text-xs font-medium">
              <Zap className="w-4 h-4 text-emerald-600 shrink-0" />
              Connector Standard
            </span>
            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold bg-slate-100 text-slate-800 border border-slate-200/80">
              {plugLabel}
            </span>
          </div>

          {/* Registration Date */}
          {formattedDate && (
            <div className="flex items-center justify-between pt-0.5">
              <span className="text-slate-400 flex items-center gap-2 text-xs">
                <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                Registered
              </span>
              <span className="text-xs text-slate-500 font-medium">{formattedDate}</span>
            </div>
          )}
        </div>
      </div>

      {/* Action Footer */}
      <div className="pt-5 mt-6 border-t border-slate-100 flex items-center justify-between">
        <Link
          to={`/vehicles/${vehicle.id}/edit`}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 hover:text-[#0F9468] transition-colors py-1.5 px-3 rounded-lg hover:bg-slate-50 active:scale-[0.98]"
        >
          <Edit3 className="w-3.5 h-3.5" />
          <span>Edit</span>
        </Link>

        <button
          type="button"
          onClick={() => onDeleteClick(vehicle)}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-red-600 hover:text-red-700 transition-colors py-1.5 px-3 rounded-lg hover:bg-red-50 active:scale-[0.98] cursor-pointer"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Delete</span>
        </button>
      </div>
    </div>
  );
}
