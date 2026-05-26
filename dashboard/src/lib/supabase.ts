import { createClient } from '@supabase/supabase-js';

// Хранилище для единственного экземпляра (Singleton) клиента Supabase
let supabaseInstance: ReturnType<typeof createClient> | null = null;

/**
 * Возвращает безопасный клиент Supabase.
 * Внедрена ленивая (lazy) инициализация, чтобы предотвратить сбои сборки (build stage)
 * в средах, где отсутствуют или не загружены переменные окружения (.env).
 */
export function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Проверка на отсутствие переменных окружения или плейсхолдеры
  if (
    !supabaseUrl || 
    !supabaseAnonKey || 
    supabaseUrl.includes("your-supabase") || 
    supabaseAnonKey.includes("your-supabase")
  ) {
    // В режиме разработки или во время статического анализа (build) выводим предупреждение
    if (process.env.NODE_ENV !== 'production') {
      console.warn(
        "[Resilient Supabase] Внимание: Отсутствуют валидные NEXT_PUBLIC_SUPABASE_URL или NEXT_PUBLIC_SUPABASE_ANON_KEY. Инициализирован безопасный мок-клиент для сборки."
      );
    }
    
    // Возвращаем временный рабочий инстанс для защиты процесса сборки Next.js от фатальных падений
    return createClient(
      supabaseUrl || "https://placeholder-url.supabase.co",
      supabaseAnonKey || "placeholder-anon-key-that-is-long-enough-to-not-fail-validation"
    );
  }

  // Создаем инстанс только при первом реальном вызове
  if (!supabaseInstance) {
    supabaseInstance = createClient(supabaseUrl, supabaseAnonKey);
  }

  return supabaseInstance;
}
