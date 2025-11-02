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

// Detect if user is on mobile device
const isMobileDevice = (): boolean => {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
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
      // Use redirect on mobile devices, popup on desktop
      if (isMobileDevice()) {
        await signInWithRedirect(auth, googleProvider);
        // Note: After redirect, the page will reload and useEffect will handle the result
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
      }
    } catch (error: any) {
      setError(error.message);
      throw error;
    } finally {
      setLoadingGoogleSignIn(false);
    }
  };

  const resetPassword = (email: string) => {
    return sendPasswordResetEmail(auth, email);
  };

  useEffect(() => {
    // Handle redirect result (for mobile login)
    const handleRedirectResult = async () => {
      try {
        const result = await getRedirectResult(auth);
        if (result?.user) {
          const firebaseUser = result.user;
          const newUser = mapFirebaseUserToAppUser(firebaseUser);
          setCurrentUser(newUser);

          // Save to Firestore
          const userRef = doc(db, 'users', firebaseUser.uid);
          const userSnap = await getDoc(userRef);
          if (!userSnap.exists()) {
            await setDoc(userRef, newUser);
          }
        }
      } catch (error: any) {
        console.error('Error handling redirect result:', error);
        setError(error.message);
      }
    };

    handleRedirectResult();

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const userRef = doc(db, 'users', firebaseUser.uid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
            setCurrentUser(userSnap.data() as User);
        } else {
            // Create a new user document in Firestore if it doesn't exist
            const newUser = mapFirebaseUserToAppUser(firebaseUser);
            await setDoc(userRef, newUser);
            setCurrentUser(newUser);
        }
      } else {
        setCurrentUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
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