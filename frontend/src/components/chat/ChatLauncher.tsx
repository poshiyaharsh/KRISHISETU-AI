import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { BrandLogo } from '@/components/brand/BrandLogo';

export const ChatLauncher: React.FC = () => {
  const { t } = useTranslation();
  const location = useLocation();

  // Hide on chat page itself
  if (location.pathname === '/chat') {
    return null;
  }

  const label = t('chat.launcherLabel', 'Chat with Krishi Mitra');

  return (
    <Link
      to="/chat"
      aria-label={label}
      title={label}
      className="fixed bottom-6 end-6 sm:bottom-8 sm:end-8 z-40 w-14 h-14 sm:w-[60px] sm:h-[60px] rounded-full bg-paddy text-on-dark flex items-center justify-center shadow-lg hover:shadow-xl hover:bg-paddy/90 active:scale-95 transition-all duration-200 border-2 border-wheat/40 focus:outline-none focus-visible:ring-4 focus-visible:ring-wheat/60 focus-visible:ring-offset-2 focus-visible:ring-offset-cream group"
    >
      <BrandLogo
        variant="reversed"
        size={28}
        className="w-7 h-7 transition-transform group-hover:scale-110"
      />
      <span className="sr-only">{label}</span>
    </Link>
  );
};

export default ChatLauncher;
