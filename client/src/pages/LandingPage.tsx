import LandingNav from "../components/landing/LandingNav";
import HeroSection from "../components/landing/HeroSection";
import HowItWorksSection from "../components/landing/HowItWorksSection";
import FeaturesSection from "../components/landing/FeaturesSection";
import HostSection from "../components/landing/HostSection";
import CtaSection from "../components/landing/CtaSection";
import FaqSection from "../components/landing/FaqSection";
import LandingFooter from "../components/landing/LandingFooter";

export default function LandingPage() {
  return (
    <div className="w-full bg-white text-[#0F1F1A] font-['Inter',system-ui,sans-serif] text-[17px] leading-[1.6]">
      <LandingNav />
      <main>
        <HeroSection />
        <HowItWorksSection />
        <FeaturesSection />
        <HostSection />
        <CtaSection />
        <FaqSection />
      </main>
      <LandingFooter />
    </div>
  );
}
