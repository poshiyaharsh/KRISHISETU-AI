import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Menu, X } from 'lucide-react';
import { LanguageSelector } from '@/components/LanguageSelector';
import { NavLinks, type NavItem } from './NavLinks';
import { MobileMenu } from './MobileMenu';

export const Header: React.FC = () => {
  const { t } = useTranslation();
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement | null>(null);

  // Monitor scroll for shadow (> 8px)
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 8);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // Initial check

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const navItems: NavItem[] = [
    { to: '/', label: t('nav.home'), available: true },
    { to: '/recommend', label: t('nav.recommend'), available: true },
    { to: '/weather', label: t('nav.weather'), available: true },
    { to: '/schemes', label: t('nav.schemes'), available: true },
    { to: '/nutrition', label: t('nav.nutrition'), available: true },
    { to: '/chat', label: t('nav.chatbot'), available: true },
  ];

  return (
    <header
      className={`sticky top-0 z-40 w-full h-16 header:h-[72px] bg-cream border-b border-mist transition-shadow duration-200 motion-reduce:transition-none ${
        isScrolled ? 'shadow-sm' : ''
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center justify-between">
        {/* Step 2: Brand Block (Left) */}
        <Link
          to="/"
          aria-label="KrishiSetu AI, home"
          className="flex items-center gap-[10px] shrink-0 whitespace-nowrap me-8 focus:outline-none focus-visible:ring-2 focus-visible:ring-paddy rounded-md py-1"
        >
          <img
            src="/logo-icon.svg"
            alt=""
            width="40"
            height="40"
            className="w-10 h-10 shrink-0 select-none pointer-events-none"
          />
          <span className="font-extrabold text-paddy text-2xl leading-none tracking-tight select-none">
            KrishiSetu <span className="text-leaf">AI</span>
          </span>
        </Link>

        {/* Step 4: Desktop Nav Links (Center / Right) */}
        <div className="hidden header:flex items-center justify-between flex-1">
          <NavLinks items={navItems} />

          {/* Right Side: Language Selector Only */}
          <div className="flex items-center ms-4">
            <LanguageSelector />
          </div>
        </div>

        {/* Tablet & Mobile Right Actions (< 1100px) */}
        <div className="flex header:hidden items-center gap-2">
          <LanguageSelector />
          <button
            ref={menuButtonRef}
            type="button"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-nav-panel"
            aria-label={mobileMenuOpen ? t('nav.closeMenu') : t('nav.openMenu')}
            className="w-12 h-12 min-w-[48px] min-h-[48px] flex items-center justify-center rounded-xl text-paddy hover:bg-mist/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-paddy transition-colors"
          >
            {mobileMenuOpen ? (
              <X className="w-6 h-6" aria-hidden="true" />
            ) : (
              <Menu className="w-6 h-6" aria-hidden="true" />
            )}
          </button>
        </div>
      </div>

      {/* Step 5: Mobile Navigation Panel */}
      <MobileMenu
        id="mobile-nav-panel"
        isOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        items={navItems}
        menuButtonRef={menuButtonRef}
      />
    </header>
  );
};
