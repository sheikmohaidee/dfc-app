/**
 * Generative UI: the model's answer, rendered as a component.
 *
 * The customer photographs a prescription and gets this back — never a
 * paragraph of text.
 *
 * This file holds the read-only variant, shown once an order has moved past
 * `incoming` and is no longer the customer's to change. While it still IS
 * theirs to change, `./review-card.tsx` renders it instead: same list, every
 * row editable. An earlier `OrderChecklistCard` sat between the two, offering
 * ticks and quantities but no way to fix a misread name; the review card does
 * everything it did and more, so it was retired rather than left as a second
 * way to do the same job.
 */

import * as React from 'react';
import { View } from 'react-native';
import { AlertTriangle, Pill, ShoppingBag, UtensilsCrossed, Navigation, Printer, Package, Truck } from 'lucide-react-native';

import {
  CATEGORY_LABEL,
  COPY,
  formatInr,
  needsVerification,
  type Category,
  type Order,
} from '@dfc/core';

import { Badge, Button, Card, Divider, Money, Num, T, Ta } from './index';

const ICON: Record<Category, typeof Pill> = {
  pharmacy: Pill,
  grocery: ShoppingBag,
  food: UtensilsCrossed,
  concierge: Navigation,
  print: Printer,
  pickup_drop: Package,
  buy_deliver: Truck,
};

const HEAD: Record<Category, { bg: string; border: string; solid: string; fg: string }> = {
  pharmacy: { bg: 'bg-pharmacy-tint', border: 'border-pharmacy-border', solid: 'bg-pharmacy', fg: 'text-pharmacy-fg' },
  grocery: { bg: 'bg-grocery-tint', border: 'border-grocery-border', solid: 'bg-grocery', fg: 'text-grocery-fg' },
  food: { bg: 'bg-food-tint', border: 'border-food-border', solid: 'bg-food', fg: 'text-food-fg' },
  concierge: { bg: 'bg-concierge-tint', border: 'border-concierge-border', solid: 'bg-concierge', fg: 'text-concierge-fg' },
  print: { bg: 'bg-pharmacy-tint', border: 'border-pharmacy-border', solid: 'bg-pharmacy', fg: 'text-pharmacy-fg' },
  pickup_drop: { bg: 'bg-food-tint', border: 'border-food-border', solid: 'bg-food', fg: 'text-food-fg' },
  buy_deliver: { bg: 'bg-grocery-tint', border: 'border-grocery-border', solid: 'bg-grocery', fg: 'text-grocery-fg' },
};

function Header({ order }: { order: Order }) {
  const Icon = ICON[order.category];
  const c = HEAD[order.category];
  const label = CATEGORY_LABEL[order.category];

  return (
    <View className={`flex-row items-start gap-2.5 border-b px-3.5 py-3 ${c.bg} ${c.border}`}>
      <View className={`size-[26px] items-center justify-center rounded-[7px] ${c.solid}`}>
        <Icon size={14} color="#FFFFFF" strokeWidth={2} />
      </View>
      <View className="flex-1">
        <View className="flex-row items-center gap-2">
          <T className={`text-[13.5px] font-semibold tracking-tight ${c.fg}`}>{label.en}</T>
          <Ta className={`text-[11px] ${c.fg} opacity-70`}>{label.ta}</Ta>
        </View>
        <T className="mt-0.5 text-[11.5px] text-muted-foreground">
          {order.storeName ?? 'Finding a store nearby'}
        </T>
      </View>
      <Num className="text-[10px] text-placeholder">#{order.code}</Num>
    </View>
  );
}

