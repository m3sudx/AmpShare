import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router";
import axios from "axios";
import {
  AlertCircle,
  CarFront,
  Plus,
  RotateCw,
  ShieldCheck,
  X,
  Zap,
} from "lucide-react";
import DeleteVehicleDialog from "../../components/vehicles/DeleteVehicleDialog";
import VehicleCard from "../../components/vehicles/VehicleCard";
import VehicleSkeleton from "../../components/vehicles/VehicleSkeleton";
import { useToast } from "../../context";
import {
  deleteVehicleRequest,
  getVehiclesRequest,
} from "../../services/vehicles.api";
import type { Vehicle } from "../../types/vehicle";
import { usePageTitle } from "../../hooks/usePageTitle";

export default function VehiclesPage() {
  usePageTitle("My vehicles");
  const { showToast } = useToast();

  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Deletion modal state
  const [vehicleToDelete, setVehicleToDelete] = useState<Vehicle | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  // 409 Conflict Banner (e.g. vehicle linked to an active booking)
  const [conflictBanner, setConflictBanner] = useState<string | null>(null);

  const [reloadTrigger, setReloadTrigger] = useState(0);

  const fetchVehicles = useCallback(() => {
    setIsLoading(true);
    setErrorMessage(null);
    setReloadTrigger((n) => n + 1);
  }, []);

  useEffect(() => {
    let ignore = false;

    async function loadVehicles() {
      try {
        const data = await getVehiclesRequest();
        if (!ignore) {
          setVehicles(data || []);
        }
      } catch (err: unknown) {
        if (!ignore) {
          let msg =
            "Failed to load your vehicles. Please check your network connection and retry.";
          if (axios.isAxiosError(err) && err.response?.data?.message) {
            msg = String(err.response.data.message);
          }
          setErrorMessage(msg);
        }
      } finally {
        if (!ignore) {
          setIsLoading(false);
        }
      }
    }

    loadVehicles();

    return () => {
      ignore = true;
    };
  }, [reloadTrigger]);

  // Handle Delete Confirmation
  const handleConfirmDelete = async () => {
    if (!vehicleToDelete) return;

    setIsDeleting(true);
    setConflictBanner(null);

    try {
      // DELETE returns 204 No Content
      await deleteVehicleRequest(vehicleToDelete.id);

      // Remove from local list
      setVehicles((prev) => prev.filter((v) => v.id !== vehicleToDelete.id));
      setVehicleToDelete(null);
      showToast(
        `${vehicleToDelete.make} ${vehicleToDelete.model} was successfully removed.`,
        "success",
      );
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        if (err.response?.status === 409) {
          // Booking conflict
          const reason =
            err.response.data?.message ||
            "This vehicle cannot be deleted because it is currently linked to an active booking or charging session.";
          setConflictBanner(
            `Cannot delete ${vehicleToDelete.make} ${vehicleToDelete.model}: ${reason}`,
          );
          setVehicleToDelete(null);
          return;
        }
      }
      showToast("Unable to delete vehicle. Please try again.", "error");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-5 sm:space-y-7 animate-in fade-in duration-200">
      {/* 409 Conflict Banner (Dismissible) */}
      {conflictBanner && (
        <div
          role="alert"
          className="bg-amber-50/90 border border-amber-200/90 rounded-2xl p-3.5 sm:p-4.5 flex items-start justify-between gap-3 shadow-xs"
        >
          <div className="flex items-start gap-2.5 sm:gap-3 min-w-0">
            <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-amber-900">
                Scheduled Session Conflict Notice
              </h4>
              <p className="text-xs text-amber-800 mt-1 leading-relaxed">
                {conflictBanner}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setConflictBanner(null)}
            aria-label="Dismiss alert"
            className="p-1 text-amber-600 hover:text-amber-900 rounded-lg hover:bg-amber-100 transition-colors shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Page Header & Action Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3.5 sm:gap-4 pb-1">
        <div>
          <h1 className="text-xl sm:text-3xl font-bold tracking-tight text-slate-900 font-headline">
            My Vehicles
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Manage the electric vehicles you use with AmpShare across Addis
            Ababa.
          </p>
        </div>

        {/* Add vehicle button */}
        <Link
          to="/vehicles/new"
          className="inline-flex items-center justify-center gap-2 bg-[#0F9468] hover:bg-[#0c7d58] active:bg-[#086a4c] text-white px-5 py-2.5 rounded-xl text-xs font-semibold shadow-sm hover:shadow transition-all duration-150 w-full sm:w-auto cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add vehicle</span>
        </Link>
      </div>

      {/* Main Content Area based on state */}
      {isLoading ? (
        /* Loading Skeleton */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-6">
          <VehicleSkeleton />
          <VehicleSkeleton />
          <VehicleSkeleton />
        </div>
      ) : errorMessage ? (
        /* Error State with Retry */
        <div className="bg-white rounded-2xl border border-red-200/80 p-6 sm:p-8 shadow-xs text-center max-w-lg mx-auto my-4 sm:my-6">
          <div className="w-12 h-12 rounded-full bg-red-50 text-red-600 flex items-center justify-center mx-auto mb-3">
            <AlertCircle className="w-6 h-6 text-red-600" />
          </div>
          <h3 className="text-base font-bold text-slate-900">
            Failed to load vehicles
          </h3>
          <p className="text-xs text-slate-500 mt-1 mb-5 max-w-sm mx-auto">
            {errorMessage}
          </p>
          <button
            type="button"
            onClick={fetchVehicles}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-white transition-colors cursor-pointer"
          >
            <RotateCw className="w-3.5 h-3.5" />
            <span>Retry</span>
          </button>
        </div>
      ) : vehicles.length === 0 ? (
        /* Empty State */
        <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200/80 p-6 sm:p-14 shadow-sm text-center max-w-xl mx-auto my-4 sm:my-6">
          <div className="w-14 h-14 sm:w-16 sm:h-16 bg-emerald-50 border border-emerald-200 rounded-full flex items-center justify-center mx-auto mb-4 text-[#0F9468]">
            <CarFront className="w-7 h-7 sm:w-8 sm:h-8" />
          </div>
          <h3 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
            No vehicles added yet
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto mt-2 mb-6 leading-relaxed">
            Register your EV with AmpShare to easily discover compatible
            chargers, reserve slots, and charge effortlessly across Addis Ababa.
          </p>
          <Link
            to="/vehicles/new"
            className="inline-flex items-center justify-center gap-2 bg-[#0F9468] hover:bg-[#0c7d58] text-white px-6 py-2.5 sm:py-3 rounded-xl text-xs sm:text-sm font-semibold shadow-sm hover:shadow transition-all duration-150 w-full sm:w-auto cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add your first vehicle</span>
          </Link>
        </div>
      ) : (
        /* Populated Vehicles Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-6">
          {vehicles.map((vehicle, idx) => (
            <VehicleCard
              key={vehicle.id}
              vehicle={vehicle}
              isPrimary={idx === 0}
              onDeleteClick={(v) => setVehicleToDelete(v)}
            />
          ))}
        </div>
      )}

      {/* Network Hardware Compatibility Guarantee Card */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 sm:gap-4">
          <div className="flex items-start sm:items-center gap-3 sm:gap-3.5">
            <div className="p-2 sm:p-2.5 bg-emerald-50 rounded-xl text-[#0F9468] shrink-0 border border-emerald-100 mt-0.5 sm:mt-0">
              <Zap className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div>
              <h4 className="text-xs sm:text-sm font-bold text-slate-900 tracking-tight">
                AmpShare Plug Compatibility Guarantee
              </h4>
              <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5 leading-relaxed">
                Our peer host network supports GB/T (China import), CCS 2
                (Combo), and Type 2 (Mennekes) AC/DC connectors.
              </p>
            </div>
          </div>

          <div className="inline-flex items-center gap-1.5 sm:gap-2 text-[10px] sm:text-[11px] font-semibold text-emerald-800 bg-emerald-50/80 border border-emerald-200/80 px-2.5 sm:px-3 py-1.5 rounded-lg shrink-0 self-start sm:self-auto">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Verified Charging Standards</span>
          </div>
        </div>
      </div>

      {/* Deletion Confirmation Dialog */}
      <DeleteVehicleDialog
        isOpen={Boolean(vehicleToDelete)}
        vehicle={vehicleToDelete}
        isDeleting={isDeleting}
        onClose={() => setVehicleToDelete(null)}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}
