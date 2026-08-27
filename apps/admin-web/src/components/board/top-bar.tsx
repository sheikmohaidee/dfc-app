'use client';

/**
 * The two header rows. Everything the board needs and nothing it does not —
 * there is deliberately no navigation sidebar in this product.
 */

import * as React from 'react';
import { Boxes, LogOut, Megaphone, Package, Plus, Search } from 'lucide-react';
import Link from 'next/link';

import { COPY, type Category } from '@dfc/core';
import { Button, Input, Kbd } from '@/components/ui/primitives';
import { cn, initials } from '@/lib/utils';
import type { CategoryFilter, Density } from '@/hooks/useBoard';

const FILTERS: { key: CategoryFilter; label: string; dot?: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'pharmacy', label: 'Pharmacy', dot: 'bg-pharmacy' },
  { key: 'grocery', label: 'Grocery', dot: 'bg-grocery' },
  { key: 'food', label: 'Food', dot: 'bg-food' },
  { key: 'concierge', label: 'Concierge', dot: 'bg-concierge' },
];

export function TopBar({
  search,
  onSearch,
  liveCount,
  userName,
  onSignOut,
}: {
  search: string;
  onSearch: (v: string) => void;
  liveCount: number;
  userName: string;
  onSignOut: () => void;
}) {
  const inputRef = React.useRef<HTMLInputElement>(null);

  // ⌘K / Ctrl-K focuses search. An admin lives in this field.
  React.useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const [now, setNow] = React.useState<string>('');
  React.useEffect(() => {
    const tick = () =>
      setNow(
        new Date().toLocaleString('en-IN', {
          weekday: 'short',
          day: 'numeric',
          month: 'short',
          hour: 'numeric',
          minute: '2-digit',
          hour12: true,
        }),
      );
    tick();
    const id = setInterval(tick, 30_000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="flex h-14 shrink-0 items-center gap-4 border-b px-5">
      <Link href="/" className="flex items-center gap-2.5">
        <span className="grid size-7 place-items-center rounded-lg bg-primary text-[12.5px] font-semibold tracking-tight text-primary-foreground">
          D
        </span>
        <span className="hidden flex-col leading-none sm:flex">
          <span className="text-[13.5px] font-semibold tracking-tight">
            {COPY.commandCenter.en}
          </span>
          <span className="ta mt-0.5 text-[10px] text-placeholder">{COPY.commandCenter.ta}</span>
        </span>
      </Link>

      <div className="flex flex-1 justify-center">
        <div className="relative w-full max-w-[380px]">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-[15px] -translate-y-1/2 text-placeholder" />
          <Input
            ref={inputRef}
            value={search}
            onChange={(e) => onSearch(e.target.value)}
            placeholder={COPY.searchPlaceholder.en}
            className="h-[34px] pl-9 pr-14"
          />
          <span className="absolute right-2.5 top-1/2 -translate-y-1/2">
            <Kbd>⌘K</Kbd>
          </span>
        </div>
      </div>

      <div className="flex items-center gap-3.5">
        <nav className="hidden items-center gap-1.5 lg:flex">
          {[
            { href: '/live', icon: Boxes, label: 'Live ops' },
            { href: '/catalogue', icon: Package, label: 'Stock' },
            { href: '/promotions', icon: Megaphone, label: 'Ads' },
          ].map(({ href, icon: Icon, label }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-[11.5px] font-medium text-body-strong transition-colors hover:bg-muted"
            >
              <Icon className="size-3.5" />
              {label}
            </Link>
          ))}
        </nav>
        <span className="flex items-center gap-1.5 rounded-full border border-grocery-border bg-grocery-tint px-2.5 py-1">
          <span className="size-1.5 rounded-full bg-grocery animate-dfc-pulse" />
          <span className="text-[11.5px] font-semibold text-grocery-fg">
            {liveCount} {COPY.live.en}
          </span>
        </span>
        <span className="tnum hidden text-[11.5px] text-placeholder xl:inline">{now}</span>
        <button
          onClick={onSignOut}
          title="Sign out"
          className="grid size-7 place-items-center rounded-full border bg-muted text-[11px] font-semibold text-icon transition-colors hover:bg-border"
        >
          {initials(userName)}
        </button>
        <LogOut className="hidden size-0" />
      </div>
    </div>
  );
}

export function FilterBar({
  filter,
  onFilter,
  density,
  onDensity,
  onManualOrder,
}: {
  filter: CategoryFilter;
  onFilter: (f: CategoryFilter) => void;
  density: Density;
  onDensity: (d: Density) => void;
  onManualOrder: () => void;
}) {
  return (
    <div className="flex h-12 shrink-0 items-center gap-2 overflow-x-auto border-b px-5 scroll-slim">
      {FILTERS.map((f) => {
        const active = filter === f.key;
        return (
          <button
            key={f.key}
            onClick={() => onFilter(f.key)}
            className={cn(
              'flex h-7 shrink-0 items-center gap-1.5 rounded-md px-3 text-[12.5px] transition-colors',
              active
                ? 'bg-primary font-medium text-primary-foreground'
                : 'border text-body-strong hover:bg-muted',
            )}
          >
            {f.dot ? <span className={cn('size-1.5 rounded-full', f.dot)} /> : null}
            {f.label}
          </button>
        );
      })}

      <span className="flex-1" />

      <div className="flex h-7 shrink-0 overflow-hidden rounded-md border">
        {(['comfortable', 'dense'] as Density[]).map((d, i) => (
          <button
            key={d}
            onClick={() => onDensity(d)}
            className={cn(
              'px-3 text-xs capitalize transition-colors',
              i > 0 && 'border-l',
              density === d
                ? 'bg-primary font-medium text-primary-foreground'
                : 'text-muted-foreground hover:bg-muted',
            )}
          >
            {d}
          </button>
        ))}
      </div>

      <Button variant="outline" size="sm" onClick={onManualOrder} className="shrink-0 gap-1.5">
        <Plus className="size-3.5" strokeWidth={2.4} />
        Manual order
      </Button>
    </div>
  );
}

export function StatusBar({
  total,
  medianSeconds,
  breaches,
}: {
  total: number;
  medianSeconds: number;
  breaches: number;
}) {
  return (
    <div className="flex h-[30px] shrink-0 items-center gap-[18px] border-t bg-surface px-5">
      <span className="tnum hidden text-[10.5px] text-muted-foreground md:inline">↑↓ move</span>
      <span className="tnum hidden text-[10.5px] text-muted-foreground md:inline">⏎ open</span>
      <span className="tnum hidden text-[10.5px] text-muted-foreground lg:inline">⌘⇧P price</span>
      <span className="tnum hidden text-[10.5px] text-muted-foreground lg:inline">
        ⌘⇧D dispatch
      </span>
      <span className="flex-1" />
      <span className="tnum text-[10.5px] text-placeholder">
        {total} open · median review {medianSeconds}s
        {breaches > 0 ? ` · ${breaches} SLA breach${breaches === 1 ? '' : 'es'}` : ''}
      </span>
    </div>
  );
}

export type { Category };
