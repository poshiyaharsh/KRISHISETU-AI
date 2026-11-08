import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        paddy: 'var(--ks-color-paddy)',
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
    },
  },
  plugins: [],
} satisfies Config;
