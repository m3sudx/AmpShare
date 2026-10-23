import { useState } from "react";
import { Link } from "react-router";
import { useAuth } from "../../context";

export default function LandingNav() {
  const { isAuthenticated } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="border-b border-[#E3EFE9] bg-white sticky top-0 z-40">
      <div className="max-w-[1200px] mx-auto px-6 min-h-[76px] flex items-center justify-between gap-4">
        {/* Logo */}
        <a
          href="#top"
          className="flex items-center gap-2.5 font-['Outfit'] font-bold text-2xl text-[#0B7A55] shrink-0"
        >
          <img
            src="/ampshare-logo.png"
            alt="AmpShare"
            className="w-10 h-10 object-contain"
          />
          <span>AmpShare</span>
        </a>

        {/* Desktop Nav Links */}
        <nav
          aria-label="Main"
          className="hidden md:flex items-center gap-7 font-medium text-base text-[#2B3D36]"
        >
          <a
            href="#how"
            className="min-h-[44px] flex items-center hover:text-[#0B7A55] transition-colors"
          >
            How it works
          </a>
          <a
            href="#features"
            className="min-h-[44px] flex items-center hover:text-[#0B7A55] transition-colors"
          >
            Features
          </a>
          <a
            href="#hosts"
            className="min-h-[44px] flex items-center hover:text-[#0B7A55] transition-colors"
          >
            For hosts
          </a>
          <a
            href="#faq"
            className="min-h-[44px] flex items-center hover:text-[#0B7A55] transition-colors"
          >
            FAQ
          </a>
        </nav>

        {/* Desktop Auth Controls */}
        <div className="hidden md:flex items-center gap-3">
          {isAuthenticated ? (
            <Link
              to="/chargers"
              className="min-h-[44px] px-6 inline-flex items-center justify-center rounded-xl bg-[#0B7A55] hover:bg-[#095F43] text-white font-semibold text-base transition-colors shadow-xs"
            >
              Open app
            </Link>
          ) : (
            <>
              <Link
                to="/login"
                className="min-h-[44px] px-4 inline-flex items-center justify-center font-semibold text-base text-[#0F1F1A] hover:text-[#0B7A55] transition-colors"
              >
                Sign in
              </Link>
              <Link
                to="/register"
                className="min-h-[44px] px-5.5 inline-flex items-center justify-center rounded-xl bg-[#0B7A55] hover:bg-[#095F43] text-white font-semibold text-base transition-colors shadow-xs"
              >
                Get started
              </Link>
            </>
          )}
        </div>

        {/* Mobile menu button */}
        <button
          type="button"
          onClick={() => setMobileMenuOpen((prev) => !prev)}
          className="md:hidden min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg text-[#0F1F1A] hover:bg-[#F0FAF6] transition-colors"
          aria-expanded={mobileMenuOpen}
          aria-label={mobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
        >
          {mobileMenuOpen ? (
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          ) : (
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M3 12h18M3 6h18M3 18h18" />
            </svg>
          )}
        </button>
      </div>

      {/* Mobile menu dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-[#E3EFE9] bg-white px-6 py-4 flex flex-col gap-3">
          <a
            href="#how"
            onClick={() => setMobileMenuOpen(false)}
            className="min-h-[44px] flex items-center text-[#2B3D36] hover:text-[#0B7A55] font-medium text-base"
          >
            How it works
          </a>
          <a
            href="#features"
            onClick={() => setMobileMenuOpen(false)}
            className="min-h-[44px] flex items-center text-[#2B3D36] hover:text-[#0B7A55] font-medium text-base"
          >
            Features
          </a>
          <a
            href="#hosts"
            onClick={() => setMobileMenuOpen(false)}
            className="min-h-[44px] flex items-center text-[#2B3D36] hover:text-[#0B7A55] font-medium text-base"
          >
            For hosts
          </a>
          <a
            href="#faq"
            onClick={() => setMobileMenuOpen(false)}
            className="min-h-[44px] flex items-center text-[#2B3D36] hover:text-[#0B7A55] font-medium text-base"
          >
            FAQ
          </a>

          <div className="pt-3 border-t border-[#E3EFE9] flex flex-col gap-2.5">
            {isAuthenticated ? (
              <Link
                to="/chargers"
                onClick={() => setMobileMenuOpen(false)}
                className="min-h-[44px] px-6 flex items-center justify-center rounded-xl bg-[#0B7A55] text-white font-semibold text-base"
              >
                Open app
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="min-h-[44px] px-4 flex items-center justify-center font-semibold text-base text-[#0F1F1A] border border-[#CFE5DB] rounded-xl"
                >
                  Sign in
                </Link>
                <Link
                  to="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="min-h-[44px] px-6 flex items-center justify-center rounded-xl bg-[#0B7A55] text-white font-semibold text-base"
                >
                  Get started
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
