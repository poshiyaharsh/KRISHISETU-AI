import React from 'react';
import { useTranslation } from 'react-i18next';

export type BrandLogoVariant = 'icon' | 'lockup' | 'reversed' | 'mono';

export interface BrandLogoProps {
  /**
   * Brand mark variant:
   * - 'icon': 120x120 bridge arch with sprout mark (/logo-icon.svg)
   * - 'lockup': 520x120 full lockup for light backgrounds (/logo.svg)
   * - 'reversed': 520x120 full lockup for dark paddy backgrounds (/logo-reversed.svg)
   * - 'mono': 120x120 single-color mark using currentColor (/logo-mono.svg)
   */
  variant?: BrandLogoVariant;
  /** Size in pixels (applies to height for lockups, width/height for square icons). */
  size?: number | string;
  /** Custom accessible alt text. Defaults to localized platform name via t(). */
  alt?: string;
  className?: string;
}

const LOGO_FILES: Record<BrandLogoVariant, string> = {
  icon: '/logo-icon.svg',
  lockup: '/logo.svg',
  reversed: '/logo-reversed.svg',
  mono: '/logo-mono.svg',
};

const DEFAULT_SIZES: Record<BrandLogoVariant, { width: number | string; height: number | string }> = {
  icon: { width: 32, height: 32 },
  mono: { width: 32, height: 32 },
  lockup: { width: 'auto', height: 36 },
  reversed: { width: 'auto', height: 36 },
};

export const BrandLogo: React.FC<BrandLogoProps> = ({
  variant = 'icon',
  size,
  alt,
  className = '',
}) => {
  const { t } = useTranslation();
  const defaultAlt = t('brand.name', 'KrishiSetu AI');
  const resolvedAlt = alt !== undefined ? alt : defaultAlt;
  const src = LOGO_FILES[variant];

  const defaultDimension = DEFAULT_SIZES[variant];
  const width = size !== undefined ? (variant === 'icon' || variant === 'mono' ? size : 'auto') : defaultDimension.width;
  const height = size !== undefined ? size : defaultDimension.height;

  return (
    <img
      src={src}
      alt={resolvedAlt}
      width={width}
      height={height}
      className={`inline-block select-none ${className}`}
      draggable={false}
    />
  );
};

export default BrandLogo;
