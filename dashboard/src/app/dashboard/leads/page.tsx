"use client";

import { useEffect, useMemo, useState } from "react";
import { useWidget } from "@/components/WidgetContext";
import { API_BASE, Lead, listLeads } from "@/lib/api";

export default function LeadsPage() {
  const { current } = useWidget();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  const fetchLeads = async () => {
    if (!current) {
      setLeads([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await listLeads(current.id);
      setLeads(data);
    } catch (e: any) {
      setError(e.message || "Ошибка загрузки");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, [current?.id]);

  const filtered = useMemo(() => {
    if (!query) return leads;
    const q = query.toLowerCase();
    return leads.filter(
      (l) =>
        (l.name || "").toLowerCase().includes(q) ||
        (l.email || "").toLowerCase().includes(q) ||
        (l.phone || "").toLowerCase().includes(q),
    );
  }, [leads, query]);

  const exportCsv = () => {
    const header = ["id", "name", "email", "phone", "context", "createdAt"].join(",");
    const rows = filtered.map((l) =>
      [
        l.id,
        csvEscape(l.name),
        csvEscape(l.email),
        csvEscape(l.phone),
        csvEscape(l.context),
        l.createdAt,
      ].join(","),
    );
    const csv = [header, ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `leads-${current?.id}-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Удалить лид без возможности восстановления?")) return;
    try {
      const res = await fetch(`${API_BASE}/api/v1/leads/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setLeads((prev) => prev.filter((l) => l.id !== id));
    } catch (e: any) {
      alert(e.message || "Не удалось удалить лид");
    }
  };

  return (
    <div className="fade-in-up pb-10">
      <header className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Лиды</h2>
          <p className="text-[var(--foreground)]/60 mt-2 text-sm">
            Все контакты, захваченные виджетом.{" "}
            {current && <span className="font-mono text-xs">{current.id}</span>}
          </p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Поиск по имени / email / телефону…"
            className="flex-1 sm:w-72 px-4 py-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-sm outline-none focus:border-indigo-500"
          />
          <button
            onClick={exportCsv}
            disabled={filtered.length === 0}
            className="px-4 py-2 rounded-lg bg-[var(--foreground)] text-[var(--background)] text-sm font-semibold hover:opacity-90 disabled:opacity-40 cursor-pointer border-none whitespace-nowrap"
          >
            📥 CSV
          </button>
        </div>
      </header>

      {error && (
        <div className="mb-6 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-600 dark:text-red-400">
          ⚠️ {error}
        </div>
      )}

      <div className="glass-panel rounded-2xl border border-[var(--border)] overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-sm text-[var(--foreground-faint)] flex flex-col items-center gap-3">
            <span className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            Загрузка лидов…
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center text-sm text-[var(--foreground-faint)]">
            {leads.length === 0
              ? "Пока ни одного лида. Включите Lead Mode в настройках виджета."
              : "По запросу ничего не найдено."}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="bg-[var(--surface-hover)] border-b border-[var(--border)] text-[var(--foreground)]/60 text-xs font-bold uppercase tracking-wider">
                  <th className="p-4">Имя</th>
                  <th className="p-4">Email</th>
                  <th className="p-4">Телефон</th>
                  <th className="p-4">Контекст</th>
                  <th className="p-4">Дата</th>
                  <th className="p-4 text-right">Действия</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {filtered.map((l) => (
                  <tr key={l.id} className="hover:bg-[var(--surface-hover)]/30">
                    <td className="p-4 font-semibold">{l.name || "—"}</td>
                    <td className="p-4">
                      {l.email ? (
                        <a
                          href={`mailto:${l.email}`}
                          className="text-indigo-600 dark:text-indigo-400 hover:underline"
                        >
                          {l.email}
                        </a>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="p-4">
                      {l.phone ? (
                        <a
                          href={`tel:${l.phone}`}
                          className="text-indigo-600 dark:text-indigo-400 hover:underline"
                        >
                          {l.phone}
                        </a>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td
                      className="p-4 max-w-[280px] truncate text-[var(--foreground)]/70"
                      title={l.context || ""}
                    >
                      {l.context || "—"}
                    </td>
                    <td className="p-4 text-xs text-[var(--foreground)]/60 whitespace-nowrap">
                      {new Date(l.createdAt).toLocaleString("ru-RU", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                    <td className="p-4 text-right">
                      <button
                        onClick={() => handleDelete(l.id)}
                        className="p-2 text-[var(--foreground)]/40 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all cursor-pointer border-none bg-transparent"
                        title="Удалить лид"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <p className="mt-4 text-xs text-[var(--foreground-faint)]">
        Всего: {filtered.length} {filtered.length !== leads.length && `(из ${leads.length})`}
      </p>
    </div>
  );
}

function csvEscape(s: string | null | undefined): string {
  if (s == null) return "";
  const needsQuote = /[",\n]/.test(s);
  const escaped = s.replace(/"/g, '""');
  return needsQuote ? `"${escaped}"` : escaped;
}
