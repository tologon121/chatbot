"use client";

import { useLanguage } from "@/components/LanguageContext";

export default function AnalyticsPage() {
  const { t } = useLanguage();

  return (
    <div className="fade-in-up pb-10">
      <header className="mb-10 flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">{t.analytics.title}</h2>
          <p className="text-[var(--foreground)]/60 mt-2 text-sm">{t.analytics.desc}</p>
        </div>
        <button className="px-4 py-2 bg-[var(--foreground)] text-[var(--background)] rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity">
          {t.analytics.exportReport}
        </button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        {/* Sentiment */}
        <div className="glass-panel p-8 rounded-2xl">
          <h3 className="text-lg font-semibold mb-6">{t.analytics.sentiment}</h3>
          <div className="space-y-6">
            {[
              { label: t.analytics.positive, pct: 65, color: "bg-emerald-500", text: "text-emerald-500" },
              { label: t.analytics.neutral,  pct: 25, color: "bg-blue-500",    text: "text-blue-500" },
              { label: t.analytics.negative, pct: 10, color: "bg-red-500",     text: "text-red-500" },
            ].map(({ label, pct, color, text }) => (
              <div key={label}>
                <div className="flex justify-between text-sm mb-2">
                  <span className="font-medium">{label}</span>
                  <span className={text}>{pct}%</span>
                </div>
                <div className="h-2 w-full bg-[var(--surface-hover)] rounded-full overflow-hidden">
                  <div
                    className={`h-full ${color} rounded-full transition-all duration-700`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Popular intents */}
        <div className="glass-panel p-8 rounded-2xl">
          <h3 className="text-lg font-semibold mb-6">{t.analytics.intents}</h3>
          <ul className="space-y-4">
            {[
              { label: t.analytics.pricingInquiry, pct: "42%", accent: "bg-indigo-500/20 text-indigo-500" },
              { label: t.analytics.productSupport, pct: "28%", accent: "bg-purple-500/20 text-purple-500" },
              { label: t.analytics.featureRequest, pct: "15%", accent: "bg-pink-500/20 text-pink-500" },
            ].map(({ label, pct, accent }, i) => (
              <li
                key={label}
                className="flex items-center justify-between p-3 rounded-xl bg-[var(--surface-hover)]"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-8 h-8 rounded-full ${accent} flex items-center justify-center text-xs font-bold`}
                  >
                    {i + 1}
                  </div>
                  <span className="font-medium text-sm">{label}</span>
                </div>
                <span className="font-bold">{pct}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Language distribution */}
      <div className="glass-panel p-8 rounded-2xl">
        <h3 className="text-lg font-semibold mb-6">{t.analytics.languages}</h3>
        <div className="flex h-12 w-full rounded-xl overflow-hidden shadow-inner mb-6">
          <div
            className="bg-indigo-500 h-full flex items-center justify-center text-xs font-bold text-white hover:opacity-90 transition-opacity cursor-default"
            style={{ width: "60%" }}
          >
            RU (60%)
          </div>
          <div
            className="bg-purple-500 h-full flex items-center justify-center text-xs font-bold text-white hover:opacity-90 transition-opacity cursor-default"
            style={{ width: "30%" }}
          >
            EN (30%)
          </div>
          <div
            className="bg-pink-500 h-full flex items-center justify-center text-xs font-bold text-white hover:opacity-90 transition-opacity cursor-default"
            style={{ width: "10%" }}
          >
            KG
          </div>
        </div>
        <p className="text-sm text-[var(--foreground)]/60 text-center">
          {t.analytics.multiLangNote}
        </p>
      </div>
    </div>
  );
}
