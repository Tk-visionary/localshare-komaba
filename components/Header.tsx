import React, { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { APP_NAME, APP_SUBTITLE } from '../constants';

const Header: React.FC = () => {
  const { currentUser, logout, loading } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navLinkClasses = ({ isActive }: { isActive: boolean }): string =>
    `px-3 py-2 rounded-md text-sm font-medium transition-colors ${
      isActive ? 'bg-komaba-orange/30 text-white' : 'text-gray-300 hover:bg-komaba-orange/20 hover:text-white'
    }`;

  const mobileNavLinkClasses = ({ isActive }: { isActive: boolean }): string =>
    `block px-3 py-2 rounded-md text-base font-medium transition-colors ${
      isActive ? 'bg-komaba-orange text-white' : 'text-gray-300 hover:bg-komaba-orange/20 hover:text-white'
    }`;

  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  return (
    <header className="bg-komaba-header text-white shadow-md sticky top-0 z-40">
      <nav className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex-shrink-0 flex items-baseline space-x-2" onClick={closeMobileMenu}>
              <span className="text-xl font-bold tracking-tight">{APP_NAME}</span>
              <span className="text-xs text-gray-400">{APP_SUBTITLE}</span>
            </Link>
            <div className="hidden md:block">
              <div className="ml-10 flex items-baseline space-x-4">
                <NavLink to="/" className={navLinkClasses}>ホーム</NavLink>
                <NavLink to="/post-item" className={navLinkClasses}>出品する</NavLink>
                <NavLink to="/my-items" className={navLinkClasses}>マイページ</NavLink>
              </div>
            </div>
          </div>

          <div className="flex items-center">
            {/* Desktop Auth Section */}
            <div className="hidden md:block">
              {loading ? (
                <div className="w-8 h-8 border-2 border-dashed rounded-full animate-spin border-white"></div>
              ) : currentUser ? (
                <div className="flex items-center space-x-4">
                  <div className="flex items-center">
                    <img src={currentUser.picture} alt={currentUser.name} className="h-8 w-8 rounded-full" />
                    <span className="ml-2 text-sm font-medium">{currentUser.name}</span>
                  </div>
                  <button
                    onClick={logout}
                    className="bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-md text-sm font-medium transition-colors"
                  >
                    ログアウト
                  </button>
                </div>
              ) : (
                <Link to="/login">
                  <button className="bg-komaba-orange hover:brightness-90 text-white px-3 py-2 rounded-md text-sm font-medium transition-colors">
                    ログイン
                  </button>
                </Link>
              )}
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden flex items-center">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-white hover:bg-komaba-orange/30 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
                aria-controls="mobile-menu"
                aria-expanded={isMobileMenuOpen}
              >
                <span className="sr-only">Open main menu</span>
                {isMobileMenuOpen ? (
                  <svg className="block h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                ) : (
                  <svg className="block h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16m-7 6h7" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu panel */}
        {isMobileMenuOpen && (
          <div className="md:hidden" id="mobile-menu">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
              <NavLink to="/" className={mobileNavLinkClasses} onClick={closeMobileMenu}>ホーム</NavLink>
              <NavLink to="/post-item" className={mobileNavLinkClasses} onClick={closeMobileMenu}>出品する</NavLink>
              <NavLink to="/my-items" className={mobileNavLinkClasses} onClick={closeMobileMenu}>マイページ</NavLink>
            </div>
            <div className="pt-4 pb-3 border-t border-gray-700">
              {loading ? (
                 <div className="flex justify-center items-center h-10 px-5">
                    <div className="w-8 h-8 border-2 border-dashed rounded-full animate-spin border-white"></div>
                 </div>
              ) : currentUser ? (
                <div className="flex items-center justify-between px-5">
                  <div className="flex items-center">
                    <img className="h-10 w-10 rounded-full" src={currentUser.picture} alt={currentUser.name} />
                    <div className="ml-3">
                      <div className="text-base font-medium leading-none text-white">{currentUser.name}</div>
                      <div className="text-sm font-medium leading-none text-gray-400 mt-1">{currentUser.email}</div>
                    </div>
                  </div>
                  <button
                    onClick={() => { logout(); closeMobileMenu(); }}
                    className="ml-4 flex-shrink-0 bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-md text-sm font-medium transition-colors"
                  >
                    ログアウト
                  </button>
                </div>
              ) : (
                <div className="px-5">
                  <Link to="/login" onClick={closeMobileMenu}>
                    <button className="w-full bg-komaba-orange hover:brightness-90 text-white px-3 py-2 rounded-md text-sm font-medium transition-colors">
                      ログイン
                    </button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </nav>
    </header>
  );
};

export default Header;
