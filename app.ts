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
import { firebaseAuthMiddleware } from './middleware/auth.js';

const envFile = process.env.NODE_ENV === 'production' ? '.env.prod' : '.env';
dotenv.config({ path: envFile });

// --- Firebase 初期化 ---
if (admin.apps.length === 0) {
  if (process.env.NODE_ENV === 'test') {
    admin.initializeApp();
  } else {
    console.log("Attempting to initialize Firebase Admin SDK in production mode...");

    if (process.env.FIREBASE_WEBAPP_CONFIG) {
      try {
        const firebaseConfig = JSON.parse(process.env.FIREBASE_WEBAPP_CONFIG);
        // Extract project_id from service account config
        const projectId = firebaseConfig.project_id;
        // Default Firebase storage bucket is {projectId}.appspot.com
        const storageBucket = process.env.FIREBASE_STORAGE_BUCKET || `${projectId}.appspot.com`;

        admin.initializeApp({
          credential: admin.credential.cert(firebaseConfig),
          storageBucket: storageBucket
        });
        console.log(`Firebase Admin SDK initialized successfully. Storage bucket: ${storageBucket}`);
      } catch (error) {
        console.error("Error parsing FIREBASE_WEBAPP_CONFIG:", error);
        // Fallback to default initialization if parsing fails
        admin.initializeApp();
        console.log("Firebase Admin SDK initialized with default credentials due to config error.");
      }
    } else {
      admin.initializeApp();
      console.log("Firebase Admin SDK initialized successfully with default credentials.");
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
  })
);

app.use(morgan('combined'));
app.use(express.json());

const allowed = (process.env.ALLOWED_ORIGINS || '').split(',').filter(Boolean);
app.use(cors({
  origin(origin, callback) {
    if (!origin) return callback(null, true);
    if (allowed.length === 0 || allowed.includes(origin)) return callback(null, true);
    callback(new Error('Not allowed by CORS'));
  },
}));

// --- 静的ファイル配信 ---
app.use(express.static(path.join(__dirname, "client")));

// --- ルーティング ---
// Upload always requires authentication
app.use('/upload', firebaseAuthMiddleware, uploadRoutes);
// Items routes handle authentication per-route (GET is public, POST/PUT/DELETE require auth)
app.use('/api/items', itemRoutes);

// --- SPA fallback ---
app.get(/.*/, (req, res) => {
  res.sendFile(path.join(__dirname, 'client', 'index.html'), {
    headers: { 'Content-Type': 'text/html' },
  });
});

// --- エラーハンドラ ---
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Unhandled error:', err.stack);
  const errorMessage = process.env.NODE_ENV === 'production'
    ? 'Internal Server Error'
    : err.message || 'Internal Server Error';
  res.status(500).json({ error: { message: errorMessage, stack: process.env.NODE_ENV === 'production' ? undefined : err.stack } });
});

export default app;

