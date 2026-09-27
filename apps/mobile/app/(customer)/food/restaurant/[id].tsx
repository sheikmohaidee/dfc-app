/**
 * Stitch 04 — Restaurant Details & Menu Screen
 * Immersive dark floating theme for restaurant dining:
 * - Cover hero banner with gradient backdrop
 * - Floating details card with rating, ETA, locality & price for two
 * - Special offer ribbon
 * - Sticky category filter pills & menu search
 * - Menu items with veg/non-veg tags, description, price, and tactile stepper
 * - Floating cart basket bar
 */

import * as React from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  Share,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Image } from 'expo-image';
import {
  ArrowLeft,
  Clock,
  Flame,
  MapPin,
  Minus,
  Plus,
  Search,
  Share2,
  ShoppingBag,
  Sparkles,
  Star,
  Utensils,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

import { formatInr, type Product } from '@dfc/core';
import { DEMO_MODE } from '@/demo/config';
import { subscribeProducts } from '@/lib/catalogue';
import { mockRestaurantRepository } from '@/demo/repositories/restaurant.repository';
import { mockMenuRepository } from '@/demo/repositories/menu.repository';
import type { MenuItem } from '@/demo/types';
import { useCart } from '@/providers/cart';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FloatingCard, GlowBadge, Screen } from '@/ui';
import { DFCPressable } from '@/ui/animated';

function getDishImage(name: string, category?: string) {
  const n = name.toLowerCase();
  const c = (category || '').toLowerCase();
  if (n.includes('biryani') || c.includes('biryani')) {
    return 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=300&q=80';
  }
  if (n.includes('parotta') || n.includes('roti') || n.includes('naan')) {
    return 'https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?w=300&q=80';
  }
  if (n.includes('dosa') || n.includes('idli') || n.includes('vada')) {
    return 'https://images.unsplash.com/photo-1668236543090-82eba5ee5976?w=300&q=80';
  }
  if (n.includes('chicken') || n.includes('mutton') || n.includes('curry') || n.includes('gravy')) {
    return 'https://images.unsplash.com/photo-1610057099443-fde8c4d50f91?w=300&q=80';
  }
  if (n.includes('jigarthanda') || n.includes('shake') || n.includes('juice') || n.includes('dessert') || n.includes('halwa')) {
    return 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=300&q=80';
  }
  if (n.includes('fish') || n.includes('prawn') || n.includes('crab')) {
    return 'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?w=300&q=80';
  }
  return 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=300&q=80';
}

