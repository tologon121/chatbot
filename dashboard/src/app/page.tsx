"use client";

import Link from "next/link";
import Navbar from "@/components/Navbar";
import { useLanguage } from "@/components/LanguageContext";

export default function Home() {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen bg-[var(--background)] overflow-x-hidden">
      <Navbar />

      {/* =====================================================================
          HERO
          ================================================================= */}
      <main className="relative pt-32 lg:pt-40 pb-24 px-6">
        <div className="mesh-bg" />
        <div className="absolute inset-0 grid-pattern opacity-50 dark:opacity-30 pointer-events-none -z-10" />

        <div className="max-w-6xl mx-auto text-center">
          {/* Badge */}
          <div className="fade-in inline-flex items-center gap-2 mb-8">
            <span className="chip chip-glow">
              <span className="relative flex h-2 w-2">
                <span className="absolute inset-0 rounded-full bg-indigo-500 opacity-75 animate-ping" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500" />
              </span>
              {t.hero.badge}
            </span>
          </div>

          {/* Headline */}
          <h1 className="fade-in-up text-[44px] sm:text-6xl lg:text-7xl xl:text-[88px] font-bold tracking-[-0.03em] leading-[1.02] mb-7 text-balance">
            <span className="text-gradient-subtle">{t.hero.title1}</span>{" "}
            <br className="hidden md:inline" />
            <span className="text-gradient">{t.hero.titleHighlight}</span>
          </h1>

          {/* Sub */}
          <p className="fade-in-up stagger-100 text-base md:text-lg text-[var(--foreground-muted)] mb-10 max-w-2xl mx-auto leading-relaxed">
            {t.hero.desc}
          </p>

          {/* CTAs */}
          <div className="fade-in-up stagger-200 flex flex-col sm:flex-row items-center justify-center gap-3 mb-16">
            <Link href="/dashboard" className="btn-primary w-full sm:w-auto">
              {t.hero.ctaPrimary}
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
            <Link href="/demo" className="btn-secondary w-full sm:w-auto">
              <svg className="w-4 h-4 opacity-60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {t.hero.ctaSecondary}
            </Link>
          </div>

          {/* Stats strip */}
          <div className="fade-in-up stagger-300 flex flex-wrap items-center justify-center gap-x-10 gap-y-4 text-sm text-[var(--foreground-muted)] mb-20">
            <Stat number="1.2s"   label={t.hero.statResponse} />
            <span className="opacity-30">•</span>
            <Stat number="98%"    label={t.hero.statResolution} />
            <span className="opacity-30">•</span>
            <Stat number="3"      label={t.hero.statLanguages} />
            <span className="opacity-30">•</span>
            <Stat number="< 30KB" label={t.hero.statBundle} />
          </div>

          {/* Code snippet showcase */}
          <CodeShowcase compatible={t.hero.compatible} />

          {/* Features grid */}
          <div className="mt-32">
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-3">
              <span className="text-gradient-subtle">{t.hero.featuresTitle1}</span>
              <br />
              <span className="text-[var(--foreground-faint)]">{t.hero.featuresTitle2}</span>
            </h2>
            <p className="text-[var(--foreground-muted)] max-w-xl mx-auto mb-14">
              {t.featuresPage?.desc || "A production-ready chat assistant in 60 seconds."}
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 text-left">
              <FeatureCard
                title={t.featuresPage.f1Title}
                desc={t.featuresPage.f1Desc}
                icon="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                accent="from-indigo-500 to-violet-600"
              />
              <FeatureCard
                title={t.featuresPage.f2Title}
                desc={t.featuresPage.f2Desc}
                icon="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
                accent="from-violet-500 to-fuchsia-600"
              />
              <FeatureCard
                title={t.featuresPage.f3Title}
                desc={t.featuresPage.f3Desc}
                icon="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                accent="from-fuchsia-500 to-rose-600"
              />
            </div>
          </div>

          {/* Bottom CTA */}
          <div className="mt-32 relative">
            <div className="card-premium p-10 lg:p-14 text-center max-w-4xl mx-auto">
              <h3 className="text-2xl md:text-4xl font-bold tracking-tight mb-3">
                {t.hero.ctaSectionTitle}
              </h3>
              <p className="text-[var(--foreground-muted)] mb-7 max-w-md mx-auto">
                {t.hero.ctaSectionDesc}
              </p>
              <Link href="/register" className="btn-primary">
                {t.nav.getStarted}
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

/* ---------- Stat ---------- */
function Stat({ number, label }: { number: string; label: string }) {
  return (
    <div className="inline-flex items-baseline gap-1.5">
      <span className="text-lg font-bold tracking-tight text-[var(--foreground)] tabular-nums">{number}</span>
      <span className="text-[12px] uppercase tracking-wider text-[var(--foreground-faint)]">{label}</span>
    </div>
  );
}

/* ---------- Feature card ---------- */
function FeatureCard({
  title, desc, icon, accent,
}: { title: string; desc: string; icon: string; accent: string }) {
  return (
    <div className="card-premium p-7 group">
      <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${accent} flex items-center justify-center mb-5 shadow-lg shadow-indigo-500/20`}>
        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={icon} />
        </svg>
      </div>
      <h3 className="text-lg font-bold mb-2 tracking-tight">{title}</h3>
      <p className="text-[14px] text-[var(--foreground-muted)] leading-relaxed">{desc}</p>
    </div>
  );
}

/* ---------- Code showcase ---------- */
function CodeShowcase({ compatible }: { compatible: string }) {
  return (
    <div className="relative mx-auto max-w-3xl text-left fade-in-up stagger-300">
      <div className="absolute -inset-px rounded-2xl bg-gradient-to-r from-indigo-500/30 via-violet-500/30 to-fuchsia-500/30 blur-xl opacity-50 -z-10" />
      <div className="relative card-premium overflow-hidden p-0">
        {/* Window chrome */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)] bg-[var(--surface-hover)]">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-red-400/80" />
            <span className="w-3 h-3 rounded-full bg-yellow-400/80" />
            <span className="w-3 h-3 rounded-full bg-emerald-400/80" />
          </div>
          <span className="text-[11px] font-mono uppercase tracking-widest text-[var(--foreground-faint)]">
            embed.html
          </span>
          <span className="text-[11px] text-[var(--foreground-faint)]">⌘C</span>
        </div>
        {/* Code body */}
        <pre className="bg-[#0a0a0f] text-slate-200 px-6 py-6 text-[13px] leading-relaxed overflow-x-auto whitespace-pre">
{`<script
  src="https://cdn.nexusai.example.com/`}<span className="text-fuchsia-300">widget.iife.js</span>{`"
  `}<span className="text-violet-300">data-widget-id</span>{`="`}<span className="text-emerald-300">wk_YOUR_ID</span>{`"
  `}<span className="text-violet-300">data-color</span>{`="`}<span className="text-emerald-300">#4f46e5</span>{`"
  `}<span className="text-violet-300">data-lang</span>{`="`}<span className="text-emerald-300">RU</span>{`"
  `}<span className="text-violet-300">defer</span>{`
></script>`}
        </pre>
      </div>
      <p className="text-center text-[13px] text-[var(--foreground-faint)] mt-4">
        {compatible}
      </p>
    </div>
  );
}
