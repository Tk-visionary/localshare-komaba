import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext';
import Header from './components/Header';
import HomePage from './pages/HomePage';
import PostItemPage from './pages/PostItemPage';
import MyItemsPage from './pages/MyItemsPage';
import EditItemPage from './pages/EditItemPage';
import LoginPage from './pages/LoginPage';
import ProtectedRoute from './components/ProtectedRoute';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <div className="min-h-screen bg-komaba-background font-sans flex flex-col">
            <Toaster position="top-center" reverseOrder={false} />
            <Header />
            <main className="flex-grow">
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route element={<ProtectedRoute />}>
                    <Route path="/post-item" element={<PostItemPage />} />
                    <Route path="/my-items" element={<MyItemsPage />} />
                    <Route path="/edit-item/:itemId" element={<EditItemPage />} />
                </Route>
              </Routes>
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