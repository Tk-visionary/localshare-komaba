import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import { User } from '../types';

interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
  logout: () => Promise<void>;
  signInWithGoogle: () => void;
  loadingGoogleSignIn: boolean;
  error: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingGoogleSignIn, setLoadingGoogleSignIn] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch current user on mount
  useEffect(() => {
    const fetchUser = async () => {
      console.log('[AuthContext] Fetching current user...');
      try {
        const response = await fetch('/auth/me', {
          credentials: 'include', // Important: include cookies
        });

        if (response.ok) {
          const user = await response.json();
          console.log('[AuthContext] User is logged in:', user.email);
          setCurrentUser(user);
        } else {
          console.log('[AuthContext] User is not logged in');
          setCurrentUser(null);
        }
      } catch (error) {
        console.error('[AuthContext] Error fetching user:', error);
        setCurrentUser(null);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();

    // Check for auth callback status in URL
    const params = new URLSearchParams(window.location.search);
    const authStatus = params.get('auth');

    if (authStatus === 'success') {
      console.log('[AuthContext] Authentication successful');
      // Remove the query parameter and reload user
      window.history.replaceState({}, '', window.location.pathname);
      fetchUser();
    } else if (authStatus === 'error') {
      setError('認証中にエラーが発生しました。もう一度お試しください。');
      window.history.replaceState({}, '', window.location.pathname);
    } else if (authStatus === 'cancelled') {
      setError('認証がキャンセルされました。');
      window.history.replaceState({}, '', window.location.pathname);
    } else if (authStatus === 'config_error') {
      setError('サーバーの設定エラーです。管理者に連絡してください。');
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  const signInWithGoogle = () => {
    console.log('[AuthContext] Redirecting to Google OAuth...');
    console.log('[AuthContext] Target URL: /auth/google');
    setLoadingGoogleSignIn(true);
    setError(null);

    // Simple redirect to server-side OAuth endpoint
    // No Firebase SDK, no popup/redirect complexity!

    // Add a small delay to ensure state is updated
    setTimeout(() => {
      console.log('[AuthContext] Executing redirect now...');
      window.location.href = '/auth/google';
    }, 100);
  };

  const logout = async () => {
    console.log('[AuthContext] Logging out...');
    try {
      const response = await fetch('/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });

      if (response.ok) {
        setCurrentUser(null);
        console.log('[AuthContext] Logout successful');
      } else {
        throw new Error('Logout failed');
      }
    } catch (error) {
      console.error('[AuthContext] Logout error:', error);
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
