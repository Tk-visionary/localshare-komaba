import express, { Request, Response, NextFunction } from 'express';
import admin from 'firebase-admin';

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
    const serviceAccountString = process.env.FIREBASE_SERVICE_ACCOUNT;

    if (!serviceAccountString) {
      console.error("CRITICAL: FIREBASE_SERVICE_ACCOUNT environment variable is not set.");
      throw new Error('FIREBASE_SERVICE_ACCOUNT environment variable is not set.');
    } else {
      console.log("FIREBASE_SERVICE_ACCOUNT is set. Type:", typeof serviceAccountString);
      // Log a small, non-sensitive part to verify it's not empty
      console.log("First 10 chars:", serviceAccountString.substring(0, 10)); 
    }

    try {
      const serviceAccount = JSON.parse(serviceAccountString);
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
        storageBucket: 'localshare-komaba.appspot.com'
      });
      console.log("Firebase Admin SDK initialized successfully.");
    } catch (e) {
      console.error("CRITICAL: Failed to parse FIREBASE_SERVICE_ACCOUNT. It may be malformed JSON.", e);
      throw e;
    }
  }
}

const db = admin.firestore();
const bucket = admin.storage().bucket();

const app = express();
app.use(helmet());
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

import uploadRoutes from './routes/upload.js';

app.use('/upload', uploadRoutes);

import itemRoutes from './routes/items.js';
import { firebaseAuthMiddleware } from './middleware/auth.js';

app.use('/api/items', firebaseAuthMiddleware, itemRoutes);

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
