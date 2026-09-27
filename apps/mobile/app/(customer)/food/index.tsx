/**
 * Stitch 03 — Food Discovery Screen
 * Immersive dark floating food experience:
 * - StitchHeader with back button & cart pill
 * - Spatial search bar with voice trigger
 * - Filter chips (Pure Veg, 4.5+ Rating, <30 Mins, Great Offers)
 * - "Craving Universe" horizontal category ribbon
 * - Gourmet Fest promotional floating card
 * - Elevated restaurant cards with full-bleed imagery, rating chips & delivery metrics
 * - Floating cart tray
 */

import * as React from 'react';
import { View, Text, ScrollView, Pressable, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown } from 'react-native-reanimated';
import {
  ArrowLeft,
  Bookmark,
  Clock,
  Flame,
  Heart,
  MapPin,
  Mic,
  Search,
  SlidersHorizontal,
  Sparkles,
  Star,
  Utensils,
  Zap,
} from 'lucide-react-native';

import { formatInr, localityById, routeKm, type Store } from '@dfc/core';
import { DEMO_MODE } from '@/demo/config';
import { subscribeStores } from '@/lib/catalogue';
import { mockRestaurantRepository } from '@/demo/repositories/restaurant.repository';
import { mockLocationRepository } from '@/demo/repositories/location.repository';
import { useCart } from '@/providers/cart';
import { FloatingCard, GlowBadge, Screen } from '@/ui';
import { RestaurantCard } from '@/ui/cards';
import { StitchHeader } from '@/ui/stitch-header';

