/**
 * NativeWind reads the same tokens as the core package.
 * DFC Burgundy theme (#7A1F3D) and Stitch Design Tokens.
 */
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx,ts,tsx}', './src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        background: '#f9f9ff',
        surface: '#f9f9ff',
        'surface-dim': '#d3daef',
        'surface-bright': '#f9f9ff',
        'surface-container-lowest': '#ffffff',
        'surface-container-low': '#f1f3ff',
        'surface-container': '#e9edff',
        'surface-container-high': '#e1e8fd',
        'surface-container-highest': '#dce2f7',
        'surface-variant': '#dce2f7',
        'surface-tint': '#9f3c59',

        primary: {
          DEFAULT: '#7a1f3d',
          deep: '#5c0427',
          container: '#7a1f3d',
          fixed: '#ffd9df',
          'fixed-dim': '#ffb1c2',
          tint: '#FDF2F5',
          border: '#FCE7F3',
          foreground: '#FFFFFF',
        },
        'primary-container': '#7a1f3d',
        'on-primary': '#ffffff',
        'on-primary-container': '#ff8ba8',
        'primary-fixed': '#ffd9df',
        'primary-fixed-dim': '#ffb1c2',
        'on-primary-fixed': '#3f0018',
        'on-primary-fixed-variant': '#802442',

        secondary: {
          DEFAULT: '#96435c',
          container: '#fe98b3',
          fixed: '#ffd9e0',
          'fixed-dim': '#ffb1c4',
        },
        'secondary-container': '#fe98b3',
        'on-secondary': '#ffffff',
        'on-secondary-container': '#792c45',
        'secondary-fixed': '#ffd9e0',
        'secondary-fixed-dim': '#ffb1c4',
        'on-secondary-fixed': '#3f001a',
        'on-secondary-fixed-variant': '#782c44',

        tertiary: {
          DEFAULT: '#302a2d',
          container: '#464043',
          fixed: '#eae0e3',
          'fixed-dim': '#cec4c7',
        },
        'tertiary-container': '#464043',
        'on-tertiary': '#ffffff',
        'on-tertiary-container': '#b5acaf',
        'tertiary-fixed': '#eae0e3',
        'tertiary-fixed-dim': '#cec4c7',
        'on-tertiary-fixed': '#1f1a1d',
        'on-tertiary-fixed-variant': '#4b4548',

        'on-surface': '#141b2b',
        'on-surface-variant': '#554245',
        'on-background': '#141b2b',
        outline: '#887275',
        'outline-variant': '#dac0c4',

        'inverse-surface': '#293040',
        'inverse-on-surface': '#edf0ff',
        'inverse-primary': '#ffb1c2',

        error: '#ba1a1a',
        'error-container': '#ffdad6',
        'on-error': '#ffffff',
        'on-error-container': '#93000a',

        muted: '#F3F4F6',
        border: '#E5E7EB',
        disabled: '#D1D5DB',
        placeholder: '#9CA3AF',
        'muted-foreground': '#6B7280',
        icon: '#4B5563',
        'body-strong': '#1F2937',

        pharmacy: { DEFAULT: '#2563EB', fg: '#1D4ED8', tint: '#EFF6FF', border: '#DBEAFE' },
        grocery: { DEFAULT: '#0A6A32', fg: '#065F46', tint: '#ECFDF5', border: '#A7F3D0' },
        food: { DEFAULT: '#EA580C', fg: '#C2410C', tint: '#FFF7ED', border: '#FED7AA' },
        concierge: { DEFAULT: '#7A1F3D', fg: '#5E1730', tint: '#FDF2F5', border: '#FCE7F3' },
        verify: { DEFAULT: '#D97706', fg: '#B45309', tint: '#FFFBEB', border: '#FDE68A' },
        destructive: { DEFAULT: '#DC2626', fg: '#B91C1C', tint: '#FEF2F2', border: '#FECACA' },
      },
      borderRadius: {
        chip: '6px',
        segment: '8px',
        control: '10px',
        card: '14px',
        generative: '16px',
      },
      fontFamily: {
        sans: ['Archivo', 'Geist', 'System'],
        mono: ['GeistMono', 'Menlo', 'monospace'],
        tamil: ['HindMadurai', 'System'],
      },
    },
  },
  plugins: [],
};
