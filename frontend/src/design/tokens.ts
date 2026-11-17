/** KrishiSetu AI design tokens v2. Keep in sync with tokens.css. */
export const colors = {
  surface: '#FFFFFF',
  surfaceRaised: '#FFFFFF',
  surfaceSunken: '#F4F1EA',
  primary: '#0F4A32',
  primaryLight: '#185A3E',
  primaryContrast: '#FFFFFF',
  accent: '#D9A93F',
  accentLight: '#FEF3C7',
  accentContrast: '#1D2B22',
  border: '#E2DDD5',
  borderWheat: '#D9A93F',
  focus: '#0F4A32',
  success: '#236E3B',
  warning: '#8C5E06',
  danger: '#B3402F',
  info: '#2B6C8F',

  // Legacy aliases
  paddy: '#0F4A32',
  paddyLight: '#185A3E',
  leaf: '#3B8E4F',
  sprout: '#4FA35B',
  wheat: '#D9A93F',
  cream: '#F5F0DC',
  mist: '#E4ECDD',
  soil: '#1D2B22',
} as const;

export const textColors = {
  primary: '#1D2B22',   // 14.60:1 on #FFFFFF, 13.03:1 on #F4F1EA (min 4.5:1)
  heading: '#0F4A32',   // 10.07:1 on #FFFFFF, 8.98:1 on #F4F1EA (min 4.5:1)
  muted: '#4D6854',     // 6.02:1 on #FFFFFF, 5.37:1 on #F4F1EA (min 4.5:1)
  onDark: '#FBFBF7',    // 9.65:1 on #0F4A32 (min 4.5:1)
} as const;

export const zIndex = {
  base: 0,
  sticky: 50,
  header: 100,
  bottomnav: 200,
  launcher: 300,
  drawer: 400,
  modal: 500,
  toast: 600,
} as const;

export const layout = {
  headerHeight: '68px',
  bottomNavHeight: '70px',
  stickyCtaHeight: '64px',
  pageGutter: 'clamp(1rem, 0.75rem + 1vw, 2rem)',
} as const;

export const fontSizes = {
  xs: 'clamp(0.75rem, 0.72rem + 0.15vw, 0.875rem)',
  sm: 'clamp(0.875rem, 0.84rem + 0.2vw, 1rem)',
  base: 'clamp(1rem, 0.96rem + 0.25vw, 1.125rem)',
  lg: 'clamp(1.125rem, 1.08rem + 0.35vw, 1.25rem)',
  xl: 'clamp(1.25rem, 1.18rem + 0.5vw, 1.5rem)',
  '2xl': 'clamp(1.5rem, 1.38rem + 0.75vw, 1.875rem)',
  '3xl': 'clamp(1.875rem, 1.7rem + 1.25vw, 2.375rem)',
  '4xl': 'clamp(2.25rem, 2rem + 1.75vw, 3rem)',
} as const;

export const radius = {
  sm: '6px',
  md: '10px',
  lg: '18px',
  pill: '9999px',
} as const;

export const shadows = {
  sm: '0 2px 6px rgba(15, 74, 50, 0.08)',
  md: '0 8px 22px rgba(15, 74, 50, 0.12)',
  lg: '0 16px 36px rgba(15, 74, 50, 0.16)',
} as const;

export const breakpoints = {
  sm: 480,
  md: 768,
  lg: 1024,
  header: 1024,
  xl: 1280,
} as const;

export const tokens = {
  colors,
  textColors,
  zIndex,
  layout,
  fontSizes,
  radius,
  shadows,
  breakpoints,
} as const;

/** Spread into tailwind.config.ts under theme.extend */
export const tailwindTheme = {
  colors: {
    ...colors,
    'text-primary': textColors.primary,
    'text-heading': textColors.heading,
    'text-muted': textColors.muted,
    'text-on-dark': textColors.onDark,
  },
  textColor: {
    primary: textColors.primary,
    heading: textColors.heading,
    muted: textColors.muted,
    'on-dark': textColors.onDark,
    onDark: textColors.onDark,
  },
  zIndex: Object.fromEntries(
    Object.entries(zIndex).map(([k, v]) => [k, `${v}`]),
  ),
  borderRadius: radius,
  boxShadow: shadows,
  fontFamily: { sans: 'var(--ks-font-sans)' },
  screens: Object.fromEntries(
    Object.entries(breakpoints).map(([k, v]) => [k, `${v}px`]),
  ),
} as const;

export default tokens;
