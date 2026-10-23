export default function FaqSection() {
  return (
    <section id="faq" className="bg-[#F0FAF6]">
      <div className="max-w-[820px] mx-auto px-6 py-18 sm:py-22">
        <h2 className="m-0 text-center font-['Outfit'] font-bold text-3xl sm:text-4xl lg:text-[42px] leading-[1.12] text-[#0F1F1A]">
          Questions, answered
        </h2>

        <div className="mt-10 flex flex-col gap-3">
          {/* FAQ 1 */}
          <details className="px-6 rounded-[18px] bg-white border border-[#D9EBE2] group">
            <summary className="min-h-[64px] flex items-center justify-between gap-4 font-semibold text-lg text-[#0F1F1A] cursor-pointer select-none">
              <span>Do I need a host account to book a charger?</span>
              <svg
                className="faq-plus shrink-0 transition-transform duration-200"
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#0B7A55"
                strokeWidth="2.4"
                strokeLinecap="round"
                aria-hidden="true"
              >
                <path d="M12 5v14M5 12h14" />
              </svg>
            </summary>
            <p className="mt-0 pb-5.5 text-[#3F5149] text-base leading-relaxed">
              No. Every account starts as a driver, and you can browse and book chargers right away.
            </p>
          </details>

          {/* FAQ 2 */}
          <details className="px-6 rounded-[18px] bg-white border border-[#D9EBE2] group">
            <summary className="min-h-[64px] flex items-center justify-between gap-4 font-semibold text-lg text-[#0F1F1A] cursor-pointer select-none">
              <span>How do I become a host?</span>
              <svg
                className="faq-plus shrink-0 transition-transform duration-200"
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#0B7A55"
                strokeWidth="2.4"
                strokeLinecap="round"
                aria-hidden="true"
              >
                <path d="M12 5v14M5 12h14" />
              </svg>
            </summary>
            <p className="mt-0 pb-5.5 text-[#3F5149] text-base leading-relaxed">
              Open the Host tab and choose “Become a host”. You keep your driver account and can do both.
            </p>
          </details>

          {/* FAQ 3 */}
          <details className="px-6 rounded-[18px] bg-white border border-[#D9EBE2] group">
            <summary className="min-h-[64px] flex items-center justify-between gap-4 font-semibold text-lg text-[#0F1F1A] cursor-pointer select-none">
              <span>Which plug types are supported?</span>
              <svg
                className="faq-plus shrink-0 transition-transform duration-200"
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#0B7A55"
                strokeWidth="2.4"
                strokeLinecap="round"
                aria-hidden="true"
              >
                <path d="M12 5v14M5 12h14" />
              </svg>
            </summary>
            <p className="mt-0 pb-5.5 text-[#3F5149] text-base leading-relaxed">
              GB/T, Type 2 and CCS2. You can filter the map by plug so you only see chargers that fit your car.
            </p>
          </details>

          {/* FAQ 4 */}
          <details className="px-6 rounded-[18px] bg-white border border-[#D9EBE2] group">
            <summary className="min-h-[64px] flex items-center justify-between gap-4 font-semibold text-lg text-[#0F1F1A] cursor-pointer select-none">
              <span>Why can’t I see a charger I just added?</span>
              <svg
                className="faq-plus shrink-0 transition-transform duration-200"
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#0B7A55"
                strokeWidth="2.4"
                strokeLinecap="round"
                aria-hidden="true"
              >
                <path d="M12 5v14M5 12h14" />
              </svg>
            </summary>
            <p className="mt-0 pb-5.5 text-[#3F5149] text-base leading-relaxed">
              New chargers start inactive. Set your weekly hours, then activate the listing and it will appear for drivers.
            </p>
          </details>
        </div>
      </div>
    </section>
  );
}
