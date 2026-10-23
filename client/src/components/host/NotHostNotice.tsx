import { Link } from "react-router";
import { Zap } from "lucide-react";

export default function NotHostNotice() {
  return (
    <div className="mx-auto flex max-w-xl flex-col items-center gap-3 rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
      <Zap className="h-10 w-10 text-[#0F9468]" aria-hidden="true" />
      <h1 className="text-lg font-semibold text-slate-900">Hosting isn't enabled for your account</h1>
      <p className="text-sm text-slate-500">
        Only accounts with the host role can list chargers and set availability. You can still find
        and book chargers as a driver.
      </p>
      <Link
        to="/chargers"
        className="rounded-xl bg-[#0F9468] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#0c7d58]"
      >
        Find chargers
      </Link>
    </div>
  );
}
