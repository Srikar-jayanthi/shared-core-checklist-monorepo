import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@checklist/core': path.resolve(__dirname, '../core/src/index.ts'),
    },
  },
  server: {
    port: 3000,
  },
});
