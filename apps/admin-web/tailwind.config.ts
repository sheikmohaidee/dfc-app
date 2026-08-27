import type { Config } from 'tailwindcss';

/**
 * The same tokens as packages/core/src/tokens.ts and
 * apps/mobile/tailwind.config.js. Values live in CSS variables (globals.css)
 * so the dark palette can swap them without rebuilding.
 *
 * Tailwind v3, deliberately: NativeWind only supports v3, and in one workspace
 * both apps have to agree on a major or the hoisted copy breaks the other one.
 */
const config: Config = {
  darkMode: ['class'],
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        background: 'var(--background)',
        foreground: 'var(--foreground)',
        surface: 'var(--surface)',
        card: { DEFAULT: 'var(--card)', foreground: 'var(--card-foreground)' },
        muted: { DEFAULT: 'var(--muted)', foreground: 'var(--muted-foreground)' },
        border: 'var(--border)',
        input: 'var(--input)',
        ring: 'var(--ring)',
        primary: { DEFAULT: 'var(--primary)', foreground: 'var(--primary-foreground)' },
        secondary: { DEFAULT: 'var(--secondary)', foreground: 'var(--secondary-foreground)' },
        accent: { DEFAULT: 'var(--accent)', foreground: 'var(--accent-foreground)' },
        disabled: 'var(--disabled)',
        placeholder: 'var(--placeholder)',
        'body-strong': 'var(--body-strong)',
        icon: 'var(--icon)',

        pharmacy: {
          DEFAULT: 'var(--pharmacy)',
          fg: 'var(--pharmacy-fg)',
          tint: 'var(--pharmacy-tint)',
          border: 'var(--pharmacy-border)',
        },
        grocery: {
          DEFAULT: 'var(--grocery)',
          fg: 'var(--grocery-fg)',
          tint: 'var(--grocery-tint)',
          border: 'var(--grocery-border)',
        },
        food: {
          DEFAULT: 'var(--food)',
          fg: 'var(--food-fg)',
          tint: 'var(--food-tint)',
          border: 'var(--food-border)',
        },
        concierge: {
          DEFAULT: 'var(--concierge)',
          fg: 'var(--concierge-fg)',
          tint: 'var(--concierge-tint)',
          border: 'var(--concierge-border)',
        },
        verify: {
          DEFAULT: 'var(--verify)',
          fg: 'var(--verify-fg)',
          tint: 'var(--verify-tint)',
          border: 'var(--verify-border)',
        },
        destructive: {
          DEFAULT: 'var(--destructive)',
          fg: 'var(--destructive-fg)',
          tint: 'var(--destructive-tint)',
          border: 'var(--destructive-border)',
        },
      },
      borderRadius: {
        sm: '4px',
        md: '7px',
        lg: '8px',
        xl: '12px',
        '2xl': '14px',
      },
      boxShadow: {
        sm: '0 1px 2px 0 rgb(9 9 11 / 0.05)',
        card: '0 1px 3px 0 rgb(9 9 11 / 0.08), 0 1px 2px -1px rgb(9 9 11 / 0.06)',
        float: '0 2px 8px rgb(9 9 11 / 0.12)',
        sheet: '-16px 0 48px rgb(9 9 11 / 0.18)',
      },
      fontFamily: {
        sans: ['var(--font-geist)', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
        mono: ['var(--font-geist-mono)', 'ui-monospace', 'SF Mono', 'Menlo', 'monospace'],
        tamil: ['var(--font-hind-madurai)', 'Noto Sans Tamil', 'Nirmala UI', 'sans-serif'],
      },
      keyframes: {
        'dfc-pulse': {
          '0%,100%': { opacity: '1' },
          '50%': { opacity: '0.4' },
        },
        'dfc-in': {
          from: { opacity: '0', transform: 'translateY(6px)' },
          to: { opacity: '1', transform: 'none' },
        },
      },
      animation: {
        'dfc-pulse': 'dfc-pulse 1.4s ease-in-out infinite',
        'dfc-in': 'dfc-in 0.22s cubic-bezier(0.2, 0.6, 0.3, 1) both',
      },
    },
  },
  plugins: [],
};

export default config;
