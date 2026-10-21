import React, { useState } from "react";
import { Link } from "react-router";
import {
  BatteryCharging,
  Check,
  Loader2,
  Minus,
  Plus,
  Sparkles,
  Zap,
} from "lucide-react";
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

interface EVPreset {
  make: string;
  model: string;
  batteryCapacityKwh: number;
  plugType: PlugType;
}

// Popular EV models in Addis Ababa
const POPULAR_EV_PRESETS: EVPreset[] = [
  {
    make: "BYD",
    model: "Atto 3",
    batteryCapacityKwh: 60.48,
    plugType: "GB/T",
  },
  {
    make: "Volkswagen",
    model: "ID.4 Crozz",
    batteryCapacityKwh: 84.8,
    plugType: "GB/T",
  },
  {
    make: "BYD",
    model: "Seagull",
    batteryCapacityKwh: 38.88,
    plugType: "GB/T",
  },
  {
    make: "Tesla",
    model: "Model Y",
    batteryCapacityKwh: 75.0,
    plugType: "CCS2",
  },
  {
    make: "Hyundai",
    model: "Ioniq 5",
    batteryCapacityKwh: 72.6,
    plugType: "TYPE_2",
  },
  {
    make: "Toyota",
    model: "bZ4X",
    batteryCapacityKwh: 66.7,
    plugType: "GB/T",
  },
];

const POPULAR_MAKES = [
  "BYD",
  "Volkswagen",
  "Tesla",
  "Hyundai",
  "Toyota",
  "Changan",
  "Geely",
  "NIO",
];

const POPULAR_MODELS_BY_MAKE: Record<string, string[]> = {
  byd: ["Atto 3", "Yuan Plus", "Seagull", "Song Plus", "Dolphin", "Han EV"],
  volkswagen: ["ID.4 Crozz", "ID.4 X", "ID.6 Crozz", "ID.3"],
  tesla: ["Model Y", "Model 3", "Model X", "Model S"],
  hyundai: ["Ioniq 5", "Ioniq 6", "Kona Electric"],
  toyota: ["bZ4X", "bZ3"],
  changan: ["Lumin", "Deepal S07", "Deepal SL03"],
};

