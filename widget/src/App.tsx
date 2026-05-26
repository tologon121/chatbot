import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import ThreeAvatar from './components/ThreeAvatar';

type Msg = { text: string; isBot: boolean; pending?: boolean };

type AppConfig = {
  widgetId: string;
  apiUrl: string;
  color: string;
  lang: string;
  position: 'bottom-right' | 'bottom-left';
  greeting: string;
  leadMode: boolean;
  title: string;
};

interface AppProps {
  config: AppConfig;
  controlBus: EventTarget;
}

const STORAGE_KEY = 'nexus_ai_session';

function getGreeting(lang: string, override: string) {
  if (override) return override;
  if (lang === 'KG')
    return 'Саламатсызбы! Биздин сайтка кош келиңиз. Мен сизге кантип жардам бере алам?';
  if (lang === 'EN') return 'Hello! Welcome to our site. How can I assist you today?';
  return 'Здравствуйте! Добро пожаловать. Чем я могу вам помочь сегодня?';
}

function placeholderText(lang: string, recording: boolean) {
  if (recording) return lang === 'RU' ? 'Слушаю...' : 'Listening...';
  if (lang === 'KG') return 'Билдирүү жазыңыз...';
  if (lang === 'EN') return 'Type a message...';
  return 'Введите сообщение...';
}

function loadSession(widgetId: string): string | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const obj = JSON.parse(raw);
    return obj?.widgetId === widgetId ? obj?.sessionId : null;
  } catch {
    return null;
  }
}

function saveSession(widgetId: string, sessionId: string) {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ widgetId, sessionId }));
  } catch {
    /* ignore */
  }
}

