import { NextResponse } from "next/server";
import { db } from "@/lib/supabase-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function genId(): string {
  return `wk_${crypto.randomUUID().replace(/-/g, "").slice(0, 10)}`;
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const ownerId = url.searchParams.get("owner_id");
  try {
    const widgets = await db.listWidgets(ownerId);
    return NextResponse.json(widgets);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const id = body.id || genId();
    if (!/^[a-zA-Z0-9_\-]{3,80}$/.test(id)) {
      return NextResponse.json(
        { detail: "Invalid widget id" },
        { status: 400 },
      );
    }
    if (!body.name || typeof body.name !== "string") {
      return NextResponse.json(
        { detail: "name is required" },
        { status: 400 },
      );
    }
    const widget = await db.insertWidget({
      id,
      name: body.name,
      color: body.color,
      language: body.language,
      position: body.position,
      isActive: body.is_active ?? true,
      allowedDomains: body.allowed_domains || [],
      persona: body.persona ?? null,
      greeting: body.greeting ?? null,
      leadMode: body.lead_mode ?? false,
      webhookUrl: body.webhook_url ?? null,
      ownerId: body.owner_id ?? null,
    });
    return NextResponse.json({ status: "success", widget });
  } catch (e: any) {
    return NextResponse.json(
      { detail: `Failed to create widget: ${e.message}` },
      { status: 500 },
    );
  }
}
