import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router";
import { z } from "zod";
import LocationPicker from "../../components/chargers/LocationPicker";
import { createCharger } from "../../services/chargers.api";

const DEFAULT_POINT = { lat: 9.03, lng: 38.74 }; // Addis Ababa

// All fields are strings in the form; they're converted to numbers on submit
const positive = (label: string, max: number) =>
  z
    .string()
    .trim()
    .min(1, `Enter the ${label}`)
    .refine((v) => Number.isFinite(Number(v)) && Number(v) > 0, `The ${label} must be greater than 0`)
    .refine((v) => Number(v) <= max, `The ${label} can't be more than ${max}`);

const coordinate = (label: string, limit: number) =>
  z
    .string()
    .trim()
    .min(1, `Enter the ${label}`)
    .refine(
      (v) => Number.isFinite(Number(v)) && Math.abs(Number(v)) <= limit,
      `The ${label} must be between -${limit} and ${limit}`,
    );

const schema = z.object({
  title: z.string().trim().min(1, "Enter a name for your charger").max(100, "Use at most 100 characters"),
  addressDescription: z.string().trim().min(1, "Describe where drivers can find it"),
  plugType: z.enum(["GB/T", "TYPE_2", "CCS2"]),
  powerKw: positive("power", 9999.99),
  pricePerKwh: positive("price", 999999.99),
  timezoneName: z.string(),
  latitude: coordinate("latitude", 90),
  longitude: coordinate("longitude", 180),
});

type FormValues = z.infer<typeof schema>;

const PLUGS = [
  { value: "GB/T", label: "GB/T" },
  { value: "TYPE_2", label: "Type 2" },
  { value: "CCS2", label: "CCS2" },
] as const;

function errorMessage(error: unknown) {
  if (isAxiosError(error)) {
    if (error.response?.status === 401) return "Please sign in to add a charger.";
    if (error.response?.status === 403) return "Only hosts can add chargers.";
    return error.response?.data?.message ?? "Couldn't create the charger.";
  }
  return "Something went wrong. Please try again.";
}

const inputClass = (hasError: boolean) =>
  `h-11 w-full rounded-xl border bg-white px-3.5 text-[15px] text-slate-900 focus:outline-none focus:ring-2 ${
    hasError
      ? "border-red-600 focus:ring-red-200"
      : "border-slate-400 focus:border-[#0F9468] focus:ring-[#0F9468]/20"
  }`;

function Field({
  label,
  htmlFor,
  hint,
  error,
  children,
}: {
  label: string;
  htmlFor: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={htmlFor} className="text-sm font-semibold text-slate-800">
        {label}
      </label>
      {children}
      {error ? (
        <p role="alert" className="text-[13px] font-medium text-red-700">
          {error}
        </p>
      ) : hint ? (
        <p className="text-[13px] text-slate-500">{hint}</p>
      ) : null}
    </div>
  );
}

const Card = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <section className="space-y-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-7">
    <h2 className="text-xl font-bold text-slate-900">{title}</h2>
    {children}
  </section>
);

