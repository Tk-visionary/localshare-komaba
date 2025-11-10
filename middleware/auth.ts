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
 * Firebase Authentication middleware
 * Verifies Firebase ID token from Authorization header and sets req.user
 * Restricts access to @g.ecc.u-tokyo.ac.jp email addresses only
 */
export const authMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  console.log('[AuthMiddleware] Checking authentication...');

  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.log('[AuthMiddleware] No Authorization header found');
    return res.status(401).send({ error: { message: 'Unauthorized: No token provided.' } });
  }

  const idToken = authHeader.split('Bearer ')[1];

  try {
    // Verify the ID token with Firebase Admin SDK
    const decodedToken = await admin.auth().verifyIdToken(idToken);

    console.log('[AuthMiddleware] Token verified successfully:', {
      uid: decodedToken.uid,
      email: decodedToken.email,
    });

    // Allowed email addresses (exceptions)
    const allowedExceptions = ['taishi14ki@gmail.com'];

    // Check if email domain is allowed
    const email = decodedToken.email;
    const isException = email && allowedExceptions.includes(email);
    const isValidDomain = email && email.endsWith('@g.ecc.u-tokyo.ac.jp');

    if (!email || (!isValidDomain && !isException)) {
      console.warn('[AuthMiddleware] Unauthorized domain:', email);
      return res.status(403).send({
        error: {
          message: 'このアプリは東京大学のメールアドレス（@g.ecc.u-tokyo.ac.jp）でのみ利用可能です。'
        }
      });
    }

    // Set req.user for compatibility with existing code
    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email,
    };

    // Ensure user exists in Firestore (create if first login)
    await ensureUserExists(decodedToken);

    next();
  } catch (error: any) {
    console.error('[AuthMiddleware] Token verification failed:', {
      error: error.message,
      code: error.code,
    });

    if (error.code === 'auth/id-token-expired') {
      return res.status(401).send({ error: { message: 'Unauthorized: Token expired.' } });
    }

    return res.status(403).send({ error: { message: 'Unauthorized: Invalid token.' } });
  }
};

/**
 * Ensure user document exists in Firestore
 * Creates a new user document if this is the user's first login
 */
async function ensureUserExists(decodedToken: admin.auth.DecodedIdToken) {
  const db = admin.firestore();
  const userRef = db.collection('users').doc(decodedToken.uid);

  try {
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      // Create new user document
      const userData = {
        id: decodedToken.uid,
        email: decodedToken.email || '',
        name: decodedToken.name || 'No Name',
        picture: decodedToken.picture || null,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      };

      await userRef.set(userData);
      console.log('[AuthMiddleware] New user created in Firestore:', decodedToken.email);
    }
  } catch (error) {
    console.error('[AuthMiddleware] Error ensuring user exists:', error);
    // Don't fail the request if Firestore operation fails
    // User can still use the app, just won't be in Firestore yet
  }
}
