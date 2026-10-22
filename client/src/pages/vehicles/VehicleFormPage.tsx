import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import axios from "axios";
import { AlertCircle, ArrowLeft, CarFront, Loader2 } from "lucide-react";
import VehicleForm, { type VehicleFormValues } from "../../components/vehicles/VehicleForm";
import { useToast } from "../../context";
import {
  createVehicleRequest,
  getVehicleByIdRequest,
  updateVehicleRequest,
} from "../../services/vehicles.api";
import type { CreateVehiclePayload, UpdateVehiclePayload, Vehicle } from "../../types/vehicle";

export default function VehicleFormPage() {
  const { id } = useParams<{ id: string }>();
  const isEditMode = Boolean(id);
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [initialVehicle, setInitialVehicle] = useState<Vehicle | null>(null);
  const [isLoadingInitial, setIsLoadingInitial] = useState<boolean>(isEditMode);
  const [notFoundError, setNotFoundError] = useState<string | null>(null);

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [serverError, setServerError] = useState<string | null>(null);

  // Fetch initial vehicle if in edit mode
  useEffect(() => {
    if (!id) return;

    let ignore = false;

    async function loadVehicle() {
      setIsLoadingInitial(true);
      setNotFoundError(null);
      try {
        const vehicle = await getVehicleByIdRequest(id!);
        if (!ignore) {
          setInitialVehicle(vehicle);
        }
      } catch (err: unknown) {
        if (!ignore) {
          if (axios.isAxiosError(err) && err.response?.status === 404) {
            setNotFoundError("The requested vehicle could not be found or you do not have permission to view it.");
          } else {
            setNotFoundError("Unable to load vehicle details. Please verify your connection.");
          }
        }
      } finally {
        if (!ignore) {
          setIsLoadingInitial(false);
        }
      }
    }

    loadVehicle();

    return () => {
      ignore = true;
    };
  }, [id]);

  const handleSubmit = async (values: CreateVehiclePayload) => {
    setServerError(null);
    setIsSubmitting(true);

    try {
      if (isEditMode && id && initialVehicle) {
        // Build PATCH payload containing ONLY changed fields
        const patchPayload: UpdateVehiclePayload = {};

        if (values.make !== initialVehicle.make) {
          patchPayload.make = values.make;
        }
        if (values.model !== initialVehicle.model) {
          patchPayload.model = values.model;
        }
        if (values.batteryCapacityKwh !== initialVehicle.batteryCapacityKwh) {
          patchPayload.batteryCapacityKwh = values.batteryCapacityKwh;
        }
        if (values.plugType !== initialVehicle.plugType) {
          patchPayload.plugType = values.plugType;
        }

        // If nothing was modified, navigate back without request
        if (Object.keys(patchPayload).length === 0) {
          showToast("No changes were made.", "info");
          navigate("/vehicles");
          return;
        }

        await updateVehicleRequest(id, patchPayload);
        showToast(
          `${values.make} ${values.model} was updated successfully!`,
          "success"
        );
        navigate("/vehicles");
      } else {
        // Create vehicle flow
        const created = await createVehicleRequest(values);
        showToast(
          `${created.make} ${created.model} was successfully registered!`,
          "success"
        );
        navigate("/vehicles");
      }
    } catch (err: unknown) {
      let message = "An error occurred while saving the vehicle. Please try again.";
      if (axios.isAxiosError(err)) {
        if (err.response?.data?.message) {
          message = String(err.response.data.message);
        }
      }
      setServerError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formInitialValues: VehicleFormValues | undefined = initialVehicle
    ? {
        make: initialVehicle.make,
        model: initialVehicle.model,
        batteryCapacityKwh: initialVehicle.batteryCapacityKwh,
        plugType: initialVehicle.plugType,
      }
    : undefined;

  return (
    <div className="max-w-3xl mx-auto space-y-4 sm:space-y-6 animate-in fade-in duration-150">
      {/* Back Button & Header */}
      <div>
        <Link
          to="/vehicles"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors mb-2.5 sm:mb-3 group"
        >
          <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-0.5" />
          <span>Back to My Vehicles</span>
        </Link>

        <div className="flex items-center gap-2.5 sm:gap-3">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-emerald-50 text-[#0F9468] flex items-center justify-center shrink-0 border border-emerald-100">
            <CarFront className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div>
            <h1 className="text-xl sm:text-3xl font-bold tracking-tight text-slate-900 font-headline">
              {isEditMode ? "Edit Vehicle" : "Add New Vehicle"}
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              {isEditMode
                ? "Update your vehicle specifications and connector details."
                : "Register an electric vehicle to easily discover chargers and book charging slots."}
            </p>
          </div>
        </div>
      </div>

      {/* Main Form Card Container */}
      <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200/90 p-4 sm:p-7 md:p-9 shadow-sm">
        {isLoadingInitial ? (
          <div className="py-16 flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-[#0F9468]" />
            <p className="text-xs font-medium text-slate-500">
              Loading vehicle details...
            </p>
          </div>
        ) : notFoundError ? (
          <div className="text-center py-10 space-y-4">
            <div className="w-12 h-12 rounded-full bg-red-50 text-red-600 flex items-center justify-center mx-auto">
              <AlertCircle className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Vehicle Not Found</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                {notFoundError}
              </p>
            </div>
            <Link
              to="/vehicles"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-semibold hover:bg-slate-800 transition-colors"
            >
              Return to My Vehicles
            </Link>
          </div>
        ) : (
          <VehicleForm
            key={initialVehicle?.id || "new"}
            initialValues={formInitialValues}
            onSubmit={handleSubmit}
            isSubmitting={isSubmitting}
            mode={isEditMode ? "edit" : "create"}
            serverError={serverError}
          />
        )}
      </div>
    </div>
  );
}
