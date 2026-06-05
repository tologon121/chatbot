import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[var(--background)] flex items-center justify-center p-6">
      <div className="text-center max-w-md">
        <div className="text-8xl font-black tracking-tighter text-gradient mb-4 leading-none">
          404
        </div>
        <h1 className="text-2xl font-bold mb-3">Страница не найдена</h1>
        <p className="text-sm text-[var(--foreground-muted)] mb-8">
          Ссылка, по которой вы перешли, устарела или никогда не существовала.
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold text-sm shadow-lg"
        >
          ← Вернуться на главную
        </Link>
      </div>
    </div>
  );
}
