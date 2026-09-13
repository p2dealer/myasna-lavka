import type { Config } from 'tailwindcss';

export default {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ivory: 'rgb(var(--c-ivory) / <alpha-value>)',
        paper: 'rgb(var(--c-paper) / <alpha-value>)',
        paper2: 'rgb(var(--c-paper2) / <alpha-value>)',
        ink: 'rgb(var(--c-ink) / <alpha-value>)',
        inksoft: 'rgb(var(--c-inksoft) / <alpha-value>)',
        inkfaint: 'rgb(var(--c-inkfaint) / <alpha-value>)',
        bordeaux: 'rgb(var(--c-bordeaux) / <alpha-value>)',
        ember: 'rgb(var(--c-ember) / <alpha-value>)',
        oak: 'rgb(var(--c-oak) / <alpha-value>)',
        line: 'rgb(var(--c-line) / <alpha-value>)',
        line2: 'rgb(var(--c-line2) / <alpha-value>)',
        good: 'rgb(var(--c-good) / <alpha-value>)',
        warn: 'rgb(var(--c-warn) / <alpha-value>)',
      },
      fontFamily: {
        display: ['var(--font-display)', 'Georgia', 'serif'],
        sans: ['var(--font-body)', 'system-ui', 'sans-serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      borderRadius: { xl2: '18px', xl3: '24px' },
      boxShadow: {
        soft: '0 1px 2px rgb(32 29 27 / 0.05), 0 2px 8px rgb(32 29 27 / 0.04)',
        card: '0 2px 6px rgb(32 29 27 / 0.06), 0 14px 34px rgb(32 29 27 / 0.09)',
        pop: '0 20px 60px rgb(32 29 27 / 0.18)',
      },
      keyframes: {
        shimmer: { '100%': { backgroundPosition: '-200% 0' } },
        toastIn: { from: { opacity: '0', transform: 'translateY(12px)' }, to: { opacity: '1', transform: 'none' } },
        drawerIn: { from: { transform: 'translateX(100%)' }, to: { transform: 'none' } },
      },
      animation: {
        shimmer: 'shimmer 1.4s linear infinite',
        toastIn: 'toastIn .3s cubic-bezier(.2,.9,.3,1)',
        drawerIn: 'drawerIn .3s cubic-bezier(.2,.9,.3,1)',
      },
    },
  },
  plugins: [],
} satisfies Config;
