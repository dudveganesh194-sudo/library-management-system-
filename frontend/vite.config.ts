import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
  build: {
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('react-dom') || id.includes('react/')) return 'react-vendor';
            if (id.includes('react-router-dom')) return 'router';
            if (id.includes('@radix-ui')) return 'ui-radix';
            if (id.includes('recharts')) return 'charts';
            if (id.includes('@tanstack')) return 'query';
            if (id.includes('react-hook-form') || id.includes('@hookform') || id.includes('zod')) return 'forms';
            if (id.includes('axios') || id.includes('date-fns') || id.includes('clsx') || id.includes('tailwind-merge') || id.includes('class-variance-authority')) return 'utils';
          }
        },
      },
    },
  },
});

