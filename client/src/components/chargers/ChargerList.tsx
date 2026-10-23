import type { NearbyCharger } from "../../types/charger";
import ChargerCard from "./ChargerCard";

interface Props {
  chargers: NearbyCharger[];
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
  onWiden?: () => void;
  activeId?: string | null;
  onHover?: (id: string | null) => void;
}

export default function ChargerList({
  chargers, isLoading, isError, onRetry, onWiden, activeId, onHover,
}: Props) {
  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-24 animate-pulse rounded-2xl bg-slate-200" />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
        Couldn't load chargers.
        <button onClick={onRetry} className="ml-2 font-semibold underline">Retry</button>
      </div>
    );
  }

  if (chargers.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center">
        <p className="font-semibold text-slate-900">No chargers found nearby</p>
        {onWiden && (
          <button onClick={onWiden} className="mt-3 text-sm font-semibold text-[#0F9468] underline">
            Try a larger radius
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {chargers.map((c) => (
        <ChargerCard key={c.id} charger={c} active={c.id === activeId} onHover={onHover} />
      ))}
    </div>
  );
}