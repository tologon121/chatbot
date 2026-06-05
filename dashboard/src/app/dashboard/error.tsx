"use client";

import { useEffect } from "react";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Dashboard error:", error);
  }, [error]);

  return (
    <div className="p-8">
      <div className="glass-panel p-8 rounded-2xl border border-red-500/30 bg-red-500/5 text-center max-w-lg mx-auto">
        <div className="text-4xl mb-3">⚠️</div>
        <h2 className="text-xl font-bold mb-2">Не удалось загрузить страницу</h2>
        <p className="text-sm text-[var(--foreground-muted)] mb-4 break-words">
          {error.message}
        </p>
        <button
          onClick={reset}
          className="px-4 py-2 rounded-lg bg-indigo-500 text-white font-semibold text-sm cursor-pointer border-none"
        >
          Повторить
        </button>
      </div>
    </div>
  );
}
