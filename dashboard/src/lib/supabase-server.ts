/**
 * Server-only data layer for Nexus AI.
 *
 * Exposes a small set of typed functions over either a real Supabase project
 * (when SUPABASE_URL + a JWT key are configured) or an in-memory mock store
 * (so the Vercel demo works out of the box without any database).
 *
 * The mock store is pinned to globalThis so it survives Next.js HMR in dev
 * and lives for the duration of a Vercel serverless invocation. (Cold
 * starts wipe it — that's fine for a public demo.)
 */
import { createClient, SupabaseClient } from "@supabase/supabase-js";

type Row = Record<string, any>;
type Store = Record<string, Row[]>;

const DEMO_WIDGET_KB = `О NEXUS AI:
Nexus AI — SaaS-платформа встраиваемых чат-ботов с RAG-поиском по вашей базе знаний. Виджет добавляется одним тегом <script>, работает в Shadow DOM и не ломает стили клиентского сайта.

ТАРИФЫ:
- Starter: $0/мес, до 1000 диалогов, базовый RAG.
- Pro: $49/мес, до 10000 диалогов, lead capture, RU/EN/KG.
- Enterprise: $199/мес, безлимит, white-label, SLA 99.9%.

ВОЗМОЖНОСТИ:
Мультиязычность, SSE-стриминг, lead-mode, persona, аналитика, webhook-интеграции с AmoCRM/Bitrix24/Telegram.

БЫСТРЫЙ СТАРТ:
1) Зарегистрируйтесь.
2) Загрузите документы в Knowledge Base.
3) Вставьте сниппет перед </body>.

КОНТАКТЫ:
Email: support@nexusai.example.com, Telegram: @NexusAI_Support.`;

declare global {
  // eslint-disable-next-line no-var
  var __nexus_store: Store | undefined;
}

function seedStore(): Store {
  const now = new Date().toISOString();
  const demoDocId = "00000000-0000-0000-0000-000000000001";
  const chunks = DEMO_WIDGET_KB.split("\n\n")
    .map((s) => s.trim())
    .filter(Boolean);
  return {
    Widget: [
      {
        id: "wk_demo",
        ownerId: null,
        name: "Nexus Demo Widget",
        color: "#4f46e5",
        language: "RU",
        position: "bottom-right",
        isActive: true,
        allowedDomains: [],
        persona:
          "Ты дружелюбный демо-ассистент Nexus AI. Отвечай кратко (2-3 предложения).",
        greeting: "Здравствуйте! Я демо-ассистент Nexus AI. Чем могу помочь?",
        leadMode: true,
        webhookUrl: null,
        createdAt: now,
      },
      {
        id: "usr_osh_tour_2026",
        ownerId: null,
        name: "KG VIP Travel (sandbox)",
        color: "#6366f1",
        language: "RU",
        position: "bottom-right",
        isActive: true,
        allowedDomains: [],
        persona: null,
        greeting: "Здравствуйте! Я ассистент KG VIP Travel.",
        leadMode: true,
        webhookUrl: null,
        createdAt: now,
      },
      {
        id: "wk_1a2b3c4d5e",
        ownerId: null,
        name: "Default Widget",
        color: "#4f46e5",
        language: "RU",
        position: "bottom-right",
        isActive: true,
        allowedDomains: [],
        persona: null,
        greeting: "Здравствуйте! Чем могу помочь?",
        leadMode: false,
        webhookUrl: null,
        createdAt: now,
      },
    ],
    Document: [
      {
        id: demoDocId,
        widgetId: "wk_demo",
        title: "Nexus AI — quick facts",
        type: "RAW_TEXT",
        status: "READY",
        createdAt: now,
      },
    ],
    DocumentChunk: chunks.map((content, i) => ({
      id: `00000000-0000-0000-0000-${String(i + 2).padStart(12, "0")}`,
      documentId: demoDocId,
      content,
      embedding: null,
    })),
    ChatSession: [],
    Message: [],
    Lead: [],
  };
}

function getStore(): Store {
  if (!globalThis.__nexus_store) {
    globalThis.__nexus_store = seedStore();
    console.log("[Nexus mock] Seeded in-memory store");
  }
  return globalThis.__nexus_store;
}

// ---------------------------------------------------------------------------
// Supabase client (or null if not configured)
// ---------------------------------------------------------------------------
let _supabase: SupabaseClient | null | undefined;

function getSupabase(): SupabaseClient | null {
  if (_supabase !== undefined) return _supabase;
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const looksLikeJwt = key && key.startsWith("eyJ");
  if (!url || !key || url.includes("your-supabase") || !looksLikeJwt) {
    _supabase = null;
    return null;
  }
  try {
    _supabase = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    return _supabase;
  } catch (e) {
    console.warn("[Nexus] Failed to init Supabase client:", e);
    _supabase = null;
    return null;
  }
}

