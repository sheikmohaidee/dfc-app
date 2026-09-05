'use client';

/**
 * shadcn/ui primitives, hand-written against the DFC tokens.
 *
 * These are the same components `npx shadcn@latest add button card badge …`
 * generates, trimmed to the variants this product actually uses so the app
 * compiles with no CLI step. components.json is present, so you can still add
 * more from the registry and they will pick up the same CSS variables.
 */

import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import * as SwitchPrimitive from '@radix-ui/react-switch';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

// ---------------------------------------------------------------------------
// Button
// ---------------------------------------------------------------------------

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-colors outline-none focus-visible:ring-[3px] focus-visible:ring-ring/20 focus-visible:border-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground shadow-sm hover:bg-primary/90',
        secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
        outline: 'border bg-background hover:bg-muted text-body-strong',
        ghost: 'hover:bg-muted text-body-strong',
        destructive: 'bg-destructive text-white shadow-sm hover:bg-destructive/90',
        destructiveGhost: 'text-destructive hover:bg-destructive-tint',
      },
      size: {
        sm: 'h-8 px-3 text-xs',
        default: 'h-9 px-4',
        lg: 'h-11 px-5 text-[15px]',
        icon: 'size-9',
        iconSm: 'size-8',
      },
    },
    defaultVariants: { variant: 'default', size: 'default' },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp ref={ref} className={cn(buttonVariants({ variant, size }), className)} {...props} />
    );
  },
);
Button.displayName = 'Button';

// ---------------------------------------------------------------------------
// Card
// ---------------------------------------------------------------------------

export const Card = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('rounded-xl border bg-card text-card-foreground shadow-sm', className)}
      {...props}
    />
  ),
);
Card.displayName = 'Card';

// ---------------------------------------------------------------------------
// Badge — the category / state tag used all over the board
// ---------------------------------------------------------------------------

const badgeVariants = cva(
  'inline-flex items-center rounded-sm border px-1.5 py-0.5 text-[9px] font-bold tracking-[0.06em] leading-none',
  {
    variants: {
      tone: {
        pharmacy: 'text-pharmacy-fg bg-pharmacy-tint border-pharmacy-border',
        grocery: 'text-grocery-fg bg-grocery-tint border-grocery-border',
        food: 'text-food-fg bg-food-tint border-food-border',
        concierge: 'text-concierge-fg bg-concierge-tint border-concierge-border',
        verify: 'text-verify-fg bg-verify-tint border-verify-border',
        destructive: 'text-destructive-fg bg-destructive-tint border-destructive-border',
        neutral: 'text-muted-foreground bg-muted border-border',
      },
      variant: {
        default: 'bg-primary text-primary-foreground border-transparent',
        secondary: 'bg-secondary text-secondary-foreground border-transparent',
        outline: 'text-foreground border-border',
        destructive: 'bg-destructive text-white border-transparent',
      },
    },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, tone, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ tone: tone ?? (variant ? undefined : 'neutral'), variant }), className)} {...props} />;
}

// ---------------------------------------------------------------------------
// Input
// ---------------------------------------------------------------------------

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        'flex h-9 w-full rounded-lg border bg-background px-3 py-1 text-sm shadow-sm transition-colors',
        'placeholder:text-placeholder',
        'focus-visible:outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/10',
        'disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
      {...props}
    />
  ),
);
Input.displayName = 'Input';

/**
 * Money input. Renders its own ₹ gutter and keeps the value in paise, because
 * a rupee field that silently stores floats is how ₹243 becomes ₹242.99999.
 */
export function RupeeInput({
  valuePaise,
  onChangePaise,
  className,
  disabled,
  autoFocus,
}: {
  valuePaise: number | null;
  onChangePaise: (paise: number | null) => void;
  className?: string;
  disabled?: boolean;
  autoFocus?: boolean;
}) {
  const [text, setText] = React.useState(
    valuePaise === null ? '' : String(Math.round(valuePaise / 100)),
  );

  React.useEffect(() => {
    setText(valuePaise === null ? '' : String(Math.round(valuePaise / 100)));
  }, [valuePaise]);

  return (
    <div
      className={cn(
        'flex h-10 items-center overflow-hidden rounded-lg border bg-background shadow-sm',
        'focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/10',
        disabled && 'opacity-50',
        className,
      )}
    >
      <span className="tnum grid h-full w-8 place-items-center border-r bg-surface text-sm text-muted-foreground">
        ₹
      </span>
      <input
        inputMode="numeric"
        disabled={disabled}
        autoFocus={autoFocus}
        value={text}
        onChange={(e) => {
          const next = e.target.value.replace(/[^\d]/g, '');
          setText(next);
          onChangePaise(next === '' ? null : Number(next) * 100);
        }}
        placeholder="—"
        className="tnum h-full flex-1 bg-transparent px-3 text-[15px] font-semibold tracking-tight outline-none placeholder:font-normal placeholder:text-verify"
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Switch
// ---------------------------------------------------------------------------

export const Switch = React.forwardRef<
  React.ElementRef<typeof SwitchPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SwitchPrimitive.Root>
>(({ className, ...props }, ref) => (
  <SwitchPrimitive.Root
    ref={ref}
    className={cn(
      'peer inline-flex h-6 w-[42px] shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors',
      'focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/20',
      'data-[state=checked]:bg-grocery data-[state=unchecked]:bg-border',
      className,
    )}
    {...props}
  >
    <SwitchPrimitive.Thumb className="pointer-events-none block size-5 rounded-full bg-white shadow-sm transition-transform data-[state=checked]:translate-x-[18px] data-[state=unchecked]:translate-x-0" />
  </SwitchPrimitive.Root>
));
Switch.displayName = 'Switch';

// ---------------------------------------------------------------------------
// Separator / Skeleton / Kbd
// ---------------------------------------------------------------------------

export function Separator({
  className,
  vertical,
}: {
  className?: string;
  vertical?: boolean;
}) {
  return (
    <div
      role="separator"
      className={cn('shrink-0 bg-border', vertical ? 'h-full w-px' : 'h-px w-full', className)}
    />
  );
}

export function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('animate-pulse rounded-md bg-muted', className)} {...props} />;
}

export function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="tnum rounded-sm border px-1.5 py-0.5 text-[10.5px] text-muted-foreground">
      {children}
    </kbd>
  );
}

// ---------------------------------------------------------------------------
// Bilingual label — the pairing rule, as a component
// ---------------------------------------------------------------------------

export function BiLabel({
  en,
  ta,
  className,
  size = 12.5,
}: {
  en: string;
  ta: string;
  className?: string;
  /** English size in px; the Tamil line renders at 0.78x. */
  size?: number;
}) {
  return (
    <span className={cn('flex flex-col leading-tight', className)}>
      <span style={{ fontSize: size }} className="font-semibold tracking-tight">
        {en}
      </span>
      <span
        style={{ fontSize: Math.round(size * 0.78 * 10) / 10 }}
        className="ta text-placeholder"
      >
        {ta}
      </span>
    </span>
  );
}
