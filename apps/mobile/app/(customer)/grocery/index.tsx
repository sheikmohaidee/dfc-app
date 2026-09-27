/**
 * Stitch 05 — Grocery Discovery & Supermarket Screen
 * Immersive dark floating theme for grocery shopping:
 * - StitchHeader with back button & cart pill
 * - Search bar with instant autocomplete
 * - Category filter chips
 * - Nearby Supermarkets carousel
 * - 2-Column Bento Product Grid with direct add stepper & detail navigation
 * - Floating cart tray
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
import { Image } from 'expo-image';
import {
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
  Wheat,
  Zap,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

import { formatInr, type Product } from '@dfc/core';
import { DEMO_MODE } from '@/demo/config';
import { subscribeProducts } from '@/lib/catalogue';
import { mockGroceryRepository } from '@/demo/repositories/grocery.repository';
import type { GroceryProduct } from '@/demo/types';
import { useCart } from '@/providers/cart';
import { FloatingCard, GlowBadge, Screen } from '@/ui';
import { DFCPressable } from '@/ui/animated';
import { StitchHeader } from '@/ui/stitch-header';

function getGroceryImage(name: string, category?: string) {
  const n = name.toLowerCase();
  const c = (category || '').toLowerCase();
  if (n.includes('milk') || n.includes('paal') || n.includes('curd') || n.includes('dairy') || n.includes('butter') || n.includes('cheese') || n.includes('paneer')) {
    return 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=400&q=80';
  }
  if (n.includes('egg') || n.includes('muttai')) {
    return 'https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?w=400&q=80';
  }
  if (n.includes('rice') || n.includes('arisi') || n.includes('wheat') || n.includes('flour') || n.includes('atta') || n.includes('dal') || n.includes('paruppu')) {
    return 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400&q=80';
  }
  if (n.includes('oil') || n.includes('ennai') || n.includes('ghee') || n.includes('ney')) {
    return 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=400&q=80';
  }
  if (n.includes('flower') || n.includes('poo') || n.includes('jasmine') || n.includes('malli') || n.includes('puja') || n.includes('pooja') || n.includes('camphor')) {
    return 'https://images.unsplash.com/photo-1563245372-f21724e3856d?w=400&q=80';
  }
  if (n.includes('masala') || n.includes('spice') || n.includes('chilli') || n.includes('turmeric') || n.includes('pepper')) {
    return 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=400&q=80';
  }
  if (n.includes('biscuit') || n.includes('cookie') || n.includes('snack') || n.includes('chip') || n.includes('mixture')) {
    return 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=400&q=80';
  }
  if (n.includes('tea') || n.includes('coffee') || n.includes('kaapi')) {
    return 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=400&q=80';
  }
  if (n.includes('fruit') || n.includes('apple') || n.includes('banana') || n.includes('orange') || n.includes('mango')) {
    return 'https://images.unsplash.com/photo-1619566636858-adf3ef46400b?w=400&q=80';
  }
  if (n.includes('vegetable') || n.includes('tomato') || n.includes('onion') || n.includes('potato')) {
    return 'https://images.unsplash.com/photo-1597362925123-77861d3fbac7?w=400&q=80';
  }
  return 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=400&q=80';
}

const GROCERY_CATEGORIES = [
  { id: 'All', label: 'All Items', icon: ShoppingBag, emoji: '🛒' },
  { id: 'Dairy & Eggs', label: 'Dairy & Eggs', icon: Milk, emoji: '🥛' },
  { id: 'Staples & Rice', label: 'Staples & Rice', icon: Wheat, emoji: '🌾' },
  { id: 'Oils & Ghee', label: 'Oils & Ghee', icon: Flame, emoji: '🛢️' },
  { id: 'Flowers & Puja', label: 'Flowers & Puja', icon: Sparkles, emoji: '🌸' },
];

export default function GroceryHomeScreen() {
  const router = useRouter();
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
          catLower.includes('mixture') ||
          catLower.includes('chips') ||
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
          unit: p.unit || '1 unit',
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

    let items = mockGroceryRepository.getByCategory(selectedCategory);
    if (searchQuery.trim()) {
      items = mockGroceryRepository.search(searchQuery);
      if (selectedCategory !== 'All') {
        items = items.filter((p) => p.category === selectedCategory);
      }
    }
    return items;
  }, [selectedCategory, searchQuery, liveProducts, currentStore.name]);

  return (
    <Screen edges={['top']} className="bg-surface-container-lowest">
      <StitchHeader
        title="Supermarket & Daily"
        subtitle={`Dispatched from ${currentStore.name}`}
        showBack
        showCart
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingTop: 12,
          paddingBottom: itemCount > 0 ? 110 : 40,
        }}
      >
        {/* Search Input */}
        <View
          style={{
            backgroundColor: '#1C1B1D',
            borderColor: '#2A2A2C',
            borderWidth: 1,
            borderRadius: 16,
          }}
          className="h-12 flex-row items-center px-4 mb-3"
        >
          <Search size={18} color="#928F9E" />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search Aavin milk, ponni rice, ghee, spices..."
            placeholderTextColor="#928F9E"
            style={{
              flex: 1,
              marginLeft: 10,
              color: '#E5E1E4',
              fontSize: 14,
              fontWeight: '500',
            }}
          />
          {searchQuery ? (
            <Pressable onPress={() => setSearchQuery('')} hitSlop={8}>
              <Text className="text-xs font-semibold text-primary">Clear</Text>
            </Pressable>
          ) : null}
        </View>

        {/* Category Pills Bar */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 8, paddingBottom: 14 }}
        >
          {GROCERY_CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat.id;
            return (
              <Pressable
                key={cat.id}
                onPress={() => {
                  void Haptics.selectionAsync();
                  setSelectedCategory(cat.id);
                }}
                style={{
                  paddingHorizontal: 14,
                  paddingVertical: 7,
                  borderRadius: 9999,
                  backgroundColor: isSelected ? '#6A5ACD' : '#1C1B1D',
                  borderColor: isSelected ? '#6A5ACD' : '#2A2A2C',
                  borderWidth: 1,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <Text style={{ fontSize: 13 }}>{cat.emoji}</Text>
                <Text
                  style={{
                    fontSize: 12,
                    fontWeight: isSelected ? '700' : '500',
                    color: isSelected ? '#FFFFFF' : '#C9C4D5',
                  }}
                >
                  {cat.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* Nearby Supermarkets Carousel */}
        <View className="mb-4">
          <Text className="text-sm font-bold text-on-surface uppercase tracking-wider mb-2.5">
            Partner Supermarket Hubs
          </Text>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10 }}>
            {stores.map((store) => (
              <View
                key={store.id}
                style={{
                  width: 200,
                  backgroundColor: '#1C1B1D',
                  borderColor: '#2A2A2C',
                  borderWidth: 1,
                  borderRadius: 16,
                  padding: 12,
                }}
              >
                <View className="flex-row items-center justify-between mb-2">
                  <View
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 10,
                      backgroundColor: 'rgba(10, 106, 50, 0.25)',
                      borderColor: 'rgba(110, 231, 183, 0.3)',
                      borderWidth: 1,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Store size={18} color="#6EE7B7" />
                  </View>
                  <View className="flex-row items-center gap-1 bg-secondary-container/30 px-1.5 py-0.5 rounded-md">
                    <Star size={10} color="#FFB59C" fill="#FFB59C" />
                    <Text style={{ fontSize: 11, fontWeight: '700', color: '#FFB59C' }}>
                      {store.rating.toFixed(1)}
                    </Text>
                  </View>
                </View>

                <Text numberOfLines={1} className="text-sm font-bold text-on-surface">
                  {store.name}
                </Text>
                <Text numberOfLines={1} className="text-xs text-on-surface-variant mb-2">
                  {store.localityName}, Madurai
                </Text>

                <View className="flex-row items-center gap-1 pt-2 border-t border-surface-container-highest">
                  <Clock size={11} color="#6EE7B7" />
                  <Text style={{ fontSize: 11, fontWeight: '700', color: '#6EE7B7' }}>
                    12-15 Mins Dispatch
                  </Text>
                </View>
              </View>
            ))}
          </ScrollView>
        </View>

        {/* 2-Column Bento Product Grid */}
        <View className="flex-row items-center justify-between mb-3">
          <Text className="text-sm font-bold text-on-surface uppercase tracking-wider">
            Fresh Products ({products.length})
          </Text>
          <Text className="text-xs text-on-surface-variant font-medium">
            Fast Doorstep Dispatch
          </Text>
        </View>

        <View className="flex-row flex-wrap justify-between gap-y-3">
          {products.map((item) => {
            const cartEntry = cart.items.find((i) => i.id === item.id);
            const qty = cartEntry?.quantity || 0;
            const productImage = (item as any).imageUrl || getGroceryImage(item.name, item.category);

            return (
              <DFCPressable
                key={item.id}
                scaleTo={0.96}
                onPress={() => router.push(`/(customer)/grocery/product/${item.id}` as any)}
                style={{
                  width: '48.5%',
                  backgroundColor: '#1C1B1D',
                  borderColor: '#2A2A2C',
                  borderWidth: 1,
                  borderRadius: 18,
                  padding: 12,
                  justifyContent: 'space-between',
                  shadowColor: '#000000',
                  shadowOpacity: 0.15,
                  shadowRadius: 5,
                  shadowOffset: { width: 0, height: 2 },
                  elevation: 2,
                }}
              >
                <View>
                  {/* Thumbnail */}
                  <View
                    style={{
                      height: 100,
                      backgroundColor: '#131315',
                      borderRadius: 14,
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginBottom: 10,
                      overflow: 'hidden',
                    }}
                  >
                    <Image
                      source={{ uri: productImage }}
                      contentFit="cover"
                      style={{ width: '100%', height: '100%' }}
                      transition={150}
                    />
                  </View>

                  <Text
                    numberOfLines={2}
                    className="text-xs font-bold text-on-surface leading-4 mb-1"
                  >
                    {item.name}
                  </Text>
                  <Text className="text-[11px] text-on-surface-variant mb-2">
                    {item.unit}
                  </Text>
                </View>

                {/* Price and Add/Stepper */}
                <View className="flex-row items-center justify-between pt-2 border-t border-surface-container-highest">
                  <Text className="text-xs font-bold font-mono text-on-surface">
                    {formatInr(item.sellPaise)}
                  </Text>

                  {item.inStock === false && qty === 0 ? (
                    <View
                      style={{
                        backgroundColor: '#2A2A2C',
                        paddingHorizontal: 8,
                        paddingVertical: 5,
                        borderRadius: 8,
                      }}
                    >
                      <Text style={{ fontSize: 10, fontWeight: '700', color: '#928F9E' }}>
                        OUT OF STOCK
                      </Text>
                    </View>
                  ) : qty === 0 ? (
                    <DFCPressable
                      scaleTo={0.88}
                      onPress={(e) => {
                        e.stopPropagation();
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
                        backgroundColor: '#6A5ACD',
                        paddingHorizontal: 12,
                        paddingVertical: 5,
                        borderRadius: 8,
                      }}
                    >
                      <Text style={{ fontSize: 11, fontWeight: '800', color: '#FFFFFF' }}>
                        +ADD
                      </Text>
                    </DFCPressable>
                  ) : (
                    <View
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        backgroundColor: '#2A2A2C',
                        borderRadius: 8,
                        paddingHorizontal: 4,
                        height: 28,
                      }}
                    >
                      <Pressable
                        onPress={(e) => {
                          e.stopPropagation();
                          void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                          void updateQuantity(item.id, -1);
                        }}
                        style={{ paddingHorizontal: 4 }}
                      >
                        <Minus size={12} color="#E5E1E4" strokeWidth={2.5} />
                      </Pressable>
                      <Text style={{ fontSize: 12, fontWeight: '800', color: '#FFFFFF', paddingHorizontal: 4 }}>
                        {qty}
                      </Text>
                      <Pressable
                        onPress={(e) => {
                          e.stopPropagation();
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
                        style={{ paddingHorizontal: 4 }}
                      >
                        <Plus size={12} color="#C8BFFF" strokeWidth={2.5} />
                      </Pressable>
                    </View>
                  )}
                </View>
              </DFCPressable>
            );
          })}
        </View>
      </ScrollView>

      {/* Floating Bottom Cart Tray */}
      {itemCount > 0 ? (
        <View
          style={{
            position: 'absolute',
            bottom: 20,
            left: 16,
            right: 16,
            zIndex: 50,
          }}
        >
          <Pressable
            onPress={() => router.push('/(customer)/cart?service=grocery' as any)}
            style={{
              backgroundColor: '#6A5ACD',
              borderRadius: 20,
              paddingHorizontal: 16,
              paddingVertical: 14,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              shadowColor: '#6A5ACD',
              shadowOpacity: 0.45,
              shadowRadius: 12,
              elevation: 8,
            }}
          >
            <View className="flex-row items-center gap-2.5">
              <ShoppingBag size={17} color="#FFFFFF" strokeWidth={2} />
              <View>
                <Text style={{ fontSize: 13, fontWeight: '800', color: '#FFFFFF' }}>
                  {itemCount} {itemCount === 1 ? 'ITEM' : 'ITEMS'} IN GROCERY CART
                </Text>
                <Text style={{ fontSize: 11, color: 'rgba(255,255,255,0.8)' }}>
                  Dispatched in 15 mins
                </Text>
              </View>
            </View>

            <View className="flex-row items-center gap-2">
              <Text style={{ fontSize: 15, fontWeight: '800', color: '#FFFFFF', fontFamily: 'GeistMono' }}>
                {formatInr(totalPaise)}
              </Text>
              <View style={{ backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 }}>
                <Text style={{ fontSize: 11, fontWeight: '800', color: '#FFFFFF' }}>
                  VIEW CART →
                </Text>
              </View>
            </View>
          </Pressable>
        </View>
      ) : null}
    </Screen>
  );
}
