import { Request, Response, NextFunction } from 'express';
import admin from 'firebase-admin';

// Extend the Express Request interface to include a user property
declare global {
  namespace Express {
    export interface Request {
      user?: {
        uid: string;
        email?: string;
      };
    }
  }
}

export const firebaseAuthMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).send({ error: { message: 'Unauthorized: No token provided.' } });
  }

  const idToken = authHeader.split('Bearer ')[1];

  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email,
    };
    next();
  } catch (error) {
    console.error('Error while verifying Firebase ID token:', error);
    res.status(403).send({ error: { message: 'Unauthorized: Invalid token.' } });
  }
};