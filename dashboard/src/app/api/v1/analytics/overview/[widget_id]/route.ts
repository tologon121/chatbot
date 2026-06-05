import { NextResponse } from "next/server";
import { db } from "@/lib/supabase-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ widget_id: string }> };

const INTENT_KEYWORDS: Record<string, string[]> = {
  "Pricing Inquiry": [
    "цен", "стоимость", "тариф", "сколько", "price", "cost", "pricing",
    "плата", "оплат",
  ],
  "Product Support": [
    "поддержк", "проблем", "не работает", "ошибк", "помог",
    "issue", "support", "broken", "help",
  ],
  "Feature Request": [
    "функция", "хочу", "добавьте", "feature", "add", "request", "wish",
  ],
  "Sales Inquiry": [
    "купить", "заказать", "оформить", "buy", "order", "purchase",
  ],
  "Greeting": ["привет", "здравствуй", "hello", "hi", "салам"],
};

function classifyIntent(text: string): string {
  const t = (text || "").toLowerCase();
  for (const [intent, kws] of Object.entries(INTENT_KEYWORDS)) {
    if (kws.some((k) => t.includes(k))) return intent;
  }
  return "Other";
}

export async function GET(_req: Request, ctx: Ctx) {
  const { widget_id } = await ctx.params;
  try {
    const sessions = await db.listSessions(widget_id);
    const leads = await db.listLeads(widget_id);
    const msgs = await db.listMessagesByWidget(widget_id);

    // 7-day chart by session createdAt
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    const perDay = new Map<string, number>();
    for (const s of sessions) {
      const d = new Date(s.createdAt);
      d.setUTCHours(0, 0, 0, 0);
      const k = d.toISOString().slice(0, 10);
      perDay.set(k, (perDay.get(k) || 0) + 1);
    }
    const chart7d: { date: string; weekday: string; count: number }[] = [];
    const wd = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setUTCDate(d.getUTCDate() - i);
      const k = d.toISOString().slice(0, 10);
      chart7d.push({ date: k, weekday: wd[d.getUTCDay()], count: perDay.get(k) || 0 });
    }

    // Sentiment buckets
    const aiSentiments = msgs
      .filter((m) => m.role === "AI" && m.sentiment !== null)
      .map((m) => m.sentiment as number);
    const pos = aiSentiments.filter((s) => s > 0.2).length;
    const neg = aiSentiments.filter((s) => s < -0.2).length;
    const neu = Math.max(0, aiSentiments.length - pos - neg);
    const sentTotal = pos + neg + neu || 1;
    const sentiment = {
      positive_pct: Math.round((100 * pos) / sentTotal),
      neutral_pct: Math.round((100 * neu) / sentTotal),
      negative_pct: Math.round((100 * neg) / sentTotal),
      sample_size: aiSentiments.length,
    };

    // Top intents from USER messages
    const intents = new Map<string, number>();
    for (const m of msgs) {
      if (m.role !== "USER") continue;
      const tag = classifyIntent(m.content);
      intents.set(tag, (intents.get(tag) || 0) + 1);
    }
    const top_intents = [...intents.entries()]
      .filter(([k]) => k !== "Other")
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([label, count]) => ({ label, count }));
    if (top_intents.length === 0 && intents.size > 0) {
      top_intents.push(
        ...[...intents.entries()]
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5)
          .map(([label, count]) => ({ label, count })),
      );
    }

    // Language distribution by USER content heuristic
    const langCounts = { RU: 0, EN: 0, KG: 0 } as Record<string, number>;
    for (const m of msgs) {
      if (m.role !== "USER") continue;
      const t = m.content || "";
      if (/[өүңӨҮҢ]/.test(t)) langCounts.KG++;
      else if (/[а-яА-Я]/.test(t)) langCounts.RU++;
      else if (/[a-zA-Z]/.test(t)) langCounts.EN++;
    }
    const langTotal =
      langCounts.RU + langCounts.EN + langCounts.KG || 1;
    const languages = (["RU", "EN", "KG"] as const).map((code) => ({
      code,
      pct: Math.round((100 * langCounts[code]) / langTotal),
    }));

    // Recent leads (5 newest)
    const recent_leads = [...leads]
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, 5)
      .map((l) => ({
        id: l.id,
        name: l.name,
        email: l.email,
        phone: l.phone,
        createdAt: l.createdAt,
      }));

    // Avg resolution time
    const bySess = new Map<string, typeof msgs>();
    for (const m of msgs) {
      const arr = bySess.get(m.sessionId) || [];
      arr.push(m);
      bySess.set(m.sessionId, arr);
    }
    const durations: number[] = [];
    for (const ms of bySess.values()) {
      ms.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
      for (let i = 0; i < ms.length - 1; i++) {
        if (ms[i].role === "USER" && ms[i + 1].role === "AI") {
          const dt =
            (new Date(ms[i + 1].createdAt).getTime() -
              new Date(ms[i].createdAt).getTime()) /
            1000;
          if (dt >= 0) durations.push(dt);
        }
      }
    }
    const avg_resolution_sec = durations.length
      ? Math.round(durations.reduce((s, x) => s + x, 0) / durations.length)
      : 0;

    return NextResponse.json({
      widget_id,
      totals: {
        conversations: sessions.length,
        leads: leads.length,
        messages: msgs.length,
        avg_resolution_sec,
      },
      chart_7d: chart7d,
      sentiment,
      top_intents,
      languages,
      recent_leads,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
