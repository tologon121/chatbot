import { OpenAI } from "openai";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const SYSTEM_PROMPTS: Record<string, string> = {
  EN: "You are a helpful AI assistant for NexusAI SaaS platform. Be professional, concise, and helpful.",
  RU: "Вы — полезный ИИ-помощник для SaaS-платформы NexusAI. Будьте профессиональны, кратки и вежливы.",
  KG: "Сиз NexusAI SaaS платформасынын пайдалуу ИИ жардамчысысыз. Профессионалдуу, кыска жана сылык болуңуз.",
};

/**
 * Demo proxy endpoint.
 * 1) Если задан AI_CORE_URL (или NEXT_PUBLIC_API_URL) — проксирует запрос
 *    в FastAPI backend (правильный путь для прод: единая RAG-логика).
 *    При необходимости автоматически создает сессию (POST /chat/session).
 * 2) Иначе — fallback на прямой OpenAI-вызов (для local dev).
 * 3) Если ни то, ни другое не настроено — возвращает дружелюбную
 *    демо-заглушку, чтобы /demo не "падал" в проде с placeholder ключом.
 */
const DEMO_RESPONSES: Record<string, string[]> = {
  RU: [
    "Я демо-ассистент Nexus AI 🚀. Настройте OPENAI_API_KEY или AI_CORE_URL, и я начну отвечать как настоящий бот.",
    "Это демо-режим. Полная версия использует RAG-поиск по вашей базе знаний и GPT-4o-mini.",
    "Спасибо за вопрос! В реальном виджете я бы поискал ответ в загруженных документах и ответил по делу.",
  ],
  EN: [
    "I'm the Nexus AI demo assistant 🚀. Configure OPENAI_API_KEY or AI_CORE_URL to get real answers.",
    "This is demo mode. The full version uses RAG search over your knowledge base.",
    "Thanks for the question! A live widget would search uploaded docs and answer for real.",
  ],
  KG: [
    "Мен Nexus AI демо жардамчысымын 🚀. OPENAI_API_KEY же AI_CORE_URL орнотуңуз.",
    "Бул демо режим. Толук версия RAG издөөнү колдонот.",
    "Сурооңуз үчүн рахмат! Реалдуу виджет документтерден жооп издейт.",
  ],
};

function pickDemoReply(lang: string, text: string): string {
  const pool = DEMO_RESPONSES[lang] || DEMO_RESPONSES.EN;
  const idx = Math.abs(text.length) % pool.length;
  return pool[idx];
}

async function ensureSession(aiCoreUrl: string, widgetId: string): Promise<string | null> {
  try {
    const r = await fetch(`${aiCoreUrl}/api/v1/chat/session`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ widget_id: widgetId }),
    });
    if (!r.ok) return null;
    const d = await r.json();
    return d.session_id || null;
  } catch {
    return null;
  }
}

export async function POST(req: Request) {
  const { messages, lang, widgetId: rawWidgetId, sessionId: rawSessionId } = await req.json();
  const widgetId = rawWidgetId || "wk_demo";
  const lastMsg = messages?.at(-1)?.content ?? "";

  const aiCoreUrl =
    process.env.AI_CORE_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    null;
  const aiCore = aiCoreUrl?.replace(/\/$/, "") || null;

  // --- 1. proxy в AI Core ---
  if (aiCore && widgetId) {
    try {
      let sessionId = rawSessionId;
      if (!sessionId) {
        sessionId = await ensureSession(aiCore, widgetId);
      }
      if (sessionId) {
        const r = await fetch(`${aiCore}/api/v1/chat/send`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            widget_id: widgetId,
            session_id: sessionId,
            message: lastMsg,
            language: lang || "RU",
          }),
        });
        if (r.ok) {
          const data = await r.json();
          return NextResponse.json({ text: data.reply, sessionId });
        }
        console.warn("AI Core /chat/send returned", r.status);
      }
    } catch (e) {
      console.error("AI Core proxy failed, falling back:", e);
    }
  }

  // --- 2. fallback: direct OpenAI ---
  if (process.env.OPENAI_API_KEY && !process.env.OPENAI_API_KEY.includes("your-openai")) {
    try {
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
      const response = await openai.chat.completions.create({
        model: process.env.OPENAI_CHAT_MODEL || "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content:
              SYSTEM_PROMPTS[lang as keyof typeof SYSTEM_PROMPTS] || SYSTEM_PROMPTS.EN,
          },
          ...messages,
        ],
        temperature: 0.7,
      });
      return NextResponse.json({ text: response.choices[0].message.content });
    } catch (error: unknown) {
      console.error("OpenAI Error:", error);
    }
  }

  // --- 3. graceful demo stub ---
  return NextResponse.json({ text: pickDemoReply(lang || "RU", lastMsg) });
}
