/**
 * DFC Restaurant Menu Screen - Full Stitch Design Implementation
 * Amma Mess Hero, Category Chips, Bestseller Items, Steppers, and Floating Basket.
 */

import * as React from 'react';
import {
  Alert,
  Image,
  Pressable,
  ScrollView,
  Share,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  ArrowLeft,
  Clock,
  MapPin,
  Minus,
  Plus,
  Search,
  Share2,
  ShoppingBag,
  Star,
  Utensils,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

import { formatInr } from '@dfc/core';
import { mockRestaurantRepository } from '@/demo/repositories/restaurant.repository';
import { mockMenuRepository } from '@/demo/repositories/menu.repository';
import { useCart } from '@/providers/cart';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Screen } from '@/ui';

export default function RestaurantMenuScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { cart, addItem, updateQuantity, itemCount, totalPaise, clearCart } = useCart('food');
  const [selectedCategory, setSelectedCategory] = React.useState('All');
  const [searchQuery, setSearchQuery] = React.useState('');
  const [menuVersion, setMenuVersion] = React.useState(0);

  React.useEffect(() => {
    return mockMenuRepository.subscribe(() => setMenuVersion((v) => v + 1));
  }, []);

  const restaurant = React.useMemo(() => {
    return (
      mockRestaurantRepository.getById(id || '') ||
      mockRestaurantRepository.getAll()[0]!
    );
  }, [id]);

  const allMenuItems = React.useMemo(() => {
    const dynamicItems = mockMenuRepository.getMenuByVendor(restaurant?.id || '');
    if (dynamicItems && dynamicItems.length > 0) return dynamicItems;
    return restaurant?.menu || [];
  }, [restaurant?.id, restaurant?.menu, menuVersion]);

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

  // One Food order = one restaurant. A different restaurant starts a new,
  // separate Food order — existing orders keep running untouched.
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
    <Screen edges={['top']}>
      {/* Cover Header Banner */}
      <View
        style={{
          height: 180,
          backgroundColor: '#5C0427',
          position: 'relative',
          justifyContent: 'space-between',
          paddingHorizontal: 20,
          paddingTop: 12,
          paddingBottom: 20,
        }}
      >
        {/* Navigation Bar in Header */}
        <View className="flex-row items-center justify-between z-10">
          <Pressable
            onPress={() => router.back()}
            style={{
              width: 38,
              height: 38,
              borderRadius: 19,
              backgroundColor: '#FFFFFFE0',
              alignItems: 'center',
              justifyContent: 'center',
              shadowColor: '#000',
              shadowOpacity: 0.1,
              shadowRadius: 4,
            }}
          >
            <ArrowLeft size={20} color="#141B2B" strokeWidth={2.2} />
          </Pressable>

          <Pressable
            onPress={handleShare}
            style={{
              width: 38,
              height: 38,
              borderRadius: 19,
              backgroundColor: '#FFFFFFE0',
              alignItems: 'center',
              justifyContent: 'center',
              shadowColor: '#000',
              shadowOpacity: 0.1,
              shadowRadius: 4,
            }}
          >
            <Share2 size={18} color="#141B2B" strokeWidth={2} />
          </Pressable>
        </View>

        {/* Backdrop Decorative Glow */}
        <View className="flex-row items-center gap-2">
          <Utensils size={18} color="#FFD9DF" />
          <Text style={{ fontFamily: 'Archivo', fontSize: 13, color: '#FFD9DF', fontWeight: '600' }}>
            Madurai Famous Kitchens
          </Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingBottom: 110,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Restaurant Card Overlay */}
        <View
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: 16,
            padding: 16,
            marginTop: -28,
            borderWidth: 1,
            borderColor: '#E9EDFF',
            shadowColor: '#000000',
            shadowOpacity: 0.05,
            shadowRadius: 10,
            shadowOffset: { width: 0, height: 4 },
            elevation: 4,
            marginBottom: 20,
          }}
        >
          <Text
            style={{
              fontFamily: 'Archivo',
              fontSize: 24,
              fontWeight: '800',
              color: '#141B2B',
              letterSpacing: -0.5,
              marginBottom: 2,
            }}
          >
            {restaurant.name}
          </Text>
          <View className="flex-row items-center gap-1 mb-3">
            <MapPin size={14} color="#554245" />
            <Text style={{ fontFamily: 'Archivo', fontSize: 13, color: '#554245' }}>
              {restaurant.localityName}, Madurai
            </Text>
          </View>

          {/* Rating & ETA Bar */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 16,
              borderTopWidth: 1,
              borderTopColor: '#DCE2F7',
              paddingTop: 12,
            }}
          >
            {/* Rating */}
            <View className="flex-row items-center gap-1.5">
              <View
                style={{
                  backgroundColor: '#0A6A32',
                  borderRadius: 4,
                  paddingHorizontal: 6,
                  paddingVertical: 2,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 3,
                }}
              >
                <Text style={{ fontFamily: 'Archivo', fontSize: 11, fontWeight: '800', color: '#FFFFFF' }}>
                  {restaurant.rating.toFixed(1)}
                </Text>
                <Star size={10} color="#FFFFFF" fill="#FFFFFF" />
              </View>
              <Text style={{ fontFamily: 'Archivo', fontSize: 12, color: '#554245' }}>
                Rating
              </Text>
            </View>

            <View style={{ width: 1, height: 16, backgroundColor: '#DAC0C4' }} />

            {/* ETA */}
            <View className="flex-row items-center gap-1.5">
              <Clock size={16} color="#554245" />
              <Text style={{ fontFamily: 'Archivo', fontSize: 13, fontWeight: '700', color: '#141B2B' }}>
                {restaurant.avgPrepMinutes + 10} min ETA
              </Text>
            </View>
          </View>
        </View>

        {/* Search Menu Input */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: '#F1F3FF',
            borderWidth: 1,
            borderColor: '#DCE2F7',
            borderRadius: 12,
            paddingHorizontal: 14,
            height: 48,
            marginBottom: 16,
          }}
        >
          <Search size={18} color="#554245" />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search menu..."
            placeholderTextColor="#554245"
            style={{
              flex: 1,
              paddingHorizontal: 10,
              fontFamily: 'Archivo',
              fontSize: 14,
              color: '#141B2B',
            }}
          />
        </View>

        {/* Category Filter Chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 8, paddingBottom: 4 }}
          style={{ marginBottom: 20 }}
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
                  paddingHorizontal: 16,
                  paddingVertical: 8,
                  borderRadius: 9999,
                  backgroundColor: isSelected ? '#7A1F3D' : '#E1E8FD',
                  shadowColor: '#7A1F3D',
                  shadowOpacity: isSelected ? 0.2 : 0,
                  shadowRadius: 4,
                  elevation: isSelected ? 2 : 0,
                }}
              >
                <Text
                  style={{
                    fontFamily: 'Archivo',
                    fontSize: 13,
                    fontWeight: isSelected ? '700' : '500',
                    color: isSelected ? '#FFFFFF' : '#141B2B',
                    textTransform: 'capitalize',
                  }}
                >
                  {cat}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* Menu Items List */}
        <View className="gap-5">
          {filteredMenu.map((item) => {
            const cartItem = cart.items.find((i) => i.id === item.id);
            const qty = cartItem?.quantity || 0;

            return (
              <View
                key={item.id}
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  paddingBottom: 20,
                  borderBottomWidth: 1,
                  borderBottomColor: '#DCE2F7',
                }}
              >
                {/* Details */}
                <View className="flex-1 pr-3">
                  {/* Veg / Non-Veg Indicator */}
                  <View className="flex-row items-center gap-2 mb-1.5">
                    <View
                      style={{
                        width: 16,
                        height: 16,
                        borderRadius: 3,
                        borderWidth: 1.5,
                        borderColor: item.isVeg ? '#0A6A32' : '#BA1A1A',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <View
                        style={{
                          width: 7,
                          height: 7,
                          borderRadius: 3.5,
                          backgroundColor: item.isVeg ? '#0A6A32' : '#BA1A1A',
                        }}
                      />
                    </View>

                    {item.isPopular ? (
                      <View
                        style={{
                          backgroundColor: '#FFDAD6',
                          paddingHorizontal: 8,
                          paddingVertical: 2,
                          borderRadius: 4,
                        }}
                      >
                        <Text
                          style={{
                            fontFamily: 'Archivo',
                            fontSize: 10,
                            fontWeight: '800',
                            color: '#BA1A1A',
                            letterSpacing: 0.5,
                            textTransform: 'uppercase',
                          }}
                        >
                          Bestseller
                        </Text>
                      </View>
                    ) : null}
                  </View>

                  {/* Title & Price */}
                  <Text
                    style={{
                      fontFamily: 'Archivo',
                      fontSize: 16,
                      fontWeight: '700',
                      color: '#141B2B',
                      marginBottom: 2,
                    }}
                  >
                    {item.name}
                  </Text>
                  <Text
                    style={{
                      fontFamily: 'Archivo',
                      fontSize: 15,
                      fontWeight: '800',
                      color: '#141B2B',
                      marginBottom: 4,
                    }}
                  >
                    {formatInr(item.pricePaise)}
                  </Text>

                  {item.description ? (
                    <Text
                      style={{
                        fontFamily: 'Archivo',
                        fontSize: 12,
                        color: '#554245',
                        lineHeight: 16,
                      }}
                      numberOfLines={2}
                    >
                      {item.description}
                    </Text>
                  ) : null}

                  {(item as any).isAvailable === false ? (
                    <View
                      style={{
                        alignSelf: 'flex-start',
                        backgroundColor: '#FEE2E2',
                        paddingHorizontal: 8,
                        paddingVertical: 2,
                        borderRadius: 6,
                        marginTop: 4,
                      }}
                    >
                      <Text style={{ fontFamily: 'Archivo', fontSize: 11, fontWeight: '700', color: '#BA1A1A' }}>
                        Currently unavailable
                      </Text>
                    </View>
                  ) : null}
                </View>

                {/* Thumbnail & Add / Stepper CTA */}
                <View style={{ width: 110, height: 110, position: 'relative', alignItems: 'center' }}>
                  <View
                    style={{
                      width: 100,
                      height: 100,
                      borderRadius: 14,
                      backgroundColor: (item as any).isAvailable === false ? '#F3F4F6' : '#E9EDFF',
                      alignItems: 'center',
                      justifyContent: 'center',
                      overflow: 'hidden',
                      borderWidth: 1,
                      borderColor: '#DAC0C4',
                      opacity: (item as any).isAvailable === false ? 0.6 : 1,
                    }}
                  >
                    <Utensils size={32} color={(item as any).isAvailable === false ? '#9CA3AF' : '#7A1F3D'} />
                  </View>

                  {/* Button Stepper */}
                  <View style={{ position: 'absolute', bottom: -2 }}>
                    {(item as any).isAvailable === false && qty === 0 ? (
                      <View
                        style={{
                          width: 96,
                          height: 36,
                          backgroundColor: '#F3F4F6',
                          borderWidth: 1,
                          borderColor: '#D1D5DB',
                          borderRadius: 8,
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Text style={{ fontFamily: 'Archivo', fontSize: 10.5, fontWeight: '800', color: '#9CA3AF' }}>
                          UNAVAILABLE
                        </Text>
                      </View>
                    ) : qty === 0 ? (
                      <Pressable
                        onPress={() => {
                          if ((item as any).isAvailable === false) {
                            Alert.alert('Unavailable', 'This item is currently unavailable.');
                            return;
                          }
                          void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                          void addToFoodCart(item);
                        }}
                        style={{
                          width: 88,
                          height: 36,
                          backgroundColor: '#FFFFFF',
                          borderWidth: 1.5,
                          borderColor: '#7A1F3D',
                          borderRadius: 8,
                          alignItems: 'center',
                          justifyContent: 'center',
                          shadowColor: '#000000',
                          shadowOpacity: 0.08,
                          shadowRadius: 6,
                          elevation: 3,
                        }}
                      >
                        <Text style={{ fontFamily: 'Archivo', fontSize: 13, fontWeight: '800', color: '#7A1F3D' }}>
                          ADD
                        </Text>
                      </Pressable>
                    ) : (
                      <View
                        style={{
                          width: 88,
                          height: 36,
                          backgroundColor: '#FFFFFF',
                          borderWidth: 1.5,
                          borderColor: '#7A1F3D',
                          borderRadius: 8,
                          flexDirection: 'row',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          paddingHorizontal: 6,
                          shadowColor: '#000000',
                          shadowOpacity: 0.08,
                          shadowRadius: 6,
                          elevation: 3,
                        }}
                      >
                        <Pressable
                          onPress={() => {
                            void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                            void updateQuantity(item.id, -1);
                          }}
                          style={{ padding: 4 }}
                        >
                          <Minus size={14} color="#7A1F3D" strokeWidth={2.5} />
                        </Pressable>
                        <Text style={{ fontFamily: 'Archivo', fontSize: 14, fontWeight: '800', color: '#7A1F3D' }}>
                          {qty}
                        </Text>
                        <Pressable
                          onPress={() => {
                            if ((item as any).isAvailable === false) {
                              Alert.alert('Unavailable', 'This item is currently unavailable.');
                              return;
                            }
                            void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                            void addToFoodCart(item);
                          }}
                          style={{ padding: 4 }}
                        >
                          <Plus size={14} color="#7A1F3D" strokeWidth={2.5} />
                        </Pressable>
                      </View>
                    )}
                  </View>
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
            left: 20,
            right: 20,
            zIndex: 100,
          }}
        >
          <Pressable
            onPress={() => router.push('/(customer)/cart?service=food' as any)}
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