const COMMON_BATTERY_SIZES = [
  { label: "28 kWh", value: 27.99 },
  { label: "38.9 kWh", value: 38.88 },
  { label: "50 kWh", value: 50.0 },
  { label: "60.5 kWh", value: 60.48 },
  { label: "72.6 kWh", value: 72.6 },
  { label: "75 kWh", value: 75.0 },
  { label: "84.8 kWh", value: 84.8 },
  { label: "100 kWh", value: 100.0 },
];

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

  const applyPreset = (preset: EVPreset) => {
    setMake(preset.make);
    setModel(preset.model);
    setBatteryCapacityKwh(String(preset.batteryCapacityKwh));
    setPlugType(preset.plugType);

    // Clear validation errors when an official preset is selected
    setErrors({});
  };

  const handleCapacityStep = (delta: number) => {
    const current = parseFloat(batteryCapacityKwh) || 0;
    let next: number;
    if (current === 0 && delta > 0) {
      next = 50; // Convenient starting default
    } else {
      next = Math.round((current + delta) * 100) / 100;
    }

    if (next < 0.1) next = 0.1;
    if (next > 9999.99) next = 9999.99;

    const formatted = Number.isInteger(next)
      ? String(next)
      : parseFloat(next.toFixed(2)).toString();

    setBatteryCapacityKwh(formatted);
    if (errors.batteryCapacityKwh) {
      setErrors((prev) => ({ ...prev, batteryCapacityKwh: undefined }));
    }
  };

  // Get model suggestions for currently selected make
  const currentMakeKey = make.trim().toLowerCase();
  const modelSuggestions = POPULAR_MODELS_BY_MAKE[currentMakeKey] || [];

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

      {/* Quick-Select Popular EVs in Addis Ababa */}
      <div className="p-4 sm:p-5 bg-gradient-to-br from-emerald-50/70 via-slate-50/90 to-emerald-50/40 rounded-2xl border border-emerald-200/80 shadow-2xs">
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-emerald-100 text-[#0F9468] flex items-center justify-center shrink-0">
              <Sparkles className="w-3.5 h-3.5" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-slate-900 tracking-tight">
                Quick-Select Popular EVs in Addis Ababa
              </h3>
              <p className="text-[11px] text-slate-500">
                Click any model to auto-fill specifications and connector standard
              </p>
            </div>
          </div>
          <span className="hidden sm:inline-block text-[10px] font-semibold text-emerald-800 bg-emerald-100/70 px-2 py-0.5 rounded-full border border-emerald-200/70">
            One-Click Auto-Fill
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
          {POPULAR_EV_PRESETS.map((preset) => {
            const isMatch =
              make.trim().toLowerCase() === preset.make.toLowerCase() &&
              model.trim().toLowerCase() === preset.model.toLowerCase();

            return (
              <button
                key={`${preset.make}-${preset.model}`}
                type="button"
                onClick={() => applyPreset(preset)}
                className={`p-2.5 rounded-xl border text-left transition-all duration-150 cursor-pointer flex flex-col justify-between ${
                  isMatch
                    ? "bg-[#0F9468] text-white border-[#0F9468] shadow-xs scale-[1.02]"
                    : "bg-white hover:bg-emerald-50/50 border-slate-200/90 text-slate-800 hover:border-emerald-300 shadow-2xs"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-1">
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider ${
                        isMatch ? "text-emerald-100" : "text-emerald-700"
                      }`}
                    >
                      {preset.make}
                    </span>
                    <span
                      className={`text-[9px] font-semibold px-1 rounded ${
                        isMatch
                          ? "bg-white/20 text-white"
                          : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      {preset.plugType}
                    </span>
                  </div>
                  <p className="text-xs font-bold truncate mt-1">{preset.model}</p>
                </div>

                <div
                  className={`mt-2 pt-1 border-t flex items-center justify-between text-[10px] ${
                    isMatch
                      ? "border-emerald-400/40 text-emerald-100"
                      : "border-slate-100 text-slate-400"
                  }`}
                >
                  <span>Capacity</span>
                  <span className="font-semibold tabular-nums">
                    {preset.batteryCapacityKwh} kWh
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

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

          {/* Quick select makes */}
          <div className="flex flex-wrap items-center gap-1.5 mt-2">
            <span className="text-[11px] text-slate-400 mr-0.5">Quick select:</span>
            {POPULAR_MAKES.map((m) => {
              const isSelected = make.toLowerCase() === m.toLowerCase();
              return (
                <button
                  key={m}
                  type="button"
                  onClick={() => {
                    setMake(m);
                    if (errors.make) setErrors((prev) => ({ ...prev, make: undefined }));
                  }}
                  className={`text-[11px] px-2 py-0.5 rounded-md border transition-colors cursor-pointer ${
                    isSelected
                      ? "bg-emerald-50 text-emerald-800 border-emerald-300 font-semibold"
                      : "bg-slate-100/70 text-slate-600 border-slate-200 hover:bg-slate-200/70"
                  }`}
                >
                  {m}
                </button>
              );
            })}
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
            placeholder="e.g. Yuan Plus, Atto 3, ID.4 Crozz"
            className={`w-full px-4 py-3 bg-slate-50/70 hover:bg-slate-50 focus:bg-white text-slate-900 placeholder:text-slate-400 border rounded-xl text-sm focus:outline-none focus:ring-2 transition-all duration-150 ${
              errors.model
                ? "border-red-400 focus:border-red-500 focus:ring-red-500/20"
                : "border-slate-200 focus:border-emerald-600 focus:ring-emerald-500/20"
            }`}
          />
          {errors.model && (
            <p className="text-xs text-red-600 mt-1.5 ml-0.5">{errors.model}</p>
          )}

          {/* Model suggestions based on make */}
          {modelSuggestions.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 mt-2">
              <span className="text-[11px] text-slate-400 mr-0.5">Popular models:</span>
              {modelSuggestions.map((m) => {
                const isSelected = model.toLowerCase() === m.toLowerCase();
                return (
                  <button
                    key={m}
                    type="button"
                    onClick={() => {
                      setModel(m);
                      if (errors.model) setErrors((prev) => ({ ...prev, model: undefined }));
                    }}
                    className={`text-[11px] px-2 py-0.5 rounded-md border transition-colors cursor-pointer ${
                      isSelected
                        ? "bg-emerald-50 text-emerald-800 border-emerald-300 font-semibold"
                        : "bg-slate-100/70 text-slate-600 border-slate-200 hover:bg-slate-200/70"
                    }`}
                  >
                    {m}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Battery Capacity with Custom Increment/Decrement Steppers */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label
            htmlFor="battery-capacity"
            className="block text-xs font-bold text-slate-700 uppercase tracking-wider"
          >
            Battery Capacity
          </label>
          <span className="text-[11px] text-slate-400">Step ±1 kWh or enter exact</span>
        </div>

        <div className="relative flex items-center">
          <input
            id="battery-capacity"
            name="batteryCapacityKwh"
            type="number"
            step="any"
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
            className={`w-full pl-4 pr-38 py-3 bg-slate-50/70 hover:bg-slate-50 focus:bg-white text-slate-900 placeholder:text-slate-400 border rounded-xl text-sm focus:outline-none focus:ring-2 transition-all duration-150 tabular-nums [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${
              errors.batteryCapacityKwh
                ? "border-red-400 focus:border-red-500 focus:ring-red-500/20"
                : "border-slate-200 focus:border-emerald-600 focus:ring-emerald-500/20"
            }`}
          />

          {/* Stepper + Unit Indicator on the right */}
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
            {/* Dedicated Stepper Buttons */}
            <div className="flex items-center bg-slate-100 rounded-lg p-0.5 border border-slate-200/90 shadow-2xs">
              <button
                type="button"
                onClick={() => handleCapacityStep(-1)}
                disabled={isSubmitting || (parseFloat(batteryCapacityKwh) || 0) <= 0.1}
                title="Decrease battery capacity by 1 kWh"
                aria-label="Decrease battery capacity by 1 kWh"
                className="w-7 h-7 flex items-center justify-center rounded-md bg-white hover:bg-slate-50 active:scale-95 text-slate-700 shadow-2xs transition-all disabled:opacity-30 cursor-pointer border border-slate-200/60"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => handleCapacityStep(1)}
                disabled={isSubmitting}
                title="Increase battery capacity by 1 kWh"
                aria-label="Increase battery capacity by 1 kWh"
                className="w-7 h-7 flex items-center justify-center rounded-md bg-white hover:bg-slate-50 active:scale-95 text-slate-700 shadow-2xs transition-all disabled:opacity-30 cursor-pointer border border-slate-200/60"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* kWh Unit Tag */}
            <div className="flex items-center gap-1 px-2.5 py-1.5 bg-emerald-50 text-emerald-800 border border-emerald-200/80 rounded-lg text-xs font-bold pointer-events-none select-none">
              <BatteryCharging className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>kWh</span>
            </div>
          </div>
        </div>

        {errors.batteryCapacityKwh ? (
          <p className="text-xs text-red-600 mt-1.5 ml-0.5">{errors.batteryCapacityKwh}</p>
        ) : (
          <p className="text-[11px] text-slate-500 mt-1.5 ml-0.5">
            Usable or gross capacity (e.g. 60.48 for BYD Yuan Plus, 84.8 for VW ID.4 Crozz).
          </p>
        )}

        {/* Quick select capacity pills */}
        <div className="flex flex-wrap items-center gap-1.5 mt-2.5">
          <span className="text-[11px] text-slate-400 mr-0.5">Quick select size:</span>
          {COMMON_BATTERY_SIZES.map((size) => {
            const isSelected =
              Math.abs(parseFloat(batteryCapacityKwh) - size.value) < 0.05;
            return (
              <button
                key={size.label}
                type="button"
                onClick={() => {
                  setBatteryCapacityKwh(String(size.value));
                  if (errors.batteryCapacityKwh) {
                    setErrors((prev) => ({ ...prev, batteryCapacityKwh: undefined }));
                  }
                }}
                className={`text-[11px] px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                  isSelected
                    ? "bg-emerald-50 text-emerald-800 border-emerald-300 font-bold shadow-2xs"
                    : "bg-slate-50 text-slate-600 border-slate-200/80 hover:bg-slate-100 hover:text-slate-800"
                }`}
              >
                {size.label}
              </button>
            );
          })}
        </div>
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
