/**
 * Vendor payouts.
 *
 * A shopkeeper's question is always the same: how much is DFC going to pay me,
 * and when. So that is the top of the screen, and the order list below it is
 * there to make the number checkable rather than to be browsed.
 */

import * as React from 'react';
import { View } from 'react-native';
import { collection, onSnapshot, orderBy, query, where } from 'firebase/firestore';
import { Banknote, CalendarClock, Store } from 'lucide-react-native';

import { COL, formatInr, storeById, type Order } from '@dfc/core';

import { useAuth } from '@/providers/auth';
import { db } from '@/lib/firebase';
import { Card, Loading, Num, Screen, T, Ta } from '@/ui';
import { Group, Row, SettingsHeader, SettingsScroll } from '@/ui/settings';

const DAY = 86_400_000;

/** DFC's cut of the goods value. Delivery fees are not the shop's money. */
const COMMISSION_RATE = 0.08;

function startOfToday(): number {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

/** Next Monday — payouts settle weekly. */
function nextSettlement(): string {
  const d = new Date();
  d.setDate(d.getDate() + ((8 - d.getDay()) % 7 || 7));
  return d.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short' });
}

export default function Payouts() {
  const { profile } = useAuth();
  const [orders, setOrders] = React.useState<Order[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (!profile?.storeId) {
      setLoading(false);
      return;
    }
    const q = query(
      collection(db(), COL.orders),
      where('storeId', '==', profile.storeId),
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
  }, [profile?.storeId]);

  const today = startOfToday();
  const todays = orders.filter((o) => o.createdAt >= today);

  const goods = (list: Order[]) => list.reduce((s, o) => s + o.pricing.itemsPaise, 0);

  const weekGoods = goods(orders);
  const commission = Math.round(weekGoods * COMMISSION_RATE);
  const payable = weekGoods - commission;

  // Cash orders were paid straight to the rider, so DFC owes the shop that
  // money; pre-paid orders DFC already holds. Both settle the same way, but a
  // shopkeeper reconciling their till needs the split.
  const codGoods = goods(orders.filter((o) => o.paymentMode === 'cod'));
  const prepaidGoods = weekGoods - codGoods;

  const store = storeById(profile?.storeId);

  if (loading) {
    return (
      <Screen>
        <SettingsHeader title="Payouts" titleTa="பணப்பட்டுவாடா" />
        <Loading />
      </Screen>
    );
  }

  return (
    <Screen>
      <SettingsHeader title="Payouts" titleTa="பணப்பட்டுவாடா" />

      <SettingsScroll>
        <Card className="gap-1.5 rounded-generative bg-foreground p-5">
          <View className="flex-row items-center justify-between">
            <T
              style={{ fontSize: 11, fontWeight: '700', letterSpacing: 1.3 }}
              className="text-placeholder"
            >
              DUE TO YOU
            </T>
            <Ta className="text-[11px] text-muted-foreground">உங்களுக்கு வர வேண்டியது</Ta>
          </View>
          <Num
            style={{ fontSize: 44, fontWeight: '700', letterSpacing: -1.9, lineHeight: 50 }}
            className="text-white"
          >
            {formatInr(payable)}
          </Num>
          <View className="mt-1 flex-row items-center gap-2">
            <CalendarClock size={13} color="#A1A1AA" strokeWidth={2} />
            <T className="text-[12.5px] text-placeholder">Settles {nextSettlement()}</T>
          </View>
        </Card>

        <Group label="This week">
          <Row
            icon={<Store size={19} color="#52525B" strokeWidth={1.9} />}
            label={{ en: 'Goods sold', ta: 'விற்பனை' }}
            chevron={false}
            right={<Num className="text-[14px] font-semibold">{formatInr(weekGoods)}</Num>}
          />
          <Row
            label={{ en: `DFC commission (${Math.round(COMMISSION_RATE * 100)}%)`, ta: 'கமிஷன்' }}
            chevron={false}
            right={
              <Num className="text-[14px] font-semibold text-destructive">
                −{formatInr(commission)}
              </Num>
            }
          />
          <Row
            label={{ en: 'Net payable', ta: 'நிகர தொகை' }}
            chevron={false}
            right={<Num className="text-[15px] font-bold">{formatInr(payable)}</Num>}
          />
        </Group>

        <Group
          label="How it was paid"
          footer="Cash orders were collected by the rider and are included in the payout above — that money is not in your till."
        >
          <Row
            icon={<Banknote size={19} color="#16A34A" strokeWidth={1.9} />}
            label={{ en: 'Cash on delivery', ta: 'கையில் பணம்' }}
            chevron={false}
            right={<Num className="text-[14px] font-medium">{formatInr(codGoods)}</Num>}
          />
          <Row
            label={{ en: 'Paid online', ta: 'ஆன்லைன்' }}
            chevron={false}
            right={<Num className="text-[14px] font-medium">{formatInr(prepaidGoods)}</Num>}
          />
        </Group>

        <Group label={`Delivered today · ${todays.length}`}>
          {todays.length === 0 ? (
            <Row label={{ en: 'Nothing delivered yet', ta: 'இன்று எதுவும் இல்லை' }} chevron={false} />
          ) : (
            todays.slice(0, 12).map((o) => (
              <Row
                key={o.id}
                label={`#${o.code}`}
                hint={`${o.items.filter((i) => i.included).length} items · ${
                  o.paymentMode === 'cod' ? 'cash' : 'online'
                }`}
                chevron={false}
                right={
                  <Num className="text-[14px] font-semibold">
                    {formatInr(o.pricing.itemsPaise)}
                  </Num>
                }
              />
            ))
          )}
        </Group>

        <T className="px-1 text-center text-[11.5px] leading-[17px] text-placeholder">
          {store?.name ?? 'Your store'} · payouts land in the bank account on file. Disputes go to
          DFC operations within 7 days of settlement.
        </T>
      </SettingsScroll>
    </Screen>
  );
}
