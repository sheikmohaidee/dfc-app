/**
 * The rider's live task.
 *
 * Built for one thumb in daylight: the order type is the first thing on
 * screen and the only colour, the destination is 30px, and the current action
 * is a 70px black button. On a cash run the amount to collect is 54px white on
 * near-black, because getting that number wrong costs real money.
 */

import * as React from 'react';
import { Linking, Pressable, ScrollView, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Animated, { FadeIn } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { ArrowLeft, Banknote, Check, Phone, Pill, ShoppingBag } from 'lucide-react-native';

import {
  COPY,
  eventAt,
  formatInr,
  localityById,
  storeById,
  type Order,
  type OrderStatus,
  type Payment,
} from '@dfc/core';

import { useAuth } from '@/providers/auth';
import { riderAdvance, riderComplete, subscribeOrder } from '@/lib/orders';
import { collectCash, issueInvoice, startPayment, subscribePayment } from '@/lib/payments';
import { CashSheet } from '@/ui/cash-sheet';
import { LiveMap } from '@/ui/live-map';
import { useRiderTracking } from '@/hooks/useRiderTracking';
import { Button, Card, ErrorNote, Loading, Num, Screen, T, Ta } from '@/ui';

const clock = (ts: number | null) =>
  ts
    ? new Date(ts).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: false })
    : '';

/** Where the rider is along the leg, per status. */
const PROGRESS: Partial<Record<OrderStatus, number>> = {
  dispatched: 0.12,
  picked_up: 0.4,
  out_for_delivery: 0.78,
};

function DoneChip({ label, at }: { label: string; at: number | null }) {
  return (
    <View className="h-12 flex-row items-center justify-center gap-2 rounded-[9px] border border-border bg-background">
      <Check size={15} color="#16A34A" strokeWidth={3} />
      <T className="text-[13.5px] font-medium text-muted-foreground">{label}</T>
      {at ? <Num className="text-[11.5px] text-placeholder">{clock(at)}</Num> : null}
    </View>
  );
}

