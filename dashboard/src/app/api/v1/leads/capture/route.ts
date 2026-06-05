import { NextResponse } from "next/server";
import { db } from "@/lib/supabase-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { widget_id, name, email, phone, context } = body;
    if (!widget_id) {
      return NextResponse.json({ detail: "widget_id required" }, { status: 400 });
    }
    if (!email && !phone) {
      return NextResponse.json(
        { detail: "Either phone or email is required" },
        { status: 400 },
      );
    }
    const widget = await db.getWidget(widget_id);
    if (!widget) {
      return NextResponse.json({ detail: "Widget not found" }, { status: 404 });
    }
    if (!widget.isActive) {
      return NextResponse.json({ detail: "Widget is disabled" }, { status: 403 });
    }
    await db.insertLead({
      id: crypto.randomUUID(),
      widgetId: widget_id,
      name: name || null,
      email: email || null,
      phone: phone || null,
      context: context || "User requested manager contact",
      isSent: false,
      createdAt: new Date().toISOString(),
    });

    // Fire-and-forget webhook (best effort)
    if (widget.webhookUrl) {
      const payload = {
        event: "new_lead",
        widget_id,
        lead: { name, email, phone, context },
        source: "Nexus AI Widget",
      };
      fetch(widget.webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }).catch((e) => console.warn("[Nexus] webhook send failed:", e));
    }

    return NextResponse.json({ status: "success", message: "Lead captured" });
  } catch (e: any) {
    return NextResponse.json({ detail: e.message }, { status: 500 });
  }
}
