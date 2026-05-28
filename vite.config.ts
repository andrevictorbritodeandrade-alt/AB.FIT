
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
// Fix: Import process explicitly from node:process to ensure proper typing in Node environment
import process from 'node:process';

export default defineConfig(({ mode }) => {
  // Fix: Use process.cwd() from the imported node process to safely load environment variables
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [react()],
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY || ""),
      'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY || env.API_KEY || env.REACT_APP_GEMINI_API_KEY || ""),
      'process.env': JSON.stringify(env)
    },
    build: {
      outDir: 'dist',
      sourcemap: false
    },
    optimizeDeps: {
      include: ['@google/genai']
    }
  };
});
