
import { Link, useNavigate } from "react-router";

function UnpluggedCharger({ className = "" }) {
  return (
    <svg
      viewBox="0 0 320 260"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-labelledby="charger-title charger-desc"
    >
      <title id="charger-title">404 EV charging station</title>
      <desc id="charger-desc">
        A green EV charger displaying a red 404 error, with a disconnected
        cable, warning symbols, and decorative background shapes.
      </desc>

      <defs>
        <linearGradient id="chargerBody" x1="60" y1="20" x2="160" y2="230">
          <stop stopColor="#10B981" />
          <stop offset="1" stopColor="#047857" />
        </linearGradient>

        <linearGradient id="screenGradient" x1="75" y1="45" x2="145" y2="115">
          <stop stopColor="#17252D" />
          <stop offset="1" stopColor="#0B1720" />
        </linearGradient>

        <linearGradient id="plugGradient" x1="220" y1="180" x2="280" y2="220">
          <stop stopColor="#475569" />
          <stop offset="1" stopColor="#1E293B" />
        </linearGradient>

        <filter id="chargerShadow" x="-30%" y="-20%" width="160%" height="160%">
          <feDropShadow
            dx="0"
            dy="5"
            stdDeviation="5"
            floodColor="#064E3B"
            floodOpacity="0.15"
          />
        </filter>
      </defs>

      {/* Soft background halo */}
      <circle cx="160" cy="124" r="105" fill="#DDF8EF" />

      {/* Floating clouds */}
      <g fill="#C9F2E6">
        <path d="M26 78C26 69 34 63 43 64C47 51 60 48 70 55C76 43 94 46 98 61C109 61 115 68 115 78H26Z" />
        <path d="M230 43C230 34 238 29 246 30C251 17 267 16 275 27C285 25 293 33 293 43H230Z" />
      </g>

      {/* Decorative lines */}
      <g stroke="#BDEFE0" strokeWidth="3" strokeLinecap="round">
        <path d="M235 61H287" />
        <path d="M30 158H68" />
        <path d="M45 169H75" />
      </g>

      {/* Ground shadow */}
      <ellipse cx="160" cy="228" rx="135" ry="11" fill="#D8EAE7" />
      <ellipse cx="160" cy="228" rx="105" ry="5" fill="#C4DDD7" />

      {/* Charger base */}
      <g filter="url(#chargerShadow)">
        <rect x="68" y="211" width="122" height="15" rx="4" fill="#047857" />
        <rect x="75" y="207" width="108" height="7" rx="3.5" fill="#10B981" />
      </g>

      {/* Main charging station */}
      <g filter="url(#chargerShadow)">
        <rect
          x="82"
          y="25"
          width="88"
          height="190"
          rx="18"
          fill="url(#chargerBody)"
        />

        <rect
          x="86"
          y="29"
          width="80"
          height="182"
          rx="14"
          stroke="#6EE7B7"
          strokeOpacity="0.6"
          strokeWidth="2"
        />

        {/* Dark display */}
        <rect
          x="91"
          y="36"
          width="70"
          height="67"
          rx="10"
          fill="#064E3B"
        />
        <rect
          x="96"
          y="41"
          width="60"
          height="57"
          rx="7"
          fill="url(#screenGradient)"
        />

        {/* Red 404 display */}
        <text
          x="126"
          y="70"
          textAnchor="middle"
          fontFamily="Arial, sans-serif"
          fontSize="23"
          fontWeight="900"
          fill="#FF453A"
        >
          404
        </text>

        {/* Small red warning icon on screen */}
        <path
          d="M126 76L118 89Q117 92 121 92H131Q135 92 133 89L126 76Z"
          fill="#FF453A"
        />
        <path
          d="M126 81V86"
          stroke="#FFFFFF"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        <circle cx="126" cy="89" r="0.8" fill="#FFFFFF" />

        {/* Status indicators */}
        <g fill="#6EE7B7">
          <rect x="101" y="111" width="9" height="5" rx="2.5" />
          <rect x="117" y="111" width="9" height="5" rx="2.5" />
          <rect x="133" y="111" width="9" height="5" rx="2.5" />
        </g>

        {/* Lower charger panel */}
        <rect x="98" y="124" width="56" height="76" rx="9" fill="#078566" />
        <rect
          x="101"
          y="127"
          width="50"
          height="70"
          rx="7"
          stroke="#34D399"
          strokeOpacity="0.25"
        />

        {/* Lightning symbol */}
        <path
          d="M128 143L116 160H124L120 177L136 156H128L128 143Z"
          fill="#ECFDF5"
        />
      </g>

      {/* Charger connector at the side */}
      <g>
        <rect x="166" y="62" width="10" height="22" rx="5" fill="#065F46" />
        <rect
          x="170"
          y="68"
          width="13"
          height="25"
          rx="5"
          transform="rotate(-20 170 68)"
          fill="#064E3B"
        />
        <rect
          x="174"
          y="87"
          width="8"
          height="10"
          rx="3"
          transform="rotate(-20 174 87)"
          fill="#334155"
        />
      </g>

      {/* Disconnected charging cable */}
      <path
        d="M178 91C190 115 177 153 182 183C184 201 201 218 221 218"
        stroke="#1E293B"
        strokeWidth="6"
        strokeLinecap="round"
      />
      <path
        d="M178 91C190 115 177 153 182 183C184 201 201 218 221 218"
        stroke="#475569"
        strokeWidth="2"
        strokeLinecap="round"
      />

      {/* Detached connector */}
      <g transform="translate(215 198) rotate(-8)">
        <path
          d="M0 8Q0 0 9 0H36Q45 0 45 9V21Q45 29 36 29H10Q0 29 0 21V8Z"
          fill="url(#plugGradient)"
        />
        <rect x="5" y="3" width="15" height="5" rx="2.5" fill="#64748B" />
        <rect x="-5" y="13" width="10" height="9" rx="3" fill="#334155" />
        <circle cx="29" cy="9" r="3" fill="#0F172A" />
        <circle cx="37" cy="9" r="3" fill="#0F172A" />
        <circle cx="29" cy="19" r="3" fill="#0F172A" />
        <circle cx="37" cy="19" r="3" fill="#0F172A" />
      </g>

      {/* Red alert badge */}
      <g>
        <circle cx="228" cy="106" r="24" fill="#FECACA" />
        <circle cx="228" cy="106" r="19" fill="#FCA5A5" />
        <path
          d="M228 93L214 115Q212 119 217 119H239Q244 119 242 115L228 93Z"
          fill="#DC2626"
        />
        <path
          d="M228 100V109"
          stroke="#FFFFFF"
          strokeWidth="3"
          strokeLinecap="round"
        />
        <circle cx="228" cy="114" r="1.7" fill="#FFFFFF" />
      </g>

      {/* Alert marks near the unplugged connector */}
      <g
        stroke="#EF4444"
        strokeWidth="3.5"
        strokeLinecap="round"
      >
        <path d="M270 181L273 170" />
        <path d="M282 190L290 183" />
        <path d="M287 202L297 202" />
      </g>
    </svg>
  );
}

