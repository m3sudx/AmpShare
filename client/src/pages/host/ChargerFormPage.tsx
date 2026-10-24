import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router";
import {
  ArrowLeft,
  CircleAlert,
  CircleCheck,
  Crosshair,
  Loader2,
  RefreshCw,
  Trash2,
  TriangleAlert,
} from "lucide-react";
import LocationPicker from "../../components/host/LocationPicker";
import NotHostNotice from "../../components/host/NotHostNotice";
import ScheduleEditor from "../../components/host/ScheduleEditor";
import { useAuth, useToast } from "../../context";
import {
  createCharger,
  deleteCharger,
  getCharger,
  updateCharger,
} from "../../services/chargers.api";
import type { Charger, PlugType, UpdateChargerInput } from "../../types/charger";
import { PLUG_LABELS } from "../../utils/booking";
import { getErrorMessage } from "../../utils/errors";
import { DEFAULT_CENTER, type LatLng } from "../../utils/geo";
import { usePageTitle } from "../../hooks/usePageTitle";

interface Values {
  title: string;
  addressDescription: string;
  powerKw: string;
  plugType: PlugType;
  pricePerKwh: string;
  isActive: boolean;
  location: LatLng;
}

type Errors = Partial<Record<"title" | "addressDescription" | "powerKw" | "pricePerKwh", string>>;

const PLUGS = Object.keys(PLUG_LABELS) as PlugType[];

const EMPTY: Values = {
  title: "",
  addressDescription: "",
  powerKw: "",
  plugType: "TYPE_2",
  pricePerKwh: "",
  isActive: true,
  location: DEFAULT_CENTER,
};

const toValues = (c: Charger): Values => ({
  title: c.title,
  addressDescription: c.addressDescription,
  powerKw: String(c.powerKw),
  plugType: c.plugType,
  pricePerKwh: String(c.pricePerKwh),
  isActive: c.isActive,
  location: { latitude: c.location.latitude, longitude: c.location.longitude },
});

// Mirrors the API's limits so most mistakes are caught before a request is sent
function validate(v: Values): Errors {
  const errors: Errors = {};
  if (!v.title.trim()) errors.title = "Enter a name for this charger.";
  else if (v.title.trim().length > 100) errors.title = "Keep the name under 100 characters.";
  if (!v.addressDescription.trim()) errors.addressDescription = "Describe where the charger is.";
  const power = Number(v.powerKw);
  if (v.powerKw.trim() === "" || !Number.isFinite(power) || power <= 0 || power > 9999.99)
    errors.powerKw = "Enter the power in kW (more than 0, up to 9999.99).";
  const price = Number(v.pricePerKwh);
  if (v.pricePerKwh.trim() === "" || !Number.isFinite(price) || price <= 0 || price > 999999.99)
    errors.pricePerKwh = "Enter the price in ETB per kWh (more than 0).";
  return errors;
}

