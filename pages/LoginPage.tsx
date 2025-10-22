import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { APP_NAME } from '../constants';

const LoginPage: React.FC = () => {
    const { user, login, loading, loadingGoogleSignIn, error } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (user) {
            navigate('/my-items');
        }
    }, [user, navigate]);

    return (
        <div className="flex items-center justify-center min-h-[calc(100vh-128px)]">
            <div className="max-w-md w-full bg-white p-8 rounded-lg shadow-lg text-center">
                <h2 className="text-2xl font-bold text-gray-900">{APP_NAME}へようこそ</h2>
                <p className="mt-2 text-sm text-gray-600">ログインして商品をシェア・販売しましょう</p>
                <div className="mt-8">
                    <button
                        onClick={login}
                        disabled={loading}
                        className="w-full inline-flex justify-center items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:bg-gray-200"
                    >
                        {loading ? (
                            <>
                                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                <span>ログイン処理中...</span>
                            </>
                        ) : (
                            <>
                                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 48 48">
                                    <path fill="#4285F4" d="M24 9.5c3.9 0 6.9 1.6 9.1 3.7l6.9-6.9C35.9 2.5 30.4 0 24 0 14.2 0 6.1 5.6 2.4 13.8l7.8 6C11.9 13.4 17.5 9.5 24 9.5z"></path>
                                    <path fill="#34A853" d="M46.2 25.4c0-1.7-.2-3.4-.5-5H24v9.3h12.5c-.5 3-2.1 5.6-4.6 7.3l7.6 5.9c4.5-4.1 7.1-10.2 7.1-17.5z"></path>
                                    <path fill="#FBBC05" d="M10.2 28.8l-7.8 6C.8 29.1 0 24.2 0 19.3s.8-9.8 2.4-15.4l7.8 6c-.5 1.5-.8 3.1-.8 4.8s.3 3.3.8 4.8z"></path>
                                    <path fill="#EA4335" d="M24 48c6.5 0 12-2.1 16-5.6l-7.6-5.9c-2.1 1.4-4.8 2.3-7.9 2.3-6.5 0-12-3.9-13.8-9.2l-7.8 6C6.1 42.4 14.2 48 24 48z"></path>
                                    <path fill="none" d="M0 0h48v48H0z"></path>
                                </svg>
                                <span>Googleでサインイン</span>
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;
