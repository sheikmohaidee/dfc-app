/**
 * Rider earnings.
 *
 * A rider checks this between drops and at the end of a shift. Today's number
 * is the hero; the week is context; the breakdown exists because a payout you
 * cannot reconcile is a payout you argue about.
 *
 * Delivery fee is the rider's line — item cost is the shop's money passing
 * through, and showing it as "earnings" would be dishonest.
 */

import * as React from 'react';
import { Alert, View } from 'react-native';
import { collection, onSnapshot, orderBy, query, where } from 'firebase/firestore';
import { Banknote, TrendingUp } from 'lucide-react-native';

import { COL, formatInr, localityById, type Order, type Payment } from '@dfc/core';

import { useAuth } from '@/providers/auth';
import { db } from '@/lib/firebase';
import { settleCash, subscribeHeldCash } from '@/lib/payments';
import { Button, Card, Loading, Num, Screen, T, Ta } from '@/ui';
import { Group, Row, SettingsHeader, SettingsScroll } from '@/ui/settings';

const DAY = 86_400_000;

function startOfToday(): number {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

export default function Earnings() {
  const { user, profile } = useAuth();
  const [orders, setOrders] = React.useState<Order[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [held, setHeld] = React.useState<Payment[]>([]);
  const [settling, setSettling] = React.useState(false);

  // The cash ledger, not the order list — this is what has to reconcile.
  React.useEffect(() => {
    if (!user) return;
    return subscribeHeldCash(user.uid, setHeld);
  }, [user]);

  // Delivered work for the last 7 days. Bounded by date, not by count — a
  // rider's week is finite, their history is not.
  React.useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db(), COL.orders),
      where('riderUid', '==', user.uid),
      where('status', '==', 'delivered'),
      where('createdAt', '>=', Date.now() - 7 * DAY),
      orderBy('createdAt', 'desc'),
    );
    return onSnapshot(
      q,
      (s) => {
        setOrders(s.docs.map((d) => ({ ...(d.data() as Order), id: d.id })));
        setLoading(false);
      },
      () => setLoading(false),
    );
  }, [user]);

  const today = startOfToday();
  const todays = orders.filter((o) => o.createdAt >= today);

  const fee = (list: Order[]) => list.reduce((s, o) => s + o.pricing.deliveryPaise, 0);
  // From the payment ledger, so it matches what is physically in a pocket —
  // deriving it from orders would count an order whose cash was already
  // handed in.
  const cashHeld = held.reduce((s, p) => s + p.receivedPaise, 0);

  // Per-day totals for the little bar chart.
  const week = React.useMemo(() => {
    const days: { label: string; paise: number; trips: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const from = today - i * DAY;
      const to = from + DAY;
      const inDay = orders.filter((o) => o.createdAt >= from && o.createdAt < to);
      days.push({
        label: new Date(from).toLocaleDateString('en-IN', { weekday: 'narrow' }),
        paise: fee(inDay),
        trips: inDay.length,
      });
    }
    return days;
  }, [orders, today]);

  const peak = Math.max(1, ...week.map((d) => d.paise));

  if (loading) {
    return (
      <Screen>
        <SettingsHeader title="Earnings" titleTa="வருமானம்" />
        <Loading />
      </Screen>
    );
  }

  return (
    <Screen>
      <SettingsHeader title="Earnings" titleTa="வருமானம்" />

      <SettingsScroll>
        {/* Today */}
        <Card className="gap-1.5 rounded-generative bg-foreground p-5">
          <View className="flex-row items-center justify-between">
            <T
              style={{ fontSize: 11, fontWeight: '700', letterSpacing: 1.3 }}
              className="text-placeholder"
            >
              EARNED TODAY
            </T>
            <Ta className="text-[11px] text-muted-foreground">இன்றைய வருமானம்</Ta>
          </View>
          <Num
            style={{ fontSize: 46, fontWeight: '700', letterSpacing: -2, lineHeight: 52 }}
            className="text-white"
          >
            {formatInr(fee(todays))}
          </Num>
          <T className="mt-1 text-[12.5px] text-placeholder">
            {todays.length} {todays.length === 1 ? 'trip' : 'trips'} · delivery fees only
          </T>
        </Card>

        {/* Cash in hand — the number that has to reconcile at shift end. */}
        {cashHeld > 0 ? (
          <Card className="gap-3 border-verify-border bg-verify-tint p-4">
            <View className="flex-row items-center gap-3">
              <Banknote size={19} color="#B45309" strokeWidth={2} />
              <View className="flex-1">
                <T className="text-[13.5px] font-semibold text-verify-fg">
                  You are holding {formatInr(cashHeld)}
                </T>
                <Ta className="mt-0.5 text-[11.5px] text-verify">
                  ஷிப்ட் முடிவில் ஒப்படைக்க வேண்டும்
                </Ta>
                <T className="mt-0.5 text-[11.5px] text-verify">
                  {held.length} cash {held.length === 1 ? 'delivery' : 'deliveries'}
                </T>
              </View>
            </View>
            <Button
              size="md"
              label={`Hand in ${formatInr(cashHeld)}`}
              labelTa="பணம் ஒப்படைத்தேன்"
              loading={settling}
              onPress={() => {
                Alert.alert(
                  'Hand in cash',
                  `Confirm you have given ${formatInr(cashHeld)} to DFC. This clears it from your name.`,
                  [
                    { text: 'Not yet', style: 'cancel' },
                    {
                      text: 'Handed in',
                      onPress: () => {
                        setSettling(true);
                        void settleCash(held, user!.uid).finally(() => setSettling(false));
                      },
                    },
                  ],
                );
              }}
            />
          </Card>
        ) : null}

        {/* Week */}
        <View className="gap-2">
          <T className="px-1 text-[10.5px] font-bold tracking-[1.05px] text-placeholder">
            LAST 7 DAYS
          </T>
          <Card className="gap-4 p-4">
            <View className="flex-row items-end justify-between" style={{ height: 96 }}>
              {week.map((d, i) => (
                <View key={i} className="flex-1 items-center gap-2">
                  <Num className="text-[9.5px] text-placeholder">
                    {d.paise > 0 ? Math.round(d.paise / 100) : ''}
                  </Num>
                  <View
                    style={{ height: Math.max(3, (d.paise / peak) * 62) }}
                    className={`w-[62%] rounded-t-[3px] ${
                      i === week.length - 1 ? 'bg-primary' : 'bg-border'
                    }`}
                  />
                  <T className="text-[10px] text-placeholder">{d.label}</T>
                </View>
              ))}
            </View>

            <View className="flex-row items-center gap-2 border-t border-muted pt-3">
              <TrendingUp size={15} color="#16A34A" strokeWidth={2} />
              <T className="flex-1 text-[12.5px] text-body-strong">
                {formatInr(fee(orders))} across {orders.length} trips
              </T>
            </View>
          </Card>
        </View>

        {/* Reconcilable detail */}
        <Group label="Recent trips" footer="Delivery fee is your earning. Item cost belongs to the shop.">
          {todays.length === 0 ? (
            <Row label={{ en: 'No trips yet today', ta: 'இன்று வேலை இல்லை' }} chevron={false} />
          ) : (
            todays.slice(0, 12).map((o) => (
              <Row
                key={o.id}
                label={`#${o.code}`}
                hint={`${localityById(o.localityId)?.name ?? ''} · ${
                  o.paymentMode === 'cod' ? `COD ${formatInr(o.pricing.totalPaise)}` : 'Pre-paid'
                }`}
                chevron={false}
                right={
                  <Num className="text-[14px] font-semibold">
                    {formatInr(o.pricing.deliveryPaise)}
                  </Num>
                }
              />
            ))
          )}
        </Group>

        <T className="px-1 text-center text-[11.5px] leading-[17px] text-placeholder">
          {profile?.name ?? 'Rider'} · payouts are settled weekly. Questions about a payout go to
          DFC operations.
        </T>
      </SettingsScroll>
    </Screen>
  );
}
