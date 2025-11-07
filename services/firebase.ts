import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';

// Firebase configuration from environment variables
// These are injected by Vite at build time (see vite.config.ts)
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  // Using custom subdomain as authDomain
  // Requires:
  // 1. Set up 'auth.komabasai.local-share.net' in Firebase Hosting
  // 2. Add to Firebase Authentication authorized domains
  // 3. Add https://auth.komabasai.local-share.net/__/auth/handler to OAuth redirect URIs
  authDomain: 'auth.komabasai.local-share.net',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

console.log('[Firebase] Initializing Firebase SDK...', {
  hasApiKey: !!firebaseConfig.apiKey,
  authDomain: firebaseConfig.authDomain,
  projectId: firebaseConfig.projectId,
});

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication
const auth = getAuth(app);

// Configure Google Auth Provider for optimal user experience
const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account', // Always show account selection
});

console.log('[Firebase] Firebase SDK initialized successfully');

export { auth, googleProvider };
