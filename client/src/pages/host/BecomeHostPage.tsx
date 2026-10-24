import { isAxiosError } from "axios";
import { useState } from "react";
import { useAuth } from "../../context/useAuth"; 
import { usePageTitle } from "../../hooks/usePageTitle";

export default function BecomeHostPage() {
  usePageTitle("Become a host");
  const { becomeHost } = useAuth();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    setPending(true);
    setError(null);
    try {
      await becomeHost(); // the guard re-renders into the host pages on success
    } catch (e) {
      setError(
        isAxiosError(e) && e.response?.status === 404
          ? "Hosting isn't available yet. Please try again later."
          : "Something went wrong. Please try again.",
      );
      setPending(false);
    }
  }

  return (
    <div className="mx-auto max-w-xl rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
      <p className="text-sm font-bold uppercase tracking-widest text-[#0F9468]">Host</p>
      <h1 className="mt-2 text-3xl font-extrabold text-slate-900">
        Earn by sharing your charger
      </h1>
      <p className="mt-3 text-slate-600">
        List your EV charger, set the hours it's available, and let nearby drivers book it.
        You can still book chargers as a driver.
      </p>

      <ul className="mx-auto mt-6 max-w-sm space-y-2 text-left text-sm text-slate-700">
        <li>1. Add your charger and pin its location</li>
        <li>2. Set your weekly available hours</li>
        <li>3. Activate the listing so drivers can find it</li>
      </ul>

      {error && (
        <p role="alert" className="mt-5 rounded-xl bg-red-50 p-3 text-sm font-medium text-red-700">
          {error}
        </p>
      )}

      <button
        onClick={handleClick}
        disabled={pending}
        className="mt-6 min-h-12 rounded-xl bg-[#0F9468] px-8 text-base font-bold text-white hover:bg-[#0c7a56] disabled:opacity-60"
      >
        {pending ? "Setting up…" : "Become a host"}
      </button>
    </div>
  );
}