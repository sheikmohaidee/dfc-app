/**
 * Order tracking.
 *
 * A progress rail, the live status, and the delivery OTP the rider will ask
 * for at the door. Nothing else — this screen is checked at a glance while
 * waiting, usually with one hand.
 */

import * as React from 'react';
import { Alert, Pressable, ScrollView, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Animated, { FadeIn } from 'react-native-reanimated';
import { ArrowLeft, Check, Phone } from 'lucide-react-native';

import {
  COPY,
  STATUS_LABEL,
  etaMinutes,
  formatInr,
  isTerminal,
  localityById,
  nextStatuses,
  storeById,
  type Order,
  type OrderStatus,
} from '@dfc/core';

import { cancelOrder, subscribeOrder } from '@/lib/orders';
import { useAuth } from '@/providers/auth';
import { subscribeRiderPosition } from '@/lib/riders';
import { LiveMap } from '@/ui/live-map';
import { Status3D } from '@/ui/status-3d';
import { AuroraField } from '@/ui/glass';
import { Badge, Button, Card, Divider, Loading, Money, Num, Screen, T, Ta } from '@/ui';

/** The five beats a customer actually cares about. */
const RAIL: { status: OrderStatus; en: string; ta: string }[] = [
  { status: 'paid', en: 'Confirmed', ta: 'உறுதி செய்யப்பட்டது' },
  { status: 'vendor_accepted', en: 'Store accepted', ta: 'கடை ஏற்றுக்கொண்டது' },
  { status: 'ready_for_pickup', en: 'Ready', ta: 'தயார்' },
  { status: 'out_for_delivery', en: 'On the way', ta: 'வழியில்' },
  { status: 'delivered', en: 'Delivered', ta: 'வழங்கப்பட்டது' },
];

const ORDER_OF: OrderStatus[] = [
  'incoming',
  'admin_review',
  'awaiting_payment',
  'paid',
  'vendor_accepted',
  'packing',
  'ready_for_pickup',
  'dispatched',
  'picked_up',
  'out_for_delivery',
  'delivered',
];

const reached = (current: OrderStatus, target: OrderStatus) =>
  ORDER_OF.indexOf(current) >= ORDER_OF.indexOf(target);

export default function TrackOrder() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [order, setOrder] = React.useState<Order | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [riderAt, setRiderAt] = React.useState<{ lat: number; lng: number } | null>(null);
  const [cancelling, setCancelling] = React.useState(false);
  const { user } = useAuth();

  React.useEffect(() => {
    if (!id) return;
    return subscribeOrder(id, (o) => {
      setOrder(o);
      setLoading(false);
    });
  }, [id]);

  // Watch the rider only while there is something to watch.
  React.useEffect(() => {
    if (!order?.riderUid) return;
    if (!['dispatched', 'picked_up', 'out_for_delivery'].includes(order.status)) return;
    return subscribeRiderPosition(order.riderUid, setRiderAt);
  }, [order?.riderUid, order?.status]);

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

  const locality = localityById(order.localityId);
  const eta = etaMinutes(order);
  const done = isTerminal(order.status);

  // Free to cancel right up until a shop commits stock to it.
  const canCancel =
    !done &&
    nextStatuses(order.status, 'customer').includes('cancelled') &&
    ['incoming', 'admin_review', 'awaiting_payment', 'paid'].includes(order.status);

  return (
    <Screen>
      <View className="flex-row items-center gap-2.5 border-b border-muted px-4 pb-3 pt-2">
        <Pressable onPress={() => router.back()} hitSlop={12} className="size-9 items-center justify-center -ml-2">
          <ArrowLeft size={21} color="#18181B" strokeWidth={2} />
        </Pressable>
        <View className="flex-1 flex-row items-center gap-2">
          <Num className="text-[15px] font-semibold tracking-tight">#{order.code}</Num>
          <Badge
            label={order.paymentMode === 'prepaid' ? 'PREPAID' : 'COD'}
            tone={order.paymentMode === 'prepaid' ? 'pharmacy' : 'grocery'}
          />
        </View>
        <Money paise={order.pricing.totalPaise} size={15} />
      </View>

      <ScrollView className="flex-1" contentContainerClassName="pb-6">
        {order.riderUid && !done ? (
          <LiveMap
            fromLocalityId={storeById(order.storeId)?.localityId ?? order.localityId}
            toLocalityId={order.localityId}
            rider={riderAt}
            minutes={eta}
            height={240}
          />
        ) : (
          /* Before a rider exists there is no route to draw, so the status
             scene carries the wait instead of an empty map. */
          <View style={{ height: 210 }}>
            <AuroraField
              tone={order.category === 'grocery' ? 'grocery' : 'pharmacy'}
            >
              <Status3D status={order.status} height={210} />
            </AuroraField>
          </View>
        )}

        <View className="gap-4 px-4 py-4">
        <Animated.View entering={FadeIn}>
          <View className="gap-1">
            <T className="text-[26px] font-bold tracking-[-0.9px]">
              {STATUS_LABEL[order.status].en}
            </T>
            <Ta className="text-[14px]">{STATUS_LABEL[order.status].ta}</Ta>
          </View>
          {!done ? (
            <T className="mt-2 text-[14px] leading-5 text-muted-foreground">
              Arriving in about {eta} minutes at {locality?.name ?? 'your address'}.
            </T>
          ) : null}
        </Animated.View>

        {/* Progress rail */}
        <Card className="p-4">
          {RAIL.map((step, i) => {
            const hit = reached(order.status, step.status);
            const current =
              !reached(order.status, RAIL[i + 1]?.status ?? 'delivered') && hit;
            return (
              <View key={step.status} className="flex-row gap-3">
                <View className="items-center">
                  <View
                    className={`size-[18px] items-center justify-center rounded-full ${
                      hit ? (current ? 'bg-primary' : 'bg-grocery') : 'border-[1.5px] border-border'
                    }`}
                  >
                    {hit && !current ? (
                      <Check size={11} color="#FFFFFF" strokeWidth={3.4} />
                    ) : current ? (
                      <View className="size-1.5 rounded-full bg-primary-foreground" />
                    ) : null}
                  </View>
                  {i < RAIL.length - 1 ? (
                    <View className={`w-[1.5px] flex-1 ${hit ? 'bg-grocery' : 'bg-border'}`} />
                  ) : null}
                </View>
                <View className={`flex-1 ${i < RAIL.length - 1 ? 'pb-4' : ''}`}>
                  <T
                    className={`text-[13.5px] ${
                      current ? 'font-semibold' : hit ? 'text-body-strong' : 'text-placeholder'
                    }`}
                  >
                    {step.en}
                  </T>
                  <Ta className="mt-0.5 text-[10.5px]">{step.ta}</Ta>
                </View>
              </View>
            );
          })}
        </Card>

        {/* The OTP — the one thing the customer must be able to find fast. */}
        {!done && reached(order.status, 'out_for_delivery') ? (
          <Card className="gap-2.5 p-4">
            <View className="flex-row items-center gap-2">
              <T className="text-[12.5px] font-semibold tracking-tight">{COPY.deliveryOtp.en}</T>
              <Ta className="text-[11px]">Give this to the rider</Ta>
            </View>
            <View className="flex-row gap-2">
              {order.deliveryOtp.split('').map((d, i) => (
                <View
                  key={i}
                  className="h-14 flex-1 items-center justify-center rounded-[9px] border-[1.5px] border-primary"
                >
                  <Num className="text-2xl font-semibold">{d}</Num>
                </View>
              ))}
            </View>
          </Card>
        ) : null}

        {/* Rider */}
        {order.riderName ? (
          <Card className="flex-row items-center gap-3 p-3.5">
            <View className="size-10 items-center justify-center rounded-full bg-muted">
              <T className="text-[13px] font-semibold text-icon">
                {order.riderName.slice(0, 2).toUpperCase()}
              </T>
            </View>
            <View className="flex-1">
              <T className="text-[15px] font-semibold tracking-tight">{order.riderName}</T>
              <T className="mt-0.5 text-[12px] text-muted-foreground">Your rider</T>
            </View>
            <View className="size-[52px] items-center justify-center rounded-full bg-grocery">
              <Phone size={22} color="#FFFFFF" strokeWidth={2.1} />
            </View>
          </Card>
        ) : null}

        {/* Items */}
        <Card className="overflow-hidden">
          <View className="flex-row items-center gap-2 px-3.5 py-3">
            <T className="flex-1 text-[13px] font-semibold tracking-tight">
              {order.storeName ?? 'Your order'}
            </T>
            <Num className="text-[11px] text-muted-foreground">
              {order.items.filter((i) => i.included).length} items
            </Num>
          </View>
          <Divider className="bg-muted" />
          {order.items
            .filter((i) => i.included)
            .map((item, i, arr) => (
              <View
                key={item.id}
                className={`flex-row items-center justify-between px-3.5 py-2.5 ${
                  i < arr.length - 1 ? 'border-b border-muted' : ''
                }`}
              >
                <View className="flex-1 pr-3">
                  <T className="text-[13.5px] font-medium tracking-tight">{item.name}</T>
                  <Num className="mt-0.5 text-[10.5px] text-placeholder">
                    {item.unit}
                    {item.quantity > 1 ? ` × ${item.quantity}` : ''}
                  </Num>
                </View>
                <Num className="text-[12.5px]">
                  {item.unitPricePaise === null
                    ? '₹ —'
                    : formatInr(item.unitPricePaise * item.quantity)}
                </Num>
              </View>
            ))}
          <View className="flex-row items-center justify-between border-t border-border bg-surface px-3.5 py-3">
            <View>
              <T className="text-[12.5px] font-semibold">{COPY.total.en}</T>
              <Ta className="text-[10px]">{COPY.total.ta}</Ta>
            </View>
            <Money paise={order.pricing.totalPaise} size={17} />
          </View>
        </Card>

        {/* Cancelling.
            Only offered while it is genuinely free — once a shop has started
            packing, a cancel button that silently charges you is worse than no
            button. Past that point the copy sends them to support instead. */}
        {canCancel ? (
          <Button
            variant="outline"
            size="md"
            label="Cancel this order"
            labelTa="ஆர்டரை ரத்து செய்"
            loading={cancelling}
            onPress={() =>
              Alert.alert(
                'Cancel this order?',
                order.status === 'incoming' || order.status === 'admin_review'
                  ? 'Nothing has been bought yet, so there is no charge.'
                  : 'The store has not started packing, so there is no charge.',
                [
                  { text: 'Keep it', style: 'cancel' },
                  {
                    text: 'Cancel order',
                    style: 'destructive',
                    onPress: () => {
                      setCancelling(true);
                      void cancelOrder(order.id, user!.uid, 'customer')
                        .catch((e: Error) => Alert.alert('Could not cancel', e.message))
                        .finally(() => setCancelling(false));
                    },
                  },
                ],
              )
            }
          />
        ) : !done ? (
          <T className="px-1 text-center text-[11.5px] leading-[17px] text-placeholder">
            The store is already preparing this order. To change or cancel it now, call us from
            Account &rarr; Help.
          </T>
        ) : null}

        {/* Money is either owed or accounted for — never ambiguous. */}
        {['unpaid', 'link_sent'].includes(order.paymentStatus) && !done ? (
          <Button
            size="lg"
            label={`Pay ${formatInr(order.pricing.totalPaise)}`}
            labelTa="பணம் செலுத்துங்கள்"
            onPress={() => router.push(`/(customer)/pay/${order.id}`)}
          />
        ) : (
          <Button
            variant="outline"
            size="md"
            label="View tax invoice"
            labelTa="ரசீது"
            onPress={() => router.push(`/(customer)/invoice/${order.id}`)}
          />
        )}
        </View>
      </ScrollView>
    </Screen>
  );
}
