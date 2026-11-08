/** KrishiSetu AI design tokens. Keep in sync with tokens.css. */
export const colors = {
  paddy: '#0F4A32',
  leaf: '#3B8E4F',
  sprout: '#4FA35B',
  wheat: '#D9A93F',
  cream: '#F5F0DC',
  mist: '#E4ECDD',
  soil: '#1D2B22',
  success: '#236E3B',
  warning: '#8C5E06',
  danger: '#B3402F',
  info: '#2B6C8F',
} as const;

export const fontSizes = {
  xs: '0.875rem',
  sm: '1rem',
  base: '1.125rem',
  lg: '1.25rem',
  xl: '1.5rem',
  '2xl': '1.875rem',
  '3xl': '2.375rem',
  '4xl': '3rem',
} as const;

export const radius = { sm: '6px', md: '10px', lg: '18px', pill: '999px' } as const;

export const shadows = {
  sm: '0 2px 6px rgba(15, 74, 50, 0.1)',
  md: '0 8px 22px rgba(15, 74, 50, 0.14)',
} as const;

export const breakpoints = { sm: 480, md: 768, lg: 1024, xl: 1280 } as const;

export const tokens = { colors, fontSizes, radius, shadows, breakpoints } as const;

/** Spread into tailwind.config.ts under theme.extend (wired in Phase 1). */
export const tailwindTheme = {
  colors: {
    paddy: colors.paddy,
    leaf: colors.leaf,
    sprout: colors.sprout,
    wheat: colors.wheat,
    cream: colors.cream,
    mist: colors.mist,
    soil: colors.soil,
  },
  borderRadius: radius,
  boxShadow: shadows,
  fontFamily: { sans: 'var(--ks-font-sans)' },
  screens: Object.fromEntries(
    Object.entries(breakpoints).map(([k, v]) => [k, `${v}px`]),
  ),
} as const;

export default tokens;
