import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

const firebaseWebAppConfig = process.env.FIREBASE_WEBAPP_CONFIG ? JSON.parse(process.env.FIREBASE_WEBAPP_CONFIG) : {};

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  // Only expose VITE_ prefixed variables to the client
  return {
    plugins: [react()],
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
      'import.meta.env.VITE_FIREBASE_API_KEY': JSON.stringify(firebaseWebAppConfig.apiKey || ''),
      'import.meta.env.VITE_FIREBASE_AUTH_DOMAIN': JSON.stringify(firebaseWebAppConfig.authDomain || ''),
      'import.meta.env.VITE_FIREBASE_PROJECT_ID': JSON.stringify(firebaseWebAppConfig.projectId || ''),
      'import.meta.env.VITE_FIREBASE_STORAGE_BUCKET': JSON.stringify(firebaseWebAppConfig.storageBucket || ''),
      'import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID': JSON.stringify(firebaseWebAppConfig.messagingSenderId || ''),
      'import.meta.env.VITE_FIREBASE_APP_ID': JSON.stringify(firebaseWebAppConfig.appId || ''),
      'import.meta.env.VITE_FIREBASE_MEASUREMENT_ID': JSON.stringify(firebaseWebAppConfig.measurementId || ''),
    }
  };
});
