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
          <Route
            path="/chargers"
            element={
             <ChargersPage />
            }
          />

          <Route path="/chargers/:id" element={<ChargerDetailsPage />} />

          <Route
            path="/bookings"
            element={
              <PlaceholderPage
                title="Bookings"
                description="View and manage your bookings."
              />
            }
          />

          <Route path="/vehicles" element={<VehiclesPage />} />

          <Route path="/vehicles/new" element={<VehicleFormPage />} />
          <Route path="/vehicles/:id/edit" element={<VehicleFormPage />} />

          <Route
            path="/host"
            element={
              <PlaceholderPage
                title="Host"
                description="Manage your charging listings and availability."
              />
            }
          />
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