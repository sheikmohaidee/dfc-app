/**
 * Design tokens.
 *
 * Centralized DFC Brand & Stitch Theme System.
 * Primary: #7A1F3D (DFC Burgundy)
 * Deep: #5E1730
 * Soft: #FDF2F5
 * Background: #F7F8F9
 * Surface: #FFFFFF
 * Border: #E5E7EB
 * Primary Text: #111827
 * Secondary: #6B7280
 * Muted: #9CA3AF
 * Success: #0A6A32
 * Warning: #D97706
 * Error: #DC2626
 */

export const neutral = {
  background: '#F7F8F9',
  surface: '#FFFFFF',
  muted: '#F3F4F6',
  border: '#E5E7EB',
  disabled: '#D1D5DB',
  placeholder: '#9CA3AF',
  mutedForeground: '#6B7280',
  icon: '#4B5563',
  bodyStrong: '#1F2937',
  onDarkChip: '#374151',
  primary: '#7A1F3D',
  primaryDeep: '#5E1730',
  primarySoft: '#FDF2F5',
  foreground: '#111827',
  primaryForeground: '#FFFFFF',
} as const;

export interface Hue {
  solid: string;
  fg: string;
  tint: string;
  border: string;
}

export const category = {
  pharmacy: { solid: '#2563EB', fg: '#1D4ED8', tint: '#EFF6FF', border: '#DBEAFE' },
  grocery: { solid: '#0A6A32', fg: '#065F46', tint: '#ECFDF5', border: '#A7F3D0' },
  food: { solid: '#EA580C', fg: '#C2410C', tint: '#FFF7ED', border: '#FED7AA' },
  concierge: { solid: '#7A1F3D', fg: '#5E1730', tint: '#FDF2F5', border: '#FCE7F3' },
  print: { solid: '#7C3AED', fg: '#6D28D9', tint: '#F5F3FF', border: '#DDD6FE' },
  pickup_drop: { solid: '#E11D48', fg: '#BE123C', tint: '#FFF1F2', border: '#FECDD3' },
  buy_deliver: { solid: '#0891B2', fg: '#0E7490', tint: '#ECFEFF', border: '#A5F3FC' },
} as const satisfies Record<string, Hue>;

export const state = {
  verify: { solid: '#D97706', fg: '#B45309', tint: '#FFFBEB', border: '#FDE68A' },
  destructive: { solid: '#DC2626', fg: '#B91C1C', tint: '#FEF2F2', border: '#FECACA' },
  success: { solid: '#0A6A32', fg: '#065F46', tint: '#ECFDF5', border: '#A7F3D0' },
} as const satisfies Record<string, Hue>;

export const radius = {
  chip: 6,
  segment: 8,
  control: 10,
  card: 14,
  generative: 16,
  pill: 999,
} as const;

export const shadow = {
  sm: '0 1px 2px 0 rgba(0,0,0,.04)',
  card: '0 1px 3px 0 rgba(0,0,0,.06), 0 1px 2px -1px rgba(0,0,0,.04)',
  float: '0 4px 14px rgba(122,31,61,.18)',
  sheet: '-16px 0 48px rgba(0,0,0,.15)',
} as const;

export const space = [0, 2, 4, 6, 8, 10, 12, 14, 16, 20, 24, 32, 40, 48, 64] as const;

export const font = {
  ui: "'Archivo', system-ui, -apple-system, sans-serif",
  mono: "'Geist Mono', ui-monospace, 'SF Mono', Menlo, monospace",
  tamil: "'Hind Madurai', 'Noto Sans Tamil', sans-serif",
} as const;

/** size / weight / tracking, straight off the type ramp. */
export const type = {
  display: { size: 30, weight: '700', tracking: -1.05 },
  h1: { size: 21, weight: '600', tracking: -0.42 },
  h2: { size: 17, weight: '600', tracking: -0.34 },
  h3: { size: 15, weight: '600', tracking: -0.23 },
  body: { size: 14, weight: '400', tracking: 0 },
  bodyStrong: { size: 14, weight: '500', tracking: 0 },
  small: { size: 12.5, weight: '400', tracking: 0 },
  caption: { size: 11, weight: '400', tracking: 0 },
  overline: { size: 10.5, weight: '700', tracking: 1.05 },
} as const;

