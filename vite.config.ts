import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// Parse Firebase Web App config from environment variable
const getFirebaseConfig = () => {
  try {
    // Priority: process.env (for production/Secret Manager) > .env file (for local dev)
    const configStr = process.env.FIREBASE_WEBAPP_CONFIG;
    if (configStr) {
      return JSON.parse(configStr);
    }
  } catch (error) {
    console.warn('[Vite] Failed to parse FIREBASE_WEBAPP_CONFIG:', error);
  }
  return {};
};

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const firebaseConfig = getFirebaseConfig();

  console.log('[Vite] Firebase config loaded:', {
    hasApiKey: !!firebaseConfig.apiKey,
    authDomain: firebaseConfig.authDomain || 'not set',
    projectId: firebaseConfig.projectId || 'not set',
  });

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
    },
    // Expose Firebase config to client-side code
    define: {
      'import.meta.env.VITE_FIREBASE_API_KEY': JSON.stringify(firebaseConfig.apiKey || ''),
      'import.meta.env.VITE_FIREBASE_AUTH_DOMAIN': JSON.stringify(firebaseConfig.authDomain || ''),
      'import.meta.env.VITE_FIREBASE_PROJECT_ID': JSON.stringify(firebaseConfig.projectId || ''),
      'import.meta.env.VITE_FIREBASE_STORAGE_BUCKET': JSON.stringify(firebaseConfig.storageBucket || ''),
      'import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID': JSON.stringify(firebaseConfig.messagingSenderId || ''),
      'import.meta.env.VITE_FIREBASE_APP_ID': JSON.stringify(firebaseConfig.appId || ''),
      'import.meta.env.VITE_FIREBASE_MEASUREMENT_ID': JSON.stringify(firebaseConfig.measurementId || ''),
    }
  };
});
