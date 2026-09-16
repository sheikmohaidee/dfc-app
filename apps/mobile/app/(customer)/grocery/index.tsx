/**
 * DFC Grocery Home Screen - Full Stitch Design Implementation
 * Circular Category Pills, Nearby Supermarkets, Featured Products Bento Grid, and Sticky Cart.
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
  Apple,
  ArrowLeft,
  Clock,
  Egg,
  Flame,
  Milk,
  Minus,
  Plus,
  Search,
  ShoppingBag,
  Sparkles,
  Star,
  Store,
  Utensils,
  Wheat,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

import { formatInr, type Product } from '@dfc/core';
import { DEMO_MODE } from '@/demo/config';
import { subscribeProducts } from '@/lib/catalogue';
import { mockGroceryRepository } from '@/demo/repositories/grocery.repository';
import type { GroceryProduct } from '@/demo/types';
import { useCart } from '@/providers/cart';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Screen } from '@/ui';
import { TopAppBar } from '@/ui/top-app-bar';
import { DFCBottomNav } from '@/ui/bottom-nav';

const GROCERY_CATEGORIES = [
  { id: 'All', label: 'All Items', icon: ShoppingBag, color: '#7A1F3D' },
  { id: 'Dairy & Eggs', label: 'Dairy & Eggs', icon: Milk, color: '#2563EB' },
  { id: 'Staples & Rice', label: 'Staples & Rice', icon: Wheat, color: '#D97706' },
  { id: 'Oils & Ghee', label: 'Oils & Ghee', icon: Flame, color: '#EA580C' },
  { id: 'Flowers & Puja', label: 'Flowers', icon: Sparkles, color: '#7C3AED' },
];

export default function GroceryHomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { cart, addItem, updateQuantity, itemCount, totalPaise } = useCart('grocery');
  const [selectedCategory, setSelectedCategory] = React.useState('All');
  const [searchQuery, setSearchQuery] = React.useState('');
  const [liveProducts, setLiveProducts] = React.useState<Product[]>([]);

  React.useEffect(() => {
    if (DEMO_MODE) return;
    return subscribeProducts((prods) => {
      setLiveProducts(prods.filter((p) => p.category === 'grocery'));
    }, 'grocery');
  }, []);

  const stores = mockGroceryRepository.getStores();
  const currentStore = stores[0]!;

  const products = React.useMemo(() => {
    if (!DEMO_MODE && liveProducts.length > 0) {
      let mapped: GroceryProduct[] = liveProducts.map((p) => {
        const catLower = (p.name + ' ' + (p.nameTa || '')).toLowerCase();
        let cat: GroceryProduct['category'] = 'Staples & Rice';
        if (
          catLower.includes('milk') ||
          catLower.includes('curd') ||
          catLower.includes('egg') ||
          catLower.includes('butter') ||
          catLower.includes('cheese')
        ) {
          cat = 'Dairy & Eggs';
        } else if (catLower.includes('oil') || catLower.includes('ghee')) {
          cat = 'Oils & Ghee';
        } else if (
          catLower.includes('pooja') ||
          catLower.includes('flower') ||
          catLower.includes('agarbatti') ||
          catLower.includes('camphor')
        ) {
          cat = 'Flowers & Puja';
        } else if (
          catLower.includes('masala') ||
          catLower.includes('chilli') ||
          catLower.includes('turmeric') ||
          catLower.includes('pepper')
        ) {
          cat = 'Spices';
        } else if (
          catLower.includes('biscuit') ||
          catLower.includes('snack') ||
          catLower.includes('tea') ||
          catLower.includes('coffee')
        ) {
          cat = 'Snacks & Beverages';
        }

        return {
          id: p.id,
          name: p.name,
          nameTa: p.nameTa,
          category: cat,
          unit: p.unit,
          mrpPaise: p.mrpPaise,
          sellPaise: p.sellPaise,
          storeId: p.storeId,
          storeName: currentStore.name,
          inStock: p.stockQty > 0 && p.isActive !== false,
        };
      });

      if (selectedCategory !== 'All') {
        mapped = mapped.filter((p) => p.category === selectedCategory);
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        mapped = mapped.filter(
          (p) =>
            p.name.toLowerCase().includes(q) ||
            p.category.toLowerCase().includes(q) ||
            (p.nameTa && p.nameTa.toLowerCase().includes(q)),
        );
      }
      return mapped;
    }

    let list = mockGroceryRepository.getByCategory(selectedCategory);
    if (searchQuery.trim()) {
      list = mockGroceryRepository.search(searchQuery);
    }
    return list;
  }, [selectedCategory, searchQuery, liveProducts, currentStore.name]);

  return (
    <Screen edges={['top', 'bottom']}>
      {/* Top Header */}
      <TopAppBar
        title="Anna Nagar"
        showBack={true}
        onBack={() => router.replace('/(customer)/chat')}
        showNotifications={true}
      />

      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingTop: 16,
          paddingBottom: itemCount > 0 ? 110 : 40,
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
          Grocery & Essentials
        </Text>

        {/* Search Bar */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: '#FFFFFF',
            borderWidth: 1,
            borderColor: '#DAC0C4',
            borderRadius: 14,
            paddingHorizontal: 14,
            height: 48,
            marginBottom: 20,
            shadowColor: '#000',
            shadowOpacity: 0.03,
            shadowRadius: 6,
          }}
        >
          <Search size={18} color="#887275" />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search milk, rice, dal, oils, snacks..."
            placeholderTextColor="#887275"
            style={{
              flex: 1,
              paddingHorizontal: 10,
              fontFamily: 'Archivo',
              fontSize: 14,
              color: '#141B2B',
            }}
          />
        </View>

        {/* Circular Category Pills */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 14, paddingBottom: 4 }}
          style={{ marginBottom: 24 }}
        >
          {GROCERY_CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat.id;
            const Icon = cat.icon;
            return (
              <Pressable
                key={cat.id}
                onPress={() => {
                  void Haptics.selectionAsync();
                  setSelectedCategory(cat.id);
                }}
                style={{ alignItems: 'center', minWidth: 64 }}
              >
                <View
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: 28,
                    backgroundColor: isSelected ? '#7A1F3D' : '#E9EDFF',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderWidth: isSelected ? 2 : 1,
                    borderColor: isSelected ? '#7A1F3D' : '#DAC0C4',
                    shadowColor: '#000',
                    shadowOpacity: isSelected ? 0.15 : 0,
                    shadowRadius: 6,
                    elevation: isSelected ? 3 : 0,
                  }}
                >
                  <Icon size={24} color={isSelected ? '#FFFFFF' : cat.color} />
                </View>
                <Text
                  style={{
                    fontFamily: 'Archivo',
                    fontSize: 12,
                    fontWeight: isSelected ? '700' : '500',
                    color: isSelected ? '#7A1F3D' : '#554245',
                    marginTop: 6,
                    textAlign: 'center',
                  }}
                >
                  {cat.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* Nearby Stores Horizontal Section */}
        <View className="mb-6">
          <Text
            style={{
              fontFamily: 'Archivo',
              fontSize: 18,
              fontWeight: '800',
              color: '#141B2B',
              letterSpacing: -0.4,
              marginBottom: 12,
            }}
          >
            Nearby Supermarkets
          </Text>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12 }}>
            {stores.map((store) => (
              <View
                key={store.id}
                style={{
                  width: 220,
                  backgroundColor: '#FFFFFF',
                  borderRadius: 16,
                  borderWidth: 1,
                  borderColor: '#DAC0C4',
                  padding: 14,
                  shadowColor: '#000',
                  shadowOpacity: 0.04,
                  shadowRadius: 8,
                }}
              >
                <View
                  style={{
                    height: 60,
                    backgroundColor: '#ECFDF5',
                    borderRadius: 10,
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: 10,
                  }}
                >
                  <Store size={28} color="#059669" />
                </View>
                <Text style={{ fontFamily: 'Archivo', fontSize: 15, fontWeight: '700', color: '#141B2B' }}>
                  {store.name}
                </Text>
                <Text style={{ fontFamily: 'Archivo', fontSize: 12, color: '#554245', marginTop: 1 }}>
                  {store.localityName}, Madurai
                </Text>

                <View className="flex-row items-center justify-between mt-3 pt-2 border-t border-[#DAC0C4]/30">
                  <View className="flex-row items-center gap-1">
                    <Star size={12} color="#D97706" fill="#D97706" />
                    <Text style={{ fontFamily: 'Archivo', fontSize: 12, fontWeight: '700', color: '#141B2B' }}>
                      {store.rating.toFixed(1)}
                    </Text>
                  </View>
                  <View className="flex-row items-center gap-1">
                    <Clock size={12} color="#059669" />
                    <Text style={{ fontFamily: 'Archivo', fontSize: 11, fontWeight: '700', color: '#059669' }}>
                      15 mins
                    </Text>
                  </View>
                </View>
              </View>
            ))}
          </ScrollView>
        </View>

        {/* Featured Products 2-Column Bento Grid */}
        <View>
          <Text
            style={{
              fontFamily: 'Archivo',
              fontSize: 18,
              fontWeight: '800',
              color: '#141B2B',
              letterSpacing: -0.4,
              marginBottom: 12,
            }}
          >
            Fresh Grocery & Staples ({products.length})
          </Text>

          <View className="flex-row flex-wrap gap-3">
            {products.map((item) => {
              const cartEntry = cart.items.find((i) => i.id === item.id);
              const qty = cartEntry?.quantity || 0;

              return (
                <View
                  key={item.id}
                  style={{
                    width: '48%',
                    backgroundColor: '#FFFFFF',
                    borderRadius: 16,
                    borderWidth: 1,
                    borderColor: '#DAC0C4',
                    padding: 12,
                    shadowColor: '#000',
                    shadowOpacity: 0.03,
                    shadowRadius: 6,
                    justifyContent: 'space-between',
                  }}
                >
                  <View>
                    {/* Thumbnail box */}
                    <View
                      style={{
                        height: 90,
                        backgroundColor: '#FDF2F5',
                        borderRadius: 10,
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginBottom: 8,
                      }}
                    >
                      <ShoppingBag size={32} color="#7A1F3D" />
                    </View>

                    <Text
                      style={{
                        fontFamily: 'Archivo',
                        fontSize: 14,
                        fontWeight: '700',
                        color: '#141B2B',
                        lineHeight: 18,
                      }}
                      numberOfLines={2}
                    >
                      {item.name}
                    </Text>
                    <Text style={{ fontFamily: 'Archivo', fontSize: 11, color: '#554245', marginTop: 2 }}>
                      {item.unit}
                    </Text>
                  </View>

                  <View className="flex-row items-center justify-between mt-3 pt-2 border-t border-[#DAC0C4]/30">
                    <Text style={{ fontFamily: 'Archivo', fontSize: 15, fontWeight: '800', color: '#141B2B' }}>
                      {formatInr(item.sellPaise)}
                    </Text>

                    {/* Stepper or Add Button */}
                    {qty === 0 ? (
                      <Pressable
                        onPress={() => {
                          void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                          void addItem({
                            id: item.id,
                            sourceId: item.storeId,
                            sourceName: item.storeName,
                            sourceCategory: 'grocery',
                            localityId: currentStore.localityId,
                            name: item.name,
                            unit: item.unit,
                            pricePaise: item.sellPaise,
                            quantity: 1,
                          });
                        }}
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: 8,
                          backgroundColor: '#7A1F3D',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Plus size={16} color="#FFFFFF" strokeWidth={2.5} />
                      </Pressable>
                    ) : (
                      <View
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          backgroundColor: '#7A1F3D',
                          borderRadius: 8,
                          paddingHorizontal: 4,
                          height: 32,
                        }}
                      >
                        <Pressable
                          onPress={() => {
                            void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                            void updateQuantity(item.id, -1);
                          }}
                          style={{ padding: 3 }}
                        >
                          <Minus size={11} color="#FFFFFF" strokeWidth={2.5} />
                        </Pressable>
                        <Text
                          style={{
                            fontFamily: 'Archivo',
                            fontSize: 12,
                            fontWeight: '800',
                            color: '#FFFFFF',
                            paddingHorizontal: 4,
                          }}
                        >
                          {qty}
                        </Text>
                        <Pressable
                          onPress={() => {
                            void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                            void updateQuantity(item.id, 1);
                          }}
                          style={{ padding: 3 }}
                        >
                          <Plus size={11} color="#FFFFFF" strokeWidth={2.5} />
                        </Pressable>
                      </View>
                    )}
                  </View>
                </View>
              );
            })}
          </View>
        </View>
      </ScrollView>

      {/* Floating Bottom Basket Bar */}
      {itemCount > 0 ? (
        <View
          style={{
            position: 'absolute',
            bottom: Math.max(insets.bottom, 16),
            left: 20,
            right: 20,
            zIndex: 100,
          }}
        >
          <Pressable
            onPress={() => router.push('/(customer)/cart?service=grocery' as any)}
            style={{
              backgroundColor: '#7A1F3D',
              borderRadius: 14,
              paddingVertical: 14,
              paddingHorizontal: 18,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              shadowColor: '#7A1F3D',
              shadowOpacity: 0.35,
              shadowRadius: 14,
              shadowOffset: { width: 0, height: 6 },
              elevation: 8,
            }}
          >
            <View>
              <Text style={{ fontFamily: 'Archivo', fontSize: 15, fontWeight: '800', color: '#FFFFFF' }}>
                {itemCount} {itemCount === 1 ? 'Item' : 'Items'} | {formatInr(totalPaise)}
              </Text>
              <Text style={{ fontFamily: 'Archivo', fontSize: 11, color: '#FFD9DF' }}>
                Extra charges may apply
              </Text>
            </View>

            <View className="flex-row items-center gap-2">
              <Text style={{ fontFamily: 'Archivo', fontSize: 14, fontWeight: '800', color: '#FFFFFF' }}>
                View Basket
              </Text>
              <ShoppingBag size={18} color="#FFFFFF" strokeWidth={2.2} />
            </View>
          </Pressable>
        </View>
      ) : null}
    </Screen>
  );
}
