
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, setPersistence, browserLocalPersistence } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { firebaseConfig } from "../constants";

// Validate Firebase configuration
const validateConfig = () => {
    const requiredKeys = ['apiKey', 'authDomain', 'projectId', 'storageBucket', 'messagingSenderId', 'appId'];
    const missingKeys = requiredKeys.filter(key => !firebaseConfig[key as keyof typeof firebaseConfig]);

    if (missingKeys.length > 0) {
        console.error('[Firebase] Missing configuration keys:', missingKeys);
        console.error('[Firebase] Current config:', firebaseConfig);
        throw new Error(`Firebase configuration is incomplete. Missing: ${missingKeys.join(', ')}`);
    }

    console.log('[Firebase] Configuration validated successfully');
    console.log('[Firebase] Auth Domain:', firebaseConfig.authDomain);
    console.log('[Firebase] Project ID:', firebaseConfig.projectId);
};

// Initialize Firebase
console.log('[Firebase] Initializing Firebase...');
validateConfig();

const app = initializeApp(firebaseConfig);
console.log('[Firebase] Firebase app initialized');

// Firebase services
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

console.log('[Firebase] Firebase services created');

// Set persistence to LOCAL to maintain auth state across page reloads and redirects
setPersistence(auth, browserLocalPersistence)
    .then(() => {
        console.log('[Firebase] Auth persistence set to LOCAL');
    })
    .catch((error) => {
        console.error('[Firebase] Failed to set auth persistence:', error);
    });

// Google Auth Provider
const googleProvider = new GoogleAuthProvider();

googleProvider.setCustomParameters({
    prompt: 'select_account'
});

console.log('[Firebase] Google provider configured');

export { app, auth, db, storage, googleProvider };
