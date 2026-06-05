import { NextResponse } from "next/server";
import { db } from "@/lib/supabase-server";
import { embedBatch, splitText } from "@/lib/rag";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const { widget_id, title, text_content } = await req.json();
    if (!widget_id || !title || !text_content) {
      return NextResponse.json(
        { detail: "widget_id, title, text_content required" },
        { status: 400 },
      );
    }
    const docId = crypto.randomUUID();
    await db.insertDocument({
      id: docId,
      widgetId: widget_id,
      title,
      type: "RAW_TEXT",
      status: "PROCESSING",
      createdAt: new Date().toISOString(),
    });

    // Process inline — Vercel doesn't have BackgroundTasks. Stays under 60s
    // even for moderately sized docs because embeddings are batched.
    try {
      const chunks = splitText(text_content);
      if (chunks.length === 0) throw new Error("Empty document");
      const embeddings = await embedBatch(chunks);
      await db.insertChunks(
        chunks.map((content, i) => ({
          id: crypto.randomUUID(),
          documentId: docId,
          content,
          embedding: embeddings[i] || null,
        })),
      );
      await db.setDocumentStatus(docId, "READY");
    } catch (e) {
      console.warn("[Nexus] ingest failed for", docId, e);
      await db.setDocumentStatus(docId, "FAILED");
    }

    return NextResponse.json({
      status: "success",
      document_id: docId,
      message: "Document processed",
    });
  } catch (e: any) {
    return NextResponse.json({ detail: e.message }, { status: 500 });
  }
}
