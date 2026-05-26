"use client";

import Link from "next/link";
import Navbar from "@/components/Navbar";
import { useLanguage } from "@/components/LanguageContext";
import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function LoginPage() {
  const { t } = useLanguage();
  const { data: session, status } = useSession();
  const router = useRouter();

  // Состояния формы
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Состояния статуса
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (status === "authenticated") {
      router.push("/dashboard");
    }
  }, [status, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Пожалуйста, заполните все поля.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      // Вызываем стандартный signIn NextAuth с провайдером credentials
      const res = await signIn("credentials", {
        email,
        password,
        redirect: false, // Отключаем автоматический редирект для перехвата ошибок
      });

      if (res?.error) {
        // Выводим ошибку, полученную из CredentialsProvider authorize
        throw new Error(res.error || "Неверный e-mail или пароль.");
      }

      // Если ошибок нет, перенаправляем в личный кабинет
      router.push("/dashboard");

    } catch (err: any) {
      console.error("Login error:", err);
      // Убираем технические детали, оставляя только понятное сообщение
      const cleanMsg = err.message.replace("CredentialsSignin", "Неверный e-mail или пароль.");
      setError(cleanMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--background)] overflow-hidden transition-colors duration-300 flex flex-col">
      <Navbar />

      <main className="flex-1 flex items-center justify-center p-6 relative pt-24">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-500/10 dark:bg-indigo-500/10 rounded-full blur-3xl -z-10"></div>

        <div className="w-full max-w-md glass-panel p-10 rounded-3xl shadow-2xl border border-[var(--border)] fade-in-up relative z-10">
          
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold tracking-tight mb-2">{t.authPage.loginTitle}</h1>
            <p className="text-[var(--foreground)]/60 text-sm">{t.authPage.loginDesc}</p>
          </div>

          <form className="space-y-5" onSubmit={handleSubmit}>
            <div>
              <label className="block text-sm font-semibold text-[var(--foreground)]/80 mb-2">{t.authPage.email}</label>
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border border-[var(--border)] rounded-xl text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 bg-[var(--surface)] transition-all"
                placeholder="name@company.com"
                required
              />
            </div>
            
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-semibold text-[var(--foreground)]/80">{t.authPage.password}</label>
                <a href="#" className="text-xs font-semibold text-indigo-600 hover:text-indigo-500 transition-colors">{t.authPage.forgotPass}</a>
              </div>
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border border-[var(--border)] rounded-xl text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 bg-[var(--surface)] transition-all"
                placeholder="••••••••"
                required
              />
            </div>

            {error && (
              <div className="bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20 rounded-xl p-3 text-xs font-semibold animate-fade-in">
                ⚠️ {error}
              </div>
            )}

            <button 
              type="submit"
              disabled={loading}
              className="w-full py-3 mt-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold text-sm shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:-translate-y-0.5 transition-all duration-300 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer border-none"
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  Вход в систему...
                </>
              ) : (
                t.authPage.loginBtn
              )}
            </button>
          </form>

          <div className="mt-8 relative flex items-center justify-center border-t border-[var(--border)]">
             <span className="absolute bg-[var(--surface)] px-4 text-xs font-semibold text-[var(--foreground)]/50 uppercase tracking-wider">{t.authPage.orContinueWith}</span>
          </div>

          <div className="mt-8 flex gap-4">
             <button onClick={() => signIn('google', { callbackUrl: '/dashboard' })} className="flex-1 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--surface-hover)] hover:bg-[var(--surface)] transition-all flex items-center justify-center gap-2 font-semibold text-sm cursor-pointer">
               <svg className="w-4 h-4" viewBox="0 0 24 24"><path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
               Google
             </button>
             <button onClick={() => signIn('github', { callbackUrl: '/dashboard' })} className="flex-1 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--surface-hover)] hover:bg-[var(--surface)] transition-all flex items-center justify-center gap-2 font-semibold text-sm cursor-pointer">
               <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" /></svg>
               GitHub
             </button>
          </div>

          <p className="mt-8 text-center text-sm text-[var(--foreground)]/60">
            {t.authPage.noAccount} <Link href="/register" className="font-bold text-indigo-600 hover:text-indigo-500 transition-colors">{t.authPage.signUp}</Link>
          </p>
        </div>
      </main>
    </div>
  );
}
