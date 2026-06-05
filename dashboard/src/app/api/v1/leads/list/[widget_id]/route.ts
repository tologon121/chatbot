import { NextResponse } from "next/server";
import { db } from "@/lib/supabase-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ widget_id: string }> };

export async function GET(_req: Request, ctx: Ctx) {
  const { widget_id } = await ctx.params;
  try {
    const leads = await db.listLeads(widget_id);
    leads.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    return NextResponse.json(leads);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
