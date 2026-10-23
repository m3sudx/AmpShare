export default function HowItWorksSection() {
  return (
    <section id="how" className="bg-white">
      <div className="max-w-[1200px] mx-auto px-6 py-18 sm:py-22">
        <div className="max-w-[640px]">
          <div className="text-sm font-bold tracking-[0.12em] uppercase text-[#0B7A55]">
            How it works
          </div>
          <h2 className="mt-3 font-['Outfit'] font-bold text-3xl sm:text-4xl lg:text-[46px] leading-[1.12] tracking-tight text-[#0F1F1A]">
            From “where can I charge?” to plugged in
          </h2>
        </div>

        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1 */}
          <div className="p-7 sm:p-7.5 rounded-[24px] bg-[#F0FAF6] border border-[#D9EBE2] flex flex-col justify-between">
            <div>
              <div className="w-13 h-13 rounded-2xl bg-[#0B7A55] flex items-center justify-center text-white">
                <svg
                  width="26"
                  height="26"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#FFFFFF"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <circle cx="11" cy="11" r="7" />
                  <path d="M20 20l-4-4" />
                </svg>
              </div>
              <div className="mt-5 font-['Outfit'] font-bold text-[22px] text-[#0F1F1A]">
                1. Find a charger
              </div>
              <p className="mt-2 text-[#3F5149] text-base leading-relaxed">
                Search the map near you and filter by plug type, power and price per kWh.
              </p>
            </div>
          </div>

          {/* Card 2 */}
          <div className="p-7 sm:p-7.5 rounded-[24px] bg-[#F0FAF6] border border-[#D9EBE2] flex flex-col justify-between">
            <div>
              <div className="w-13 h-13 rounded-2xl bg-[#0B7A55] flex items-center justify-center text-white">
                <svg
                  width="26"
                  height="26"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#FFFFFF"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <circle cx="12" cy="12" r="9" />
                  <path d="M12 7v5l3 2" />
                </svg>
              </div>
              <div className="mt-5 font-['Outfit'] font-bold text-[22px] text-[#0F1F1A]">
                2. Check the hours
              </div>
              <p className="mt-2 text-[#3F5149] text-base leading-relaxed">
                See the weekly availability the host has set, so you only plan around times that are open.
              </p>
            </div>
          </div>

          {/* Card 3 */}
          <div className="p-7 sm:p-7.5 rounded-[24px] bg-[#F0FAF6] border border-[#D9EBE2] flex flex-col justify-between">
            <div>
              <div className="w-13 h-13 rounded-2xl bg-[#0B7A55] flex items-center justify-center text-white">
                <svg
                  width="26"
                  height="26"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#FFFFFF"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M3 11l18-8-8 18-2-8z" />
                </svg>
              </div>
              <div className="mt-5 font-['Outfit'] font-bold text-[22px] text-[#0F1F1A]">
                3. Get directions and charge
              </div>
              <p className="mt-2 text-[#3F5149] text-base leading-relaxed">
                Follow the route on the map, arrive, plug in and pay the host’s listed price.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
