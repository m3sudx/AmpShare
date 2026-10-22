import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import { useEffect } from "react";
import { useForm, useWatch } from "react-hook-form";
import { Link, useNavigate, useParams } from "react-router";
import { z } from "zod";
import LocationPicker from "../../components/chargers/LocationPicker";
import { useCharger } from "../../hooks/useChargerDetails";
import { updateCharger } from "../../services/chargers.api";

const num = (max: number, label: string) =>
  z
    .string()
    .trim()
    .refine((v) => v !== "" && !Number.isNaN(Number(v)) && Number(v) > 0, `${label} must be greater than 0`)
    .refine((v) => Number(v) <= max, `${label} must be at most ${max}`);

const coord = (min: number, max: number, label: string) =>
  z
    .string()
    .trim()
    .refine((v) => v !== "" && !Number.isNaN(Number(v)) && Number(v) >= min && Number(v) <= max, `Invalid ${label}`);

const schema = z.object({
  title: z.string().trim().min(1, "Title is required").max(100, "Max 100 characters"),
  addressDescription: z.string().trim().min(1, "Address is required"),
  powerKw: num(9999.99, "Power"),
  pricePerKwh: num(999999.99, "Price"),
  plugType: z.enum(["GB/T", "TYPE_2", "CCS2"]),
  timezoneName: z.string().trim().min(1, "Timezone is required"),
  latitude: coord(-90, 90, "latitude"),
  longitude: coord(-180, 180, "longitude"),
});
type FormValues = z.infer<typeof schema>;

const PLUGS = [
  { value: "GB/T", label: "GB/T" },
  { value: "TYPE_2", label: "Type 2" },
  { value: "CCS2", label: "CCS2" },
] as const;

function errorMessage(error: unknown) {
  if (isAxiosError(error)) {
    const status = error.response?.status;
    if (status === 401) return "Please sign in as a host.";
    if (status === 403) return "Only hosts can edit chargers.";
    if (status === 404) return "Not found. You can only edit your own chargers.";
    return error.response?.data?.message ?? "Something went wrong. Please try again.";
  }
  return "Something went wrong. Please try again.";
}

const field =
  "h-12 w-full rounded-xl border border-slate-400 bg-white px-3.5 text-base text-slate-900 focus:border-[#0F9468] focus:outline-none focus:ring-2 focus:ring-[#0F9468]/20";

export default function EditChargerPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const chargerQuery = useCharger(id);

  const {
    register,
    handleSubmit,
    reset,
    control,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  // Fill the form once the charger loads
  useEffect(() => {
    const c = chargerQuery.data;
    if (!c) return;
    reset({
      title: c.title,
      addressDescription: c.addressDescription,
      powerKw: String(c.powerKw),
      pricePerKwh: String(c.pricePerKwh),
      plugType: c.plugType,
      timezoneName: c.timezoneName,
      latitude: String(c.location.latitude),
      longitude: String(c.location.longitude),
    });
  }, [chargerQuery.data, reset]);

  const mutation = useMutation({
    mutationFn: (v: FormValues) =>
      updateCharger(id!, {
        title: v.title,
        addressDescription: v.addressDescription,
        powerKw: Number(v.powerKw),
        pricePerKwh: Number(v.pricePerKwh),
        plugType: v.plugType,
        timezoneName: v.timezoneName,
        location: { latitude: Number(v.latitude), longitude: Number(v.longitude) },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chargers"] });
      queryClient.invalidateQueries({ queryKey: ["charger", id] });
      navigate("/host");
    },
  });

  const lat = Number(useWatch({ control, name: "latitude" }));
  const lng = Number(useWatch({ control, name: "longitude" }));

  if (chargerQuery.isLoading) {
    return <div className="h-96 animate-pulse rounded-2xl bg-slate-200" />;
  }
  if (chargerQuery.isError || !chargerQuery.data) {
    return (
      <div className="space-y-4">
        <Link to="/host" className="text-sm font-semibold text-slate-600">
          ← My chargers
        </Link>
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <p className="text-lg font-semibold text-slate-900">Charger not found</p>
        </div>
      </div>
    );
  }

  const fieldError = (name: keyof FormValues) =>
    errors[name] ? (
      <p className="text-sm font-medium text-red-700">{errors[name]?.message}</p>
    ) : null;

  return (
    <div className="space-y-5">
      <Link to="/host" className="inline-flex text-sm font-semibold text-slate-600 hover:text-slate-900">
        ← My chargers
      </Link>
      <h1 className="text-3xl font-extrabold text-slate-900">Edit charger</h1>

      <form
        onSubmit={handleSubmit((v) => mutation.mutate(v))}
        noValidate
        className="space-y-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
      >
        {mutation.isError && (
          <p role="alert" className="rounded-xl bg-red-50 p-3.5 text-sm font-medium text-red-700">
            {errorMessage(mutation.error)}
          </p>
        )}

        <div className="space-y-1.5">
          <label htmlFor="title" className="text-sm font-semibold text-slate-800">Title</label>
          <input id="title" className={field} {...register("title")} />
          {fieldError("title")}
        </div>

        <div className="space-y-1.5">
          <label htmlFor="addr" className="text-sm font-semibold text-slate-800">Address description</label>
          <input id="addr" className={field} {...register("addressDescription")} />
          {fieldError("addressDescription")}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <label htmlFor="power" className="text-sm font-semibold text-slate-800">Power (kW)</label>
            <input id="power" inputMode="decimal" className={field} {...register("powerKw")} />
            {fieldError("powerKw")}
          </div>
          <div className="space-y-1.5">
            <label htmlFor="price" className="text-sm font-semibold text-slate-800">Price per kWh (ETB)</label>
            <input id="price" inputMode="decimal" className={field} {...register("pricePerKwh")} />
            {fieldError("pricePerKwh")}
          </div>
        </div>

        <fieldset className="space-y-1.5">
          <legend className="text-sm font-semibold text-slate-800">Plug type</legend>
          <div className="flex flex-wrap gap-3">
            {PLUGS.map((p) => (
              <label
                key={p.value}
                className="flex min-h-12 cursor-pointer items-center gap-2 rounded-xl border border-slate-400 px-4 font-semibold text-slate-800 has-checked:border-[#0F9468] has-checked:bg-[#F0FAF6]"
              >
                <input type="radio" value={p.value} className="accent-[#0F9468]" {...register("plugType")} />
                {p.label}
              </label>
            ))}
          </div>
        </fieldset>

        <div className="space-y-1.5">
          <label htmlFor="tz" className="text-sm font-semibold text-slate-800">Timezone</label>
          <input id="tz" className={field} {...register("timezoneName")} />
          {fieldError("timezoneName")}
        </div>

        <div className="space-y-2">
          <span className="text-sm font-semibold text-slate-800">Location</span>
          {Number.isFinite(lat) && Number.isFinite(lng) && (
            <LocationPicker
              lat={lat}
              lng={lng}
              onChange={(la: number, ln: number) => {
                setValue("latitude", la.toFixed(6), { shouldValidate: true });
                setValue("longitude", ln.toFixed(6), { shouldValidate: true });
              }}
            />
          )}
          {fieldError("latitude")}
          {fieldError("longitude")}
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            type="submit"
            disabled={mutation.isPending}
            className="min-h-12 rounded-xl bg-[#0F9468] px-8 text-base font-bold text-white hover:bg-[#0c7a56] disabled:opacity-60"
          >
            {mutation.isPending ? "Saving…" : "Save changes"}
          </button>
          <Link
            to="/host"
            className="flex min-h-12 items-center rounded-xl border border-slate-400 px-6 font-semibold text-slate-800"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}