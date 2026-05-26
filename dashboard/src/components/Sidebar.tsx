"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLanguage } from "@/components/LanguageContext";

export default function Sidebar() {
  const { lang, setLang, t, theme, toggleTheme } = useLanguage();
  const pathname = usePathname();

  const isActive = (href: string) =>
    href === "/dashboard"
      ? pathname === "/dashboard"
      : pathname?.startsWith(href);

  return (
    <aside className="w-64 shrink-0 h-screen bg-[var(--surface)] border-r border-[var(--border)] flex flex-col">
      {/* Logo */}
      <div className="px-6 h-16 flex items-center border-b border-[var(--border)]">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="relative w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 via-violet-500 to-fuchsia-500 flex items-center justify-center shadow-[0_4px_12px_rgba(99,102,241,0.35)]">
            <span className="text-white font-bold text-[13px]">N</span>
            <div className="absolute inset-0 rounded-lg ring-1 ring-white/20" />
          </div>
          <span className="text-[15px] font-bold tracking-tight">
            Nexus<span className="text-gradient">AI</span>
          </span>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto">
        <p className="px-3 mb-2 text-[10px] font-bold tracking-widest uppercase text-[var(--foreground-faint)]">
          Workspace
        </p>
        <div className="space-y-0.5">
          <NavItem
            href="/dashboard"
            label={t.sidebar.overview}
            active={isActive("/dashboard") && pathname === "/dashboard"}
            icon="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
          />
          <NavItem
            href="/dashboard/knowledge-base"
            label={t.sidebar.knowledgeBase}
            active={!!isActive("/dashboard/knowledge-base")}
            icon="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
          />
          <NavItem
            href="/dashboard/widget-settings"
            label={t.sidebar.widgetSettings}
            active={!!isActive("/dashboard/widget-settings")}
            icon="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065zM15 12a3 3 0 11-6 0 3 3 0 016 0z"
          />
          <NavItem
            href="/dashboard/integration"
            label={t.sidebar.integration || "Integration"}
            active={!!isActive("/dashboard/integration")}
            icon="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"
          />
          <NavItem
            href="/dashboard/analytics"
            label={t.sidebar.analytics}
            active={!!isActive("/dashboard/analytics")}
            icon="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
          />
        </div>
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-[var(--border)] space-y-2">
        {/* Lang switcher */}
        <div className="flex items-center gap-0.5 p-0.5 bg-[var(--surface-hover)] rounded-lg border border-[var(--border)]">
          {(["EN", "RU", "KG"] as const).map((l) => (
            <button
              key={l}
              onClick={() => setLang(l)}
              className={`flex-1 px-2 py-1 text-[11px] font-bold tracking-wider rounded-md transition-all ${
                lang === l
                  ? "bg-[var(--surface)] text-[var(--foreground)] shadow-sm"
                  : "text-[var(--foreground-faint)] hover:text-[var(--foreground-muted)]"
              }`}
            >
              {l}
            </button>
          ))}
        </div>

        {/* Theme */}
        <button
          onClick={toggleTheme}
          className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 text-[13px] font-semibold rounded-lg border border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--surface-hover)] text-[var(--foreground-muted)] hover:text-[var(--foreground)] transition-all"
        >
          {theme === "dark" ? (
            <>
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m12.728 0l-.707-.707M6.343 6.343l-.707-.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
              Light
            </>
          ) : (
            <>
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>
              Dark
            </>
          )}
        </button>

        {/* Sign out */}
        <button className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 text-[13px] font-semibold rounded-lg text-[var(--foreground-muted)] hover:text-red-500 hover:bg-red-500/5 transition-all">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
          {t.sidebar.signOut}
        </button>
      </div>
    </aside>
  );
}

function NavItem({
  href, label, icon, active,
}: { href: string; label: string; icon: string; active: boolean }) {
  return (
    <Link
      href={href}
      className={`relative flex items-center gap-3 px-3 py-2 text-[13px] font-medium rounded-lg transition-all ${
        active
          ? "bg-[var(--surface-hover)] text-[var(--foreground)]"
          : "text-[var(--foreground-muted)] hover:text-[var(--foreground)] hover:bg-[var(--surface-hover)]"
      }`}
    >
      {active && (
        <span className="absolute left-0 top-1.5 bottom-1.5 w-0.5 rounded-full bg-gradient-to-b from-indigo-500 to-violet-600" />
      )}
      <svg className={`w-4 h-4 shrink-0 ${active ? "text-indigo-500" : "opacity-70"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d={icon} />
      </svg>
      {label}
    </Link>
  );
}
