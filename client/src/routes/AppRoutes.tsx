import { Route, Routes } from "react-router";

import AppLayout from "../components/layout/AppLayout";
import ProtectedRoute from "../components/ProtectedRoute";
import PublicOnlyRoute from "../components/PublicOnlyRoute";
import HostRoute from "../components/HostRoute";

import LoginPage from "../pages/auth/LoginPage";
import RegisterPage from "../pages/auth/RegisterPage";
import VehiclesPage from "../pages/vehicles/VehiclesPage";
import VehicleFormPage from "../pages/vehicles/VehicleFormPage";
import BookingsPage from "../pages/bookings/BookingsPage";
import BookingDetailsPage from "../pages/bookings/BookingDetailsPage";
import BookChargerPage from "../pages/bookings/BookChargerPage";
import ChargingSessionsPage from "../pages/bookings/ChargingSessionsPage";
import ChargingSessionDetailsPage from "../pages/bookings/ChargingSessionDetailsPage";
import ChargersPage from "../pages/chargers/ChargersPage";
import ChargerDetailsPage from "../pages/chargers/ChargerDetailsPage";
import LandingPage from "../pages/LandingPage";
import NotFoundPage from "../pages/NotFoundPage";
import HostPage from "../pages/host/HostPage";
import ChargerFormPage from "../pages/host/ChargerFormPage";

export default function AppRoutes() {
  return (
    <Routes>
      {/* Public landing page */}
      <Route path="/" element={<LandingPage />} />

      {/* Public-only authentication routes */}
      <Route element={<PublicOnlyRoute />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
      </Route>

      {/* Protected application routes */}
      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          {/* Chargers */}
          <Route path="/chargers" element={<ChargersPage />} />
          <Route path="/chargers/:id" element={<ChargerDetailsPage />} />
          <Route
            path="/chargers/:chargerId/book"
            element={<BookChargerPage />}
          />

          {/* Bookings and charging sessions */}
          <Route path="/bookings" element={<BookingsPage />} />
          <Route path="/bookings/:id" element={<BookingDetailsPage />} />
          <Route path="/sessions" element={<ChargingSessionsPage />} />
          <Route
            path="/sessions/:id"
            element={<ChargingSessionDetailsPage />}
          />

          {/* Vehicles */}
          <Route path="/vehicles" element={<VehiclesPage />} />
          <Route path="/vehicles/new" element={<VehicleFormPage />} />
          <Route path="/vehicles/:id/edit" element={<VehicleFormPage />} />

          {/* Host */}
          <Route element={<HostRoute />}>
            <Route path="/host" element={<HostPage />} />
            <Route path="/host/chargers/new" element={<ChargerFormPage />} />
            <Route
              path="/host/chargers/:id/edit"
              element={<ChargerFormPage />}
            />
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
