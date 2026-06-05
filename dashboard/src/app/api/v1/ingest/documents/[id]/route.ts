import { NextResponse } from "next/server";
import { db } from "@/lib/supabase-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

// This route serves BOTH:
//   GET    /api/v1/ingest/documents/{widget_id}  -> list docs for a widget
//   DELETE /api/v1/ingest/documents/{document_id} -> delete a document
// (The original FastAPI used the same path for both — keep the contract.)
export async function GET(_req: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  try {
    const docs = await db.listDocuments(id);
    return NextResponse.json(docs);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function DELETE(_req: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  try {
    await db.deleteDocument(id);
    return NextResponse.json({ status: "success" });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
