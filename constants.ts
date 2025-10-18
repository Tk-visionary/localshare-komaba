
export const APP_NAME = 'LocalShare (駒場祭ver)';

// Your web app's Firebase configuration
export const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};
export const APP_SUBTITLE = "駒場祭 特化版";

export const ITEM_STATUS = {
  SOLD_OUT: '売り切れ',
  AVAILABLE: '販売中',
  TOGGLE_TO_AVAILABLE: '販売中にする',
  TOGGLE_TO_SOLD_OUT: '売り切れにする',
};
