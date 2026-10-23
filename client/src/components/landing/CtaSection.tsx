import { Link } from "react-router";

export default function CtaSection() {
  return (
    <section className="bg-white">
      <div className="max-w-[1200px] mx-auto px-6 pb-20 sm:pb-24">
        <div className="py-14 px-8 sm:py-16 sm:px-10 rounded-[32px] bg-[#0B7A55] text-white text-center">
          <h2 className="mx-auto max-w-[700px] font-['Outfit'] font-bold text-3xl sm:text-4xl lg:text-[46px] leading-[1.12] tracking-tight text-white">
            Ready to charge up the city?
          </h2>

          <p className="mt-4 mx-auto max-w-[520px] text-lg text-[#D5F0E4] leading-relaxed">
            Create a free account and find your first charger, or list your own.
          </p>

          <div className="mt-8 flex flex-wrap justify-center gap-3.5">
            <Link
              to="/register"
              className="min-h-[54px] px-8 inline-flex items-center justify-center rounded-2xl bg-white hover:bg-[#F0FAF6] text-[#0B7A55] font-bold text-[17px] transition-colors shadow-sm"
            >
              Create an account
            </Link>

            <Link
              to="/chargers"
              className="min-h-[54px] px-7.5 inline-flex items-center justify-center rounded-2xl border-[1.5px] border-[#8FD4B7] hover:bg-[#095F43] text-white font-semibold text-[17px] transition-colors"
            >
              Browse chargers
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
