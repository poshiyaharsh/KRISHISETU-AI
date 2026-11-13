import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        paddy: 'var(--ks-color-paddy)',
        paddyLight: 'var(--ks-color-paddy-light)',
        leaf: 'var(--ks-color-leaf)',
        sprout: 'var(--ks-color-sprout)',
        wheat: 'var(--ks-color-wheat)',
        cream: 'var(--ks-color-cream)',
        mist: 'var(--ks-color-mist)',
        soil: 'var(--ks-color-soil)',
        success: 'var(--ks-color-success)',
        warning: 'var(--ks-color-warning)',
        danger: 'var(--ks-color-danger)',
        info: 'var(--ks-color-info)',
        'text-primary': 'var(--ks-text-primary)',
        'text-heading': 'var(--ks-text-heading)',
        'text-muted': 'var(--ks-text-muted)',
        'text-on-dark': 'var(--ks-text-on-dark)',
      },
      textColor: {
        primary: 'var(--ks-text-primary)',
        heading: 'var(--ks-text-heading)',
        muted: 'var(--ks-text-muted)',
        'on-dark': 'var(--ks-text-on-dark)',
        onDark: 'var(--ks-text-on-dark)',
      },
      borderRadius: {
        sm: 'var(--ks-radius-sm)',
        md: 'var(--ks-radius-md)',
        lg: 'var(--ks-radius-lg)',
        pill: 'var(--ks-radius-pill)',
      },
      boxShadow: {
        sm: 'var(--ks-shadow-sm)',
        md: 'var(--ks-shadow-md)',
      },
      fontFamily: {
        sans: 'var(--ks-font-sans)',
      },
      screens: {
        sm: '480px',
        md: '768px',
        lg: '1024px',
        header: '1100px',
        xl: '1280px',
      },
    },
  },
  plugins: [],
} satisfies Config;