// ---------------------------------------------------------------------------
// Public DB interface — used by route handlers
// ---------------------------------------------------------------------------
export type Widget = {
  id: string;
  ownerId: string | null;
  name: string;
  color: string;
  language: string;
  position: string;
  isActive: boolean;
  allowedDomains: string[];
  persona: string | null;
  greeting: string | null;
  leadMode: boolean;
  webhookUrl: string | null;
  createdAt: string;
};

export type DocumentRow = {
  id: string;
  widgetId: string;
  title: string;
  type: string;
  status: "PROCESSING" | "READY" | "FAILED";
  createdAt: string;
};

export type ChunkRow = {
  id: string;
  documentId: string;
  content: string;
  embedding: number[] | null;
};

export type ChatSession = {
  id: string;
  widgetId: string;
  visitorId: string | null;
  createdAt: string;
};

export type Message = {
  id: string;
  sessionId: string;
  role: "USER" | "AI" | "SYSTEM";
  content: string;
  sentiment: number | null;
  needsAttention: boolean;
  createdAt: string;
};

export type Lead = {
  id: string;
  widgetId: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  context: string | null;
  isSent: boolean;
  createdAt: string;
};

export const db = {
  isMock: () => getSupabase() === null,

  // ---- Widget ----
  async listWidgets(ownerId?: string | null): Promise<Widget[]> {
    const sb = getSupabase();
    if (sb) {
      let q = sb.from("Widget").select("*");
      if (ownerId) q = q.eq("ownerId", ownerId);
      const { data, error } = await q;
      if (error) throw new Error(error.message);
      return (data || []) as Widget[];
    }
    const store = getStore();
    return store.Widget.filter((w) =>
      ownerId ? w.ownerId === ownerId : true,
    ) as Widget[];
  },

  async getWidget(id: string): Promise<Widget | null> {
    const sb = getSupabase();
    if (sb) {
      const { data, error } = await sb
        .from("Widget")
        .select("*")
        .eq("id", id)
        .limit(1);
      if (error) throw new Error(error.message);
      return ((data && data[0]) || null) as Widget | null;
    }
    return (getStore().Widget.find((w) => w.id === id) || null) as Widget | null;
  },

  async insertWidget(row: Partial<Widget> & { id: string; name: string }): Promise<Widget> {
    const full = {
      ownerId: null,
      color: "#4f46e5",
      language: "RU",
      position: "bottom-right",
      isActive: true,
      allowedDomains: [],
      persona: null,
      greeting: null,
      leadMode: false,
      webhookUrl: null,
      createdAt: new Date().toISOString(),
      ...row,
    };
    const sb = getSupabase();
    if (sb) {
      const { data, error } = await sb.from("Widget").insert(full).select();
      if (error) throw new Error(error.message);
      return (data?.[0] || full) as Widget;
    }
    getStore().Widget.push(full);
    return full as Widget;
  },

  async updateWidget(id: string, patch: Partial<Widget>): Promise<Widget | null> {
    const sb = getSupabase();
    if (sb) {
      const { data, error } = await sb
        .from("Widget")
        .update(patch)
        .eq("id", id)
        .select();
      if (error) throw new Error(error.message);
      return ((data && data[0]) || null) as Widget | null;
    }
    const store = getStore();
    const w = store.Widget.find((x) => x.id === id);
    if (!w) return null;
    Object.assign(w, patch);
    return w as Widget;
  },

  async deleteWidget(id: string): Promise<void> {
    const sb = getSupabase();
    if (sb) {
      const { error } = await sb.from("Widget").delete().eq("id", id);
      if (error) throw new Error(error.message);
      return;
    }
    const s = getStore();
    s.Widget = s.Widget.filter((w) => w.id !== id);
    const docIds = new Set(
      s.Document.filter((d) => d.widgetId === id).map((d) => d.id),
    );
    s.Document = s.Document.filter((d) => d.widgetId !== id);
    s.DocumentChunk = s.DocumentChunk.filter((c) => !docIds.has(c.documentId));
    const sessIds = new Set(
      s.ChatSession.filter((x) => x.widgetId === id).map((x) => x.id),
    );
    s.ChatSession = s.ChatSession.filter((x) => x.widgetId !== id);
    s.Message = s.Message.filter((m) => !sessIds.has(m.sessionId));
    s.Lead = s.Lead.filter((l) => l.widgetId !== id);
  },

  // ---- Document ----
  async listDocuments(widgetId: string): Promise<DocumentRow[]> {
    const sb = getSupabase();
    if (sb) {
      const { data, error } = await sb
        .from("Document")
        .select("*")
        .eq("widgetId", widgetId);
      if (error) throw new Error(error.message);
      return (data || []) as DocumentRow[];
    }
    return getStore().Document.filter(
      (d) => d.widgetId === widgetId,
    ) as DocumentRow[];
  },

  async insertDocument(row: DocumentRow): Promise<void> {
    const sb = getSupabase();
    if (sb) {
      const { error } = await sb.from("Document").insert(row);
      if (error) throw new Error(error.message);
      return;
    }
    getStore().Document.push(row);
  },

  async setDocumentStatus(
    id: string,
    status: "PROCESSING" | "READY" | "FAILED",
  ): Promise<void> {
    const sb = getSupabase();
    if (sb) {
      const { error } = await sb
        .from("Document")
        .update({ status })
        .eq("id", id);
      if (error) throw new Error(error.message);
      return;
    }
    const doc = getStore().Document.find((d) => d.id === id);
    if (doc) doc.status = status;
  },

  async deleteDocument(id: string): Promise<void> {
    const sb = getSupabase();
    if (sb) {
      const { error } = await sb.from("Document").delete().eq("id", id);
      if (error) throw new Error(error.message);
      return;
    }
    const s = getStore();
    s.Document = s.Document.filter((d) => d.id !== id);
    s.DocumentChunk = s.DocumentChunk.filter((c) => c.documentId !== id);
  },

  async insertChunks(rows: ChunkRow[]): Promise<void> {
    if (!rows.length) return;
    const sb = getSupabase();
    if (sb) {
      const { error } = await sb.from("DocumentChunk").insert(rows);
      if (error) throw new Error(error.message);
      return;
    }
    getStore().DocumentChunk.push(...rows);
  },

  async matchChunks(
    widgetId: string,
    queryEmbedding: number[],
    matchCount: number,
    matchThreshold: number,
  ): Promise<{ id: string; content: string; similarity: number }[]> {
    const sb = getSupabase();
    if (sb) {
      const { data, error } = await sb.rpc("match_document_chunks", {
        query_embedding: queryEmbedding,
        match_threshold: matchThreshold,
        match_count: matchCount,
        p_widget_id: widgetId,
      });
      if (error) throw new Error(error.message);
      return data || [];
    }
    // Mock: return any chunks for the widget's READY documents
    const store = getStore();
    const docIds = new Set(
      store.Document.filter(
        (d) => d.widgetId === widgetId && d.status === "READY",
      ).map((d) => d.id),
    );
    return store.DocumentChunk.filter((c) => docIds.has(c.documentId))
      .slice(0, matchCount)
      .map((c) => ({
        id: c.id,
        content: c.content,
        similarity: 0.85,
      }));
  },

  // ---- ChatSession + Message ----
  async insertSession(row: ChatSession): Promise<void> {
    const sb = getSupabase();
    if (sb) {
      const { error } = await sb.from("ChatSession").insert(row);
      if (error) throw new Error(error.message);
      return;
    }
    getStore().ChatSession.push(row);
  },

  async listSessions(widgetId: string): Promise<ChatSession[]> {
    const sb = getSupabase();
    if (sb) {
      const { data, error } = await sb
        .from("ChatSession")
        .select("*")
        .eq("widgetId", widgetId);
      if (error) throw new Error(error.message);
      return (data || []) as ChatSession[];
    }
    return getStore().ChatSession.filter(
      (s) => s.widgetId === widgetId,
    ) as ChatSession[];
  },

  async insertMessage(row: Message): Promise<void> {
    const sb = getSupabase();
    if (sb) {
      const { error } = await sb.from("Message").insert(row);
      if (error) throw new Error(error.message);
      return;
    }
    getStore().Message.push(row);
  },

  async listMessagesBySession(sessionId: string): Promise<Message[]> {
    const sb = getSupabase();
    if (sb) {
      const { data, error } = await sb
        .from("Message")
        .select("*")
        .eq("sessionId", sessionId);
      if (error) throw new Error(error.message);
      return (data || []) as Message[];
    }
    return getStore().Message.filter(
      (m) => m.sessionId === sessionId,
    ) as Message[];
  },

  async listMessagesByWidget(widgetId: string): Promise<Message[]> {
    const sessions = await this.listSessions(widgetId);
    const ids = new Set(sessions.map((s) => s.id));
    const sb = getSupabase();
    if (sb) {
      const { data, error } = await sb.from("Message").select("*");
      if (error) throw new Error(error.message);
      return (data || []).filter((m: any) => ids.has(m.sessionId)) as Message[];
    }
    return getStore().Message.filter((m) => ids.has(m.sessionId)) as Message[];
  },

  // ---- Lead ----
  async insertLead(row: Lead): Promise<void> {
    const sb = getSupabase();
    if (sb) {
      const { error } = await sb.from("Lead").insert(row);
      if (error) throw new Error(error.message);
      return;
    }
    getStore().Lead.push(row);
  },

  async listLeads(widgetId: string): Promise<Lead[]> {
    const sb = getSupabase();
    if (sb) {
      const { data, error } = await sb
        .from("Lead")
        .select("*")
        .eq("widgetId", widgetId);
      if (error) throw new Error(error.message);
      return (data || []) as Lead[];
    }
    return getStore().Lead.filter((l) => l.widgetId === widgetId) as Lead[];
  },

  async deleteLead(id: string): Promise<void> {
    const sb = getSupabase();
    if (sb) {
      const { error } = await sb.from("Lead").delete().eq("id", id);
      if (error) throw new Error(error.message);
      return;
    }
    const s = getStore();
    s.Lead = s.Lead.filter((l) => l.id !== id);
  },
};
