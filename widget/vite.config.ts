import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    lib: {
      entry: 'src/main.tsx',
      name: 'NexusWidget',
      fileName: 'widget',
      formats: ['iife'] // Сборка в один JS файл, который можно загрузить через <script>
    },
    rollupOptions: {
      // Все библиотеки (React, Three) компилируются внутрь бандла, чтобы клиенту не нужно было ничего устанавливать
      external: [],
    },
    cssCodeSplit: false, // CSS будет инжектиться через JS
  },
  define: {
    'process.env.NODE_ENV': '"production"'
  }
});
