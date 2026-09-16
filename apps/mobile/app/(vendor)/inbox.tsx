/**
 * Vendor inbox.
 *
 * A shopkeeper looks at this between customers, so the newest request is the
 * whole screen and everything else is a one-line row. The accept clock is real
 * pressure: an unanswered request gets reassigned.
 */

import * as React from 'react';
import { Pressable, RefreshControl, ScrollView, View } from 'react-native';
import { useRouter } from 'expo-router';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { AlertTriangle, Boxes, Moon, Receipt, SlidersHorizontal } from 'lucide-react-native';

import {
  COPY,
  STATUS_LABEL,
  formatInr,
  hasFlagged,
  localityById,
  type Order,
} from '@dfc/core';

import { useAuth } from '@/providers/auth';
import { usePlatformStatus } from '@/hooks/usePlatformStatus';
import { subscribeStoreOrders, vendorAccept, vendorReject } from '@/lib/orders';
import { Badge, Button, Card, Divider, Empty, Loading, Money, Num, Screen, T, Ta } from '@/ui';
import { mockMenuRepository } from '@/demo/repositories/menu.repository';
import { mockOrderRepository } from '@/demo/repositories/order.repository';

/** Seconds a store has to answer before ops reassigns the order. */
const ACCEPT_WINDOW_S = 180;

function useCountdown(from: number): number {
  const [left, setLeft] = React.useState(() =>
    Math.max(0, ACCEPT_WINDOW_S - Math.floor((Date.now() - from) / 1000)),
  );
  React.useEffect(() => {
    const id = setInterval(
      () => setLeft(Math.max(0, ACCEPT_WINDOW_S - Math.floor((Date.now() - from) / 1000))),
      1000,
    );
    return () => clearInterval(id);
  }, [from]);
  return left;
}

function IncomingCard({ order, onOpen }: { order: Order; onOpen: () => void }) {
  const { user } = useAuth();
  const [busy, setBusy] = React.useState(false);
  const left = useCountdown(order.createdAt);
  const locality = localityById(order.localityId);
  const mm = Math.floor(left / 60);
  const ss = String(left % 60).padStart(2, '0');

  return (
    <Animated.View entering={FadeInUp.duration(240)}>
      <Card className="overflow-hidden">
        <View className="h-[3px] bg-muted">
          <View
            style={{ width: `${(left / ACCEPT_WINDOW_S) * 100}%` }}
            className={`h-[3px] ${left < 45 ? 'bg-destructive' : 'bg-primary'}`}
          />
        </View>

        <View className="gap-3 p-3.5">
          <View className="flex-row items-start gap-3">
            <View className="flex-1 gap-1.5">
              <View className="flex-row items-center gap-2">
                <Num className="text-[13px] font-semibold">#{order.code}</Num>
                <Badge
                  label={order.paymentMode === 'prepaid' ? 'PREPAID' : 'COD'}
                  tone={order.paymentMode === 'prepaid' ? 'neutral' : 'grocery'}
                />
              </View>
              <T className="text-[12px] leading-[18px] text-muted-foreground" numberOfLines={2}>
                {order.items
                  .filter((i) => i.included)
                  .slice(0, 3)
                  .map((i) => `${i.name}${i.quantity > 1 ? ` ×${i.quantity}` : ''}`)
                  .join(' · ')}
                {order.items.length > 3 ? `  +${order.items.length - 3}` : ''}
              </T>
              {hasFlagged(order) ? (
                <View className="flex-row items-center gap-1.5">
                  <AlertTriangle size={12} color="#B45309" strokeWidth={2} />
                  <T className="text-[11px] font-medium text-verify">
                    1 item needs your confirmation
                  </T>
                </View>
              ) : null}
            </View>
            <View className="items-end gap-0.5">
              <Money paise={order.pricing.totalPaise} size={16} />
              <T className="text-[10px] text-placeholder">{locality?.name}</T>
            </View>
          </View>

          <View className="flex-row gap-2.5">
            <Button
              variant="outline"
              size="lg"
              label={COPY.reject.en}
              className="w-[104px]"
              disabled={busy}
              onPress={() => {
                setBusy(true);
                void vendorReject(order.id, user!.uid, 'Store declined').finally(() =>
                  setBusy(false),
                );
              }}
            />
            <Button
              size="lg"
              label={COPY.accept.en}
              className="flex-1"
              loading={busy}
              right={
                <View className="rounded-md bg-on-dark-chip px-1.5 py-1">
                  <Num className="text-[12.5px] text-placeholder">
                    {mm}:{ss}
                  </Num>
                </View>
              }
              onPress={() => {
                setBusy(true);
                void vendorAccept(order.id, user!.uid)
                  .then(onOpen)
                  .finally(() => setBusy(false));
              }}
            />
          </View>
        </View>
      </Card>
    </Animated.View>
  );
}

