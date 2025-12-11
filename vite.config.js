import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ command }) => {
  // Для production (build) используем base path для GitHub Pages
  // Для development используем корень для удобства
  const base = command === 'build' ? '/acoustic_calc/' : '/';
  
  return {
    plugins: [react()],
    base,
    server: {
      port: 5173,
      open: true, // Автоматически открывать браузер
      proxy: {
        // Все запросы на /api пойдут на backend http://localhost:3005
        '/api': {
          target: 'http://localhost:3005',
          changeOrigin: true,
        },
      },
    },
  };
});
