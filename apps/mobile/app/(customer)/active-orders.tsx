/**
 * DFC Active Orders Screen — Stitch Dark Floating Theme
 * Displays in-flight orders across all services with real-time status and captain assignment.
 * Supports "+ Add Service" to start parallel orders without interrupting ongoing deliveries.
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
  Truck,
  Utensils,
  Plus,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

import { formatInr, isTerminal, STATUS_LABEL, type Order } from '@dfc/core';
import { useAuth } from '@/providers/auth';
import { subscribeMyOrders } from '@/lib/orders';
import { Screen } from '@/ui';
import { DFCPressable } from '@/ui/animated';
import { StitchHeader } from '@/ui/stitch-header';
import { ServiceHub } from '@/ui/service-hub';

const SUPPORTED_SERVICES = ['food', 'grocery', 'print', 'pickup_drop', 'buy_deliver', 'genie'];

function serviceMeta(category: string) {
  switch (category) {
    case 'grocery':
      return { label: 'Grocery Basket', icon: <ShoppingBag size={18} color="#6EE7B7" />, bg: 'rgba(16, 185, 129, 0.15)' };
    case 'print':
      return { label: 'Print & Xerox', icon: <Printer size={18} color="#C4B5FD" />, bg: 'rgba(139, 92, 246, 0.15)' };
    case 'pickup_drop':
      return { label: 'Pickup & Drop', icon: <Truck size={18} color="#FDE047" />, bg: 'rgba(234, 179, 8, 0.15)' };
    case 'buy_deliver':
      return { label: 'Buy & Deliver', icon: <ShoppingBag size={18} color="#93C5FD" />, bg: 'rgba(59, 130, 246, 0.15)' };
    case 'concierge':
    case 'genie':
      return { label: 'Genie Errand', icon: <Package size={18} color="#F472B6" />, bg: 'rgba(236, 72, 153, 0.15)' };
    default:
      return { label: 'Food Delivery', icon: <Utensils size={18} color="#C8BFFF" />, bg: 'rgba(106, 90, 205, 0.15)' };
  }
}

function statusPill(status: Order['status']) {
  switch (status) {
    case 'packing':
      return { label: 'PREPARING', bg: 'rgba(106, 90, 205, 0.2)', text: '#C8BFFF', dot: '#8B7EF8' };
    case 'delivered':
      return { label: 'DELIVERED', bg: 'rgba(16, 185, 129, 0.2)', text: '#34D399', dot: '#10B981' };
    case 'cancelled':
    case 'rejected':
      return { label: 'CANCELLED', bg: 'rgba(239, 68, 68, 0.2)', text: '#F87171', dot: '#EF4444' };
    case 'dispatched':
    case 'picked_up':
    case 'out_for_delivery':
      return { label: 'ON THE WAY', bg: 'rgba(245, 158, 11, 0.2)', text: '#FBBF24', dot: '#F59E0B' };
    default:
      return { label: 'CONFIRMED', bg: 'rgba(59, 130, 246, 0.2)', text: '#60A5FA', dot: '#3B82F6' };
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

  // Terminal orders leave this list automatically.
  const activeOrders = orders.filter((o) => !isTerminal(o.status));

  return (
    <Screen edges={['top']} style={{ backgroundColor: '#0E0E10' }}>
      <StitchHeader
        showBack={true}
        title="Active Orders"
        subtitle={`${activeOrders.length} in progress · parallel tracking`}
        showNotifications={false}
      />

      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingTop: 16,
          paddingBottom: 48,
        }}
        showsVerticalScrollIndicator={false}
      >
        {activeOrders.length === 0 ? (
          <View
            style={{
              backgroundColor: '#18181B',
              borderRadius: 20,
              borderWidth: 1,
              borderColor: '#26262B',
              padding: 36,
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 20,
            }}
          >
            <View
              style={{
                width: 64,
                height: 64,
                borderRadius: 32,
                backgroundColor: '#201F24',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 16,
              }}
            >
              <Bike size={28} color="#6A5ACD" />
            </View>
            <Text
              style={{
                fontFamily: 'PlusJakartaSans',
                fontSize: 17,
                fontWeight: '700',
                color: '#E5E1E4',
                marginBottom: 6,
              }}
            >
              No active orders
            </Text>
            <Text
              style={{
                fontFamily: 'PlusJakartaSans',
                fontSize: 13,
                color: '#928F9E',
                textAlign: 'center',
                lineHeight: 18,
                marginBottom: 20,
              }}
            >
              Start a new order below — DFC lets you run multiple deliveries simultaneously with dedicated riders.
            </Text>
          </View>
        ) : (
          <View style={{ gap: 14, marginBottom: 20 }}>
            {activeOrders.map((order) => {
              const meta = serviceMeta(order.category);
              const pill = statusPill(order.status);
              const statusLabel = STATUS_LABEL[order.status]?.en ?? order.status;

              return (
                <DFCPressable
                  key={order.id}
                  onPress={() => router.push(`/(customer)/order/${order.id}` as any)}
                  scaleTo={0.98}
                  style={{
                    backgroundColor: '#18181B',
                    borderRadius: 20,
                    borderWidth: 1,
                    borderColor: 'rgba(106, 90, 205, 0.4)',
                    padding: 16,
                    position: 'relative',
                    overflow: 'hidden',
                  }}
                >
                  {/* Top neon indicator */}
                  <View
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      height: 3,
                      backgroundColor: '#6A5ACD',
                    }}
                  />

                  {/* Service Info & Status */}
                  <View className="flex-row items-start gap-3 mb-3.5">
                    <View
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: 14,
                        backgroundColor: meta.bg,
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {meta.icon}
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text
                        style={{
                          fontFamily: 'PlusJakartaSans',
                          fontSize: 16,
                          fontWeight: '700',
                          color: '#E5E1E4',
                        }}
                      >
                        {meta.label}
                      </Text>
                      <Text
                        style={{
                          fontFamily: 'PlusJakartaSans',
                          fontSize: 12,
                          color: '#928F9E',
                          marginTop: 1,
                        }}
                      >
                        ORD-{order.code}
                        {order.storeName ? ` · ${order.storeName}` : ''}
                      </Text>
                    </View>

                    <View style={{ alignItems: 'flex-end' }}>
                      <Text
                        style={{
                          fontFamily: 'PlusJakartaSans',
                          fontSize: 16,
                          fontWeight: '800',
                          color: '#E5E1E4',
                        }}
                      >
                        {formatInr(order.pricing.totalPaise)}
                      </Text>
                      <View
                        style={{
                          backgroundColor: pill.bg,
                          paddingHorizontal: 8,
                          paddingVertical: 3,
                          borderRadius: 8,
                          flexDirection: 'row',
                          alignItems: 'center',
                          gap: 4,
                          marginTop: 4,
                        }}
                      >
                        <View
                          style={{
                            width: 6,
                            height: 6,
                            borderRadius: 3,
                            backgroundColor: pill.dot,
                          }}
                        />
                        <Text
                          style={{
                            fontFamily: 'PlusJakartaSans',
                            fontSize: 10,
                            fontWeight: '800',
                            color: pill.text,
                            letterSpacing: 0.4,
                          }}
                        >
                          {pill.label}
                        </Text>
                      </View>
                    </View>
                  </View>

                  {/* Rider & Step Status */}
                  <View
                    style={{
                      backgroundColor: '#121215',
                      borderRadius: 12,
                      padding: 12,
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <View className="flex-1 mr-3">
                      <Text
                        style={{
                          fontFamily: 'PlusJakartaSans',
                          fontSize: 12,
                          fontWeight: '600',
                          color: '#E5E1E4',
                        }}
                        numberOfLines={1}
                      >
                        {statusLabel}
                      </Text>
                      <Text
                        style={{
                          fontFamily: 'PlusJakartaSans',
                          fontSize: 11,
                          color: '#928F9E',
                          marginTop: 1,
                        }}
                        numberOfLines={1}
                      >
                        {order.captainName ? `Captain ${order.captainName}` : 'Assigning nearest Captain...'}
                      </Text>
                    </View>

                    <View
                      style={{
                        backgroundColor: '#6A5ACD',
                        paddingHorizontal: 12,
                        paddingVertical: 6,
                        borderRadius: 8,
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 4,
                      }}
                    >
                      <Text
                        style={{
                          fontFamily: 'PlusJakartaSans',
                          fontSize: 12,
                          fontWeight: '700',
                          color: '#FFFFFF',
                        }}
                      >
                        Track
                      </Text>
                      <ChevronRight size={13} color="#FFFFFF" strokeWidth={2.5} />
                    </View>
                  </View>
                </DFCPressable>
              );
            })}
          </View>
        )}

        {/* + Add Service Button */}
        <DFCPressable
          scaleTo={0.97}
          onPress={() => {
            void Haptics.selectionAsync();
            setShowAddService((v) => !v);
          }}
          style={{
            backgroundColor: '#18181B',
            borderRadius: 16,
            borderWidth: 1.5,
            borderColor: '#6A5ACD',
            borderStyle: 'dashed',
            paddingVertical: 14,
            paddingHorizontal: 16,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
          }}
        >
          <Plus size={18} color="#C8BFFF" strokeWidth={2.4} />
          <Text
            style={{
              fontFamily: 'PlusJakartaSans',
              fontSize: 14,
              fontWeight: '700',
              color: '#C8BFFF',
            }}
          >
            {showAddService ? 'Hide Services' : 'Order Another Service'}
          </Text>
          {showAddService ? (
            <ChevronUp size={16} color="#C8BFFF" strokeWidth={2.2} />
          ) : (
            <ChevronDown size={16} color="#C8BFFF" strokeWidth={2.2} />
          )}
        </DFCPressable>

        <Text
          style={{
            fontFamily: 'PlusJakartaSans',
            fontSize: 12,
            color: '#928F9E',
            textAlign: 'center',
            marginTop: 10,
          }}
        >
          Starting a new service runs in parallel and will not disrupt ongoing orders.
        </Text>

        {showAddService ? (
          <View style={{ marginTop: 16 }}>
            <ServiceHub only={SUPPORTED_SERVICES} />
          </View>
        ) : null}
      </ScrollView>
    </Screen>
  );
}
