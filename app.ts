import express, { Request, Response, NextFunction } from 'express';
import admin from 'firebase-admin';
import path from 'path';
import { fileURLToPath } from 'url';
import session from 'express-session';

import helmet from 'helmet';
import morgan from 'morgan';
import cors from 'cors';
import dotenv from 'dotenv';
import uploadRoutes from './routes/upload.js';
import itemRoutes from './routes/items.js';
import authRoutes from './routes/auth.js';
import { authMiddleware } from './middleware/auth.js';

// Only load .env files in development
// In production (Cloud Run/App Hosting), environment variables are provided by the platform
if (process.env.NODE_ENV !== 'production') {
  const envFile = '.env';
  dotenv.config({ path: envFile });
  console.log('[App] Loaded environment variables from', envFile);
} else {
  console.log('[App] Running in production - using platform-provided environment variables');
}

// Log OAuth configuration status (without exposing secrets)
console.log('[App] OAuth Configuration Check:', {
  NODE_ENV: process.env.NODE_ENV,
  hasGoogleClientId: !!process.env.GOOGLE_CLIENT_ID,
  hasGoogleClientSecret: !!process.env.GOOGLE_CLIENT_SECRET,
  hasSessionSecret: !!process.env.SESSION_SECRET,
  googleRedirectUri: process.env.GOOGLE_REDIRECT_URI || 'not set (will use default)',
});

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

// --- Session Configuration ---
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-secret-key-change-this-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production', // HTTPS only in production
    httpOnly: true,
    maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
    sameSite: 'lax',
  },
}));

const allowed = (process.env.ALLOWED_ORIGINS || '').split(',').filter(Boolean);
console.log('CORS allowed origins:', allowed.length > 0 ? allowed : 'all origins (no restriction)');

app.use(cors({
  origin(origin, callback) {
    console.log('CORS check for origin:', origin);
    if (!origin) return callback(null, true);
    if (allowed.length === 0 || allowed.includes(origin)) {
      console.log('CORS allowed:', origin);
      return callback(null, true);
    }
    console.error('CORS blocked:', origin);
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
// Authentication routes (must come before other protected routes)
app.use('/auth', authRoutes);

// Upload always requires authentication
app.use('/upload', authMiddleware, uploadRoutes);
// Items routes handle authentication per-route (GET is public, POST/PUT/DELETE require auth)
app.use('/api/items', itemRoutes);

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
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Unhandled error:', err.stack);
  const errorMessage = process.env.NODE_ENV === 'production'
    ? 'Internal Server Error'
    : err.message || 'Internal Server Error';
  res.status(500).json({ error: { message: errorMessage, stack: process.env.NODE_ENV === 'production' ? undefined : err.stack } });
});

export default app;

