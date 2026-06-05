import { NextResponse } from "next/server";
import { db } from "@/lib/supabase-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const widgetId = body.widget_id;
    if (!widgetId) {
      return NextResponse.json({ detail: "widget_id required" }, { status: 400 });
    }
    const widget = await db.getWidget(widgetId);
    if (!widget) {
      return NextResponse.json({ detail: "Widget not found" }, { status: 404 });
    }
    if (!widget.isActive) {
      return NextResponse.json({ detail: "Widget is disabled" }, { status: 403 });
    }
    const sessionId = crypto.randomUUID();
    await db.insertSession({
      id: sessionId,
      widgetId,
      visitorId: body.visitor_id || null,
      createdAt: new Date().toISOString(),
    });
    return NextResponse.json({
      session_id: sessionId,
      widget_id: widgetId,
      greeting: widget.greeting,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
