/**
 * Stitch 09 — AI Shopping List Review Screen
 * Human-in-the-loop review of AI-extracted items before finalizing list.
 */

import * as React from 'react';
import {
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  ArrowLeft,
  Check,
  Edit2,
  Minus,
  Plus,
  ShieldCheck,
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

const INITIAL_REVIEW_ITEMS: ShoppingListItem[] = [
  { id: '1', name: 'Aavin Full Cream Milk', quantity: 2, unit: '500ml', mappedPricePaise: 6000 },
  { id: '2', name: 'Fresh Curry Leaves', quantity: 1, unit: 'bunch', mappedPricePaise: 1000 },
  { id: '3', name: 'Madurai Country Tomatoes', quantity: 1, unit: 'kg', mappedPricePaise: 4000 },
  { id: '4', name: 'Idli Podi (Home Style)', quantity: 1, unit: 'pack', mappedPricePaise: 7500 },
  { id: '5', name: 'Cold Pressed Sesame Oil', quantity: 500, unit: 'ml', mappedPricePaise: 18000 },
];

export default function ShoppingListReviewScreen() {
  const router = useRouter();
  const groceryCart = useCart('grocery');

  const [items, setItems] = React.useState<ShoppingListItem[]>(INITIAL_REVIEW_ITEMS);
  const [listTitle, setListTitle] = React.useState('Scanned Provision List');

  const changeQty = (itemId: string, delta: number) => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setItems((prev) =>
      prev.map((it) => {
        if (it.id === itemId) {
          return { ...it, quantity: Math.max(1, it.quantity + delta) };
        }
        return it;
      }),
    );
  };

  const removeItem = (itemId: string) => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setItems((prev) => prev.filter((it) => it.id !== itemId));
  };

  const totalPaise = items.reduce(
    (acc, it) => acc + (it.mappedPricePaise || 4000) * it.quantity,
    0,
  );

  const handleSaveList = async () => {
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const newList: ShoppingList = {
      id: `list-${Date.now()}`,
      title: listTitle.trim() || 'Reviewed Shopping List',
      createdAt: Date.now(),
      itemCount: items.length,
      sourceKind: 'ocr',
      items,
    };

    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      const existing: ShoppingList[] = raw ? JSON.parse(raw) : [];
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify([newList, ...existing]));
    } catch {}

    router.replace(`/(customer)/shopping-list/${newList.id}` as any);
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

        <Text style={{ fontSize: 16, fontWeight: '700', color: '#E5E1E4' }}>
          AI Extraction Review
        </Text>

        <GlowBadge label="HUMAN CHECK" tone="secondary" />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 14, paddingBottom: 110 }}
      >
        {/* Banner Card */}
        <FloatingCard className="p-4 mb-4 bg-surface-container-low border-secondary/25">
          <View className="flex-row items-center gap-2 mb-1.5">
            <Sparkles size={16} color="#FFB59C" />
            <Text className="text-xs font-bold text-secondary uppercase tracking-wider">
              Review Before Ordering
            </Text>
          </View>
          <Text className="text-sm font-bold text-on-surface mb-1">
            5 Items Extracted from Scanner
          </Text>
          <Text className="text-xs text-on-surface-variant leading-5">
            Our AI parsed your note and estimated prices against Madurai partner supermarkets. Verify quantities or delete items below.
          </Text>
        </FloatingCard>

        {/* List Title Input */}
        <View className="mb-4">
          <Text className="text-xs font-bold text-on-surface uppercase tracking-wider mb-2">
            List Title
          </Text>
          <TextInput
            value={listTitle}
            onChangeText={setListTitle}
            placeholder="Name your list..."
            placeholderTextColor="#928F9E"
            style={{
              backgroundColor: '#1C1B1D',
              borderColor: '#2A2A2C',
              borderWidth: 1,
              borderRadius: 14,
              paddingHorizontal: 14,
              paddingVertical: 10,
              color: '#E5E1E4',
              fontSize: 14,
              fontWeight: '600',
            }}
          />
        </View>

        {/* Item Rows */}
        <Text className="text-xs font-bold text-on-surface uppercase tracking-wider mb-2.5">
          Extracted Items ({items.length})
        </Text>

        <View className="gap-2.5 mb-5">
          {items.map((item) => (
            <View
              key={item.id}
              style={{
                backgroundColor: '#1C1B1D',
                borderColor: '#2A2A2C',
                borderWidth: 1,
                borderRadius: 16,
                padding: 12,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <View className="flex-1 mr-2">
                <Text style={{ fontSize: 14, fontWeight: '700', color: '#E5E1E4' }}>
                  {item.name}
                </Text>
                <Text style={{ fontSize: 11, color: '#928F9E', marginTop: 2 }}>
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
                  height: 32,
                  marginRight: 8,
                }}
              >
                <Pressable
                  onPress={() => changeQty(item.id, -1)}
                  style={{ paddingHorizontal: 6, paddingVertical: 4 }}
                >
                  <Minus size={12} color="#E5E1E4" strokeWidth={2.5} />
                </Pressable>
                <Text style={{ fontSize: 13, fontWeight: '800', color: '#FFFFFF', paddingHorizontal: 4 }}>
                  {item.quantity}
                </Text>
                <Pressable
                  onPress={() => changeQty(item.id, 1)}
                  style={{ paddingHorizontal: 6, paddingVertical: 4 }}
                >
                  <Plus size={12} color="#C8BFFF" strokeWidth={2.5} />
                </Pressable>
              </View>

              <Pressable onPress={() => removeItem(item.id)} hitSlop={8} className="p-1">
                <Trash2 size={16} color="#928F9E" />
              </Pressable>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Sticky Bottom Bar */}
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
          onPress={handleSaveList}
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
          <Check size={18} color="#FFFFFF" strokeWidth={3} />
          <Text style={{ fontSize: 14, fontWeight: '800', color: '#FFFFFF' }}>
            Confirm & Save List ({formatInr(totalPaise)})
          </Text>
        </Pressable>
      </View>
    </Screen>
  );
}
