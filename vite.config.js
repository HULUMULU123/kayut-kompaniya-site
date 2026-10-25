import { defineConfig } from 'vite';
export default defineConfig({ build: { target: 'es2020', chunkSizeWarningLimit: 600 }, server: { port: 5375, host: true } });
