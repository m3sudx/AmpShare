import SelectField from "../../components/ui/SelectField";
import type { SortKey } from "../../hooks/useChargerSearch";
import type { PlugType } from "../../types/charger";

interface Props {
  values: {
    radius: number;
    plugType?: PlugType;
    minPowerKw?: number;
    maxPrice?: number;
    sort: SortKey;
  };
  onChange: (changes: Record<string, string | number | undefined>) => void;
  onReset: () => void;
  onLocate: () => void;
}

const input =
  "h-10 rounded-xl border border-slate-300 bg-white px-3 text-sm font-medium text-slate-700 hover:border-slate-400 focus:border-[#0F9468] focus:outline-none focus:ring-2 focus:ring-[#0F9468]/20";

export default function ChargerFilters({ values, onChange, onReset, onLocate }: Props) {
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <SelectField
        ariaLabel="Search radius"
        value={String(values.radius)}
        onChange={(v) => onChange({ radius: v })}
        options={[2000, 5000, 10000, 25000].map((r) => ({
          value: String(r),
          label: `${r / 1000} km`,
        }))}
      />

      <SelectField
        ariaLabel="Plug type"
        value={values.plugType ?? ""}
        onChange={(v) => onChange({ plugType: v })}
        options={[
          { value: "", label: "All plugs" },
          { value: "GB/T", label: "GB/T" },
          { value: "TYPE_2", label: "Type 2" },
          { value: "CCS2", label: "CCS2" },
        ]}
      />

      <SelectField
        ariaLabel="Minimum power"
        value={String(values.minPowerKw ?? "")}
        onChange={(v) => onChange({ minPower: v })}
        options={[
          { value: "", label: "Any power" },
          { value: "7", label: "7 kW+" },
          { value: "22", label: "22 kW+" },
          { value: "50", label: "50 kW+" },
        ]}
      />

      <input
        type="number"
        min={0}
        placeholder="Max ETB/kWh"
        aria-label="Maximum price per kWh"
        className={`${input} w-36`}
        value={values.maxPrice ?? ""}
        onChange={(e) => onChange({ maxPrice: e.target.value })}
      />

      <SelectField
        ariaLabel="Sort by"
        value={values.sort}
        onChange={(v) => onChange({ sort: v })}
        options={[
          { value: "nearest", label: "Nearest" },
          { value: "price", label: "Lowest price" },
          { value: "power", label: "Highest power" },
        ]}
      />

      <button
        onClick={onLocate}
        className="h-10 rounded-xl bg-[#0F9468] px-4 text-sm font-semibold text-white hover:bg-[#0c7a56]"
      >
        Use my location
      </button>
      <button onClick={onReset} className="text-sm font-medium text-slate-500 underline">
        Reset
      </button>
    </div>
  );
}