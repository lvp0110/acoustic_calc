import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // Все запросы на /api пойдут на backend http://localhost:3005
      '/api': {
        target: 'http://localhost:3005',
        changeOrigin: true,
      },
    },
  },
});
