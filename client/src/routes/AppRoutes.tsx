import { Navigate, Route, Routes } from "react-router";

import AppLayout from "../components/layout/AppLayout";
import LoginPage from "../pages/auth/LoginPage";
import RegisterPage from "../pages/auth/RegisterPage";
import PlaceholderPage from "../pages/PlaceholderPage";

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />

      {/* Authentication pages: no main navbar */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      {/* Main application: shared navbar */}
      <Route element={<AppLayout />}>
        <Route
          path="/chargers"
          element={
            <PlaceholderPage
              title="Find Chargers"
              description="Discover nearby EV charging stations."
            />
          }
        />

        <Route
          path="/bookings"
          element={
            <PlaceholderPage
              title="Bookings"
              description="View and manage your bookings."
            />
          }
        />

        <Route
          path="/vehicles"
          element={
            <PlaceholderPage
              title="My Vehicles"
              description="Manage your registered electric vehicles."
            />
          }
        />

        <Route
          path="/vehicles/new"
          element={
            <PlaceholderPage
              title="Add a vehicle"
              description="Register your electric vehicle with AmpShare."
            />
          }
        />

        <Route
          path="/vehicles/:id/edit"
          element={
            <PlaceholderPage
              title="Edit vehicle"
              description="Update your vehicle details."
            />
          }
        />

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