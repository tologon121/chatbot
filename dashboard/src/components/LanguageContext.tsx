"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

type Language = "EN" | "RU" | "KG";

interface LanguageContextType {
  lang: Language;
  setLang: (lang: Language) => void;
  theme: "light" | "dark";
  toggleTheme: () => void;
  t: any;
}

const translations = {
  EN: {
    nav: {
      features: "Features",
      pricing: "Pricing",
      demo: "Demo",
      integration: "Integration",
      login: "Log in",
      getStarted: "Get Started Free",
    },
    hero: {
      badge: "NexusAI v2.0 is now live",
      title1: "Turn visitors into leads with an",
      titleHighlight: "Intelligent AI Widget",
      desc: "Deploy a custom-trained AI assistant to your website in minutes. Automate support, capture high-quality leads, and speak to your customers in their language.",
      ctaPrimary: "Start Building Now",
      ctaSecondary: "View Live Demo",
      featuresTitle1: "Everything you need.",
      featuresTitle2: "Nothing you don't.",
      ctaSectionTitle: "Ready to ship your AI assistant?",
      ctaSectionDesc: "Free forever for hobby projects. No credit card required.",
      compatible: "Works with HTML, React, Next.js, Vue, WordPress, Tilda, Webflow.",
      statResponse: "avg response",
      statResolution: "resolution rate",
      statLanguages: "languages",
      statBundle: "bundle size",
    },
    featuresPage: {
      title: "Powerful Features",
      desc: "Everything you need to automate your customer support and capture leads.",
      f1Title: "Intelligent RAG AI",
      f1Desc: "Upload your documents and the AI instantly learns your business.",
      f2Title: "Smart Lead Capture",
      f2Desc: "Automatically collect user emails and phone numbers during chats.",
      f3Title: "Multi-Language Support",
      f3Desc: "Communicate fluently in Russian, Kyrgyz, and English.",
      f4Title: "Deep Analytics",
      f4Desc: "Track sentiment, intents, and resolution times in real-time.",
    },
    pricingPage: {
      title: "Simple, transparent pricing",
      desc: "Choose the plan that best fits your business.",
      starter: "Starter",
      starterPrice: "$0",
      pro: "Pro",
      proPrice: "$49",
      enterprise: "Enterprise",
      enterprisePrice: "$199",
      getStarted: "Get Started",
      perMonth: "/mo",
      features: "Included features:",
    },
    demoPage: {
      title: "Live Chatbot Demo",
      desc: "Test the AI widget below. Try asking questions about our products or pricing.",
      chatPlaceholder: "Ask me anything...",
      greeting: "Hello! Welcome to our website. How can I help you today?",
      online: "Online",
      liveDemo: "Live Demo",
      systemStatus: "System Status",
      aiCoreReady: "AI Core Online & Ready",
      errorMsg: "Failed to get a response. Please try again.",
      tryAsking: "Try asking:",
      suggestions: [
        "What are your prices?",
        "How does the RAG AI work?",
        "Can I try for free?",
      ],
      clearChat: "Clear",
    },
    authPage: {
      loginTitle: "Welcome back",
      loginDesc: "Log in to your NexusAI account",
      registerTitle: "Create an account",
      registerDesc: "Start building your AI widget today",
      email: "Email address",
      password: "Password",
      name: "Full Name",
      forgotPass: "Forgot password?",
      loginBtn: "Sign In",
      registerBtn: "Create Account",
      noAccount: "Don't have an account?",
      hasAccount: "Already have an account?",
      signUp: "Sign up",
      signIn: "Sign in",
      orContinueWith: "Or continue with",
    },
    sidebar: {
      overview: "Overview",
      knowledgeBase: "Knowledge Base",
      widgetSettings: "Widget Settings",
      integration: "Integration",
      analytics: "Analytics",
      signOut: "Sign Out",
    },
    dashboard: {
      title: "Overview",
      desc: "Monitor your widget performance and AI interactions.",
      totalConversations: "Total Conversations",
      leadsCaptured: "Leads Captured",
      avgResolution: "Avg. Resolution Time",
      interactionVolume: "Interaction Volume",
      recentLeads: "Recent Leads",
      viewAllLeads: "View All Leads →",
      last7Days: "Last 7 Days",
      last30Days: "Last 30 Days",
      chats: "chats",
      hot: "Hot",
      warm: "Warm",
      cold: "Cold",
      days: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    },
    knowledgeBase: {
      title: "Knowledge Base",
      desc: "Upload documents to train your RAG AI model.",
      dataSources: "Data Sources",
      dropZone: "Click to upload or drag and drop",
      dropZoneDesc: "PDF, DOCX, TXT (Max 10MB)",
      processingQueue: "Processing Queue",
      statusReady: "Ready",
      startTraining: "Start Training Model",
    },
    widgetSettings: {
      title: "Widget Settings",
      desc: "Configure your AI widget, choose a brand color, and integrate it into your site.",
      proBadge: "Pro Plan Active",
      appearance: "Appearance",
      primaryColor: "Primary Brand Color",
      defaultLanguage: "Default Language",
      leadMode: "Lead Generation Mode",
      leadModeDesc:
        "Actively capture contacts when user seems idle or asks specific questions.",
      embedScript: "Embed Script",
      embedDesc:
        "Paste this code right before the closing </body> tag on your site.",
      copyCode: "Copy Code",
      livePreview: "Live Preview",
      assistantName: "Nexus Assistant",
      online: "Online",
      typeMessage: "Type a message...",
      leadFormActive: "Lead capture form active",
      previewMsg1: "Hello! Welcome to our website. How can I help you today?",
      previewMsg2: "What are your prices?",
      previewMsg3:
        "Our prices start at $10/month. Please leave your number for more details.",
      widgetConfig: "Widget configuration",
      position: "Position",
      bottomRight: "Bottom right",
      bottomLeft: "Bottom left",
      widgetId: "Widget ID",
      allowedDomains: "Allowed domains",
      allowedDomainsHint:
        "One domain per line. Supports *.example.com. Empty = allow all.",
    },
    analytics: {
      title: "Analytics",
      desc: "Deep dive into your widget's data and user behavior.",
      sentiment: "User Sentiment",
      intents: "Popular Intents",
      languages: "Language Distribution",
      positive: "Positive",
      neutral: "Neutral",
      negative: "Negative",
      exportReport: "Export Report",
      pricingInquiry: "Pricing Inquiry",
      productSupport: "Product Support",
      featureRequest: "Feature Request",
      multiLangNote:
        "Multi-language support is handling queries across different regions.",
    },
  },
  RU: {
    nav: {
      features: "Возможности",
      pricing: "Цены",
      demo: "Демо",
      integration: "Интеграция",
      login: "Войти",
      getStarted: "Начать бесплатно",
    },
    hero: {
      badge: "NexusAI v2.0 запущен",
      title1: "Превратите посетителей в лидов с",
      titleHighlight: "Умным AI Виджетом",
      desc: "Разверните обученного ИИ-ассистента на вашем сайте за минуты. Автоматизируйте поддержку, собирайте качественные лиды и общайтесь с клиентами на их языке.",
      ctaPrimary: "Создать виджет",
      ctaSecondary: "Смотреть демо",
      featuresTitle1: "Всё, что нужно.",
      featuresTitle2: "Ничего лишнего.",
      ctaSectionTitle: "Готовы запустить AI-ассистента?",
      ctaSectionDesc: "Бесплатно навсегда для хобби-проектов. Карта не нужна.",
      compatible: "Работает с HTML, React, Next.js, Vue, WordPress, Tilda, Webflow.",
      statResponse: "среднее время ответа",
      statResolution: "процент решений",
      statLanguages: "языка",
      statBundle: "размер бандла",
    },
    featuresPage: {
      title: "Мощные возможности",
      desc: "Всё необходимое для автоматизации поддержки и сбора лидов.",
      f1Title: "Умный RAG AI",
      f1Desc: "Загрузите свои документы, и ИИ мгновенно изучит ваш бизнес.",
      f2Title: "Умный сбор лидов",
      f2Desc: "Автоматически собирайте email и телефоны во время общения.",
      f3Title: "Мультиязычность",
      f3Desc: "Свободное общение на русском, кыргызском и английском языках.",
      f4Title: "Глубокая аналитика",
      f4Desc:
        "Отслеживайте настроения, запросы и время ответа в реальном времени.",
    },
    pricingPage: {
      title: "Простые и прозрачные цены",
      desc: "Выберите тариф, который лучше всего подходит вашему бизнесу.",
      starter: "Старт",
      starterPrice: "$0",
      pro: "Профи",
      proPrice: "$49",
      enterprise: "Бизнес",
      enterprisePrice: "$199",
      getStarted: "Начать",
      perMonth: "/мес",
      features: "Включенные функции:",
    },
    demoPage: {
      title: "Живое демо чат-бота",
      desc: "Протестируйте AI-виджет ниже. Попробуйте задать вопросы о продуктах или ценах.",
      chatPlaceholder: "Задайте любой вопрос...",
      greeting: "Здравствуйте! Добро пожаловать. Чем я могу вам помочь сегодня?",
      online: "В сети",
      liveDemo: "Живое демо",
      systemStatus: "Статус системы",
      aiCoreReady: "AI Core в сети и готов",
      errorMsg: "Не удалось получить ответ. Попробуйте снова.",
      tryAsking: "Попробуйте спросить:",
      suggestions: [
        "Какие у вас цены?",
        "Как работает RAG AI?",
        "Можно попробовать бесплатно?",
      ],
      clearChat: "Очистить",
    },
    authPage: {
      loginTitle: "Добро пожаловать",
      loginDesc: "Войдите в свой аккаунт NexusAI",
      registerTitle: "Создать аккаунт",
      registerDesc: "Начните создавать свой AI-виджет сегодня",
      email: "Email",
      password: "Пароль",
      name: "Имя и Фамилия",
      forgotPass: "Забыли пароль?",
      loginBtn: "Войти",
      registerBtn: "Создать аккаунт",
      noAccount: "Нет аккаунта?",
      hasAccount: "Уже есть аккаунт?",
      signUp: "Зарегистрироваться",
      signIn: "Войти",
      orContinueWith: "Или войдите через",
    },
    sidebar: {
      overview: "Обзор",
      knowledgeBase: "База знаний",
      widgetSettings: "Настройки виджета",
      integration: "Интеграция",
      analytics: "Аналитика",
      signOut: "Выйти",
    },
    dashboard: {
      title: "Обзор",
      desc: "Отслеживайте эффективность виджета и работу ИИ.",
      totalConversations: "Всего диалогов",
      leadsCaptured: "Собрано лидов",
      avgResolution: "Ср. время ответа",
      interactionVolume: "Объем взаимодействий",
      recentLeads: "Последние лиды",
      viewAllLeads: "Все лиды →",
      last7Days: "За 7 дней",
      last30Days: "За 30 дней",
      chats: "чатов",
      hot: "Горячий",
      warm: "Тёплый",
      cold: "Холодный",
      days: ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"],
    },
    knowledgeBase: {
      title: "База знаний",
      desc: "Загрузите документы для обучения вашей RAG AI модели.",
      dataSources: "Источники данных",
      dropZone: "Нажмите для загрузки или перетащите файлы",
      dropZoneDesc: "PDF, DOCX, TXT (Макс. 10MB)",
      processingQueue: "Очередь обработки",
      statusReady: "Готов",
      startTraining: "Начать обучение модели",
    },
    widgetSettings: {
      title: "Настройки виджета",
      desc: "Настройте свой AI-виджет, выберите цвет бренда и интегрируйте на сайт.",
      proBadge: "Pro-тариф активен",
      appearance: "Внешний вид",
      primaryColor: "Основной цвет бренда",
      defaultLanguage: "Язык по умолчанию",
      leadMode: "Режим сбора лидов",
      leadModeDesc:
        "Активно собирать контакты, когда пользователь бездействует или задает конкретные вопросы.",
      embedScript: "Код для вставки",
      embedDesc:
        "Вставьте этот код прямо перед закрывающим тегом </body> на вашем сайте.",
      copyCode: "Скопировать код",
      livePreview: "Живое превью",
      assistantName: "Nexus Ассистент",
      online: "В сети",
      typeMessage: "Введите сообщение...",
      leadFormActive: "Форма сбора лидов активна",
      previewMsg1: "Здравствуйте! Добро пожаловать. Чем я могу помочь вам сегодня?",
      previewMsg2: "Какие у вас цены?",
      previewMsg3:
        "Наши цены начинаются от $10 в месяц. Пожалуйста, оставьте свой номер для деталей.",
      widgetConfig: "Конфигурация виджета",
      position: "Положение",
      bottomRight: "Снизу справа",
      bottomLeft: "Снизу слева",
      widgetId: "ID виджета",
      allowedDomains: "Разрешённые домены",
      allowedDomainsHint:
        "Один домен на строку. Поддерживается *.example.com. Пусто = разрешено всем.",
    },
    analytics: {
      title: "Аналитика",
      desc: "Глубокий анализ данных виджета и поведения пользователей.",
      sentiment: "Настроение пользователей",
      intents: "Популярные запросы",
      languages: "Распределение языков",
      positive: "Позитив",
      neutral: "Нейтральный",
      negative: "Негатив",
      exportReport: "Экспорт отчёта",
      pricingInquiry: "Вопрос о ценах",
      productSupport: "Техподдержка",
      featureRequest: "Запрос функции",
      multiLangNote:
        "Многоязычная поддержка успешно обрабатывает запросы из разных регионов.",
    },
  },
  KG: {
    nav: {
      features: "Мүмкүнчүлүктөр",
      pricing: "Баалар",
      demo: "Демо",
      integration: "Интеграция",
      login: "Кирүү",
      getStarted: "Акысыз баштоо",
    },
    hero: {
      badge: "NexusAI v2.0 ишке кирди",
      title1: "Конокторду кардарга айлантыңыз",
      titleHighlight: "Акылдуу AI Виджети",
      desc: "Вебсайтыңызга жекече үйрөтүлгөн AI-жардамчыны бир нече мүнөттө орнотуңуз. Колдоону автоматташтырып, сапаттуу кардарларды табыңыз.",
      ctaPrimary: "Азыр баштаңыз",
      ctaSecondary: "Демону көрүү",
      featuresTitle1: "Керектүүнүн баары.",
      featuresTitle2: "Керексиз эч нерсе жок.",
      ctaSectionTitle: "AI-жардамчыны ишке киргизүүгө даярсызбы?",
      ctaSectionDesc: "Хобби долбоорлору үчүн дайыма акысыз. Карта талап кылынбайт.",
      compatible: "HTML, React, Next.js, Vue, WordPress, Tilda, Webflow менен иштейт.",
      statResponse: "орт. жооп убактысы",
      statResolution: "чечилүү пайызы",
      statLanguages: "тил",
      statBundle: "бандл өлчөмү",
    },
    featuresPage: {
      title: "Күчтүү мүмкүнчүлүктөр",
      desc: "Кардарларды колдоону автоматташтыруу жана лиддерди чогултуу үчүн бардык нерсе.",
      f1Title: "Акылдуу RAG AI",
      f1Desc: "Документтериңизди жүктөңүз, AI бизнесиңизди дароо үйрөнөт.",
      f2Title: "Акылдуу лид чогултуу",
      f2Desc:
        "Баарлашуу учурунда электрондук почталарды жана телефон номерлерди автоматтык түрдө чогултуңуз.",
      f3Title: "Көп тилдүү колдоо",
      f3Desc: "Орус, кыргыз жана англис тилдеринде эркин баарлашыңыз.",
      f4Title: "Терең аналитика",
      f4Desc:
        "Маанайды, суроолорду жана жооп берүү убактысын реалдуу убакытта көзөмөлдөңүз.",
    },
    pricingPage: {
      title: "Жөнөкөй жана ачык баалар",
      desc: "Сиздин бизнесиңизге эң ылайыктуу тарифти тандаңыз.",
      starter: "Баштапкы",
      starterPrice: "$0",
      pro: "Профи",
      proPrice: "$49",
      enterprise: "Бизнес",
      enterprisePrice: "$199",
      getStarted: "Баштоо",
      perMonth: "/айына",
      features: "Киргизилген функциялар:",
    },
    demoPage: {
      title: "Жандуу чат-бот демосу",
      desc: "Төмөндөгү AI-виджетти сынап көрүңүз. Биздин өнүмдөр же баалар жөнүндө суроо бериңиз.",
      chatPlaceholder: "Сурооңузду бериңиз...",
      greeting:
        "Саламатсызбы! Биздин сайтка кош келиңиз. Сизге кандай жардам бере алам?",
      online: "Онлайн",
      liveDemo: "Жандуу демо",
      systemStatus: "Тутумдун абалы",
      aiCoreReady: "AI Core онлайн жана даяр",
      errorMsg: "Жооп алуу мүмкүн болгон жок. Кайра аракет кылыңыз.",
      tryAsking: "Суроо берип көрүңүз:",
      suggestions: [
        "Бааларыңыз кандай?",
        "RAG AI кантип иштейт?",
        "Акысыз байкап көрсөм болобу?",
      ],
      clearChat: "Тазалоо",
    },
    authPage: {
      loginTitle: "Кош келиңиз",
      loginDesc: "NexusAI аккаунтуңузга кириңиз",
      registerTitle: "Аккаунт түзүү",
      registerDesc: "AI-виджетиңизди бүгүн куруп баштаңыз",
      email: "Электрондук почта",
      password: "Сыр сөз",
      name: "Аты-жөнү",
      forgotPass: "Сыр сөздү унуттуңузбу?",
      loginBtn: "Кирүү",
      registerBtn: "Аккаунт түзүү",
      noAccount: "Аккаунтуңуз жокпу?",
      hasAccount: "Аккаунтуңуз барбы?",
      signUp: "Катталуу",
      signIn: "Кирүү",
      orContinueWith: "Же муну менен улантыңыз",
    },
    sidebar: {
      overview: "Жалпы маалымат",
      knowledgeBase: "Билим базасы",
      widgetSettings: "Виджет жөндөөлөрү",
      integration: "Интеграция",
      analytics: "Аналитика",
      signOut: "Чыгуу",
    },
    dashboard: {
      title: "Жалпы маалымат",
      desc: "Виджеттин натыйжалуулугун жана AI ишин көзөмөлдөңүз.",
      totalConversations: "Бардык маектер",
      leadsCaptured: "Лиддер жыйналды",
      avgResolution: "Орт. жооп убактысы",
      interactionVolume: "Өз ара аракеттенүү көлөмү",
      recentLeads: "Акыркы лиддер",
      viewAllLeads: "Бардык лиддер →",
      last7Days: "Акыркы 7 күн",
      last30Days: "Акыркы 30 күн",
      chats: "чаттар",
      hot: "Ысык",
      warm: "Жылуу",
      cold: "Суук",
      days: ["Дүй", "Шей", "Шар", "Бей", "Жум", "Иш", "Жек"],
    },
    knowledgeBase: {
      title: "Билим базасы",
      desc: "RAG AI моделин үйрөтүү үчүн документтерди жүктөңүз.",
      dataSources: "Маалымат булактары",
      dropZone: "Жүктөө үчүн басыңыз же файлдарды сүйрөңүз",
      dropZoneDesc: "PDF, DOCX, TXT (Макс. 10MB)",
      processingQueue: "Иштетүү кезеги",
      statusReady: "Даяр",
      startTraining: "Моделди үйрөтүп баштоо",
    },
    widgetSettings: {
      title: "Виджет жөндөөлөрү",
      desc: "AI-виджетиңизди жөндөңүз, бренддин түсүн тандап, сайтка орнотуңуз.",
      proBadge: "Pro тарифи активдүү",
      appearance: "Сырткы көрүнүшү",
      primaryColor: "Бренддин негизги түсү",
      defaultLanguage: "Демейки тил",
      leadMode: "Кардарларды чогултуу режими",
      leadModeDesc:
        "Колдонуучу бош турганда же атайын суроолорду бергенде байланыштарын чогултуу.",
      embedScript: "Орнотуу коду",
      embedDesc:
        "Бул кодду сайтыңыздагы жабылуучу </body> тегинин алдына коюңуз.",
      copyCode: "Кодду көчүрүү",
      livePreview: "Жандуу көрүнүш",
      assistantName: "Nexus Жардамчы",
      online: "Онлайн",
      typeMessage: "Билдирүү жазыңыз...",
      leadFormActive: "Кардар чогултуу формасы активдүү",
      previewMsg1:
        "Саламатсызбы! Биздин сайтка кош келиңиз. Сизге кандай жардам бере алам?",
      previewMsg2: "Бааларыңыз кандай?",
      previewMsg3:
        "Биздин баалар айына 10$ башталат. Кененирээк маалымат үчүн номериңизди калтырыңыз.",
      widgetConfig: "Виджет конфигурациясы",
      position: "Жайгашуу",
      bottomRight: "Ылдый оңдо",
      bottomLeft: "Ылдый солдо",
      widgetId: "Виджет ID",
      allowedDomains: "Уруксат берилген домендер",
      allowedDomainsHint:
        "Ар бир сап үчүн бир домен. *.example.com колдоосу бар. Бош = баарына уруксат.",
    },
    analytics: {
      title: "Аналитика",
      desc: "Виджеттин маалыматтарын жана колдонуучулардын жүрүм-турумун терең талдоо.",
      sentiment: "Колдонуучунун маанайы",
      intents: "Популярдуу суроолор",
      languages: "Тилдердин бөлүнүшү",
      positive: "Жакшы",
      neutral: "Нейтралдуу",
      negative: "Начар",
      exportReport: "Отчёт экспорттоо",
      pricingInquiry: "Баа жөнүндө суроо",
      productSupport: "Техникалык колдоо",
      featureRequest: "Функция суроосу",
      multiLangNote:
        "Көп тилдүү колдоо ар кандай аймактардан суроолорду ийгиликтүү иштетет.",
    },
  },
};

const LanguageContext = createContext<LanguageContextType | undefined>(
  undefined,
);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLang] = useState<Language>("RU");
  const [theme, setTheme] = useState<"light" | "dark">("dark");

  useEffect(() => {
    const savedLang = localStorage.getItem("nexus-lang") as Language;
    if (savedLang && ["EN", "RU", "KG"].includes(savedLang)) {
      setLang(savedLang);
    }

    const savedTheme = localStorage.getItem("nexus-theme") as "light" | "dark";
    if (savedTheme) {
      setTheme(savedTheme);
    }
  }, []);

  useEffect(() => {
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    localStorage.setItem("nexus-theme", theme);
  }, [theme]);

  const toggleTheme = () =>
    setTheme((prev) => (prev === "light" ? "dark" : "light"));

  const handleSetLang = (newLang: Language) => {
    setLang(newLang);
    localStorage.setItem("nexus-lang", newLang);
  };

  return (
    <LanguageContext.Provider
      value={{
        lang,
        setLang: handleSetLang,
        theme,
        toggleTheme,
        t: translations[lang],
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}
