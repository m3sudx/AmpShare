import { Link } from "react-router";
import { useAuth } from "../../context";

export default function HostSection() {
  const { isAuthenticated } = useAuth();
  return (
    <section id="hosts" className="bg-white">
      <div className="max-w-[1200px] mx-auto px-6 py-18 sm:py-24 flex flex-col lg:flex-row items-center gap-12 lg:gap-16">
        {/* Left schedule mock */}
        <div className="w-full lg:flex-1 min-w-0 max-w-[500px]">
          <div className="p-7 rounded-[26px] bg-white border border-[#D9EBE2] shadow-xl shadow-[#0B7A55]/10">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div className="font-['Outfit'] font-bold text-xl text-[#0F1F1A]">
                Weekly hours
              </div>
              <span className="px-3 py-1 rounded-full bg-[#E7F6F0] text-[#0B7A55] text-[13px] font-semibold">
                Active
              </span>
            </div>

            <div className="mt-5 flex flex-col gap-3.5">
              {/* Monday */}
              <div className="flex items-center gap-3.5">
                <span className="w-9.5 text-sm font-semibold text-[#2B3D36]">Mon</span>
                <div className="relative flex-grow h-3 rounded-md bg-[#E3EFE9]">
                  <div
                    className="absolute top-0 bottom-0 rounded-md bg-[#0F9468]"
                    style={{ left: "25%", width: "66.7%" }}
                  />
                </div>
                <span className="w-26 text-right text-[13px] text-[#4A5B54]">06:00 – 22:00</span>
              </div>

              {/* Tuesday */}
              <div className="flex items-center gap-3.5">
                <span className="w-9.5 text-sm font-semibold text-[#2B3D36]">Tue</span>
                <div className="relative flex-grow h-3 rounded-md bg-[#E3EFE9]">
                  <div
                    className="absolute top-0 bottom-0 rounded-md bg-[#0F9468]"
                    style={{ left: "25%", width: "66.7%" }}
                  />
                </div>
                <span className="w-26 text-right text-[13px] text-[#4A5B54]">06:00 – 22:00</span>
              </div>

              {/* Wednesday */}
              <div className="flex items-center gap-3.5">
                <span className="w-9.5 text-sm font-semibold text-[#2B3D36]">Wed</span>
                <div className="relative flex-grow h-3 rounded-md bg-[#E3EFE9]">
                  <div
                    className="absolute top-0 bottom-0 rounded-md bg-[#0F9468]"
                    style={{ left: "25%", width: "29.2%" }}
                  />
                  <div
                    className="absolute top-0 bottom-0 rounded-md bg-[#0F9468]"
                    style={{ left: "62.5%", width: "29.2%" }}
                  />
                </div>
                <span className="w-26 text-right text-[13px] text-[#4A5B54]">2 slots</span>
              </div>

              {/* Thursday */}
              <div className="flex items-center gap-3.5">
                <span className="w-9.5 text-sm font-semibold text-[#2B3D36]">Thu</span>
                <div className="relative flex-grow h-3 rounded-md bg-[#E3EFE9]">
                  <div
                    className="absolute top-0 bottom-0 rounded-md bg-[#0F9468]"
                    style={{ left: "25%", width: "66.7%" }}
                  />
                </div>
                <span className="w-26 text-right text-[13px] text-[#4A5B54]">06:00 – 22:00</span>
              </div>

              {/* Friday */}
              <div className="flex items-center gap-3.5">
                <span className="w-9.5 text-sm font-semibold text-[#2B3D36]">Fri</span>
                <div className="relative flex-grow h-3 rounded-md bg-[#E3EFE9]">
                  <div
                    className="absolute top-0 bottom-0 rounded-md bg-[#0F9468]"
                    style={{ left: "25%", width: "66.7%" }}
                  />
                </div>
                <span className="w-26 text-right text-[13px] text-[#4A5B54]">06:00 – 22:00</span>
              </div>

              {/* Saturday */}
              <div className="flex items-center gap-3.5">
                <span className="w-9.5 text-sm font-semibold text-[#2B3D36]">Sat</span>
                <div className="relative flex-grow h-3 rounded-md bg-[#E3EFE9]">
                  <div
                    className="absolute top-0 bottom-0 rounded-md bg-[#0F9468]"
                    style={{ left: "33.3%", width: "50%" }}
                  />
                </div>
                <span className="w-26 text-right text-[13px] text-[#4A5B54]">08:00 – 20:00</span>
              </div>

              {/* Sunday */}
              <div className="flex items-center gap-3.5">
                <span className="w-9.5 text-sm font-semibold text-[#2B3D36]">Sun</span>
                <div className="relative flex-grow h-3 rounded-md bg-[#E3EFE9]" />
                <span className="w-26 text-right text-[13px] text-[#4A5B54]">Closed</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right content */}
        <div className="flex-1 min-w-0">
          <div className="text-sm font-bold tracking-[0.12em] uppercase text-[#0B7A55]">
            For hosts
          </div>

          <h2 className="mt-3 font-['Outfit'] font-bold text-3xl sm:text-4xl lg:text-[46px] leading-[1.12] tracking-tight text-[#0F1F1A]">
            Turn an idle charger into income
          </h2>

          <p className="mt-4.5 text-[#3F5149] text-lg leading-relaxed">
            Already have a charger at home or at your business? List it, decide when it is open, and let nearby drivers book it.
          </p>

          <ul className="mt-7 p-0 list-none flex flex-col gap-4.5">
            <li className="flex gap-3.5 items-start">
              <span className="shrink-0 w-7.5 h-7.5 rounded-full bg-[#E7F6F0] flex items-center justify-center text-[#0B7A55]">
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#0B7A55"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M5 12l5 5 9-10" />
                </svg>
              </span>
              <span className="text-base text-[#0F1F1A]">
                <strong className="font-semibold text-[#0F1F1A]">Add your charger in minutes.</strong>{" "}
                <span className="text-[#3F5149]">Pin the location on the map and set the plug, power and price.</span>
              </span>
            </li>

            <li className="flex gap-3.5 items-start">
              <span className="shrink-0 w-7.5 h-7.5 rounded-full bg-[#E7F6F0] flex items-center justify-center text-[#0B7A55]">
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#0B7A55"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M5 12l5 5 9-10" />
                </svg>
              </span>
              <span className="text-base text-[#0F1F1A]">
                <strong className="font-semibold text-[#0F1F1A]">You control the hours.</strong>{" "}
                <span className="text-[#3F5149]">Set a weekly schedule with as many slots a day as you like.</span>
              </span>
            </li>

            <li className="flex gap-3.5 items-start">
              <span className="shrink-0 w-7.5 h-7.5 rounded-full bg-[#E7F6F0] flex items-center justify-center text-[#0B7A55]">
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#0B7A55"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M5 12l5 5 9-10" />
                </svg>
              </span>
              <span className="text-base text-[#0F1F1A]">
                <strong className="font-semibold text-[#0F1F1A]">Go live when you are ready.</strong>{" "}
                <span className="text-[#3F5149]">Activate or pause your listing at any time.</span>
              </span>
            </li>
          </ul>

          <div className="mt-8.5">
            <Link
              to={isAuthenticated ? "/host" : "/login"}
              state={!isAuthenticated ? { from: { pathname: "/host" } } : undefined}
              className="min-h-[54px] px-7.5 inline-flex items-center justify-center rounded-2xl bg-[#0B7A55] hover:bg-[#095F43] text-white font-semibold text-[17px] transition-colors"
            >
              Start hosting
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
