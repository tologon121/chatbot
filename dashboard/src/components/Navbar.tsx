"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLanguage } from "./LanguageContext";

export default function Navbar() {
  const { lang, setLang, t, theme, toggleTheme } = useLanguage();
  const pathname = usePathname();

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname?.startsWith(href);

  return (
    <header className="fixed top-0 inset-x-0 z-50">
      <div className="absolute inset-0 backdrop-blur-xl bg-[var(--background)]/70 border-b border-[var(--border)]" />

      <nav className="relative max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="relative w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 via-violet-500 to-fuchsia-500 flex items-center justify-center shadow-[0_4px_12px_rgba(99,102,241,0.35)] group-hover:shadow-[0_4px_18px_rgba(99,102,241,0.5)] transition-shadow">
            <span className="text-white font-bold text-[13px] tracking-tighter">N</span>
            <div className="absolute inset-0 rounded-lg ring-1 ring-white/20" />
          </div>
          <span className="text-[15px] font-bold tracking-tight">
            Nexus<span className="text-gradient">AI</span>
          </span>
        </Link>

        {/* Center nav */}
        <div className="hidden md:flex items-center gap-1 absolute left-1/2 -translate-x-1/2">
          {[
            { href: "/features",                label: t.nav.features },
            { href: "/pricing",                 label: t.nav.pricing },
            { href: "/demo",                    label: t.nav.demo },
            { href: "/dashboard/integration",   label: t.nav.integration },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`text-[13px] font-medium px-3.5 py-2 rounded-lg transition-all ${
                isActive(item.href)
                  ? "text-[var(--foreground)] bg-[var(--surface-hover)]"
                  : "text-[var(--foreground-muted)] hover:text-[var(--foreground)] hover:bg-[var(--surface-hover)]"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </div>

        {/* Right side */}
        <div className="flex items-center gap-2">
          {/* Language picker */}
          <div className="hidden sm:flex items-center gap-0.5 p-0.5 bg-[var(--surface-hover)] rounded-lg border border-[var(--border)]">
            {(["EN", "RU", "KG"] as const).map((l) => (
              <button
                key={l}
                onClick={() => setLang(l)}
                className={`px-2 py-1 text-[11px] font-bold tracking-wider rounded-md transition-all ${
                  lang === l
                    ? "bg-[var(--surface)] text-[var(--foreground)] shadow-sm"
                    : "text-[var(--foreground-faint)] hover:text-[var(--foreground-muted)]"
                }`}
              >
                {l}
              </button>
            ))}
          </div>

          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            aria-label="Toggle theme"
            className="w-9 h-9 inline-flex items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--surface-hover)] text-[var(--foreground-muted)] hover:text-[var(--foreground)] transition-all"
          >
            {theme === "dark" ? (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m12.728 0l-.707-.707M6.343 6.343l-.707-.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>
            )}
          </button>

          <Link
            href="/login"
            className="hidden lg:inline-flex text-[13px] font-semibold px-3 py-2 rounded-lg text-[var(--foreground-muted)] hover:text-[var(--foreground)] transition-colors"
          >
            {t.nav.login}
          </Link>

          <Link
            href="/register"
            className="inline-flex items-center gap-1.5 text-[13px] font-semibold px-4 py-2 rounded-lg text-white bg-gradient-to-br from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 shadow-[0_4px_12px_rgba(99,102,241,0.35)] hover:shadow-[0_6px_18px_rgba(99,102,241,0.5)] transition-all"
          >
            {t.nav.getStarted}
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
          </Link>
        </div>
      </nav>
    </header>
  );
}
