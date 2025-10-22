import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { APP_NAME } from '../constants';

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false); // For email/password login
  const { currentUser, login, signInWithGoogle, loadingGoogleSignIn, error } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (currentUser) {
      navigate('/my-items');
    }
  }, [currentUser, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
      navigate('/my-items');
    } catch (err) {
      console.error('Login failed:', err);
      // Error message will be displayed by AuthContext's error state
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      await signInWithGoogle();
      navigate('/my-items');
    } catch (err) {
      console.error('Failed to sign in with Google', err);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <div className="p-8 bg-white rounded shadow-md w-80">
        <h2 className="mb-4 text-2xl font-bold text-center">Login</h2>
        {error && <p className="text-red-500 text-center mb-4">{error}</p>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
            <input
              type="email"
              id="email"
              className="w-full p-2 mt-1 border rounded-md"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">Password</label>
            <input
              type="password"
              id="password"
              className="w-full p-2 mt-1 border rounded-md"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button
            type="submit"
            className="w-full p-2 text-white bg-blue-500 rounded-md hover:bg-blue-600"
            disabled={loading}
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
        <div className="mt-4 text-center">
          <button
            onClick={handleGoogleSignIn}
            className="w-full p-2 text-white bg-red-500 rounded-md hover:bg-red-600"
            disabled={loadingGoogleSignIn}
          >
            {loadingGoogleSignIn ? 'Signing in with Google...' : 'Sign In with Google'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
