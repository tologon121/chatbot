import { NextResponse } from "next/server";
import { db } from "@/lib/supabase-server";
import { analyzeSentiment, embedOne, generateReply } from "@/lib/rag";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MATCH_THRESHOLD = parseFloat(process.env.RAG_MATCH_THRESHOLD || "0.3");
const MATCH_COUNT = parseInt(process.env.RAG_MATCH_COUNT || "4");

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { widget_id, session_id, message, language } = body;
    if (!widget_id || !session_id || !message) {
      return NextResponse.json(
        { detail: "widget_id, session_id, message required" },
        { status: 400 },
      );
    }
    const widget = await db.getWidget(widget_id);
    if (!widget) {
      return NextResponse.json({ detail: "Widget not found" }, { status: 404 });
    }

    // Persist user message
    await db.insertMessage({
      id: crypto.randomUUID(),
      sessionId: session_id,
      role: "USER",
      content: message,
      sentiment: null,
      needsAttention: false,
      createdAt: new Date().toISOString(),
    });

    // Retrieve RAG context
    const qEmbedding = await embedOne(message);
    const matches = await db.matchChunks(
      widget_id,
      qEmbedding,
      MATCH_COUNT,
      MATCH_THRESHOLD,
    );
    const context = matches.map((m) => m.content).join("\n\n");

    // Generate reply
    const reply = await generateReply({
      context,
      userMessage: message,
      language: language || widget.language || "RU",
      persona: widget.persona,
    });
    const sentiment = analyzeSentiment(message);

    // Persist AI message
    await db.insertMessage({
      id: crypto.randomUUID(),
      sessionId: session_id,
      role: "AI",
      content: reply,
      sentiment,
      needsAttention: sentiment < -0.4,
      createdAt: new Date().toISOString(),
    });

    return NextResponse.json({ reply, sentiment });
  } catch (e: any) {
    return NextResponse.json(
      { detail: `AI provider error: ${e.message}` },
      { status: 502 },
    );
  }
}