function ActiveRow({ order, onPress }: { order: Order; onPress: () => void }) {
  const dot =
    order.status === 'ready_for_pickup'
      ? 'bg-grocery'
      : order.status === 'packing'
        ? 'bg-verify'
        : 'bg-disabled';

  return (
    <Pressable onPress={onPress} className="flex-row items-center gap-3 px-3.5 py-3">
      <View className={`size-2 rounded-full ${dot}`} />
      <View className="flex-1">
        <View className="flex-row items-center gap-2">
          <Num className="text-[12.5px] font-semibold">#{order.code}</Num>
          <T className="text-[12.5px] text-body-strong">{STATUS_LABEL[order.status]?.en || order.status}</T>
        </View>
        <T className="mt-0.5 text-[10.5px] text-placeholder">
          {order.items.filter((i) => i.included).length} items ·{' '}
          {localityById(order.localityId)?.name}
        </T>
      </View>
      {order.status === 'vendor_accepted' ? (
        <Button size="sm" label="Start Prep" onPress={(e) => { e?.stopPropagation?.(); mockOrderRepository.startPreparation(order.id); }} />
      ) : order.status === 'packing' ? (
        <Button size="sm" label="Mark Ready" onPress={(e) => { e?.stopPropagation?.(); mockOrderRepository.completePreparation(order.id); }} />
      ) : (
        <Num className="text-[12.5px] font-medium">{formatInr(order.pricing.totalPaise)}</Num>
      )}
    </Pressable>
  );
}

