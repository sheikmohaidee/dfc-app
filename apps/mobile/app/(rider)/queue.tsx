/**
 * Rider queue.
 *
 * Displays active task card, daily earnings, online/offline toggle, and
 * cancellation limit status banner (>2 cancellations lockout).
 */

import * as React from 'react';
import { Alert, Pressable, ScrollView, View } from 'react-native';
import { useRouter } from 'expo-router';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { ChevronRight, CloudRain, IndianRupee, Moon, Settings, ShieldAlert, ShoppingBag } from 'lucide-react-native';

import {
  COPY,
  STATUS_LABEL,
  formatInr,
  localityById,
  routeKm,
  storeById,
  type Order,
  type Rider,
} from '@dfc/core';

import { useAuth } from '@/providers/auth';
import { usePlatformStatus } from '@/hooks/usePlatformStatus';
import { setRiderOnline, subscribeRiderProfile, subscribeRiderTasks } from '@/lib/orders';
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
          <View className="flex-row items-center gap-2.5 bg-primary px-3.5 py-2.5">
            <ShoppingBag size={15} color="#FFFFFF" strokeWidth={2.2} />
            <T
              style={{ fontSize: 11.5, fontWeight: '700', letterSpacing: 0.7 }}
              className="flex-1 text-white"
            >
              {order.category.toUpperCase()} · {cod ? 'CASH ON DELIVERY' : 'PRE-PAID'}
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
                  <Badge label="PREPAID" tone="neutral" />
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

  const [activeTask, setActiveTask] = React.useState<Order | null>(null);
  const [history, setHistory] = React.useState<Order[]>([]);
  const [rider, setRider] = React.useState<Rider | null>(null);
  const [loading, setLoading] = React.useState(true);
  const platform = usePlatformStatus();

  React.useEffect(() => {
    if (!user?.uid) return;
    const unsubRider = subscribeRiderProfile(user.uid, (r) => {
      setRider(r);
    });
    const unsubTasks = subscribeRiderTasks(user.uid, (act, hist) => {
      setActiveTask(act);
      setHistory(hist);
      setLoading(false);
    });
    return () => {
      unsubRider();
      unsubTasks();
    };
  }, [user]);

  const strikes = rider?.cancellationsToday ?? 0;
  const isLockedOut = Boolean(rider?.isOfflineDueToCancellations || strikes > 2);
  const online = Boolean(rider?.isOnline && !isLockedOut);

  async function toggleOnline() {
    if (!user) return;
    if (isLockedOut) {
      Alert.alert(
        'Account Locked (Offline)',
        'You have cancelled more than 2 orders today. Please contact Admin with an explanation to reactivate your account.',
      );
      return;
    }
    const next = !online;
    try {
      await setRiderOnline(user.uid, next);
    } catch (e) {
      Alert.alert('Error', (e as Error).message);
    }
  }

  if (loading) return <Screen><Loading /></Screen>;

  const earned = history.reduce((s, o) => s + (o.pricing.deliveryPaise || 0), 0);

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
            <View className="flex-row items-center gap-2">
              <T className="text-[15px] font-semibold tracking-[-0.2px]">
                {profile?.name ?? 'Captain'}
              </T>
              {isLockedOut ? (
                <Badge label="LIMIT EXCEEDED" tone="destructive" />
              ) : strikes > 0 ? (
                <Badge label={`${strikes}/2 CANCELS`} tone="verify" />
              ) : (
                <Badge label="0/2 CANCELS" tone="grocery" />
              )}
            </View>
            <T className="mt-0.5 text-[11px] text-placeholder">
              {localityById(profile?.localityId)?.name ?? 'Madurai'} · DFC Captain
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

        {/* Lockout Banner */}
        {isLockedOut ? (
          <View className="mx-4 mb-3 gap-1.5 rounded-lg border border-destructive-border bg-destructive-tint p-3">
            <View className="flex-row items-center gap-2">
              <ShieldAlert size={16} color="#DC2626" />
              <T className="text-xs font-bold text-destructive-fg">
                Account Locked to Offline ({strikes} cancellations today)
              </T>
            </View>
            <T className="text-[11.5px] leading-relaxed text-destructive-fg">
              You exceeded the maximum 2 allowed order cancellations. Admin must review your explanation and reactivate your account.
            </T>
            {rider?.explanationGiven ? (
              <T className="text-[11px] italic text-destructive-fg">
                Explanation logged: “{rider.explanationGiven}”
              </T>
            ) : null}
          </View>
        ) : null}

        <View className="flex-row border-t border-muted">
          {[
            { v: activeTask ? '1' : '0', l: 'Active' },
            { v: formatInr(earned), l: 'Earnings today' },
            { v: String(history.length), l: 'Completed' },
          ].map((s) => (
            <View key={s.l} className="flex-1 gap-0.5 px-4 py-2.5">
              <Num className="text-[15px] font-semibold tracking-tight">{s.v}</Num>
              <T className="text-[10.5px] text-placeholder">{s.l}</T>
            </View>
          ))}
        </View>
      </View>

      <ScrollView className="flex-1 bg-surface" contentContainerClassName="gap-3 px-4 py-4">
        {platform.status === 'sleep' ? (
          <View className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3.5 gap-1.5">
            <View className="flex-row items-center gap-2">
              <Moon size={15} color="#F59E0B" />
              <T className="text-xs font-bold text-amber-500">Night Curfew · இரவு ஓய்வு</T>
            </View>
            <T className="text-[11.5px] leading-relaxed text-zinc-300">
              Dispatch is resting for the night. First morning breakfast drop runs begin at {platform.nextOpenTime ?? '6:00 AM'}.
            </T>
          </View>
        ) : null}

        {platform.rainSurge.active ? (
          <View className="rounded-xl border border-blue-500/30 bg-blue-500/10 p-3.5 gap-1.5">
            <View className="flex-row items-center gap-2">
              <CloudRain size={15} color="#60A5FA" />
              <T className="text-xs font-bold text-blue-400">
                Monsoon Rain Safety Bonus Active
              </T>
            </View>
            <T className="text-[11.5px] leading-relaxed text-zinc-300">
              Earn an extra ₹{Math.round(platform.rainSurge.riderSafetyBonusPaise / 100)} per delivery order during heavy rains. Ride safely!
            </T>
          </View>
        ) : null}

        {!activeTask ? (
          <View className="pt-16">
            <Empty
              title={online ? COPY.noTasks.en : isLockedOut ? 'Account Offline (Limit Exceeded)' : 'You are offline'}
              subtitle={
                online
                  ? 'Stay online — the next Madurai run will land here.'
                  : isLockedOut
                    ? 'Wait for admin review & reactivation.'
                    : 'Go online to start receiving deliveries.'
              }
            />
            <Ta className="mt-2 text-center text-[13px]">{COPY.noTasks.ta}</Ta>
          </View>
        ) : (
          <TaskCard
            order={activeTask}
            onPress={() => router.push(`/(rider)/task/${activeTask.id}`)}
          />
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
        {!isLockedOut ? (
          <Button
            variant={online ? 'outline' : 'primary'}
            size="md"
            label={online ? COPY.goOffline.en : COPY.goOnline.en}
            labelTa={online ? COPY.goOffline.ta : COPY.goOnline.ta}
            onPress={() => void toggleOnline()}
          />
        ) : null}
      </View>
    </Screen>
  );
}
