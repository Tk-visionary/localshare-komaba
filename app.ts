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
    const serviceAccountString = process.env.FIREBASE_SERVICE_ACCOUNT;
    if (!serviceAccountString) {
      throw new Error('FIREBASE_SERVICE_ACCOUNT environment variable is not set.');
    }
    const serviceAccount = JSON.parse(serviceAccountString);

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
      storageBucket: 'localshare-komaba.appspot.com'
    });
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
