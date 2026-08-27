'use client';

/**
 * Promotions and in-app ads.
 *
 * Left: every campaign with its real performance. Right: a composer with a
 * live preview of exactly what lands in the customer's thread — because an ad
 * you cannot see while writing is an ad you write badly.
 *
 * The targeting is the point of being hyper-local: a promo can run in
 * Villapuram on a Friday evening and nowhere else.
 */

import * as React from 'react';
import Link from 'next/link';
import { ArrowLeft, Eye, MousePointerClick, Plus, Sparkles, Trash2 } from 'lucide-react';

import {
  CATEGORY_LABEL,
  LOCALITIES,
  PROMO_STATUS_LABEL,
  budgetUsed,
  ctr,
  conversionRate,
  effectiveStatus,
  formatInr,
  roas,
  tokens,
  type Category,
  type DiscountKind,
  type PromoKind,
  type Promotion,
} from '@dfc/core';

import { Badge, Button, Card, Input, RupeeInput, Skeleton } from '@/components/ui/primitives';
import {
  createPromotion,
  deletePromotion,
  patchPromotion,
  subscribePromotions,
} from '@/lib/catalogue';
import { useAuth } from '@/lib/auth';
import { cn } from '@/lib/utils';

const ACCENTS: (Category | 'neutral')[] = [
  'neutral',
  'pharmacy',
  'grocery',
  'food',
  'concierge',
];

function accentHex(a: Category | 'neutral') {
  return a === 'neutral' ? tokens.neutral.primary : tokens.category[a].solid;
}
function accentTint(a: Category | 'neutral') {
  return a === 'neutral' ? tokens.neutral.muted : tokens.category[a].tint;
}

const STATUS_TONE = {
  live: 'grocery',
  scheduled: 'pharmacy',
  paused: 'verify',
  draft: 'neutral',
  ended: 'neutral',
} as const;

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[10px] font-bold tracking-[0.1em] text-placeholder">{label}</span>
      {children}
    </label>
  );
}

// ---------------------------------------------------------------------------
// Live preview — what the customer sees inside the chat thread
// ---------------------------------------------------------------------------

