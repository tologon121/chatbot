"use client";

import Navbar from "@/components/Navbar";
import { useLanguage } from "@/components/LanguageContext";
import { useState, useRef, useEffect, useCallback } from "react";

type Message = {
  text: string;
  isBot: boolean;
  time: Date;
  isError?: boolean;
};

export default function DemoPage() {
  const { t, lang } = useLanguage();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isFetching, setIsFetching] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const endOfMessagesRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const isBusy = isFetching || isStreaming;

  // Update greeting when language changes (only while no user messages exist)
  useEffect(() => {
    setMessages((prev) => {
      const hasUserMsg = prev.some((m) => !m.isBot);
      if (!hasUserMsg) {
        return [{ text: t.demoPage.greeting, isBot: true, time: new Date() }];
      }
      return prev;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lang]);

  useEffect(() => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isFetching]);

  const typewriterEffect = useCallback(
    (text: string): Promise<void> =>
      new Promise((resolve) => {
        const now = new Date();
        let i = 0;
        // Add empty bot message to fill in
        setMessages((prev) => [...prev, { text: "", isBot: true, time: now }]);
        const speed = text.length > 300 ? 6 : text.length > 100 ? 12 : 18;
        const interval = setInterval(() => {
          i++;
          setMessages((prev) => {
            const updated = [...prev];
            const last = updated[updated.length - 1];
            if (last?.isBot) {
              updated[updated.length - 1] = {
                ...last,
                text: text.slice(0, i),
              };
            }
            return updated;
          });
          if (i >= text.length) {
            clearInterval(interval);
            resolve();
          }
        }, speed);
      }),
    [],
  );

  const handleSend = useCallback(
    async (override?: string) => {
      const userText = (override ?? input).trim();
      if (!userText || isBusy) return;

      setMessages((prev) => [
        ...prev,
        { text: userText, isBot: false, time: new Date() },
      ]);
      setInput("");
      setIsFetching(true);

      try {
        const demoWidgetId =
          process.env.NEXT_PUBLIC_DEMO_WIDGET_ID || "wk_demo";
        const sessionId =
          (typeof window !== "undefined" &&
            window.sessionStorage.getItem("demo_session_id")) ||
          crypto.randomUUID();
        if (typeof window !== "undefined") {
          window.sessionStorage.setItem("demo_session_id", sessionId);
        }

        const response = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: [{ role: "user", content: userText }],
            lang,
            widgetId: demoWidgetId,
            sessionId,
          }),
        });

        const data = await response.json();

        if (!response.ok || data.error) {
          throw new Error(data.error || `HTTP ${response.status}`);
        }

        if (data.text) {
          setIsFetching(false);
          setIsStreaming(true);
          await typewriterEffect(data.text);
          setIsStreaming(false);
        }
      } catch (err) {
        console.error("Chat Error:", err);
        setIsFetching(false);
        setIsStreaming(false);
        setMessages((prev) => [
          ...prev,
          {
            text: t.demoPage.errorMsg,
            isBot: true,
            time: new Date(),
            isError: true,
          },
        ]);
      }
    },
    [input, isBusy, lang, t.demoPage.errorMsg, typewriterEffect],
  );

  const clearChat = () => {
    setMessages([{ text: t.demoPage.greeting, isBot: true, time: new Date() }]);
    setIsFetching(false);
    setIsStreaming(false);
    setInput("");
    inputRef.current?.focus();
  };

  const formatTime = (date: Date) =>
    date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  return (
    <div className="min-h-screen bg-[var(--background)] overflow-hidden">
      <Navbar />

      <main className="relative pt-32 lg:pt-40 pb-20 px-6 max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-16">
        <div className="mesh-bg" />

        {/* ── Left panel ── */}
        <div className="flex-1 text-center lg:text-left fade-in-up">
          {/* Live badge */}
          <div className="chip mb-5">
            <span className="relative flex h-2 w-2">
              <span className="absolute inset-0 rounded-full bg-emerald-500 opacity-75 animate-ping" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            {t.demoPage.liveDemo}
          </div>

          <h1 className="text-4xl lg:text-6xl font-bold tracking-tight mb-5 leading-[1.05]">
            <span className="text-gradient-subtle">{t.demoPage.title}</span>
          </h1>
          <p className="text-[15px] md:text-lg text-[var(--foreground-muted)] mb-8 max-w-xl mx-auto lg:mx-0 leading-relaxed">
            {t.demoPage.desc}
          </p>

          {/* Status card */}
          <div className="card-premium p-5 inline-flex items-center gap-4 mb-8">
            <div className="relative w-10 h-10 rounded-full bg-emerald-500/15 flex items-center justify-center shrink-0">
              <span
                className="w-2.5 h-2.5 bg-emerald-500 rounded-full"
                style={{ animation: "pulse-ring 2s infinite" }}
              />
            </div>
            <div className="text-left">
              <p className="font-semibold text-sm">{t.demoPage.systemStatus}</p>
              <p className="text-[var(--foreground-muted)] text-xs">
                {t.demoPage.aiCoreReady}
              </p>
            </div>
          </div>

          {/* Quick suggestions */}
          <div>
            <p className="text-[11px] font-bold text-[var(--foreground-faint)] uppercase tracking-widest mb-3">
              {t.demoPage.tryAsking}
            </p>
            <div className="flex flex-wrap gap-2 justify-center lg:justify-start">
              {(t.demoPage.suggestions as string[]).map((s: string, i: number) => (
                <button
                  key={i}
                  onClick={() => handleSend(s)}
                  disabled={isBusy}
                  className="text-[12px] px-3.5 py-2 rounded-full border border-[var(--border)] bg-[var(--surface)] hover:border-indigo-500/50 hover:bg-indigo-500/5 text-[var(--foreground-muted)] hover:text-[var(--foreground)] transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ── Chat window ── */}
        <div className="flex-1 w-full max-w-md fade-in-up delay-100">
          <div className="bg-[var(--surface)] rounded-3xl shadow-2xl overflow-hidden flex flex-col border border-[var(--border)] h-[620px] relative">
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.03] dark:opacity-10 pointer-events-none" />

            {/* Header */}
            <div className="h-20 flex items-center px-6 relative overflow-hidden bg-indigo-600 shrink-0">
              <div className="absolute inset-0 bg-white/10 backdrop-blur-md" />
              <div className="w-10 h-10 rounded-full bg-white mr-4 shadow-md z-10 flex items-center justify-center shrink-0">
                <span className="text-[11px] font-bold text-indigo-600">AI</span>
              </div>
              <div className="text-white z-10 flex-1 min-w-0">
                <p className="text-sm font-bold tracking-wide">Nexus Assistant</p>
                <p className="text-[11px] opacity-90 mt-0.5 flex items-center font-medium">
                  <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full mr-1.5 shadow-[0_0_8px_rgba(52,211,153,0.8)] animate-pulse" />
                  {t.demoPage.online}
                </p>
              </div>
              {/* Clear button */}
              <button
                onClick={clearChat}
                className="z-10 text-white/60 hover:text-white/90 transition-colors text-[11px] font-semibold shrink-0 px-2 py-1 rounded hover:bg-white/10"
                title={t.demoPage.clearChat}
              >
                {t.demoPage.clearChat}
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 p-4 flex flex-col gap-2 overflow-y-auto bg-[var(--background)]/50 z-10">
              {messages.map((m, i) => (
                <div
                  key={i}
                  className={`flex flex-col gap-0.5 ${m.isBot ? "items-start" : "items-end"}`}
                >
                  <div
                    className={`max-w-[85%] px-4 py-3 text-[13.5px] leading-relaxed shadow-sm ${
                      m.isBot
                        ? m.isError
                          ? "bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl rounded-tl-sm text-red-600 dark:text-red-400"
                          : "bg-[var(--surface)] border border-[var(--border)] rounded-2xl rounded-tl-sm text-[var(--foreground)]"
                        : "bg-indigo-600 text-white rounded-2xl rounded-tr-sm shadow-md"
                    }`}
                  >
                    {m.text || (
                      // Empty bot message during typewriter start — show cursor blink
                      <span className="inline-block w-0.5 h-3.5 bg-indigo-500 animate-pulse ml-0.5" />
                    )}
                  </div>
                  <span className="text-[10px] text-[var(--foreground-faint)] px-1">
                    {formatTime(m.time)}
                  </span>
                </div>
              ))}

              {/* Typing dots — shown only during API fetch */}
              {isFetching && (
                <div className="flex flex-col items-start gap-0.5">
                  <div className="bg-[var(--surface)] border border-[var(--border)] px-4 py-3 rounded-2xl rounded-tl-sm flex gap-1.5 items-center">
                    <span
                      className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce"
                      style={{ animationDelay: "0ms" }}
                    />
                    <span
                      className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce"
                      style={{ animationDelay: "150ms" }}
                    />
                    <span
                      className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce"
                      style={{ animationDelay: "300ms" }}
                    />
                  </div>
                </div>
              )}

              <div ref={endOfMessagesRef} />
            </div>

            {/* Input */}
            <div className="p-4 bg-[var(--surface)] border-t border-[var(--border)] z-10 shrink-0">
              <div className="bg-[var(--surface-hover)] border border-[var(--border)] rounded-xl flex items-center px-4 py-3 focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-500 transition-all shadow-sm">
                <input
                  ref={inputRef}
                  type="text"
                  placeholder={t.demoPage.chatPlaceholder}
                  className="flex-1 bg-transparent text-[14px] outline-none placeholder-[var(--foreground)]/40 font-medium disabled:opacity-60"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) =>
                    e.key === "Enter" && !isBusy && handleSend()
                  }
                  disabled={isBusy}
                  maxLength={500}
                />
                {input.length > 400 && (
                  <span
                    className={`text-[10px] mr-2 tabular-nums ${
                      input.length >= 500
                        ? "text-red-500"
                        : "text-[var(--foreground-faint)]"
                    }`}
                  >
                    {input.length}/500
                  </span>
                )}
                <button
                  onClick={() => handleSend()}
                  disabled={!input.trim() || isBusy}
                  className="w-9 h-9 rounded-lg flex items-center justify-center transition-all duration-200 bg-indigo-600 hover:bg-indigo-500 text-white disabled:opacity-40 disabled:cursor-not-allowed hover:scale-105 disabled:hover:scale-100 shadow-md ml-2"
                >
                  {isBusy ? (
                    <svg
                      className="w-4 h-4 animate-spin"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                      />
                    </svg>
                  ) : (
                    <svg
                      className="w-4 h-4 ml-0.5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2.5}
                        d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                      />
                    </svg>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
