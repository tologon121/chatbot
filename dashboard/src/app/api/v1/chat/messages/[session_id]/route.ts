import { NextResponse } from "next/server";
import { db } from "@/lib/supabase-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ session_id: string }> };

export async function GET(_req: Request, ctx: Ctx) {
  const { session_id } = await ctx.params;
  try {
    const msgs = await db.listMessagesBySession(session_id);
    msgs.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    return NextResponse.json(msgs);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
