import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { APP_NAME } from '../constants';

const LoginPage: React.FC = () => {
  const { currentUser, signInWithGoogle, loadingGoogleSignIn, error } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (currentUser) {
      navigate('/my-items');
    }
  }, [currentUser, navigate]);

  const handleGoogleSignIn = async () => {
    try {
      await signInWithGoogle();
      // Navigation is handled by useEffect when currentUser changes
    } catch (err) {
      console.error('Failed to sign in with Google', err);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-komaba-orange-light to-ut-blue-light">
      <div className="p-8 bg-white rounded-lg shadow-xl w-96">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-komaba-orange mb-2">{APP_NAME}</h1>
          <p className="text-gray-600">駒場祭フリマアプリ</p>
        </div>

        <div className="mb-6 text-center">
          <h2 className="text-xl font-semibold text-gray-800">ログイン</h2>
          <p className="text-sm text-gray-500 mt-2">東京大学のメールアドレスでログインしてください</p>
          <p className="text-xs text-gray-400 mt-1">（@g.ecc.u-tokyo.ac.jp）</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            <p className="font-semibold mb-1">{error}</p>
            {error.includes('ポップアップ') && (
              <div className="text-xs mt-2 text-red-600">
                <p>【ポップアップを許可する方法】</p>
                <ul className="list-disc list-inside mt-1 space-y-1">
                  <li>Chrome: アドレスバーの🚫アイコンをタップ</li>
                  <li>Safari: 設定 → Safari → ポップアップブロックをオフ</li>
                </ul>
              </div>
            )}
          </div>
        )}

        <button
          onClick={handleGoogleSignIn}
          className="w-full p-3 text-white bg-red-500 rounded-md hover:bg-red-600 transition-colors duration-200 font-semibold shadow-md hover:shadow-lg flex items-center justify-center gap-2"
          disabled={loadingGoogleSignIn}
        >
          {loadingGoogleSignIn ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span>ログイン中...</span>
            </>
          ) : (
            <>
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              <span>Googleでログイン</span>
            </>
          )}
        </button>

        <div className="mt-6 text-center text-xs text-gray-500">
          <p>駒場祭期間中、出店者とフリマ参加者を</p>
          <p>つなぐプラットフォームです</p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
