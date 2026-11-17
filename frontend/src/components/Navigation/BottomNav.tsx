import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Home, Sprout, CloudSun, Landmark, MessageSquare } from 'lucide-react';

export const BottomNav: React.FC = () => {
  const { t } = useTranslation();
  const location = useLocation();

  // Hide bottom navigation on /chat so the chat input has full viewport
  if (location.pathname === '/chat') {
    return null;
  }

  const tabs = [
    { to: '/', label: t('nav.home', 'Home'), icon: Home, end: true },
    { to: '/recommend', label: t('nav.recommend', 'Crop Advice'), icon: Sprout, end: false },
    { to: '/weather', label: t('nav.weather', 'Weather'), icon: CloudSun, end: false },
    { to: '/schemes', label: t('nav.schemes', 'Schemes'), icon: Landmark, end: false },
    { to: '/chat', label: t('nav.chatbot', 'Krishi Mitra'), icon: MessageSquare, end: false },
  ];

  return (
    <nav
      aria-label="Mobile Navigation"
      className="lg:hidden fixed bottom-0 inset-x-0 z-bottomnav h-[var(--bottomnav-h)] bg-surface border-t border-border flex items-center justify-around px-1 shadow-[0_-2px_10px_rgba(0,0,0,0.04)] pb-safe"
    >
      {tabs.map((tab) => {
        const Icon = tab.icon;
        return (
          <NavLink
            key={tab.to}
            to={tab.to}
            end={tab.end}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center min-h-[48px] min-w-[48px] flex-1 py-1 rounded-lg text-xs font-bold transition-colors select-none ${
                isActive
                  ? 'text-primary'
                  : 'text-text-muted hover:text-soil'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Icon
                  className={`w-5 h-5 mb-0.5 transition-transform ${
                    isActive ? 'scale-110 stroke-[2.5]' : 'stroke-2'
                  }`}
                  aria-hidden="true"
                />
                <span className="truncate max-w-[68px] leading-tight text-[11px]">
                  {tab.label}
                </span>
              </>
            )}
          </NavLink>
        );
      })}
    </nav>
  );
};

export default BottomNav;