export default function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-[#F7FAF9] px-6 py-16 lg:px-8">
      <div className="mx-auto flex w-full max-w-2xl flex-col items-center text-center">
        <div className="relative mb-8 w-full max-w-[320px]">
          <UnpluggedCharger className="h-auto w-full drop-shadow-sm" />
        </div>

        <p className="text-sm font-bold uppercase tracking-widest text-[#0F9468]">
          404 Error
        </p>

        <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-5xl">
          Looks like you're unplugged
        </h1>

        <p className="mt-4 text-base leading-relaxed text-slate-600 sm:text-lg">
          The page you're looking for doesn't exist, has been moved, or is
          temporarily offline. Let's get you back to a working connection.
        </p>

   
<div className="mt-10 flex w-full flex-col justify-center gap-4 sm:flex-row sm:gap-6">
  <button
    type="button"
    onClick={() => navigate(-1)}
    className="flex items-center justify-center gap-2 rounded-full border-2 border-slate-300 bg-transparent px-8 py-3.5 text-base font-semibold text-slate-700 transition-colors hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-300 focus:ring-offset-2"
  >
    {/* Back arrow icon */}
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="m12 19-7-7 7-7" />
      <path d="M19 12H5" />
    </svg>
    Go back
  </button>

  <Link
    to="/chargers"
    className="flex items-center justify-center gap-2 rounded-full bg-[#0F9468] px-8 py-3.5 text-base font-semibold text-white shadow-sm transition-colors hover:bg-[#0c7a56] focus:outline-none focus:ring-2 focus:ring-[#0F9468] focus:ring-offset-2"
  >
    {/* Charging plug icon */}
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M12 22v-5" />
      <path d="M9 8V2" />
      <path d="M15 8V2" />
      <path d="M18 8H6v4a6 6 0 0 0 12 0V8Z" />
    </svg>
    Find nearby chargers
  </Link>
</div>

      </div>
    </main>
  );
}