export default function AddChargerPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    mode: "onTouched",
    defaultValues: {
      title: "",
      addressDescription: "",
      plugType: "GB/T",
      powerKw: "",
      pricePerKwh: "",
      timezoneName: "Africa/Addis_Ababa",
      latitude: DEFAULT_POINT.lat.toFixed(6),
      longitude: DEFAULT_POINT.lng.toFixed(6),
    },
  });

  const values = watch();

  const mutation = useMutation({
    mutationFn: (v: FormValues) =>
      createCharger({
        title: v.title.trim(),
        addressDescription: v.addressDescription.trim(),
        powerKw: Number(v.powerKw),
        plugType: v.plugType,
        pricePerKwh: Number(v.pricePerKwh),
        timezoneName: v.timezoneName,
        location: { latitude: Number(v.latitude), longitude: Number(v.longitude) },
      }),
    onSuccess: (charger) => {
      queryClient.invalidateQueries({ queryKey: ["chargers"] });
      navigate(`/host/chargers/${charger.id}/schedules`);
    },
  });

  // the map shows the typed coordinates when they're valid, otherwise the default point
  const latNum = Number(values.latitude);
  const lngNum = Number(values.longitude);
  const validPoint =
    values.latitude.trim() !== "" &&
    values.longitude.trim() !== "" &&
    Number.isFinite(latNum) &&
    Number.isFinite(lngNum) &&
    Math.abs(latNum) <= 90 &&
    Math.abs(lngNum) <= 180;
  const point = validPoint ? { lat: latNum, lng: lngNum } : DEFAULT_POINT;

  function setPoint(lat: number, lng: number) {
    setValue("latitude", lat.toFixed(6), { shouldValidate: true, shouldDirty: true });
    setValue("longitude", lng.toFixed(6), { shouldValidate: true, shouldDirty: true });
  }

  function useMyLocation() {
    navigator.geolocation.getCurrentPosition((pos) => setPoint(pos.coords.latitude, pos.coords.longitude));
  }

  const price = Number(values.pricePerKwh);

  return (
    <div className="space-y-5">
      <Link to="/host" className="inline-flex text-sm font-semibold text-slate-600 hover:text-slate-900">
        ← My chargers
      </Link>

      <div>
        <h1 className="text-3xl font-extrabold text-slate-900">Add a charger</h1>
        <p className="text-slate-600">List your charger so nearby drivers can find and book it.</p>
      </div>

      <div className="rounded-xl border border-blue-200 bg-blue-50 p-3.5 text-[15px] text-blue-900">
        New chargers start as <strong>inactive</strong>. Add your weekly schedule first, then activate the
        listing from My chargers.
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-[1fr_360px]">
        <form
          onSubmit={handleSubmit((v) => mutation.mutate(v))}
          noValidate
          className="min-w-0 space-y-6"
        >
          <Card title="Basics">
            <Field label="Charger name" htmlFor="title" error={errors.title?.message} hint="Shown on the card and the map">
              <input id="title" type="text" maxLength={100} className={inputClass(!!errors.title)} {...register("title")} />
              <span className="self-end text-[13px] text-slate-500">{values.title.length} / 100</span>
            </Field>
            <Field
              label="Address description"
              htmlFor="addressDescription"
              error={errors.addressDescription?.message}
              hint="Help drivers find the exact spot, e.g. Bole, near Edna Mall, blue gate"
            >
              <textarea
                id="addressDescription"
                rows={3}
                className={`${inputClass(!!errors.addressDescription)} h-auto py-3`}
                {...register("addressDescription")}
              />
            </Field>
          </Card>

          <Card title="Charging specs">
            <fieldset className="min-w-0 space-y-2.5">
              <legend className="mb-2.5 text-sm font-semibold text-slate-800">Plug type</legend>
              <div className="flex flex-wrap gap-3">
                {PLUGS.map((p) => (
                  <label
                    key={p.value}
                    className="flex min-w-36 flex-1 cursor-pointer items-center gap-2.5 rounded-xl border-2 border-slate-300 bg-white p-4 text-base font-bold text-slate-900 has-checked:border-[#0F9468] has-checked:bg-[#F0FAF6]"
                  >
                    <input
                      type="radio"
                      value={p.value}
                      className="h-4.5 w-4.5 accent-[#0F9468]"
                      {...register("plugType")}
                    />
                    {p.label}
                  </label>
                ))}
              </div>
            </fieldset>

            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Power" htmlFor="powerKw" error={errors.powerKw?.message} hint="Up to 9999.99 kW">
                <div className="relative">
                  <input
                    id="powerKw"
                    inputMode="decimal"
                    placeholder="e.g. 7"
                    className={`${inputClass(!!errors.powerKw)} pr-14`}
                    {...register("powerKw")}
                  />
                  <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-sm text-slate-500">
                    kW
                  </span>
                </div>
              </Field>
              <Field label="Price" htmlFor="pricePerKwh" error={errors.pricePerKwh?.message} hint="Charged per kWh delivered">
                <div className="relative">
                  <input
                    id="pricePerKwh"
                    inputMode="decimal"
                    placeholder="e.g. 12.50"
                    className={`${inputClass(!!errors.pricePerKwh)} pr-24`}
                    {...register("pricePerKwh")}
                  />
                  <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-sm text-slate-500">
                    ETB / kWh
                  </span>
                </div>
              </Field>
            </div>

            <Field label="Time zone" htmlFor="timezoneName" hint="Your weekly schedule is read in this time zone">
              <select id="timezoneName" className={inputClass(false)} {...register("timezoneName")}>
                <option value="Africa/Addis_Ababa">Africa/Addis_Ababa (UTC+3)</option>
              </select>
            </Field>
          </Card>

          <Card title="Location">
            <div className="flex justify-end">
              <button
                type="button"
                onClick={useMyLocation}
                className="rounded-xl border border-[#0F9468] px-4 py-2.5 text-sm font-semibold text-[#0F9468]"
              >
                Use my location
              </button>
            </div>
            <LocationPicker lat={point.lat} lng={point.lng} onChange={setPoint} />
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Latitude" htmlFor="latitude" error={errors.latitude?.message} hint="Between -90 and 90">
                <input id="latitude" inputMode="decimal" className={inputClass(!!errors.latitude)} {...register("latitude")} />
              </Field>
              <Field label="Longitude" htmlFor="longitude" error={errors.longitude?.message} hint="Between -180 and 180">
                <input id="longitude" inputMode="decimal" className={inputClass(!!errors.longitude)} {...register("longitude")} />
              </Field>
            </div>
          </Card>

          {mutation.isError && (
            <p role="alert" className="rounded-xl bg-red-50 p-3.5 text-sm font-medium text-red-700">
              {errorMessage(mutation.error)}
            </p>
          )}

          <div className="flex flex-wrap items-center justify-end gap-3">
            <Link to="/host" className="rounded-xl px-5 py-3 text-base font-semibold text-slate-700">
              Cancel
            </Link>
            <button
              type="submit"
              disabled={mutation.isPending}
              className="rounded-xl bg-[#0F9468] px-7 py-3 text-base font-bold text-white hover:bg-[#0c7a56] disabled:opacity-60"
            >
              {mutation.isPending ? "Creating…" : "Create charger"}
            </button>
          </div>
        </form>

        <aside className="space-y-4 lg:sticky lg:top-6">
          <section className="space-y-3.5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-base font-bold text-slate-900">How drivers will see it</h2>
            <div className="rounded-2xl border border-slate-200 p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="truncate font-semibold text-slate-900">
                    {values.title.trim() || "Your charger name"}
                  </div>
                  <div className="text-sm text-slate-500">1.2 km away</div>
                </div>
                <div className="shrink-0 font-bold text-[#0F9468]">
                  {price > 0 ? price.toFixed(2) : "—"}{" "}
                  <span className="text-xs font-medium text-slate-500">ETB/kWh</span>
                </div>
              </div>
              <div className="mt-3 flex gap-2 text-xs font-medium text-slate-700">
                <span className="rounded-full bg-slate-100 px-2.5 py-1">
                  {PLUGS.find((p) => p.value === values.plugType)?.label}
                </span>
                <span className="rounded-full bg-slate-100 px-2.5 py-1">
                  {Number(values.powerKw) > 0 ? `${Number(values.powerKw)} kW` : "— kW"}
                </span>
              </div>
            </div>
          </section>

          <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-base font-bold text-slate-900">What happens next</h2>
            <ol className="space-y-3.5 text-[15px]">
              {[
                ["Create the charger", "You are here"],
                ["Set your weekly schedule", "Choose the hours drivers can book"],
                ["Activate the listing", "It then appears in Find Chargers"],
              ].map(([title, sub], i) => (
                <li key={title} className="flex items-start gap-3">
                  <span
                    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                      i === 0 ? "bg-[#0F9468] text-white" : "border-2 border-slate-400 text-slate-600"
                    }`}
                  >
                    {i + 1}
                  </span>
                  <span className="leading-snug">
                    <strong className="text-slate-900">{title}</strong>
                    <br />
                    <span className="text-slate-500">{sub}</span>
                  </span>
                </li>
              ))}
            </ol>
          </section>
        </aside>
      </div>
    </div>
  );
}