/**
 * Rider queue.
 *
 * Usually one card. The online switch is the only setting a rider needs, and
 * it is the biggest control on the screen after the task itself.
 */

import * as React from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { useRouter } from 'expo-router';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { ChevronRight, IndianRupee, Pill, ShoppingBag, Settings } from 'lucide-react-native';

import {
  COPY,
  STATUS_LABEL,
  formatInr,
  localityById,
  routeKm,
  storeById,
  type Order,
} from '@dfc/core';

import { useAuth } from '@/providers/auth';
import { setRiderOnline, subscribeRiderOrders } from '@/lib/orders';
import { Badge, Button, Card, Empty, Loading, Num, Screen, T, Ta } from '@/ui';

function TaskCard({ order, onPress }: { order: Order; onPress: () => void }) {
  const cod = order.paymentMode === 'cod';
  const store = storeById(order.storeId);
  const drop = localityById(order.localityId);
  const km = routeKm(store?.localityId ?? order.localityId, order.localityId);

  return (
    <Animated.View entering={FadeInUp.duration(240)}>
      <Pressable onPress={onPress}>
        <Card className="overflow-hidden">
          <View
            className={`flex-row items-center gap-2.5 px-3.5 py-2.5 ${
              cod ? 'bg-grocery' : 'bg-pharmacy'
            }`}
          >
            {cod ? (
              <ShoppingBag size={15} color="#FFFFFF" strokeWidth={2.2} />
            ) : (
              <Pill size={15} color="#FFFFFF" strokeWidth={2.2} />
            )}
            <T
              style={{ fontSize: 11.5, fontWeight: '700', letterSpacing: 0.7 }}
              className="flex-1 text-white"
            >
              {cod ? 'CASH ON DELIVERY' : 'PRE-PAID'}
            </T>
            <Num className="text-[12.5px] font-semibold text-white">#{order.code}</Num>
          </View>

          <View className="gap-3 p-3.5">
            <View className="flex-row items-start justify-between gap-3">
              <View className="flex-1">
                <T
                  style={{ fontSize: 10, fontWeight: '700', letterSpacing: 0.9 }}
                  className="text-placeholder"
                >
                  {COPY.drop.en}
                </T>
                <T style={{ fontSize: 22, fontWeight: '700', letterSpacing: -0.7 }} className="mt-0.5">
                  {drop?.name}
                </T>
                <T className="mt-1 text-[12.5px] text-muted-foreground" numberOfLines={1}>
                  from {store?.name ?? 'store'} · {km} km
                </T>
              </View>
              <View className="items-end gap-1">
                {cod ? (
                  <>
                    <Num style={{ fontSize: 22, fontWeight: '700', letterSpacing: -0.8 }}>
                      {formatInr(order.pricing.totalPaise)}
                    </Num>
                    <Badge label="COLLECT" tone="grocery" />
                  </>
                ) : (
                  <Badge label="NOTHING TO COLLECT" tone="pharmacy" />
                )}
              </View>
            </View>

            <View className="flex-row items-center justify-between border-t border-muted pt-2.5">
              <T className="text-[12px] text-muted-foreground">
                {STATUS_LABEL[order.status].en}
              </T>
              <View className="flex-row items-center gap-1">
                <T className="text-[12.5px] font-semibold">Open task</T>
                <ChevronRight size={15} color="#18181B" strokeWidth={2.4} />
              </View>
            </View>
          </View>
        </Card>
      </Pressable>
    </Animated.View>
  );
}

