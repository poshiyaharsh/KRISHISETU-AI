import React from 'react';
import { Link, Outlet } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Header } from '@/components/Header/Header';
import { BrandLogo } from '@/components/brand/BrandLogo';
import { ChatLauncher } from '@/components/chat/ChatLauncher';

export const MainLayout: React.FC = () => {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen flex flex-col bg-cream/30 text-soil font-sans antialiased selection:bg-leaf/30 selection:text-paddy">
      {/* Skip to main content link for screen reader accessibility */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:px-4 focus:py-2 focus:bg-paddy focus:text-cream focus:rounded-md focus:shadow-md focus:outline-none focus:ring-2 focus:ring-wheat"
      >
        {t('common.skipToContent')}
      </a>

      {/* Main navigation header */}
      <Header />

      {/* Main Content Area */}
      <main id="main-content" className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-mist bg-cream/60 py-8 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-soil/70 text-center sm:text-left">
            <div className="flex items-center gap-2">
              <BrandLogo variant="icon" size={20} className="w-5 h-5 shrink-0" />
              <span className="font-bold text-paddy">KrishiSetu AI</span>
              <span>— {t('common.tagline')}</span>
            </div>
            <div className="flex items-center gap-4">
              <Link to="/about" className="hover:text-paddy underline-offset-4 hover:underline">
                {t('nav.about')}
              </Link>
              <Link to="/privacy" className="hover:text-paddy underline-offset-4 hover:underline">
                {t('nav.privacy')}
              </Link>
              <p>© 2026 KrishiSetu AI. Built for Indian Farmers.</p>
            </div>
          </div>
          <p className="text-[11px] text-soil/60 text-center max-w-3xl mx-auto leading-relaxed">
            {t('common.safetyDisclaimer')}
          </p>
        </div>
      </footer>

      {/* Floating Chat Launcher on all pages except /chat */}
      <ChatLauncher />
    </div>
  );
};
