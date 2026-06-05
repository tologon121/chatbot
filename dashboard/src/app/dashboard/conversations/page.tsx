"use client";

import { useEffect, useState } from "react";
import { useWidget } from "@/components/WidgetContext";
import {
  ChatSessionRow,
  MessageRow,
  listMessages,
  listSessions,
} from "@/lib/api";

export default function ConversationsPage() {
  const { current } = useWidget();
  const [sessions, setSessions] = useState<ChatSessionRow[]>([]);
  const [activeSession, setActiveSession] = useState<string | null>(null);
  const [messages, setMessages] = useState<MessageRow[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!current) return;
    setLoadingSessions(true);
    setError(null);
    listSessions(current.id)
      .then((s) => {
        setSessions(s);
        if (s.length > 0) setActiveSession(s[0].id);
        else setActiveSession(null);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoadingSessions(false));
  }, [current?.id]);

  useEffect(() => {
    if (!activeSession) {
      setMessages([]);
      return;
    }
    setLoadingMessages(true);
    listMessages(activeSession)
      .then(setMessages)
      .catch((e) => setError(e.message))
      .finally(() => setLoadingMessages(false));
  }, [activeSession]);

  return (
    <div className="fade-in-up pb-10">
      <header className="mb-8">
        <h2 className="text-3xl font-bold tracking-tight">Диалоги</h2>
        <p className="text-[var(--foreground)]/60 mt-2 text-sm">
          История переписки виджета с посетителями.
        </p>
      </header>

      {error && (
        <div className="mb-6 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-600 dark:text-red-400">
          ⚠️ {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6 h-[640px]">
        {/* Sessions list */}
        <aside className="glass-panel rounded-2xl border border-[var(--border)] flex flex-col overflow-hidden">
          <div className="px-4 py-3 border-b border-[var(--border)] text-xs font-bold uppercase tracking-widest text-[var(--foreground-faint)]">
            Сессии · {sessions.length}
          </div>
          <div className="flex-1 overflow-y-auto">
            {loadingSessions ? (
              <div className="p-6 text-sm text-[var(--foreground-faint)] flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                Загрузка…
              </div>
            ) : sessions.length === 0 ? (
              <div className="p-6 text-sm text-[var(--foreground-faint)]">
                Пока нет ни одной сессии. Откройте /demo и поговорите с ботом — она появится здесь.
              </div>
            ) : (
              <ul className="divide-y divide-[var(--border)]">
                {sessions.map((s) => (
                  <li key={s.id}>
                    <button
                      onClick={() => setActiveSession(s.id)}
                      className={`w-full text-left px-4 py-3 transition-colors cursor-pointer border-none bg-transparent ${
                        activeSession === s.id
                          ? "bg-indigo-500/10 border-l-2 border-l-indigo-500"
                          : "hover:bg-[var(--surface-hover)]"
                      }`}
                    >
                      <div className="flex justify-between items-baseline mb-1">
                        <span className="text-[11px] font-mono text-[var(--foreground-faint)]">
                          {s.id.slice(0, 8)}…
                        </span>
                        <span className="text-[10px] text-[var(--foreground-faint)]">
                          {new Date(s.createdAt).toLocaleDateString("ru-RU", {
                            day: "2-digit",
                            month: "2-digit",
                          })}
                        </span>
                      </div>
                      <p className="text-xs text-[var(--foreground)]/70 truncate">
                        {s.lastMessage || "(пусто)"}
                      </p>
                      <div className="text-[10px] mt-1 text-[var(--foreground-faint)]">
                        {s.messageCount ?? 0} сообщ.
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </aside>

        {/* Messages viewer */}
        <section className="glass-panel rounded-2xl border border-[var(--border)] flex flex-col overflow-hidden">
          <div className="px-6 py-4 border-b border-[var(--border)] flex justify-between items-center">
            <div>
              <h3 className="text-sm font-semibold">
                {activeSession ? `Session ${activeSession.slice(0, 8)}…` : "Выберите сессию"}
              </h3>
              {activeSession && (
                <p className="text-[11px] font-mono text-[var(--foreground-faint)] mt-0.5">
                  {activeSession}
                </p>
              )}
            </div>
            {messages.length > 0 && (
              <span className="text-[11px] text-[var(--foreground-faint)] uppercase tracking-wider">
                {messages.length} сообщений
              </span>
            )}
          </div>

          <div className="flex-1 p-6 overflow-y-auto flex flex-col gap-3 bg-[var(--background)]/40">
            {loadingMessages ? (
              <div className="text-sm text-[var(--foreground-faint)] flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                Загрузка сообщений…
              </div>
            ) : !activeSession ? (
              <div className="flex-1 flex items-center justify-center text-sm text-[var(--foreground-faint)]">
                Выберите сессию слева, чтобы увидеть переписку.
              </div>
            ) : messages.length === 0 ? (
              <div className="flex-1 flex items-center justify-center text-sm text-[var(--foreground-faint)]">
                В этой сессии пока нет сообщений.
              </div>
            ) : (
              messages.map((m) => (
                <div
                  key={m.id}
                  className={`flex flex-col gap-1 ${m.role === "USER" ? "items-end" : "items-start"}`}
                >
                  <div className="text-[10px] text-[var(--foreground-faint)] uppercase tracking-wider px-2">
                    {m.role} · {new Date(m.createdAt).toLocaleString("ru-RU")}
                  </div>
                  <div
                    className={`max-w-[80%] px-4 py-2.5 text-sm rounded-2xl shadow-sm ${
                      m.role === "USER"
                        ? "bg-indigo-600 text-white rounded-tr-sm"
                        : m.role === "AI"
                          ? "bg-[var(--surface)] border border-[var(--border)] rounded-tl-sm"
                          : "bg-amber-500/10 text-amber-700 dark:text-amber-300 italic"
                    }`}
                  >
                    {m.content}
                  </div>
                  {m.role === "AI" && m.sentiment !== null && (
                    <div className="text-[10px] text-[var(--foreground-faint)] px-2 flex items-center gap-1">
                      sentiment:{" "}
                      <span
                        className={
                          m.sentiment > 0.2
                            ? "text-emerald-500"
                            : m.sentiment < -0.2
                              ? "text-red-500"
                              : ""
                        }
                      >
                        {m.sentiment.toFixed(2)}
                      </span>
                      {m.needsAttention && (
                        <span className="ml-2 px-1.5 py-0.5 rounded bg-red-500/10 text-red-500 font-bold">
                          ATTENTION
                        </span>
                      )}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
