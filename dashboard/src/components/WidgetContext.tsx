"use client";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  Widget,
  createWidget as apiCreateWidget,
  listWidgets,
} from "@/lib/api";
import { getSupabaseClient } from "@/lib/supabase";
type WidgetCtx = {
  widgets: Widget[];
  currentId: string | null;
  current: Widget | null;
  loading: boolean;
  error: string | null;
  select: (id: string) => void;
  refresh: () => Promise<void>;
  createAndSelect: (name: string) => Promise<Widget | null>;
};
const Ctx = createContext<WidgetCtx | null>(null);
const STORAGE_KEY = "nexus_current_widget_id";
export function WidgetProvider({ children }: { children: React.ReactNode }) {
  const [widgets, setWidgets] = useState<Widget[]>([]);
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const supabase = getSupabaseClient();
      const { data: { user } } = await supabase.auth.getUser();
      const list = await listWidgets(user?.id);
      setWidgets(list);
      const saved =
        typeof window !== "undefined"
          ? localStorage.getItem(STORAGE_KEY)
          : null;
      const found = saved && list.find((w) => w.id === saved);
      const next = found ? saved! : list[0]?.id || null;
      setCurrentId(next);
    } catch (e: any) {
      setError(e.message || "Failed to load widgets");
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    refresh();
  }, [refresh]);
  const select = useCallback((id: string) => {
    setCurrentId(id);
    try {
      localStorage.setItem(STORAGE_KEY, id);
    } catch { /* ignore */ }
  }, []);
  const createAndSelect = useCallback(
    async (name: string) => {
      try {
        const supabase = getSupabaseClient();
        const { data: { user } } = await supabase.auth.getUser();
        const res = await apiCreateWidget({ name, ownerId: user?.id });
        const w = res.widget;
        setWidgets((prev) => [...prev, w]);
        select(w.id);
        return w;
      } catch (e: any) {
        setError(e.message || "Failed to create widget");
        return null;
      }
    },
    [select],
  );
  const value = useMemo<WidgetCtx>(
    () => ({
      widgets,
      currentId,
      current: widgets.find((w) => w.id === currentId) || null,
      loading,
      error,
      select,
      refresh,
      createAndSelect,
    }),
    [widgets, currentId, loading, error, select, refresh, createAndSelect],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
export function useWidget() {
  const ctx = useContext(Ctx);
  if (!ctx)
    throw new Error("useWidget must be used inside <WidgetProvider>");
  return ctx;
}
