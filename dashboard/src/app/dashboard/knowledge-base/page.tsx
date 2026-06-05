"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useLanguage } from "@/components/LanguageContext";
import { useWidget } from "@/components/WidgetContext";
import {
  DocumentRow,
  deleteDocument as apiDeleteDocument,
  listDocuments,
  uploadFile,
  uploadText,
} from "@/lib/api";

export default function KnowledgeBase() {
  const { t } = useLanguage();
  const { current: widget, currentId, loading: widgetsLoading } = useWidget();
  const [dragActive, setDragActive] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Состояния для редактора прямого текста
  const [title, setTitle] = useState("");
  const [textContent, setTextContent] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  // Состояния для загрузчика файлов
  const [uploadStatus, setUploadStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [uploadError, setUploadError] = useState("");

  // Состояния для списка документов
  const [documents, setDocuments] = useState<DocumentRow[]>([]);
  const [loadingDocs, setLoadingDocs] = useState(false);

  const fetchDocuments = useCallback(async () => {
    if (!currentId) {
      setDocuments([]);
      return;
    }
    try {
      setLoadingDocs(true);
      const data = await listDocuments(currentId);
      const sortedData = [...data].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
      setDocuments(sortedData);
    } catch (err) {
      console.error("Failed to fetch documents:", err);
    } finally {
      setLoadingDocs(false);
    }
  }, [currentId]);

  // Первичная загрузка и периодический опрос для обновления статусов PROCESSING
  useEffect(() => {
    fetchDocuments();

    const interval = setInterval(() => {
      setDocuments((prev) => {
        const hasProcessing = prev.some((doc) => doc.status === "PROCESSING");
        if (hasProcessing) fetchDocuments();
        return prev;
      });
    }, 5000);

    return () => clearInterval(interval);
  }, [fetchDocuments]);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const allowedExtensions = ['.txt', '.pdf', '.docx'];
      const filteredFiles = Array.from(e.dataTransfer.files).filter(file => {
        const ext = '.' + file.name.split('.').pop()?.toLowerCase();
        return allowedExtensions.includes(ext);
      });
      setFiles([...files, ...filteredFiles]);
    }
  };

  const onDropzoneClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFiles([...files, ...Array.from(e.target.files)]);
    }
  };

  const loadTemplate = () => {
    setTitle("Услуги и контакты туристического агентства KG VIP Travel");
    setTextContent(`ИНФОРМАЦИЯ О КОМПАНИИ:
Мы — KG VIP TRAVEL, премиум-агентство эксклюзивных туров по всему Кыргызстану. Наша цель — подарить клиентам незабываемые впечатления с максимальным комфортом.

НАШИ ЭКСКЛЮЗИВНЫЕ УСЛУГИ И СТОИМОСТЬ:
1. Иссык-Куль VIP Tour — 7 дней. Проживание в люксовых юртах с панорамным видом, аренда яхты, экскурсии по каньонам Сказка и Семеновское. Стоимость: от $1200 на человека.
2. Сон-Куль: Небесное озеро — 5 дней. Прогулки на породистых лошадях, дегустация национального кумыса, проживание в традиционных теплых юртах на высоте 3000 метров. Стоимость: от $800 на человека.
3. Ала-Арча: Горный треккинг — 3 дня. Пешие походы к кристальным водопадам, восхождение на ледники с опытным сертифицированным гидом-альпинистом. Стоимость: от $400 на человека.

КАК ЗАБРОНИРОВАТЬ ТУР (ИНСТРУКЦИЯ ДЛЯ КЛИЕНТА):
Шаг 1: Напишите нашему ИИ-помощнику в чате, какой тур вас интересует.
Шаг 2: ИИ-помощник ответит на ваши вопросы и предложит форму для заполнения.
Шаг 3: Введите ваш контактный номер телефона (в формате +996) и e-mail.
Шаг 4: Наш менеджер мгновенно свяжется с вами по WhatsApp/Telegram для подтверждения дат и деталей оплаты.

КОНТАКТЫ И АДРЕС:
- Телефон: +996 (555) 12-34-56
- Telegram/WhatsApp: @kg_vip_travel
- Адрес офиса: Кыргызстан, г. Бишкек, ул. Киевская 100
- Время работы: Пн-Сб с 09:00 до 20:00`);
  };

  // Отправка сырого текста на бэкенд
  const handleTrainAI = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentId) {
      setStatus("error");
      setErrorMessage("Сначала создайте или выберите виджет в шапке.");
      return;
    }
    if (!title.trim() || !textContent.trim()) {
      setStatus("error");
      setErrorMessage("Пожалуйста, заполните название документа и текст.");
      return;
    }

    setStatus("loading");
    setErrorMessage("");

    try {
      await uploadText(currentId, title, textContent);
      setStatus("success");
      setTitle("");
      setTextContent("");
      fetchDocuments();
      setTimeout(() => setStatus("idle"), 5000);
    } catch (err: any) {
      console.error("Ingest error:", err);
      setStatus("error");
      setErrorMessage(
        err.message ||
          "Не удалось соединиться с сервером обучения. Убедитесь, что бэкенд на порту 8000 запущен.",
      );
    }
  };

  // Загрузка бинарных файлов (PDF, DOCX, TXT) через FormData
  const handleTrainFiles = async () => {
    if (!currentId) {
      setUploadStatus("error");
      setUploadError("Сначала создайте или выберите виджет в шапке.");
      return;
    }
    if (files.length === 0) return;

    setUploadStatus("loading");
    setUploadError("");

    try {
      for (const file of files) {
        await uploadFile(currentId, file);
      }
      setUploadStatus("success");
      setFiles([]);
      fetchDocuments();
      setTimeout(() => setUploadStatus("idle"), 5000);
    } catch (err: any) {
      console.error("File upload error:", err);
      setUploadStatus("error");
      setUploadError(
        err.message ||
          "Не удалось загрузить файлы. Поддерживаются TXT, PDF, DOCX файлы до 10MB.",
      );
    }
  };

  // Удаление документа из Supabase
  const handleDeleteDocument = async (docId: string, docTitle: string) => {
    if (
      !confirm(
        `Вы действительно хотите удалить документ "${docTitle}"? Все связанные векторные чанки будут навсегда стерты.`,
      )
    ) {
      return;
    }

    try {
      await apiDeleteDocument(docId);
      setDocuments((prev) => prev.filter((doc) => doc.id !== docId));
    } catch (err: any) {
      console.error("Error deleting document:", err);
      alert(err.message || "Не удалось удалить документ.");
    }
  };

  return (
    <div className="fade-in-up pb-10">
      <header className="mb-10">
        <h2 className="text-3xl font-bold tracking-tight">{t.knowledgeBase.title}</h2>
        <p className="text-[var(--foreground)]/60 mt-2 text-sm">{t.knowledgeBase.desc}</p>
        {widget && (
          <div className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-xs text-indigo-700 dark:text-indigo-300">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
            Документы сохраняются в виджет <strong className="font-mono">{widget.id}</strong> ({widget.name})
          </div>
        )}
        {!widget && !widgetsLoading && (
          <div className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs text-amber-700 dark:text-amber-300">
            ⚠️ Нет ни одного виджета. Создайте его в правом верхнем углу, чтобы начать обучение.
          </div>
        )}
      </header>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-10 mb-10">
        
        {/* Левая колонка: Текстовый редактор */}
        <section className="glass-panel p-8 rounded-2xl flex flex-col justify-between hover:shadow-xl transition-shadow border border-[var(--border)] bg-[var(--surface)]/50">
          <div>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold flex items-center">
                <svg className="w-5 h-5 mr-3 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                Быстрое добавление знаний (Редактор)
              </h3>
              <button 
                onClick={loadTemplate}
                className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 transition-colors bg-indigo-500/10 hover:bg-indigo-500/20 px-3 py-1.5 rounded-lg border-none cursor-pointer"
              >
                ✨ Загрузить шаблон
              </button>
            </div>
            <p className="text-[var(--foreground)]/50 text-xs mb-6">
              Введите название и вставьте структурированный текст о вашем бизнесе. ИИ мгновенно разобьет его на векторные чанки и запомнит.
            </p>

            <form onSubmit={handleTrainAI} className="space-y-5">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[var(--foreground)]/60 mb-2">Название документа / Раздел</label>
                <input 
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Например: Услуги и цены туристической компании"
                  className="w-full px-4 py-3 border border-[var(--border)] rounded-xl text-sm focus:outline-none focus:border-indigo-500 bg-[var(--surface)] transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[var(--foreground)]/60 mb-2">Информация о бизнесе (Данные для обучения)</label>
                <textarea 
                  value={textContent}
                  onChange={(e) => setTextContent(e.target.value)}
                  rows={10}
                  placeholder="Вставьте сюда подробное описание вашего сайта, контакты, список услуг и инструкции..."
                  className="w-full px-4 py-3 border border-[var(--border)] rounded-xl text-sm focus:outline-none focus:border-indigo-500 bg-[var(--surface)] transition-all font-sans leading-relaxed resize-y"
                />
              </div>

              {status === "success" && (
                <div className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 rounded-xl p-4 text-xs font-medium animate-fade-in flex items-center gap-2">
                  <span className="text-base">✅</span>
                  <span>Данные успешно загружены! Начинается векторизация и сохранение в Supabase.</span>
                </div>
              )}

              {status === "error" && (
                <div className="bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20 rounded-xl p-4 text-xs font-medium animate-fade-in flex items-center gap-2">
                  <span className="text-base">⚠️</span>
                  <span>{errorMessage}</span>
                </div>
              )}

              <div className="flex justify-end">
                <button 
                  type="submit"
                  disabled={status === "loading"}
                  className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-8 py-3.5 rounded-xl text-sm font-bold shadow-md hover:shadow-lg transition-all duration-300 disabled:opacity-50 flex items-center gap-2 border-none cursor-pointer"
                >
                  {status === "loading" ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                      Обучение модели...
                    </>
                  ) : (
                    "📥 Обучить ИИ-ассистента"
                  )}
                </button>
              </div>
            </form>
          </div>
        </section>

        {/* Правая колонка: Загрузка файлов */}
        <section className="glass-panel p-8 rounded-2xl flex flex-col justify-between hover:shadow-xl transition-shadow border border-[var(--border)] bg-[var(--surface)]/50">
          <div>
            <h3 className="text-lg font-semibold mb-6 flex items-center">
              <svg className="w-5 h-5 mr-3 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
              Загрузка файлов (PDF, DOCX, TXT)
            </h3>
            <p className="text-[var(--foreground)]/50 text-xs mb-6">
              Перетащите готовые прайс-листы, PDF-презентации или текстовые файлы вашей компании. Файлы пройдут автоматическое чтение и векторизацию.
            </p>
            
            <input 
              type="file"
              ref={fileInputRef}
              onChange={handleFileInputChange}
              multiple
              accept=".txt,.pdf,.docx"
              className="hidden"
            />

            <div 
              onClick={onDropzoneClick}
              className={`border-2 border-dashed rounded-xl p-12 text-center transition-all duration-300 cursor-pointer ${
                dragActive ? "border-indigo-500 bg-indigo-500/10 scale-[1.02]" : "border-[var(--border)] hover:border-indigo-500/50 hover:bg-[var(--surface-hover)]"
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <div className="mx-auto w-16 h-16 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 text-indigo-600 dark:text-indigo-400 rounded-full flex items-center justify-center mb-6 shadow-inner">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
              </div>
              <p className="font-semibold text-lg mb-2">{t.knowledgeBase.dropZone}</p>
              <p className="text-[var(--foreground)]/50 text-sm">{t.knowledgeBase.dropZoneDesc}</p>
            </div>

            {uploadStatus === "success" && (
              <div className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 rounded-xl p-4 text-xs font-medium mt-5 animate-fade-in flex items-center gap-2">
                <span className="text-base">✅</span>
                <span>Файлы успешно отправлены на сервер и обрабатываются в Supabase!</span>
              </div>
            )}

            {uploadStatus === "error" && (
              <div className="bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20 rounded-xl p-4 text-xs font-medium mt-5 animate-fade-in flex items-center gap-2">
                <span className="text-base">⚠️</span>
                <span>{uploadError}</span>
              </div>
            )}

            {files.length > 0 && (
              <div className="mt-8 animate-fade-in">
                <h4 className="text-sm font-semibold mb-4 uppercase tracking-wider text-[var(--foreground)]/60">{t.knowledgeBase.processingQueue} ({files.length})</h4>
                <ul className="space-y-3">
                  {files.map((file, i) => (
                    <li key={i} className="flex items-center justify-between bg-[var(--surface)] px-5 py-3.5 rounded-xl border border-[var(--border)] shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex items-center gap-3">
                        <svg className="w-5 h-5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                        <span className="text-sm font-medium">{file.name}</span>
                      </div>
                      <span className="text-[10px] bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 px-3 py-1.5 rounded-full font-bold uppercase tracking-wider">
                        {file.name.split('.').pop()?.toUpperCase()}
                      </span>
                    </li>
                  ))}
                </ul>
                <div className="mt-6 flex justify-end">
                  <button 
                    onClick={handleTrainFiles}
                    disabled={uploadStatus === "loading"}
                    className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-8 py-3.5 rounded-xl text-sm font-bold hover:shadow-[0_0_20px_rgba(99,102,241,0.4)] transition-all duration-300 border-none cursor-pointer disabled:opacity-50 flex items-center gap-2"
                  >
                    {uploadStatus === "loading" ? (
                      <>
                        <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                        Загрузка и векторизация...
                      </>
                    ) : (
                      <>
                        <span>📥</span>
                        <span>{t.knowledgeBase.startTraining}</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </section>

      </div>

      {/* Новая секция: Список загруженных документов (Подключено к Supabase) */}
      <section className="glass-panel p-8 rounded-2xl border border-[var(--border)] bg-[var(--surface)]/30 hover:shadow-xl transition-shadow">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div>
            <h3 className="text-lg font-semibold flex items-center">
              <svg className="w-5 h-5 mr-3 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
              Ваша база знаний (Обученные документы в Supabase)
            </h3>
            <p className="text-[var(--foreground)]/50 text-xs mt-1">
              Актуальные документы, которые используются вашей AI RAG моделью для ответов на вопросы пользователей в чате.
            </p>
          </div>
          <button 
            onClick={fetchDocuments}
            disabled={loadingDocs}
            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg bg-[var(--surface-hover)] border border-[var(--border)] hover:bg-[var(--border)] transition-colors cursor-pointer disabled:opacity-50"
          >
            <svg className={`w-3.5 h-3.5 ${loadingDocs ? 'animate-spin text-indigo-500' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 8H17" /></svg>
            Обновить
          </button>
        </div>

        {loadingDocs && documents.length === 0 ? (
          <div className="py-12 text-center text-sm text-[var(--foreground)]/50 flex flex-col items-center justify-center gap-3">
            <span className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></span>
            Загрузка списка документов...
          </div>
        ) : documents.length === 0 ? (
          <div className="py-16 text-center border-2 border-dashed border-[var(--border)] rounded-xl bg-[var(--surface)]/20 text-sm text-[var(--foreground)]/40">
            📭 В базе знаний пока нет загруженных документов. Добавьте текст слева или загрузите файлы справа!
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-[var(--border)] bg-[var(--surface)]/40">
            <table className="w-full border-collapse text-left text-sm">
              <thead>
                <tr className="bg-[var(--surface-hover)] border-b border-[var(--border)] text-[var(--foreground)]/60 text-xs font-bold uppercase tracking-wider">
                  <th className="p-4">Название документа</th>
                  <th className="p-4">Тип</th>
                  <th className="p-4">Дата загрузки</th>
                  <th className="p-4">Статус векторизации</th>
                  <th className="p-4 text-right">Действие</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {documents.map((doc) => (
                  <tr key={doc.id} className="hover:bg-[var(--surface-hover)]/30 transition-colors">
                    <td className="p-4 font-semibold text-[var(--foreground)] truncate max-w-[280px]" title={doc.title}>
                      {doc.title}
                    </td>
                    <td className="p-4">
                      <span className="text-[10px] font-bold px-2 py-1 rounded bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                        {doc.type}
                      </span>
                    </td>
                    <td className="p-4 text-xs text-[var(--foreground)]/60">
                      {new Date(doc.createdAt).toLocaleString('ru-RU', {
                        day: '2-digit', month: '2-digit', year: 'numeric',
                        hour: '2-digit', minute: '2-digit'
                      })}
                    </td>
                    <td className="p-4">
                      {doc.status === "READY" ? (
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full">
                          ● Активен (RAG)
                        </span>
                      ) : doc.status === "PROCESSING" ? (
                        <span className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-full">
                          <span className="w-2.5 h-2.5 border-2 border-amber-600 dark:border-amber-400 border-t-transparent rounded-full animate-spin"></span>
                          Векторизация...
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-red-600 dark:text-red-400 bg-red-500/10 px-2.5 py-1 rounded-full">
                          ● Ошибка обработки
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-right">
                      <button
                        onClick={() => handleDeleteDocument(doc.id, doc.title)}
                        className="p-2 text-[var(--foreground)]/40 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all border-none cursor-pointer"
                        title="Удалить из базы знаний"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
