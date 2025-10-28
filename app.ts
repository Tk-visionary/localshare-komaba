import express, { Request, Response, NextFunction } from 'express';
import admin from 'firebase-admin';
import path from 'path';
import { fileURLToPath } from 'url';

import helmet from 'helmet';
import morgan from 'morgan';
import cors from 'cors';
import dotenv from 'dotenv';
const envFile = process.env.NODE_ENV === 'production' ? '.env.prod' : '.env';
dotenv.config({ path: envFile });



if (admin.apps.length === 0) {
  if (process.env.NODE_ENV === 'test') {
    // For testing with emulators, no credentials are needed.
    admin.initializeApp();
  } else {
    console.log("Attempting to initialize Firebase Admin SDK in production mode...");
    admin.initializeApp();
    console.log("Firebase Admin SDK initialized successfully.");
  }
}

const db = admin.firestore();
const bucket = admin.storage().bucket();

const __dirname = path.resolve();

const app = express();
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        "script-src": ["'self'", "https://cdn.tailwindcss.com", "https://apis.google.com", "https://www.gstatic.com", "https://*.firebaseio.com", "https://www.googleapis.com", "'unsafe-inline'"],
        "style-src": ["'self'", "'unsafe-inline'"],
        "connect-src": ["'self'", "https://*.firebaseio.com", "https://www.googleapis.com"],
        "frame-src": ["'self'", "localshare-komaba-54c0d.firebaseapp.com"],
      },
    },
  })
);
app.use(morgan('combined'));
app.use(express.json());

const allowed = (process.env.ALLOWED_ORIGINS || '').split(',').filter(Boolean);
app.use(cors({
  origin: function(origin, callback){
    if(!origin) return callback(null, true);
    if(allowed.length === 0 || allowed.includes(origin)) return callback(null, true);
    callback(new Error('Not allowed by CORS'));
  }
}));

app.use(express.static(path.join(__dirname, 'dist/client')));

import uploadRoutes from './routes/upload.js';

app.use('/upload', firebaseAuthMiddleware, uploadRoutes);

import itemRoutes from './routes/items.js';
import { firebaseAuthMiddleware } from './middleware/auth.js';

app.use('/api/items', firebaseAuthMiddleware, itemRoutes);

app.get(/.*/, (req, res) => {
  res.sendFile(path.join(__dirname, 'dist/client', 'index.html'), { headers: { 'Content-Type': 'text/html' } });
});

// Centralized error handler
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Unhandled error:', err.stack);

  res.status(500).json({
    error: {
      message: 'Internal Server Error',
    },
  });
});

export default app;
