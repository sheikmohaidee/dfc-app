/**
 * DFC Orders History Screen — Stitch Dark Floating Theme
 * Features segmented tabs (Active, Completed, Cancelled), tactile dark floating cards,
 * route node timeline previews, live pulse badges, and 1-tap reorder/tracking.
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
  ArrowRight,
  ChevronRight,
  Clock,
  MapPin,
  Pill,
  Printer,
  ShoppingBag,
  Sparkles,
  Utensils,
  Truck,
  Package,
  RotateCcw,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

import { formatInr, isTerminal, type Order } from '@dfc/core';
import { useAuth } from '@/providers/auth';
import { subscribeMyOrders } from '@/lib/orders';
import { Screen } from '@/ui';
import { DFCPressable } from '@/ui/animated';
import { StitchHeader } from '@/ui/stitch-header';
import { StitchNav } from '@/ui/stitch-nav';

type OrderTab = 'active' | 'completed' | 'cancelled';

export default function OrdersScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [orders, setOrders] = React.useState<Order[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [activeTab, setActiveTab] = React.useState<OrderTab>('active');

  React.useEffect(() => {
    if (!user) return;
    return subscribeMyOrders(user.uid, (list) => {
      setOrders(list);
      setLoading(false);
    });
  }, [user]);

  const activeCount = React.useMemo(() => orders.filter((o) => !isTerminal(o.status)).length, [orders]);

  const filteredOrders = React.useMemo(() => {
    if (activeTab === 'active') {
      return orders.filter((o) => !isTerminal(o.status));
    }
    if (activeTab === 'completed') {
      return orders.filter((o) => o.status === 'delivered');
    }
    return orders.filter((o) => o.status === 'cancelled' || o.status === 'rejected');
  }, [orders, activeTab]);

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'grocery':
        return <ShoppingBag size={16} color="#6EE7B7" />;
      case 'print':
        return <Printer size={16} color="#C4B5FD" />;
      case 'pickup_drop':
      case 'buy_deliver':
        return <Truck size={16} color="#FDE047" />;
      case 'genie':
      case 'concierge':
        return <Package size={16} color="#F472B6" />;
      default:
        return <Utensils size={16} color="#C8BFFF" />;
    }
  };

  const getCategoryBg = (category: string) => {
    switch (category) {
      case 'grocery':
        return 'rgba(16, 185, 129, 0.15)';
      case 'print':
        return 'rgba(139, 92, 246, 0.15)';
      case 'pickup_drop':
      case 'buy_deliver':
        return 'rgba(234, 179, 8, 0.15)';
      case 'genie':
      case 'concierge':
        return 'rgba(236, 72, 153, 0.15)';
      default:
        return 'rgba(106, 90, 205, 0.15)';
    }
  };

  const getStatusPill = (status: string) => {
    switch (status) {
      case 'in_transit':
      case 'out_for_delivery':
      case 'delivering':
        return { label: 'IN TRANSIT', bg: 'rgba(245, 158, 11, 0.15)', text: '#FBBF24', dot: '#F59E0B' };
      case 'preparing':
      case 'packing':
      case 'vendor_accepted':
        return { label: 'PREPARING', bg: 'rgba(106, 90, 205, 0.18)', text: '#C8BFFF', dot: '#8B7EF8' };
      case 'delivered':
      case 'settled':
        return { label: 'DELIVERED', bg: 'rgba(16, 185, 129, 0.15)', text: '#34D399', dot: '#10B981' };
      case 'cancelled':
      case 'rejected':
        return { label: 'CANCELLED', bg: 'rgba(239, 68, 68, 0.15)', text: '#F87171', dot: '#EF4444' };
      default:
        return { label: 'CONFIRMED', bg: 'rgba(59, 130, 246, 0.15)', text: '#60A5FA', dot: '#3B82F6' };
    }
  };

  return (
    <Screen edges={['top']} style={{ backgroundColor: '#0E0E10' }}>
      <StitchHeader showNotifications={true} showCart={true} />

      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingTop: 16,
          paddingBottom: 110,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header Title with Live Counter */}
        <View className="flex-row items-center justify-between mb-4">
          <View>
            <Text
              style={{
                fontFamily: 'PlusJakartaSans',
                fontSize: 26,
                fontWeight: '800',
                color: '#E5E1E4',
                letterSpacing: -0.6,
              }}
            >
              Your Orders
            </Text>
            <Text
              style={{
                fontFamily: 'PlusJakartaSans',
                fontSize: 13,
                color: '#928F9E',
                marginTop: 2,
              }}
            >
              Track live deliveries & past purchase receipts
            </Text>
          </View>

          {activeCount > 1 ? (
            <Pressable
              onPress={() => router.push('/(customer)/active-orders')}
              style={{
                backgroundColor: 'rgba(106, 90, 205, 0.15)',
                borderWidth: 1,
                borderColor: 'rgba(106, 90, 205, 0.4)',
                paddingHorizontal: 12,
                paddingVertical: 6,
                borderRadius: 20,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 5,
              }}
            >
              <View
                style={{
                  width: 7,
                  height: 7,
                  borderRadius: 4,
                  backgroundColor: '#10B981',
                }}
              />
              <Text
                style={{
                  fontFamily: 'PlusJakartaSans',
                  fontSize: 11,
                  fontWeight: '700',
                  color: '#C8BFFF',
                }}
              >
                {activeCount} Live
              </Text>
            </Pressable>
          ) : null}
        </View>

        {/* Tab Switcher Pills */}
        <View
          style={{
            flexDirection: 'row',
            backgroundColor: '#18181B',
            borderRadius: 14,
            padding: 4,
            borderWidth: 1,
            borderColor: '#26262B',
            marginBottom: 20,
          }}
        >
          {(['active', 'completed', 'cancelled'] as OrderTab[]).map((tab) => {
            const isSelected = activeTab === tab;
            return (
              <Pressable
                key={tab}
                onPress={() => {
                  void Haptics.selectionAsync();
                  setActiveTab(tab);
                }}
                style={{
                  flex: 1,
                  paddingVertical: 9,
                  alignItems: 'center',
                  borderRadius: 10,
                  backgroundColor: isSelected ? '#2A2930' : 'transparent',
                }}
              >
                <View className="flex-row items-center gap-1.5">
                  <Text
                    style={{
                      fontFamily: 'PlusJakartaSans',
                      fontSize: 13,
                      fontWeight: isSelected ? '700' : '500',
                      color: isSelected ? '#FFFFFF' : '#928F9E',
                      textTransform: 'capitalize',
                    }}
                  >
                    {tab}
                  </Text>
                  {tab === 'active' && activeCount > 0 ? (
                    <View
                      style={{
                        backgroundColor: '#6A5ACD',
                        paddingHorizontal: 6,
                        paddingVertical: 1,
                        borderRadius: 10,
                      }}
                    >
                      <Text
                        style={{
                          fontFamily: 'PlusJakartaSans',
                          fontSize: 10,
                          fontWeight: '800',
                          color: '#FFFFFF',
                        }}
                      >
                        {activeCount}
                      </Text>
                    </View>
                  ) : null}
                </View>
              </Pressable>
            );
          })}
        </View>

        {/* Orders List */}
        {filteredOrders.length === 0 ? (
          <View
            style={{
              backgroundColor: '#18181B',
              borderRadius: 20,
              borderWidth: 1,
              borderColor: '#26262B',
              padding: 36,
              alignItems: 'center',
              justifyContent: 'center',
              marginTop: 10,
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
              <ShoppingBag size={28} color="#6A5ACD" />
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
              No {activeTab} orders
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
              {activeTab === 'active'
                ? "You don't have any ongoing deliveries right now. Order food, fresh groceries, or summon a Genie!"
                : `Your ${activeTab} delivery orders will be archived right here.`}
            </Text>

            {activeTab === 'active' ? (
              <Pressable
                onPress={() => router.push('/(customer)/services' as any)}
                style={{
                  backgroundColor: '#6A5ACD',
                  paddingHorizontal: 20,
                  paddingVertical: 11,
                  borderRadius: 12,
                }}
              >
                <Text
                  style={{
                    fontFamily: 'PlusJakartaSans',
                    fontSize: 13,
                    fontWeight: '700',
                    color: '#FFFFFF',
                  }}
                >
                  Explore Services
                </Text>
              </Pressable>
            ) : null}
          </View>
        ) : (
          <View className="gap-4">
            {filteredOrders.map((order) => {
              const statusPill = getStatusPill(order.status);
              const isLive = !isTerminal(order.status);
              const storeTitle =
                order.storeName ||
                (order.category === 'food'
                  ? 'Murugan Idli Shop'
                  : order.category === 'grocery'
                  ? 'Reliance Smart Bazar'
                  : 'Doorstep Courier Hub');

              return (
                <DFCPressable
                  key={order.id}
                  scaleTo={0.975}
                  onPress={() => router.push(`/(customer)/order/${order.id}`)}
                  style={{
                    backgroundColor: '#18181B',
                    borderRadius: 20,
                    borderWidth: 1,
                    borderColor: isLive ? 'rgba(106, 90, 205, 0.4)' : '#26262B',
                    padding: 16,
                    position: 'relative',
                    overflow: 'hidden',
                    shadowColor: '#000000',
                    shadowOpacity: 0.2,
                    shadowRadius: 8,
                    shadowOffset: { width: 0, height: 3 },
                    elevation: 3,
                  }}
                >
                  {/* Subtle live indicator strip */}
                  {isLive ? (
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
                  ) : null}

                  {/* Header Row */}
                  <View className="flex-row items-start justify-between mb-3.5">
                    <View className="flex-row items-center gap-3">
                      <View
                        style={{
                          width: 42,
                          height: 42,
                          borderRadius: 14,
                          backgroundColor: getCategoryBg(order.category),
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        {getCategoryIcon(order.category)}
                      </View>
                      <View>
                        <Text
                          style={{
                            fontFamily: 'PlusJakartaSans',
                            fontSize: 16,
                            fontWeight: '700',
                            color: '#E5E1E4',
                          }}
                        >
                          {order.category === 'food'
                            ? 'Food Order'
                            : order.category === 'grocery'
                            ? 'Grocery Basket'
                            : order.category === 'print'
                            ? 'Print & Xerox'
                            : 'Express Task'}
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
                        </Text>
                      </View>
                    </View>

                    <View className="items-end">
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
                          backgroundColor: statusPill.bg,
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
                            backgroundColor: statusPill.dot,
                          }}
                        />
                        <Text
                          style={{
                            fontFamily: 'PlusJakartaSans',
                            fontSize: 10,
                            fontWeight: '800',
                            color: statusPill.text,
                            letterSpacing: 0.4,
                          }}
                        >
                          {statusPill.label}
                        </Text>
                      </View>
                    </View>
                  </View>

                  {/* Pickup & Drop Route Mini Preview */}
                  <View
                    style={{
                      backgroundColor: '#121215',
                      borderRadius: 12,
                      padding: 12,
                      marginVertical: 4,
                    }}
                  >
                    <View style={{ paddingLeft: 10, position: 'relative' }}>
                      {/* Connecting Line */}
                      <View
                        style={{
                          position: 'absolute',
                          left: 14,
                          top: 8,
                          bottom: 8,
                          width: 1.5,
                          backgroundColor: '#2E2D34',
                        }}
                      />

                      {/* Pickup */}
                      <View className="flex-row items-center gap-2.5 mb-2.5">
                        <View
                          style={{
                            width: 8,
                            height: 8,
                            borderRadius: 4,
                            backgroundColor: '#928F9E',
                          }}
                        />
                        <Text
                          numberOfLines={1}
                          style={{
                            fontFamily: 'PlusJakartaSans',
                            fontSize: 12,
                            fontWeight: '500',
                            color: '#C9C5D0',
                            flex: 1,
                          }}
                        >
                          {storeTitle}
                        </Text>
                      </View>

                      {/* Drop */}
                      <View className="flex-row items-center gap-2.5">
                        <View
                          style={{
                            width: 9,
                            height: 9,
                            borderRadius: 5,
                            backgroundColor: '#6A5ACD',
                            borderWidth: 1.5,
                            borderColor: '#C8BFFF',
                          }}
                        />
                        <Text
                          numberOfLines={1}
                          style={{
                            fontFamily: 'PlusJakartaSans',
                            fontSize: 12,
                            fontWeight: '600',
                            color: '#E5E1E4',
                            flex: 1,
                          }}
                        >
                          {order.addressLine || 'Home · Anna Nagar, Madurai'}
                        </Text>
                      </View>
                    </View>
                  </View>

                  {/* Footer Row */}
                  <View
                    style={{
                      borderTopWidth: 1,
                      borderTopColor: '#26262B',
                      paddingTop: 12,
                      marginTop: 10,
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <Text
                      style={{
                        fontFamily: 'PlusJakartaSans',
                        fontSize: 12,
                        color: '#928F9E',
                      }}
                    >
                      {new Date(order.createdAt).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </Text>

                    <View className="flex-row items-center gap-1.5">
                      <Text
                        style={{
                          fontFamily: 'PlusJakartaSans',
                          fontSize: 13,
                          fontWeight: '700',
                          color: isLive ? '#C8BFFF' : '#A1A1AA',
                        }}
                      >
                        {isLive ? 'Track Live' : 'View Receipt'}
                      </Text>
                      <ChevronRight size={15} color={isLive ? '#C8BFFF' : '#A1A1AA'} />
                    </View>
                  </View>
                </DFCPressable>
              );
            })}
          </View>
        )}
      </ScrollView>

      <StitchNav activeTab="orders" />
    </Screen>
  );
}
