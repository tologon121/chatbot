"use client";

import { useEffect, useState } from "react";
import { useLanguage } from "@/components/LanguageContext";
import { useWidget } from "@/components/WidgetContext";
import { AnalyticsOverview, getAnalytics } from "@/lib/api";

export default function AnalyticsPage() {
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
      .then((d) => !cancelled && setData(d))
      .catch((e) => !cancelled && setError(e.message))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [current?.id]);

  const exportReport = () => {
    if (!data) return;
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `nexus-analytics-${data.widget_id}-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fade-in-up pb-10">
      <header className="mb-10 flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">{t.analytics.title}</h2>
          <p className="text-[var(--foreground)]/60 mt-2 text-sm">{t.analytics.desc}</p>
        </div>
        <button
          onClick={exportReport}
          disabled={!data}
          className="px-4 py-2 bg-[var(--foreground)] text-[var(--background)] rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 cursor-pointer border-none"
        >
          {t.analytics.exportReport}
        </button>
      </header>

      {error && (
        <div className="mb-6 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-600 dark:text-red-400">
          ⚠️ {error}
        </div>
      )}

      {loading ? (
        <SkeletonGrid />
      ) : !data || data.totals.messages === 0 ? (
        <div className="glass-panel p-12 rounded-2xl text-center">
          <div className="text-4xl mb-4">📊</div>
          <h3 className="text-lg font-semibold mb-2">Пока нет данных для анализа</h3>
          <p className="text-sm text-[var(--foreground-muted)] max-w-md mx-auto">
            Дайте пользователям пообщаться с виджетом, и здесь появится статистика
            по настроениям, языкам и темам.
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            {/* Sentiment */}
            <div className="glass-panel p-8 rounded-2xl">
              <h3 className="text-lg font-semibold mb-2">{t.analytics.sentiment}</h3>
              <p className="text-[11px] text-[var(--foreground-faint)] mb-6 uppercase tracking-wider">
                Выборка: {data.sentiment.sample_size} ответов AI
              </p>
              <div className="space-y-6">
                {[
                  { label: t.analytics.positive, pct: data.sentiment.positive_pct, color: "bg-emerald-500", text: "text-emerald-500" },
                  { label: t.analytics.neutral, pct: data.sentiment.neutral_pct, color: "bg-blue-500", text: "text-blue-500" },
                  { label: t.analytics.negative, pct: data.sentiment.negative_pct, color: "bg-red-500", text: "text-red-500" },
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

            {/* Top intents */}
            <div className="glass-panel p-8 rounded-2xl">
              <h3 className="text-lg font-semibold mb-6">{t.analytics.intents}</h3>
              {data.top_intents.length === 0 ? (
                <p className="text-sm text-[var(--foreground-faint)]">
                  Намерения пока не определены.
                </p>
              ) : (
                <ul className="space-y-4">
                  {data.top_intents.map((intent, i) => {
                    const accents = [
                      "bg-indigo-500/20 text-indigo-500",
                      "bg-purple-500/20 text-purple-500",
                      "bg-pink-500/20 text-pink-500",
                      "bg-amber-500/20 text-amber-500",
                      "bg-cyan-500/20 text-cyan-500",
                    ];
                    return (
                      <li
                        key={intent.label}
                        className="flex items-center justify-between p-3 rounded-xl bg-[var(--surface-hover)]"
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-8 h-8 rounded-full ${accents[i % accents.length]} flex items-center justify-center text-xs font-bold`}
                          >
                            {i + 1}
                          </div>
                          <span className="font-medium text-sm">{intent.label}</span>
                        </div>
                        <span className="font-bold">{intent.count}</span>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>

          {/* Language distribution */}
          <div className="glass-panel p-8 rounded-2xl">
            <h3 className="text-lg font-semibold mb-6">{t.analytics.languages}</h3>
            <div className="flex h-12 w-full rounded-xl overflow-hidden shadow-inner mb-6">
              {data.languages.map((l) => {
                const bg = l.code === "RU"
                  ? "bg-indigo-500"
                  : l.code === "EN"
                    ? "bg-purple-500"
                    : "bg-pink-500";
                return l.pct > 0 ? (
                  <div
                    key={l.code}
                    className={`${bg} h-full flex items-center justify-center text-xs font-bold text-white`}
                    style={{ width: `${l.pct}%` }}
                  >
                    {l.code} ({l.pct}%)
                  </div>
                ) : null;
              })}
            </div>
            <p className="text-sm text-[var(--foreground)]/60 text-center">
              {t.analytics.multiLangNote}
            </p>
          </div>
        </>
      )}
    </div>
  );
}

function SkeletonGrid() {
  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        {[0, 1].map((i) => (
          <div key={i} className="glass-panel p-8 rounded-2xl">
            <div className="h-5 w-32 bg-[var(--surface-hover)] rounded mb-6 animate-pulse" />
            <div className="space-y-4">
              {[0, 1, 2].map((j) => (
                <div key={j} className="h-3 w-full bg-[var(--surface-hover)] rounded animate-pulse" />
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="glass-panel p-8 rounded-2xl">
        <div className="h-5 w-40 bg-[var(--surface-hover)] rounded mb-6 animate-pulse" />
        <div className="h-12 w-full bg-[var(--surface-hover)] rounded-xl animate-pulse" />
      </div>
    </>
  );
}
