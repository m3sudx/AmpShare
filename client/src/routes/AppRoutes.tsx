import { Navigate, Route, Routes } from "react-router";

import AppLayout from "../components/layout/AppLayout";
import ProtectedRoute from "../components/ProtectedRoute";
import PublicOnlyRoute from "../components/PublicOnlyRoute";
import LoginPage from "../pages/auth/LoginPage";
import RegisterPage from "../pages/auth/RegisterPage";
import VehiclesPage from "../pages/vehicles/VehiclesPage";
import VehicleFormPage from "../pages/vehicles/VehicleFormPage";
import PlaceholderPage from "../pages/PlaceholderPage";
import ChargersPage from "../pages/chargers/ChargersPage";
import ChargerDetailsPage from "../pages/chargers/ChargerDetailsPage";
import AddChargerPage from "../pages/host/AddChargerPage";
import ManageSchedulesPage from "../pages/host/ManageSchedulesPage";
import MyChargersPage from "../pages/host/MyChargersPage";
import EditChargerPage from "../pages/host/EditChargerPage";

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/vehicles" replace />} />

      {/* Public-only authentication routes */}
      <Route element={<PublicOnlyRoute />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
      </Route>

      {/* Protected application routes */}
      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          {/* Chargers (drivers) */}
          <Route path="/chargers" element={<ChargersPage />} />
          <Route path="/chargers/:id" element={<ChargerDetailsPage />} />

          {/* Bookings */}
          <Route
            path="/bookings"
            element={
              <PlaceholderPage
                title="Bookings"
                description="View and manage your bookings."
              />
            }
          />

          {/* Vehicles */}
          <Route path="/vehicles" element={<VehiclesPage />} />
          <Route path="/vehicles/new" element={<VehicleFormPage />} />
          <Route path="/vehicles/:id/edit" element={<VehicleFormPage />} />

          {/* Host */}
          <Route path="/host" element={<MyChargersPage />} />
          <Route path="/host/chargers/new" element={<AddChargerPage />} />
          <Route
            path="/host/chargers/:id/schedules"
            element={<ManageSchedulesPage />}
          />
          <Route path="/host/chargers/:id/edit" element={<EditChargerPage />} />
        </Route>
      </Route>

      <Route
        path="*"
        element={
          <PlaceholderPage
            title="Page not found"
            description="The page you requested does not exist."
          />
        }
      />
    </Routes>
  );
}