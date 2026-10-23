export default function FeaturesSection() {
  return (
    <section id="features" className="bg-[#0F1F1A] text-white">
      <div className="max-w-[1200px] mx-auto px-6 py-18 sm:py-22">
        <div className="max-w-[640px]">
          <div className="text-sm font-bold tracking-[0.12em] uppercase text-[#6FD3AC]">
            Features
          </div>
          <h2 className="mt-3 font-['Outfit'] font-bold text-3xl sm:text-4xl lg:text-[46px] leading-[1.12] tracking-tight text-white">
            Everything a driver needs, nothing in the way
          </h2>
        </div>

        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {/* Feature 1 */}
          <div className="p-7 rounded-[22px] bg-[#17302A] border border-[#234A3F] flex flex-col justify-between">
            <div>
              <svg
                width="30"
                height="30"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#6FD3AC"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M12 21s7-6.2 7-11a7 7 0 10-14 0c0 4.8 7 11 7 11z" />
                <circle cx="12" cy="10" r="2.5" />
              </svg>
              <div className="mt-4 font-['Outfit'] font-bold text-[21px] text-white">
                Chargers on a live map
              </div>
              <p className="mt-2 text-[#BFD8CE] text-base leading-relaxed">
                See every active charger around you, with your own location marked.
              </p>
            </div>
          </div>

          {/* Feature 2 */}
          <div className="p-7 rounded-[22px] bg-[#17302A] border border-[#234A3F] flex flex-col justify-between">
            <div>
              <svg
                width="30"
                height="30"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#6FD3AC"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M4 6h16M7 12h10M10 18h4" />
              </svg>
              <div className="mt-4 font-['Outfit'] font-bold text-[21px] text-white">
                Filter by what matters
              </div>
              <p className="mt-2 text-[#BFD8CE] text-base leading-relaxed">
                Narrow by plug type, minimum power, maximum price and search distance.
              </p>
            </div>
          </div>

          {/* Feature 3 */}
          <div className="p-7 rounded-[22px] bg-[#17302A] border border-[#234A3F] flex flex-col justify-between">
            <div>
              <svg
                width="30"
                height="30"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#6FD3AC"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <circle cx="6" cy="18" r="2.5" />
                <circle cx="18" cy="6" r="2.5" />
                <path d="M8.5 18H15a3 3 0 000-6H9a3 3 0 010-6h6.5" />
              </svg>
              <div className="mt-4 font-['Outfit'] font-bold text-[21px] text-white">
                Directions built in
              </div>
              <p className="mt-2 text-[#BFD8CE] text-base leading-relaxed">
                Get the route to any charger without leaving AmpShare.
              </p>
            </div>
          </div>

          {/* Feature 4 */}
          <div className="p-7 rounded-[22px] bg-[#17302A] border border-[#234A3F] flex flex-col justify-between">
            <div>
              <svg
                width="30"
                height="30"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#6FD3AC"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <rect x="3" y="5" width="18" height="16" rx="3" />
                <path d="M3 10h18M8 3v4M16 3v4" />
              </svg>
              <div className="mt-4 font-['Outfit'] font-bold text-[21px] text-white">
                Clear weekly availability
              </div>
              <p className="mt-2 text-[#BFD8CE] text-base leading-relaxed">
                Hosts publish the exact hours each day, so there are no surprises on arrival.
              </p>
            </div>
          </div>

          {/* Feature 5 */}
          <div className="p-7 rounded-[22px] bg-[#17302A] border border-[#234A3F] flex flex-col justify-between">
            <div>
              <svg
                width="30"
                height="30"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#6FD3AC"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M13 2L4 14h7l-1 8 9-12h-7z" />
              </svg>
              <div className="mt-4 font-['Outfit'] font-bold text-[21px] text-white">
                Honest, upfront pricing
              </div>
              <p className="mt-2 text-[#BFD8CE] text-base leading-relaxed">
                Every listing shows its price per kWh and power rating before you go.
              </p>
            </div>
          </div>

          {/* Feature 6 */}
          <div className="p-7 rounded-[22px] bg-[#17302A] border border-[#234A3F] flex flex-col justify-between">
            <div>
              <svg
                width="30"
                height="30"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#6FD3AC"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <rect x="2" y="7" width="20" height="11" rx="3" />
                <path d="M6 18v2M18 18v2M6 12h2M16 12h2" />
              </svg>
              <div className="mt-4 font-['Outfit'] font-bold text-[21px] text-white">
                Save your vehicles
              </div>
              <p className="mt-2 text-[#BFD8CE] text-base leading-relaxed">
                Keep your car on your profile so you know which plug you need.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
