"use client";

import Link from "next/link";
import Navbar from "@/components/Navbar";
import { useLanguage } from "@/components/LanguageContext";
import { signIn, useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

function RegisterInner() {
  const { t } = useLanguage();
  const { status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextUrl = searchParams.get("next") || "/dashboard";

  const hasGoogle = !!process.env.NEXT_PUBLIC_HAS_GOOGLE_AUTH;
  const hasGithub = !!process.env.NEXT_PUBLIC_HAS_GITHUB_AUTH;

  // Состояния для формы
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  
  // Состояния статуса
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (status === "authenticated") {
      router.push(nextUrl);
    }
  }, [status, router, nextUrl]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password) {
      setError("Пожалуйста, заполните все поля.");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      // 1. Отправляем запрос на регистрацию на наш API
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Не удалось создать аккаунт.");
      }

      setSuccess("Аккаунт успешно создан! Выполняется вход...");

      // 2. Выполняем авто-вход через NextAuth Credentials с повторной попыткой при микрозадержке БД
      let loginRes = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (loginRes?.error) {
        // Делаем паузу 1 секунду для завершения транзакции в БД Supabase и пробуем снова
        await new Promise((resolve) => setTimeout(resolve, 1000));
        loginRes = await signIn("credentials", {
          email,
          password,
          redirect: false,
        });
      }

      if (loginRes?.error) {
        throw new Error("Регистрация успешна, но автоматический вход не удался. Войдите вручную.");
      }

      router.push(nextUrl);

    } catch (err: any) {
      console.error("Signup error:", err);
      setError(err.message || "Произошла непредвиденная ошибка.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--background)] overflow-hidden transition-colors duration-300 flex flex-col">
      <Navbar />

      <main className="flex-1 flex items-center justify-center p-6 relative pt-24">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-purple-500/10 dark:bg-purple-500/10 rounded-full blur-3xl -z-10"></div>

        <div className="w-full max-w-md glass-panel p-10 rounded-3xl shadow-2xl border border-[var(--border)] fade-in-up relative z-10">
          
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold tracking-tight mb-2">{t.authPage.registerTitle}</h1>
            <p className="text-[var(--foreground)]/60 text-sm">{t.authPage.registerDesc}</p>
          </div>

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="block text-sm font-semibold text-[var(--foreground)]/80 mb-2">{t.authPage.name}</label>
              <input 
                type="text" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 border border-[var(--border)] rounded-xl text-sm focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 bg-[var(--surface)] transition-all"
                placeholder="Иван Иванов"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-[var(--foreground)]/80 mb-2">{t.authPage.email}</label>
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border border-[var(--border)] rounded-xl text-sm focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 bg-[var(--surface)] transition-all"
                placeholder="name@company.com"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-[var(--foreground)]/80 mb-2">{t.authPage.password}</label>
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border border-[var(--border)] rounded-xl text-sm focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 bg-[var(--surface)] transition-all"
                placeholder="••••••••"
                required
              />
            </div>

            {error && (
              <div className="bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20 rounded-xl p-3 text-xs font-semibold animate-fade-in">
                ⚠️ {error}
              </div>
            )}

            {success && (
              <div className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 rounded-xl p-3 text-xs font-semibold animate-fade-in">
                ✅ {success}
              </div>
            )}

            <button 
              type="submit"
              disabled={loading}
              className="w-full py-3 mt-4 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold text-sm shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 hover:-translate-y-0.5 transition-all duration-300 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer border-none"
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  Создание аккаунта...
                </>
              ) : (
                t.authPage.registerBtn
              )}
            </button>
          </form>

          <div className="mt-8 relative flex items-center justify-center border-t border-[var(--border)]">
             <span className="absolute bg-[var(--surface)] px-4 text-xs font-semibold text-[var(--foreground)]/50 uppercase tracking-wider">{t.authPage.orContinueWith}</span>
          </div>

          {(hasGoogle || hasGithub) ? (
            <div className="mt-8 flex gap-4">
               {hasGoogle && (
                 <button onClick={() => signIn('google', { callbackUrl: nextUrl })} className="flex-1 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--surface-hover)] hover:bg-[var(--surface)] transition-all flex items-center justify-center gap-2 font-semibold text-sm cursor-pointer">
                   <svg className="w-4 h-4" viewBox="0 0 24 24"><path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
                   Google
                 </button>
               )}
               {hasGithub && (
                 <button onClick={() => signIn('github', { callbackUrl: nextUrl })} className="flex-1 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--surface-hover)] hover:bg-[var(--surface)] transition-all flex items-center justify-center gap-2 font-semibold text-sm cursor-pointer">
                   <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" /></svg>
                   GitHub
                 </button>
               )}
            </div>
          ) : null}

          <p className="mt-8 text-center text-sm text-[var(--foreground)]/60">
            {t.authPage.hasAccount} <Link href="/login" className="font-bold text-purple-600 hover:text-purple-500 transition-colors">{t.authPage.signIn}</Link>
          </p>
        </div>
      </main>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={null}>
      <RegisterInner />
    </Suspense>
  );
}
