import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import { useState } from "react";
import { Link } from "react-router";
import { listMyChargers, updateCharger } from "../../services/chargers.api";
import type { Charger } from "../../types/charger";

const PLUG_LABEL = { "GB/T": "GB/T", TYPE_2: "Type 2", CCS2: "CCS2" } as const;

function errorMessage(error: unknown) {
  if (isAxiosError(error)) {
    const status = error.response?.status;
    if (status === 401) return "Please sign in as a host.";
    if (status === 403) return "Only hosts can manage chargers.";
    return (
      error.response?.data?.message ?? "Something went wrong. Please try again."
    );
  }
  return "Something went wrong. Please try again.";
}

// Accepts either Charger[] or { chargers: Charger[] }
async function fetchMine(): Promise<Charger[]> {
  const res: unknown = await listMyChargers();
  if (Array.isArray(res)) return res as Charger[];
  return ((res as { chargers?: Charger[] })?.chargers ?? []) as Charger[];
}

export default function MyChargersPage() {
  const queryClient = useQueryClient();
  const [actionError, setActionError] = useState<string | null>(null);

  const query = useQuery({
    queryKey: ["chargers", "mine"],
    queryFn: fetchMine,
  });
  const chargers = query.data ?? [];

  const toggle = useMutation({
    mutationFn: (c: Charger & { id: string }) =>
      updateCharger(c.id, { isActive: !c.isActive }),
    onSuccess: () => {
      setActionError(null);
      queryClient.invalidateQueries({ queryKey: ["chargers"] });
      queryClient.invalidateQueries({ queryKey: ["charger"] });
    },
    onError: (e) => setActionError(errorMessage(e)),
  });

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900">
            My chargers
          </h1>
          <p className="text-slate-600">Manage the chargers you host.</p>
        </div>
        <Link
          to="/host/chargers/new"
          className="rounded-xl bg-[#0F9468] px-6 py-3 text-base font-bold text-white hover:bg-[#0c7a56]"
        >
          + Add charger
        </Link>
      </div>

      {actionError && (
        <p
          role="alert"
          className="rounded-xl bg-red-50 p-3.5 text-sm font-medium text-red-700"
        >
          {actionError}
        </p>
      )}

      {query.isLoading ? (
        <div className="grid gap-4 md:grid-cols-2">
          {[0, 1].map((i) => (
            <div
              key={i}
              className="h-52 animate-pulse rounded-2xl bg-slate-200"
            />
          ))}
        </div>
      ) : query.isError ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <p className="text-lg font-semibold text-slate-900">
            Couldn't load your chargers
          </p>
          <p className="mt-1 text-sm text-slate-600">
            {errorMessage(query.error)}
          </p>
          <button
            onClick={() => query.refetch()}
            className="mt-4 rounded-xl border border-slate-400 px-5 py-2.5 font-semibold text-slate-800"
          >
            Try again
          </button>
        </div>
      ) : chargers.length === 0 ? (
        <div className="mx-auto max-w-2xl rounded-3xl border border-slate-200 bg-white px-8 py-14 text-center shadow-sm">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full border border-[#CFE9DD] bg-[#E7F6F0] text-[#0F9468]">
            <svg
              width="36"
              height="36"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <rect x="4" y="3" width="10" height="18" rx="2" />
              <path d="M2 21h14" />
              <path d="M9 8l-2 3h3l-2 3" />
              <path d="M14 9h2a2 2 0 012 2v4a1.5 1.5 0 003 0V8l-3-3" />
            </svg>
          </div>

          <h2 className="mt-6 text-2xl font-extrabold text-slate-900">
            No chargers added yet
          </h2>
          <p className="mx-auto mt-2 max-w-md text-slate-600">
            Add your first charger, set its hours, then activate it so nearby
            drivers can find and book it.
          </p>

          <Link
            to="/host/chargers/new"
            className="mt-7 inline-flex min-h-12 items-center gap-2 rounded-xl bg-[#0F9468] px-7 text-base font-bold text-white hover:bg-[#0c7a56]"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.4"
              strokeLinecap="round"
              aria-hidden="true"
            >
              <path d="M12 5v14M5 12h14" />
            </svg>
            Add your first charger
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {chargers.map((c) => {
            const id = (c as Charger & { id: string }).id;
            return (
              <article
                key={id}
                className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <Link
                      to={`/chargers/${id}`}
                      className="block truncate text-lg font-bold text-slate-900 hover:underline"
                    >
                      {c.title}
                    </Link>
                    <p className="truncate text-sm text-slate-600">
                      {c.addressDescription}
                    </p>
                  </div>
                  <span
                    className={`inline-flex shrink-0 items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${
                      c.isActive
                        ? "bg-[#E7F6F0] text-[#0B7A55]"
                        : "bg-amber-100 text-amber-800"
                    }`}
                  >
                    <span
                      className={`h-2 w-2 rounded-full ${c.isActive ? "bg-[#0F9468]" : "bg-amber-600"}`}
                    />
                    {c.isActive ? "Active" : "Inactive"}
                  </span>
                </div>

                <div className="flex flex-wrap gap-2 text-sm font-semibold text-slate-800">
                  <span className="rounded-lg bg-slate-100 px-3 py-1.5">
                    {PLUG_LABEL[c.plugType]}
                  </span>
                  <span className="rounded-lg bg-slate-100 px-3 py-1.5">
                    {c.powerKw} kW
                  </span>
                  <span className="rounded-lg bg-slate-100 px-3 py-1.5">
                    {c.pricePerKwh} ETB / kWh
                  </span>
                </div>

                {!c.isActive && (
                  <p className="text-sm text-slate-600">
                    Drivers can't find this charger yet. Set its hours, then
                    activate it.
                  </p>
                )}

                <div className="mt-auto flex flex-wrap gap-2">
                  <Link
                    to={`/host/chargers/${id}/schedules`}
                    className="min-h-11 rounded-xl bg-[#0F9468] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#0c7a56]"
                  >
                    Manage schedules
                  </Link>
                  <Link
                    to={`/host/chargers/${id}/edit`}
                    className="min-h-11 rounded-xl border border-slate-400 px-4 py-2.5 text-sm font-semibold text-slate-800 hover:bg-slate-50"
                  >
                    Edit
                  </Link>
                  <button
                    onClick={() => toggle.mutate(c as Charger & { id: string })}
                    disabled={toggle.isPending}
                    className="min-h-11 rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-60"
                  >
                    {c.isActive ? "Deactivate" : "Activate"}
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
