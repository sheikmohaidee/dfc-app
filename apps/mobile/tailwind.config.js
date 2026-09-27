/**
 * NativeWind Tailwind Config — DFC Stitch Dark Floating Theme.
 *
 * Customer screens use the dark Stitch palette.
 * Vendor/Rider screens still reference the legacy category hues.
 */
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx,ts,tsx}', './src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        // ── Stitch Dark Surface Hierarchy ──────────────────────────
        background: '#131315',
        surface: '#131315',
        'surface-dim': '#131315',
        'surface-bright': '#39393B',
        'surface-container-lowest': '#0E0E10',
        'surface-container-low': '#1C1B1D',
        'surface-container': '#201F21',
        'surface-container-high': '#2A2A2C',
        'surface-container-highest': '#353437',
        'surface-variant': '#353437',
        'surface-tint': '#C8BFFF',

        // ── Primary (DFC Purple) ──────────────────────────────────
        primary: {
          DEFAULT: '#C8BFFF',
          container: '#6A5ACD',
          fixed: '#E5DEFF',
          'fixed-dim': '#C8BFFF',
          tint: '#1A1040',
          foreground: '#FFFFFF',
        },
        'primary-container': '#6A5ACD',
        'on-primary': '#2D128F',
        'on-primary-container': '#F0EBFF',
        'primary-fixed': '#E5DEFF',
        'primary-fixed-dim': '#C8BFFF',
        'on-primary-fixed': '#190064',
        'on-primary-fixed-variant': '#4532A6',

        // ── Secondary (Coral/Orange) ──────────────────────────────
        secondary: {
          DEFAULT: '#FFB59C',
          container: '#8E2C01',
          fixed: '#FFDBCF',
          'fixed-dim': '#FFB59C',
        },
        'secondary-container': '#8E2C01',
        'on-secondary': '#5C1A00',
        'on-secondary-container': '#FFAA8D',
        'secondary-fixed': '#FFDBCF',
        'secondary-fixed-dim': '#FFB59C',
        'on-secondary-fixed': '#380C00',
        'on-secondary-fixed-variant': '#822800',

        // ── Tertiary (Cyan/Blue) ──────────────────────────────────
        tertiary: {
          DEFAULT: '#7BD0FF',
          container: '#00739C',
          fixed: '#C4E7FF',
          'fixed-dim': '#7BD0FF',
        },
        'tertiary-container': '#00739C',
        'on-tertiary': '#00354A',
        'on-tertiary-container': '#DBF0FF',
        'tertiary-fixed': '#C4E7FF',
        'tertiary-fixed-dim': '#7BD0FF',
        'on-tertiary-fixed': '#001E2C',
        'on-tertiary-fixed-variant': '#004C69',

        // ── On-surface ────────────────────────────────────────────
        'on-surface': '#E5E1E4',
        'on-surface-variant': '#C9C4D5',
        'on-background': '#E5E1E4',
        outline: '#928F9E',
        'outline-variant': '#474553',

        // ── Inverse ───────────────────────────────────────────────
        'inverse-surface': '#E5E1E4',
        'inverse-on-surface': '#313032',
        'inverse-primary': '#5D4CBF',

        // ── Error ─────────────────────────────────────────────────
        error: '#FFB4AB',
        'error-container': '#93000A',
        'on-error': '#690005',
        'on-error-container': '#FFDAD6',

        // ── Legacy category hues (Vendor/Rider backward compat) ──
        pharmacy: { DEFAULT: '#2563EB', fg: '#1D4ED8', tint: '#EFF6FF', border: '#DBEAFE' },
        grocery: { DEFAULT: '#0A6A32', fg: '#065F46', tint: '#ECFDF5', border: '#A7F3D0' },
        food: { DEFAULT: '#EA580C', fg: '#C2410C', tint: '#FFF7ED', border: '#FED7AA' },
        concierge: { DEFAULT: '#7A1F3D', fg: '#5E1730', tint: '#FDF2F5', border: '#FCE7F3' },
        verify: { DEFAULT: '#D97706', fg: '#B45309', tint: '#FFFBEB', border: '#FDE68A' },
        destructive: { DEFAULT: '#DC2626', fg: '#B91C1C', tint: '#FEF2F2', border: '#FECACA' },

        // ── Utility ───────────────────────────────────────────────
        foreground: '#E5E1E4',
        muted: '#353437',
        border: '#474553',
        disabled: '#474553',
        placeholder: '#928F9E',
        'muted-foreground': '#928F9E',
        icon: '#C9C4D5',
        'body-strong': '#E5E1E4',
      },
      borderRadius: {
        DEFAULT: '4px',
        chip: '6px',
        segment: '8px',
        control: '10px',
        lg: '12px',
        card: '14px',
        xl: '16px',
        generative: '16px',
        '2xl': '20px',
        '3xl': '24px',
        full: '9999px',
      },
      fontFamily: {
        sans: ['PlusJakartaSans', 'Archivo', 'System'],
        mono: ['GeistMono', 'Menlo', 'monospace'],
        tamil: ['HindMadurai', 'System'],
      },
      fontSize: {
        'label-sm': ['10px', { lineHeight: '14px', letterSpacing: '0.04em', fontWeight: '700' }],
        'label-md': ['12px', { lineHeight: '16px', letterSpacing: '0.02em', fontWeight: '600' }],
        'label-lg': ['14px', { lineHeight: '18px', letterSpacing: '0.01em', fontWeight: '600' }],
        'body-sm': ['12px', { lineHeight: '16px', letterSpacing: '0.01em', fontWeight: '400' }],
        'body-md': ['14px', { lineHeight: '20px', letterSpacing: '0em', fontWeight: '400' }],
        'body-lg': ['16px', { lineHeight: '24px', letterSpacing: '-0.005em', fontWeight: '500' }],
        'headline-sm': ['18px', { lineHeight: '24px', letterSpacing: '-0.01em', fontWeight: '600' }],
        'headline-lg': ['22px', { lineHeight: '28px', letterSpacing: '-0.015em', fontWeight: '700' }],
        'display-md': ['26px', { lineHeight: '32px', letterSpacing: '-0.02em', fontWeight: '700' }],
        'display-lg': ['32px', { lineHeight: '38px', letterSpacing: '-0.03em', fontWeight: '800' }],
      },
    },
  },
  plugins: [],
};
