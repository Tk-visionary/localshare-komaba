import path from 'path';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  // Only expose VITE_ prefixed variables to the client
  return {
    build: {
      outDir: 'dist/client'
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
        'animejs': 'animejs/lib/anime.es.js',
      }
    },
    server: {
      proxy: {
        '/api': {
          target: env.VITE_API_PROXY_TARGET || 'http://localhost:3000',
          changeOrigin: true,
        }
      },
      // do not open wildcard CORS here; control CORS on the API server
    },
    define: {
      // If you need to pass public env to client, reference import.meta.env.VITE_*
      // Do NOT embed server secrets like GEMINI_API_KEY here.
    }
  };
});