export default function RiderQueue() {
  const router = useRouter();
  const { user, profile } = useAuth();

  const [orders, setOrders] = React.useState<Order[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [online, setOnline] = React.useState(true);

  React.useEffect(() => {
    if (!user) return;
    return subscribeRiderOrders(user.uid, (list) => {
      setOrders(list);
      setLoading(false);
    });
  }, [user]);

  async function toggleOnline() {
    if (!user) return;
    const next = !online;
    setOnline(next);
    try {
      await setRiderOnline(user.uid, next);
    } catch {
      setOnline(!next); // put the switch back if the write failed
    }
  }

  if (loading) return <Screen><Loading /></Screen>;

  const earned = orders.reduce((s, o) => s + o.pricing.deliveryPaise, 0);

  return (
    <Screen>
      <View className="border-b border-border">
        <View className="flex-row items-center gap-3 px-4 pb-3 pt-3.5">
          <View className="size-9 items-center justify-center rounded-full bg-muted">
            <T className="text-[13px] font-semibold text-icon">
              {(profile?.name ?? 'R').slice(0, 2).toUpperCase()}
            </T>
          </View>
          <View className="flex-1">
            <T className="text-[15px] font-semibold tracking-[-0.2px]">
              {profile?.name ?? 'Rider'}
            </T>
            <T className="mt-0.5 text-[11px] text-placeholder">
              {localityById(profile?.localityId)?.name ?? 'Madurai'} · DFC rider
            </T>
          </View>
          <Pressable onPress={() => void toggleOnline()} className="items-end gap-1">
            <View
              className={`h-6 w-[42px] flex-row rounded-full p-0.5 ${
                online ? 'justify-end bg-grocery' : 'justify-start bg-border'
              }`}
            >
              <View className="size-5 rounded-full bg-white" />
            </View>
            <T
              className={`text-[10px] font-semibold ${
                online ? 'text-grocery-fg' : 'text-placeholder'
              }`}
            >
              {online ? 'ONLINE' : 'OFFLINE'}
            </T>
          </Pressable>
        </View>

        <View className="flex-row border-t border-muted">
          {[
            { v: String(orders.length), l: 'Active' },
            { v: formatInr(earned), l: 'Earnings today' },
            { v: '12', l: 'Trips' },
          ].map((s) => (
            <View key={s.l} className="flex-1 gap-0.5 px-4 py-2.5">
              <Num className="text-[15px] font-semibold tracking-tight">{s.v}</Num>
              <T className="text-[10.5px] text-placeholder">{s.l}</T>
            </View>
          ))}
        </View>
      </View>

      <ScrollView className="flex-1 bg-surface" contentContainerClassName="gap-3 px-4 py-4">
        {orders.length === 0 ? (
          <View className="pt-16">
            <Empty
              title={online ? COPY.noTasks.en : 'You are offline'}
              subtitle={
                online
                  ? 'Stay online — the next Madurai run will land here.'
                  : 'Go online to start receiving deliveries.'
              }
            />
            <Ta className="mt-2 text-center text-[13px]">{COPY.noTasks.ta}</Ta>
          </View>
        ) : (
          orders.map((o) => (
            <TaskCard key={o.id} order={o} onPress={() => router.push(`/(rider)/task/${o.id}`)} />
          ))
        )}
      </ScrollView>

      <View className="gap-2.5 border-t border-border px-4 pb-5 pt-3">
        <View className="flex-row gap-2.5">
          <Button
            variant="outline"
            size="md"
            label="Earnings"
            labelTa="வருமானம்"
            className="flex-1"
            left={<IndianRupee size={16} color="#3F3F46" strokeWidth={2.2} />}
            onPress={() => router.push('/(rider)/earnings')}
          />
          <Button
            variant="outline"
            size="md"
            label="Account"
            className="flex-1"
            left={<Settings size={16} color="#3F3F46" strokeWidth={2} />}
            onPress={() => router.push('/(rider)/settings')}
          />
        </View>
        <Button
          variant={online ? 'outline' : 'primary'}
          size="md"
          label={online ? COPY.goOffline.en : COPY.goOnline.en}
          labelTa={online ? COPY.goOffline.ta : COPY.goOnline.ta}
          onPress={() => void toggleOnline()}
        />
      </View>
    </Screen>
  );
}
