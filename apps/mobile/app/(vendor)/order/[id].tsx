/**
 * Vendor fulfilment.
 *
 * The packing checklist, plus the step the whole AI flow depends on: a human
 * resolving whatever the model was unsure of. The pharmacist sees the model's
 * reading and its confidence, then confirms, substitutes or refuses. Confirming
 * clears the VERIFY chip everywhere at once.
 */

import * as React from 'react';
import { Pressable, ScrollView, TextInput, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Animated, { FadeIn } from 'react-native-reanimated';
import { AlertTriangle, ArrowLeft, Check, Clock, MapPin } from 'lucide-react-native';

import {
  COPY,
  CONFIDENCE_THRESHOLD,
  formatInr,
  localityById,
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
  vendorStartPacking,
} from '@/lib/orders';
import {
  Badge,
  Button,
  Checkbox,
  Divider,
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
  const [price, setPrice] = React.useState(
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
          {COPY.pharmacistConfirmation.en}
        </T>
        <Ta className="text-[10.5px] text-verify">{COPY.pharmacistConfirmation.ta}</Ta>
      </View>

      <View className="gap-3 px-3.5 py-3">
        <View className="gap-1">
          <T className="text-[10.5px] font-bold tracking-[0.4px] text-verify">AI READ</T>
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

        <View className="flex-row items-center gap-2.5">
          <T className="text-[11.5px] text-verify-fg">Price</T>
          <View className="h-10 flex-1 flex-row items-center overflow-hidden rounded-control border border-verify-border bg-background">
            <View className="h-full w-8 items-center justify-center border-r border-verify-border bg-surface">
              <Num className="text-[13px] text-muted-foreground">₹</Num>
            </View>
            <TextInput
              value={price}
              onChangeText={(v) => setPrice(v.replace(/[^\d]/g, ''))}
              keyboardType="number-pad"
              placeholder="—"
              placeholderTextColor="#B45309"
              className="h-full flex-1 px-3 font-mono text-[15px] font-semibold text-foreground"
            />
          </View>
        </View>

        <View className="gap-2">
          <Button
            size="md"
            label={
              editing
                ? 'Save and confirm'
                : `${COPY.thatsCorrect.en}${price ? ` · ₹${price}` : ''}`
            }
            loading={busy}
            onPress={() => void confirm(editing)}
          />
          <View className="flex-row gap-2">
            <Button
              variant="outline"
              size="sm"
              label={COPY.differentMedicine.en}
              className="flex-1"
              onPress={() => setEditing(true)}
            />
            <Button
              variant="outline"
              size="sm"
              label={COPY.notAvailable.en}
              className="flex-1"
              disabled={busy}
              onPress={() => void vendorMarkUnavailable(order.id, item.id)}
            />
          </View>
        </View>
      </View>
    </Animated.View>
  );
}

// ---------------------------------------------------------------------------

export default function VendorFulfil() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();

  const [order, setOrder] = React.useState<Order | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [packed, setPacked] = React.useState<Record<string, boolean>>({});
  const [error, setError] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);

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
          <T className="text-[15px] text-muted-foreground">That order is gone.</T>
        </View>
      </Screen>
    );
  }

  const active = order.items.filter((i) => i.included);
  const flagged = active.filter((i) => i.confidence < CONFIDENCE_THRESHOLD);
  const packedCount = active.filter((i) => packed[i.id]).length;
  const allPacked = packedCount === active.length && active.length > 0;
  const canFinish = allPacked && flagged.length === 0;
  const locality = localityById(order.localityId);

  async function finish() {
    if (!user || !order) return;
    setBusy(true);
    setError(null);
    try {
      if (order.status === 'vendor_accepted') await vendorStartPacking(order.id, user.uid);
      await vendorMarkReady(order.id, user.uid);
      router.back();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Screen>
      <View className="flex-row items-center gap-2.5 border-b border-muted px-4 pb-3 pt-2">
        <Pressable onPress={() => router.back()} hitSlop={12} className="-ml-2 size-9 items-center justify-center">
          <ArrowLeft size={21} color="#18181B" strokeWidth={2} />
        </Pressable>
        <View className="flex-1 flex-row items-center gap-2">
          <Num className="text-[15px] font-semibold tracking-tight">#{order.code}</Num>
          <Badge
            label={`${order.paymentMode === 'prepaid' ? 'PREPAID' : 'COD'} ${formatInr(order.pricing.totalPaise)}`}
            tone={order.paymentMode === 'prepaid' ? 'pharmacy' : 'grocery'}
          />
        </View>
        <View className="flex-row items-center gap-1.5 rounded-segment border border-border px-2.5 py-1.5">
          <Clock size={13} color="#71717A" strokeWidth={2} />
          <Num className="text-xs font-medium">4:12</Num>
        </View>
      </View>

      {/* Step rail */}
      <View className="flex-row items-center border-b border-muted px-4 py-3.5">
        {[
          { label: 'Accepted', done: true },
          { label: 'Packing', done: false, current: true },
          { label: 'Ready', done: false },
        ].map((s, i, arr) => (
          <React.Fragment key={s.label}>
            <View className="flex-row items-center gap-1.5">
              <View
                className={`size-[18px] items-center justify-center rounded-full ${
                  s.done ? 'bg-grocery' : s.current ? 'bg-primary' : 'border-[1.5px] border-border'
                }`}
              >
                {s.done ? <Check size={11} color="#FFFFFF" strokeWidth={3.6} /> : null}
                {s.current ? <View className="size-1.5 rounded-full bg-white" /> : null}
              </View>
              <T
                className={`text-xs ${
                  s.current ? 'font-semibold' : s.done ? 'text-body-strong' : 'text-placeholder'
                }`}
              >
                {s.label}
              </T>
            </View>
            {i < arr.length - 1 ? <View className="mx-2.5 h-[1.5px] flex-1 bg-border" /> : null}
          </React.Fragment>
        ))}
      </View>

      <ScrollView className="flex-1" contentContainerClassName="gap-3.5 pb-6">
        <View className="flex-row items-center justify-between px-4 pt-3.5">
          <View className="flex-row items-center gap-2">
            <T className="text-[13px] font-semibold tracking-tight">{COPY.packItems.en}</T>
            <Ta className="text-[11px]">{COPY.packItems.ta}</Ta>
          </View>
          <Num className="text-[11.5px] text-muted-foreground">
            {packedCount} / {active.length}
          </Num>
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
                  <T
                    className={`text-[14px] font-medium ${
                      on ? 'text-placeholder line-through' : ''
                    }`}
                  >
                    {item.name}
                  </T>
                  <Num className={`mt-0.5 text-[10.5px] ${on ? 'text-disabled' : 'text-placeholder'}`}>
                    {item.unit}
                    {item.quantity > 1 ? ` × ${item.quantity}` : ''}
                  </Num>

                  {/* Where the words came from.
                      A pharmacist reads this list and dispenses against it, so
                      they must be able to tell a line the model read off the
                      prescription from a line the customer typed themselves.
                      For a medicine that difference is the whole question of
                      what the prescription actually says — and the photograph,
                      which is immutable, is still the thing to check against. */}
                  {item.addedByCustomer || item.editedByCustomer ? (
                    <View className="mt-1 flex-row items-center gap-1.5">
                      <Badge
                        label={item.addedByCustomer ? 'CUSTOMER ADDED' : 'CUSTOMER EDITED'}
                        tone="verify"
                      />
                      {item.readAs ? (
                        <Num className="text-[10px] italic text-placeholder" numberOfLines={1}>
                          paper: {item.readAs}
                        </Num>
                      ) : null}
                    </View>
                  ) : item.readAs ? (
                    <Num className="mt-0.5 text-[10px] italic text-placeholder" numberOfLines={1}>
                      paper: {item.readAs}
                    </Num>
                  ) : null}
                </View>
                <Num className={`text-[12.5px] ${on ? 'text-disabled' : 'text-foreground'}`}>
                  {item.unitPricePaise === null
                    ? '₹ —'
                    : formatInr(item.unitPricePaise * item.quantity)}
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

      <View className="gap-2.5 border-t border-border bg-background px-4 pb-5 pt-3">
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center gap-1.5">
            <MapPin size={14} color="#71717A" strokeWidth={2} />
            <T className="text-xs text-muted-foreground">
              {order.customerName} · {locality?.name}
            </T>
          </View>
          <Num className="text-xs text-placeholder">
            {packedCount} / {active.length} packed
          </Num>
        </View>
        <Button
          size="rider"
          label={COPY.markReady.en}
          labelTa={COPY.markReady.ta}
          disabled={!canFinish}
          loading={busy}
          onPress={() => void finish()}
        />
        {!canFinish && flagged.length > 0 ? (
          <T className="text-center text-[11px] text-verify">
            Confirm the flagged item before marking this ready.
          </T>
        ) : null}
      </View>

      <Divider className="hidden" />
    </Screen>
  );
}
