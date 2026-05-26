import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(req: Request) {
  try {
    const { name, email, password } = await req.json();

    if (!name || !email || !password) {
      return NextResponse.json({ error: "Пожалуйста, заполните все поля." }, { status: 400 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      return NextResponse.json({ error: "Ключи подключения к базе данных Supabase не настроены." }, { status: 500 });
    }

    // Инициализируем клиент Supabase
    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    // Регистрируем пользователя через официальное API Supabase Auth
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name: name, // Сохраняем имя пользователя в метаданных
        }
      }
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ 
      success: true, 
      user: {
        id: data.user?.id,
        email: data.user?.email,
        name: data.user?.user_metadata?.name || name
      },
      message: "Регистрация успешна!" 
    });

  } catch (err: any) {
    console.error("Registration endpoint error:", err);
    return NextResponse.json({ error: err.message || "Внутренняя ошибка сервера" }, { status: 500 });
  }
}
