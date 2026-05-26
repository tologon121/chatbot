"use client";

import Navbar from "@/components/Navbar";
import { useLanguage } from "@/components/LanguageContext";

export default function PricingPage() {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen bg-[var(--background)] overflow-hidden transition-colors duration-300">
      <Navbar />

      <main className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 px-6 max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-16 fade-in-up">
          <h1 className="text-5xl lg:text-6xl font-bold tracking-tight mb-6">
            {t.pricingPage.title}
          </h1>
          <p className="text-xl text-[var(--foreground)]/70">
            {t.pricingPage.desc}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative z-10 fade-in-up delay-100">
          
          <div className="glass-panel p-10 rounded-3xl border border-[var(--border)] flex flex-col hover:-translate-y-2 transition-transform duration-500">
            <h3 className="text-2xl font-bold mb-2">{t.pricingPage.starter}</h3>
            <div className="text-4xl font-black mb-6">{t.pricingPage.starterPrice}<span className="text-lg text-[var(--foreground)]/50 font-normal">{t.pricingPage.perMonth}</span></div>
            <p className="text-[var(--foreground)]/70 mb-8 flex-1">{t.pricingPage.features}</p>
            <ul className="space-y-4 mb-10 text-[var(--foreground)]/80 text-sm font-medium">
              <li className="flex items-center gap-3"><Check /> 1,000 Chats/mo</li>
              <li className="flex items-center gap-3"><Check /> Basic RAG AI</li>
              <li className="flex items-center gap-3"><Check /> Standard Analytics</li>
            </ul>
            <button className="w-full py-4 rounded-xl border-2 border-indigo-500 text-indigo-600 dark:text-indigo-400 font-bold hover:bg-indigo-500 hover:text-white transition-all">
              {t.pricingPage.getStarted}
            </button>
          </div>

          <div className="glass-panel p-10 rounded-3xl border-2 border-indigo-500 shadow-2xl shadow-indigo-500/20 flex flex-col relative hover:-translate-y-2 transition-transform duration-500 scale-105 z-10 bg-[var(--surface-hover)]">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-4 py-1 rounded-full text-xs font-bold tracking-wide uppercase shadow-lg">Most Popular</div>
            <h3 className="text-2xl font-bold mb-2">{t.pricingPage.pro}</h3>
            <div className="text-5xl font-black mb-6 text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-purple-500">{t.pricingPage.proPrice}<span className="text-lg text-[var(--foreground)]/50 font-normal">{t.pricingPage.perMonth}</span></div>
            <p className="text-[var(--foreground)]/70 mb-8 flex-1">{t.pricingPage.features}</p>
            <ul className="space-y-4 mb-10 text-[var(--foreground)]/80 text-sm font-medium">
              <li className="flex items-center gap-3"><Check /> 10,000 Chats/mo</li>
              <li className="flex items-center gap-3"><Check /> Advanced RAG AI</li>
              <li className="flex items-center gap-3"><Check /> Active Lead Capture</li>
              <li className="flex items-center gap-3"><Check /> Multi-language (RU/KG/EN)</li>
            </ul>
            <button className="w-full py-4 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold hover:shadow-xl hover:shadow-indigo-500/30 transition-all">
              {t.pricingPage.getStarted}
            </button>
          </div>

          <div className="glass-panel p-10 rounded-3xl border border-[var(--border)] flex flex-col hover:-translate-y-2 transition-transform duration-500">
            <h3 className="text-2xl font-bold mb-2">{t.pricingPage.enterprise}</h3>
            <div className="text-4xl font-black mb-6">{t.pricingPage.enterprisePrice}<span className="text-lg text-[var(--foreground)]/50 font-normal">{t.pricingPage.perMonth}</span></div>
            <p className="text-[var(--foreground)]/70 mb-8 flex-1">{t.pricingPage.features}</p>
            <ul className="space-y-4 mb-10 text-[var(--foreground)]/80 text-sm font-medium">
              <li className="flex items-center gap-3"><Check /> Unlimited Chats</li>
              <li className="flex items-center gap-3"><Check /> Custom AI Training</li>
              <li className="flex items-center gap-3"><Check /> Dedicated Support</li>
              <li className="flex items-center gap-3"><Check /> White-label Widget</li>
            </ul>
            <button className="w-full py-4 rounded-xl border-2 border-indigo-500 text-indigo-600 dark:text-indigo-400 font-bold hover:bg-indigo-500 hover:text-white transition-all">
              {t.pricingPage.getStarted}
            </button>
          </div>

        </div>
        <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-purple-500/10 rounded-full blur-3xl -z-10"></div>
      </main>
    </div>
  );
}

function Check() {
  return (
    <svg className="w-5 h-5 text-emerald-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
    </svg>
  );
}
