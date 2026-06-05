/**
 * RAG primitives that mirror ai-core/app/services/rag.py.
 * - Recursive character text splitter (no langchain dependency).
 * - OpenAI embeddings + chat completions, with deterministic mock fallback.
 * - Sentiment heuristic.
 */
import OpenAI from "openai";

const EMBEDDING_DIM = 1536;
const CHAT_MODEL = process.env.OPENAI_CHAT_MODEL || "gpt-4o-mini";
const EMBEDDING_MODEL =
  process.env.OPENAI_EMBEDDING_MODEL || "text-embedding-3-small";

function hasOpenAI(): boolean {
  const k = process.env.OPENAI_API_KEY;
  return !!k && k !== "your-openai-key" && !k.includes("your-openai");
}

let _openai: OpenAI | null | undefined;
function getOpenAI(): OpenAI | null {
  if (_openai !== undefined) return _openai;
  if (!hasOpenAI()) {
    _openai = null;
    return null;
  }
  _openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  return _openai;
}

// ---------------------------------------------------------------------------
// Text splitter — recursive on paragraph/sentence/word boundaries
// ---------------------------------------------------------------------------
const SEPARATORS = ["\n\n", "\n", ". ", " ", ""];

export function splitText(
  text: string,
  chunkSize = 1000,
  overlap = 150,
): string[] {
  function recur(t: string, seps: string[]): string[] {
    if (t.length <= chunkSize) return [t];
    const sep = seps[0] || "";
    const rest = seps.slice(1);
    const parts = sep ? t.split(sep) : t.split("");
    const chunks: string[] = [];
    let buf = "";
    for (const p of parts) {
      const piece = sep ? p + sep : p;
      if ((buf + piece).length > chunkSize) {
        if (buf) chunks.push(buf);
        if (piece.length > chunkSize && rest.length > 0) {
          chunks.push(...recur(piece, rest));
          buf = "";
        } else {
          buf = piece;
        }
      } else {
        buf += piece;
      }
    }
    if (buf) chunks.push(buf);
    return chunks;
  }
  const raw = recur(text, SEPARATORS).filter((c) => c.trim().length > 0);
  if (overlap <= 0) return raw;
  // Add overlap between adjacent chunks.
  const out: string[] = [];
  for (let i = 0; i < raw.length; i++) {
    if (i === 0) {
      out.push(raw[i]);
    } else {
      const prev = raw[i - 1];
      const tail = prev.slice(Math.max(0, prev.length - overlap));
      out.push(tail + raw[i]);
    }
  }
  return out;
}

// ---------------------------------------------------------------------------
// Embeddings (with deterministic mock)
// ---------------------------------------------------------------------------
function strHash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h << 5) - h + s.charCodeAt(i);
    h |= 0;
  }
  return h;
}

function seededRandom(seed: number) {
  let s = seed || 1;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

function mockEmbed(text: string): number[] {
  const r = seededRandom(strHash(text));
  const vec: number[] = [];
  for (let i = 0; i < EMBEDDING_DIM; i++) vec.push(r() * 0.2 - 0.1);
  const norm = Math.sqrt(vec.reduce((s, x) => s + x * x, 0)) || 1;
  return vec.map((x) => x / norm);
}

export async function embedBatch(texts: string[]): Promise<number[][]> {
  if (texts.length === 0) return [];
  const ai = getOpenAI();
  if (!ai) return texts.map(mockEmbed);
  try {
    const res = await ai.embeddings.create({
      input: texts,
      model: EMBEDDING_MODEL,
    });
    return res.data.map((d) => d.embedding as number[]);
  } catch (e) {
    console.warn("[Nexus] OpenAI embed batch failed, falling back:", e);
    return texts.map(mockEmbed);
  }
}

export async function embedOne(text: string): Promise<number[]> {
  const [v] = await embedBatch([text]);
  return v;
}

// ---------------------------------------------------------------------------
// Chat completion (with mock fallback that echoes RAG context)
// ---------------------------------------------------------------------------
const DEMO_REPLY: Record<string, string> = {
  RU:
    "Демо-режим: OPENAI_API_KEY не настроен, поэтому я отвечаю шаблоном. " +
    "Контекст из базы знаний найден ниже — в реальном виджете я отвечу по нему.",
  EN:
    "Demo mode: OPENAI_API_KEY is not configured, so I'm replying with a stub. " +
    "Retrieved context shown below — a live deployment would answer for real.",
  KG:
    "Демо-режим: OPENAI_API_KEY жок, ошондуктан мен шаблон менен жооп берем.",
};

export function buildSystemPrompt(
  context: string,
  language: string,
  persona: string | null,
): string {
  const personaBlock = persona
    ? `Persona / Brand voice instructions: ${persona}\n`
    : "";
  return `You are a polite, helpful AI assistant integrated into a business website.
Always reply in the specified language: ${language}.
If the language is KG (Kyrgyz), use respectful and formal Kyrgyz phrasing.
If the answer is not in the context below, politely say you don't know and offer to connect the user to a human manager.
Keep answers concise (2-4 sentences) unless the user asks for detail.
${personaBlock}
Context from the knowledge base:
"""
${context || "[no relevant context found]"}
"""`;
}

export async function generateReply(args: {
  context: string;
  userMessage: string;
  language: string;
  persona: string | null;
}): Promise<string> {
  const { context, userMessage, language, persona } = args;
  const ai = getOpenAI();
  if (!ai) {
    const snippet = context ? `\n\n${context.slice(0, 500)}` : "";
    return (DEMO_REPLY[language] || DEMO_REPLY.EN) + snippet;
  }
  try {
    const res = await ai.chat.completions.create({
      model: CHAT_MODEL,
      messages: [
        { role: "system", content: buildSystemPrompt(context, language, persona) },
        { role: "user", content: userMessage },
      ],
      temperature: 0.3,
    });
    return res.choices[0]?.message?.content || "";
  } catch (e) {
    console.warn("[Nexus] OpenAI chat failed, falling back:", e);
    const snippet = context ? `\n\n${context.slice(0, 500)}` : "";
    return (DEMO_REPLY[language] || DEMO_REPLY.EN) + snippet;
  }
}

// ---------------------------------------------------------------------------
// Sentiment (lightweight rule-based)
// ---------------------------------------------------------------------------
const NEG = [
  "плохо", "ужасно", "жалоба", "bad", "terrible", "жаман",
  "надоело", "отвратительно", "обман", "scam", "awful",
];
const POS = [
  "спасибо", "отлично", "good", "great", "рахмат", "сонун",
  "thanks", "thank you", "супер", "perfect",
];

export function analyzeSentiment(text: string): number {
  const t = text.toLowerCase();
  if (NEG.some((w) => t.includes(w))) return -0.8;
  if (POS.some((w) => t.includes(w))) return 0.8;
  return 0;
}