const CATEGORIES = [
  { id: 'All', label: 'All Dishes', image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=200&q=80' },
  { id: 'Biryani', label: 'Biryani', image: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=200&q=80' },
  { id: 'Kari Dosa', label: 'Kari Dosa', image: 'https://images.unsplash.com/photo-1668236543090-82eba5ee5976?w=200&q=80' },
  { id: 'Parotta', label: 'Parotta', image: 'https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?w=200&q=80' },
  { id: 'Chettinad', label: 'Chettinad', image: 'https://images.unsplash.com/photo-1610057099443-fde8c4d50f91?w=200&q=80' },
  { id: 'Seafood', label: 'Seafood', image: 'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?w=200&q=80' },
  { id: 'South Indian', label: 'South Indian', image: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=200&q=80' },
  { id: 'Desserts', label: 'Jigarthanda', image: 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=200&q=80' },
];

export default function FoodDiscoveryScreen() {
  const router = useRouter();
  const { itemCount, totalPaise } = useCart('food');
  const [vegOnly, setVegOnly] = React.useState(false);
  const [minRating, setMinRating] = React.useState(false);
  const [fastOnly, setFastOnly] = React.useState(false);
  const [selectedCategory, setSelectedCategory] = React.useState('All');
  const [searchQuery, setSearchQuery] = React.useState('');
  const [bookmarks, setBookmarks] = React.useState<Record<string, boolean>>({});
  const [liveStores, setLiveStores] = React.useState<Store[]>([]);

  React.useEffect(() => {
    if (DEMO_MODE) return;
    return subscribeStores((stores) => {
      setLiveStores(stores.filter((s) => s.category === 'food'));
    }, 'food');
  }, []);

  const currentLocality = mockLocationRepository.getCurrentLocality();

  const restaurants = React.useMemo(() => {
    let list = mockRestaurantRepository.getForCurrentLocality(vegOnly);

    if (!DEMO_MODE && liveStores.length > 0) {
      list = list.map((r) => {
        const matchingLive = liveStores.find((ls) => ls.id === r.id);
        if (matchingLive) {
          const km = routeKm(matchingLive.localityId, currentLocality.id);
          return {
            ...r,
            name: matchingLive.name || r.name,
            nameTa: matchingLive.nameTa || r.nameTa,
            localityId: matchingLive.localityId || r.localityId,
            localityName: localityById(matchingLive.localityId)?.name || r.localityName,
            avgPrepMinutes: matchingLive.avgPrepMinutes || r.avgPrepMinutes,
            distanceKm: km,
            deliveryFeePaise: 2000 + Math.round(km * 400),
          };
        }
        return r;
      });
    }

    if (minRating) {
      list = list.filter((r) => r.rating >= 4.5);
    }
    if (fastOnly) {
      list = list.filter((r) => r.avgPrepMinutes <= 20);
    }
    if (selectedCategory !== 'All') {
      list = list.filter(
        (r) =>
          r.cuisines.some((c) => c.toLowerCase().includes(selectedCategory.toLowerCase())) ||
          r.featuredDish.toLowerCase().includes(selectedCategory.toLowerCase()),
      );
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (r) =>
          r.name.toLowerCase().includes(q) ||
          r.cuisines.some((c) => c.toLowerCase().includes(q)) ||
          r.featuredDish.toLowerCase().includes(q),
      );
    }
    return list;
  }, [vegOnly, minRating, fastOnly, selectedCategory, searchQuery, liveStores, currentLocality.id]);

  const toggleBookmark = (id: string) => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setBookmarks((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <Screen edges={['top']} className="bg-surface-container-lowest">
      <StitchHeader
        title="Food & Messes"
        subtitle={`Near ${currentLocality.name}, Madurai`}
        showBack
        showCart
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: itemCount > 0 ? 100 : 40 }}
      >
        {/* Search Bar */}
        <View className="px-4 pt-3 pb-2">
          <View
            style={{
              backgroundColor: '#1C1B1D',
              borderColor: '#2A2A2C',
              borderWidth: 1,
              borderRadius: 16,
            }}
            className="h-12 flex-row items-center px-4"
          >
            <Search size={18} color="#928F9E" />
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search Amma Mess, Kari Dosa, Biryani..."
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
                <Text className="text-xs font-semibold text-primary mr-2">Clear</Text>
              </Pressable>
            ) : null}
            <Pressable
              onPress={() => router.push('/(customer)/search')}
              hitSlop={8}
            >
              <Mic size={18} color="#C8BFFF" />
            </Pressable>
          </View>
        </View>

        {/* Filter Chips Bar */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16, gap: 8, paddingBottom: 10 }}
        >
          <Pressable
            onPress={() => {
              void Haptics.selectionAsync();
              setVegOnly((v) => !v);
            }}
            style={{
              backgroundColor: vegOnly ? 'rgba(10, 106, 50, 0.25)' : '#1C1B1D',
              borderColor: vegOnly ? '#6EE7B7' : '#2A2A2C',
              borderWidth: 1,
              borderRadius: 9999,
              paddingHorizontal: 12,
              paddingVertical: 7,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <View
              style={{
                width: 8,
                height: 8,
                borderRadius: 4,
                backgroundColor: vegOnly ? '#6EE7B7' : '#928F9E',
              }}
            />
            <Text
              style={{
                fontSize: 12,
                fontWeight: vegOnly ? '700' : '500',
                color: vegOnly ? '#6EE7B7' : '#C9C4D5',
              }}
            >
              Pure Veg
            </Text>
          </Pressable>

          <Pressable
            onPress={() => {
              void Haptics.selectionAsync();
              setMinRating((r) => !r);
            }}
            style={{
              backgroundColor: minRating ? 'rgba(142, 44, 1, 0.25)' : '#1C1B1D',
              borderColor: minRating ? '#FFB59C' : '#2A2A2C',
              borderWidth: 1,
              borderRadius: 9999,
              paddingHorizontal: 12,
              paddingVertical: 7,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 5,
            }}
          >
            <Star size={12} color={minRating ? '#FFB59C' : '#928F9E'} fill={minRating ? '#FFB59C' : 'transparent'} />
            <Text
              style={{
                fontSize: 12,
                fontWeight: minRating ? '700' : '500',
                color: minRating ? '#FFB59C' : '#C9C4D5',
              }}
            >
              4.5+ Rating
            </Text>
          </Pressable>

          <Pressable
            onPress={() => {
              void Haptics.selectionAsync();
              setFastOnly((f) => !f);
            }}
            style={{
              backgroundColor: fastOnly ? 'rgba(106, 90, 205, 0.25)' : '#1C1B1D',
              borderColor: fastOnly ? '#C8BFFF' : '#2A2A2C',
              borderWidth: 1,
              borderRadius: 9999,
              paddingHorizontal: 12,
              paddingVertical: 7,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 5,
            }}
          >
            <Zap size={12} color={fastOnly ? '#C8BFFF' : '#928F9E'} />
            <Text
              style={{
                fontSize: 12,
                fontWeight: fastOnly ? '700' : '500',
                color: fastOnly ? '#C8BFFF' : '#C9C4D5',
              }}
            >
              Fastest (&lt;25m)
            </Text>
          </Pressable>

          <Pressable
            onPress={() => router.push('/food-rescue' as never)}
            style={{
              backgroundColor: '#1C1B1D',
              borderColor: '#2A2A2C',
              borderWidth: 1,
              borderRadius: 9999,
              paddingHorizontal: 12,
              paddingVertical: 7,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 5,
            }}
          >
            <Flame size={12} color="#FFB59C" />
            <Text style={{ fontSize: 12, fontWeight: '500', color: '#FFB59C' }}>
              60% OFF Rescue
            </Text>
          </Pressable>
        </ScrollView>

        {/* "Craving Universe" Category Ribbon */}
        <View className="py-2">
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 16, gap: 10 }}
          >
            {CATEGORIES.map((cat) => {
              const active = selectedCategory === cat.id;
              return (
                <Pressable
                  key={cat.id}
                  onPress={() => {
                    void Haptics.selectionAsync();
                    setSelectedCategory(cat.id);
                  }}
                  style={{
                    alignItems: 'center',
                    minWidth: 64,
                  }}
                >
                  <View
                    style={{
                      width: 54,
                      height: 54,
                      borderRadius: 18,
                      overflow: 'hidden',
                      backgroundColor: '#1C1B1D',
                      borderColor: active ? '#C8BFFF' : '#2A2A2C',
                      borderWidth: active ? 2 : 1,
                      marginBottom: 6,
                    }}
                  >
                    <Image
                      source={{ uri: cat.image }}
                      contentFit="cover"
                      style={{ width: '100%', height: '100%' }}
                      transition={150}
                    />
                  </View>
                  <Text
                    style={{
                      fontSize: 11,
                      fontWeight: active ? '700' : '500',
                      color: active ? '#FFFFFF' : '#928F9E',
                    }}
                  >
                    {cat.label}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        {/* Promotional Floating Banner */}
        <View className="px-4 py-2">
          <FloatingCard glow className="p-3.5 bg-surface-container-low border-secondary/30">
            <View className="flex-row items-center justify-between mb-1">
              <View className="flex-row items-center gap-1.5">
                <Flame size={15} color="#FFB59C" />
                <Text className="text-[11px] font-extrabold text-secondary uppercase tracking-wider">
                  DFC Food Festival
                </Text>
              </View>
              <GlowBadge label="FLAT 20% OFF" tone="secondary" />
            </View>
            <Text className="text-sm font-bold text-on-surface mb-0.5">
              Madurai Traditional Mess Special
            </Text>
            <Text className="text-xs text-on-surface-variant">
              Use coupon code <Text className="font-mono font-bold text-primary">MADURAI20</Text> on checkout for orders above ₹249.
            </Text>
          </FloatingCard>
        </View>

        {/* Restaurant Stack Header */}
        <View className="flex-row items-center justify-between px-4 pt-3 pb-2">
          <Text className="text-sm font-bold text-on-surface uppercase tracking-wider">
            {restaurants.length} Madurai Kitchens
          </Text>
          <Text className="text-xs text-on-surface-variant font-medium">
            Fastest Delivery
          </Text>
        </View>

        {/* Restaurant Cards Stack */}
        <View className="px-4 gap-4">
          {restaurants.map((r, idx) => {
            const isBookmarked = !!bookmarks[r.id];
            return (
              <Animated.View key={r.id} entering={FadeInDown.delay(idx * 30).duration(200)}>
                <RestaurantCard
                  restaurant={r}
                  onPress={() => router.push(`/(customer)/food/restaurant/${r.id}` as any)}
                  onBookmark={() => toggleBookmark(r.id)}
                  isBookmarked={isBookmarked}
                  formatPrice={formatInr}
                />
              </Animated.View>
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
            onPress={() => router.push('/(customer)/cart?service=food' as any)}
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
              <Utensils size={17} color="#FFFFFF" strokeWidth={2} />
              <View>
                <Text style={{ fontSize: 13, fontWeight: '800', color: '#FFFFFF' }}>
                  {itemCount} {itemCount === 1 ? 'ITEM' : 'ITEMS'} IN CART
                </Text>
                <Text style={{ fontSize: 11, color: 'rgba(255,255,255,0.8)' }}>
                  From your selected restaurant
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
