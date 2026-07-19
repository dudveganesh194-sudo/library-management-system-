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
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'router': ['react-router-dom'],
          'ui-radix': [
            '@radix-ui/react-dialog',
            '@radix-ui/react-dropdown-menu',
            '@radix-ui/react-select',
            '@radix-ui/react-tabs',
            '@radix-ui/react-alert-dialog',
            '@radix-ui/react-popover',
            '@radix-ui/react-tooltip',
            '@radix-ui/react-checkbox',
            '@radix-ui/react-switch',
            '@radix-ui/react-avatar',
            '@radix-ui/react-label',
            '@radix-ui/react-separator',
            '@radix-ui/react-slot',
          ],
          'charts': ['recharts'],
          'query': ['@tanstack/react-query'],
          'forms': ['react-hook-form', '@hookform/resolvers', 'zod'],
          'utils': ['axios', 'date-fns', 'clsx', 'tailwind-merge', 'class-variance-authority'],
        },
      },
    },
  },
});

