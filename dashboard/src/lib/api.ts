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
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      ...(init?.body && !(init.body instanceof FormData)
        ? { "Content-Type": "application/json" }
        : {}),
      ...(init?.headers || {}),
    },
  });
  if (!res.ok) {
    let detail = `${res.status} ${res.statusText}`;
    try {
      const j = await res.json();
      detail = j.detail || j.error || detail;
    } catch { /* ignore */ }
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
