"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Page error:", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-[var(--background)] flex items-center justify-center p-6">
      <div className="glass-panel max-w-md w-full p-8 rounded-2xl border border-[var(--border)] text-center">
        <div className="text-5xl mb-4">⚠️</div>
        <h1 className="text-2xl font-bold mb-3">Что-то пошло не так</h1>
        <p className="text-sm text-[var(--foreground-muted)] mb-6 break-words">
          {error.message || "Неожиданная ошибка при загрузке страницы."}
        </p>
        {error.digest && (
          <p className="text-[10px] font-mono text-[var(--foreground-faint)] mb-6">
            ID: {error.digest}
          </p>
        )}
        <div className="flex flex-col sm:flex-row gap-2 justify-center">
          <button
            onClick={reset}
            className="px-5 py-2.5 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold text-sm cursor-pointer border-none"
          >
            Попробовать снова
          </button>
          <Link
            href="/"
            className="px-5 py-2.5 rounded-lg border border-[var(--border)] font-semibold text-sm text-[var(--foreground-muted)] hover:text-[var(--foreground)]"
          >
            На главную
          </Link>
        </div>
      </div>
    </div>
  );
}
