/**
 * DFC Active Orders Screen
 * Every in-flight order across all services with its live status, plus
 * "+ Add Service" so the customer can start a completely new order while
 * existing orders continue normally with their own Captain and tracking.
 */

import * as React from 'react';
import {
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  ArrowLeft,
  Bike,
  ChevronDown,
  ChevronUp,
  Package,
  Printer,
  ShoppingBag,
  ShoppingBag as BagIcon,
  Truck,
  Utensils,
  Plus,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

import { formatInr, isTerminal, STATUS_LABEL, type Order } from '@dfc/core';
import { useAuth } from '@/providers/auth';
import { subscribeMyOrders } from '@/lib/orders';
import { Screen } from '@/ui';
import { ServiceHub } from '@/ui/service-hub';
import { PressableScale } from '@/ui/glass';

const SUPPORTED_SERVICES = ['food', 'grocery', 'print', 'pickup_drop', 'buy_deliver', 'genie'];

function serviceMeta(category: string) {
  switch (category) {
    case 'grocery':
      return { label: 'Grocery', icon: <ShoppingBag size={16} color="#065F46" /> };
    case 'print':
      return { label: 'Print & Xerox', icon: <Printer size={16} color="#6D28D9" /> };
    case 'pickup_drop':
      return { label: 'Pickup & Drop', icon: <Truck size={16} color="#B45309" /> };
    case 'buy_deliver':
      return { label: 'Buy & Deliver', icon: <BagIcon size={16} color="#1D4ED8" /> };
    case 'concierge':
      return { label: 'Genie', icon: <Package size={16} color="#7A1F3D" /> };
    case 'pharmacy':
      return { label: 'Pharmacy', icon: <Plus size={16} color="#1E40AF" /> };
    default:
      return { label: 'Food', icon: <Utensils size={16} color="#7A1F3D" /> };
  }
}

function statusPill(status: Order['status']) {
  switch (status) {
    case 'packing':
      return { label: 'PREPARING', bg: '#FFD9E0', text: '#782C44' };
    case 'delivered':
      return { label: 'DELIVERED', bg: '#ECFDF5', text: '#065F46' };
    case 'cancelled':
    case 'rejected':
      return { label: 'CANCELLED', bg: '#FFDAD6', text: '#BA1A1A' };
    case 'dispatched':
    case 'picked_up':
    case 'out_for_delivery':
      return { label: 'ON THE WAY', bg: '#FEF3C7', text: '#B45309' };
    default:
      return { label: 'CONFIRMED', bg: '#E9EDFF', text: '#1E40AF' };
  }
}

export default function ActiveOrdersScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [orders, setOrders] = React.useState<Order[]>([]);
  const [showAddService, setShowAddService] = React.useState(false);

  React.useEffect(() => {
    if (!user) return;
    return subscribeMyOrders(user.uid, (list) => setOrders(list));
  }, [user]);

  // Completed and cancelled orders leave this list automatically.
  const activeOrders = orders.filter((o) => !isTerminal(o.status));

  return (
    <Screen edges={['top']}>
      {/* Header */}
      <View
        style={{
          height: 60,
          backgroundColor: '#F9F9FF',
          paddingHorizontal: 20,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 12,
          borderBottomWidth: 1,
          borderBottomColor: '#DAC0C430',
        }}
      >
        <Pressable
          onPress={() => router.back()}
          style={{
            width: 38,
            height: 38,
            borderRadius: 19,
            backgroundColor: '#E9EDFF',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <ArrowLeft size={20} color="#7A1F3D" strokeWidth={2.2} />
        </Pressable>
        <View>
          <Text style={{ fontFamily: 'Archivo', fontSize: 20, fontWeight: '800', color: '#7A1F3D' }}>
            Active Orders
          </Text>
          <Text style={{ fontFamily: 'Archivo', fontSize: 11, color: '#554245' }}>
            {activeOrders.length} in progress · each runs independently
          </Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingTop: 16,
          paddingBottom: 48,
        }}
        showsVerticalScrollIndicator={false}
      >
        {activeOrders.length === 0 ? (
          <View
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: 16,
              borderWidth: 1,
              borderColor: '#DAC0C4',
              padding: 32,
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 16,
            }}
          >
            <Bike size={40} color="#DAC0C4" />
            <Text
              style={{
                fontFamily: 'Archivo',
                fontSize: 16,
                fontWeight: '700',
                color: '#141B2B',
                marginTop: 12,
              }}
            >
              No active orders
            </Text>
            <Text
              style={{
                fontFamily: 'Archivo',
                fontSize: 13,
                color: '#554245',
                textAlign: 'center',
                marginTop: 4,
              }}
            >
              Start a new service below — you can run several orders at once.
            </Text>
          </View>
        ) : (
          <View style={{ gap: 12, marginBottom: 16 }}>
            {activeOrders.map((order) => {
              const meta = serviceMeta(order.category);
              const pill = statusPill(order.status);
              const statusLabel = STATUS_LABEL[order.status]?.en ?? order.status;

              return (
                <Pressable
                  key={order.id}
                  onPress={() => router.push(`/(customer)/order/${order.id}` as any)}
                  style={{
                    backgroundColor: '#FFFFFF',
                    borderRadius: 16,
                    borderWidth: 1,
                    borderColor: '#DAC0C4',
                    padding: 16,
                    shadowColor: '#000000',
                    shadowOpacity: 0.04,
                    shadowRadius: 10,
                    shadowOffset: { width: 0, height: 3 },
                    elevation: 2,
                    position: 'relative',
                    overflow: 'hidden',
                  }}
                >
                  {/* Live stripe */}
                  <View
                    style={{
                      position: 'absolute',
                      top: 0,
                      right: 0,
                      width: 5,
                      height: '100%',
                      backgroundColor: '#7A1F3D',
                    }}
                  />

                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10 }}>
                    <View
                      style={{
                        width: 38,
                        height: 38,
                        borderRadius: 19,
                        backgroundColor: '#FDF2F5',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {meta.icon}
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontFamily: 'Archivo', fontSize: 16, fontWeight: '700', color: '#141B2B' }}>
                        {meta.label}
                      </Text>
                      <Text style={{ fontFamily: 'Archivo', fontSize: 12, color: '#554245' }}>
                        ORD-{order.code}
                        {order.storeName ? ` · ${order.storeName}` : ''}
                      </Text>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                      <Text style={{ fontFamily: 'Archivo', fontSize: 16, fontWeight: '800', color: '#141B2B' }}>
                        {formatInr(order.pricing.totalPaise)}
                      </Text>
                      <View
                        style={{
                          backgroundColor: pill.bg,
                          paddingHorizontal: 8,
                          paddingVertical: 3,
                          borderRadius: 9999,
                          marginTop: 4,
                        }}
                      >
                        <Text
                          style={{
                            fontFamily: 'Archivo',
                            fontSize: 10,
                            fontWeight: '800',
                            color: pill.text,
                            letterSpacing: 0.5,
                          }}
                        >
                          {pill.label}
                        </Text>
                      </View>
                    </View>
                  </View>

                  {/* Current status + Captain */}
                  <View
                    style={{
                      borderTopWidth: 1,
                      borderTopColor: '#DAC0C440',
                      paddingTop: 10,
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <Text style={{ fontFamily: 'Archivo', fontSize: 12, color: '#554245' }} numberOfLines={1}>
                      {statusLabel}
                      {order.captainName ? ` · Captain ${order.captainName}` : ''}
                    </Text>
                    <Text style={{ fontFamily: 'Archivo', fontSize: 13, fontWeight: '700', color: '#7A1F3D' }}>
                      Track →
                    </Text>
                  </View>
                </Pressable>
              );
            })}
          </View>
        )}

        {/* + Add Service */}
        <PressableScale
          to={0.97}
          onPress={() => {
            void Haptics.selectionAsync();
            setShowAddService((v) => !v);
          }}
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: 16,
            borderWidth: 1.5,
            borderColor: '#7A1F3D',
            borderStyle: 'dashed',
            paddingVertical: 14,
            paddingHorizontal: 16,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
          }}
        >
          <Plus size={18} color="#7A1F3D" strokeWidth={2.6} />
          <Text style={{ fontFamily: 'Archivo', fontSize: 15, fontWeight: '800', color: '#7A1F3D' }}>
            {showAddService ? 'Hide Services' : 'Add Service'}
          </Text>
          {showAddService ? (
            <ChevronUp size={16} color="#7A1F3D" strokeWidth={2.4} />
          ) : (
            <ChevronDown size={16} color="#7A1F3D" strokeWidth={2.4} />
          )}
        </PressableScale>

        <Text
          style={{
            fontFamily: 'Archivo',
            fontSize: 12,
            color: '#554245',
            textAlign: 'center',
            marginTop: 8,
          }}
        >
          Starting a new order never interrupts the ones already running.
        </Text>

        {showAddService ? (
          <View style={{ marginTop: 12 }}>
            <ServiceHub only={SUPPORTED_SERVICES} />
          </View>
        ) : null}
      </ScrollView>
    </Screen>
  );
}
