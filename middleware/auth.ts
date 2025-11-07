import { Request, Response, NextFunction } from 'express';

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
 * Session-based authentication middleware
 * Checks if user is authenticated via OAuth session
 *
 * Migration note: Previously used hybrid authentication with Firebase token fallback.
 * Now uses pure session-based authentication after switching to OAuth.
 */
export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  console.log('[AuthMiddleware] Checking authentication...', {
    hasSession: !!req.session,
    hasSessionUser: !!req.session?.user,
    sessionID: req.sessionID,
  });

  if (!req.session?.user) {
    console.log('[AuthMiddleware] Authentication failed: No session user');
    return res.status(401).send({ error: { message: 'Unauthorized: Please login.' } });
  }

  // Set req.user for compatibility with existing code
  req.user = {
    uid: req.session.user.uid,
    email: req.session.user.email,
  };

  console.log('[AuthMiddleware] Authentication successful:', {
    uid: req.user.uid,
    email: req.user.email,
  });

  next();
};