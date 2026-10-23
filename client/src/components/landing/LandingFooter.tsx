import { Link } from "react-router";
import { useAuth } from "../../context";

export default function LandingFooter() {
  const { isAuthenticated } = useAuth();
  return (
    <footer className="bg-[#0F1F1A] text-[#BFD8CE]">
      <div className="max-w-[1200px] mx-auto px-6 py-12 flex flex-wrap gap-7 md:gap-12 items-start justify-between">
        <div className="max-w-[320px]">
          <div className="flex items-center gap-2.5 font-['Outfit'] font-bold text-[23px] text-white">
            <span className="w-11 h-11 rounded-xl bg-white flex items-center justify-center p-1">
              <img
                src="/ampshare-logo.png"
                alt="AmpShare"
                className="w-9 h-9 object-contain"
              />
            </span>
            AmpShare
          </div>
          <p className="mt-3 text-[15px] leading-relaxed">
            Share chargers, power the city. Made in Addis Ababa, Ethiopia.
          </p>
        </div>

        <nav
          aria-label="Footer"
          className="flex flex-wrap gap-x-8 gap-y-1 text-[15px]"
        >
          <Link
            to="/chargers"
            className="min-h-[44px] flex items-center text-[#E3F3EB] hover:text-[#0F9468] transition-colors"
          >
            Find chargers
          </Link>
          <Link
            to={isAuthenticated ? "/host" : "/login"}
            state={{ from: "/host" }}
            className="min-h-[44px] flex items-center text-[#E3F3EB] hover:text-[#0F9468] transition-colors"
          >
            Host
          </Link>
          <Link
            to="/login"
            className="min-h-[44px] flex items-center text-[#E3F3EB] hover:text-[#0F9468] transition-colors"
          >
            Sign in
          </Link>
          <Link
            to="/register"
            className="min-h-[44px] flex items-center text-[#E3F3EB] hover:text-[#0F9468] transition-colors"
          >
            Create account
          </Link>
        </nav>
      </div>

      <div className="border-t border-[#234A3F]">
        <div className="max-w-[1200px] mx-auto px-6 py-5 text-sm">
          © AmpShare. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
