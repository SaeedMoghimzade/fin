
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // تنظیم مسیر پایه برای GitHub Pages
  base: '/fin/',
});