function Totals({ order, live }: { order: Order; live?: { itemsPaise: number; totalPaise: number } }) {
  const items = live?.itemsPaise ?? order.pricing.itemsPaise;
  const total = live?.totalPaise ?? order.pricing.totalPaise;

  return (
    <View className="gap-1.5 border-t border-muted bg-surface px-3.5 py-2.5">
      <View className="flex-row items-center justify-between">
        <T className="text-xs text-muted-foreground">{COPY.items.en}</T>
        <Num className="text-xs text-body-strong">{formatInr(items)}</Num>
      </View>
      <View className="flex-row items-center justify-between">
        <T className="text-xs text-muted-foreground">{COPY.delivery.en}</T>
        <Num className="text-xs text-body-strong">{formatInr(order.pricing.deliveryPaise)}</Num>
      </View>
      {order.pricing.servicePaise > 0 ? (
        <View className="flex-row items-center justify-between">
          <T className="text-xs text-muted-foreground">{COPY.serviceFee.en}</T>
          <Num className="text-xs text-body-strong">{formatInr(order.pricing.servicePaise)}</Num>
        </View>
      ) : null}
      <View className="mt-0.5 flex-row items-center justify-between border-t border-border pt-1.5">
        <View>
          <T className="text-[12.5px] font-semibold">{COPY.total.en}</T>
          <Ta className="text-[10px]">{COPY.total.ta}</Ta>
        </View>
        <Money paise={total} size={17} />
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Variation A — template card
// ---------------------------------------------------------------------------

export function OrderTemplateCard({
  order,
  onConfirm,
  busy,
}: {
  order: Order;
  onConfirm?: () => void;
  busy?: boolean;
}) {
  const flagged = order.items.filter(needsVerification);

  return (
    <Card className="overflow-hidden rounded-generative">
      <Header order={order} />

      <View className="px-3.5">
        {order.items.map((item, i) => {
          const flag = needsVerification(item);
          return (
            <View
              key={item.id}
              className={`flex-row items-center justify-between py-2 ${
                i < order.items.length - 1 ? 'border-b border-muted' : ''
              }`}
            >
              <View className="flex-1 pr-3">
                <T
                  className={`text-[13.5px] font-medium tracking-tight ${
                    flag ? 'text-verify-fg' : ''
                  }`}
                >
                  {item.name}
                  {flag ? '?' : ''}
                </T>
                <View className="mt-1 flex-row items-center gap-1.5">
                  {flag ? <Badge label="VERIFY" tone="verify" /> : null}
                  <Num className="text-[10.5px] text-placeholder">
                    {item.unit}
                    {item.quantity > 1 ? ` × ${item.quantity}` : ''}
                  </Num>
                </View>
              </View>
              <Num
                className={`text-[13px] font-medium ${flag ? 'text-verify' : 'text-foreground'}`}
              >
                {item.unitPricePaise === null
                  ? '₹ —'
                  : `${formatInr(item.unitPricePaise * item.quantity)}${flag ? '?' : ''}`}
              </Num>
            </View>
          );
        })}

        {order.stops?.map((stop, i) => (
          <View
            key={stop.id}
            className={`flex-row items-center justify-between py-2.5 ${
              i < (order.stops?.length ?? 0) - 1 ? 'border-b border-muted' : ''
            }`}
          >
            <View className="flex-1 pr-3">
              <T className="text-[13.5px] font-medium tracking-tight">{stop.storeName}</T>
              <T className="mt-0.5 text-[11px] text-placeholder">{stop.what}</T>
            </View>
            <Money paise={stop.costPaise} size={13} />
          </View>
        ))}
      </View>

      <Totals order={order} />

      <View className="gap-2 px-3.5 pb-3.5 pt-3">
        <Button
          size="lg"
          label={`${COPY.confirmAndPay.en} ${formatInr(order.pricing.totalPaise)}`}
          labelTa={COPY.confirmAndPay.ta}
          loading={busy}
          onPress={onConfirm}
        />
        {flagged.length > 0 ? (
          <View className="flex-row items-start gap-1.5">
            <AlertTriangle size={12} color="#B45309" strokeWidth={2} style={{ marginTop: 2 }} />
            <T className="flex-1 text-[10.5px] leading-[15px] text-placeholder">
              {COPY.needsPharmacist.en}
            </T>
          </View>
        ) : null}
      </View>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Variation B — interactive checklist
// ---------------------------------------------------------------------------

export { Divider };
