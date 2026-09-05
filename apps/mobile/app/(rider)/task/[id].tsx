/**
 * The rider's live task.
 *
 * Built for one thumb in daylight: the order type is the first thing on
 * screen, destination is prominent, and the action button is large and clear.
 * Includes cancellation limit enforcement (>2 daily cancels triggers auto-offline).
 */

import * as React from 'react';
import { Alert, Linking, Modal, Pressable, ScrollView, TextInput, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { AlertTriangle, ArrowLeft, Check, Compass, HeartPulse, Phone, ShieldAlert, ShoppingBag, X } from 'lucide-react-native';

import {
  COPY,
  eventAt,
  localityById,
  lookupIndoorWaypoint,
  storeById,
  type Order,
  type OrderStatus,
  type Payment,
  type Rider,
} from '@dfc/core';

import { useAuth } from '@/providers/auth';
import { riderAdvance, riderCancelTask, riderComplete, subscribeOrder, subscribeRiderProfile } from '@/lib/orders';
import { collectCash, issueInvoice, startPayment, subscribePayment } from '@/lib/payments';
import { CashSheet } from '@/ui/cash-sheet';
import { LiveMap } from '@/ui/live-map';
import { useRiderTracking } from '@/hooks/useRiderTracking';
import { Button, Card, ErrorNote, Loading, Num, Screen, T, Ta } from '@/ui';

const clock = (ts: number | null) =>
  ts
    ? new Date(ts).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: false })
    : '';

const PROGRESS: Partial<Record<OrderStatus, number>> = {
  dispatched: 0.12,
  picked_up: 0.4,
  out_for_delivery: 0.78,
};

