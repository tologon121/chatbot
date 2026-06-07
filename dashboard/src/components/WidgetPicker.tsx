"use client";
import { useState } from "react";
import { useWidget } from "./WidgetContext";
export default function WidgetPicker() {
  const { widgets, currentId, select, createAndSelect, loading } = useWidget();
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const handleCreate = async () => {
    console.log("handleCreate called", newName);
    if (!newName.trim()) return;
    console.log("creating widget:", newName.trim());
    const w = await createAndSelect(newName.trim());
    console.log("created widget:", w);
    if (w) {
      setNewName("");
      setCreating(false);
    }
  };
  return (
    <div className="flex items-center gap-2">
      <span className="text-[11px] uppercase font-bold tracking-widest text-[var(--foreground-faint)] hidden sm:inline">
        Виджет:
      </span>
      <select
        value={currentId || ""}
        onChange={(e) => select(e.target.value)}
        disabled={loading || widgets.length === 0}
        className="px-3 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-sm font-mono outline-none focus:border-indigo-500 disabled:opacity-50 cursor-pointer max-w-[280px]"
      >
        {loading && <option>Загрузка…</option>}
        {!loading && widgets.length === 0 && <option>Нет виджетов</option>}
        {widgets.map((w) => (
          <option key={w.id} value={w.id}>
            {w.name} · {w.id}
          </option>
        ))}
      </select>
      {creating ? (
        <div className="flex items-center gap-1.5">
          <input
            autoFocus
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleCreate();
              if (e.key === "Escape") {
                setCreating(false);
                setNewName("");
              }
            }}
            placeholder="Название…"
            className="px-3 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-sm outline-none focus:border-indigo-500"
          />
          <button
            onClick={handleCreate}
            disabled={!newName.trim()}
            className="text-xs font-semibold px-2.5 py-1.5 rounded-md bg-indigo-500 text-white hover:bg-indigo-600 disabled:opacity-50 cursor-pointer border-none"
          >
            ✓
          </button>
          <button
            onClick={() => {
              setCreating(false);
              setNewName("");
            }}
            className="text-xs font-semibold px-2.5 py-1.5 rounded-md bg-[var(--surface-hover)] hover:bg-[var(--border)] cursor-pointer border-none"
          >
            ✕
          </button>
        </div>
      ) : (
        <button
          onClick={() => setCreating(true)}
          title="Создать новый виджет"
          className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-gradient-to-r from-indigo-500 to-violet-600 text-white hover:shadow-md cursor-pointer border-none whitespace-nowrap"
        >
          + Новый
        </button>
      )}
    </div>
  );
}