export default function App({ config, controlBus }: AppProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [lang, setLang] = useState(config.lang);
  const [message, setMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [chatMessages, setChatMessages] = useState<Msg[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(
    loadSession(config.widgetId),
  );
  const [showLeadForm, setShowLeadForm] = useState(false);
  const [lead, setLead] = useState({ name: '', email: '', phone: '' });
  const [leadSent, setLeadSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const apiBase = useMemo(() => config.apiUrl.replace(/\/$/, ''), [config.apiUrl]);

  // ---------- session management ----------
  const ensureSession = useCallback(async (): Promise<string | null> => {
    if (sessionId) return sessionId;
    try {
      const res = await fetch(`${apiBase}/api/v1/chat/session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ widget_id: config.widgetId }),
      });
      if (!res.ok) throw new Error(`session failed: ${res.status}`);
      const data = await res.json();
      saveSession(config.widgetId, data.session_id);
      setSessionId(data.session_id);
      return data.session_id as string;
    } catch (e) {
      console.error('[NexusAI] session error', e);
      setError(
        lang === 'RU'
          ? 'Не удалось подключиться к серверу.'
          : 'Connection failed.',
      );
      return null;
    }
  }, [apiBase, config.widgetId, lang, sessionId]);

  // ---------- send message (with SSE streaming) ----------
  const sendMessage = useCallback(
    async (text: string) => {
      const userMsg = text.trim();
      if (!userMsg) return;

      setChatMessages((prev) => [...prev, { text: userMsg, isBot: false }]);
      setMessage('');
      setIsTyping(true);
      setError(null);

      const sid = await ensureSession();
      if (!sid) {
        setIsTyping(false);
        return;
      }

      // Стрим: добавим пустой "бот"-message и будем дописывать
      let botIndex = -1;
      setChatMessages((prev) => {
        botIndex = prev.length;
        return [...prev, { text: '', isBot: true, pending: true }];
      });

      try {
        const resp = await fetch(`${apiBase}/api/v1/chat/stream`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'text/event-stream' },
          body: JSON.stringify({
            widget_id: config.widgetId,
            session_id: sid,
            message: userMsg,
            language: lang,
          }),
        });

        if (!resp.ok || !resp.body) {
          throw new Error(`stream failed: ${resp.status}`);
        }

        const reader = resp.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        // Простой SSE parser
        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const parts = buffer.split('\n\n');
          buffer = parts.pop() || '';
          for (const part of parts) {
            const event = /^event:\s*(.+)$/m.exec(part)?.[1]?.trim();
            const data = /^data:\s*(.+)$/m.exec(part)?.[1];
            if (!data) continue;
            if (event === 'token') {
              let chunk: string;
              try {
                chunk = JSON.parse(data);
              } catch {
                chunk = data;
              }
              setChatMessages((prev) => {
                const next = [...prev];
                if (next[botIndex]) {
                  next[botIndex] = {
                    ...next[botIndex],
                    text: next[botIndex].text + chunk,
                  };
                }
                return next;
              });
            } else if (event === 'done') {
              setChatMessages((prev) => {
                const next = [...prev];
                if (next[botIndex]) next[botIndex] = { ...next[botIndex], pending: false };
                return next;
              });
            } else if (event === 'error') {
              setError(lang === 'RU' ? 'Ошибка генерации ответа.' : 'Generation error.');
            }
          }
        }
      } catch (e) {
        // Fallback: пробуем non-streaming endpoint
        try {
          const r = await fetch(`${apiBase}/api/v1/chat/send`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              widget_id: config.widgetId,
              session_id: sid,
              message: userMsg,
              language: lang,
            }),
          });
          const data = await r.json();
          setChatMessages((prev) => {
            const next = [...prev];
            if (next[botIndex]) {
              next[botIndex] = { text: data.reply || '...', isBot: true };
            }
            return next;
          });
        } catch (err) {
          console.error('[NexusAI] chat error', err);
          setError(lang === 'RU' ? 'Ошибка сети.' : 'Network error.');
        }
      } finally {
        setIsTyping(false);
      }
    },
    [apiBase, config.widgetId, ensureSession, lang],
  );

  // ---------- lead capture ----------
  const submitLead = useCallback(async () => {
    if (!lead.email && !lead.phone) {
      setError(
        lang === 'RU'
          ? 'Укажите email или телефон.'
          : 'Provide email or phone.',
      );
      return;
    }
    const sid = await ensureSession();
    if (!sid) return;
    try {
      const r = await fetch(`${apiBase}/api/v1/leads/capture`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          widget_id: config.widgetId,
          session_id: sid,
          name: lead.name || null,
          email: lead.email || null,
          phone: lead.phone || null,
          context: 'Captured from widget',
        }),
      });
      if (!r.ok) throw new Error(String(r.status));
      setLeadSent(true);
      setTimeout(() => {
        setShowLeadForm(false);
        setLeadSent(false);
      }, 2200);
    } catch (e) {
      console.error('[NexusAI] lead error', e);
      setError(lang === 'RU' ? 'Не удалось сохранить контакт.' : 'Could not save contact.');
    }
  }, [apiBase, config.widgetId, ensureSession, lang, lead]);

  // ---------- control bus ----------
  useEffect(() => {
    const onOpen = () => setIsOpen(true);
    const onClose = () => setIsOpen(false);
    const onToggle = () => setIsOpen((v) => !v);
    const onSend = (e: Event) => {
      const detail = (e as CustomEvent<string>).detail;
      if (typeof detail === 'string') sendMessage(detail);
    };
    controlBus.addEventListener('open', onOpen);
    controlBus.addEventListener('close', onClose);
    controlBus.addEventListener('toggle', onToggle);
    controlBus.addEventListener('send', onSend);
    return () => {
      controlBus.removeEventListener('open', onOpen);
      controlBus.removeEventListener('close', onClose);
      controlBus.removeEventListener('toggle', onToggle);
      controlBus.removeEventListener('send', onSend);
    };
  }, [controlBus, sendMessage]);

  // ---------- autoscroll + autofocus ----------
  useEffect(() => {
    if (isOpen && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [isOpen, chatMessages, isTyping]);

  useEffect(() => {
    if (isOpen) inputRef.current?.focus();
  }, [isOpen]);

  const toggleWidget = () => setIsOpen((v) => !v);

  return (
    <div className="font-sans text-[#111] isolate">
      {!isOpen && (
        <button
          onClick={toggleWidget}
          aria-label="Open chat"
          className="w-16 h-16 rounded-full shadow-[0_10px_30px_rgba(0,0,0,0.2)] flex items-center justify-center transition-transform hover:scale-105 active:scale-95 z-50 cursor-pointer border-none outline-none group animate-bounce-soft"
          style={{ backgroundColor: config.color }}
        >
          <svg
            className="w-7 h-7 text-white transition-transform group-hover:rotate-12"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
            />
          </svg>
        </button>
      )}

      {isOpen && (
        <div className="w-[380px] h-[650px] bg-white rounded-2xl shadow-[0_25px_50px_-12px_rgba(0,0,0,0.25)] flex flex-col overflow-hidden border border-[#eaeaea] animate-fade-in-up origin-bottom-right">
          {/* Header */}
          <div
            className="h-20 flex items-center justify-between px-5 relative overflow-hidden"
            style={{ backgroundColor: config.color }}
          >
            <div className="absolute inset-0 bg-white/10 backdrop-blur-md pointer-events-none" />
            <div className="flex items-center z-10">
              <ThreeAvatar color={config.color} />
              <div className="ml-3 text-white">
                <h3 className="text-sm font-semibold m-0 tracking-wide">
                  {config.title}
                </h3>
                <p className="text-[11px] opacity-90 m-0 mt-0.5 flex items-center">
                  <span className="w-1.5 h-1.5 bg-green-400 rounded-full mr-1.5 shadow-[0_0_5px_#4ade80]" />
                  Online
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 z-10">
              <select
                value={lang}
                onChange={(e) => setLang(e.target.value)}
                className="appearance-none bg-white/20 text-white text-[11px] uppercase font-bold py-1.5 pl-2.5 pr-6 rounded-md outline-none border-none cursor-pointer backdrop-blur-md hover:bg-white/30 transition-colors"
                aria-label="Language"
              >
                <option value="KG" className="text-black">KG</option>
                <option value="RU" className="text-black">RU</option>
                <option value="EN" className="text-black">EN</option>
              </select>
              <button
                onClick={toggleWidget}
                aria-label="Close chat"
                className="text-white/80 hover:text-white hover:bg-white/10 p-1 rounded-md transition-colors border-none bg-transparent cursor-pointer"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* History */}
          <div className="flex-1 bg-[#fcfcfc] p-5 overflow-y-auto flex flex-col gap-4">
            <div className="self-start max-w-[85%] bg-white border border-[#eaeaea] p-4 rounded-2xl rounded-tl-sm text-[13px] text-[#111] shadow-sm leading-relaxed">
              {getGreeting(lang, config.greeting)}
            </div>

            {chatMessages.map((m, i) => (
              <div
                key={i}
                className={`max-w-[85%] p-4 rounded-2xl text-[13px] shadow-sm leading-relaxed whitespace-pre-wrap ${
                  m.isBot
                    ? 'self-start bg-white border border-[#eaeaea] rounded-tl-sm text-[#111]'
                    : 'self-end text-white rounded-tr-sm'
                }`}
                style={!m.isBot ? { backgroundColor: config.color } : {}}
              >
                {m.text || (m.pending ? '...' : '')}
              </div>
            ))}

            {isTyping && chatMessages.every((m) => !m.pending) && (
              <div className="self-start bg-white border border-[#eaeaea] p-3 rounded-2xl rounded-tl-sm flex gap-1">
                <span className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce" />
                <span className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            )}

            {/* Lead capture CTA */}
            {config.leadMode && !showLeadForm && chatMessages.length >= 2 && !leadSent && (
              <button
                onClick={() => setShowLeadForm(true)}
                className="self-start text-[12px] px-3 py-1.5 rounded-full border border-dashed font-medium hover:bg-black/5 transition-colors cursor-pointer"
                style={{ color: config.color, borderColor: config.color }}
              >
                {lang === 'RU'
                  ? '📞 Связаться с менеджером'
                  : lang === 'KG'
                  ? '📞 Менеджер менен байланышуу'
                  : '📞 Talk to a human'}
              </button>
            )}

            {showLeadForm && !leadSent && (
              <div className="self-stretch bg-white border border-[#eaeaea] p-4 rounded-2xl shadow-sm flex flex-col gap-2">
                <p className="text-[12px] font-semibold mb-1">
                  {lang === 'RU' ? 'Оставьте контакты — мы перезвоним' : 'Leave your contact'}
                </p>
                <input
                  className="border border-[#eaeaea] rounded-md px-3 py-2 text-[13px] outline-none focus:border-black/40"
                  placeholder={lang === 'RU' ? 'Имя' : 'Name'}
                  value={lead.name}
                  onChange={(e) => setLead({ ...lead, name: e.target.value })}
                />
                <input
                  className="border border-[#eaeaea] rounded-md px-3 py-2 text-[13px] outline-none focus:border-black/40"
                  placeholder="Email"
                  type="email"
                  value={lead.email}
                  onChange={(e) => setLead({ ...lead, email: e.target.value })}
                />
                <input
                  className="border border-[#eaeaea] rounded-md px-3 py-2 text-[13px] outline-none focus:border-black/40"
                  placeholder={lang === 'RU' ? 'Телефон' : 'Phone'}
                  value={lead.phone}
                  onChange={(e) => setLead({ ...lead, phone: e.target.value })}
                />
                <div className="flex gap-2 mt-1">
                  <button
                    onClick={submitLead}
                    className="flex-1 text-white text-[12px] font-semibold py-2 rounded-md cursor-pointer border-none"
                    style={{ backgroundColor: config.color }}
                  >
                    {lang === 'RU' ? 'Отправить' : 'Send'}
                  </button>
                  <button
                    onClick={() => setShowLeadForm(false)}
                    className="text-[12px] font-medium px-3 rounded-md border border-[#eaeaea] bg-white cursor-pointer"
                  >
                    {lang === 'RU' ? 'Отмена' : 'Cancel'}
                  </button>
                </div>
              </div>
            )}

            {leadSent && (
              <div className="self-stretch bg-green-50 border border-green-200 text-green-800 p-3 rounded-xl text-[12px] text-center">
                ✓ {lang === 'RU' ? 'Спасибо! Мы свяжемся с вами.' : 'Thanks! We will contact you.'}
              </div>
            )}

            {error && (
              <div className="self-stretch bg-red-50 border border-red-200 text-red-700 p-3 rounded-xl text-[12px] text-center">
                {error}
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-4 bg-white border-t border-[#eaeaea]">
            <div className="bg-[#fcfcfc] border border-[#eaeaea] rounded-xl flex items-center px-2 py-2 focus-within:border-[#ccc] focus-within:bg-white transition-all shadow-sm">
              <input
                ref={inputRef}
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={placeholderText(lang, false)}
                className="flex-1 bg-transparent text-[13px] px-3 py-2 outline-none border-none placeholder-black/30 text-[#111]"
                onKeyDown={(e) => e.key === 'Enter' && sendMessage(message)}
              />
              <button
                onClick={() => sendMessage(message)}
                disabled={!message.trim() || isTyping}
                aria-label="Send"
                className="w-9 h-9 rounded-lg flex items-center justify-center transition-all border-none outline-none cursor-pointer"
                style={{
                  backgroundColor: message.trim() ? config.color : '#f3f3f3',
                  color: message.trim() ? '#fff' : '#ccc',
                  transform: message.trim() ? 'scale(1)' : 'scale(0.95)',
                }}
              >
                <svg className="w-4 h-4 ml-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </button>
            </div>

            <div className="text-center mt-3">
              <a
                href="https://nexusai.example.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[10px] text-black/30 font-medium tracking-wide uppercase no-underline hover:text-black/50 transition-colors"
              >
                Powered by Nexus AI
              </a>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px) scale(0.95); }
          to   { opacity: 1; transform: translateY(0)    scale(1); }
        }
        .animate-fade-in-up { animation: fadeInUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        @keyframes bounceSoft {
          0%, 100% { transform: translateY(0); }
          50%      { transform: translateY(-5px); }
        }
        .animate-bounce-soft { animation: bounceSoft 3s ease-in-out infinite; }
      `}</style>
    </div>
  );
}
