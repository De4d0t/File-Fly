import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: '0.0.0.0', // Allow accessing dev server from phone on LAN
    allowedHosts: true, // Allow fly.local and any local LAN hostname in Vite 6
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
