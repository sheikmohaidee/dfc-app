/**
 * DFC Orders History Screen - Full Stitch Design Implementation
 * Includes Active / Completed / Cancelled tabs, Order Cards with Status Stripes,
 * and Pickup & Drop timeline routes.
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
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

import { formatInr, isTerminal, type Order } from '@dfc/core';
import { useAuth } from '@/providers/auth';
import { subscribeMyOrders } from '@/lib/orders';
import { Screen } from '@/ui';
import { TopAppBar } from '@/ui/top-app-bar';
import { DFCBottomNav } from '@/ui/bottom-nav';

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
      case 'pharmacy':
        return <Pill size={16} color="#1E40AF" />;
      case 'grocery':
        return <ShoppingBag size={16} color="#065F46" />;
      case 'print':
        return <Printer size={16} color="#7A1F3D" />;
      default:
        return <Utensils size={16} color="#7A1F3D" />;
    }
  };

  const getStatusPill = (status: string) => {
    switch (status) {
      case 'in_transit':
      case 'delivering':
        return { label: 'IN TRANSIT', bg: '#FFD9E0', text: '#782C44' };
      case 'preparing':
      case 'packing':
        return { label: 'PREPARING', bg: '#FFD9E0', text: '#782C44' };
      case 'delivered':
      case 'settled':
        return { label: 'DELIVERED', bg: '#ECFDF5', text: '#065F46' };
      case 'cancelled':
      case 'rejected':
        return { label: 'CANCELLED', bg: '#FFDAD6', text: '#BA1A1A' };
      default:
        return { label: 'CONFIRMED', bg: '#E9EDFF', text: '#1E40AF' };
    }
  };

  return (
    <Screen edges={['top']}>
      <TopAppBar title="Anna Nagar" showNotifications={true} />

      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingTop: 16,
          paddingBottom: 40,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Page Title */}
        <Text
          style={{
            fontFamily: 'Archivo',
            fontSize: 28,
            fontWeight: '800',
            color: '#141B2B',
            letterSpacing: -0.6,
            marginBottom: 16,
          }}
        >
          Your Orders
        </Text>

        {/* Tabs: Active / Completed / Cancelled */}
        <View
          style={{
            flexDirection: 'row',
            borderBottomWidth: 1,
            borderBottomColor: '#DAC0C4',
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
                  paddingVertical: 10,
                  alignItems: 'center',
                  borderBottomWidth: isSelected ? 2.5 : 0,
                  borderBottomColor: '#7A1F3D',
                }}
              >
                <Text
                  style={{
                    fontFamily: 'Archivo',
                    fontSize: 14,
                    fontWeight: isSelected ? '700' : '500',
                    color: isSelected ? '#7A1F3D' : '#554245',
                    textTransform: 'capitalize',
                  }}
                >
                  {tab}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* Orders List */}
        {filteredOrders.length === 0 ? (
          <View
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: 16,
              borderWidth: 1,
              borderColor: '#DAC0C4',
              padding: 32,
              alignItems: 'center',
              justifyContent: 'center',
              marginTop: 12,
            }}
          >
            <ShoppingBag size={40} color="#DAC0C4" />
            <Text
              style={{
                fontFamily: 'Archivo',
                fontSize: 16,
                fontWeight: '700',
                color: '#141B2B',
                marginTop: 12,
              }}
            >
              No {activeTab} orders
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
              Your {activeTab} order history will appear right here.
            </Text>
          </View>
        ) : (
          <View className="gap-4">
            {filteredOrders.map((order) => {
              const statusPill = getStatusPill(order.status);
              const isLive = !isTerminal(order.status);
              const storeTitle =
                order.storeName ||
                (order.category === 'food'
                  ? 'Murugan Idli Shop, Madurai Main'
                  : order.category === 'pharmacy'
                  ? 'Meenakshi Medicals'
                  : 'Reliance Fresh, KK Nagar');

              return (
                <Pressable
                  key={order.id}
                  onPress={() => router.push(`/(customer)/order/${order.id}`)}
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
                  {/* Status Indicator Stripe */}
                  <View
                    style={{
                      position: 'absolute',
                      top: 0,
                      right: 0,
                      width: 5,
                      height: '100%',
                      backgroundColor: isLive ? '#7A1F3D' : '#9CA3AF',
                    }}
                  />

                  {/* Header Row */}
                  <View className="flex-row items-start justify-between mb-3 pr-2">
                    <View className="flex-row items-center gap-3">
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
                        {getCategoryIcon(order.category)}
                      </View>
                      <View>
                        <Text style={{ fontFamily: 'Archivo', fontSize: 16, fontWeight: '700', color: '#141B2B' }}>
                          {order.category === 'food'
                            ? 'Food Delivery'
                            : order.category === 'pharmacy'
                            ? 'Pharmacy Order'
                            : 'Grocery Run'}
                        </Text>
                        <Text style={{ fontFamily: 'Archivo', fontSize: 12, color: '#554245' }}>
                          ORD-{order.code}
                        </Text>
                      </View>
                    </View>

                    <View className="items-end">
                      <Text style={{ fontFamily: 'Archivo', fontSize: 16, fontWeight: '800', color: '#141B2B' }}>
                        {formatInr(order.pricing.totalPaise)}
                      </Text>
                      <View
                        style={{
                          backgroundColor: statusPill.bg,
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
                            color: statusPill.text,
                            letterSpacing: 0.5,
                          }}
                        >
                          {statusPill.label}
                        </Text>
                      </View>
                    </View>
                  </View>

                  {/* Pickup & Drop Timeline Nodes */}
                  <View style={{ paddingLeft: 12, marginVertical: 8, position: 'relative' }}>
                    {/* Connecting Line */}
                    <View
                      style={{
                        position: 'absolute',
                        left: 17,
                        top: 8,
                        bottom: 8,
                        width: 2,
                        backgroundColor: '#DAC0C4',
                      }}
                    />

                    {/* Pickup Node */}
                    <View className="flex-row items-start gap-3 mb-3">
                      <View
                        style={{
                          width: 10,
                          height: 10,
                          borderRadius: 5,
                          backgroundColor: '#887275',
                          marginTop: 4,
                        }}
                      />
                      <View>
                        <Text style={{ fontFamily: 'Archivo', fontSize: 11, fontWeight: '600', color: '#554245' }}>
                          Pickup
                        </Text>
                        <Text style={{ fontFamily: 'Archivo', fontSize: 13, fontWeight: '500', color: '#141B2B' }}>
                          {storeTitle}
                        </Text>
                      </View>
                    </View>

                    {/* Drop Node */}
                    <View className="flex-row items-start gap-3">
                      <View
                        style={{
                          width: 12,
                          height: 12,
                          borderRadius: 6,
                          backgroundColor: '#7A1F3D',
                          borderWidth: 2,
                          borderColor: '#FFFFFF',
                          marginTop: 3,
                        }}
                      />
                      <View>
                        <Text style={{ fontFamily: 'Archivo', fontSize: 11, fontWeight: '600', color: '#554245' }}>
                          Drop
                        </Text>
                        <Text style={{ fontFamily: 'Archivo', fontSize: 13, fontWeight: '500', color: '#141B2B' }}>
                          Home - Anna Nagar
                        </Text>
                      </View>
                    </View>
                  </View>

                  {/* Footer Row */}
                  <View
                    style={{
                      borderTopWidth: 1,
                      borderTopColor: '#DAC0C440',
                      paddingTop: 10,
                      marginTop: 6,
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <Text style={{ fontFamily: 'Archivo', fontSize: 12, color: '#554245' }}>
                      {new Date(order.createdAt).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </Text>

                    <Text style={{ fontFamily: 'Archivo', fontSize: 13, fontWeight: '700', color: '#7A1F3D' }}>
                      {isLive ? 'Track Order →' : 'View Details →'}
                    </Text>
                  </View>
                </Pressable>
              );
            })}
          </View>
        )}
      </ScrollView>

      <DFCBottomNav activeTab="orders" />
    </Screen>
  );
}
