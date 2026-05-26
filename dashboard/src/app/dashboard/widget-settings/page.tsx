"use client";

import { useState } from "react";
import { useLanguage } from "@/components/LanguageContext";

// Preview messages in each language — independent of the UI language
const PREVIEW_MSGS: Record<string, { msg1: string; msg2: string; msg3: string }> = {
  KG: {
    msg1: "Саламатсызбы! Биздин сайтка кош келиңиз. Сизге кандай жардам бере алам?",
    msg2: "Бааларыңыз кандай?",
    msg3: "Биздин баалар айына 10$ башталат. Кененирээк маалымат үчүн номериңизди калтырыңыз.",
  },
  RU: {
    msg1: "Здравствуйте! Добро пожаловать. Чем я могу помочь вам сегодня?",
    msg2: "Какие у вас цены?",
    msg3: "Наши цены начинаются от $10 в месяц. Пожалуйста, оставьте свой номер для деталей.",
  },
  EN: {
    msg1: "Hello! Welcome to our website. How can I help you today?",
    msg2: "What are your prices?",
    msg3: "Our prices start at $10/month. Please leave your number for more details.",
  },
};

export default function WidgetSettings() {
  const { t } = useLanguage();
  const [color, setColor] = useState("#4f46e5");
  const [language, setLanguage] = useState<"KG" | "RU" | "EN">("RU");
  const [leadMode, setLeadMode] = useState(true);
  const [position, setPosition] = useState<"bottom-right" | "bottom-left">("bottom-right");
  const [allowedDomains, setAllowedDomains] = useState("");
  const [copied, setCopied] = useState(false);

  const widgetId  = "wk_1a2b3c4d5e";
  const apiUrl    = "https://api.nexusai.example.com";
  const widgetCdn = "https://cdn.nexusai.example.com/widget.iife.js";

  const palettes = ["#4f46e5", "#2563eb", "#16a34a", "#db2777", "#ea580c"];

  const embedCode = `<!-- Nexus AI widget -->
<script
  src="${widgetCdn}"
  data-widget-id="${widgetId}"
  data-api-url="${apiUrl}"
  data-color="${color}"
  data-lang="${language}"
  data-position="${position}"
  data-lead-mode="${leadMode}"
  defer
></script>`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(embedCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const preview = PREVIEW_MSGS[language] ?? PREVIEW_MSGS.EN;

  return (
    <div className="fade-in-up pb-16 relative">
      <div className="mesh-bg" />
      <header className="mb-10 flex justify-between items-end">
        <div>
          <div className="chip mb-4">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            </svg>
            {t.widgetSettings.widgetConfig}
          </div>
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
            <span className="text-gradient-subtle">{t.widgetSettings.title}</span>
          </h2>
          <p className="text-[var(--foreground-muted)] mt-2 text-[15px]">{t.widgetSettings.desc}</p>
        </div>
        <div className="hidden sm:block">
          <span className="chip chip-glow">{t.widgetSettings.proBadge}</span>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        {/* ── Left: settings ── */}
        <div className="space-y-8">
          {/* Appearance */}
          <section className="glass-panel rounded-2xl p-8 transition-shadow hover:shadow-xl">
            <h3 className="text-lg font-semibold mb-6 flex items-center">
              <svg className="w-5 h-5 mr-3 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
              </svg>
              {t.widgetSettings.appearance}
            </h3>

            {/* Color palette */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-[var(--foreground)]/80 mb-3">
                {t.widgetSettings.primaryColor}
              </label>
              <div className="flex items-center gap-3 mb-4">
                {palettes.map((p) => (
                  <button
                    key={p}
                    onClick={() => setColor(p)}
                    className={`w-10 h-10 rounded-full border-2 transition-all duration-300 hover:scale-110 shadow-sm ${color === p ? "border-[var(--foreground)] scale-110 shadow-md" : "border-transparent"}`}
                    style={{ backgroundColor: p }}
                    title={p}
                  />
                ))}
              </div>
              <div className="flex items-center gap-4">
                <div className="relative w-12 h-12 rounded-xl overflow-hidden shadow-inner border border-[var(--border)] shrink-0">
                  <input
                    type="color"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    className="absolute -top-2 -left-2 w-16 h-16 cursor-pointer opacity-0"
                  />
                  <div className="w-full h-full pointer-events-none" style={{ backgroundColor: color }} />
                </div>
                <input
                  type="text"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="px-4 py-3 border border-[var(--border)] rounded-xl text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 w-full bg-[var(--surface)] transition-all font-mono uppercase shadow-sm"
                />
              </div>
            </div>

            {/* Language */}
            <div className="mb-8">
              <label className="block text-sm font-semibold text-[var(--foreground)]/80 mb-3">
                {t.widgetSettings.defaultLanguage}
              </label>
              <div className="relative">
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value as "KG" | "RU" | "EN")}
                  className="w-full px-4 py-3 border border-[var(--border)] rounded-xl text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 bg-[var(--surface)] transition-all cursor-pointer appearance-none shadow-sm"
                >
                  <option value="KG">Кыргызча (Kyrgyz)</option>
                  <option value="RU">Русский (Russian)</option>
                  <option value="EN">English</option>
                </select>
                <svg className="w-5 h-5 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-[var(--foreground)]/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>

            {/* Lead mode toggle */}
            <div className="pt-6 border-t border-[var(--border)] flex items-center justify-between">
              <div>
                <p className="text-sm font-bold">{t.widgetSettings.leadMode}</p>
                <p className="text-xs text-[var(--foreground)]/50 mt-1 max-w-[250px] leading-relaxed">
                  {t.widgetSettings.leadModeDesc}
                </p>
              </div>
              <button
                onClick={() => setLeadMode(!leadMode)}
                className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors duration-300 focus:outline-none shadow-inner ${leadMode ? "bg-indigo-500" : "bg-[var(--border)]"}`}
              >
                <span
                  className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform duration-300 shadow-sm ${leadMode ? "translate-x-6" : "translate-x-1"}`}
                />
              </button>
            </div>

            {/* Position + Widget ID */}
            <div className="pt-6 mt-2 border-t border-[var(--border)] grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-[var(--foreground)]/80 mb-2">
                  {t.widgetSettings.position}
                </label>
                <select
                  value={position}
                  onChange={(e) => setPosition(e.target.value as "bottom-right" | "bottom-left")}
                  className="w-full px-3 py-2.5 border border-[var(--border)] rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-[var(--surface)]"
                >
                  <option value="bottom-right">{t.widgetSettings.bottomRight}</option>
                  <option value="bottom-left">{t.widgetSettings.bottomLeft}</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-[var(--foreground)]/80 mb-2">
                  {t.widgetSettings.widgetId}
                </label>
                <input
                  readOnly
                  value={widgetId}
                  className="w-full px-3 py-2.5 border border-[var(--border)] rounded-lg text-sm bg-[var(--surface-hover)] font-mono"
                />
              </div>
            </div>

            {/* Allowed domains */}
            <div className="pt-6 mt-2 border-t border-[var(--border)]">
              <label className="block text-sm font-semibold text-[var(--foreground)]/80 mb-2">
                {t.widgetSettings.allowedDomains}
              </label>
              <p className="text-xs text-[var(--foreground)]/50 mb-3">
                {t.widgetSettings.allowedDomainsHint}
              </p>
              <textarea
                value={allowedDomains}
                onChange={(e) => setAllowedDomains(e.target.value)}
                placeholder={"https://your-site.com\n*.your-site.com"}
                rows={3}
                className="w-full px-3 py-2.5 border border-[var(--border)] rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-[var(--surface)] font-mono"
              />
            </div>
          </section>

          {/* Embed script */}
          <section className="glass-panel rounded-2xl p-8 transition-shadow hover:shadow-xl">
            <h3 className="text-lg font-semibold mb-3 flex items-center">
              <svg className="w-5 h-5 mr-3 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
              </svg>
              {t.widgetSettings.embedScript}
            </h3>
            <p className="text-[var(--foreground)]/50 text-sm mb-6">{t.widgetSettings.embedDesc}</p>
            <div className="relative group">
              <pre className="bg-[#0f172a] text-slate-300 p-5 rounded-xl text-[13px] overflow-x-auto font-mono leading-relaxed shadow-inner border border-slate-800">
                <code>{embedCode}</code>
              </pre>
              <button
                onClick={copyToClipboard}
                className={`absolute top-3 right-3 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all backdrop-blur-md border border-white/10 ${
                  copied
                    ? "bg-emerald-500 text-white"
                    : "bg-white/10 hover:bg-white/20 text-white opacity-0 group-hover:opacity-100"
                }`}
              >
                {copied ? "✓ Copied!" : t.widgetSettings.copyCode}
              </button>
            </div>
          </section>
        </div>

        {/* ── Right: live preview ── */}
        <div className="bg-[var(--surface-hover)] rounded-2xl border border-[var(--border)] flex items-center justify-center min-h-[600px] relative overflow-hidden transition-all group shadow-inner">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.03] dark:opacity-10" />

          <div className="absolute top-6 left-6 z-10">
            <span className="text-[10px] font-bold tracking-widest text-[var(--foreground)]/50 uppercase bg-[var(--surface)]/80 px-3 py-1.5 rounded-full backdrop-blur-md border border-[var(--border)] shadow-sm">
              {t.widgetSettings.livePreview}
            </span>
          </div>

          {/* Mock chat widget */}
          <div className="absolute bottom-8 right-8 w-[360px] bg-[var(--surface)] rounded-2xl shadow-2xl overflow-hidden flex flex-col border border-[var(--border)] fade-in-up z-20 group-hover:-translate-y-2 transition-transform duration-500">
            {/* Widget header */}
            <div
              className="h-20 flex items-center px-6 relative overflow-hidden transition-colors duration-500"
              style={{ backgroundColor: color }}
            >
              <div className="absolute inset-0 bg-white/10 backdrop-blur-md" />
              <div className="w-10 h-10 rounded-full bg-white mr-4 shadow-md z-10 flex items-center justify-center">
                <span className="text-[11px] font-bold" style={{ color }}>AI</span>
              </div>
              <div className="text-white z-10">
                <p className="text-sm font-bold tracking-wide">{t.widgetSettings.assistantName}</p>
                <p className="text-[11px] opacity-90 mt-0.5 flex items-center font-medium">
                  <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full mr-1.5 shadow-[0_0_8px_rgba(52,211,153,0.8)] animate-pulse" />
                  {t.widgetSettings.online}
                </p>
              </div>
            </div>

            {/* Widget messages */}
            <div className="h-80 bg-[var(--background)] p-6 flex flex-col gap-4 overflow-y-auto">
              <div className="self-start max-w-[85%] bg-[var(--surface)] border border-[var(--border)] p-4 rounded-2xl rounded-tl-sm text-[13px] leading-relaxed shadow-sm">
                {preview.msg1}
              </div>
              <div
                className="self-end max-w-[85%] p-4 rounded-2xl rounded-tr-sm text-[13px] text-white leading-relaxed shadow-md transition-colors duration-500"
                style={{ backgroundColor: color }}
              >
                {preview.msg2}
              </div>
              <div className="self-start max-w-[85%] bg-[var(--surface)] border border-[var(--border)] p-4 rounded-2xl rounded-tl-sm text-[13px] leading-relaxed shadow-sm">
                {preview.msg3}
              </div>

              {leadMode && (
                <div className="self-start w-full mt-2 animate-pulse bg-indigo-500/5 dark:bg-indigo-500/10 rounded-xl p-3 text-center border border-dashed border-indigo-500/30">
                  <span className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                    {t.widgetSettings.leadFormActive}
                  </span>
                </div>
              )}
            </div>

            {/* Widget input */}
            <div className="p-4 bg-[var(--surface)] border-t border-[var(--border)]">
              <div className="bg-[var(--surface-hover)] border border-[var(--border)] rounded-xl flex items-center px-4 py-3 shadow-sm">
                <input
                  type="text"
                  placeholder={t.widgetSettings.typeMessage}
                  className="flex-1 bg-transparent text-[13px] outline-none placeholder-[var(--foreground)]/30 font-medium"
                  disabled
                />
                <button
                  className="w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-500 hover:scale-105 shadow-md"
                  style={{ backgroundColor: color }}
                >
                  <svg className="w-4 h-4 text-white ml-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
