import express, { Request, Response, NextFunction } from 'express';
import { OAuth2Client } from 'google-auth-library';
import admin from 'firebase-admin';

const router = express.Router();

// Initialize OAuth2Client
const getOAuth2Client = () => {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI || 'https://komabasai.local-share.net/auth/callback';

  console.log('[Auth] DETAILED Environment check:', {
    hasClientId: !!clientId,
    hasClientSecret: !!clientSecret,
    redirectUri,
    clientIdPrefix: clientId ? clientId.substring(0, 20) + '...' : 'undefined',
    clientIdLength: clientId ? clientId.length : 0,
    clientSecretLength: clientSecret ? clientSecret.length : 0,
    clientIdType: typeof clientId,
    clientSecretType: typeof clientSecret,
    clientIdTrimmed: clientId ? clientId.trim() === clientId : 'N/A',
    clientSecretTrimmed: clientSecret ? clientSecret.trim() === clientSecret : 'N/A',
  });

  if (!clientId || !clientSecret) {
    const error = new Error('GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET must be set in environment variables');
    console.error('[Auth] Missing OAuth credentials:', {
      GOOGLE_CLIENT_ID: clientId ? 'present' : 'MISSING',
      GOOGLE_CLIENT_SECRET: clientSecret ? 'present' : 'MISSING',
    });
    throw error;
  }

  // Trim values to remove any accidental whitespace
  const trimmedClientId = clientId.trim();
  const trimmedClientSecret = clientSecret.trim();
  const trimmedRedirectUri = redirectUri.trim();

  console.log('[Auth] Creating OAuth2Client with trimmed values...');

  try {
    const client = new OAuth2Client(trimmedClientId, trimmedClientSecret, trimmedRedirectUri);
    console.log('[Auth] OAuth2Client created successfully');
    return client;
  } catch (error) {
    console.error('[Auth] ERROR creating OAuth2Client:', error);
    throw error;
  }
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
  console.log('[Auth] === /auth/google endpoint HIT ===');
  console.log('[Auth] Request URL:', req.url);
  console.log('[Auth] Request headers:', {
    userAgent: req.get('user-agent'),
    origin: req.get('origin'),
    referer: req.get('referer'),
  });

  try {
    console.log('[Auth] Initiating Google OAuth flow...');
    const oauth2Client = getOAuth2Client();

    console.log('[Auth] Generating auth URL...');
    const authorizeUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: [
        'https://www.googleapis.com/auth/userinfo.profile',
        'https://www.googleapis.com/auth/userinfo.email'
      ],
      prompt: 'consent select_account', // Force consent screen and account selection
    });

    console.log('[Auth] Auth URL generated successfully. Length:', authorizeUrl.length);
    console.log('[Auth] Redirecting to Google OAuth');
    res.redirect(authorizeUrl);
  } catch (error: any) {
    console.error('[Auth] ========== ERROR IN /auth/google ==========');
    console.error('[Auth] Error message:', error.message);
    console.error('[Auth] Error name:', error.name);
    console.error('[Auth] Error stack:', error.stack);
    console.error('[Auth] Full error object:', JSON.stringify(error, null, 2));
    console.error('[Auth] ===============================================');

    // Redirect to login page with error
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
