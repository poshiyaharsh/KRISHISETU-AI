import React, { useEffect, useRef } from 'react';
import { NavLink, Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Sprout, LogOut } from 'lucide-react';
import type { NavItem } from './NavLinks';

interface MobileMenuProps {
  id?: string;
  isOpen: boolean;
  onClose: () => void;
  items: NavItem[];
  menuButtonRef: React.RefObject<HTMLButtonElement | null>;
  onLogout?: () => void;
}

export const MobileMenu: React.FC<MobileMenuProps> = ({
  id = 'mobile-nav-panel',
  isOpen,
  onClose,
  items,
  menuButtonRef,
  onLogout,
}) => {
  const { t } = useTranslation();
  const location = useLocation();
  const panelRef = useRef<HTMLDivElement>(null);

  // Close on route change
  const prevPathnameRef = useRef(location.pathname);
  useEffect(() => {
    if (prevPathnameRef.current !== location.pathname) {
      prevPathnameRef.current = location.pathname;
      if (isOpen) {
        onClose();
      }
    }
  }, [location.pathname, isOpen, onClose]);

  // Body scroll lock
  useEffect(() => {
    if (!isOpen) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen]);

  // Focus trap & Escape key handler
  useEffect(() => {
    if (!isOpen) return;

    const panel = panelRef.current;
    if (!panel) return;

    // Focus first interactive element
    const focusableElements = panel.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
    );
    if (focusableElements.length > 0) {
      focusableElements[0]?.focus();
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
        menuButtonRef.current?.focus();
        return;
      }

      if (e.key === 'Tab') {
        const focusables = panel.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );
        if (focusables.length === 0) return;

        const first = focusables[0];
        const last = focusables[focusables.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === first) {
            e.preventDefault();
            last?.focus();
          }
        } else {
          if (document.activeElement === last) {
            e.preventDefault();
            first?.focus();
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose, menuButtonRef]);

  // Outside click handler
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        panelRef.current &&
        !panelRef.current.contains(target) &&
        menuButtonRef.current &&
        !menuButtonRef.current.contains(target)
      ) {
        onClose();
        menuButtonRef.current?.focus();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose, menuButtonRef]);

  if (!isOpen) {
    return null;
  }

  return (
    <div
      id={id}
      ref={panelRef}
      role="region"
      aria-label={t('nav.openMenu')}
      className="header:hidden absolute top-full inset-x-0 bg-cream border-b border-mist shadow-md transition-all duration-200 motion-reduce:transition-none z-50 overflow-y-auto max-h-[calc(100vh-64px)] px-4 py-4"
    >
      <nav aria-label={t('nav.openMenu')} className="space-y-1">
        <ul className="m-0 p-0 list-none space-y-1">
          {items.map((item) => (
            <li key={item.to}>
              {item.available ? (
                <NavLink
                  to={item.to}
                  onClick={() => {
                    onClose();
                    menuButtonRef.current?.focus();
                  }}
                  className={({ isActive }) =>
                    `min-h-[56px] w-full flex items-center px-4 rounded-xl text-base transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-paddy ${
                      isActive
                        ? 'font-bold text-paddy bg-mist/60 border-s-4 border-wheat ps-3'
                        : 'font-medium text-soil/80 hover:text-paddy hover:bg-mist/40'
                    }`
                  }
                >
                  {item.label}
                </NavLink>
              ) : (
                <div
                  className="min-h-[56px] w-full flex items-center justify-between px-4 rounded-xl text-base font-medium text-soil/40 select-none cursor-not-allowed"
                  aria-disabled="true"
                >
                  <span>{item.label}</span>
                  <span className="text-xs px-2 py-0.5 rounded bg-mist/60 text-soil/60 font-normal">
                    {t('common.comingSoon')}
                  </span>
                </div>
              )}
            </li>
          ))}
        </ul>

        <div className="pt-4 border-t border-mist/60 mt-2 space-y-2">
          {onLogout && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onLogout();
              }}
              className="w-full inline-flex items-center justify-center gap-2 min-h-[48px] px-4 py-2.5 rounded-xl border border-mist bg-white text-soil hover:text-paddy hover:bg-mist/40 font-medium text-base transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-paddy"
            >
              <LogOut className="w-5 h-5" />
              <span>{t('auth.logout')}</span>
            </button>
          )}
          <Link
            to="/recommend"
            onClick={() => {
              onClose();
              menuButtonRef.current?.focus();
            }}
            className="w-full inline-flex items-center justify-center gap-2 min-h-[48px] px-4 py-3 rounded-xl bg-paddy hover:bg-paddy/90 text-cream font-bold text-base shadow-sm transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-paddy"
          >
            <Sprout className="w-5 h-5 text-wheat" />
            <span>{t('home.ctaButton')}</span>
          </Link>
        </div>
      </nav>
    </div>
  );
};
