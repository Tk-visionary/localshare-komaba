import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import { onAuthStateChanged, signInWithPopup, signInWithRedirect, getRedirectResult, signOut, User as FirebaseUser, createUserWithEmailAndPassword, signInWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { auth, googleProvider, db } from '../services/firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { User } from '../types';

interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
  signup: (email: string, password: string) => Promise<UserCredential>;
  login: (email: string, password: string) => Promise<UserCredential>;
  logout: () => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  loadingGoogleSignIn: boolean;
  error: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Function to detect if user is on a mobile device
const isMobileDevice = (): boolean => {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
};

// Function to map Firebase User to our app's User type
const mapFirebaseUserToAppUser = (firebaseUser: FirebaseUser): User => {
    const { uid, displayName, email, photoURL } = firebaseUser;
    return {
        id: uid,
        name: displayName || 'No Name',
        email: email || 'No Email',
        picture: photoURL || undefined,
    };
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingGoogleSignIn, setLoadingGoogleSignIn] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const signup = (email: string, password: string) => {
    return createUserWithEmailAndPassword(auth, email, password);
  };

  const login = (email: string, password: string) => {
    return signInWithEmailAndPassword(auth, email, password);
  };

  const logout = () => {
    return signOut(auth);
  };

  const signInWithGoogle = async () => {
    setLoadingGoogleSignIn(true);
    setError(null);
    try {
      // Use redirect for mobile devices, popup for desktop
      if (isMobileDevice()) {
        await signInWithRedirect(auth, googleProvider);
        // Redirect will happen, so we don't need to do anything else here
        // The result will be handled by getRedirectResult in useEffect
      } else {
        const result = await signInWithPopup(auth, googleProvider);
        const firebaseUser = result.user;

        // Immediately map and set the user to close popup quickly
        const newUser = mapFirebaseUserToAppUser(firebaseUser);
        setCurrentUser(newUser);

        // Save to Firestore in the background (don't block)
        const userRef = doc(db, 'users', firebaseUser.uid);
        getDoc(userRef).then(userSnap => {
          if (!userSnap.exists()) {
            setDoc(userRef, newUser).catch(err => {
              console.error('Failed to save user to Firestore:', err);
            });
          }
        }).catch(err => {
          console.error('Failed to check user in Firestore:', err);
        });
        setLoadingGoogleSignIn(false);
      }
    } catch (error: any) {
      setError(error.message);
      setLoadingGoogleSignIn(false);
      throw error;
    }
  };

  const resetPassword = (email: string) => {
    return sendPasswordResetEmail(auth, email);
  };

  useEffect(() => {
    let unsubscribe: (() => void) | null = null;

    const initializeAuth = async () => {
      console.log('[AuthContext] Initializing auth...');

      // First, handle any pending redirect result for mobile devices
      try {
        console.log('[AuthContext] Checking for redirect result...');
        const result = await getRedirectResult(auth);
        console.log('[AuthContext] Redirect result:', result ? `User: ${result.user.email}` : 'null');

        if (result) {
          console.log('[AuthContext] Processing redirect result for:', result.user.email);
          const firebaseUser = result.user;

          // Map and set the user
          const newUser = mapFirebaseUserToAppUser(firebaseUser);

          // Save to Firestore first
          const userRef = doc(db, 'users', firebaseUser.uid);
          const userSnap = await getDoc(userRef);
          if (!userSnap.exists()) {
            await setDoc(userRef, newUser);
            console.log('[AuthContext] User saved to Firestore:', newUser.email);
          } else {
            console.log('[AuthContext] User already exists in Firestore');
          }

          setCurrentUser(newUser);
          setLoadingGoogleSignIn(false);
          console.log('[AuthContext] Current user set from redirect result');
        } else {
          console.log('[AuthContext] No redirect result found');
        }
      } catch (error: any) {
        console.error('[AuthContext] Redirect result error:', error);
        setError(error.message);
        setLoadingGoogleSignIn(false);
      }

      // Now set up the auth state listener
      console.log('[AuthContext] Setting up auth state listener...');
      unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
        console.log('[AuthContext] Auth state changed:', firebaseUser?.email || 'null');
        if (firebaseUser) {
          console.log('[AuthContext] User is logged in:', firebaseUser.email);
          const userRef = doc(db, 'users', firebaseUser.uid);
          const userSnap = await getDoc(userRef);
          if (userSnap.exists()) {
            setCurrentUser(userSnap.data() as User);
            console.log('[AuthContext] User data loaded from Firestore');
          } else {
            // Create a new user document in Firestore if it doesn't exist
            const newUser = mapFirebaseUserToAppUser(firebaseUser);
            await setDoc(userRef, newUser);
            setCurrentUser(newUser);
            console.log('[AuthContext] New user created in Firestore');
          }
        } else {
          console.log('[AuthContext] User is logged out');
          setCurrentUser(null);
        }
        setLoading(false);
        console.log('[AuthContext] Loading complete');
      });
    };

    initializeAuth();

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []);

  const value = {
    currentUser,
    loading,
    signup,
    login,
    logout,
    signInWithGoogle,
    resetPassword,
    loadingGoogleSignIn,
    error,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
