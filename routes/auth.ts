import express, { Request, Response, NextFunction } from 'express';
import { OAuth2Client } from 'google-auth-library';
import admin from 'firebase-admin';

const router = express.Router();

// Initialize OAuth2Client with dynamic redirect URI support
const getOAuth2Client = (req?: Request) => {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  // Determine redirect URI based on request origin
  let redirectUri = process.env.GOOGLE_REDIRECT_URI || 'https://komabasai.local-share.net/auth/callback';

  // If request is provided, use its host to construct the redirect URI
  if (req) {
    const protocol = req.protocol;
    const host = req.get('host');
    if (host) {
      redirectUri = `${protocol}://${host}/auth/callback`;
      console.log('[Auth] Using dynamic redirect URI based on request:', redirectUri);
    }
  }

  console.log('[Auth] OAuth environment check:', {
    hasClientId: !!clientId,
    hasClientSecret: !!clientSecret,
    redirectUri,
  });

  if (!clientId || !clientSecret) {
    const error = new Error('GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET must be set');
    console.error('[Auth] Missing OAuth credentials');
    throw error;
  }

  // Trim values to remove any accidental whitespace
  const trimmedClientId = clientId.trim();
  const trimmedClientSecret = clientSecret.trim();
  const trimmedRedirectUri = redirectUri.trim();

  const client = new OAuth2Client(trimmedClientId, trimmedClientSecret, trimmedRedirectUri);
  console.log('[Auth] OAuth2Client created successfully');
  return client;
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
  console.log('[Auth] /auth/google endpoint HIT');
  console.log('[Auth] Request from:', {
    host: req.get('host'),
    origin: req.get('origin'),
    referer: req.get('referer'),
  });

  try {
    const oauth2Client = getOAuth2Client(req);

    const authorizeUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: [
        'https://www.googleapis.com/auth/userinfo.profile',
        'https://www.googleapis.com/auth/userinfo.email'
      ],
      prompt: 'consent select_account',
    });

    console.log('[Auth] Redirecting to Google OAuth');
    res.redirect(authorizeUrl);
  } catch (error: any) {
    console.error('[Auth] ERROR in /auth/google:', error.message);
    res.redirect('/?auth=config_error');
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
    const oauth2Client = getOAuth2Client(req);

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
