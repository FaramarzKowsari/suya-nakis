import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // اگر نام مخزن گیت‌هاب شما چیزی غیر از suya-nakis است، عبارت زیر را تغییر دهید
  base: '/suya-nakis/', 
})