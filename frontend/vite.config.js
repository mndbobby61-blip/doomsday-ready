import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// ডেভেলপমেন্টে /api ডাক ব্যাকএন্ডে পাঠিয়ে দেয়, তাই CORS ঝামেলা নেই।
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: { '/api': process.env.API_URL || 'http://localhost:4000' },
  },
});