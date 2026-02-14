
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // استفاده از مسیر نسبی باعث می‌شود اپلیکیشن در هر زیرپوشه‌ای (مثل وب) 
  // یا در ریشه اصلی (مثل اندروید) به درستی فایل‌های Assets را پیدا کند.
  base: './',
});
