import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import { onAuthStateChanged, signInWithRedirect, getRedirectResult, signOut, User as FirebaseUser, createUserWithEmailAndPassword, signInWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
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
      // Use redirect for all devices (more reliable, especially on mobile)
      await signInWithRedirect(auth, googleProvider);
      // Note: After redirect, the page will reload and useEffect will handle the result
    } catch (error: any) {
      setError(error.message);
      setLoadingGoogleSignIn(false);
      throw error;
    }
    // Don't set loadingGoogleSignIn to false here as the page will redirect
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