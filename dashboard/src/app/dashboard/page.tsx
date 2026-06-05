"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useLanguage } from "@/components/LanguageContext";
import { useWidget } from "@/components/WidgetContext";
import { AnalyticsOverview, getAnalytics } from "@/lib/api";

export default function DashboardOverview() {
  const { t } = useLanguage();
  const { current } = useWidget();
  const [data, setData] = useState<AnalyticsOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!current) {
      setData(null);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    getAnalytics(current.id)
      .then((d) => {
        if (!cancelled) setData(d);
      })
      .catch((e) => {
        if (!cancelled) setError(e.message || "Не удалось загрузить аналитику");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [current?.id]);

  const days: string[] = t.dashboard.days;
  const maxBar = Math.max(1, ...(data?.chart_7d?.map((d) => d.count) ?? [1]));

  return (
    <div className="fade-in-up pb-10">
      <header className="mb-10">
        <h2 className="text-3xl font-bold tracking-tight">{t.dashboard.title}</h2>
        <p className="text-[var(--foreground)]/60 mt-2 text-sm">{t.dashboard.desc}</p>
        {current && (
          <div className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[var(--surface-hover)] border border-[var(--border)] text-xs">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[var(--foreground-muted)]">Виджет:</span>
            <span className="font-mono font-semibold">{current.id}</span>
          </div>
        )}
      </header>

      {error && (
        <div className="mb-6 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-600 dark:text-red-400">
          ⚠️ {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <StatCard
          title={t.dashboard.totalConversations}
          value={loading ? "—" : (data?.totals.conversations ?? 0).toLocaleString()}
          loading={loading}
        />
        <StatCard
          title={t.dashboard.leadsCaptured}
          value={loading ? "—" : (data?.totals.leads ?? 0).toLocaleString()}
          loading={loading}
        />
        <StatCard
          title={t.dashboard.avgResolution}
          value={loading ? "—" : formatSeconds(data?.totals.avg_resolution_sec ?? 0)}
          loading={loading}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Chart */}
        <div className="lg:col-span-2 glass-panel p-8 rounded-2xl">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-lg font-semibold">{t.dashboard.interactionVolume}</h3>
            <span className="text-xs text-[var(--foreground-faint)]">
              {t.dashboard.last7Days}
            </span>
          </div>
          {loading ? (
            <div className="h-64 flex items-center justify-center text-sm text-[var(--foreground-faint)]">
              <span className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mr-2" />
              Загрузка графика…
            </div>
          ) : data && data.chart_7d.length > 0 ? (
            <>
              <div className="h-64 flex items-end justify-between gap-2">
                {data.chart_7d.map((d, i) => {
                  const h = (d.count / maxBar) * 100;
                  return (
                    <div
                      key={i}
                      className="w-full bg-indigo-500/20 rounded-t-lg relative group cursor-pointer hover:bg-indigo-500/40 transition-colors"
                      style={{ height: `${Math.max(2, h)}%` }}
                    >
                      <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-[var(--foreground)] text-[var(--background)] text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                        {d.count} {t.dashboard.chats}
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="flex justify-between mt-4 text-xs font-medium text-[var(--foreground)]/40">
                {data.chart_7d.map((d, i) => (
                  <span key={d.date}>{days[i] || d.weekday}</span>
                ))}
              </div>
            </>
          ) : (
            <div className="h-64 flex items-center justify-center text-sm text-[var(--foreground-faint)]">
              Пока нет данных — попробуйте /demo, чтобы создать первый диалог.
            </div>
          )}
        </div>

        {/* Recent leads */}
        <div className="glass-panel p-8 rounded-2xl flex flex-col">
          <h3 className="text-lg font-semibold mb-6">{t.dashboard.recentLeads}</h3>
          <div className="flex-1 space-y-4">
            {loading ? (
              <div className="text-sm text-[var(--foreground-faint)] flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                Загрузка лидов…
              </div>
            ) : data && data.recent_leads.length > 0 ? (
              data.recent_leads.map((lead) => (
                <div
                  key={lead.id}
                  className="flex items-center justify-between p-3 rounded-xl hover:bg-[var(--surface-hover)] transition-colors border border-transparent hover:border-[var(--border)]"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">
                      {lead.email || lead.name || lead.phone || "Без контакта"}
                    </p>
                    <p className="text-xs text-[var(--foreground)]/50">
                      {formatRelativeTime(lead.createdAt)}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-[var(--foreground-faint)]">
                Пока нет ни одного захваченного лида.
              </p>
            )}
          </div>
          <Link
            href="/dashboard/leads"
            className="block w-full mt-4 py-2 text-center text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 transition-colors"
          >
            {t.dashboard.viewAllLeads}
          </Link>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  title,
  value,
  loading,
}: {
  title: string;
  value: string;
  loading: boolean;
}) {
  return (
    <div className="glass-panel p-6 rounded-2xl hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border-l-4 border-l-indigo-500">
      <h3 className="text-sm font-medium text-[var(--foreground)]/60 mb-2">{title}</h3>
      <div className="flex items-end justify-between">
        <span className={`text-4xl font-extrabold tracking-tight ${loading ? "opacity-30" : ""}`}>
          {value}
        </span>
      </div>
    </div>
  );
}

function formatSeconds(s: number): string {
  if (!s) return "—";
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}m ${sec}s`;
}

function formatRelativeTime(iso: string): string {
  const now = Date.now();
  const then = new Date(iso).getTime();
  const diff = Math.floor((now - then) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)} min ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} hr ago`;
  return `${Math.floor(diff / 86400)} d ago`;
}
