import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router";
import axios from "axios";
import { Calendar, Eye, EyeOff, Loader2, MapPin, Zap } from "lucide-react";
import AuthLayout from "../../components/auth/AuthLayout";
import EthiopiaPhoneInput from "../../components/auth/EthiopiaPhoneInput";
import { useAuth, useToast } from "../../context";
import { isValidEthiopianPhone, normalizeEthiopianPhone } from "../../utils/phone";
import { usePageTitle } from "../../hooks/usePageTitle";

export default function RegisterPage() {
  usePageTitle("Create account");
  const navigate = useNavigate();
  const location = useLocation();
  const { register } = useAuth();
  const { showToast } = useToast();

  const fromState = location.state as { from?: string | { pathname?: string } } | null;
  const fromLocation =
    typeof fromState?.from === "string"
      ? fromState.from
      : fromState?.from?.pathname || "/chargers";

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [fullNameError, setFullNameError] = useState<string | null>(null);
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [confirmPasswordError, setConfirmPasswordError] = useState<string | null>(null);
  const [generalError, setGeneralError] = useState<string | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFullNameError(null);
    setPhoneError(null);
    setPasswordError(null);
    setConfirmPasswordError(null);
    setGeneralError(null);

    let hasError = false;

    // Full name validation (1-100 chars)
    const trimmedName = fullName.trim();
    if (!trimmedName) {
      setFullNameError("Full name is required");
      hasError = true;
    } else if (trimmedName.length > 100) {
      setFullNameError("Full name must not exceed 100 characters");
      hasError = true;
    }

    // Phone validation
    if (!phone.trim()) {
      setPhoneError("Phone number is required");
      hasError = true;
    } else if (!isValidEthiopianPhone(phone)) {
      setPhoneError("Please enter a valid Ethiopian phone number");
      hasError = true;
    }

    // Password validation (min 8 characters, max 72 bytes)
    if (!password) {
      setPasswordError("Password is required");
      hasError = true;
    } else if (password.length < 8) {
      setPasswordError("Password must be at least 8 characters long");
      hasError = true;
    }

    // Confirm password validation (frontend only check)
    if (!confirmPassword) {
      setConfirmPasswordError("Please confirm your password");
      hasError = true;
    } else if (password !== confirmPassword) {
      setConfirmPasswordError("Passwords do not match");
      hasError = true;
    }

    if (hasError) return;

    const normalizedPhone = normalizeEthiopianPhone(phone);

    try {
      setIsSubmitting(true);
      // NOTE: confirmPassword is intentionally excluded from payload
      await register({
        fullName: trimmedName,
        phoneNumber: normalizedPhone,
        password,
      });

      showToast("Account created successfully! Welcome to AmpShare.", "success");
      navigate(fromLocation, { replace: true });
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        if (err.response?.status === 409) {
          setGeneralError("This phone number is already registered. Please sign in instead.");
        } else if (err.response?.data?.details && Array.isArray(err.response.data.details)) {
          const details = err.response.data.details as Array<{ field?: string; message?: string }>;
          for (const item of details) {
            if (item.field === "phoneNumber" && item.message) setPhoneError(item.message);
            if (item.field === "fullName" && item.message) setFullNameError(item.message);
            if (item.field === "password" && item.message) setPasswordError(item.message);
          }
          if (err.response.data.message) {
            setGeneralError(String(err.response.data.message));
          }
        } else if (err.response?.data?.message) {
          setGeneralError(String(err.response.data.message));
        } else {
          setGeneralError("Unable to create account. Please check your information and try again.");
        }
      } else {
        setGeneralError("An unexpected error occurred. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const registerFeatures = [
    {
      icon: <MapPin className="w-5 h-5" />,
      title: "Find nearby chargers",
      subtitle: "Real-time map and charger availability across the city",
    },
    {
      icon: <Calendar className="w-5 h-5" />,
      title: "Book a time slot in seconds",
      subtitle: "Instant reservations with guaranteed access",
    },
    {
      icon: <Zap className="w-5 h-5" />,
      title: "Host your charger and set your schedule",
      subtitle: "Monetize your parking spot while you are at work",
    },
  ];

  const networkCard = (
    <div className="mt-6 max-w-sm bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-4 text-white shadow-xl">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-white/15 border border-white/20 flex items-center justify-center p-1 overflow-hidden shadow-sm shrink-0">
            <img
              src="/ampshare-logo.png"
              alt="Network"
              className="w-full h-full object-contain"
            />
          </div>
          <div>
            <h4 className="font-semibold text-sm text-white">Addis Ababa EV Network</h4>
            <p className="text-xs text-emerald-100/80 mt-0.5">Bole · Kazanchis · Sarbet · Piassa</p>
          </div>
        </div>
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-emerald-400/20 text-emerald-200 border border-emerald-300/30 shrink-0">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          Live
        </span>
      </div>
      <div className="mt-3 pt-2.5 border-t border-white/15 flex items-center justify-between text-xs text-emerald-100/90">
        <span className="flex items-center gap-1.5">
          <Zap className="w-3.5 h-3.5 text-emerald-300" />
          48+ Active charging stations
        </span>
        <span className="font-semibold text-white tracking-tight">99.4% uptime</span>
      </div>
    </div>
  );

  return (
    <AuthLayout
      badgeText="EV charging, shared"
      heroHeading="Charge anywhere in Addis Ababa. Earn from the charger you own."
      heroDescription="Find nearby chargers, book a time slot, or list your own and set your availability."
      features={registerFeatures}
      networkCard={networkCard}
      cardTitle="Create your AmpShare account"
      cardSubtitle="Join AmpShare to discover and book nearby EV chargers."
    >
      {/* General / Conflict Error Alert */}
      {generalError && (
        <div
          role="alert"
          className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-start gap-2"
        >
          <span className="font-semibold">Notice:</span>
          <span>{generalError}</span>
        </div>
      )}

      <form className="space-y-3.5" onSubmit={handleSubmit} noValidate>
        {/* Full Name */}
        <div>
          <label
            htmlFor="full_name"
            className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5 ml-0.5"
          >
            Full name
          </label>
          <div className="relative">
            <input
              id="full_name"
              name="fullName"
              type="text"
              required
              disabled={isSubmitting}
              value={fullName}
              onChange={(e) => {
                setFullName(e.target.value);
                if (fullNameError) setFullNameError(null);
                if (generalError) setGeneralError(null);
              }}
              placeholder="Abebe Kebede"
              className={`w-full px-4 py-3 bg-slate-50/60 hover:bg-slate-50 focus:bg-white text-slate-900 placeholder:text-slate-400 border rounded-xl text-sm focus:outline-none focus:ring-2 transition-all duration-150 ${
                fullNameError
                  ? "border-red-400 focus:border-red-500 focus:ring-red-500/20"
                  : "border-slate-200 focus:border-emerald-600 focus:ring-emerald-500/20"
              }`}
            />
          </div>
          {fullNameError && <p className="text-xs text-red-600 mt-1 ml-0.5">{fullNameError}</p>}
        </div>

        {/* Phone Number */}
        <EthiopiaPhoneInput
          id="phone"
          value={phone}
          onChange={(val) => {
            setPhone(val);
            if (phoneError) setPhoneError(null);
            if (generalError) setGeneralError(null);
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
                if (passwordError) setPasswordError(null);
                if (generalError) setGeneralError(null);
              }}
              placeholder="At least 8 characters"
              className={`w-full pl-4 pr-11 py-3 bg-slate-50/60 hover:bg-slate-50 focus:bg-white text-slate-900 placeholder:text-slate-400 border rounded-xl text-sm focus:outline-none focus:ring-2 transition-all duration-150 ${
                passwordError
                  ? "border-red-400 focus:border-red-500 focus:ring-red-500/20"
                  : "border-slate-200 focus:border-emerald-600 focus:ring-emerald-500/20"
              }`}
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
          {passwordError && <p className="text-xs text-red-600 mt-1 ml-0.5">{passwordError}</p>}
        </div>

        {/* Confirm Password */}
        <div>
          <label
            htmlFor="confirm_password"
            className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5 ml-0.5"
          >
            Confirm password
          </label>
          <div className="relative">
            <input
              id="confirm_password"
              name="confirmPassword"
              type={showConfirmPassword ? "text" : "password"}
              required
              disabled={isSubmitting}
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                if (confirmPasswordError) setConfirmPasswordError(null);
                if (generalError) setGeneralError(null);
              }}
              placeholder="Repeat your password"
              className={`w-full pl-4 pr-11 py-3 bg-slate-50/60 hover:bg-slate-50 focus:bg-white text-slate-900 placeholder:text-slate-400 border rounded-xl text-sm focus:outline-none focus:ring-2 transition-all duration-150 ${
                confirmPasswordError
                  ? "border-red-400 focus:border-red-500 focus:ring-red-500/20"
                  : "border-slate-200 focus:border-emerald-600 focus:ring-emerald-500/20"
              }`}
            />
            <button
              type="button"
              aria-label={showConfirmPassword ? "Hide password" : "Show password"}
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
            >
              {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {confirmPasswordError && (
            <p className="text-xs text-red-600 mt-1 ml-0.5">{confirmPasswordError}</p>
          )}
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
                <span>Creating account...</span>
              </>
            ) : (
              <span>Create account</span>
            )}
          </button>
        </div>
      </form>

      {/* Footer */}
      <footer className="mt-6 pt-5 border-t border-slate-100 text-center">
        <p className="text-xs text-slate-500">
          Already have an account?{" "}
          <Link
            to="/login"
            state={location.state}
            className="font-semibold text-slate-900 hover:text-[#0F9468] ml-1 transition-colors underline-offset-2 hover:underline"
          >
            Sign in
          </Link>
        </p>
      </footer>
    </AuthLayout>
  );
}
