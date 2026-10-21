import React from "react";
import { Link } from "react-router";

export interface FeatureItem {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
}

interface AuthLayoutProps {
  badgeText: string;
  heroHeading: string;
  heroDescription: string;
  features: FeatureItem[];
  networkCard?: React.ReactNode;
  cardTitle: string;
  cardSubtitle: string;
  children: React.ReactNode;
}

export default function AuthLayout({
  badgeText,
  heroHeading,
  heroDescription,
  features,
  networkCard,
  cardTitle,
  cardSubtitle,
  children,
}: AuthLayoutProps) {
  return (
    <div className="h-screen w-full overflow-hidden bg-[#f4fbf7] text-slate-800 antialiased selection:bg-emerald-100 selection:text-emerald-800 flex flex-col md:flex-row">
      {/* Left Brand Panel (Desktop & Tablet) */}
      <aside className="hidden md:flex flex-1 md:w-[50%] lg:w-[54%] h-full relative overflow-hidden bg-gradient-to-br from-[#0F9468] via-[#086a4c] to-[#043d2e] md:rounded-r-[32px] lg:rounded-r-[40px] shadow-2xl flex-col justify-between p-8 lg:p-12 text-white">
        {/* Decorative Circuit Background */}
        <svg
          className="absolute inset-0 w-full h-full object-cover opacity-10 pointer-events-none"
          fill="none"
          viewBox="0 0 800 800"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <path
            d="M-100 200 H300 L450 350 V600 L600 750 H900"
            stroke="currentColor"
            strokeDasharray="8 8"
            strokeWidth="2.5"
          />
          <path
            d="M100 -50 V300 L250 450 H650 L800 600 V900"
            stroke="currentColor"
            strokeWidth="2.5"
          />
          <circle cx="300" cy="200" fill="currentColor" r="8" />
          <circle cx="450" cy="350" fill="currentColor" r="8" />
          <circle cx="600" cy="750" fill="currentColor" r="8" />
          <circle cx="250" cy="450" fill="currentColor" r="8" />
          <circle cx="650" cy="450" fill="currentColor" r="8" />
        </svg>

        {/* Content container */}
        <div className="relative z-10 space-y-5 my-auto max-w-xl">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-medium bg-white/15 text-emerald-100 border border-white/20 backdrop-blur-sm">
            <span className="w-2 h-2 rounded-full bg-emerald-300 animate-pulse" />
            <span>{badgeText}</span>
          </div>

          {/* Heading & Subtitle */}
          <h2 className="text-3xl lg:text-4xl xl:text-5xl font-bold tracking-tight text-white leading-tight">
            {heroHeading}
          </h2>
          <p className="text-emerald-100/90 text-sm lg:text-base font-normal leading-relaxed max-w-lg">
            {heroDescription}
          </p>

          {/* Feature list */}
          <div className="space-y-4 pt-3">
            {features.map((feature, idx) => (
              <div key={idx} className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-full bg-white/15 border border-white/20 flex items-center justify-center text-white shrink-0">
                  {feature.icon}
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">{feature.title}</p>
                  <p className="text-xs text-emerald-100/80">{feature.subtitle}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Network Stat Card */}
          {networkCard && <div className="pt-2">{networkCard}</div>}
        </div>

        {/* Bottom copyright */}
        <div className="relative z-10 pt-4 flex items-center justify-between text-xs text-emerald-200/70 border-t border-white/10">
          <span>© AmpShare Ethiopia</span>
          <span>Powering urban mobility</span>
        </div>
      </aside>

      {/* Right Form Container */}
      <main className="w-full md:w-[50%] lg:w-[46%] h-full flex items-center justify-center p-4 sm:p-6 lg:p-8 overflow-y-auto z-10">
        <div
          className="bg-white rounded-3xl shadow-[0_12px_40px_-15px_rgba(15,23,42,0.08)] border border-slate-100 p-7 sm:p-9 transition-all w-full my-auto"
          style={{ maxWidth: 430 }}
        >
          {/* Logo Header */}
          <header className="text-center mb-6">
            <div className="inline-flex items-center justify-center mb-4">
              <Link to="/" className="inline-block transition-transform hover:scale-105 duration-200">
                <img
                  alt="AmpShare Logo"
                  className="h-16 w-16 object-contain filter drop-shadow-sm"
                  src="/ampshare-logo.png"
                />
              </Link>
            </div>
            <h1 className="text-2xl sm:text-[27px] font-bold text-slate-900 tracking-tight leading-snug">
              {cardTitle}
            </h1>
            <p className="text-slate-500 text-sm mt-1.5 leading-relaxed font-normal">
              {cardSubtitle}
            </p>
          </header>

          {/* Form Content */}
          {children}
        </div>
      </main>
    </div>
  );
}
