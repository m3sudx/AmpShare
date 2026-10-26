import { Star } from "lucide-react";

interface StarDisplayProps {
  average: number | null;
  count: number;
  size?: number;
  showCount?: boolean;
}

// Read-only stars for charger cards, the map popup and the details page.
export function StarDisplay({ average, count, size = 14, showCount = true }: StarDisplayProps) {
  if (average === null || count === 0) {
    return <span className="text-xs text-slate-500">No reviews yet</span>;
  }

  return (
    <span
      className="inline-flex items-center gap-1 text-sm text-slate-700"
      aria-label={`Rated ${average} out of 5 from ${count} ${count === 1 ? "review" : "reviews"}`}
    >
      <Star size={size} className="fill-amber-400 text-amber-400" aria-hidden />
      <span className="font-semibold">{average.toFixed(1)}</span>
      {showCount && <span className="text-xs text-slate-500">({count})</span>}
    </span>
  );
}

interface StarInputProps {
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
}

// Clickable 1 to 5 stars for the review form.
export function StarInput({ value, onChange, disabled }: StarInputProps) {
  return (
    <div role="radiogroup" aria-label="Your rating" className="flex gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          role="radio"
          aria-checked={value === n}
          aria-label={`${n} ${n === 1 ? "star" : "stars"}`}
          disabled={disabled}
          onClick={() => onChange(n)}
          className="rounded p-0.5 transition-transform hover:scale-110 focus-visible:outline-2 focus-visible:outline-[#0B7A55] disabled:opacity-50"
        >
          <Star
            size={28}
            className={n <= value ? "fill-amber-400 text-amber-400" : "text-slate-300"}
          />
        </button>
      ))}
    </div>
  );
}