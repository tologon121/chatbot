"use client";

import { useLanguage } from "@/components/LanguageContext";

export default function DashboardOverview() {
  const { t } = useLanguage();

  const days: string[] = t.dashboard.days;

  return (
    <div className="fade-in-up pb-10">
      <header className="mb-10">
        <h2 className="text-3xl font-bold tracking-tight">{t.dashboard.title}</h2>
        <p className="text-[var(--foreground)]/60 mt-2 text-sm">{t.dashboard.desc}</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <StatCard title={t.dashboard.totalConversations} value="1,248" trend="+12.5%" />
        <StatCard title={t.dashboard.leadsCaptured}      value="384"   trend="+24.2%" />
        <StatCard title={t.dashboard.avgResolution}      value="1m 14s" trend="-8.1%" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Chart */}
        <div className="lg:col-span-2 glass-panel p-8 rounded-2xl">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-lg font-semibold">{t.dashboard.interactionVolume}</h3>
            <select className="bg-[var(--surface-hover)] border-none text-sm rounded-lg px-3 py-1.5 outline-none cursor-pointer">
              <option>{t.dashboard.last7Days}</option>
              <option>{t.dashboard.last30Days}</option>
            </select>
          </div>
          <div className="h-64 flex items-end justify-between gap-2">
            {[40, 65, 45, 80, 55, 90, 75].map((h, i) => (
              <div
                key={i}
                className="w-full bg-indigo-500/20 rounded-t-lg relative group cursor-pointer hover:bg-indigo-500/40 transition-colors"
                style={{ height: `${h}%` }}
              >
                <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-[var(--foreground)] text-[var(--background)] text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                  {h * 12} {t.dashboard.chats}
                </div>
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-4 text-xs font-medium text-[var(--foreground)]/40">
            {days.map((d) => (
              <span key={d}>{d}</span>
            ))}
          </div>
        </div>

        {/* Recent leads */}
        <div className="glass-panel p-8 rounded-2xl flex flex-col">
          <h3 className="text-lg font-semibold mb-6">{t.dashboard.recentLeads}</h3>
          <div className="flex-1 space-y-4">
            {[
              { email: "sarah@example.com",   time: "10 min",  status: "hot"  },
              { email: "m.johnson@tech.co",    time: "1 hr",    status: "warm" },
              { email: "info@startup.io",      time: "3 hrs",   status: "hot"  },
              { email: "alex@design.studio",   time: "5 hrs",   status: "cold" },
            ].map((lead, i) => {
              const statusLabel =
                lead.status === "hot"
                  ? t.dashboard.hot
                  : lead.status === "warm"
                    ? t.dashboard.warm
                    : t.dashboard.cold;

              const statusStyle =
                lead.status === "hot"
                  ? "bg-orange-500/10 text-orange-600 dark:text-orange-400"
                  : lead.status === "warm"
                    ? "bg-blue-500/10 text-blue-600 dark:text-blue-400"
                    : "bg-zinc-500/10 text-zinc-600 dark:text-zinc-400";

              return (
                <div
                  key={i}
                  className="flex items-center justify-between p-3 rounded-xl hover:bg-[var(--surface-hover)] transition-colors border border-transparent hover:border-[var(--border)] cursor-pointer"
                >
                  <div>
                    <p className="text-sm font-medium">{lead.email}</p>
                    <p className="text-xs text-[var(--foreground)]/50">{lead.time}</p>
                  </div>
                  <span
                    className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full ${statusStyle}`}
                  >
                    {statusLabel}
                  </span>
                </div>
              );
            })}
          </div>
          <button className="w-full mt-4 py-2 text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 transition-colors">
            {t.dashboard.viewAllLeads}
          </button>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  title,
  value,
  trend,
}: {
  title: string;
  value: string;
  trend: string;
}) {
  const isPositive = trend.startsWith("+");
  return (
    <div className="glass-panel p-6 rounded-2xl hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border-l-4 border-l-indigo-500">
      <h3 className="text-sm font-medium text-[var(--foreground)]/60 mb-2">{title}</h3>
      <div className="flex items-end justify-between">
        <span className="text-4xl font-extrabold tracking-tight">{value}</span>
        <span
          className={`text-sm font-medium px-2 py-1 rounded-md ${
            isPositive
              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
              : "bg-red-500/10 text-red-600 dark:text-red-400"
          }`}
        >
          {trend}
        </span>
      </div>
    </div>
  );
}
