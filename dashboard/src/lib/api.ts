/**
 * Thin client over the AI Core REST API.
 * Configure with NEXT_PUBLIC_API_URL (defaults to http://localhost:8000).
 */
const RAW_BASE =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
export const API_BASE = RAW_BASE.replace(/\/$/, "");

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

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${API_BASE}${path}`, {
      ...init,
      headers: {
        ...(init?.body && !(init.body instanceof FormData)
          ? { "Content-Type": "application/json" }
          : {}),
        ...(init?.headers || {}),
      },
    });
  } catch (e: any) {
    // Network error — most likely the AI Core URL is misconfigured.
    throw new Error(
      `Не удалось подключиться к AI Core (${API_BASE}). ` +
        `Проверьте NEXT_PUBLIC_API_URL и доступность бэкенда.`,
    );
  }
  if (!res.ok) {
    let detail = `${res.status} ${res.statusText}`;
    try {
      const j = await res.json();
      detail = j.detail || j.error || detail;
    } catch { /* ignore */ }
    // Annotate 404s so the user sees what URL failed
    if (res.status === 404) {
      detail = `Эндпойнт не найден на бэкенде (${API_BASE}${path}). Возможно, ai-core ещё не задеплоен или версия устарела.`;
    }
    throw new Error(detail);
  }
  return res.json() as Promise<T>;
}

// ---------------- Widgets ----------------
export const listWidgets = (ownerId?: string) =>
  apiFetch<Widget[]>(
    `/api/v1/widgets/${ownerId ? `?owner_id=${encodeURIComponent(ownerId)}` : ""}`,
  );

export const getWidget = (id: string) =>
  apiFetch<Widget>(`/api/v1/widgets/${encodeURIComponent(id)}`);

export const createWidget = (payload: Partial<Widget> & { name: string }) =>
  apiFetch<{ status: string; widget: Widget }>(`/api/v1/widgets/`, {
    method: "POST",
    body: JSON.stringify({
      id: payload.id,
      name: payload.name,
      color: payload.color,
      language: payload.language,
      position: payload.position,
      is_active: payload.isActive,
      allowed_domains: payload.allowedDomains,
      persona: payload.persona,
      greeting: payload.greeting,
      lead_mode: payload.leadMode,
      webhook_url: payload.webhookUrl,
      owner_id: payload.ownerId,
    }),
  });

export const updateWidget = (id: string, payload: Partial<Widget>) =>
  apiFetch<{ status: string; widget: Widget }>(
    `/api/v1/widgets/${encodeURIComponent(id)}`,
    {
      method: "PUT",
      body: JSON.stringify({
        name: payload.name,
        color: payload.color,
        language: payload.language,
        position: payload.position,
        is_active: payload.isActive,
        allowed_domains: payload.allowedDomains,
        persona: payload.persona,
        greeting: payload.greeting,
        lead_mode: payload.leadMode,
        webhook_url: payload.webhookUrl,
      }),
    },
  );

export const deleteWidget = (id: string) =>
  apiFetch<{ status: string; message: string }>(
    `/api/v1/widgets/${encodeURIComponent(id)}`,
    { method: "DELETE" },
  );

// ---------------- Knowledge base ----------------
export const listDocuments = (widgetId: string) =>
  apiFetch<DocumentRow[]>(
    `/api/v1/ingest/documents/${encodeURIComponent(widgetId)}`,
  );

export const uploadText = (widgetId: string, title: string, content: string) =>
  apiFetch<{ status: string; document_id: string }>(
    `/api/v1/ingest/upload-text`,
    {
      method: "POST",
      body: JSON.stringify({
        widget_id: widgetId,
        title,
        text_content: content,
      }),
    },
  );

export async function uploadFile(widgetId: string, file: File) {
  const form = new FormData();
  form.append("widget_id", widgetId);
  form.append("file", file);
  return apiFetch<{ status: string; document_id: string; title: string }>(
    `/api/v1/ingest/upload-file`,
    { method: "POST", body: form },
  );
}

export const deleteDocument = (id: string) =>
  apiFetch<{ status: string; message: string }>(
    `/api/v1/ingest/documents/${encodeURIComponent(id)}`,
    { method: "DELETE" },
  );

// ---------------- Analytics ----------------
export type AnalyticsOverview = {
  widget_id: string;
  totals: {
    conversations: number;
    leads: number;
    messages: number;
    avg_resolution_sec: number;
  };
  chart_7d: { date: string; weekday: string; count: number }[];
  sentiment: {
    positive_pct: number;
    neutral_pct: number;
    negative_pct: number;
    sample_size: number;
  };
  top_intents: { label: string; count: number }[];
  languages: { code: string; pct: number }[];
  recent_leads: {
    id: string;
    name: string | null;
    email: string | null;
    phone: string | null;
    createdAt: string;
  }[];
};

export const getAnalytics = (widgetId: string) =>
  apiFetch<AnalyticsOverview>(
    `/api/v1/analytics/overview/${encodeURIComponent(widgetId)}`,
  );

// ---------------- Leads ----------------
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

export const listLeads = (widgetId: string) =>
  apiFetch<Lead[]>(`/api/v1/leads/list/${encodeURIComponent(widgetId)}`);

// ---------------- Conversations ----------------
export type ChatSessionRow = {
  id: string;
  widgetId: string;
  visitorId: string | null;
  createdAt: string;
  messageCount?: number;
  lastMessage?: string;
};

export type MessageRow = {
  id: string;
  sessionId: string;
  role: "USER" | "AI" | "SYSTEM";
  content: string;
  sentiment: number | null;
  needsAttention: boolean | null;
  createdAt: string;
};

export const listSessions = (widgetId: string) =>
  apiFetch<ChatSessionRow[]>(
    `/api/v1/chat/sessions/${encodeURIComponent(widgetId)}`,
  );

export const listMessages = (sessionId: string) =>
  apiFetch<MessageRow[]>(
    `/api/v1/chat/messages/${encodeURIComponent(sessionId)}`,
  );
