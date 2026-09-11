/**
 * Rider queue.
 *
 * Usually one card. The online switch is the only setting a rider needs, and
 * it is the biggest control on the screen after the task itself.
 */

import * as React from 'react';
import { Pressable, ScrollView, View, Alert, Modal, TextInput } from 'react-native';
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
import { mockOrderRepository } from '@/demo/repositories/order.repository';
import { mockCaptainRepository } from '@/demo/repositories/captain.repository';

function TaskCard({ order, onPress, onAccept, onReject }: { order: Order; onPress: () => void; onAccept: () => void; onReject: () => void }) {
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
                {STATUS_LABEL[order.status]?.en ?? order.status}
              </T>
              <View className="flex-row items-center gap-1">
                <T className="text-[12.5px] font-semibold">Open task</T>
                <ChevronRight size={15} color="#18181B" strokeWidth={2.4} />
              </View>
            </View>
            
            {order.assignmentStatus === 'ASSIGNED' && (
              <View className="flex-row gap-2 border-t border-muted pt-3">
                <Button
                  variant="outline"
                  label="Reject"
                  className="flex-1"
                  onPress={onReject}
                />
                <Button
                  variant="primary"
                  label="Accept"
                  className="flex-1"
                  onPress={onAccept}
                />
              </View>
            )}
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
  
  const [explanation, setExplanation] = React.useState('');
  const [cancelModalOrderId, setCancelModalOrderId] = React.useState<string | null>(null);

  const loadOrders = () => {
    const all = (mockOrderRepository as any).getAll?.() ?? mockOrderRepository.getOrders();
    const filtered = all.filter((o: Order) => o.captainUid === 'captain_002' || o.assignmentStatus === 'ASSIGNED');
    setOrders(filtered);
  };

  React.useEffect(() => {
    loadOrders();
    setLoading(false);
  }, []);

  async function toggleOnline() {
    setOnline(!online);
  }

  const handleAccept = async (orderId: string) => {
    await mockOrderRepository.captainAccept(orderId, 'captain_002');
    loadOrders();
  };

  const handleCancelClick = (orderId: string) => {
    const captain = mockCaptainRepository.getCaptainById('captain_002');
    if (captain && captain.cancellationCount >= 2) {
      setCancelModalOrderId(orderId);
      setExplanation('');
    } else {
      handleConfirmCancel(orderId);
    }
  };

  const handleConfirmCancel = async (orderId: string, expl?: string) => {
    const res = await mockOrderRepository.captainCancel({
      orderId,
      captainId: 'captain_002',
      reason: 'Rider rejected',
      explanation: expl
    });
    
    if (res.wentOffline) {
      Alert.alert("Offline", "You have been moved offline due to cancellation limit.");
      setOnline(false);
    }
    
    setCancelModalOrderId(null);
    loadOrders();
  };

  if (loading) return <Screen><Loading /></Screen>;

  const earned = orders.reduce((s, o) => s + o.pricing.deliveryPaise, 0);

  return (
    <Screen>
      <View className="border-b border-border">
        <View className="flex-row items-center gap-3 px-4 pb-3 pt-3.5">
          <View className="size-9 items-center justify-center rounded-full bg-muted">
            <T className="text-[13px] font-semibold text-icon">
              {(profile?.name ?? 'Arun').slice(0, 2).toUpperCase()}
            </T>
          </View>
          <View className="flex-1">
            <T className="text-[15px] font-semibold tracking-[-0.2px]">
              {profile?.name ?? 'Captain Arun'}
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
            <TaskCard 
              key={o.id} 
              order={o} 
              onPress={() => router.push(`/(rider)/task/${o.id}`)}
              onAccept={() => handleAccept(o.id)}
              onReject={() => handleCancelClick(o.id)}
            />
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
      
      <Modal
        visible={!!cancelModalOrderId}
        transparent
        animationType="fade"
        onRequestClose={() => setCancelModalOrderId(null)}
      >
        <View className="flex-1 items-center justify-center bg-black/50 p-4">
          <View className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-lg">
            <T className="text-lg font-bold text-dark">Cancellation Explanation Required</T>
            <T className="mt-2 text-sm text-muted-foreground">
              You have reached the cancellation limit. Please provide an explanation.
            </T>
            
            <TextInput
              className="mt-4 min-h-[100px] rounded-xl border border-border p-3 text-base"
              multiline
              textAlignVertical="top"
              placeholder="Why are you rejecting this order?"
              value={explanation}
              onChangeText={setExplanation}
            />
            
            <View className="mt-5 gap-3">
              <Button
                variant="primary"
                label="Submit & Cancel Order"
                disabled={!explanation.trim()}
                onPress={() => cancelModalOrderId && handleConfirmCancel(cancelModalOrderId, explanation)}
              />
              <Button
                variant="outline"
                label="Go Back"
                onPress={() => setCancelModalOrderId(null)}
              />
            </View>
          </View>
        </View>
      </Modal>
    </Screen>
  );
}

