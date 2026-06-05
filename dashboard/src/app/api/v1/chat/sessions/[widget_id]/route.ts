import { NextResponse } from "next/server";
import { db } from "@/lib/supabase-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ widget_id: string }> };

export async function GET(_req: Request, ctx: Ctx) {
  const { widget_id } = await ctx.params;
  try {
    const sessions = await db.listSessions(widget_id);
    const allMsgs = await db.listMessagesByWidget(widget_id);
    const grouped: Record<string, typeof allMsgs> = {};
    for (const m of allMsgs) {
      (grouped[m.sessionId] = grouped[m.sessionId] || []).push(m);
    }
    const enriched = sessions
      .map((s) => {
        const msgs = (grouped[s.id] || []).sort((a, b) =>
          a.createdAt.localeCompare(b.createdAt),
        );
        return {
          ...s,
          messageCount: msgs.length,
          lastMessage: msgs.length ? msgs[msgs.length - 1].content : null,
        };
      })
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    return NextResponse.json(enriched);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
