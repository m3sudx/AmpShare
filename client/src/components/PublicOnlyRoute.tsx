import { Navigate, Outlet, useLocation } from "react-router";
import { Loader2 } from "lucide-react";
import { useAuth } from "../context";

export default function PublicOnlyRoute() {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f8faf9]">
        <Loader2 className="w-8 h-8 animate-spin text-[#0F9468]" />
      </div>
    );
  }

  if (isAuthenticated) {
    const fromState = location.state as { from?: string | { pathname?: string } } | null;
    const fromLocation =
      typeof fromState?.from === "string"
        ? fromState.from
        : fromState?.from?.pathname || "/chargers";

    return <Navigate to={fromLocation} replace />;
  }

  return <Outlet />;
}
