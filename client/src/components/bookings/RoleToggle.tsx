export type ViewRole = "driver" | "host";

interface Props {
  value: ViewRole;
  onChange: (role: ViewRole) => void;
}

const OPTIONS: { key: ViewRole; label: string }[] = [
  { key: "driver", label: "As a driver" },
  { key: "host", label: "As a host" },
];

export default function RoleToggle({ value, onChange }: Props) {
  return (
    <div
      role="tablist"
      aria-label="View as"
      className="flex w-fit gap-1 rounded-xl bg-slate-100 p-1 text-sm font-medium"
    >
      {OPTIONS.map((o) => (
        <button
          key={o.key}
          type="button"
          role="tab"
          aria-selected={value === o.key}
          onClick={() => onChange(o.key)}
          className={`rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
            value === o.key
              ? "bg-white text-[#0F9468] shadow-sm"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