export default function VendorInbox() {
  const router = useRouter();
  const { profile, signOut } = useAuth();
  const [orders, setOrders] = React.useState<Order[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [online, setOnline] = React.useState(true);
  const platform = usePlatformStatus();

  const [menuVersion, setMenuVersion] = React.useState(0);
  React.useEffect(() => mockMenuRepository.subscribe(() => setMenuVersion(v => v+1)), []);
  const menuItems = mockMenuRepository.getMenuByVendor('rest-amma-mess');

  React.useEffect(() => {
    if (!profile?.storeId) {
      setLoading(false);
      return;
    }
    return subscribeStoreOrders(profile.storeId, (list) => {
      setOrders(list);
      setLoading(false);
    });
  }, [profile?.storeId]);

  const incoming = orders.filter((o) => o.status === 'paid');
  const active = orders.filter((o) => o.status !== 'paid');
  const todayValue = orders.reduce((s, o) => s + o.pricing.totalPaise, 0);

  if (loading) return <Screen><Loading /></Screen>;

  if (!profile?.storeId) {
    return (
      <Screen>
        <Empty
          title="No store linked"
          subtitle="This account is not attached to a store yet. Ask DFC operations to link it."
        />
        <View className="px-5 pb-6">
          <Button variant="outline" size="lg" label="Sign out" onPress={() => void signOut()} />
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      {/* Store header */}
      <View className="border-b border-border">
        <View className="flex-row items-center gap-3 px-4 pb-3 pt-3.5">
          <View className="size-9 items-center justify-center rounded-[10px] border border-border bg-surface">
            <Boxes size={18} color="#18181B" strokeWidth={2} />
          </View>
          <View className="flex-1">
            <T className="text-[15px] font-semibold tracking-[-0.2px]" numberOfLines={1}>
              {orders[0]?.storeName ?? 'Your store'}
            </T>
            <T className="mt-0.5 text-[11px] text-placeholder">
              {localityById(profile.localityId)?.name} · DFC partner
            </T>
          </View>
          <Pressable onPress={() => setOnline((v) => !v)} className="items-end gap-1">
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
              {online ? COPY.storeOpen.en : COPY.storeClosed.en}
            </T>
          </Pressable>
        </View>

        <View className="flex-row border-t border-muted">
          {[
            { v: formatInr(todayValue), l: COPY.today.en },
            { v: String(orders.length), l: COPY.orders.en },
            { v: '6m', l: COPY.avgPrep.en },
          ].map((s) => (
            <View key={s.l} className="flex-1 gap-0.5 px-4 py-2.5">
              <Num className="text-[15px] font-semibold tracking-tight">{s.v}</Num>
              <T className="text-[10.5px] text-placeholder">{s.l}</T>
            </View>
          ))}
        </View>
      </View>

      <ScrollView
        className="flex-1 bg-surface"
        contentContainerClassName="gap-3 px-4 py-4"
        refreshControl={<RefreshControl refreshing={false} onRefresh={() => {}} />}
      >
        {platform.status === 'sleep' ? (
          <View className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3.5 gap-1.5 mb-1">
            <View className="flex-row items-center gap-2">
              <Moon size={15} color="#F59E0B" />
              <T className="text-xs font-bold text-amber-500">Kitchen Resting · இரவு ஓய்வு</T>
            </View>
            <T className="text-[11.5px] leading-relaxed text-zinc-300">
              Live orders paused until {platform.nextOpenTime ?? '6:00 AM'}. Breakfast drops pre-orders will land at 5:30 AM for morning preparation.
            </T>
          </View>
        ) : null}

        <View className="flex-row items-center gap-2">
          <View className={`size-[7px] rounded-full ${incoming.length ? 'bg-destructive' : 'bg-disabled'}`} />
          <T className="text-xs font-semibold tracking-tight">{COPY.newRequest.en}</T>
          <Ta className="text-[11px]">{COPY.newRequest.ta}</Ta>
        </View>

        {incoming.length === 0 ? (
          <Card className="items-center py-7">
            <T className="text-[13px] text-placeholder">Nothing waiting right now.</T>
          </Card>
        ) : (
          incoming.map((o) => (
            <IncomingCard
              key={o.id}
              order={o}
              onOpen={() => router.push(`/(vendor)/order/${o.id}`)}
            />
          ))
        )}

        <View className="mt-1.5 flex-row items-center gap-2">
          <T className="text-xs font-semibold tracking-tight">{COPY.inProgress.en}</T>
          <Ta className="text-[11px]">{COPY.inProgress.ta}</Ta>
          <Num className="ml-auto text-[11px] text-placeholder">{active.length} active</Num>
        </View>

        <Card className="overflow-hidden">
          {active.length === 0 ? (
            <View className="items-center py-7">
              <T className="text-[13px] text-placeholder">No orders in progress.</T>
            </View>
          ) : (
            active.map((o, i) => (
              <React.Fragment key={o.id}>
                {i > 0 ? <Divider className="bg-muted" /> : null}
                <ActiveRow order={o} onPress={() => router.push(`/(vendor)/order/${o.id}`)} />
              </React.Fragment>
            ))
          )}
        </Card>

        <View className="mt-4 flex-row items-center gap-2">
          <T className="text-xs font-semibold tracking-tight">Menu Management</T>
          <Badge label="Manage" />
        </View>

        <Card className="overflow-hidden">
          {menuItems.map((item, i) => (
            <React.Fragment key={item.id}>
              {i > 0 ? <Divider className="bg-muted" /> : null}
              <View className="flex-row items-center justify-between px-3.5 py-3">
                <View className="flex-1">
                  <T className="text-[13px] font-bold">{item.name}</T>
                  <Num className="mt-0.5 text-[12px] text-placeholder">{formatInr(item.pricePaise)}</Num>
                </View>
                <Pressable
                  onPress={() => mockMenuRepository.toggleItemAvailability(item.id)}
                  className={`h-6 w-10 flex-row rounded-full p-0.5 ${
                    item.isAvailable ? 'justify-end bg-grocery' : 'justify-start bg-border'
                  }`}
                >
                  <View className="size-5 rounded-full bg-white" />
                </Pressable>
              </View>
            </React.Fragment>
          ))}
        </Card>
      </ScrollView>

      <View className="flex-row border-t border-border bg-background px-2 pb-5 pt-2">
        {[
          { icon: Boxes, label: 'Orders', on: true, go: null },
          { icon: Boxes, label: 'Menu / Stock', on: false, go: '/(vendor)/menu' as const },
          { icon: Receipt, label: 'Payouts', on: false, go: '/(vendor)/payouts' as const },
          { icon: SlidersHorizontal, label: 'Account', on: false, go: '/(vendor)/settings' as const },
        ].map(({ icon: Icon, label, on, go }) => (
          <Pressable
            key={label}
            onPress={() => go && router.push(go as never)}
            accessibilityRole="button"
            accessibilityLabel={label}
            className="h-[52px] flex-1 items-center justify-center gap-1"
          >
            <Icon size={20} color={on ? '#18181B' : '#A1A1AA'} strokeWidth={2} />
            <T
              className={`text-[10px] ${on ? 'font-semibold text-foreground' : 'text-placeholder'}`}
            >
              {label}
            </T>
          </Pressable>
        ))}
      </View>
    </Screen>
  );
}
