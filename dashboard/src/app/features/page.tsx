"use client";

import Navbar from "@/components/Navbar";
import { useLanguage } from "@/components/LanguageContext";

export default function FeaturesPage() {
  const { t } = useLanguage();

  const features = [
    {
      title: t.featuresPage.f1Title,
      desc: t.featuresPage.f1Desc,
      icon: "M13 10V3L4 14h7v7l9-11h-7z"
    },
    {
      title: t.featuresPage.f2Title,
      desc: t.featuresPage.f2Desc,
      icon: "M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
    },
    {
      title: t.featuresPage.f3Title,
      desc: t.featuresPage.f3Desc,
      icon: "M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129"
    },
    {
      title: t.featuresPage.f4Title,
      desc: t.featuresPage.f4Desc,
      icon: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
    }
  ];

  return (
    <div className="min-h-screen bg-[var(--background)] overflow-hidden transition-colors duration-300">
      <Navbar />

      <main className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 px-6 max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-16 fade-in-up">
          <h1 className="text-5xl lg:text-6xl font-bold tracking-tight mb-6">
            {t.featuresPage.title}
          </h1>
          <p className="text-xl text-[var(--foreground)]/70">
            {t.featuresPage.desc}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10 fade-in-up delay-100">
          {features.map((f, i) => (
            <div key={i} className="glass-panel p-10 rounded-3xl hover:-translate-y-2 transition-transform duration-500 shadow-xl border border-[var(--border)] group">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 text-indigo-500 dark:text-indigo-400 flex items-center justify-center mb-8 shadow-inner group-hover:scale-110 transition-transform">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={f.icon} />
                </svg>
              </div>
              <h3 className="text-2xl font-bold mb-4">{f.title}</h3>
              <p className="text-[var(--foreground)]/70 text-lg leading-relaxed">
                {f.desc}
              </p>
            </div>
          ))}
        </div>
        
        {/* Background blobs */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-indigo-500/10 dark:bg-indigo-500/5 rounded-full blur-3xl -z-10 animate-pulse"></div>
      </main>
    </div>
  );
}
