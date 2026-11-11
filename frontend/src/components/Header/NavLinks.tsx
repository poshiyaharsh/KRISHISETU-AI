import React from 'react';
import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export interface NavItem {
  to: string;
  label: string;
  available: boolean;
}

interface NavLinksProps {
  items: NavItem[];
  className?: string;
  onItemClick?: () => void;
}

export const NavLinks: React.FC<NavLinksProps> = ({ items, className = '', onItemClick }) => {
  const { t } = useTranslation();

  return (
    <nav className={className} aria-label="Main Navigation">
      <ul className="flex items-center gap-1 xl:gap-2 m-0 p-0 list-none">
        {items.map((item) => (
          <li key={item.to}>
            {item.available ? (
              <NavLink
                to={item.to}
                onClick={onItemClick}
                className={({ isActive }) =>
                  `relative inline-flex items-center min-h-[44px] px-3 py-2 text-base rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-paddy ${
                    isActive
                      ? 'font-bold text-paddy after:absolute after:bottom-0 after:inset-x-2 after:h-[3px] after:bg-wheat after:rounded-full'
                      : 'font-medium text-soil/80 hover:text-paddy hover:bg-mist/70'
                  }`
                }
              >
                {item.label}
              </NavLink>
            ) : (
              <span
                className="inline-flex items-center gap-1.5 min-h-[44px] px-3 py-2 text-base font-medium text-soil/40 cursor-not-allowed select-none"
                aria-disabled="true"
                title={t('common.comingSoonAria')}
              >
                <span>{item.label}</span>
                <span className="text-xs px-1.5 py-0.5 rounded bg-mist/60 text-soil/60 font-normal">
                  {t('common.comingSoon')}
                </span>
              </span>
            )}
          </li>
        ))}
      </ul>
    </nav>
  );
};
