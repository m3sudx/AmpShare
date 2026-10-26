import { Link } from "react-router";
import type { NearbyCharger } from "../../types/charger";
import { StarDisplay } from "../reviews/StarRating";

const PLUG_LABEL = { "GB/T": "GB/T", TYPE_2: "Type 2", CCS2: "CCS2" } as const;

const formatDistance = (m: number) =>
  m < 1000 ? `${Math.round(m)} m` : `${(m / 1000).toFixed(1)} km`;

interface Props {
  charger: NearbyCharger;
  active?: boolean;
  onHover?: (id: string | null) => void;
}

export default function ChargerCard({ charger, active, onHover }: Props) {
  return (
    <Link
      to={`/chargers/${charger.id}`}
      onMouseEnter={() => onHover?.(charger.id)}
      onMouseLeave={() => onHover?.(null)}
      className={`block rounded-2xl border bg-white p-4 shadow-sm transition hover:shadow-md ${
        active ? "border-[#0F9468]" : "border-slate-200"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate font-semibold text-slate-900">{charger.title}</h3>
          <p className="mt-0.5 text-sm text-slate-500">
            {formatDistance(charger.distanceMeters)} away
          </p>
          <div className="mt-1">
            <StarDisplay average={charger.rating.average} count={charger.rating.count} />
          </div>
        </div>
        <p className="shrink-0 font-bold text-[#0F9468]">
          {charger.pricePerKwh.toFixed(2)}
          <span className="ml-1 text-xs font-medium text-slate-500">ETB/kWh</span>
        </p>
      </div>
      <div className="mt-3 flex gap-2 text-xs font-medium text-slate-700">
        <span className="rounded-full bg-slate-100 px-2.5 py-1">{PLUG_LABEL[charger.plugType]}</span>
        <span className="rounded-full bg-slate-100 px-2.5 py-1">{charger.powerKw} kW</span>
      </div>
    </Link>
  );
}