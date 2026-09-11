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
