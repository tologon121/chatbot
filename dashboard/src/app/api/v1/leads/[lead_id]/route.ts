import { NextResponse } from "next/server";
import { db } from "@/lib/supabase-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ lead_id: string }> };

export async function DELETE(_req: Request, ctx: Ctx) {
  const { lead_id } = await ctx.params;
  try {
    await db.deleteLead(lead_id);
    return NextResponse.json({ status: "success" });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
