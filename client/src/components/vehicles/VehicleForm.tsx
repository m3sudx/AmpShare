import React, { useState } from "react";
import { Link } from "react-router";
import { BatteryCharging, Check, Loader2, Sparkles, Zap } from "lucide-react";
import type { CreateVehiclePayload, PlugType } from "../../types/vehicle";
import { PLUG_TYPE_OPTIONS } from "../../types/vehicle";

export interface VehicleFormValues {
  make: string;
  model: string;
  batteryCapacityKwh: number | string;
  plugType: PlugType;
}

interface VehicleFormProps {
  initialValues?: VehicleFormValues;
  onSubmit: (values: CreateVehiclePayload) => Promise<void>;
  isSubmitting: boolean;
  submitButtonText?: string;
  mode: "create" | "edit";
  serverError?: string | null;
}

export default function VehicleForm({
  initialValues,
  onSubmit,
  isSubmitting,
  submitButtonText,
  mode,
  serverError,
}: VehicleFormProps) {
  const [make, setMake] = useState(initialValues?.make || "");
  const [model, setModel] = useState(initialValues?.model || "");
  const [batteryCapacityKwh, setBatteryCapacityKwh] = useState<string>(
    initialValues?.batteryCapacityKwh !== undefined
      ? String(initialValues.batteryCapacityKwh)
      : ""
  );
  const [plugType, setPlugType] = useState<PlugType>(
    initialValues?.plugType || "GB/T"
  );

  // Field validation errors
  const [errors, setErrors] = useState<{
    make?: string;
    model?: string;
    batteryCapacityKwh?: string;
    plugType?: string;
  }>({});

  const validate = (): boolean => {
    const newErrors: typeof errors = {};

    // Make validation
    const trimmedMake = make.trim();
    if (!trimmedMake) {
      newErrors.make = "Vehicle make is required";
    } else if (trimmedMake.length > 50) {
      newErrors.make = "Make must not exceed 50 characters";
    }

    // Model validation
    const trimmedModel = model.trim();
    if (!trimmedModel) {
      newErrors.model = "Vehicle model is required";
    } else if (trimmedModel.length > 50) {
      newErrors.model = "Model must not exceed 50 characters";
    }

    // Battery capacity validation
    const capacityNum = parseFloat(batteryCapacityKwh);
    if (!batteryCapacityKwh || isNaN(capacityNum)) {
      newErrors.batteryCapacityKwh = "Battery capacity is required";
    } else if (capacityNum <= 0) {
      newErrors.batteryCapacityKwh = "Battery capacity must be greater than 0 kWh";
    } else if (capacityNum > 9999.99) {
      newErrors.batteryCapacityKwh = "Battery capacity must be less than 10,000 kWh";
    } else {
      // Check decimal places (at most 2 decimals for NUMERIC(6,2))
      const parts = batteryCapacityKwh.split(".");
      if (parts.length === 2 && parts[1].length > 2) {
        newErrors.batteryCapacityKwh = "Maximum 2 decimal places allowed";
      }
    }

    // Plug type validation
    if (!plugType || !["GB/T", "TYPE_2", "CCS2"].includes(plugType)) {
      newErrors.plugType = "Please select a valid charging connector";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    const payload: CreateVehiclePayload = {
      make: make.trim(),
      model: model.trim(),
      batteryCapacityKwh: parseFloat(parseFloat(batteryCapacityKwh).toFixed(2)),
      plugType,
    };

    await onSubmit(payload);
  };

  const popularMakes = ["BYD", "Volkswagen", "Tesla", "Hyundai", "Toyota", "Changan"];

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-6">
      {/* Server Error Alert */}
      {serverError && (
        <div
          role="alert"
          className="p-4 rounded-2xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-start gap-3"
        >
          <span className="font-bold">Error:</span>
          <span>{serverError}</span>
        </div>
      )}

      {/* Make & Model Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        {/* Make */}
        <div>
          <label
            htmlFor="vehicle-make"
            className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2"
          >
            Vehicle Make
          </label>
          <input
            id="vehicle-make"
            name="make"
            type="text"
            required
            disabled={isSubmitting}
            value={make}
            onChange={(e) => {
              setMake(e.target.value);
              if (errors.make) setErrors((prev) => ({ ...prev, make: undefined }));
            }}
            placeholder="e.g. BYD, Volkswagen, Tesla"
            className={`w-full px-4 py-3 bg-slate-50/70 hover:bg-slate-50 focus:bg-white text-slate-900 placeholder:text-slate-400 border rounded-xl text-sm focus:outline-none focus:ring-2 transition-all duration-150 ${
              errors.make
                ? "border-red-400 focus:border-red-500 focus:ring-red-500/20"
                : "border-slate-200 focus:border-emerald-600 focus:ring-emerald-500/20"
            }`}
          />
          {errors.make && (
            <p className="text-xs text-red-600 mt-1.5 ml-0.5">{errors.make}</p>
          )}

          {/* Quick select pills */}
          <div className="flex flex-wrap items-center gap-1.5 mt-2">
            <span className="text-[11px] text-slate-400 mr-0.5">Quick select:</span>
            {popularMakes.map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => {
                  setMake(m);
                  if (errors.make) setErrors((prev) => ({ ...prev, make: undefined }));
                }}
                className={`text-[11px] px-2 py-0.5 rounded-md border transition-colors cursor-pointer ${
                  make.toLowerCase() === m.toLowerCase()
                    ? "bg-emerald-50 text-emerald-800 border-emerald-300 font-semibold"
                    : "bg-slate-100/70 text-slate-600 border-slate-200 hover:bg-slate-200/70"
                }`}
              >
                {m}
              </button>
            ))}
          </div>
        </div>

        {/* Model */}
        <div>
          <label
            htmlFor="vehicle-model"
            className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2"
          >
            Vehicle Model
          </label>
          <input
            id="vehicle-model"
            name="model"
            type="text"
            required
            disabled={isSubmitting}
            value={model}
            onChange={(e) => {
              setModel(e.target.value);
              if (errors.model) setErrors((prev) => ({ ...prev, model: undefined }));
            }}
            placeholder="e.g. Yuan Plus, Atto 3, ID.4"
            className={`w-full px-4 py-3 bg-slate-50/70 hover:bg-slate-50 focus:bg-white text-slate-900 placeholder:text-slate-400 border rounded-xl text-sm focus:outline-none focus:ring-2 transition-all duration-150 ${
              errors.model
                ? "border-red-400 focus:border-red-500 focus:ring-red-500/20"
                : "border-slate-200 focus:border-emerald-600 focus:ring-emerald-500/20"
            }`}
          />
          {errors.model && (
            <p className="text-xs text-red-600 mt-1.5 ml-0.5">{errors.model}</p>
          )}
        </div>
      </div>

      {/* Battery Capacity */}
      <div>
        <label
          htmlFor="battery-capacity"
          className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2"
        >
          Battery Capacity
        </label>
        <div className="relative">
          <input
            id="battery-capacity"
            name="batteryCapacityKwh"
            type="number"
            step="0.01"
            min="0.1"
            max="9999.99"
            required
            disabled={isSubmitting}
            value={batteryCapacityKwh}
            onChange={(e) => {
              setBatteryCapacityKwh(e.target.value);
              if (errors.batteryCapacityKwh) {
                setErrors((prev) => ({ ...prev, batteryCapacityKwh: undefined }));
              }
            }}
            placeholder="e.g. 60.48"
            className={`w-full pl-4 pr-16 py-3 bg-slate-50/70 hover:bg-slate-50 focus:bg-white text-slate-900 placeholder:text-slate-400 border rounded-xl text-sm focus:outline-none focus:ring-2 transition-all duration-150 tabular-nums ${
              errors.batteryCapacityKwh
                ? "border-red-400 focus:border-red-500 focus:ring-red-500/20"
                : "border-slate-200 focus:border-emerald-600 focus:ring-emerald-500/20"
            }`}
          />
          <div className="absolute right-3.5 top-1/2 -translate-y-1/2 flex items-center gap-1 px-2 py-1 bg-slate-200/60 rounded-md text-xs font-bold text-slate-600 pointer-events-none">
            <BatteryCharging className="w-3.5 h-3.5 text-emerald-600" />
            <span>kWh</span>
          </div>
        </div>
        {errors.batteryCapacityKwh ? (
          <p className="text-xs text-red-600 mt-1.5 ml-0.5">{errors.batteryCapacityKwh}</p>
        ) : (
          <p className="text-[11px] text-slate-500 mt-1.5 ml-0.5">
            Enter usable or total pack capacity (e.g. 60.48 for BYD Yuan Plus, 84.8 for VW ID.4).
          </p>
        )}
      </div>

      {/* Plug Type Selection */}
      <div>
        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
          Charging Connector Standard
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {PLUG_TYPE_OPTIONS.map((option) => {
            const isSelected = plugType === option.value;

            return (
              <div
                key={option.value}
                onClick={() => {
                  if (!isSubmitting) {
                    setPlugType(option.value);
                    if (errors.plugType) {
                      setErrors((prev) => ({ ...prev, plugType: undefined }));
                    }
                  }
                }}
                className={`relative flex flex-col justify-between p-4 rounded-2xl border-2 transition-all duration-150 cursor-pointer select-none ${
                  isSelected
                    ? "bg-emerald-50/40 border-[#0F9468] shadow-xs"
                    : "bg-white border-slate-200/90 hover:border-slate-300 hover:bg-slate-50/50"
                } ${isSubmitting ? "opacity-60 cursor-not-allowed" : ""}`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-bold tracking-tight ${
                        isSelected
                          ? "bg-[#0F9468] text-white"
                          : "bg-slate-100 text-slate-700 border border-slate-200"
                      }`}
                    >
                      <Zap className="w-3 h-3" />
                      {option.shortLabel}
                    </span>

                    {isSelected && (
                      <span className="w-5 h-5 rounded-full bg-[#0F9468] text-white flex items-center justify-center shrink-0">
                        <Check className="w-3 h-3 stroke-[3]" />
                      </span>
                    )}
                  </div>

                  <h4 className="text-xs font-bold text-slate-900 mt-1">{option.label}</h4>
                  <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                    {option.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
        {errors.plugType && (
          <p className="text-xs text-red-600 mt-1.5 ml-0.5">{errors.plugType}</p>
        )}
      </div>

      {/* Form Action Controls */}
      <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
        <Link
          to="/vehicles"
          className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:text-slate-900 hover:bg-slate-50 font-semibold text-xs transition-colors"
        >
          Cancel
        </Link>

        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-[#0F9468] hover:bg-[#0c7d58] active:bg-[#086a4c] disabled:opacity-70 text-white font-semibold text-xs rounded-xl shadow-sm hover:shadow transition-all duration-150 cursor-pointer"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Saving vehicle...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-3.5 h-3.5" />
              <span>
                {submitButtonText ||
                  (mode === "create" ? "Add vehicle" : "Save changes")}
              </span>
            </>
          )}
        </button>
      </div>
    </form>
  );
}