function Field({
  id,
  label,
  hint,
  error,
  children,
}: {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-semibold text-slate-800">
        {label}
      </label>
      {hint && <p className="text-xs text-slate-500">{hint}</p>}
      <div className="mt-1">{children}</div>
      {error && (
        <p id={`${id}-error`} role="alert" className="mt-1 text-xs text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}

const inputClass = (error?: string) =>
  `w-full rounded-xl border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
    error ? "border-red-400" : "border-slate-300 focus:border-emerald-500"
  }`;

type LoadState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; charger: Charger | null };

export default function ChargerFormPage() {
  usePageTitle("Charger form");
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id;
  const { user } = useAuth();
  const isHost = !!user?.roles.includes("HOST");
  const navigate = useNavigate();
  const location = useLocation();
  const { showToast } = useToast();
  const justCreated = (location.state as { justCreated?: boolean } | null)?.justCreated === true;

  const [state, setState] = useState<LoadState>(
    isEdit ? { status: "loading" } : { status: "ready", charger: null },
  );
  const [attempt, setAttempt] = useState(0);
  const [values, setValues] = useState<Values>(EMPTY);
  const [errors, setErrors] = useState<Errors>({});
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [locating, setLocating] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(() => {
    if (!id || !isHost) return;
    let cancelled = false;
    getCharger(id)
      .then((charger) => {
        if (cancelled) return;
        // hostId is only returned to the owner
        if (!charger.hostId || charger.hostId !== user?.id) {
          setState({ status: "error", message: "You can only edit your own chargers." });
          return;
        }
        setValues(toValues(charger));
        setState({ status: "ready", charger });
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setState({
            status: "error",
            message: getErrorMessage(err, "We couldn't load this charger."),
          });
        }
      });
    return () => {
      cancelled = true;
    };
  }, [id, attempt, isHost, user?.id]);

  const retry = () => {
    setState({ status: "loading" });
    setAttempt((n) => n + 1);
  };

  const set = <K extends keyof Values>(key: K, value: Values[K]) =>
    setValues((prev) => ({ ...prev, [key]: value }));

  const useMyLocation = () => {
    if (!navigator.geolocation) {
      setFormError("Your browser can't share your location. Click the map to place the pin.");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        set("location", { latitude: pos.coords.latitude, longitude: pos.coords.longitude });
        setLocating(false);
      },
      () => {
        setFormError("We couldn't get your location. Click the map to place the pin instead.");
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10_000 },
    );
  };

  async function handleSubmit(e: React.SyntheticEvent) {
    e.preventDefault();
    if (saving) return;
    const found = validate(values);
    setErrors(found);
    setFormError(null);
    if (Object.keys(found).length > 0) return;

    setSaving(true);
    try {
      if (!isEdit) {
        const created = await createCharger({
          title: values.title.trim(),
          addressDescription: values.addressDescription.trim(),
          powerKw: Number(values.powerKw),
          plugType: values.plugType,
          pricePerKwh: Number(values.pricePerKwh),
          location: values.location,
        });
        showToast("Charger created.", "success");
        navigate(`/host/chargers/${created.id}/edit`, { replace: true, state: { justCreated: true } });
        return;
      }

      // Only send what changed; the API rejects an empty update
      const original = state.status === "ready" ? state.charger : null;
      if (!original) return;
      const patch: UpdateChargerInput = {};
      if (values.title.trim() !== original.title) patch.title = values.title.trim();
      if (values.addressDescription.trim() !== original.addressDescription)
        patch.addressDescription = values.addressDescription.trim();
      if (Number(values.powerKw) !== original.powerKw) patch.powerKw = Number(values.powerKw);
      if (values.plugType !== original.plugType) patch.plugType = values.plugType;
      if (Number(values.pricePerKwh) !== original.pricePerKwh)
        patch.pricePerKwh = Number(values.pricePerKwh);
      if (values.isActive !== original.isActive) patch.isActive = values.isActive;
      if (
        values.location.latitude !== original.location.latitude ||
        values.location.longitude !== original.location.longitude
      )
        patch.location = values.location;

      if (Object.keys(patch).length === 0) {
        showToast("No changes to save.", "info");
        return;
      }
      const updated = await updateCharger(original.id, patch);
      setState({ status: "ready", charger: updated });
      setValues(toValues(updated));
      showToast("Charger updated.", "success");
    } catch (err) {
      setFormError(getErrorMessage(err, "We couldn't save this charger. Please try again."));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!id || deleting) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      await deleteCharger(id);
      showToast("Charger deleted.", "success");
      navigate("/host", { replace: true });
    } catch (err) {
      setDeleteError(
        getErrorMessage(err, "We couldn't delete this charger. Pause it instead if it has bookings."),
      );
    } finally {
      setDeleting(false);
    }
  }

  if (!isHost) return <NotHostNotice />;

  const back = (
    <Link
      to="/host"
      className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-slate-900"
    >
      <ArrowLeft className="h-4 w-4" aria-hidden="true" />
      Host dashboard
    </Link>
  );

  if (state.status === "loading") {
    return (
      <div className="mx-auto max-w-3xl space-y-4" aria-busy="true" aria-label="Loading charger">
        <div className="h-6 w-40 animate-pulse rounded bg-slate-200" />
        <div className="h-96 animate-pulse rounded-2xl border border-slate-200 bg-white" />
      </div>
    );
  }

  if (state.status === "error") {
    return (
      <div className="mx-auto max-w-3xl space-y-6">
        {back}
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
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header className="space-y-2">
        {back}
        <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-3xl font-headline">
          {isEdit ? "Edit charger" : "Add a charger"}
        </h1>
        <p className="text-xs text-slate-500 sm:text-sm">
          {isEdit
            ? "Update the details drivers see when they book."
            : "Tell drivers what you're offering and where. You'll set weekly hours next."}
        </p>
      </header>

      {justCreated && (
        <p
          role="status"
          className="flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800"
        >
          <CircleCheck className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          Charger created. Add your weekly hours below so drivers can book it.
        </p>
      )}

      <form
        onSubmit={handleSubmit}
        noValidate
        className="space-y-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
      >
        <Field id="title" label="Charger name" error={errors.title}>
          <input
            id="title"
            value={values.title}
            onChange={(e) => set("title", e.target.value)}
            maxLength={100}
            placeholder="e.g. Bole Medhanealem FastHub"
            aria-invalid={!!errors.title}
            aria-describedby={errors.title ? "title-error" : undefined}
            className={inputClass(errors.title)}
          />
        </Field>

        <Field
          id="address"
          label="Address or landmark"
          hint="Help drivers find you, e.g. street and a nearby landmark."
          error={errors.addressDescription}
        >
          <input
            id="address"
            value={values.addressDescription}
            onChange={(e) => set("addressDescription", e.target.value)}
            aria-invalid={!!errors.addressDescription}
            aria-describedby={errors.addressDescription ? "address-error" : undefined}
            className={inputClass(errors.addressDescription)}
          />
        </Field>

        <div className="grid gap-5 sm:grid-cols-3">
          <Field id="power" label="Power (kW)" error={errors.powerKw}>
            <input
              id="power"
              type="number"
              inputMode="decimal"
              min={0}
              step="0.1"
              value={values.powerKw}
              onChange={(e) => set("powerKw", e.target.value)}
              aria-invalid={!!errors.powerKw}
              aria-describedby={errors.powerKw ? "power-error" : undefined}
              className={inputClass(errors.powerKw)}
            />
          </Field>
          <Field id="plug" label="Plug type">
            <select
              id="plug"
              value={values.plugType}
              onChange={(e) => set("plugType", e.target.value as PlugType)}
              className={inputClass()}
            >
              {PLUGS.map((p) => (
                <option key={p} value={p}>
                  {PLUG_LABELS[p]}
                </option>
              ))}
            </select>
          </Field>
          <Field id="price" label="Price (ETB / kWh)" error={errors.pricePerKwh}>
            <input
              id="price"
              type="number"
              inputMode="decimal"
              min={0}
              step="0.01"
              value={values.pricePerKwh}
              onChange={(e) => set("pricePerKwh", e.target.value)}
              aria-invalid={!!errors.pricePerKwh}
              aria-describedby={errors.pricePerKwh ? "price-error" : undefined}
              className={inputClass(errors.pricePerKwh)}
            />
          </Field>
        </div>

        <div>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="text-sm font-semibold text-slate-800">Location</p>
              <p className="text-xs text-slate-500">Click the map to place the pin on your charger.</p>
            </div>
            <button
              type="button"
              onClick={useMyLocation}
              disabled={locating}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
            >
              {locating ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              ) : (
                <Crosshair className="h-4 w-4" aria-hidden="true" />
              )}
              Use my location
            </button>
          </div>
          <div className="mt-2">
            <LocationPicker value={values.location} onChange={(v) => set("location", v)} />
          </div>
          <p className="mt-1 text-xs text-slate-500">
            {values.location.latitude.toFixed(5)}, {values.location.longitude.toFixed(5)}
          </p>
        </div>

        {isEdit && (
          <label className="flex items-start gap-3 rounded-xl bg-slate-50 p-3 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={values.isActive}
              onChange={(e) => set("isActive", e.target.checked)}
              className="mt-0.5"
            />
            <span>
              <span className="font-semibold">Accepting bookings</span>
              <span className="block text-xs text-slate-500">
                Turn off to pause new bookings without deleting the charger.
              </span>
            </span>
          </label>
        )}

        {formError && (
          <p
            role="alert"
            className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700"
          >
            {formError}
          </p>
        )}

        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Link
            to="/host"
            className="rounded-xl border border-slate-200 px-5 py-2.5 text-center text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            {isEdit ? "Back" : "Cancel"}
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#0F9468] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#0c7d58] focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:opacity-70"
          >
            {saving && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
            {saving ? "Saving..." : isEdit ? "Save changes" : "Create charger"}
          </button>
        </div>
      </form>

      {isEdit && id && <ScheduleEditor chargerId={id} />}

      {isEdit && (
        <section className="rounded-2xl border border-red-200 bg-white p-5 shadow-sm sm:p-6">
          <h2 className="text-lg font-bold text-red-700">Delete charger</h2>
          <p className="mt-1 text-sm text-slate-600">
            This removes the charger and its weekly hours. A charger that already has bookings can't
            be deleted; pause it instead.
          </p>
          {!confirmDelete ? (
            <button
              type="button"
              onClick={() => setConfirmDelete(true)}
              className="mt-3 inline-flex items-center gap-2 rounded-xl border border-red-200 px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-50"
            >
              <Trash2 className="h-4 w-4" aria-hidden="true" />
              Delete this charger
            </button>
          ) : (
            <div className="mt-3 space-y-3">
              <p className="flex items-center gap-2 text-sm font-semibold text-red-700">
                <TriangleAlert className="h-4 w-4" aria-hidden="true" />
                Delete this charger permanently?
              </p>
              {deleteError && (
                <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                  {deleteError}
                </p>
              )}
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setConfirmDelete(false);
                    setDeleteError(null);
                  }}
                  disabled={deleting}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Keep charger
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={deleting}
                  className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-70"
                >
                  {deleting && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
                  {deleting ? "Deleting..." : "Yes, delete"}
                </button>
              </div>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
