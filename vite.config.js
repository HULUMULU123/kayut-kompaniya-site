import { defineConfig } from 'vite';
export default defineConfig({ base: process.env.BASE || '/', build: { target: 'es2020', chunkSizeWarningLimit: 600 }, server: { port: 5375, host: true } });
