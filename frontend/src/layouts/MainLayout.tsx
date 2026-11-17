import React, { useEffect, useRef } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Header } from '@/components/Header/Header';
import { BottomNav } from '@/components/Navigation/BottomNav';
import { BrandLogo } from '@/components/brand/BrandLogo';
import { ChatLauncher } from '@/components/chat/ChatLauncher';

export const MainLayout: React.FC = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const isChatPage = location.pathname === '/chat';
  const mainRef = useRef<HTMLElement | null>(null);

  // Focus management and scroll-to-top on route change
  useEffect(() => {
    if (typeof window !== 'undefined' && typeof window.scrollTo === 'function') {
      try {
        window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
      } catch {
        // Fallback for jsdom environments without scrollTo implementation
      }
    }
    // Focus the first heading in main or main container for screen readers
    const h1 = document.querySelector('h1');
    if (h1) {
      h1.setAttribute('tabindex', '-1');
      h1.focus({ preventScroll: true });
    } else if (mainRef.current) {
      mainRef.current.focus({ preventScroll: true });
    }
  }, [location.pathname]);

  return (
    <div
      className={`min-h-[100dvh] w-full max-w-full overflow-x-clip flex flex-col bg-cream/30 text-soil font-sans antialiased selection:bg-leaf/30 selection:text-paddy ${
        isChatPage ? '' : 'pb-[var(--bottomnav-h)] lg:pb-0'
      }`}
    >
      {/* Skip to main content link for screen reader accessibility */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-toast focus:px-4 focus:py-2 focus:bg-paddy focus:text-cream focus:rounded-md focus:shadow-md focus:outline-none focus:ring-2 focus:ring-wheat"
      >
        {t('common.skipToContent', 'Skip to main content')}
      </a>

      {/* Main navigation header */}
      <Header />

      {/* Main Content Area */}
      <main
        id="main-content"
        ref={mainRef}
        tabIndex={-1}
        className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 focus:outline-none"
      >
        <Outlet />
      </main>

      {/* Footer (placed above bottom nav on mobile) */}
      {!isChatPage && (
        <footer className="w-full border-t border-border bg-surface-sunken/80 py-8 mt-auto">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-soil/70 text-center sm:text-left">
              <div className="flex items-center gap-2">
                <BrandLogo variant="icon" size={20} className="w-5 h-5 shrink-0" />
                <span className="font-bold text-paddy">KrishiSetu AI</span>
                <span>— {t('common.tagline', 'Smarter Farming. Better Decisions. Brighter Tomorrow.')}</span>
              </div>
              <div className="flex items-center gap-4">
                <Link to="/about" className="hover:text-paddy underline-offset-4 hover:underline">
                  {t('nav.about', 'About')}
                </Link>
                <Link to="/privacy" className="hover:text-paddy underline-offset-4 hover:underline">
                  {t('nav.privacy', 'Privacy')}
                </Link>
                <p>© 2026 KrishiSetu AI. Built for Indian Farmers.</p>
              </div>
            </div>
            <p className="text-[11px] text-soil/60 text-center max-w-3xl mx-auto leading-relaxed">
              {t(
                'common.safetyDisclaimer',
                'Advisory Notice: Predictions are AI-assisted based on ICAR agronomic thresholds. Always consult your local Agriculture Extension Officer or Krishi Vigyan Kendra (KVK) before major planting decisions.'
              )}
            </p>
          </div>
        </footer>
      )}

      {/* Mobile Fixed 5-Tab Bottom Navigation Bar (Hidden on desktop and on /chat) */}
      <BottomNav />

      {/* Desktop Floating Chat Launcher (Hidden on mobile and on /chat) */}
      <ChatLauncher />
    </div>
  );
};

export default MainLayout;
