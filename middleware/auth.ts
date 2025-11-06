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

/**
 * Session-based authentication middleware (NEW - recommended)
 * Checks if user is authenticated via session
 */
export const sessionAuthMiddleware = (req: Request, res: Response, next: NextFunction) => {
  if (!req.session?.user) {
    return res.status(401).send({ error: { message: 'Unauthorized: Please login.' } });
  }

  // Set req.user for compatibility with existing code
  req.user = {
    uid: req.session.user.uid,
    email: req.session.user.email,
  };

  next();
};

/**
 * Legacy Firebase token-based authentication middleware
 * DEPRECATED: Use sessionAuthMiddleware instead
 * Kept for backward compatibility during migration
 */
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

/**
 * Hybrid authentication middleware
 * Tries session auth first, falls back to Firebase token auth
 * Useful during migration period
 */
export const authMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  // Try session auth first
  if (req.session?.user) {
    req.user = {
      uid: req.session.user.uid,
      email: req.session.user.email,
    };
    return next();
  }

  // Fall back to Firebase token auth
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const idToken = authHeader.split('Bearer ')[1];
    try {
      const decodedToken = await admin.auth().verifyIdToken(idToken);
      req.user = {
        uid: decodedToken.uid,
        email: decodedToken.email,
      };
      return next();
    } catch (error) {
      console.error('Error while verifying Firebase ID token:', error);
    }
  }

  // Both auth methods failed
  return res.status(401).send({ error: { message: 'Unauthorized: Please login.' } });
};