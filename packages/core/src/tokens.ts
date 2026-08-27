/**
 * Design tokens.
 *
 * The single source for both surfaces: Tailwind reads these in the web app,
 * NativeWind reads them in the mobile app, and raw StyleSheet code imports
 * them directly. Values are lifted verbatim from the Foundations artboard.
 *
 * Base is shadcn "zinc", unmodified. Colour only ever encodes a category or a
 * state — nothing here is decorative.
 */

export const neutral = {
  background: '#FFFFFF',
  surface: '#FAFAFA',
  muted: '#F4F4F5',
  border: '#E4E4E7',
  disabled: '#D4D4D8',
  placeholder: '#A1A1AA',
  mutedForeground: '#71717A',
  icon: '#52525B',
  bodyStrong: '#3F3F46',
  onDarkChip: '#27272A',
  primary: '#18181B',
  foreground: '#09090B',
  primaryForeground: '#FAFAFA',
} as const;

export interface Hue {
  solid: string;
  fg: string;
  tint: string;
  border: string;
}

export const category = {
  pharmacy: { solid: '#2563EB', fg: '#1D4ED8', tint: '#EFF6FF', border: '#DBEAFE' },
  grocery: { solid: '#16A34A', fg: '#15803D', tint: '#F0FDF4', border: '#BBF7D0' },
  food: { solid: '#EA580C', fg: '#C2410C', tint: '#FFF7ED', border: '#FED7AA' },
  concierge: { solid: '#7C3AED', fg: '#6D28D9', tint: '#F5F3FF', border: '#DDD6FE' },
} as const satisfies Record<string, Hue>;

export const state = {
  verify: { solid: '#B45309', fg: '#92400E', tint: '#FFFBEB', border: '#FDE68A' },
  destructive: { solid: '#DC2626', fg: '#B91C1C', tint: '#FEF2F2', border: '#FECACA' },
  success: { solid: '#16A34A', fg: '#15803D', tint: '#F0FDF4', border: '#BBF7D0' },
} as const satisfies Record<string, Hue>;

export const radius = {
  chip: 4,
  segment: 7,
  control: 8,
  card: 12,
  generative: 14,
  pill: 999,
} as const;

export const shadow = {
  sm: '0 1px 2px 0 rgba(9,9,11,.05)',
  card: '0 1px 3px 0 rgba(9,9,11,.08), 0 1px 2px -1px rgba(9,9,11,.06)',
  float: '0 2px 8px rgba(9,9,11,.12)',
  sheet: '-16px 0 48px rgba(9,9,11,.18)',
} as const;

export const space = [0, 2, 4, 6, 8, 10, 12, 14, 16, 20, 24, 32, 40, 48, 64] as const;

export const font = {
  ui: "'Geist', system-ui, -apple-system, 'Segoe UI', sans-serif",
  mono: "'Geist Mono', ui-monospace, 'SF Mono', Menlo, monospace",
  tamil: "'Hind Madurai', 'Noto Sans Tamil', 'Nirmala UI', sans-serif",
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

/**
 * The Tamil sub-label multiplier from the pairing rule. A Tamil line under a
 * 14px English line renders at 11px.
 */
export const TAMIL_SCALE = 0.78;

/** Minimum touch targets, in px. */
export const touch = {
  min: 44,
  call: 52,
  riderPrimary: 70,
} as const;

/** Device frames the design was drawn against. */
export const frames = {
  customerIos: { w: 390, h: 844 },
  customerAndroid: { w: 412, h: 892 },
  vendor: { w: 390, h: 844 },
  rider: { w: 390, h: 844 },
  adminDesktop: { w: 1440, h: 900 },
  adminMobile: { w: 390, h: 844 },
} as const;

import type { Category } from './types';
export const hueFor = (c: Category): Hue => category[c];
