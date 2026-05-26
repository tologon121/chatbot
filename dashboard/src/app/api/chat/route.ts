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
 * 1) Если задан AI_CORE_URL — проксирует запрос в FastAPI backend
 *    (правильный путь для прод-сценария: единая RAG-логика).
 * 2) Иначе — fallback на прямой OpenAI-вызов (для local dev).
 */
export async function POST(req: Request) {
  const { messages, lang, widgetId, sessionId } = await req.json();

  const aiCoreUrl = process.env.AI_CORE_URL;

  // --- 1. proxy в AI Core ---
  if (aiCoreUrl && widgetId && sessionId) {
    try {
      const r = await fetch(`${aiCoreUrl.replace(/\/$/, "")}/api/v1/chat/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          widget_id: widgetId,
          session_id: sessionId,
          message: messages?.at(-1)?.content ?? "",
          language: lang || "RU",
        }),
      });
      if (!r.ok) throw new Error(`ai-core ${r.status}`);
      const data = await r.json();
      return NextResponse.json({ text: data.reply });
    } catch (e) {
      console.error("AI Core proxy failed, falling back:", e);
    }
  }

  // --- 2. fallback: direct OpenAI ---
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "OPENAI_API_KEY is not configured" },
        { status: 500 },
      );
    }
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const response = await openai.chat.completions.create({
      model: process.env.OPENAI_CHAT_MODEL || "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: SYSTEM_PROMPTS[lang as keyof typeof SYSTEM_PROMPTS] || SYSTEM_PROMPTS.EN,
        },
        ...messages,
      ],
      temperature: 0.7,
    });
    return NextResponse.json({ text: response.choices[0].message.content });
  } catch (error: unknown) {
    console.error("OpenAI Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch response" },
      { status: 500 },
    );
  }
}
