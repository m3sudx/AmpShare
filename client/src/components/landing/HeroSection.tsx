import { Link } from "react-router";

export default function HeroSection() {
  return (
    <section id="top" className="bg-gradient-to-b from-[#F0FAF6] to-white">
      <div className="max-w-[1200px] mx-auto px-6 py-14 sm:py-18 lg:py-20 flex flex-col lg:flex-row items-center gap-12 lg:gap-14">
        {/* Left column content */}
        <div className="flex-1 min-w-0">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-[#CFE5DB] text-sm font-semibold text-[#0B7A55]">
            <span className="w-2 h-2 rounded-full bg-[#0F9468] animate-pulse" />
            Built for Addis Ababa
          </div>

          <h1 className="mt-5.5 font-['Outfit'] font-extrabold text-[40px] sm:text-5xl lg:text-[68px] leading-[1.04] tracking-tight text-[#0F1F1A]">
            Charge nearby.<br />
            <span className="text-[#0B7A55]">Host your own.</span>
          </h1>

          <p className="mt-5.5 max-w-[520px] text-lg sm:text-[19px] leading-relaxed text-[#3F5149]">
            AmpShare connects electric vehicle drivers with home and business chargers around the city. Find a plug, check the hours, and book a time that works.
          </p>

          <div className="mt-8 flex flex-wrap gap-3.5">
            <Link
              to="/chargers"
              className="min-h-[54px] px-7.5 inline-flex items-center justify-center gap-2.5 rounded-2xl bg-[#0B7A55] hover:bg-[#095F43] text-white font-semibold text-[17px] transition-colors shadow-sm"
            >
              Find a charger
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M5 12h14M13 6l6 6-6 6" />
              </svg>
            </Link>

            <Link
              to="/host"
              className="min-h-[54px] px-7 inline-flex items-center justify-center rounded-2xl bg-white hover:bg-[#F0FAF6] border-[1.5px] border-[#9BBBAE] text-[#0F1F1A] font-semibold text-[17px] transition-colors"
            >
              Become a host
            </Link>
          </div>

          <div className="mt-8 flex flex-wrap items-center gap-2.5 sm:gap-3 text-sm text-[#3F5149]">
            <span className="font-semibold text-[#2B3D36]">Plugs supported</span>
            <span className="px-3 py-1.5 rounded-lg bg-white border border-[#CFE5DB] font-semibold text-[#0F1F1A]">
              GB/T
            </span>
            <span className="px-3 py-1.5 rounded-lg bg-white border border-[#CFE5DB] font-semibold text-[#0F1F1A]">
              Type 2
            </span>
            <span className="px-3 py-1.5 rounded-lg bg-white border border-[#CFE5DB] font-semibold text-[#0F1F1A]">
              CCS2
            </span>
          </div>
        </div>

        {/* Right column map mock */}
        <div className="w-full lg:flex-1 min-w-0 max-w-[540px]">
          <div className="relative rounded-[28px] overflow-hidden border border-[#CFE5DB] shadow-2xl shadow-[#0B7A55]/20 bg-[#E8F4EE]">
            <svg
              viewBox="0 0 540 480"
              className="block w-full h-auto"
              role="img"
              aria-label="Map of nearby chargers with pins"
            >
              <rect width="540" height="480" fill="#E8F4EE" />
              {/* River */}
              <path
                d="M-20 360 C 120 330, 180 420, 320 380 S 500 300, 580 330"
                fill="none"
                stroke="#CDE6F3"
                strokeWidth="34"
                strokeLinecap="round"
              />
              {/* Roads */}
              <g fill="none" stroke="#FFFFFF" strokeLinecap="round">
                <path d="M0 120 L540 190" strokeWidth="14" />
                <path d="M90 0 L170 480" strokeWidth="12" />
                <path d="M360 0 L300 480" strokeWidth="16" />
                <path d="M0 260 C 160 240, 300 280, 540 250" strokeWidth="10" />
                <path d="M440 0 L520 300" strokeWidth="9" />
                <path d="M0 40 L240 60" strokeWidth="7" />
              </g>
              {/* Blocks */}
              <g fill="#D3E9DD">
                <rect x="190" y="70" width="80" height="50" rx="8" />
                <rect x="30" y="150" width="46" height="70" rx="8" />
                <rect x="390" y="210" width="70" height="30" rx="8" />
                <rect x="190" y="290" width="90" height="36" rx="8" />
              </g>
              {/* Dotted Route */}
              <path
                d="M250 330 C 250 290, 330 270, 330 220 S 300 150, 310 128"
                fill="none"
                stroke="#0B7A55"
                strokeWidth="5"
                strokeLinecap="round"
                strokeDasharray="2 10"
              />
              {/* User location dot */}
              <circle cx="250" cy="330" r="18" fill="#2563EB" fillOpacity="0.18" />
              <circle cx="250" cy="330" r="8" fill="#2563EB" stroke="#FFFFFF" strokeWidth="3" />
              {/* Charger Pins */}
              <g>
                <circle cx="310" cy="128" r="22" fill="#0B7A55" stroke="#FFFFFF" strokeWidth="4" />
                <path d="M313 116l-9 14h6l-1 9 9-14h-6z" fill="#FFFFFF" />
                <circle cx="120" cy="190" r="18" fill="#0F9468" stroke="#FFFFFF" strokeWidth="4" />
                <path d="M123 181l-7 11h5l-1 7 7-11h-5z" fill="#FFFFFF" />
                <circle cx="448" cy="170" r="18" fill="#0F9468" stroke="#FFFFFF" strokeWidth="4" />
                <path d="M451 161l-7 11h5l-1 7 7-11h-5z" fill="#FFFFFF" />
                <circle cx="400" cy="320" r="18" fill="#0F9468" stroke="#FFFFFF" strokeWidth="4" />
                <path d="M403 311l-7 11h5l-1 7 7-11h-5z" fill="#FFFFFF" />
              </g>
            </svg>

            {/* Floating card */}
            <div className="absolute left-4 right-4 sm:left-4.5 sm:right-auto sm:max-w-[340px] bottom-4.5 p-4 sm:p-4.5 rounded-[18px] bg-white shadow-xl shadow-[#0F1F1A]/20">
              <div className="flex items-center justify-between gap-3">
                <div className="font-['Outfit'] font-bold text-lg text-[#0F1F1A]">
                  Bole Home Charger
                </div>
                <span className="px-2.5 py-0.5 rounded-full bg-[#E7F6F0] text-[#0B7A55] text-xs font-semibold">
                  Available
                </span>
              </div>
              <div className="mt-1 text-sm text-[#4A5B54]">
                0.8 km away · Type 2 · 22 kW
              </div>
              <div className="mt-3 flex items-center justify-between gap-3">
                <div className="text-sm sm:text-[15px] text-[#0F1F1A]">
                  <span className="font-['Outfit'] font-bold text-xl text-[#0F1F1A]">15</span> ETB / kWh
                </div>
                <Link
                  to="/chargers"
                  className="min-h-[40px] px-4.5 inline-flex items-center justify-center rounded-xl bg-[#0B7A55] hover:bg-[#095F43] text-white font-semibold text-sm transition-colors"
                >
                  Book
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
