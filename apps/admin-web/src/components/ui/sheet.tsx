'use client';

/**
 * Side sheet. Radix Dialog underneath, styled as the shadcn Sheet — this is
 * the surface the concierge pricing flow lives in.
 */

import * as React from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

export const Sheet = DialogPrimitive.Root;
export const SheetTrigger = DialogPrimitive.Trigger;
export const SheetClose = DialogPrimitive.Close;
export const SheetTitle = DialogPrimitive.Title;
export const SheetDescription = DialogPrimitive.Description;

export function SheetContent({
  className,
  children,
  width = 480,
  ...props
}: React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> & { width?: number }) {
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay
        className={cn(
          'fixed inset-0 z-50 bg-foreground/40',
          'data-[state=open]:animate-in data-[state=open]:fade-in-0',
          'data-[state=closed]:animate-out data-[state=closed]:fade-out-0',
        )}
      />
      <DialogPrimitive.Content
        style={{ width }}
        className={cn(
          'fixed inset-y-0 right-0 z-50 flex max-w-full flex-col border-l bg-background shadow-sheet outline-none',
          'transition-transform duration-200',
          'data-[state=closed]:translate-x-full',
          className,
        )}
        {...props}
      >
        {children}
        <DialogPrimitive.Close className="absolute right-5 top-[18px] grid size-[30px] place-items-center rounded-md border text-muted-foreground transition-colors hover:bg-muted">
          <X className="size-[15px]" />
          <span className="sr-only">Close</span>
        </DialogPrimitive.Close>
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
}

export function SheetHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('shrink-0 border-b px-5 pb-3.5 pt-[18px]', className)} {...props} />;
}

export function SheetBody({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('scroll-slim flex-1 overflow-y-auto px-5 py-4', className)} {...props} />
  );
}

export function SheetFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('shrink-0 space-y-2.5 border-t px-5 pb-[18px] pt-3.5', className)}
      {...props}
    />
  );
}
