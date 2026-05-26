"use client";

import { useMemo, useState } from "react";

type Framework = "html" | "react" | "nextjs" | "wordpress" | "vue";

export default function IntegrationPage() {
  const [widgetId, setWidgetId] = useState("wk_1a2b3c4d5e");
  const [apiUrl, setApiUrl] = useState("https://api.nexusai.example.com");
  const [color, setColor] = useState("#4f46e5");
  const [lang, setLang] = useState<"RU" | "EN" | "KG">("RU");
  const [position, setPosition] = useState<"bottom-right" | "bottom-left">("bottom-right");
  const [leadMode, setLeadMode] = useState(true);
  const [greeting, setGreeting] = useState("");
  const [framework, setFramework] = useState<Framework>("html");

  const widgetCdn = "https://cdn.nexusai.example.com/widget.iife.js";

  const dataAttrs = useMemo(() => {
    const attrs: Record<string, string> = {
      src: widgetCdn,
      "data-widget-id": widgetId,
      "data-api-url": apiUrl,
      "data-color": color,
      "data-lang": lang,
      "data-position": position,
      "data-lead-mode": String(leadMode),
    };
    if (greeting.trim()) attrs["data-greeting"] = greeting;
    return attrs;
  }, [widgetCdn, widgetId, apiUrl, color, lang, position, leadMode, greeting]);

  const htmlSnippet = useMemo(() => {
    const parts = Object.entries(dataAttrs).map(([k, v]) => `  ${k}="${v.replace(/"/g, "&quot;")}"`);
    return `<!-- Nexus AI widget -->\n<script\n${parts.join("\n")}\n  defer\n></script>`;
  }, [dataAttrs]);

  const reactSnippet = useMemo(
    () => `import { useEffect } from "react";

export function NexusAIWidget() {
  useEffect(() => {
    const s = document.createElement("script");
    s.src = "${widgetCdn}";
    s.defer = true;
    s.dataset.widgetId  = "${widgetId}";
    s.dataset.apiUrl    = "${apiUrl}";
    s.dataset.color     = "${color}";
    s.dataset.lang      = "${lang}";
    s.dataset.position  = "${position}";
    s.dataset.leadMode  = "${leadMode}";
    document.body.appendChild(s);
    return () => { (window as any).NexusAI?.destroy?.(); s.remove(); };
  }, []);
  return null;
}`,
    [widgetCdn, widgetId, apiUrl, color, lang, position, leadMode],
  );

  const nextSnippet = useMemo(
    () => `// app/layout.tsx
import Script from "next/script";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {children}
        <Script
          src="${widgetCdn}"
          strategy="afterInteractive"
          data-widget-id="${widgetId}"
          data-api-url="${apiUrl}"
          data-color="${color}"
          data-lang="${lang}"
          data-position="${position}"
          data-lead-mode="${leadMode}"
        />
      </body>
    </html>
  );
}`,
    [widgetCdn, widgetId, apiUrl, color, lang, position, leadMode],
  );

  const wpSnippet = useMemo(
    () => `<?php
// functions.php (your WP theme)
add_action('wp_footer', function () { ?>
  <script
    src="${widgetCdn}"
    data-widget-id="${widgetId}"
    data-api-url="${apiUrl}"
    data-color="${color}"
    data-lang="${lang}"
    data-position="${position}"
    data-lead-mode="${leadMode}"
    defer
  ></script>
<?php });`,
    [widgetCdn, widgetId, apiUrl, color, lang, position, leadMode],
  );

  const vueSnippet = useMemo(
    () => `<!-- App.vue -->
<script setup lang="ts">
import { onMounted, onBeforeUnmount } from "vue";
onMounted(() => {
  const s = document.createElement("script");
  s.src = "${widgetCdn}";
  s.defer = true;
  s.dataset.widgetId = "${widgetId}";
  s.dataset.apiUrl   = "${apiUrl}";
  s.dataset.color    = "${color}";
  s.dataset.lang     = "${lang}";
  s.dataset.position = "${position}";
  s.dataset.leadMode = "${leadMode}";
  document.body.appendChild(s);
});
onBeforeUnmount(() => (window as any).NexusAI?.destroy?.());
</script>`,
    [widgetCdn, widgetId, apiUrl, color, lang, position, leadMode],
  );

  const snippets: Record<Framework, { label: string; lang: string; code: string; icon: string }> = {
    html:      { label: "HTML",       lang: "html", code: htmlSnippet,  icon: "M12 18h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" },
    react:     { label: "React",      lang: "tsx",  code: reactSnippet, icon: "M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" },
    nextjs:    { label: "Next.js",    lang: "tsx",  code: nextSnippet,  icon: "M13 10V3L4 14h7v7l9-11h-7z" },
    wordpress: { label: "WordPress",  lang: "php",  code: wpSnippet,    icon: "M21 12c0 1.66-.39 3.22-1.07 4.61L12 12 6.46 6.46A8.96 8.96 0 0112 3c4.97 0 9 4.03 9 9zM12 21c-4.97 0-9-4.03-9-9 0-1.66.39-3.22 1.07-4.61L12 12l5.54 5.54A8.96 8.96 0 0112 21z" },
    vue:       { label: "Vue 3",      lang: "vue",  code: vueSnippet,   icon: "M3 3l9 16 9-16M7 3l5 9 5-9" },
  };

  return (
    <div className="fade-in-up pb-16 relative">
      <div className="mesh-bg" />

      {/* Header */}
      <header className="mb-10">
        <div className="chip mb-4">
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
          One-tag install
        </div>
        <h1 className="text-3xl md:text-5xl font-bold tracking-tight mb-3">
          <span className="text-gradient-subtle">Embed your widget.</span>
          <br />
          <span className="text-gradient">Anywhere.</span>
        </h1>
        <p className="text-[var(--foreground-muted)] max-w-2xl text-[15px]">
          Скопируйте сниппет и вставьте на любую страницу перед закрывающим <code className="px-1.5 py-0.5 rounded bg-[var(--surface-hover)] border border-[var(--border)] text-[13px]">&lt;/body&gt;</code>.
          Виджет работает в Shadow DOM — стили вашего сайта не пострадают.
        </p>
      </header>

      {/* Config */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        <ConfigCard label="Widget ID" hint="Уникальный ID вашего виджета">
          <input
            value={widgetId}
            onChange={(e) => setWidgetId(e.target.value)}
            className="input font-mono"
          />
        </ConfigCard>

        <ConfigCard label="API URL" hint="Адрес AI Core сервера">
          <input value={apiUrl} onChange={(e) => setApiUrl(e.target.value)} className="input" />
        </ConfigCard>

        <ConfigCard label="Цвет" hint="Брендовый цвет акцента">
          <div className="flex items-center gap-2">
            <label className="relative w-10 h-10 rounded-lg overflow-hidden cursor-pointer border border-[var(--border)] shadow-sm shrink-0" style={{ background: color }}>
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="absolute inset-0 opacity-0 cursor-pointer"
              />
            </label>
            <input value={color} onChange={(e) => setColor(e.target.value)} className="input font-mono uppercase" />
          </div>
        </ConfigCard>

        <ConfigCard label="Язык по умолчанию">
          <select value={lang} onChange={(e) => setLang(e.target.value as typeof lang)} className="input">
            <option value="RU">Русский</option>
            <option value="EN">English</option>
            <option value="KG">Кыргызча</option>
          </select>
        </ConfigCard>

        <ConfigCard label="Положение">
          <select
            value={position}
            onChange={(e) => setPosition(e.target.value as typeof position)}
            className="input"
          >
            <option value="bottom-right">↘ Снизу справа</option>
            <option value="bottom-left">↙ Снизу слева</option>
          </select>
        </ConfigCard>

        <ConfigCard label="Lead-режим" hint="Кнопка «Связаться с менеджером»">
          <button
            onClick={() => setLeadMode((v) => !v)}
            className={`w-full text-sm font-semibold px-3 py-2.5 rounded-lg border transition-all ${
              leadMode
                ? "bg-gradient-to-r from-indigo-500 to-violet-600 text-white border-transparent shadow-[0_4px_12px_rgba(99,102,241,0.3)]"
                : "bg-[var(--surface)] border-[var(--border)] hover:border-[var(--border-strong)]"
            }`}
          >
            {leadMode ? "✓ Включено" : "Выключено"}
          </button>
        </ConfigCard>

        <div className="md:col-span-2 lg:col-span-3">
          <ConfigCard label="Приветствие (опционально)" hint="Если пусто — берется из настроек виджета">
            <input
              value={greeting}
              onChange={(e) => setGreeting(e.target.value)}
              placeholder="Здравствуйте! Чем помочь?"
              className="input"
            />
          </ConfigCard>
        </div>
      </section>

      {/* Code block */}
      <section className="card-premium p-6 lg:p-8 mb-10 overflow-visible">
        <div className="flex items-center justify-between mb-5">
          <div className="flex flex-wrap items-center gap-1.5">
            {(Object.keys(snippets) as Framework[]).map((k) => (
              <button
                key={k}
                onClick={() => setFramework(k)}
                className={`inline-flex items-center gap-1.5 text-[12px] font-semibold px-3 py-2 rounded-lg transition-all ${
                  framework === k
                    ? "bg-[var(--foreground)] text-[var(--background)] shadow-sm"
                    : "bg-[var(--surface-hover)] text-[var(--foreground-muted)] hover:text-[var(--foreground)]"
                }`}
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d={snippets[k].icon}/></svg>
                {snippets[k].label}
              </button>
            ))}
          </div>
          <span className="hidden sm:inline-block text-[11px] font-mono uppercase tracking-widest text-[var(--foreground-faint)]">
            {snippets[framework].lang}
          </span>
        </div>

        <CodeBlock code={snippets[framework].code} />
      </section>

      {/* Three info cards */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-10">
        <InfoCard
          step="01"
          title="Загрузите знания"
          desc="Добавьте документы в Knowledge Base — бот выучит ваш бизнес за минуту."
        />
        <InfoCard
          step="02"
          title="Скопируйте сниппет"
          desc="Один тег <script>, никаких npm install, никаких build-шагов."
        />
        <InfoCard
          step="03"
          title="Вставьте на сайт"
          desc="Перед закрывающим </body>. Виджет появится в нижнем углу страницы."
        />
      </section>

      {/* JS API */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card-premium p-6">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-7 h-7 rounded-md bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center">
              <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"/></svg>
            </div>
            <h3 className="text-base font-bold">JavaScript API</h3>
          </div>
          <pre className="text-[12px] font-mono leading-relaxed text-[var(--foreground-muted)] overflow-x-auto bg-[var(--surface-hover)] p-4 rounded-lg border border-[var(--border)]">
{`window.NexusAI.open();
window.NexusAI.close();
window.NexusAI.toggle();
window.NexusAI.send("Tell me about pricing");
window.NexusAI.destroy();

// Программная инициализация:
window.NexusAI.init({
  widgetId: "${widgetId}",
  apiUrl:   "${apiUrl}",
  color:    "${color}",
  lang:     "${lang}",
  leadMode: ${leadMode},
});`}
          </pre>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FeatureMini title="Shadow DOM" desc="Полная изоляция стилей. Ваш сайт не пострадает." icon="M5 12a7 7 0 1014 0 7 7 0 00-14 0z"/>
          <FeatureMini title="Streaming SSE" desc="Ответы AI печатаются токен-за-токеном." icon="M13 10V3L4 14h7v7l9-11h-7z"/>
          <FeatureMini title="Domain whitelist" desc="Контроль того, где может встраиваться виджет." icon="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"/>
          <FeatureMini title="Multi-lang" desc="Русский, английский, кыргызский — из коробки." icon="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129"/>
        </div>
      </section>

      <style jsx>{`
        :global(.input) {
          width: 100%;
          padding: 10px 12px;
          font-size: 14px;
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: var(--radius-sm);
          color: var(--foreground);
          transition: border-color 150ms ease, box-shadow 150ms ease;
          outline: none;
        }
        :global(.input:hover)  { border-color: var(--border-strong); }
        :global(.input:focus)  {
          border-color: var(--primary);
          box-shadow: 0 0 0 3px color-mix(in srgb, var(--primary) 18%, transparent);
        }
      `}</style>
    </div>
  );
}

/* ---------- Subcomponents ---------- */
function ConfigCard({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="card-premium p-4">
      <label className="block text-[11px] font-bold uppercase tracking-widest text-[var(--foreground-faint)] mb-2.5">
        {label}
      </label>
      {children}
      {hint && <p className="text-[11px] text-[var(--foreground-faint)] mt-2 leading-relaxed">{hint}</p>}
    </div>
  );
}

function InfoCard({ step, title, desc }: { step: string; title: string; desc: string }) {
  return (
    <div className="card-premium p-6">
      <div className="text-[44px] font-bold text-gradient leading-none mb-3 tracking-tighter">
        {step}
      </div>
      <h4 className="text-base font-bold mb-1.5">{title}</h4>
      <p className="text-[13px] text-[var(--foreground-muted)] leading-relaxed">{desc}</p>
    </div>
  );
}

function FeatureMini({ title, desc, icon }: { title: string; desc: string; icon: string }) {
  return (
    <div className="card-premium p-4">
      <div className="w-7 h-7 rounded-md bg-[var(--surface-hover)] flex items-center justify-center mb-2.5">
        <svg className="w-3.5 h-3.5 text-[var(--primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d={icon}/></svg>
      </div>
      <p className="text-[13px] font-semibold mb-1">{title}</p>
      <p className="text-[11px] text-[var(--foreground-muted)] leading-relaxed">{desc}</p>
    </div>
  );
}

function CodeBlock({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);
  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch { /* ignore */ }
  };

  return (
    <div className="relative group">
      <div className="absolute -inset-px rounded-xl bg-gradient-to-r from-indigo-500/20 via-violet-500/20 to-fuchsia-500/20 blur-md opacity-0 group-hover:opacity-100 transition-opacity -z-10" />
      <pre className="bg-[#0a0a0f] text-slate-200 px-5 py-5 pr-24 rounded-xl text-[13px] overflow-x-auto leading-relaxed shadow-inner border border-slate-900/80 whitespace-pre">
        <code>{code}</code>
      </pre>
      <button
        onClick={onCopy}
        className={`absolute top-3 right-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all border ${
          copied
            ? "bg-emerald-500 text-white border-emerald-500"
            : "bg-white/5 hover:bg-white/15 text-white/80 hover:text-white border-white/10"
        }`}
      >
        {copied ? (
          <>
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7"/></svg>
            Скопировано
          </>
        ) : (
          <>
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg>
            Копировать
          </>
        )}
      </button>
    </div>
  );
}
