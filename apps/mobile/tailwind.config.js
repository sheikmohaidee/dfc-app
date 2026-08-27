/**
 * NativeWind reads the same tokens as the web app (packages/core/src/tokens.ts
 * and apps/admin-web/src/app/globals.css). Keep the three in step.
 *
 * NativeWind v4 requires Tailwind 3.x — the web app is on Tailwind 4, which is
 * fine: they are independent builds that agree on values, not on config.
 */
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx,ts,tsx}', './src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        background: '#FFFFFF',
        surface: '#FAFAFA',
        muted: '#F4F4F5',
        border: '#E4E4E7',
        disabled: '#D4D4D8',
        placeholder: '#A1A1AA',
        'muted-foreground': '#71717A',
        icon: '#52525B',
        'body-strong': '#3F3F46',
        'on-dark-chip': '#27272A',
        primary: '#18181B',
        foreground: '#09090B',
        'primary-foreground': '#FAFAFA',

        pharmacy: { DEFAULT: '#2563EB', fg: '#1D4ED8', tint: '#EFF6FF', border: '#DBEAFE' },
        grocery: { DEFAULT: '#16A34A', fg: '#15803D', tint: '#F0FDF4', border: '#BBF7D0' },
        food: { DEFAULT: '#EA580C', fg: '#C2410C', tint: '#FFF7ED', border: '#FED7AA' },
        concierge: { DEFAULT: '#7C3AED', fg: '#6D28D9', tint: '#F5F3FF', border: '#DDD6FE' },
        verify: { DEFAULT: '#B45309', fg: '#92400E', tint: '#FFFBEB', border: '#FDE68A' },
        destructive: { DEFAULT: '#DC2626', fg: '#B91C1C', tint: '#FEF2F2', border: '#FECACA' },
      },
      borderRadius: {
        chip: '4px',
        segment: '7px',
        control: '8px',
        card: '12px',
        generative: '14px',
      },
      fontFamily: {
        sans: ['Geist', 'System'],
        mono: ['GeistMono', 'Menlo', 'monospace'],
        tamil: ['HindMadurai', 'System'],
      },
    },
  },
  plugins: [],
};
