/**
 * Stitch 08 — Shopping List Details Screen
 * List inspection, item ticking, quantity adjustments,
 * and 1-tap checkout transfer to cart.
 */

import * as React from 'react';
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  ArrowLeft,
  Check,
  ChevronRight,
  ListChecks,
  Minus,
  Plus,
  RefreshCw,
  Share2,
  ShoppingBag,
  Sparkles,
  Trash2,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { formatInr } from '@dfc/core';
import { useCart } from '@/providers/cart';
import { FloatingCard, GlowBadge, Screen } from '@/ui';
import type { ShoppingList, ShoppingListItem } from './index';

const STORAGE_KEY = 'dfc.shopping_lists.v1';

export default function ShoppingListDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const groceryCart = useCart('grocery');

  const [list, setList] = React.useState<ShoppingList | null>(null);
  const [showAddItem, setShowAddItem] = React.useState(false);
  const [newItemName, setNewItemName] = React.useState('');
  const [newItemUnit, setNewItemUnit] = React.useState('1 unit');

  React.useEffect(() => {
    void AsyncStorage.getItem(STORAGE_KEY).then((raw) => {
      if (raw) {
        try {
          const all: ShoppingList[] = JSON.parse(raw);
          const found = all.find((l) => l.id === id);
          if (found) setList(found);
        } catch {}
      }
    });
  }, [id]);

  const updateList = async (updated: ShoppingList) => {
    setList(updated);
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (raw) {
        const all: ShoppingList[] = JSON.parse(raw);
        const next = all.map((l) => (l.id === updated.id ? updated : l));
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      }
    } catch {}
  };

  if (!list) {
    return (
      <Screen edges={['top']} className="bg-surface-container-lowest justify-center items-center">
        <Text className="text-on-surface">Loading Shopping List...</Text>
      </Screen>
    );
  }

  const toggleCheck = (itemId: string) => {
    void Haptics.selectionAsync();
    const items = list.items.map((it) =>
      it.id === itemId ? { ...it, checked: !it.checked } : it,
    );
    void updateList({ ...list, items });
  };

  const changeQty = (itemId: string, delta: number) => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const items = list.items.map((it) => {
      if (it.id === itemId) {
        const nextQ = Math.max(1, it.quantity + delta);
        return { ...it, quantity: nextQ };
      }
      return it;
    });
    void updateList({ ...list, items });
  };

  const deleteItem = (itemId: string) => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const items = list.items.filter((it) => it.id !== itemId);
    void updateList({ ...list, items, itemCount: items.length });
  };

  const handleAddNewItem = () => {
    if (!newItemName.trim()) return;
    const newItem: ShoppingListItem = {
      id: `it-${Date.now()}`,
      name: newItemName.trim(),
      quantity: 1,
      unit: newItemUnit.trim() || '1 item',
      mappedPricePaise: 4500,
    };
    const items = [...list.items, newItem];
    void updateList({ ...list, items, itemCount: items.length });
    setNewItemName('');
    setShowAddItem(false);
  };

  const checkedItems = list.items.filter((it) => it.checked);
  const totalEstimatedPaise = list.items.reduce(
    (acc, it) => acc + (it.mappedPricePaise || 4000) * it.quantity,
    0,
  );

  const handleTransferToCart = async () => {
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    for (const it of list.items) {
      await groceryCart.addItem({
        id: it.id,
        sourceId: 'store-demo-supermarket-1',
        sourceName: 'DFC Partner Supermarket',
        sourceCategory: 'grocery',
        localityId: 'central-madurai',
        name: it.name,
        unit: it.unit,
        pricePaise: it.mappedPricePaise || 4000,
        quantity: it.quantity,
      });
    }
    router.push('/(customer)/cart?service=grocery');
  };

  return (
    <Screen edges={['top']} className="bg-surface-container-lowest">
      {/* Header */}
      <View
        style={{
          height: 56,
          paddingHorizontal: 16,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottomWidth: 1,
          borderBottomColor: '#201F21',
        }}
      >
        <Pressable
          onPress={() => router.back()}
          style={{
            width: 38,
            height: 38,
            borderRadius: 19,
            backgroundColor: '#1C1B1D',
            borderWidth: 1,
            borderColor: '#2A2A2C',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <ArrowLeft size={19} color="#E5E1E4" strokeWidth={2.2} />
        </Pressable>

        <View className="flex-1 px-3">
          <Text
            numberOfLines={1}
            style={{ fontSize: 16, fontWeight: '700', color: '#E5E1E4' }}
          >
            {list.title}
          </Text>
          <Text style={{ fontSize: 11, color: '#928F9E' }}>
            {list.items.length} items mapped
          </Text>
        </View>

        <Pressable
          onPress={() => setShowAddItem(true)}
          style={{
            backgroundColor: '#6A5ACD',
            paddingHorizontal: 12,
            paddingVertical: 7,
            borderRadius: 10,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 4,
          }}
        >
          <Plus size={14} color="#FFFFFF" strokeWidth={2.5} />
          <Text style={{ fontSize: 11, fontWeight: '700', color: '#FFFFFF' }}>Add</Text>
        </Pressable>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 14, paddingBottom: 110 }}
      >
        {/* Summary Card */}
        <FloatingCard className="p-4 mb-4 bg-surface-container-low border-surface-container-high">
          <View className="flex-row items-center justify-between mb-2">
            <View>
              <Text className="text-xs text-on-surface-variant font-medium">Estimated Total</Text>
              <Text className="text-xl font-extrabold font-mono text-on-surface">
                {formatInr(totalEstimatedPaise)}
              </Text>
            </View>
            <GlowBadge
              label={`${checkedItems.length}/${list.items.length} GATHERED`}
              tone={checkedItems.length === list.items.length ? 'success' : 'primary'}
            />
          </View>

          {/* Progress Segment Bar */}
          <View className="h-2 rounded-full bg-surface-container-highest mb-2 overflow-hidden">
            <View
              style={{
                width: `${list.items.length > 0 ? (checkedItems.length / list.items.length) * 100 : 0}%`,
                height: '100%',
                backgroundColor: '#6A5ACD',
              }}
            />
          </View>
        </FloatingCard>

        {/* Action Quick Pills */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 8, paddingBottom: 14 }}
        >
          <Pressable
            onPress={() => {
              const allChecked = list.items.every((it) => it.checked);
              const items = list.items.map((it) => ({ ...it, checked: !allChecked }));
              void updateList({ ...list, items });
            }}
            style={{
              backgroundColor: '#1C1B1D',
              borderColor: '#2A2A2C',
              borderWidth: 1,
              borderRadius: 9999,
              paddingHorizontal: 12,
              paddingVertical: 6,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 4,
            }}
          >
            <Check size={12} color="#C8BFFF" />
            <Text style={{ fontSize: 11, fontWeight: '600', color: '#C9C4D5' }}>
              Toggle All
            </Text>
          </Pressable>

          <Pressable
            onPress={() => router.push('/(customer)/shopping-list/review' as any)}
            style={{
              backgroundColor: '#1C1B1D',
              borderColor: '#2A2A2C',
              borderWidth: 1,
              borderRadius: 9999,
              paddingHorizontal: 12,
              paddingVertical: 6,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 4,
            }}
          >
            <Sparkles size={12} color="#C8BFFF" />
            <Text style={{ fontSize: 11, fontWeight: '600', color: '#C8BFFF' }}>
              AI Re-parse
            </Text>
          </Pressable>
        </ScrollView>

        {/* List Items Stack */}
        <View className="gap-2.5">
          {list.items.map((item) => (
            <View
              key={item.id}
              style={{
                backgroundColor: '#1C1B1D',
                borderColor: item.checked ? '#353437' : '#2A2A2C',
                borderWidth: 1,
                borderRadius: 16,
                padding: 12,
                flexDirection: 'row',
                alignItems: 'center',
                opacity: item.checked ? 0.75 : 1,
              }}
            >
              {/* Checkbox */}
              <Pressable
                onPress={() => toggleCheck(item.id)}
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: 6,
                  backgroundColor: item.checked ? '#6A5ACD' : '#131315',
                  borderColor: item.checked ? '#6A5ACD' : '#474553',
                  borderWidth: 1.5,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: 12,
                }}
              >
                {item.checked ? <Check size={14} color="#FFFFFF" strokeWidth={3} /> : null}
              </Pressable>

              {/* Item info */}
              <View className="flex-1 mr-2">
                <Text
                  style={{
                    fontSize: 13.5,
                    fontWeight: '700',
                    color: item.checked ? '#928F9E' : '#E5E1E4',
                    textDecorationLine: item.checked ? 'line-through' : 'none',
                  }}
                >
                  {item.name}
                </Text>
                <Text style={{ fontSize: 11, color: '#928F9E' }}>
                  {item.unit} · {formatInr((item.mappedPricePaise || 4000) * item.quantity)}
                </Text>
              </View>

              {/* Stepper */}
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  backgroundColor: '#2A2A2C',
                  borderRadius: 8,
                  paddingHorizontal: 4,
                  height: 30,
                  marginRight: 8,
                }}
              >
                <Pressable
                  onPress={() => changeQty(item.id, -1)}
                  style={{ paddingHorizontal: 6, paddingVertical: 4 }}
                >
                  <Minus size={12} color="#E5E1E4" strokeWidth={2.5} />
                </Pressable>
                <Text style={{ fontSize: 12, fontWeight: '800', color: '#FFFFFF', paddingHorizontal: 4 }}>
                  {item.quantity}
                </Text>
                <Pressable
                  onPress={() => changeQty(item.id, 1)}
                  style={{ paddingHorizontal: 6, paddingVertical: 4 }}
                >
                  <Plus size={12} color="#C8BFFF" strokeWidth={2.5} />
                </Pressable>
              </View>

              {/* Delete button */}
              <Pressable onPress={() => deleteItem(item.id)} hitSlop={8} className="p-1">
                <Trash2 size={15} color="#928F9E" />
              </Pressable>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Sticky Bottom Transfer to Cart */}
      <View
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          backgroundColor: '#0E0E10',
          borderTopWidth: 1,
          borderTopColor: '#201F21',
          paddingHorizontal: 16,
          paddingTop: 12,
          paddingBottom: 24,
        }}
      >
        <Pressable
          onPress={handleTransferToCart}
          style={{
            height: 48,
            backgroundColor: '#6A5ACD',
            borderRadius: 16,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            shadowColor: '#6A5ACD',
            shadowOpacity: 0.35,
            shadowRadius: 10,
            elevation: 4,
          }}
        >
          <ShoppingBag size={18} color="#FFFFFF" strokeWidth={2} />
          <Text style={{ fontSize: 14, fontWeight: '800', color: '#FFFFFF' }}>
            Transfer to Grocery Cart ({formatInr(totalEstimatedPaise)})
          </Text>
        </Pressable>
      </View>

      {/* Add Item Modal */}
      <Modal visible={showAddItem} transparent animationType="fade">
        <View className="flex-1 justify-center items-center bg-black/70 px-4">
          <View
            style={{
              width: '100%',
              backgroundColor: '#1C1B1D',
              borderRadius: 20,
              padding: 20,
              borderWidth: 1,
              borderColor: '#2A2A2C',
            }}
          >
            <Text className="text-base font-bold text-on-surface mb-3">Add Item to List</Text>
            <TextInput
              value={newItemName}
              onChangeText={setNewItemName}
              placeholder="Item name (e.g. Cardamom 50g)"
              placeholderTextColor="#928F9E"
              autoFocus
              style={{
                backgroundColor: '#131315',
                borderColor: '#2A2A2C',
                borderWidth: 1,
                borderRadius: 12,
                paddingHorizontal: 14,
                paddingVertical: 10,
                color: '#E5E1E4',
                fontSize: 14,
                marginBottom: 10,
              }}
            />
            <TextInput
              value={newItemUnit}
              onChangeText={setNewItemUnit}
              placeholder="Unit (e.g. 50g, 1 pkt, 2 pcs)"
              placeholderTextColor="#928F9E"
              style={{
                backgroundColor: '#131315',
                borderColor: '#2A2A2C',
                borderWidth: 1,
                borderRadius: 12,
                paddingHorizontal: 14,
                paddingVertical: 10,
                color: '#E5E1E4',
                fontSize: 14,
                marginBottom: 16,
              }}
            />

            <View className="flex-row justify-end gap-2.5">
              <Pressable
                onPress={() => setShowAddItem(false)}
                style={{ paddingHorizontal: 14, paddingVertical: 8 }}
              >
                <Text style={{ color: '#928F9E', fontWeight: '600' }}>Cancel</Text>
              </Pressable>
              <Pressable
                onPress={handleAddNewItem}
                style={{
                  backgroundColor: '#6A5ACD',
                  paddingHorizontal: 16,
                  paddingVertical: 8,
                  borderRadius: 10,
                }}
              >
                <Text style={{ color: '#FFFFFF', fontWeight: '800' }}>Add Item</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </Screen>
  );
}
