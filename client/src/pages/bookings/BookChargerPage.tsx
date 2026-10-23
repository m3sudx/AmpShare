import { useEffect, useState } from "react";
import { Link, useParams } from "react-router";
import { isAxiosError } from "axios";
import {
  CircleAlert,
  MapPin,
  RefreshCw,
  SearchX,
  TriangleAlert,
  Zap,
} from "lucide-react";
import BookingForm from "../../components/bookings/BookingForm";
import { getCharger } from "../../services/chargers.api";
import { listSchedules } from "../../services/schedules.api";
import { listMyVehicles } from "../../services/vehicles.api";
import type { Charger } from "../../types/charger";
import type { Schedule } from "../../types/schedule";
import type { Vehicle } from "../../types/vehicle";
import { PLUG_LABELS } from "../../utils/booking";
import { getErrorMessage } from "../../utils/errors";
import { formatPrice } from "../../utils/format";

type LoadState =
  | { status: "loading" }
  | { status: "not-found" }
  | { status: "error"; message: string }
  | {
      status: "ready";
      charger: Charger;
      vehicles: Vehicle[];
      schedules: Schedule[] | null;
    };

export default function BookChargerPage() {
  const { chargerId } = useParams<{ chargerId: string }>();
  const [state, setState] = useState<LoadState>({ status: "loading" });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!chargerId) return;
    let cancelled = false;

    // Only a missing charger counts as "not found"; other failures are real errors
    const chargerRequest = getCharger(chargerId).catch((err: unknown) => {
      const code = isAxiosError(err) ? err.response?.status : undefined;
      if (code === 404 || code === 400) return null;
      throw err;
    });

    Promise.all([
      chargerRequest,
      listMyVehicles(),
      // If the host hours cannot be read, the form falls back to server-side validation
      listSchedules(chargerId).catch(() => null),
    ])
      .then(([charger, vehicles, schedules]) => {
        if (cancelled) return;
        setState(
          charger
            ? { status: "ready", charger, vehicles, schedules }
            : { status: "not-found" },
        );
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setState({
          status: "error",
          message: getErrorMessage(err, "We couldn't load this page."),
        });
      });

    return () => {
      cancelled = true;
    };
  }, [chargerId, attempt]);

  const retry = () => {
    setState({ status: "loading" });
    setAttempt((n) => n + 1);
  };

  if (state.status === "loading") {
    return (
      <div
        className="space-y-4"
        aria-busy="true"
        aria-label="Loading booking form"
      >
        <div className="h-24 animate-pulse rounded-2xl border border-slate-200 bg-white" />
        <div className="h-64 animate-pulse rounded-2xl border border-slate-200 bg-white" />
        <div className="h-48 animate-pulse rounded-2xl border border-slate-200 bg-white" />
      </div>
    );
  }

  if (state.status === "not-found") {
    return (
      <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
        <SearchX className="h-10 w-10 text-slate-400" aria-hidden="true" />
        <h1 className="text-lg font-semibold text-slate-900">
          Charger not found
        </h1>
        <p className="max-w-md text-sm text-slate-500">
          We couldn't find this charger. It may have been removed, or the link
          may be wrong.
        </p>
        <Link
          to="/chargers"
          className="rounded-xl bg-[#0F9468] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#0c7d58]"
        >
          Find chargers
        </Link>
      </div>
    );
  }

  if (state.status === "error") {
    return (
      <div
        role="alert"
        className="flex flex-col items-center gap-3 rounded-2xl border border-red-200 bg-red-50 p-8 text-center"
      >
        <CircleAlert className="h-8 w-8 text-red-500" aria-hidden="true" />
        <p className="text-sm text-red-700">{state.message}</p>
        <button
          type="button"
          onClick={retry}
          className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
        >
          <RefreshCw className="h-4 w-4" aria-hidden="true" />
          Retry
        </button>
      </div>
    );
  }

  const { charger, vehicles, schedules } = state;

  return (
    <div className="space-y-6">
      <nav aria-label="Breadcrumb" className="text-sm text-slate-500">
        <Link to="/chargers" className="hover:text-slate-800 hover:underline">
          Find chargers
        </Link>
        <span className="mx-2">/</span>
        <span className="text-slate-800">{charger.title}</span>
      </nav>

      <header>
        <h1 className="text-2xl font-bold text-slate-900">Book a charger</h1>
        <p className="mt-1 text-sm text-slate-500">
          Choose your vehicle and a time slot. The host confirms your request.
        </p>
      </header>

      <section
        aria-label="Selected charger"
        className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
      >
        <h2 className="text-lg font-semibold text-slate-900">
          {charger.title}
        </h2>
        <p className="mt-1 flex items-center gap-2 text-sm text-slate-600">
          <MapPin
            className="h-4 w-4 shrink-0 text-slate-400"
            aria-hidden="true"
          />
          {charger.addressDescription}
        </p>
        <p className="mt-1 flex items-center gap-2 text-sm text-slate-600">
          <Zap className="h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" />
          {charger.powerKw} kW · {PLUG_LABELS[charger.plugType]} ·{" "}
          {formatPrice(Number(charger.pricePerKwh))}
        </p>
      </section>

      {charger.isActive ? (
        <BookingForm
          charger={charger}
          vehicles={vehicles}
          schedules={schedules}
        />
      ) : (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900"
        >
          <TriangleAlert
            className="mt-0.5 h-5 w-5 shrink-0"
            aria-hidden="true"
          />
          This charger is not available for booking right now.
        </div>
      )}
    </div>
  );
}
