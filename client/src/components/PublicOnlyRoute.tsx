import { Navigate, Outlet } from "react-router";
import { Loader2 } from "lucide-react";
import { useAuth } from "../context";

export default function PublicOnlyRoute() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f8faf9]">
        <Loader2 className="w-8 h-8 animate-spin text-[#0F9468]" />
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/vehicles" replace />;
  }

  return <Outlet />;
}