export default function RestaurantMenuScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { cart, addItem, updateQuantity, itemCount, totalPaise, clearCart } = useCart('food');
  const [selectedCategory, setSelectedCategory] = React.useState('All');
  const [searchQuery, setSearchQuery] = React.useState('');
  const [menuVersion, setMenuVersion] = React.useState(0);
  const [liveProducts, setLiveProducts] = React.useState<Product[]>([]);

  React.useEffect(() => {
    return mockMenuRepository.subscribe(() => setMenuVersion((v) => v + 1));
  }, []);

  const restaurant = React.useMemo(() => {
    return (
      mockRestaurantRepository.getById(id || '') ||
      mockRestaurantRepository.getAll()[0]!
    );
  }, [id]);

  React.useEffect(() => {
    if (DEMO_MODE || !restaurant?.id) return;
    return subscribeProducts((prods) => {
      setLiveProducts(prods);
    }, undefined, restaurant.id);
  }, [restaurant?.id]);

  const allMenuItems = React.useMemo(() => {
    if (!DEMO_MODE && liveProducts.length > 0) {
      const mapped: MenuItem[] = liveProducts.map((p) => ({
        id: p.id,
        name: p.name,
        nameTa: p.nameTa,
        description: p.unit || undefined,
        pricePaise: p.sellPaise,
        category: p.category || 'Mains',
        isVeg: p.dietary?.includes('pure_veg') ?? false,
        isBestseller: true,
        isAvailable: p.stockQty > 0 && p.isActive !== false,
      }));
      return mapped;
    }

    const dynamicItems = mockMenuRepository.getMenuByVendor(restaurant?.id || '');
    if (dynamicItems && dynamicItems.length > 0) return dynamicItems;
    return restaurant?.menu || [];
  }, [restaurant?.id, restaurant?.menu, menuVersion, liveProducts]);

  if (!restaurant) {
    return null;
  }

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Order delicious food from ${restaurant.name} on DFC Madurai!`,
      });
    } catch {}
  };

  async function addToFoodCart(item: (typeof allMenuItems)[number]) {
    const payload = {
      id: item.id,
      sourceId: restaurant.id,
      sourceName: restaurant.name,
      sourceCategory: 'food' as const,
      localityId: restaurant.localityId,
      name: item.name,
      pricePaise: item.pricePaise,
      quantity: 1,
      isVeg: item.isVeg,
      isAvailable: (item as any).isAvailable !== false,
    };
    const result = await addItem(payload);
    if (!result.ok && result.reason === 'restaurant_conflict') {
      Alert.alert(
        'One Food order = one restaurant',
        `Your Food cart has items from ${result.conflict.sourceName}. Place that order first, or start a new Food order from ${restaurant.name}. Your other orders continue normally.`,
        [
          { text: 'Keep Existing', style: 'cancel' },
          {
            text: `Start New from ${restaurant.name}`,
            onPress: async () => {
              await clearCart();
              await addItem(payload);
            },
          },
        ],
      );
    }
  }

  const categories = React.useMemo(() => {
    const raw = Array.from(new Set(allMenuItems.map((m) => m.category)));
    return ['All', ...raw];
  }, [allMenuItems]);

  const filteredMenu = React.useMemo(() => {
    return allMenuItems.filter((item) => {
      if (selectedCategory !== 'All' && item.category !== selectedCategory) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return item.name.toLowerCase().includes(q) || item.description?.toLowerCase().includes(q);
      }
      return true;
    });
  }, [allMenuItems, selectedCategory, searchQuery]);

  return (
    <Screen edges={['top']} className="bg-surface-container-lowest">
      {/* Cover Image Banner */}
      <View style={{ height: 180, position: 'relative' }}>
        <Image
          source={{ uri: (restaurant as any).imageUrl || 'https://images.unsplash.com/photo-1589302168068-964664d93dc0?w=800&q=80' }}
          contentFit="cover"
          style={{ width: '100%', height: '100%' }}
        />
        <View
          style={{
            position: 'absolute',
            inset: 0,
            backgroundColor: 'rgba(14, 14, 16, 0.65)',
          }}
        />

        {/* Header Navigation Bar */}
        <View
          style={{
            position: 'absolute',
            top: 12,
            left: 16,
            right: 16,
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            zIndex: 10,
          }}
        >
          <Pressable
            onPress={() => router.back()}
            style={{
              width: 38,
              height: 38,
              borderRadius: 19,
              backgroundColor: 'rgba(28, 27, 29, 0.85)',
              borderWidth: 1,
              borderColor: '#353437',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <ArrowLeft size={19} color="#E5E1E4" strokeWidth={2.2} />
          </Pressable>

          <Pressable
            onPress={handleShare}
            style={{
              width: 38,
              height: 38,
              borderRadius: 19,
              backgroundColor: 'rgba(28, 27, 29, 0.85)',
              borderWidth: 1,
              borderColor: '#353437',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Share2 size={17} color="#E5E1E4" strokeWidth={2} />
          </Pressable>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingBottom: itemCount > 0 ? 110 : 40,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Floating Restaurant Info Card */}
        <View
          style={{
            backgroundColor: '#1C1B1D',
            borderColor: '#2A2A2C',
            borderWidth: 1,
            borderRadius: 20,
            padding: 16,
            marginTop: -36,
            shadowColor: '#000000',
            shadowOpacity: 0.35,
            shadowRadius: 10,
            elevation: 5,
            marginBottom: 14,
          }}
        >
          <View className="flex-row items-start justify-between mb-1">
            <View className="flex-1 mr-2">
              <Text className="text-xl font-extrabold text-on-surface">
                {restaurant.name}
              </Text>
              {restaurant.nameTa ? (
                <Text className="text-xs text-on-surface-variant font-tamil">
                  {restaurant.nameTa}
                </Text>
              ) : null}
            </View>

            <GlowBadge
              label={restaurant.isPureVeg ? 'PURE VEG' : 'MADURAI SPECIAL'}
              tone={restaurant.isPureVeg ? 'success' : 'secondary'}
            />
          </View>

          <View className="flex-row items-center gap-1.5 mb-3">
            <MapPin size={13} color="#928F9E" />
            <Text className="text-xs text-on-surface-variant">
              {restaurant.localityName}, Madurai · {restaurant.cuisines.join(' · ')}
            </Text>
          </View>

          {/* Stats Matrix: Rating, ETA, Price for Two */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderTopWidth: 1,
              borderTopColor: '#2A2A2C',
              paddingTop: 12,
            }}
          >
            <View className="flex-row items-center gap-1.5">
              <View
                style={{
                  backgroundColor: 'rgba(142, 44, 1, 0.25)',
                  borderColor: 'rgba(255, 181, 156, 0.3)',
                  borderWidth: 1,
                  borderRadius: 6,
                  paddingHorizontal: 6,
                  paddingVertical: 2,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 3,
                }}
              >
                <Text style={{ fontSize: 11, fontWeight: '800', color: '#FFB59C' }}>
                  {restaurant.rating.toFixed(1)}
                </Text>
                <Star size={10} color="#FFB59C" fill="#FFB59C" />
              </View>
              <Text className="text-xs text-on-surface-variant">
                {restaurant.reviewCount}+ Ratings
              </Text>
            </View>

            <View style={{ width: 1, height: 16, backgroundColor: '#353437' }} />

            <View className="flex-row items-center gap-1.5">
              <Clock size={13} color="#C8BFFF" />
              <Text className="text-xs font-semibold text-on-surface">
                {restaurant.avgPrepMinutes + 10} Mins ETA
              </Text>
            </View>

            <View style={{ width: 1, height: 16, backgroundColor: '#353437' }} />

            <Text className="text-xs text-on-surface-variant">
              {formatInr(restaurant.priceForTwoPaise)} for 2
            </Text>
          </View>
        </View>

        {/* Special Offer Ribbon */}
        <FloatingCard className="p-3 mb-3 bg-surface-container-low border-secondary/20 flex-row items-center gap-2">
          <Flame size={16} color="#FFB59C" />
          <Text className="text-xs text-on-surface-variant flex-1">
            <Text className="font-bold text-secondary">DFC Special:</Text> Flat ₹50 OFF above ₹299 with code <Text className="font-mono font-bold text-primary">DFC50</Text>
          </Text>
        </FloatingCard>

        {/* Menu Search Bar */}
        <View
          style={{
            backgroundColor: '#1C1B1D',
            borderColor: '#2A2A2C',
            borderWidth: 1,
            borderRadius: 14,
          }}
          className="h-11 flex-row items-center px-3.5 mb-3"
        >
          <Search size={16} color="#928F9E" />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search within this menu..."
            placeholderTextColor="#928F9E"
            style={{
              flex: 1,
              marginLeft: 8,
              color: '#E5E1E4',
              fontSize: 13.5,
              fontWeight: '500',
            }}
          />
          {searchQuery ? (
            <Pressable onPress={() => setSearchQuery('')} hitSlop={8}>
              <Text className="text-xs font-semibold text-primary">Clear</Text>
            </Pressable>
          ) : null}
        </View>

        {/* Category Pills */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 8, paddingBottom: 14 }}
        >
          {categories.map((cat) => {
            const isSelected = selectedCategory === cat;
            return (
              <Pressable
                key={cat}
                onPress={() => {
                  void Haptics.selectionAsync();
                  setSelectedCategory(cat);
                }}
                style={{
                  paddingHorizontal: 14,
                  paddingVertical: 7,
                  borderRadius: 9999,
                  backgroundColor: isSelected ? '#6A5ACD' : '#1C1B1D',
                  borderColor: isSelected ? '#6A5ACD' : '#2A2A2C',
                  borderWidth: 1,
                }}
              >
                <Text
                  style={{
                    fontSize: 12,
                    fontWeight: isSelected ? '700' : '500',
                    color: isSelected ? '#FFFFFF' : '#C9C4D5',
                    textTransform: 'capitalize',
                  }}
                >
                  {cat}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* Menu Items Stack */}
        <View className="gap-3">
          {filteredMenu.map((item) => {
            const cartItem = cart.items.find((i) => i.id === item.id);
            const qty = cartItem?.quantity || 0;
            const isAvail = (item as any).isAvailable !== false;
            const dishImage = (item as any).imageUrl || getDishImage(item.name, item.category);

            return (
              <View
                key={item.id}
                style={{
                  backgroundColor: '#1C1B1D',
                  borderColor: '#2A2A2C',
                  borderWidth: 1,
                  borderRadius: 18,
                  padding: 14,
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  shadowColor: '#000000',
                  shadowOpacity: 0.15,
                  shadowRadius: 6,
                  shadowOffset: { width: 0, height: 2 },
                  elevation: 2,
                }}
              >
                {/* Details */}
                <View className="flex-1 pr-3">
                  <View className="flex-row items-center gap-2 mb-1">
                    {/* Veg indicator dot */}
                    <View
                      style={{
                        width: 14,
                        height: 14,
                        borderRadius: 3,
                        borderWidth: 1.5,
                        borderColor: item.isVeg ? '#6EE7B7' : '#FFB59C',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <View
                        style={{
                          width: 6,
                          height: 6,
                          borderRadius: 3,
                          backgroundColor: item.isVeg ? '#6EE7B7' : '#FFB59C',
                        }}
                      />
                    </View>

                    {(item as any).isBestseller || item.isPopular ? (
                      <Text style={{ fontSize: 10, fontWeight: '800', color: '#FFB59C', letterSpacing: 0.3 }}>
                        ★ BESTSELLER
                      </Text>
                    ) : null}
                  </View>

                  <Text className="text-sm font-bold text-on-surface mb-0.5">
                    {item.name}
                  </Text>
                  {item.nameTa ? (
                    <Text className="text-[11px] text-on-surface-variant font-tamil mb-1">
                      {item.nameTa}
                    </Text>
                  ) : null}

                  {item.description ? (
                    <Text numberOfLines={2} className="text-xs text-on-surface-variant mb-2">
                      {item.description}
                    </Text>
                  ) : null}

                  <Text className="text-sm font-bold font-mono text-on-surface">
                    {formatInr(item.pricePaise)}
                  </Text>
                </View>

                {/* Right Action: Dish thumbnail + ADD button or Stepper */}
                <View style={{ alignItems: 'center', minWidth: 94 }}>
                  <View
                    style={{
                      width: 80,
                      height: 64,
                      borderRadius: 12,
                      overflow: 'hidden',
                      marginBottom: 8,
                      backgroundColor: '#2A2A2C',
                    }}
                  >
                    <Image
                      source={{ uri: dishImage }}
                      contentFit="cover"
                      style={{ width: '100%', height: '100%' }}
                      transition={150}
                    />
                  </View>

                  {!isAvail && qty === 0 ? (
                    <View
                      style={{
                        paddingHorizontal: 10,
                        paddingVertical: 6,
                        backgroundColor: '#2A2A2C',
                        borderRadius: 8,
                      }}
                    >
                      <Text style={{ fontSize: 10, fontWeight: '700', color: '#928F9E' }}>
                        SOLD OUT
                      </Text>
                    </View>
                  ) : qty === 0 ? (
                    <DFCPressable
                      scaleTo={0.92}
                      onPress={() => {
                        if (!isAvail) {
                          Alert.alert('Unavailable', 'This item is currently out of stock.');
                          return;
                        }
                        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        void addToFoodCart(item);
                      }}
                      style={{
                        paddingHorizontal: 16,
                        paddingVertical: 6,
                        backgroundColor: 'rgba(106, 90, 205, 0.2)',
                        borderColor: '#6A5ACD',
                        borderWidth: 1.5,
                        borderRadius: 10,
                      }}
                    >
                      <Text style={{ fontSize: 12, fontWeight: '800', color: '#C8BFFF' }}>
                        ADD +
                      </Text>
                    </DFCPressable>
                  ) : (
                    <View
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        backgroundColor: '#2A2A2C',
                        borderColor: '#353437',
                        borderWidth: 1,
                        borderRadius: 10,
                        paddingHorizontal: 4,
                        height: 32,
                      }}
                    >
                      <Pressable
                        onPress={() => {
                          void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                          void updateQuantity(item.id, -1);
                        }}
                        style={{ paddingHorizontal: 7, paddingVertical: 4 }}
                      >
                        <Minus size={13} color="#E5E1E4" strokeWidth={2.5} />
                      </Pressable>
                      <Text style={{ fontSize: 13, fontWeight: '800', color: '#FFFFFF', paddingHorizontal: 4 }}>
                        {qty}
                      </Text>
                      <Pressable
                        onPress={() => {
                          if (!isAvail) {
                            Alert.alert('Unavailable', 'This item is currently out of stock.');
                            return;
                          }
                          void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                          void addToFoodCart(item);
                        }}
                        style={{ paddingHorizontal: 7, paddingVertical: 4 }}
                      >
                        <Plus size={13} color="#C8BFFF" strokeWidth={2.5} />
                      </Pressable>
                    </View>
                  )}
                </View>
              </View>
            );
          })}
        </View>
      </ScrollView>

      {/* Floating Bottom Basket Bar */}
      {itemCount > 0 ? (
        <View
          style={{
            position: 'absolute',
            bottom: Math.max(insets.bottom, 16),
            left: 16,
            right: 16,
            zIndex: 100,
          }}
        >
          <Pressable
            onPress={() => router.push('/(customer)/cart?service=food' as any)}
            style={{
              backgroundColor: '#6A5ACD',
              borderRadius: 18,
              paddingVertical: 14,
              paddingHorizontal: 16,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              shadowColor: '#6A5ACD',
              shadowOpacity: 0.45,
              shadowRadius: 12,
              elevation: 8,
            }}
          >
            <View>
              <Text style={{ fontSize: 14, fontWeight: '800', color: '#FFFFFF' }}>
                {itemCount} {itemCount === 1 ? 'Item' : 'Items'} · {formatInr(totalPaise)}
              </Text>
              <Text style={{ fontSize: 11, color: 'rgba(255,255,255,0.8)' }}>
                From {restaurant.name}
              </Text>
            </View>

            <View className="flex-row items-center gap-2">
              <Text style={{ fontSize: 13, fontWeight: '800', color: '#FFFFFF' }}>
                View Basket
              </Text>
              <ShoppingBag size={17} color="#FFFFFF" strokeWidth={2.2} />
            </View>
          </Pressable>
        </View>
      ) : null}
    </Screen>
  );
}