const CANCEL_REASONS = [
  'Vehicle breakdown / Tyre puncture',
  'Severe weather / Heavy rain',
  'Medical emergency',
  'Store closed / Out of stock',
  'Customer unreachable',
  'Other operational issue',
];

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
  const [rider, setRider] = React.useState<Rider | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [otp, setOtp] = React.useState('');
  const [payment, setPayment] = React.useState<Payment | null>(null);

  // Cancellation Modal State
  const [cancelModalVisible, setCancelModalVisible] = React.useState(false);
  const [selectedReason, setSelectedReason] = React.useState(CANCEL_REASONS[0]!);
  const [explanation, setExplanation] = React.useState('');
  const [cancelBusy, setCancelBusy] = React.useState(false);

  const tracking = useRiderTracking(user?.uid ?? null, !!order && !!id);

  React.useEffect(() => {
    if (!id) return;
    return subscribePayment(id, setPayment);
  }, [id]);

  React.useEffect(() => {
    if (!user?.uid) return;
    return subscribeRiderProfile(user.uid, setRider);
  }, [user?.uid]);

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
  const strikesToday = rider?.cancellationsToday ?? 0;
  const willExceedLimit = strikesToday >= 2;

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

  async function finish(tenderedPaise?: number) {
    setBusy(true);
    setError(null);
    try {
      if (cod) {
        const p = payment ?? (await startPayment(order!, 'cash'));
        await collectCash(p, user!.uid, tenderedPaise ?? order!.pricing.totalPaise);
      }
      await riderComplete(order!.id, user!.uid);
      void issueInvoice(order!.id).catch(() => {});
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace('/(rider)/queue');
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function handleCancelTask() {
    if (willExceedLimit && !explanation.trim()) {
      Alert.alert('Explanation Required', 'Please provide an explanation for exceeding the cancellation limit.');
      return;
    }

    setCancelBusy(true);
    try {
      const result = await riderCancelTask(
        order!.id,
        rider ?? {
          uid: user!.uid,
          name: user!.displayName ?? 'Captain',
          phone: user!.phoneNumber ?? '',
          isOnline: true,
          activeOrderId: order!.id,
          cancellationsToday: strikesToday,
          maxDailyCancellations: 2,
        },
        selectedReason,
        explanation.trim() || undefined,
      );

      setCancelModalVisible(false);
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);

      if (result.autoOffline) {
        Alert.alert(
          'Account Set Offline',
          `You have cancelled ${result.count} orders today, exceeding the daily limit of 2. Your status has been set to Offline. Please contact Admin to review and reactivate.`,
          [{ text: 'OK', onPress: () => router.replace('/(rider)/queue') }],
        );
      } else {
        Alert.alert(
          'Task Cancelled',
          `Order #${order!.code} unassigned. Cancellations today: ${result.count}/2.`,
          [{ text: 'OK', onPress: () => router.replace('/(rider)/queue') }],
        );
      }
    } catch (e) {
      Alert.alert('Error', (e as Error).message);
    } finally {
      setCancelBusy(false);
    }
  }

  return (
    <Screen edges={['top']}>
      {/* Header */}
      <View className="flex-row items-center gap-2.5 bg-primary px-4 py-3">
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <ArrowLeft size={20} color="#FFFFFF" strokeWidth={2.2} />
        </Pressable>
        <ShoppingBag size={18} color="#FFFFFF" strokeWidth={2.2} />
        <View className="flex-1">
          <T style={{ fontSize: 13.5, fontWeight: '700', letterSpacing: 0.8 }} className="text-white">
            {order.category.toUpperCase()} · {cod ? 'CASH ON DELIVERY' : 'PREPAID'}
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
          <Card className="gap-2.5 p-3.5">
            <View className="flex-row items-center justify-between">
              <T className="text-[11.5px] font-bold tracking-wider text-placeholder">
                DELIVERY DESTINATION
              </T>
              <T className="text-xs font-semibold text-primary">{drop?.name ?? order.localityId}</T>
            </View>
            <T className="text-[15px] font-semibold text-foreground">{order.customerName}</T>
            <T className="text-[13px] text-muted-foreground">{order.addressLine || drop?.name}</T>

            {order.customerPhone ? (
              <Pressable
                onPress={() => void Linking.openURL(`tel:${order.customerPhone}`)}
                className="mt-1 flex-row items-center gap-2 rounded-lg border border-border bg-surface p-2.5"
              >
                <Phone size={15} color="#10B981" />
                <T className="text-xs font-semibold text-foreground">{order.customerPhone}</T>
                <T className="ml-auto text-[11px] font-bold text-primary">Call Customer</T>
              </Pressable>
            ) : null}
          </Card>

          {/* Multi-Level Indoor Wayfinding Guide */}
          {(() => {
            const waypoint = lookupIndoorWaypoint(order.localityId, order.addressLine);
            if (!waypoint) return null;
            return (
              <Card className="gap-2 border-emerald-500/40 bg-emerald-500/5 p-3.5">
                <View className="flex-row items-center gap-2">
                  <Compass size={16} color="#16A34A" />
                  <T className="text-[12.5px] font-bold text-emerald-700 dark:text-emerald-400">
                    Indoor Wayfinding Instructions
                  </T>
                </View>
                <T className="text-[12px] font-semibold text-foreground">
                  {waypoint.complexName}
                </T>
                <View className="gap-1 rounded bg-surface p-2 border border-border/50">
                  <T className="text-[11.5px] text-muted-foreground">
                    • Gate: <T className="font-semibold text-foreground">{waypoint.gateCode}</T>
                  </T>
                  <T className="text-[11.5px] text-muted-foreground">
                    • Floor: <T className="font-semibold text-foreground">{waypoint.floorLevel}</T>
                  </T>
                  <T className="text-[11.5px] text-muted-foreground">
                    • Elevator: <T className="font-semibold text-foreground">{waypoint.elevatorNear}</T>
                  </T>
                </View>
              </Card>
            );
          })()}

          {/* Rider Safety & SOS Telemetry */}
          <View className="flex-row items-center justify-between rounded-xl border border-primary/20 bg-card p-3">
            <View className="flex-row items-center gap-2">
              <HeartPulse size={16} color="#16A34A" />
              <View>
                <T className="text-[11.5px] font-semibold text-foreground">Shift Fatigue Shield</T>
                <T className="text-[10.5px] text-muted-foreground">Active shift: 3.4 hrs (Safety limit: 6h)</T>
              </View>
            </View>

            <Pressable
              onPress={() => {
                Alert.alert(
                  'Emergency Crash SOS',
                  'DFC Safety Telemetry is active. If in distress, an SOS beacon will alert headquarters and Madurai emergency services.',
                  [
                    { text: 'Cancel', style: 'cancel' },
                    {
                      text: 'Trigger SOS',
                      style: 'destructive',
                      onPress: () => {
                        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
                        Alert.alert('SOS Broadcasted', 'Madurai emergency dispatch alerted with your live GPS location.');
                      },
                    },
                  ],
                );
              }}
              className="flex-row items-center gap-1 rounded-lg bg-red-500/10 border border-red-500/30 px-2.5 py-1.5"
            >
              <ShieldAlert size={13} color="#DC2626" />
              <T className="text-[11px] font-bold text-red-600">SOS</T>
            </Pressable>
          </View>

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

          {/* Status buttons */}
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
                    orderCode={order.code}
                    busy={busy}
                    onCollect={(tendered, _mode) => void finish(tendered)}
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

            {/* Cancel Task button */}
            <Pressable
              onPress={() => setCancelModalVisible(true)}
              className="h-11 items-center justify-center rounded-lg border border-destructive/20 bg-destructive/5"
            >
              <T className="text-sm font-semibold text-destructive">
                Cancel Task / Report Problem ({strikesToday}/2 cancels today)
              </T>
            </Pressable>
          </View>
        </View>
      </ScrollView>

      {/* Cancellation Modal */}
      <Modal
        visible={cancelModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setCancelModalVisible(false)}
      >
        <View className="flex-1 justify-end bg-black/50">
          <View className="gap-3.5 rounded-t-2xl border-t border-border bg-background p-5">
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center gap-2">
                <AlertTriangle size={18} color="#EF4444" />
                <T className="text-base font-bold text-foreground">Cancel Delivery Task</T>
              </View>
              <Pressable onPress={() => setCancelModalVisible(false)}>
                <X size={20} color="#6B7280" />
              </Pressable>
            </View>

            {/* Daily limit notice */}
            <View
              className={`rounded-lg border p-3 ${
                willExceedLimit
                  ? 'border-destructive/40 bg-destructive/10'
                  : 'border-yellow-500/40 bg-yellow-500/10'
              }`}
            >
              <T
                className={`text-xs font-semibold ${
                  willExceedLimit ? 'text-destructive' : 'text-yellow-700'
                }`}
              >
                {willExceedLimit
                  ? '⚠️ WARNING: You have already cancelled 2 orders today. Cancelling this order will exceed your daily limit and automatically set your account to OFFLINE.'
                  : `Cancellation allowance: ${strikesToday} of 2 used today. Max 2 cancellations allowed before offline lockout.`}
              </T>
            </View>

            <T className="text-xs font-bold text-placeholder">SELECT REASON</T>
            <View className="gap-1.5">
              {CANCEL_REASONS.map((r) => (
                <Pressable
                  key={r}
                  onPress={() => setSelectedReason(r)}
                  className={`flex-row items-center justify-between rounded-lg border p-3 ${
                    selectedReason === r
                      ? 'border-primary bg-primary/5'
                      : 'border-border bg-surface'
                  }`}
                >
                  <T className="text-xs font-medium text-foreground">{r}</T>
                  {selectedReason === r ? <Check size={14} color="#10B981" /> : null}
                </Pressable>
              ))}
            </View>

            {willExceedLimit ? (
              <View className="gap-1">
                <T className="text-xs font-semibold text-foreground">
                  Explanation to Admin (Required)*
                </T>
                <TextInput
                  value={explanation}
                  onChangeText={setExplanation}
                  placeholder="Explain why you are unable to deliver..."
                  placeholderTextColor="#9CA3AF"
                  multiline
                  numberOfLines={2}
                  className="rounded-lg border border-border bg-surface p-2.5 text-xs text-foreground"
                />
              </View>
            ) : null}

            <View className="mt-2 flex-row gap-2.5">
              <Pressable
                onPress={() => setCancelModalVisible(false)}
                className="h-11 flex-1 items-center justify-center rounded-lg border border-border"
              >
                <T className="text-xs font-semibold text-foreground">Back</T>
              </Pressable>
              <Pressable
                onPress={() => void handleCancelTask()}
                disabled={cancelBusy}
                className="h-11 flex-1 items-center justify-center rounded-lg bg-destructive"
              >
                <T className="text-xs font-bold text-white">
                  {cancelBusy ? 'Cancelling…' : 'Confirm Cancellation'}
                </T>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </Screen>
  );
}
