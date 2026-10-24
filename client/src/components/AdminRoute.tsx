import { Link, Outlet } from "react-router";
import { ShieldAlert } from "lucide-react";
import { useAuth } from "../context/useAuth";

export default function AdminRoute() {
  const { user } = useAuth();
  const isAdmin = (user?.roles as string[] | undefined)?.includes("ADMIN");

  if (!isAdmin) {
    return (
      <div className="mx-auto max-w-md py-16 text-center space-y-4">
        <div className="flex h-16 w-16 mx-auto items-center justify-center rounded-2xl bg-red-50 text-red-600">
          <ShieldAlert className="h-8 w-8" />
        </div>
        <h1 className="text-xl font-bold text-slate-900">Administrator Access Required</h1>
        <p className="text-sm text-slate-500">
          This section is restricted to authorized platform administrators.
        </p>
        <Link
          to="/"
          className="inline-block rounded-xl bg-[#0F9468] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0c7d58]"
        >
          Return Home
        </Link>
      </div>
    );
  }

  return <Outlet />;
}
