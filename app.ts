import express, { Request, Response, NextFunction } from 'express';
import admin from 'firebase-admin';
import path from 'path';
import { fileURLToPath } from 'url';

import helmet from 'helmet';
import morgan from 'morgan';
import cors from 'cors';
import dotenv from 'dotenv';
import uploadRoutes from './routes/upload.js';
import itemRoutes from './routes/items.js';
import aiRoutes from './routes/ai.js';
import messageRoutes from './routes/messages.js';
import profileRoutes from './routes/profile.js';
import { authMiddleware } from './middleware/auth.js';

// Only load .env files in development
// In production (Cloud Run/App Hosting), environment variables are provided by the platform
if (process.env.NODE_ENV !== 'production') {
  const envFile = '.env';
  dotenv.config({ path: envFile });
}

// --- Firebase 初期化 ---
if (admin.apps.length === 0) {
  if (process.env.NODE_ENV === 'test') {
    admin.initializeApp();
  } else {
    // Use FIREBASE_SERVICE_ACCOUNT for server-side admin operations
    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
      try {
        const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
        const projectId = serviceAccount.project_id;
        const storageBucket = process.env.FIREBASE_STORAGE_BUCKET || `${projectId}.appspot.com`;

        admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
          storageBucket: storageBucket
        });
      } catch {
        // Fallback to default initialization (uses Application Default Credentials)
        admin.initializeApp();
      }
    } else {
      // Use Application Default Credentials (ADC) for local development
      // Run 'gcloud auth application-default login' to set up ADC
      admin.initializeApp();
    }
  }
}

// --- __dirname 対応（ESM用） ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- Express アプリ設定 ---
const app = express();

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        "default-src": ["'self'"],
        "script-src": [
          "'self'",
          "https://cdn.tailwindcss.com",
          "https://apis.google.com",
          "https://www.gstatic.com",
          "https://*.firebaseio.com",
          "https://www.googleapis.com",
          "https://aistudiocdn.com",
          "'unsafe-inline'",
        ],
        "style-src": ["'self'", "https://aistudiocdn.com", "'unsafe-inline'"],
        "style-src-elem": ["'self'", "https://aistudiocdn.com", "'unsafe-inline'"],
        "font-src": ["'self'", "https://aistudiocdn.com", "data:"],
        "img-src": ["'self'", "data:", "https:", "blob:"],
        "connect-src": ["'self'", "https://*.firebaseio.com", "https://*.googleapis.com", "https://aistudiocdn.com"],
        "frame-src": ["'self'", "https://localshare-komaba-54c0d.firebaseapp.com"],
        "object-src": ["'none'"],
        "base-uri": ["'self'"],
      },
    },
    // Allow popups for Firebase Authentication
    // Default 'same-origin' blocks auth popups, 'same-origin-allow-popups' allows them
    crossOriginOpenerPolicy: { policy: "same-origin-allow-popups" },
  })
);

app.use(morgan('combined'));
app.use(express.json());

const allowed = (process.env.ALLOWED_ORIGINS || '').split(',').filter(Boolean);

app.use(cors({
  origin(origin, callback) {
    if (!origin) return callback(null, true);
    if (allowed.length === 0 || allowed.includes(origin)) {
      return callback(null, true);
    }
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// --- 静的ファイル配信 ---
// Serve static files with cache control
app.use(express.static(path.join(__dirname, "client"), {
  maxAge: '1y', // Cache assets for 1 year (they have hash in filename)
  setHeaders: (res, filepath) => {
    // Don't cache index.html
    if (filepath.endsWith('index.html')) {
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
    }
  }
}));

// --- ルーティング ---
// Upload always requires authentication
app.use('/upload', authMiddleware, uploadRoutes);
// Items routes handle authentication per-route (GET is public, POST/PUT/DELETE require auth)
app.use('/api/items', itemRoutes);
// AI routes require authentication
app.use('/api/ai', authMiddleware, aiRoutes);
// Messages routes (authentication is handled inside the router)
app.use('/api/messages', messageRoutes);
// Profile routes (authentication is handled inside the router)
app.use('/api/profile', profileRoutes);

// --- SPA fallback ---
// Only serve index.html for non-file requests (excludes .js, .css, .svg, etc.)
app.get(/^\/(?!.*\.).*$/, (req, res) => {
  res.sendFile(path.join(__dirname, 'client', 'index.html'), {
    headers: {
      'Content-Type': 'text/html',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    },
  });
});

// --- エラーハンドラ ---
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  const errorMessage = process.env.NODE_ENV === 'production'
    ? 'Internal Server Error'
    : err.message || 'Internal Server Error';
  res.status(500).json({ error: { message: errorMessage, stack: process.env.NODE_ENV === 'production' ? undefined : err.stack } });
});

export default app;

