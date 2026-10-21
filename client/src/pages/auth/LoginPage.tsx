import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router";
import axios from "axios";
import { Calendar, Eye, EyeOff, Loader2, MapPin, Zap } from "lucide-react";
import AuthLayout from "../../components/auth/AuthLayout";
import EthiopiaPhoneInput from "../../components/auth/EthiopiaPhoneInput";
import { useAuth } from "../../context";
import { isValidEthiopianPhone, normalizeEthiopianPhone } from "../../utils/phone";

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Where to redirect after login (default /vehicles)
  const fromLocation = (location.state as { from?: { pathname: string } })?.from?.pathname || "/vehicles";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setPhoneError(null);

    // Validate phone
    if (!phone.trim()) {
      setPhoneError("Phone number is required");
      return;
    }
    if (!isValidEthiopianPhone(phone)) {
      setPhoneError("Please enter a valid Ethiopian phone number");
      return;
    }

    // Validate password
    if (!password) {
      setError("Password is required");
      return;
    }

    const normalizedPhone = normalizeEthiopianPhone(phone);

    try {
      setIsSubmitting(true);
      await login({
        phoneNumber: normalizedPhone,
        password,
      });

      if (rememberMe) {
        localStorage.setItem("ampshare_remember_phone", phone);
      } else {
        localStorage.removeItem("ampshare_remember_phone");
      }

      navigate(fromLocation, { replace: true });
    } catch (err: unknown) {
      let serverMessage = "Unable to sign in. Please verify your connection and try again.";
      if (axios.isAxiosError(err)) {
        if (err.response?.status === 401) {
          serverMessage = "Invalid phone number or password";
        } else if (err.response?.data?.message) {
          serverMessage = String(err.response.data.message);
        }
      }
      setError(serverMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const loginFeatures = [
    {
      icon: <Calendar className="w-5 h-5" />,
      title: "See your upcoming bookings",
      subtitle: "Instant reservations and active slot reminders",
    },
    {
      icon: <MapPin className="w-5 h-5" />,
      title: "Find chargers near you",
      subtitle: "Real-time availability and smart navigation",
    },
    {
      icon: <Zap className="w-5 h-5" />,
      title: "Manage your charger and schedule",
      subtitle: "Monitor earnings and adjust host hours",
    },
  ];

  const networkCard = (
    <div className="mt-6 flex items-center gap-4 p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 shadow-xl max-w-sm">
      <div className="w-14 h-14 rounded-xl bg-white p-2 shadow-sm flex items-center justify-center shrink-0">
        <img
          src="/ampshare-logo.png"
          alt="AmpShare Network"
          className="w-full h-full object-contain"
        />
      </div>
      <div>
        <h4 className="font-semibold text-sm text-white tracking-tight">AmpShare Network</h4>
        <p className="text-xs text-emerald-100/80 mt-0.5 leading-relaxed">
          Fast, reliable EV charging infrastructure across Ethiopia.
        </p>
      </div>
    </div>
  );

  return (
    <AuthLayout
      badgeText="Welcome back"
      heroHeading="Your next charge is just a tap away."
      heroDescription="Sign in to manage your bookings, find chargers nearby, or update your charger's availability."
      features={loginFeatures}
      networkCard={networkCard}
      cardTitle="Sign in to AmpShare"
      cardSubtitle="Welcome back! Enter your details to continue."
    >
      {/* Server Error Alert */}
      {error && (
        <div
          role="alert"
          className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-start gap-2"
        >
          <span className="font-semibold">Error:</span>
          <span>{error}</span>
        </div>
      )}

      <form className="space-y-4" onSubmit={handleSubmit} noValidate>
        {/* Phone number */}
        <EthiopiaPhoneInput
          id="phone"
          value={phone}
          onChange={(val) => {
            setPhone(val);
            if (phoneError) setPhoneError(null);
            if (error) setError(null);
          }}
          error={phoneError || undefined}
          disabled={isSubmitting}
        />

        {/* Password */}
        <div>
          <label
            htmlFor="password"
            className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5 ml-0.5"
          >
            Password
          </label>
          <div className="relative">
            <input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              required
              disabled={isSubmitting}
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (error) setError(null);
              }}
              placeholder="Enter your password"
              className="w-full pl-4 pr-11 py-3 bg-slate-50/60 hover:bg-slate-50 focus:bg-white text-slate-900 placeholder:text-slate-400 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all duration-150"
            />
            <button
              type="button"
              aria-label={showPassword ? "Hide password" : "Show password"}
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Remember me & Forgot Password */}
        <div className="flex items-center justify-between text-xs pt-0.5">
          <label className="inline-flex items-center gap-2 text-slate-600 select-none cursor-pointer">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
            />
            <span className="text-slate-700 font-medium">Remember me</span>
          </label>
          <span
            className="text-slate-400 cursor-not-allowed hover:text-slate-500"
            title="Password reset via SMS is coming soon"
          >
            Forgot password?
          </span>
        </div>

        {/* Submit Button */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3.5 px-4 bg-[#0F9468] hover:bg-[#0c7d58] active:bg-[#086a4c] disabled:opacity-70 text-white font-semibold text-sm rounded-xl shadow-sm hover:shadow transition-all duration-150 flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 cursor-pointer"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Signing in...</span>
              </>
            ) : (
              <span>Sign in</span>
            )}
          </button>
        </div>
      </form>

      {/* Footer */}
      <footer className="mt-7 pt-5 border-t border-slate-100 text-center">
        <p className="text-xs text-slate-500">
          Don't have an account?{" "}
          <Link
            to="/register"
            className="font-semibold text-slate-900 hover:text-[#0F9468] ml-1 transition-colors underline-offset-2 hover:underline"
          >
            Create account
          </Link>
        </p>
      </footer>
    </AuthLayout>
  );
}
