/**
 * Mobile / Tablet Kitchen Display System (KDS) Screen for Merchants.
 *
 * High-contrast, large-touch interface designed for kitchen counter mounts.
 * Features Kanban status bumping and a 1-tap dish 86 (out-of-stock) tool.
 */

import * as React from 'react';
import {
  Modal,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import {
  ArrowLeft,
  CookingPot,
  Flame,
  PackageCheck,
  Search,
  Truck,
  UtensilsCrossed,
  XCircle,
} from 'lucide-react-native';

import {
  formatInr,
  getKdsStage,
  type KdsStage,
  type Order,
  type OrderStatus,
  type Product,
} from '@dfc/core';

import { getStoreProducts, patchProduct, subscribeStoreOrders } from '@/lib/catalogue';

export default function VendorKdsScreen() {
  const router = useRouter();
  const [orders, setOrders] = React.useState<Order[]>([]);
  const [products, setProducts] = React.useState<Product[]>([]);
  const [activeStage, setActiveStage] = React.useState<KdsStage>('new');
  const [eightySixOpen, setEightySixOpen] = React.useState(false);
  const [dishSearch, setDishSearch] = React.useState('');

  const storeId = 'simmakkal-konar-mess';

  React.useEffect(() => {
    return subscribeStoreOrders(storeId, (list) => {
      setOrders(list);
    });
  }, [storeId]);

  React.useEffect(() => {
    void getStoreProducts(storeId).then(setProducts);
  }, [storeId]);

  const filteredOrders = React.useMemo(() => {
    return orders.filter((o) => getKdsStage(o.status) === activeStage);
  }, [orders, activeStage]);

  const handleBumpStatus = (order: Order, nextStatus: OrderStatus) => {
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    // Locally reflect bump
    setOrders((prev) =>
      prev.map((o) => (o.id === order.id ? { ...o, status: nextStatus } : o)),
    );
  };

  const handleToggleProduct = (productId: string, currentActive: boolean) => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    void patchProduct(productId, { isActive: !currentActive });
    setProducts((prev) =>
      prev.map((p) => (p.id === productId ? { ...p, isActive: !currentActive } : p)),
    );
  };

  const filteredDishes = React.useMemo(() => {
    if (!dishSearch.trim()) return products;
    const q = dishSearch.toLowerCase().trim();
    return products.filter(
      (p) => p.name.toLowerCase().includes(q) || (p.nameTa && p.nameTa.includes(q)),
    );
  }, [products, dishSearch]);

  return (
    <SafeAreaView style={styles.container}>
      {/* KDS Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={20} color="#F4F4F5" />
        </Pressable>

        <View style={{ flex: 1 }}>
          <View style={styles.headerTitleRow}>
            <Text style={styles.headerTitle}>Kitchen Tablet KDS</Text>
            <View style={styles.liveDot} />
          </View>
          <Text style={styles.headerSub}>Simmakkal Konar Mess · Kitchen Counter</Text>
        </View>

        <Pressable
          onPress={() => setEightySixOpen(true)}
          style={styles.eightySixTrigger}
        >
          <XCircle size={15} color="#EF4444" />
          <Text style={styles.eightySixTriggerText}>86 Dish</Text>
        </Pressable>
      </View>

      {/* Stage Navigation Pills */}
      <View style={styles.stageTabs}>
        {[
          { key: 'new' as KdsStage, label: 'New', icon: Flame, color: '#3B82F6' },
          { key: 'preparing' as KdsStage, label: 'Cooking', icon: CookingPot, color: '#F59E0B' },
          { key: 'ready' as KdsStage, label: 'Ready', icon: PackageCheck, color: '#10B981' },
          { key: 'dispatched' as KdsStage, label: 'En Route', icon: Truck, color: '#8B5CF6' },
        ].map(({ key, label, icon: Icon, color }) => {
          const isSelected = activeStage === key;
          const count = orders.filter((o) => getKdsStage(o.status) === key).length;
          return (
            <Pressable
              key={key}
              onPress={() => {
                void Haptics.selectionAsync();
                setActiveStage(key);
              }}
              style={[styles.stageTab, isSelected && styles.stageTabActive]}
            >
              <Icon size={16} color={isSelected ? color : '#71717A'} />
              <Text style={[styles.stageTabText, isSelected && { color }]}>
                {label} ({count})
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* Orders Stream */}
      <ScrollView contentContainerStyle={styles.ordersContent}>
        {filteredOrders.length === 0 ? (
          <View style={styles.emptyContainer}>
            <UtensilsCrossed size={36} color="#3F3F46" />
            <Text style={styles.emptyText}>No orders in {activeStage} queue</Text>
          </View>
        ) : (
          filteredOrders.map((order) => (
            <View key={order.id} style={styles.orderCard}>
              <View style={styles.orderCardHeader}>
                <View>
                  <Text style={styles.orderCode}>#{order.code}</Text>
                  <Text style={styles.customerName}>{order.customerName}</Text>
                </View>
                <View style={styles.pricePill}>
                  <Text style={styles.pricePillText}>{formatInr(order.pricing.itemsPaise)}</Text>
                </View>
              </View>

              {/* Items List */}
              <View style={styles.itemsBox}>
                {order.items.map((item, idx) => (
                  <View key={idx} style={styles.itemRow}>
                    <Text style={styles.itemName}>
                      <Text style={styles.itemQty}>{item.quantity}×</Text> {item.name}
                    </Text>
                    <Text style={styles.itemUnit}>{item.unit}</Text>
                  </View>
                ))}
              </View>

              {/* Gate / Delivery Note */}
              {order.instructions && (
                <View style={styles.noteBox}>
                  <Text style={styles.noteText}>
                    ⚠️ {order.instructions.textNote || order.instructions.tags.join(', ')}
                  </Text>
                </View>
              )}

              {/* Action Buttons based on stage */}
              {activeStage === 'new' && (
                <Pressable
                  onPress={() => handleBumpStatus(order, 'packing')}
                  style={[styles.actionButton, { backgroundColor: '#2563EB' }]}
                >
                  <Text style={styles.actionButtonText}>Start Cooking 🍳</Text>
                </Pressable>
              )}

              {activeStage === 'preparing' && (
                <Pressable
                  onPress={() => handleBumpStatus(order, 'ready_for_pickup')}
                  style={[styles.actionButton, { backgroundColor: '#D97706' }]}
                >
                  <Text style={styles.actionButtonText}>Mark Ready on Counter 📦</Text>
                </Pressable>
              )}

              {activeStage === 'ready' && (
                <Pressable
                  onPress={() => handleBumpStatus(order, 'picked_up')}
                  style={[styles.actionButton, { backgroundColor: '#059669' }]}
                >
                  <Text style={styles.actionButtonText}>Handover to Captain ({order.riderName || 'Rider'}) 🛵</Text>
                </Pressable>
              )}

              {activeStage === 'dispatched' && (
                <View style={styles.dispatchedInfo}>
                  <Truck size={14} color="#8B5CF6" />
                  <Text style={styles.dispatchedText}>
                    En route with {order.riderName || 'Captain'}
                  </Text>
                </View>
              )}
            </View>
          ))
        )}
      </ScrollView>

      {/* 1-Tap Out-of-Stock Modal */}
      <Modal visible={eightySixOpen} animationType="slide" transparent>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Rush Hour 86 Desk</Text>
                <Text style={styles.modalSub}>Tap any dish to immediately disable it</Text>
              </View>
              <Pressable onPress={() => setEightySixOpen(false)} style={styles.modalClose}>
                <Text style={{ color: '#A1A1AA', fontSize: 16 }}>✕</Text>
              </Pressable>
            </View>

            <View style={styles.searchBar}>
              <Search size={16} color="#71717A" />
              <TextInput
                value={dishSearch}
                onChangeText={setDishSearch}
                placeholder="Search dish (e.g. Parotta, Kari Dosa)..."
                placeholderTextColor="#71717A"
                style={styles.searchInput}
              />
            </View>

            <ScrollView style={{ maxHeight: 380 }}>
              {filteredDishes.map((dish) => (
                <View key={dish.id} style={styles.dishRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.dishName, !dish.isActive && styles.dishNameCrossed]}>
                      {dish.name}
                    </Text>
                    {dish.nameTa && <Text style={styles.dishTa}>{dish.nameTa}</Text>}
                  </View>
                  <Pressable
                    onPress={() => handleToggleProduct(dish.id, dish.isActive)}
                    style={[
                      styles.dishToggle,
                      dish.isActive ? styles.dishToggleActive : styles.dishToggleInactive,
                    ]}
                  >
                    <Text style={styles.dishToggleText}>
                      {dish.isActive ? '86 DISH' : 'IN STOCK'}
                    </Text>
                  </Pressable>
                </View>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#09090B',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#27272A',
    gap: 12,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#18181B',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#27272A',
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#F4F4F5',
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10B981',
  },
  headerSub: {
    fontSize: 11,
    color: '#71717A',
  },
  eightySixTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#7F1D1D30',
    borderWidth: 1,
    borderColor: '#EF444450',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  eightySixTriggerText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#EF4444',
  },
  stageTabs: {
    flexDirection: 'row',
    padding: 8,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#27272A',
    backgroundColor: '#18181B50',
  },
  stageTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#18181B',
    borderWidth: 1,
    borderColor: '#27272A',
  },
  stageTabActive: {
    borderColor: '#3F3F46',
    backgroundColor: '#27272A',
  },
  stageTabText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#A1A1AA',
  },
  ordersContent: {
    padding: 16,
    gap: 14,
  },
  emptyContainer: {
    height: 200,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  emptyText: {
    fontSize: 13,
    color: '#52525B',
  },
  orderCard: {
    backgroundColor: '#18181B',
    borderWidth: 1,
    borderColor: '#27272A',
    borderRadius: 16,
    padding: 16,
    gap: 12,
  },
  orderCardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  orderCode: {
    fontSize: 18,
    fontWeight: '900',
    fontFamily: 'monospace',
    color: '#FFFFFF',
  },
  customerName: {
    fontSize: 12,
    color: '#A1A1AA',
    marginTop: 2,
  },
  pricePill: {
    backgroundColor: '#27272A',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  pricePillText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#34D399',
  },
  itemsBox: {
    backgroundColor: '#09090B',
    borderRadius: 10,
    padding: 10,
    gap: 6,
    borderWidth: 1,
    borderColor: '#27272A',
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  itemName: {
    fontSize: 13,
    color: '#E4E4E7',
    fontWeight: '500',
  },
  itemQty: {
    color: '#F59E0B',
    fontWeight: '800',
  },
  itemUnit: {
    fontSize: 11,
    color: '#71717A',
  },
  noteBox: {
    backgroundColor: '#78350F20',
    borderWidth: 1,
    borderColor: '#F59E0B40',
    borderRadius: 8,
    padding: 8,
  },
  noteText: {
    fontSize: 11,
    color: '#FDE68A',
  },
  actionButton: {
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  dispatchedInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    justifyContent: 'center',
  },
  dispatchedText: {
    fontSize: 12,
    color: '#C4B5FD',
    fontWeight: '600',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    padding: 16,
  },
  modalCard: {
    backgroundColor: '#18181B',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#27272A',
    padding: 18,
    gap: 12,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  modalSub: {
    fontSize: 11,
    color: '#71717A',
    marginTop: 2,
  },
  modalClose: {
    padding: 4,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#09090B',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#27272A',
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  searchInput: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 13,
  },
  dishRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#27272A',
  },
  dishName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#F4F4F5',
  },
  dishNameCrossed: {
    textDecorationLine: 'line-through',
    color: '#71717A',
  },
  dishTa: {
    fontSize: 11,
    color: '#71717A',
  },
  dishToggle: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  dishToggleActive: {
    backgroundColor: '#DC2626',
  },
  dishToggleInactive: {
    backgroundColor: '#16A34A',
  },
  dishToggleText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