function ThreadPreview({ promo }: { promo: Promotion }) {
  const c = promo.creative;
  const hex = accentHex(c.accent);
  const tint = accentTint(c.accent);
  const discount =
    promo.discountKind === 'free_delivery'
      ? 'Free delivery'
      : promo.discountKind === 'percent'
        ? `${promo.discountValue}% off`
        : `${formatInr(promo.discountValue)} off`;

  return (
    <div className="rounded-xl border bg-surface p-4">
      <span className="text-[10px] font-bold tracking-[0.1em] text-placeholder">
        IN THE CUSTOMER&apos;S THREAD
      </span>

      <div className="mx-auto mt-3 w-full max-w-[320px] rounded-2xl border bg-background p-3 shadow-card">
        <div className="mb-2 flex items-center gap-2">
          <span className="grid size-5 place-items-center rounded-md bg-primary text-[9px] font-semibold text-primary-foreground">
            D
          </span>
          <span className="text-[11px] text-placeholder">DFC</span>
        </div>

        <div
          className="overflow-hidden rounded-xl border"
          style={{ background: tint, borderColor: hex + '33' }}
        >
          <div className="flex items-start gap-2.5 p-3.5">
            <span
              className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-md"
              style={{ background: hex }}
            >
              <Sparkles className="size-3.5 text-white" strokeWidth={2.2} />
            </span>
            <div className="min-w-0 flex-1">
              <p
                className="text-[15px] font-semibold leading-tight tracking-tight"
                style={{ color: hex }}
              >
                {c.headline || 'Your headline goes here'}
              </p>
              {c.headlineTa ? (
                <p className="ta mt-0.5 text-[12px]" style={{ color: hex, opacity: 0.75 }}>
                  {c.headlineTa}
                </p>
              ) : null}
              <p className="mt-1.5 text-[12.5px] leading-snug text-body-strong">
                {c.sub || 'One line explaining the offer.'}
              </p>

              <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                <span
                  className="rounded-sm px-1.5 py-0.5 text-[9px] font-bold tracking-wider text-white"
                  style={{ background: hex }}
                >
                  {discount.toUpperCase()}
                </span>
                {promo.minOrderPaise > 0 ? (
                  <span className="tnum text-[10px] text-muted-foreground">
                    on orders over {formatInr(promo.minOrderPaise)}
                  </span>
                ) : null}
              </div>

              {promo.kind === 'coupon' && promo.couponCode ? (
                <div className="tnum mt-2.5 rounded-md border border-dashed px-2.5 py-1.5 text-center text-[12px] font-semibold tracking-[0.08em]">
                  {promo.couponCode.toUpperCase()}
                </div>
              ) : null}

              <button
                className="mt-3 h-9 w-full rounded-lg text-[13px] font-semibold text-white"
                style={{ background: hex }}
              >
                {c.ctaLabel || 'Order now'}
              </button>
            </div>
          </div>
        </div>
      </div>

      <p className="mt-3 text-center text-[10.5px] leading-relaxed text-placeholder">
        Shown above the input dock, once per session, only to customers this promo targets.
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Composer
// ---------------------------------------------------------------------------

function Composer({ promo, onClose }: { promo: Promotion; onClose: () => void }) {
  const [draft, setDraft] = React.useState<Promotion>(promo);
  React.useEffect(() => setDraft(promo), [promo]);

  const set = <K extends keyof Promotion>(k: K, v: Promotion[K]) => {
    const next = { ...draft, [k]: v };
    setDraft(next);
    void patchPromotion(draft.id, { [k]: v } as Partial<Promotion>);
  };

  const setCreative = (patch: Partial<Promotion['creative']>) => {
    const creative = { ...draft.creative, ...patch };
    setDraft({ ...draft, creative });
    void patchPromotion(draft.id, { creative });
  };

  const toggleIn = <T,>(list: T[], v: T): T[] =>
    list.includes(v) ? list.filter((x) => x !== v) : [...list, v];

  const status = effectiveStatus(draft);

  return (
    <div className="grid min-h-0 flex-1 grid-cols-1 gap-5 overflow-y-auto p-5 xl:grid-cols-[minmax(0,1fr)_360px] scroll-slim">
      <div className="flex flex-col gap-5">
        {/* Creative */}
        <Card className="flex flex-col gap-4 p-4">
          <div className="flex items-center gap-2">
            <span className="text-[13px] font-semibold tracking-tight">Creative</span>
            <Badge tone={STATUS_TONE[status]}>{PROMO_STATUS_LABEL[status].en.toUpperCase()}</Badge>
            <div className="flex-1" />
            <div className="flex gap-1.5">
              {ACCENTS.map((a) => (
                <button
                  key={a}
                  onClick={() => setCreative({ accent: a })}
                  title={a}
                  className={cn(
                    'size-6 rounded-full border-2 transition-transform',
                    draft.creative.accent === a
                      ? 'scale-110 border-foreground'
                      : 'border-transparent',
                  )}
                  style={{ background: accentHex(a) }}
                />
              ))}
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="HEADLINE">
              <Input
                value={draft.creative.headline}
                onChange={(e) => setCreative({ headline: e.target.value })}
                placeholder="Free delivery in Villapuram tonight"
                maxLength={48}
              />
            </Field>
            <Field label="HEADLINE · TAMIL">
              <Input
                value={draft.creative.headlineTa ?? ''}
                onChange={(e) => setCreative({ headlineTa: e.target.value })}
                placeholder="இன்று இரவு இலவச டெலிவரி"
                className="ta"
                maxLength={48}
              />
            </Field>
          </div>

          <Field label="SUPPORTING LINE">
            <Input
              value={draft.creative.sub}
              onChange={(e) => setCreative({ sub: e.target.value })}
              placeholder="On grocery orders over ₹200, until 10 PM."
              maxLength={90}
            />
          </Field>

          <Field label="BUTTON LABEL">
            <Input
              value={draft.creative.ctaLabel}
              onChange={(e) => setCreative({ ctaLabel: e.target.value })}
              placeholder="Order now"
              maxLength={24}
              className="max-w-[200px]"
            />
          </Field>
        </Card>

        {/* Offer */}
        <Card className="flex flex-col gap-4 p-4">
          <span className="text-[13px] font-semibold tracking-tight">Offer</span>

          <div className="flex flex-wrap gap-2">
            {(['banner', 'coupon', 'combo'] as PromoKind[]).map((k) => (
              <button
                key={k}
                onClick={() => set('kind', k)}
                className={cn(
                  'h-8 rounded-md px-3 text-[12.5px] capitalize transition-colors',
                  draft.kind === k
                    ? 'bg-primary font-medium text-primary-foreground'
                    : 'border text-body-strong hover:bg-muted',
                )}
              >
                {k}
              </button>
            ))}
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <Field label="DISCOUNT TYPE">
              <div className="flex h-9 overflow-hidden rounded-lg border">
                {(['percent', 'flat', 'free_delivery'] as DiscountKind[]).map((d, i) => (
                  <button
                    key={d}
                    onClick={() => set('discountKind', d)}
                    className={cn(
                      'flex-1 text-[11.5px] transition-colors',
                      i > 0 && 'border-l',
                      draft.discountKind === d
                        ? 'bg-primary font-medium text-primary-foreground'
                        : 'hover:bg-muted',
                    )}
                  >
                    {d === 'percent' ? '%' : d === 'flat' ? '₹' : 'Free ship'}
                  </button>
                ))}
              </div>
            </Field>

            <Field label="VALUE">
              {draft.discountKind === 'percent' ? (
                <div className="flex h-9 items-center overflow-hidden rounded-lg border">
                  <input
                    value={draft.discountValue}
                    onChange={(e) =>
                      set('discountValue', Number(e.target.value.replace(/[^\d]/g, '')) || 0)
                    }
                    className="tnum h-full flex-1 bg-transparent px-3 text-sm font-semibold outline-none"
                    inputMode="numeric"
                  />
                  <span className="grid h-full w-8 place-items-center border-l bg-surface text-sm text-muted-foreground">
                    %
                  </span>
                </div>
              ) : (
                <RupeeInput
                  valuePaise={draft.discountValue}
                  onChangePaise={(p) => set('discountValue', p ?? 0)}
                  className="h-9"
                  disabled={draft.discountKind === 'free_delivery'}
                />
              )}
            </Field>

            <Field label="MAX DISCOUNT">
              <RupeeInput
                valuePaise={draft.maxDiscountPaise}
                onChangePaise={(p) => set('maxDiscountPaise', p ?? 0)}
                className="h-9"
              />
            </Field>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="MINIMUM ORDER">
              <RupeeInput
                valuePaise={draft.minOrderPaise}
                onChangePaise={(p) => set('minOrderPaise', p ?? 0)}
                className="h-9"
              />
            </Field>
            {draft.kind === 'coupon' ? (
              <Field label="COUPON CODE">
                <Input
                  value={draft.couponCode ?? ''}
                  onChange={(e) => set('couponCode', e.target.value.toUpperCase().slice(0, 16))}
                  placeholder="MADURAI50"
                  className="tnum tracking-[0.08em]"
                />
              </Field>
            ) : null}
          </div>
        </Card>

        {/* Targeting */}
        <Card className="flex flex-col gap-4 p-4">
          <div className="flex items-center gap-2">
            <span className="text-[13px] font-semibold tracking-tight">Targeting</span>
            <span className="ta text-[11px] text-placeholder">யாருக்கு காட்டுவது</span>
          </div>

          <Field label="CATEGORIES · EMPTY MEANS ALL">
            <div className="flex flex-wrap gap-2">
              {(Object.keys(CATEGORY_LABEL) as Category[]).map((c) => {
                const on = draft.categories.includes(c);
                return (
                  <button
                    key={c}
                    onClick={() => set('categories', toggleIn(draft.categories, c))}
                    className={cn(
                      'flex h-8 items-center gap-1.5 rounded-md px-3 text-[12.5px] transition-colors',
                      on
                        ? 'bg-primary font-medium text-primary-foreground'
                        : 'border text-body-strong hover:bg-muted',
                    )}
                  >
                    <span
                      className="size-1.5 rounded-full"
                      style={{ background: tokens.category[c].solid }}
                    />
                    {CATEGORY_LABEL[c].en}
                  </button>
                );
              })}
            </div>
          </Field>

          <Field label="LOCALITIES · EMPTY MEANS ALL OF MADURAI">
            <div className="flex flex-wrap gap-2">
              {LOCALITIES.map((l) => {
                const on = draft.localityIds.includes(l.id);
                return (
                  <button
                    key={l.id}
                    onClick={() => set('localityIds', toggleIn(draft.localityIds, l.id))}
                    className={cn(
                      'h-8 rounded-md px-3 text-[12.5px] transition-colors',
                      on
                        ? 'bg-primary font-medium text-primary-foreground'
                        : 'border text-body-strong hover:bg-muted',
                    )}
                  >
                    {l.name}
                  </button>
                );
              })}
            </div>
          </Field>

          <div className="grid gap-3 sm:grid-cols-3">
            <Field label="STARTS">
              <Input
                type="datetime-local"
                value={new Date(draft.startsAt - new Date().getTimezoneOffset() * 60000)
                  .toISOString()
                  .slice(0, 16)}
                onChange={(e) => set('startsAt', new Date(e.target.value).getTime())}
              />
            </Field>
            <Field label="ENDS">
              <Input
                type="datetime-local"
                value={new Date(draft.endsAt - new Date().getTimezoneOffset() * 60000)
                  .toISOString()
                  .slice(0, 16)}
                onChange={(e) => set('endsAt', new Date(e.target.value).getTime())}
              />
            </Field>
            <Field label="BUDGET CAP">
              <RupeeInput
                valuePaise={draft.budgetPaise}
                onChangePaise={(p) => set('budgetPaise', p ?? 0)}
                className="h-9"
              />
            </Field>
          </div>
        </Card>

        <div className="flex gap-2.5">
          <Button
            size="lg"
            className="flex-1"
            disabled={!draft.creative.headline.trim()}
            onClick={() => set('status', status === 'live' || status === 'scheduled' ? 'paused' : 'scheduled')}
          >
            {status === 'live' || status === 'scheduled' ? 'Pause campaign' : 'Schedule campaign'}
          </Button>
          <Button variant="outline" size="lg" onClick={onClose}>
            Done
          </Button>
          <Button
            variant="destructiveGhost"
            size="lg"
            onClick={() => {
              void deletePromotion(draft.id);
              onClose();
            }}
          >
            <Trash2 className="size-4" />
          </Button>
        </div>
      </div>

      <div className="xl:sticky xl:top-0 xl:self-start">
        <ThreadPreview promo={draft} />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// List
// ---------------------------------------------------------------------------

function PromoRow({ promo, onOpen }: { promo: Promotion; onOpen: () => void }) {
  const status = effectiveStatus(promo);
  const used = budgetUsed(promo);

  return (
    <button
      onClick={onOpen}
      className="flex w-full flex-col gap-3 border-b px-5 py-3.5 text-left transition-colors hover:bg-surface"
    >
      <div className="flex items-start gap-3">
        <span
          className="mt-0.5 size-2.5 shrink-0 rounded-full"
          style={{ background: accentHex(promo.creative.accent) }}
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="truncate text-[13.5px] font-semibold tracking-tight">
              {promo.creative.headline || 'Untitled campaign'}
            </span>
            <Badge tone={STATUS_TONE[status]}>{PROMO_STATUS_LABEL[status].en.toUpperCase()}</Badge>
          </div>
          <p className="mt-0.5 truncate text-[11.5px] text-muted-foreground">
            {promo.categories.length === 0 ? 'All categories' : promo.categories.join(', ')} ·{' '}
            {promo.localityIds.length === 0
              ? 'All of Madurai'
              : `${promo.localityIds.length} localities`}
          </p>
        </div>
        <div className="tnum shrink-0 text-right">
          <div className="text-[13px] font-semibold">{formatInr(promo.revenuePaise)}</div>
          <div className="text-[10.5px] text-placeholder">revenue</div>
        </div>
      </div>

      <div className="flex items-center gap-4 pl-[22px]">
        <span className="tnum flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <Eye className="size-3" /> {promo.impressions.toLocaleString('en-IN')}
        </span>
        <span className="tnum flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <MousePointerClick className="size-3" /> {ctr(promo)}%
        </span>
        <span className="tnum text-[11px] text-muted-foreground">
          {conversionRate(promo)}% convert
        </span>
        <span
          className={cn(
            'tnum text-[11px] font-semibold',
            roas(promo) >= 3 ? 'text-grocery-fg' : 'text-muted-foreground',
          )}
        >
          {roas(promo)}× ROAS
        </span>
        <div className="ml-auto flex w-28 items-center gap-2">
          <div className="h-1 flex-1 overflow-hidden rounded-full bg-muted">
            <div
              className={cn('h-1 rounded-full', used >= 90 ? 'bg-verify' : 'bg-primary')}
              style={{ width: `${used}%` }}
            />
          </div>
          <span className="tnum text-[10px] text-placeholder">{used}%</span>
        </div>
      </div>
    </button>
  );
}

export default function PromotionsPage() {
  const { user, loading: authLoading } = useAuth();
  const [promos, setPromos] = React.useState<Promotion[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [openId, setOpenId] = React.useState<string | null>(null);

  React.useEffect(() => {
    return subscribePromotions((p) => {
      setPromos(p);
      setLoading(false);
    });
  }, []);

  const open = promos.find((p) => p.id === openId) ?? null;

  const totals = React.useMemo(
    () => ({
      live: promos.filter((p) => effectiveStatus(p) === 'live').length,
      spend: promos.reduce((s, p) => s + p.spentPaise, 0),
      revenue: promos.reduce((s, p) => s + p.revenuePaise, 0),
      redemptions: promos.reduce((s, p) => s + p.redemptions, 0),
    }),
    [promos],
  );

  if (authLoading || !user) {
    return (
      <main className="grid min-h-dvh place-items-center">
        <span className="size-5 animate-spin rounded-full border-2 border-border border-t-foreground" />
      </main>
    );
  }

  return (
    <main className="flex h-dvh flex-col overflow-hidden">
      <div className="flex h-14 shrink-0 items-center gap-4 border-b px-5">
        <Link
          href="/"
          className="flex items-center gap-2 text-[13px] font-medium text-body-strong transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Board
        </Link>
        <div className="flex flex-col leading-none">
          <span className="text-[13.5px] font-semibold tracking-tight">Promotions &amp; ads</span>
          <span className="ta mt-0.5 text-[10px] text-placeholder">சலுகைகள் & விளம்பரங்கள்</span>
        </div>
        <div className="flex-1" />
        <Button
          size="sm"
          className="gap-1.5"
          onClick={() => void createPromotion(user.uid).then(setOpenId)}
        >
          <Plus className="size-3.5" strokeWidth={2.4} />
          New campaign
        </Button>
      </div>

      <div className="flex shrink-0 gap-3 border-b px-5 py-3">
        {[
          { l: 'LIVE NOW', v: String(totals.live) },
          { l: 'DISCOUNT GIVEN', v: formatInr(totals.spend) },
          { l: 'REVENUE DRIVEN', v: formatInr(totals.revenue) },
          { l: 'REDEMPTIONS', v: totals.redemptions.toLocaleString('en-IN') },
        ].map((s) => (
          <Card key={s.l} className="flex-1 px-4 py-2.5">
            <span className="text-[10px] font-bold tracking-[0.1em] text-placeholder">{s.l}</span>
            <div className="tnum mt-1 text-lg font-semibold tracking-tight">{s.v}</div>
          </Card>
        ))}
      </div>

      {open ? (
        <Composer promo={open} onClose={() => setOpenId(null)} />
      ) : (
        <div className="scroll-slim min-h-0 flex-1 overflow-y-auto">
          {loading ? (
            <div className="space-y-2 p-5">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </div>
          ) : promos.length === 0 ? (
            <div className="grid h-64 place-items-center text-center">
              <div>
                <p className="text-[14px] font-medium">No campaigns yet</p>
                <p className="mx-auto mt-1 max-w-sm text-[12.5px] leading-relaxed text-muted-foreground">
                  Run a free-delivery hour in one locality, or a coupon for first-time pharmacy
                  orders. Both show up in the customer&apos;s thread, not on a page nobody visits.
                </p>
              </div>
            </div>
          ) : (
            promos.map((p) => (
              <PromoRow key={p.id} promo={p} onOpen={() => setOpenId(p.id)} />
            ))
          )}
        </div>
      )}
    </main>
  );
}
