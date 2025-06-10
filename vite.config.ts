import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
      '@/frontend': path.resolve(__dirname, './frontend'),
      '@/lib': path.resolve(__dirname, './lib'),
      '@/hooks': path.resolve(__dirname, './hooks'),
    },
  },
  // Define environment variables
  define: {
    'import.meta.env.VITE_CONVEX_URL': JSON.stringify(process.env.VITE_CONVEX_URL || 'https://silent-snail-247.convex.cloud'),
  },
}); 