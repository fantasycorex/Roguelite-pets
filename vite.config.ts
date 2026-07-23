/// <reference types="vitest" />
import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@core': path.resolve(__dirname, './src/core'),
      '@data': path.resolve(__dirname, './src/data'),
      '@graphics': path.resolve(__dirname, './src/graphics'),
      '@scenes': path.resolve(__dirname, './src/scenes'),
      '@types': path.resolve(__dirname, './src/types'),
    },
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
  server: {
    host: true,
    port: 3000,
    open: false,
  },
  test: {
    environment: 'node',
    globals: true,
  },
});