export const TAMIL_SCALE = 0.78;

export const touch = {
  min: 44,
  call: 52,
  riderPrimary: 70,
} as const;

export const frames = {
  customerIos: { w: 390, h: 844 },
  riderAndroid: { w: 360, h: 800 },
  adminDesktop: { w: 1440, h: 900 },
} as const;

// ---------------------------------------------------------------------------
// Stitch Dark Floating Theme — Customer App Visual Redesign
// ---------------------------------------------------------------------------

export const stitch = {
  // Core brand
  primary: '#C8BFFF',
  primaryContainer: '#6A5ACD',
  onPrimary: '#2D128F',
  onPrimaryContainer: '#F0EBFF',
  primaryFixed: '#E5DEFF',
  primaryFixedDim: '#C8BFFF',

  secondary: '#FFB59C',
  secondaryContainer: '#8E2C01',
  onSecondary: '#5C1A00',
  onSecondaryContainer: '#FFAA8D',

  tertiary: '#7BD0FF',
  tertiaryContainer: '#00739C',
  onTertiary: '#00354A',
  onTertiaryContainer: '#DBF0FF',

  error: '#FFB4AB',
  errorContainer: '#93000A',
  onError: '#690005',
  onErrorContainer: '#FFDAD6',

  // Surface hierarchy (darkest → brightest)
  surfaceContainerLowest: '#0E0E10',
  surfaceDim: '#131315',
  surface: '#131315',
  surfaceContainerLow: '#1C1B1D',
  surfaceContainer: '#201F21',
  surfaceContainerHigh: '#2A2A2C',
  surfaceContainerHighest: '#353437',
  surfaceVariant: '#353437',
  surfaceBright: '#39393B',
  surfaceTint: '#C8BFFF',

  // On-surface
  onSurface: '#E5E1E4',
  onSurfaceVariant: '#C9C4D5',
  onBackground: '#E5E1E4',
  background: '#131315',

  // Outline
  outline: '#928F9E',
  outlineVariant: '#474553',

  // Inverse
  inverseSurface: '#E5E1E4',
  inverseOnSurface: '#313032',
  inversePrimary: '#5D4CBF',
} as const;

/** Stitch typography ramp — maps to Plus Jakarta Sans weights. */
export const stitchType = {
  'display-lg': { size: 32, lineHeight: 38, tracking: -0.03 * 32, weight: '800' as const },
  'display-md': { size: 26, lineHeight: 32, tracking: -0.02 * 26, weight: '700' as const },
  'headline-lg': { size: 22, lineHeight: 28, tracking: -0.015 * 22, weight: '700' as const },
  'headline-sm': { size: 18, lineHeight: 24, tracking: -0.01 * 18, weight: '600' as const },
  'body-lg': { size: 16, lineHeight: 24, tracking: -0.005 * 16, weight: '500' as const },
  'body-md': { size: 14, lineHeight: 20, tracking: 0, weight: '400' as const },
  'body-sm': { size: 12, lineHeight: 16, tracking: 0.01 * 12, weight: '400' as const },
  'label-lg': { size: 14, lineHeight: 18, tracking: 0.01 * 14, weight: '600' as const },
  'label-md': { size: 12, lineHeight: 16, tracking: 0.02 * 12, weight: '600' as const },
  'label-sm': { size: 10, lineHeight: 14, tracking: 0.04 * 10, weight: '700' as const },
} as const;

/** Stitch radii — larger, more rounded for the floating card aesthetic. */
export const stitchRadius = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  '2xl': 20,
  '3xl': 24,
  full: 9999,
} as const;

/** Stitch spacing presets. */
export const stitchSpace = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 32,
  gutter: 16,
  margin: 16,
} as const;
