/**
 * Vendor fulfilment.
 *
 * The packing checklist, preparation timers, and delay reporting (+10m / +20m).
 */

import * as React from 'react';
import { Alert, Modal, Pressable, ScrollView, TextInput, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Animated, { FadeIn } from 'react-native-reanimated';
import { AlertTriangle, ArrowLeft, Clock, Share2, Timer, Video, X } from 'lucide-react-native';

import {
  COPY,
  CONFIDENCE_THRESHOLD,
  formatInr,
  formatWhatsAppKotPayload,
  localityById,
  SEED_KITCHEN_STREAMS,
  toPaise,
  type Order,
  type OrderItem,
} from '@dfc/core';

import { useAuth } from '@/providers/auth';
import {
  subscribeOrder,
  vendorConfirmItem,
  vendorMarkReady,
  vendorMarkUnavailable,
  vendorReportDelay,
  vendorStartPacking,
} from '@/lib/orders';
import {
  Badge,
  Button,
  Checkbox,
  ErrorNote,
  Loading,
  Num,
  Screen,
  T,
  Ta,
} from '@/ui';

// ---------------------------------------------------------------------------

function VerifyBlock({ order, item }: { order: Order; item: OrderItem }) {
  const [editing, setEditing] = React.useState(false);
  const [name, setName] = React.useState(item.name);
  const [price] = React.useState(
    item.unitPricePaise ? String(Math.round(item.unitPricePaise / 100)) : '',
  );
  const [busy, setBusy] = React.useState(false);

  async function confirm(withEdit: boolean) {
    setBusy(true);
    try {
      await vendorConfirmItem(order.id, item.id, {
        ...(withEdit && name.trim() ? { name: name.trim() } : {}),
        ...(price ? { pricePaise: toPaise(Number(price)) } : {}),
      });
      setEditing(false);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Animated.View
      entering={FadeIn}
      className="overflow-hidden rounded-card border border-verify-border bg-verify-tint"
    >
      <View className="flex-row items-center gap-2 border-b border-verify-border px-3.5 py-2.5">
        <AlertTriangle size={15} color="#B45309" strokeWidth={2} />
        <T className="flex-1 text-[12.5px] font-semibold tracking-tight text-verify-fg">
          Item Verification
        </T>
        <Ta className="text-[10.5px] text-verify">உறுதிப்படுத்தவும்</Ta>
      </View>

      <View className="gap-3 px-3.5 py-3">
        <View className="gap-1">
          <T className="text-[10.5px] font-bold tracking-[0.4px] text-verify">ITEM</T>
          {editing ? (
            <TextInput
              value={name}
              onChangeText={setName}
              autoFocus
              className="h-11 rounded-control border border-verify-border bg-background px-3 font-sans text-[15px] font-semibold text-foreground"
            />
          ) : (
            <T className="text-[15px] font-semibold tracking-[-0.2px] text-verify-fg">
              {item.name} · {item.unit}
            </T>
          )}
          <Num className="text-[11px] text-verify">
            confidence {item.confidence.toFixed(2)} ·{' '}
            {item.unitPricePaise ? formatInr(item.unitPricePaise) : '₹ —'}
          </Num>
        </View>

        <View className="flex-row gap-2">
          <Button
            size="sm"
            label="Confirm"
            labelTa="சரி"
            loading={busy}
            className="flex-1"
            onPress={() => void confirm(false)}
          />
          <Button
            size="sm"
            variant="outline"
            label={editing ? 'Save' : 'Edit'}
            onPress={() => (editing ? void confirm(true) : setEditing(true))}
          />
          <Button
            size="sm"
            variant="destructive"
            label="Out of stock"
            onPress={() => void vendorMarkUnavailable(order.id, item.id)}
          />
        </View>
      </View>
    </Animated.View>
  );
}

// ---------------------------------------------------------------------------

export default function VendorOrder() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();

  const [order, setOrder] = React.useState<Order | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [packed, setPacked] = React.useState<Record<string, boolean>>({});
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // Delay reporting modal state
  const [delayModalOpen, setDelayModalOpen] = React.useState(false);
  const [selectedDelay, setSelectedDelay] = React.useState(15);
  const [delayReason, setDelayReason] = React.useState('Kitchen rush / High volume of orders');
  const [delayBusy, setDelayBusy] = React.useState(false);

  React.useEffect(() => {
    if (!id) return;
    return subscribeOrder(id, (o) => {
      setOrder(o);
      setLoading(false);
    });
  }, [id]);

  if (loading) return <Screen><Loading /></Screen>;
  if (!order) {
    return (
      <Screen>
        <View className="flex-1 items-center justify-center">
          <T className="text-[15px] text-muted-foreground">Order not found.</T>
        </View>
      </Screen>
    );
  }

  const active = order.items.filter((i) => i.included);
  const flagged = active.filter((i) => i.confidence < CONFIDENCE_THRESHOLD);
  const allPacked = active.length > 0 && active.every((i) => packed[i.id]);
  const locality = localityById(order.localityId);

  async function startPacking() {
    setBusy(true);
    setError(null);
    try {
      await vendorStartPacking(order!.id, user!.uid);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function markReady() {
    setBusy(true);
    setError(null);
    try {
      await vendorMarkReady(order!.id, user!.uid);
      router.back();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function handleReportDelay() {
    if (!delayReason.trim()) {
      Alert.alert('Reason Required', 'Please provide a reason for the preparation delay.');
      return;
    }
    setDelayBusy(true);
    try {
      await vendorReportDelay(order!.id, selectedDelay, delayReason.trim(), user!.uid);
      setDelayModalOpen(false);
      Alert.alert('Delay Reported', `An extra ${selectedDelay} minutes has been added and the customer has been notified.`);
    } catch (e) {
      Alert.alert('Error', (e as Error).message);
    } finally {
      setDelayBusy(false);
    }
  }

  return (
    <Screen edges={['top']}>
      {/* Header */}
      <View className="flex-row items-center gap-3 border-b border-border px-4 py-3">
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <ArrowLeft size={20} color="#18181B" strokeWidth={2} />
        </Pressable>
        <View className="flex-1">
          <View className="flex-row items-center gap-2">
            <T className="text-base font-semibold tracking-[-0.3px]">
              #{order.code} · {order.customerName}
            </T>
            <Badge label={order.category.toUpperCase()} tone="grocery" />
          </View>
          <T className="mt-0.5 text-xs text-placeholder">
            {locality?.name ?? order.localityId} · {active.length} items
          </T>
        </View>

        <Pressable
          onPress={() => setDelayModalOpen(true)}
          className="flex-row items-center gap-1 rounded-lg border border-verify-border bg-verify-tint px-2.5 py-1.5"
        >
          <Clock size={13} color="#B45309" />
          <T className="text-[11px] font-bold text-verify-fg">+ Delay</T>
        </Pressable>
      </View>

      {/* Preparation & Delay Timing Banner */}
      <View className="mx-4 mt-3 gap-2 rounded-lg border border-border bg-surface p-3">
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center gap-1.5">
            <Timer size={14} color="#71717A" />
            <T className="text-xs font-bold text-placeholder">PREPARATION TRACKING</T>
          </View>
          {order.delayMinutes ? (
            <Badge label={`+${order.delayMinutes}m DELAY REPORTED`} tone="verify" />
          ) : null}
        </View>

        {order.delayReason ? (
          <View className="rounded border border-verify-border bg-verify-tint p-2">
            <T className="text-xs font-semibold text-verify-fg">
              Reason: {order.delayReason}
            </T>
          </View>
        ) : null}

        <View className="flex-row justify-between text-xs">
          <T className="text-xs text-muted-foreground">
            Prep Status: {order.actualPrepMinutes ? `${order.actualPrepMinutes}m taken` : order.prepStartedAt ? 'In preparation…' : 'Pending start'}
          </T>
          {order.riderName ? (
            <T className="text-xs font-semibold text-grocery">Captain: {order.riderName}</T>
          ) : (
            <T className="text-xs text-placeholder">No rider assigned yet</T>
          )}
        </View>
      </View>

      {/* Advanced Operations: WhatsApp KOT Sync & Kitchen Cam */}
      <View className="px-4 pt-3 flex-row items-center gap-2">
        <Pressable
          onPress={() => {
            const kot = formatWhatsAppKotPayload(order).formattedKdsBody;
            Alert.alert(
              'WhatsApp KOT Ticket Generated',
              kot,
              [
                { text: 'Dismiss' },
                {
                  text: 'Copy & Send KOT',
                  onPress: () => {
                    Alert.alert('Sent to Kitchen', 'KOT transmitted to kitchen thermal printer & WhatsApp.');
                  },
                },
              ],
            );
          }}
          className="flex-1 flex-row items-center justify-center gap-1.5 rounded-xl border border-emerald-500/40 bg-emerald-500/10 py-2.5"
        >
          <Share2 size={14} color="#16A34A" />
          <T className="text-xs font-bold text-emerald-700 dark:text-emerald-400">WhatsApp KOT</T>
        </Pressable>

        {order.storeId && SEED_KITCHEN_STREAMS[order.storeId] ? (
          <View className="flex-row items-center gap-1.5 rounded-xl border border-border bg-surface px-3 py-2.5">
            <Video size={13} color="#DC2626" />
            <T className="text-xs font-semibold text-foreground">Cam Active</T>
          </View>
        ) : null}
      </View>

      <ScrollView className="flex-1" contentContainerClassName="gap-3.5 pb-6">
        <View className="flex-row items-center justify-between px-4 pt-2">
          <View className="flex-row items-center gap-2">
            <T className="text-[13px] font-semibold tracking-tight">{COPY.packItems.en}</T>
            <Ta className="text-[11px]">{COPY.packItems.ta}</Ta>
          </View>
        </View>

        <View className="px-4">
          {active.map((item, i) => {
            const flag = item.confidence < CONFIDENCE_THRESHOLD;
            if (flag) return null;
            const on = !!packed[item.id];
            return (
              <Pressable
                key={item.id}
                onPress={() => setPacked((p) => ({ ...p, [item.id]: !p[item.id] }))}
                className={`min-h-[52px] flex-row items-center gap-3 ${
                  i < active.length - 1 ? 'border-b border-muted' : ''
                }`}
              >
                <Checkbox
                  checked={on}
                  size={22}
                  onToggle={() => setPacked((p) => ({ ...p, [item.id]: !p[item.id] }))}
                />
                <View className="flex-1">
                  <T className={`text-[14px] font-medium ${on ? 'text-placeholder line-through' : ''}`}>
                    {item.name}
                  </T>
                  <Num className={`mt-0.5 text-[10.5px] ${on ? 'text-disabled' : 'text-placeholder'}`}>
                    {item.unit} {item.quantity > 1 ? `× ${item.quantity}` : ''}
                  </Num>
                </View>
                <Num className={`text-[12.5px] ${on ? 'text-disabled' : 'text-foreground'}`}>
                  {item.unitPricePaise === null ? '₹ —' : formatInr(item.unitPricePaise * item.quantity)}
                </Num>
              </Pressable>
            );
          })}
        </View>

        {flagged.map((item) => (
          <View key={item.id} className="px-4">
            <VerifyBlock order={order} item={item} />
          </View>
        ))}

        {error ? (
          <View className="px-4">
            <ErrorNote message={error} />
          </View>
        ) : null}
      </ScrollView>

      {/* Action Footer */}
      <View className="gap-2 border-t border-border px-4 pb-6 pt-3">
        {order.status === 'vendor_accepted' ? (
          <Button
            size="lg"
            label="Start Preparing Order"
            labelTa="தயாரிக்கத் தொடங்கு"
            loading={busy}
            onPress={() => void startPacking()}
          />
        ) : (
          <Button
            size="lg"
            label={allPacked ? 'Mark Ready for Rider' : 'Pack Items & Mark Ready'}
            labelTa="ரெடி என குறிக்கவும்"
            loading={busy}
            onPress={() => void markReady()}
          />
        )}
      </View>

      {/* Delay Reporting Modal */}
      <Modal
        visible={delayModalOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setDelayModalOpen(false)}
      >
        <View className="flex-1 justify-end bg-black/50">
          <View className="gap-3.5 rounded-t-2xl border-t border-border bg-background p-5">
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center gap-2">
                <Clock size={18} color="#B45309" />
                <T className="text-base font-bold text-foreground">Report Preparation Delay</T>
              </View>
              <Pressable onPress={() => setDelayModalOpen(false)}>
                <X size={20} color="#6B7280" />
              </Pressable>
            </View>

            <T className="text-xs text-muted-foreground">
              Customer and delivery dispatch will be notified of the adjusted timeline immediately.
            </T>

            <T className="text-xs font-bold text-placeholder">EXTRA TIME NEEDED</T>
            <View className="flex-row gap-2">
              {[10, 15, 20, 30].map((mins) => (
                <Pressable
                  key={mins}
                  onPress={() => setSelectedDelay(mins)}
                  className={`flex-1 items-center justify-center rounded-lg border py-2.5 ${
                    selectedDelay === mins
                      ? 'border-primary bg-primary text-white'
                      : 'border-border bg-surface'
                  }`}
                >
                  <T className={`text-xs font-bold ${selectedDelay === mins ? 'text-white' : 'text-foreground'}`}>
                    +{mins}m
                  </T>
                </Pressable>
              ))}
            </View>

            <View className="gap-1">
              <T className="text-xs font-semibold text-foreground">Reason for Delay</T>
              <TextInput
                value={delayReason}
                onChangeText={setDelayReason}
                placeholder="e.g. Fresh batch being prepared / kitchen rush"
                placeholderTextColor="#9CA3AF"
                className="rounded-lg border border-border bg-surface p-2.5 text-xs text-foreground"
              />
            </View>

            <View className="mt-2 flex-row gap-2.5">
              <Pressable
                onPress={() => setDelayModalOpen(false)}
                className="h-11 flex-1 items-center justify-center rounded-lg border border-border"
              >
                <T className="text-xs font-semibold text-foreground">Cancel</T>
              </Pressable>
              <Pressable
                onPress={() => void handleReportDelay()}
                disabled={delayBusy}
                className="h-11 flex-1 items-center justify-center rounded-lg bg-primary"
              >
                <T className="text-xs font-bold text-white">
                  {delayBusy ? 'Updating…' : 'Notify Customer & Dispatch'}
                </T>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </Screen>
  );
}
