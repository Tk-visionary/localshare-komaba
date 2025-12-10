import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext';
import Header from './components/Header';
import ProtectedRoute from './components/ProtectedRoute';

// Lazy load pages for code splitting
const HomePage = lazy(() => import('./pages/HomePage'));
const PostItemPage = lazy(() => import('./pages/PostItemPage'));
const MyItemsPage = lazy(() => import('./pages/MyItemsPage'));
const EditItemPage = lazy(() => import('./pages/EditItemPage'));
const MessagesPage = lazy(() => import('./pages/MessagesPage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const LoginPage = lazy(() => import('./pages/LoginPage'));

// Loading fallback component
const PageLoader = () => (
  <div className="flex justify-center items-center min-h-[50vh]">
    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-komaba-orange"></div>
  </div>
);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5分間はデータを新鮮として扱う
      gcTime: 1000 * 60 * 30, // 30分間キャッシュを保持
      retry: 1, // 失敗時は1回だけリトライ
      refetchOnWindowFocus: false, // ウィンドウフォーカス時の自動再取得を無効化
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <div className="min-h-screen bg-komaba-background font-sans flex flex-col">
            <Toaster position="top-center" reverseOrder={false} />
            <Header />
            <main className="flex-grow">
              <Suspense fallback={<PageLoader />}>
                <Routes>
                  <Route path="/" element={<HomePage />} />
                  <Route path="/login" element={<LoginPage />} />
                  <Route element={<ProtectedRoute />}>
                    <Route path="/post-item" element={<PostItemPage />} />
                    <Route path="/my-items" element={<MyItemsPage />} />
                    <Route path="/edit-item/:itemId" element={<EditItemPage />} />
                    <Route path="/messages" element={<MessagesPage />} />
                    <Route path="/profile" element={<ProfilePage />} />
                  </Route>
                </Routes>
              </Suspense>
            </main>
            <footer className="bg-komaba-header text-white text-center p-4 mt-8">
              <p>&copy; 2025 LocalShare Project. All rights reserved.</p>
            </footer>
          </div>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;