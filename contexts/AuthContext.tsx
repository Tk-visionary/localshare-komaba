import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import {
  signInWithRedirect,
  signInWithPopup,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  getRedirectResult,
  User as FirebaseUser
} from 'firebase/auth';
import { auth, googleProvider } from '../services/firebase';
import { User } from '../types';

interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
  logout: () => Promise<void>;
  signInWithGoogle: () => void;
  loadingGoogleSignIn: boolean;
  error: string | null;
  idToken: string | null; // ID token for API requests
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingGoogleSignIn, setLoadingGoogleSignIn] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [idToken, setIdToken] = useState<string | null>(null);

  // Check if email domain is allowed
  const isAllowedDomain = (email: string | null): boolean => {
    if (!email) return false;

    // Allowed email addresses (exceptions)
    const allowedExceptions = ['taishi14ki@gmail.com'];
    if (allowedExceptions.includes(email)) return true;

    // Check domain
    return email.endsWith('@g.ecc.u-tokyo.ac.jp');
  };

  // Convert Firebase User to our User type
  const convertFirebaseUser = async (firebaseUser: FirebaseUser): Promise<User> => {
    return {
      id: firebaseUser.uid,
      name: firebaseUser.displayName || 'No Name',
      email: firebaseUser.email || '',
      picture: firebaseUser.photoURL || undefined,
    };
  };

  // Fetch and update ID token
  const updateIdToken = async (firebaseUser: FirebaseUser | null) => {
    if (firebaseUser) {
      try {
        const token = await firebaseUser.getIdToken();
        setIdToken(token);
      } catch {
        setIdToken(null);
      }
    } else {
      setIdToken(null);
    }
  };

  // Check for redirect result on mount
  useEffect(() => {
    const checkRedirectResult = async () => {
      try {
        const result = await getRedirectResult(auth);

        if (result) {
          // Check if email domain is allowed
          if (!isAllowedDomain(result.user.email)) {
            await firebaseSignOut(auth);
            setError('このアプリは東京大学のメールアドレス（@g.ecc.u-tokyo.ac.jp）でのみ利用可能です。');
            return;
          }

          const user = await convertFirebaseUser(result.user);
          setCurrentUser(user);
          await updateIdToken(result.user);
          setError(null);
        }
      } catch (error: any) {
        if (error.code === 'auth/popup-closed-by-user' || error.code === 'auth/cancelled-popup-request') {
          setError('認証がキャンセルされました。');
        } else {
          setError('認証中にエラーが発生しました。もう一度お試しください。');
        }
      } finally {
        setLoadingGoogleSignIn(false);
      }
    };

    checkRedirectResult();
  }, []);

  // Monitor auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // Check if email domain is allowed
        if (!isAllowedDomain(firebaseUser.email)) {
          await firebaseSignOut(auth);
          setCurrentUser(null);
          setIdToken(null);
          setError('このアプリは東京大学のメールアドレス（@g.ecc.u-tokyo.ac.jp）でのみ利用可能です。');
          setLoading(false);
          return;
        }

        const user = await convertFirebaseUser(firebaseUser);
        setCurrentUser(user);
        await updateIdToken(firebaseUser);
      } else {
        setCurrentUser(null);
        setIdToken(null);
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Refresh token periodically (every 50 minutes)
  useEffect(() => {
    if (!auth.currentUser) return;

    const refreshInterval = setInterval(async () => {
      await updateIdToken(auth.currentUser);
    }, 50 * 60 * 1000); // 50 minutes

    return () => clearInterval(refreshInterval);
  }, [currentUser]);

  const signInWithGoogle = async () => {
    setLoadingGoogleSignIn(true);
    setError(null);

    try {
      const result = await signInWithPopup(auth, googleProvider);

      // Check if email domain is allowed
      if (!isAllowedDomain(result.user.email)) {
        await firebaseSignOut(auth);
        setError('このアプリは東京大学のメールアドレス（@g.ecc.u-tokyo.ac.jp）でのみ利用可能です。');
        setLoadingGoogleSignIn(false);
        return;
      }

      const user = await convertFirebaseUser(result.user);
      setCurrentUser(user);
      await updateIdToken(result.user);
      setLoadingGoogleSignIn(false);
    } catch (error: any) {
      // If popup is blocked or fails, try redirect as fallback
      if (error.code === 'auth/popup-blocked' || error.code === 'auth/popup-closed-by-user') {
        try {
          await signInWithRedirect(auth, googleProvider);
        } catch (redirectError: any) {
          setError(`ログインに失敗しました: ${redirectError.message}`);
          setLoadingGoogleSignIn(false);
        }
      } else {
        setError(`ログインに失敗しました: ${error.message}`);
        setLoadingGoogleSignIn(false);
      }
    }
  };

  const logout = async () => {
    try {
      await firebaseSignOut(auth);
      setCurrentUser(null);
      setIdToken(null);
    } catch {
      setError('ログアウト中にエラーが発生しました。');
    }
  };

  const value = {
    currentUser,
    loading,
    logout,
    signInWithGoogle,
    loadingGoogleSignIn,
    error,
    idToken,
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
