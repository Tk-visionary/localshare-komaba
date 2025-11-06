import express, { Request, Response, NextFunction } from 'express';
import { OAuth2Client } from 'google-auth-library';
import admin from 'firebase-admin';

const router = express.Router();

// Initialize OAuth2Client
const getOAuth2Client = () => {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI || 'https://komabasai.local-share.net/auth/callback';

  if (!clientId || !clientSecret) {
    throw new Error('GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET must be set in environment variables');
  }

  return new OAuth2Client(clientId, clientSecret, redirectUri);
};

// Extend Express Request type to include session
declare module 'express-session' {
  interface SessionData {
    user?: {
      uid: string;
      email: string;
      name: string;
      picture?: string;
    };
  }
}

/**
 * GET /auth/google
 * Initiates Google OAuth flow by redirecting to Google's authorization page
 */
router.get('/google', (req: Request, res: Response) => {
  try {
    const oauth2Client = getOAuth2Client();

    const authorizeUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: [
        'https://www.googleapis.com/auth/userinfo.profile',
        'https://www.googleapis.com/auth/userinfo.email'
      ],
      prompt: 'consent select_account', // Force consent screen and account selection
    });

    console.log('[Auth] Redirecting to Google OAuth:', authorizeUrl);
    res.redirect(authorizeUrl);
  } catch (error) {
    console.error('[Auth] Error generating auth URL:', error);
    res.status(500).json({ error: 'Failed to initiate authentication' });
  }
});

/**
 * GET /auth/callback
 * Handles the OAuth callback from Google
 */
router.get('/callback', async (req: Request, res: Response) => {
  const { code, error } = req.query;

  // Handle user cancellation or errors from Google
  if (error) {
    console.error('[Auth] OAuth error from Google:', error);
    return res.redirect('/?auth=cancelled');
  }

  if (!code || typeof code !== 'string') {
    console.error('[Auth] No authorization code received');
    return res.redirect('/?auth=error');
  }

  try {
    const oauth2Client = getOAuth2Client();

    // Exchange authorization code for tokens
    console.log('[Auth] Exchanging code for tokens...');
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    // Verify ID token and get user info
    if (!tokens.id_token) {
      throw new Error('No ID token received from Google');
    }

    const ticket = await oauth2Client.verifyIdToken({
      idToken: tokens.id_token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    if (!payload || !payload.sub || !payload.email) {
      throw new Error('Invalid token payload');
    }

    console.log('[Auth] User authenticated:', payload.email);

    // Create user object
    const user = {
      uid: payload.sub,
      email: payload.email,
      name: payload.name || 'No Name',
      picture: payload.picture,
    };

    // Save to session
    req.session.user = user;

    // Save to Firestore
    const db = admin.firestore();
    const userRef = db.collection('users').doc(user.uid);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      await userRef.set({
        id: user.uid,
        email: user.email,
        name: user.name,
        picture: user.picture,
      });
      console.log('[Auth] New user created in Firestore:', user.email);
    } else {
      console.log('[Auth] User already exists in Firestore:', user.email);
    }

    // Redirect to home page with success
    res.redirect('/?auth=success');
  } catch (error) {
    console.error('[Auth] Error in OAuth callback:', error);
    res.redirect('/?auth=error');
  }
});

/**
 * POST /auth/logout
 * Logs out the current user by destroying the session
 */
router.post('/logout', (req: Request, res: Response) => {
  const userEmail = req.session.user?.email;

  req.session.destroy((err) => {
    if (err) {
      console.error('[Auth] Error destroying session:', err);
      return res.status(500).json({ error: 'Failed to logout' });
    }

    console.log('[Auth] User logged out:', userEmail);
    res.json({ success: true });
  });
});

/**
 * GET /auth/me
 * Returns the currently authenticated user
 */
router.get('/me', (req: Request, res: Response) => {
  if (!req.session.user) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  res.json(req.session.user);
});

export default router;
