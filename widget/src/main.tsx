/**
 * Nexus AI Widget — bootstrap script.
 *
 * Embed on any website:
 *   <script
 *     src="https://cdn.example.com/widget.iife.js"
 *     data-widget-id="wk_xxx"
 *     data-api-url="https://api.example.com"   (optional, defaults to public host)
 *     data-color="#4f46e5"
 *     data-lang="RU"
 *     data-position="bottom-right"             (bottom-right | bottom-left)
 *     data-greeting="Привет! Чем помочь?"      (optional override)
 *     data-lead-mode="true"
 *     data-title="Nexus AI"
 *     defer
 *   ></script>
 *
 * Or programmatically:
 *   <script src=".../widget.iife.js" defer></script>
 *   <script>
 *     window.NexusAI.init({
 *       widgetId: 'wk_xxx',
 *       apiUrl: 'https://api.example.com',
 *       color: '#4f46e5',
 *       lang: 'RU',
 *       position: 'bottom-right',
 *       leadMode: true,
 *     });
 *   </script>
 *
 * Global API:
 *   window.NexusAI.open()
 *   window.NexusAI.close()
 *   window.NexusAI.toggle()
 *   window.NexusAI.destroy()
 *   window.NexusAI.send(text)
 */
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import styles from './index.css?inline';

export type NexusConfig = {
  widgetId: string;
  apiUrl?: string;
  color?: string;
  lang?: 'RU' | 'KG' | 'EN' | string;
  position?: 'bottom-right' | 'bottom-left';
  greeting?: string;
  leadMode?: boolean;
  title?: string;
};

const DEFAULT_API_URL = 'https://api.nexusai.example.com';
const CONTAINER_ID = 'nexus-ai-widget-container';

type WidgetController = {
  open: () => void;
  close: () => void;
  toggle: () => void;
  send: (text: string) => void;
  destroy: () => void;
  config: Required<NexusConfig>;
};

let currentController: WidgetController | null = null;

function readScriptConfig(): NexusConfig | null {
  const tag =
    (document.currentScript as HTMLScriptElement | null) ||
    document.querySelector<HTMLScriptElement>('script[data-widget-id]');
  if (!tag) return null;
  const get = (k: string) => tag.getAttribute(k) || undefined;
  const widgetId = get('data-widget-id');
  if (!widgetId) return null;
  return {
    widgetId,
    apiUrl: get('data-api-url'),
    color: get('data-color'),
    lang: get('data-lang'),
    position: (get('data-position') as NexusConfig['position']) || undefined,
    greeting: get('data-greeting'),
    leadMode: get('data-lead-mode') === 'true',
    title: get('data-title'),
  };
}

function mount(cfg: NexusConfig): WidgetController {
  if (currentController) currentController.destroy();

  const fullCfg: Required<NexusConfig> = {
    widgetId: cfg.widgetId,
    apiUrl: cfg.apiUrl || DEFAULT_API_URL,
    color: cfg.color || '#4f46e5',
    lang: cfg.lang || 'RU',
    position: cfg.position || 'bottom-right',
    greeting: cfg.greeting || '',
    leadMode: cfg.leadMode ?? false,
    title: cfg.title || 'Nexus AI',
  };

  // 1. Контейнер
  const container = document.createElement('div');
  container.id = CONTAINER_ID;
  container.style.position = 'fixed';
  container.style.bottom = '24px';
  container.style[fullCfg.position === 'bottom-left' ? 'left' : 'right'] = '24px';
  container.style.zIndex = '2147483647';
  document.body.appendChild(container);

  // 2. Shadow DOM для изоляции стилей
  const shadowRoot = container.attachShadow({ mode: 'open' });
  const styleTag = document.createElement('style');
  styleTag.textContent = styles;
  shadowRoot.appendChild(styleTag);
  const reactRoot = document.createElement('div');
  reactRoot.id = 'nexus-react-root';
  shadowRoot.appendChild(reactRoot);

  // 3. Канал управления извне (open/close/send)
  const events = new EventTarget();
  const root = ReactDOM.createRoot(reactRoot);
  root.render(
    <React.StrictMode>
      <App config={fullCfg} controlBus={events} />
    </React.StrictMode>,
  );

  const fire = (name: string, detail?: unknown) =>
    events.dispatchEvent(new CustomEvent(name, { detail }));

  currentController = {
    open: () => fire('open'),
    close: () => fire('close'),
    toggle: () => fire('toggle'),
    send: (text: string) => fire('send', text),
    destroy: () => {
      root.unmount();
      container.remove();
      if (currentController) currentController = null;
    },
    config: fullCfg,
  };
  return currentController;
}

// Глобальный API
const api = {
  init: (cfg: NexusConfig) => mount(cfg),
  open: () => currentController?.open(),
  close: () => currentController?.close(),
  toggle: () => currentController?.toggle(),
  send: (text: string) => currentController?.send(text),
  destroy: () => currentController?.destroy(),
  get config() {
    return currentController?.config;
  },
};

(window as any).NexusAI = api;

// Авто-инициализация по data-* атрибутам, если они есть
function autoInit() {
  const cfg = readScriptConfig();
  if (cfg) mount(cfg);
}

if (document.readyState === 'complete' || document.readyState === 'interactive') {
  autoInit();
} else {
  document.addEventListener('DOMContentLoaded', autoInit);
}