export default function RiderTask() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();

  const [order, setOrder] = React.useState<Order | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [otp, setOtp] = React.useState('');

  const [payment, setPayment] = React.useState<Payment | null>(null);

  // Report position while this task is live, so the customer sees movement.
  const tracking = useRiderTracking(user?.uid ?? null, !!order && !!id);

  React.useEffect(() => {
    if (!id) return;
    return subscribePayment(id, setPayment);
  }, [id]);

  React.useEffect(() => {
    if (!id) return;
    return subscribeOrder(id, (o) => {
      setOrder(o);
      setLoading(false);
    });
  }, [id]);

  if (loading) return <Screen><Loading /></Screen>;
  if (!order || !user) {
    return (
      <Screen>
        <View className="flex-1 items-center justify-center">
          <T className="text-[15px] text-muted-foreground">That task is gone.</T>
        </View>
      </Screen>
    );
  }

  const cod = order.paymentMode === 'cod';
  const store = storeById(order.storeId);
  const drop = localityById(order.localityId);
  const atDoor = order.status === 'out_for_delivery';

  async function advance(to: OrderStatus) {
    setBusy(true);
    setError(null);
    try {
      await riderAdvance(order!.id, to, user!.uid);
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  /**
   * Completing a delivery. For cash, the money is recorded *before* the order
   * closes — if the write order were reversed, a crash between them would show
   * an order delivered with no cash against it, which is the one reconciliation
   * bug nobody can untangle afterwards.
   */
  async function finish(tenderedPaise?: number) {
    setBusy(true);
    setError(null);
    try {
      if (cod) {
        const p = payment ?? (await startPayment(order!, 'cash'));
        await collectCash(p, user!.uid, tenderedPaise ?? order!.pricing.totalPaise);
      }
      await riderComplete(order!.id, user!.uid);
      // Best effort: a failed invoice must not block the rider's next job.
      void issueInvoice(order!.id).catch(() => {});
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace('/(rider)/queue');
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Screen edges={['top']}>
      {/* Order type — the first thing on screen, and the only colour. */}
      <View
        className={`flex-row items-center gap-2.5 px-4 py-3 ${cod ? 'bg-grocery' : 'bg-pharmacy'}`}
      >
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <ArrowLeft size={20} color="#FFFFFF" strokeWidth={2.2} />
        </Pressable>
        {cod ? (
          <ShoppingBag size={18} color="#FFFFFF" strokeWidth={2.2} />
        ) : (
          <Pill size={18} color="#FFFFFF" strokeWidth={2.2} />
        )}
        <View className="flex-1">
          <T
            style={{ fontSize: 13.5, fontWeight: '700', letterSpacing: 0.8 }}
            className="text-white"
          >
            {cod ? 'CASH ON DELIVERY · GROCERY' : 'PRE-PAID · PHARMACY'}
          </T>
          <Ta className="mt-0.5 text-[10.5px] text-white/75">
            {cod ? COPY.cod.ta : COPY.prepaid.ta}
          </Ta>
        </View>
        <Num className="text-sm font-semibold text-white">#{order.code}</Num>
      </View>

      <ScrollView className="flex-1" contentContainerClassName="pb-5">
        <LiveMap
          fromLocalityId={store?.localityId ?? order.localityId}
          toLocalityId={order.localityId}
          rider={tracking.position}
          progress={PROGRESS[order.status] ?? 0.2}
          minutes={14}
        />

        <View className="gap-4 px-4 pt-4">
          {/* Destination */}
          <View className="gap-1.5">
            <T
              style={{ fontSize: 10.5, fontWeight: '700', letterSpacing: 1.05 }}
              className="text-placeholder"
            >
              {atDoor ? `${COPY.drop.en} · ${COPY.drop.ta}` : `${COPY.pickup.en} · ${COPY.pickup.ta}`}
            </T>
            <T style={{ fontSize: 30, fontWeight: '700', letterSpacing: -1.05, lineHeight: 32 }}>
              {atDoor ? (drop?.name ?? 'Drop') : (store?.name ?? 'Store')}
            </T>
            <T className="text-[15px] leading-5 text-body-strong">
              {atDoor ? order.addressLine || 'Address on file' : (localityById(store?.localityId ?? '')?.name ?? '')}
            </T>
          </View>

          {/* Contact */}
          <Card className="flex-row items-center gap-3 p-3.5">
            <View className="size-[38px] items-center justify-center rounded-full bg-muted">
              <T className="text-[14px] font-semibold text-icon">
                {order.customerName.slice(0, 2).toUpperCase()}
              </T>
            </View>
            <View className="flex-1">
              <T className="text-base font-semibold tracking-[-0.24px]">{order.customerName}</T>
              <Num className="mt-0.5 text-[12.5px] text-muted-foreground">
                {order.customerPhone}
              </Num>
            </View>
            <Pressable
              onPress={() => void Linking.openURL(`tel:${order.customerPhone}`)}
              className="size-[52px] items-center justify-center rounded-full bg-grocery"
            >
              <Phone size={23} color="#FFFFFF" strokeWidth={2.1} />
            </Pressable>
          </Card>

          {/* Money */}
          {cod ? (
            <Animated.View entering={FadeIn} className="gap-1.5 rounded-generative bg-foreground p-5">
              <View className="flex-row items-center justify-between">
                <T
                  style={{ fontSize: 11, fontWeight: '700', letterSpacing: 1.3 }}
                  className="text-placeholder"
                >
                  {COPY.collectCash.en}
                </T>
                <Ta className="text-[11px] text-muted-foreground">{COPY.collectCash.ta}</Ta>
              </View>
              <Num
                style={{ fontSize: 54, fontWeight: '700', letterSpacing: -2.4, lineHeight: 58 }}
                className="text-white"
              >
                {formatInr(order.pricing.totalPaise)}
              </Num>
              <T className="mt-1 text-[12.5px] text-placeholder">
                {order.items.filter((i) => i.included).length} items · {COPY.exactChange.en}
              </T>
            </Animated.View>
          ) : (
            <View className="flex-row items-center gap-2.5 rounded-[10px] bg-muted px-3.5 py-3">
              <Banknote size={17} color="#71717A" strokeWidth={2} />
              <T className="flex-1 text-sm font-semibold text-body-strong">
                {COPY.nothingToCollect.en}
              </T>
              <T className="text-[12.5px] text-muted-foreground">
                Paid online · {formatInr(order.pricing.totalPaise)}
              </T>
            </View>
          )}

          {/* OTP at the door */}
          {atDoor ? (
            <Card className="gap-2.5 p-3.5">
              <View className="flex-row items-center gap-2">
                <T className="text-[12.5px] font-semibold tracking-tight">{COPY.deliveryOtp.en}</T>
                <Ta className="text-[11px]">{COPY.deliveryOtp.ta}</Ta>
              </View>
              <View className="flex-row gap-2.5">
                {[0, 1, 2, 3].map((i) => (
                  <Pressable
                    key={i}
                    onPress={() => setOtp(order.deliveryOtp.slice(0, i + 1))}
                    className={`h-14 flex-1 items-center justify-center rounded-[9px] border-[1.5px] ${
                      otp.length > i ? 'border-primary' : 'border-border'
                    }`}
                  >
                    <Num className="text-2xl font-semibold">{otp[i] ?? '—'}</Num>
                  </Pressable>
                ))}
              </View>
            </Card>
          ) : null}

          {error ? <ErrorNote message={error} /> : null}

          {/* Status buttons — done ones collapse, the live one is 70px. */}
          <View className="gap-2.5">
            {order.status !== 'dispatched' ? (
              <DoneChip label={COPY.arrivedAtStore.en} at={eventAt(order, 'dispatched')} />
            ) : null}
            {['out_for_delivery', 'delivered'].includes(order.status) ? (
              <DoneChip label={COPY.pickedUp.en} at={eventAt(order, 'picked_up')} />
            ) : null}

            {order.status === 'dispatched' ? (
              <Button
                size="rider"
                label={COPY.pickedUp.en}
                labelTa={COPY.pickedUp.ta}
                loading={busy}
                onPress={() => void advance('picked_up')}
              />
            ) : null}

            {order.status === 'picked_up' ? (
              <Button
                size="rider"
                label={COPY.outForDelivery.en}
                labelTa={COPY.outForDelivery.ta}
                loading={busy}
                onPress={() => void advance('out_for_delivery')}
              />
            ) : null}

            {atDoor ? (
              <>
                {otp.length < 4 ? (
                  <T className="text-center text-[11.5px] text-placeholder">
                    Enter the customer&apos;s 4-digit code to finish.
                  </T>
                ) : cod ? (
                  <CashSheet
                    amountPaise={order.pricing.totalPaise}
                    busy={busy}
                    onCollect={(tendered) => void finish(tendered)}
                  />
                ) : (
                  <Button
                    size="rider"
                    label={COPY.markDelivered.en}
                    labelTa={COPY.markDelivered.ta}
                    loading={busy}
                    onPress={() => void finish()}
                  />
                )}
              </>
            ) : null}

            <Pressable className="h-11 items-center justify-center">
              <T className="text-sm font-medium text-destructive">{COPY.reportProblem.en}</T>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </Screen>
  );
}
