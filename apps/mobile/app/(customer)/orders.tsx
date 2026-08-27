/**
 * Order history.
 *
 * Live orders pinned to the top, everything else below by date. Bounded to the
 * last 30 by the subscription — nobody scrolls to their order from March.
 */

import * as React from 'react';
import { Pressable, SectionList, View } from 'react-native';
import { useRouter } from 'expo-router';
import { ChevronRight } from 'lucide-react-native';

import {
  COPY,
  STATUS_LABEL,
  formatInr,
  isTerminal,
  localityById,
  type Category,
  type Order,
} from '@dfc/core';

import { useAuth } from '@/providers/auth';
import { subscribeMyOrders } from '@/lib/orders';
import { useLang } from '@/providers/language';
import { Badge, Empty, Loading, Num, Screen, T, Ta } from '@/ui';
import { SettingsHeader } from '@/ui/settings';

const TONE: Record<Category, 'pharmacy' | 'grocery' | 'food' | 'concierge'> = {
  pharmacy: 'pharmacy',
  grocery: 'grocery',
  food: 'food',
  concierge: 'concierge',
};

function dayLabel(ts: number): string {
  const d = new Date(ts);
  const today = new Date();
  const yesterday = new Date(Date.now() - 86_400_000);
  const same = (a: Date, b: Date) => a.toDateString() === b.toDateString();
  if (same(d, today)) return 'Today';
  if (same(d, yesterday)) return 'Yesterday';
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
}

function OrderRow({ order, onPress }: { order: Order; onPress: () => void }) {
  const { bilingual } = useLang();
  const locality = localityById(order.localityId);
  const live = !isTerminal(order.status);
  const cancelled = order.status === 'cancelled' || order.status === 'rejected';

  return (
    <Pressable
      onPress={onPress}
      className="min-h-[72px] flex-row items-center gap-3 border-b border-muted bg-background px-4 py-3 active:bg-surface"
    >
      <View className="flex-1 gap-1">
        <View className="flex-row items-center gap-2">
          <Num className="text-[13px] font-semibold">#{order.code}</Num>
          <Badge label={order.category.toUpperCase()} tone={TONE[order.category]} />
          {live ? (
            <View className="flex-row items-center gap-1.5 rounded-full border border-grocery-border bg-grocery-tint px-2 py-0.5">
              <View className="size-1.5 rounded-full bg-grocery" />
              <T className="text-[9.5px] font-bold tracking-[0.3px] text-grocery-fg">LIVE</T>
            </View>
          ) : null}
        </View>

        <T className="text-[13px] text-body-strong" numberOfLines={1}>
          {order.items
            .filter((i) => i.included)
            .slice(0, 3)
            .map((i) => i.name)
            .join(', ') || order.storeName || 'Concierge errand'}
        </T>

        <View className="flex-row items-center gap-1.5">
          <T
            className={`text-[11.5px] ${
              cancelled ? 'text-destructive' : live ? 'text-grocery-fg' : 'text-placeholder'
            }`}
          >
            {STATUS_LABEL[order.status].en}
          </T>
          <T className="text-[11.5px] text-placeholder">· {locality?.name}</T>
        </View>
        {bilingual ? <Ta className="text-[10.5px]">{STATUS_LABEL[order.status].ta}</Ta> : null}
      </View>

      <View className="items-end gap-1">
        <Num
          className={`text-[14px] font-semibold ${cancelled ? 'text-placeholder line-through' : ''}`}
        >
          {formatInr(order.pricing.totalPaise)}
        </Num>
        <ChevronRight size={16} color="#A1A1AA" strokeWidth={2} />
      </View>
    </Pressable>
  );
}

export default function OrderHistory() {
  const router = useRouter();
  const { user } = useAuth();
  const [orders, setOrders] = React.useState<Order[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (!user) return;
    return subscribeMyOrders(user.uid, (list) => {
      setOrders(list);
      setLoading(false);
    });
  }, [user]);

  const sections = React.useMemo(() => {
    const live = orders.filter((o) => !isTerminal(o.status));
    const done = orders.filter((o) => isTerminal(o.status));

    const byDay = new Map<string, Order[]>();
    for (const o of done) {
      const key = dayLabel(o.createdAt);
      byDay.set(key, [...(byDay.get(key) ?? []), o]);
    }

    return [
      ...(live.length ? [{ title: 'In progress', data: live }] : []),
      ...[...byDay.entries()].map(([title, data]) => ({ title, data })),
    ];
  }, [orders]);

  if (loading) {
    return (
      <Screen>
        <SettingsHeader title={COPY.myOrders.en} titleTa={COPY.myOrders.ta} />
        <Loading />
      </Screen>
    );
  }

  return (
    <Screen>
      <SettingsHeader title={COPY.myOrders.en} titleTa={COPY.myOrders.ta} />

      {orders.length === 0 ? (
        <View className="flex-1 bg-surface">
          <View className="pt-24">
            <Empty
              title={COPY.noOrdersYet.en}
              subtitle="Photograph a prescription or say what you need, and it will show up here."
            />
            <Ta className="mt-2 text-center text-[13px]">{COPY.noOrdersYet.ta}</Ta>
          </View>
        </View>
      ) : (
        <SectionList
          className="flex-1 bg-surface"
          sections={sections}
          keyExtractor={(o) => o.id}
          stickySectionHeadersEnabled={false}
          renderSectionHeader={({ section }) => (
            <T className="bg-surface px-4 pb-2 pt-4 text-[10.5px] font-bold tracking-[1.05px] text-placeholder">
              {section.title.toUpperCase()}
            </T>
          )}
          renderItem={({ item }) => (
            <OrderRow
              order={item}
              onPress={() => router.push(`/(customer)/order/${item.id}`)}
            />
          )}
          ListFooterComponent={
            <T className="px-4 py-6 text-center text-[11.5px] text-placeholder">
              Showing your last {orders.length} orders.
            </T>
          }
        />
      )}
    </Screen>
  );
}
