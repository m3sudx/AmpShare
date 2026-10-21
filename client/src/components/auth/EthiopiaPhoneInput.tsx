import React from "react";
import { formatEthiopianInput } from "../../utils/phone";

interface EthiopiaPhoneInputProps {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  disabled?: boolean;
  required?: boolean;
}

export default function EthiopiaPhoneInput({
  id = "phone",
  value,
  onChange,
  error,
  disabled = false,
  required = true,
}: EthiopiaPhoneInputProps) {
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatEthiopianInput(e.target.value);
    onChange(formatted);
  };

  return (
    <div>
      <label
        htmlFor={id}
        className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5 ml-0.5"
      >
        Phone number
      </label>
      <div
        className={`relative flex rounded-xl border bg-slate-50/60 hover:bg-slate-50 focus-within:bg-white focus-within:ring-2 transition-all duration-150 overflow-hidden ${
          error
            ? "border-red-400 focus-within:border-red-500 focus-within:ring-red-500/20"
            : "border-slate-200 focus-within:border-emerald-600 focus-within:ring-emerald-500/20"
        } ${disabled ? "opacity-60 cursor-not-allowed" : ""}`}
      >
        {/* Ethiopia Prefix Selector */}
        <div className="inline-flex items-center gap-1.5 px-3.5 py-3 border-r border-slate-200 bg-slate-100/60 text-slate-700 select-none shrink-0">
          {/* Ethiopia Flag SVG */}
          <svg
            className="w-4 h-3 rounded-[2px] shadow-sm shrink-0"
            viewBox="0 0 640 480"
            aria-hidden="true"
          >
            <g fillRule="evenodd">
              <path d="M0 0h640v160H0z" fill="#078930" />
              <path d="M0 160h640v160H0z" fill="#fcdd09" />
              <path d="M0 320h640v160H0z" fill="#da121a" />
              <circle cx="320" cy="240" fill="#0f47af" r="64" />
              <path
                d="m320 188 15.2 46.8h49.2l-39.8 28.9 15.2 46.8-39.8-28.9-39.8 28.9 15.2-46.8-39.8-28.9h49.2z"
                fill="#fcdd09"
              />
            </g>
          </svg>
          <span className="text-xs font-semibold text-slate-800 tracking-tight">+251</span>
        </div>

        <input
          id={id}
          name="phoneNumber"
          type="tel"
          required={required}
          disabled={disabled}
          value={value}
          onChange={handleInputChange}
          placeholder="91 234 5678"
          className="w-full px-3.5 py-3 bg-transparent text-slate-900 placeholder:text-slate-400 text-sm focus:outline-none"
        />
      </div>
      {error && <p className="text-xs text-red-600 mt-1 ml-0.5">{error}</p>}
    </div>
  );
}
