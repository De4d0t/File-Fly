import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: '0.0.0.0', // Allow accessing dev server from phone on LAN
    proxy: {
      '/api': {
        target: 'http://localhost:53316',
        changeOrigin: true,
      },
      '/ws': {
        target: 'ws://localhost:53316',
        ws: true,
      },
    },
  },
});
