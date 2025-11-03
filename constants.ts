
export const APP_NAME = 'LocalShare';

// Determine authDomain based on current domain
// For /__/auth/handler to work, authDomain must match the current domain
const getAuthDomain = (): string => {
  // In production with custom domain
  if (typeof window !== 'undefined' && window.location.hostname === 'komabasai.local-share.net') {
    return 'komabasai.local-share.net';
  }
  // Use environment variable or fallback to Firebase default
  return import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'localshare-komaba-54c0d.firebaseapp.com';
};

// Your web app's Firebase configuration
export const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: getAuthDomain(),
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};
export const APP_SUBTITLE = "駒場祭ver";

export const ITEM_STATUS = {
  SOLD_OUT: '売り切れ',
  AVAILABLE: '販売中',
  TOGGLE_TO_AVAILABLE: '販売中にする',
  TOGGLE_TO_SOLD_OUT: '売り切れにする',
};
