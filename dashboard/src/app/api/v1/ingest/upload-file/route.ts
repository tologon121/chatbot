import { NextResponse } from "next/server";
import { db } from "@/lib/supabase-server";
import { embedBatch, splitText } from "@/lib/rag";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

async function parseFile(name: string, bytes: ArrayBuffer): Promise<string> {
  const lower = name.toLowerCase();
  if (lower.endsWith(".txt")) {
    return new TextDecoder("utf-8", { fatal: false }).decode(bytes);
  }
  // PDF / DOCX parsing in serverless is non-trivial without extra deps.
  // For the demo we surface a friendly error so the user knows.
  throw new Error(
    `Формат ${lower.split(".").pop()} поддерживается только при ` +
      `использовании отдельного ai-core бэкенда. Загрузите .txt или ` +
      `используйте «Быстрое добавление знаний» (вставка текстом).`,
  );
}

export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const widgetId = form.get("widget_id") as string | null;
    const file = form.get("file") as File | null;
    if (!widgetId || !file) {
      return NextResponse.json(
        { detail: "widget_id and file required" },
        { status: 400 },
      );
    }
    const name = file.name || "uploaded.txt";
    const bytes = await file.arrayBuffer();

    let text: string;
    try {
      text = await parseFile(name, bytes);
    } catch (e: any) {
      return NextResponse.json({ detail: e.message }, { status: 400 });
    }

    const docId = crypto.randomUUID();
    const ext = name.toLowerCase().split(".").pop();
    const type = ext === "pdf" ? "PDF" : ext === "docx" ? "DOCX" : "TXT";
    await db.insertDocument({
      id: docId,
      widgetId,
      title: name,
      type,
      status: "PROCESSING",
      createdAt: new Date().toISOString(),
    });

    try {
      const chunks = splitText(text);
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
      console.warn("[Nexus] ingest file failed:", e);
      await db.setDocumentStatus(docId, "FAILED");
    }

    return NextResponse.json({
      status: "success",
      document_id: docId,
      title: name,
      type,
    });
  } catch (e: any) {
    return NextResponse.json({ detail: e.message }, { status: 500 });
  }
}
