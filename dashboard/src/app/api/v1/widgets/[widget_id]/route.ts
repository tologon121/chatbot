import { NextResponse } from "next/server";
import { db } from "@/lib/supabase-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ widget_id: string }> };

export async function GET(_req: Request, ctx: Ctx) {
  const { widget_id } = await ctx.params;
  try {
    const widget = await db.getWidget(widget_id);
    if (!widget) {
      return NextResponse.json({ detail: "Widget not found" }, { status: 404 });
    }
    return NextResponse.json(widget);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function PUT(req: Request, ctx: Ctx) {
  const { widget_id } = await ctx.params;
  try {
    const body = await req.json();
    const patch: any = {};
    if (body.name !== undefined) patch.name = body.name;
    if (body.color !== undefined) patch.color = body.color;
    if (body.language !== undefined) patch.language = body.language;
    if (body.position !== undefined) patch.position = body.position;
    if (body.is_active !== undefined) patch.isActive = body.is_active;
    if (body.allowed_domains !== undefined)
      patch.allowedDomains = body.allowed_domains;
    if (body.persona !== undefined) patch.persona = body.persona;
    if (body.greeting !== undefined) patch.greeting = body.greeting;
    if (body.lead_mode !== undefined) patch.leadMode = body.lead_mode;
    if (body.webhook_url !== undefined) patch.webhookUrl = body.webhook_url;
    if (Object.keys(patch).length === 0) {
      return NextResponse.json({ detail: "Nothing to update" }, { status: 400 });
    }
    const widget = await db.updateWidget(widget_id, patch);
    if (!widget) {
      return NextResponse.json({ detail: "Widget not found" }, { status: 404 });
    }
    return NextResponse.json({ status: "success", widget });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function DELETE(_req: Request, ctx: Ctx) {
  const { widget_id } = await ctx.params;
  try {
    await db.deleteWidget(widget_id);
    return NextResponse.json({ status: "success" });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
