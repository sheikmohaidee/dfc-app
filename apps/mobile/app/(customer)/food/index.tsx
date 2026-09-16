/**
 * Food & Restaurant Discovery Screen
 */

import * as React from 'react';
import { Pressable, ScrollView, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { ArrowLeft, Clock, MapPin, Search, Sparkles, Star, Utensils } from 'lucide-react-native';

import { formatInr, localityById, routeKm, type Store } from '@dfc/core';
import { DEMO_MODE } from '@/demo/config';
import { subscribeStores } from '@/lib/catalogue';
import { mockRestaurantRepository } from '@/demo/repositories/restaurant.repository';
import { mockLocationRepository } from '@/demo/repositories/location.repository';
import { useCart } from '@/providers/cart';
import { Badge, Num, Screen, T, Ta } from '@/ui';
import { PressableScale } from '@/ui/glass';

const CUISINES = ['All', 'Biryani', 'Chettinad', 'Kari Dosa', 'South Indian', 'Seafood', 'Pure Veg', 'Desserts'];

export default function FoodScreen() {
  const router = useRouter();
  const { itemCount, totalPaise } = useCart('food');
  const [vegOnly, setVegOnly] = React.useState(false);
  const [selectedCuisine, setSelectedCuisine] = React.useState('All');
  const [searchQuery, setSearchQuery] = React.useState('');
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

    // If live stores are loaded from Firestore, merge live store metadata (open status, avgPrepMinutes, locality)
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

    if (selectedCuisine !== 'All') {
      list = list.filter((r) =>
        r.cuisines.some((c) => c.toLowerCase().includes(selectedCuisine.toLowerCase())),
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
  }, [vegOnly, selectedCuisine, searchQuery, liveStores, currentLocality.id]);

  return (
    <Screen edges={['top']}>
      {/* Header */}
      <View className="flex-row items-center gap-3 border-b border-muted bg-background px-4 py-3">
        <PressableScale to={0.9} onPress={() => router.back()} className="size-9 items-center justify-center">
          <ArrowLeft size={22} color="#18181B" strokeWidth={2} />
        </PressableScale>
        <View className="flex-1">
          <View className="flex-row items-center gap-2">
            <T className="text-[17px] font-bold tracking-tight">Food & Messes</T>
            <Ta className="text-[12px] text-muted-foreground">உணவு</Ta>
          </View>
          <View className="flex-row items-center gap-1">
            <MapPin size={11} color="#16A34A" strokeWidth={2.5} />
            <T className="text-[11px] font-medium text-muted-foreground">
              Near {currentLocality.name}, Madurai
            </T>
          </View>
        </View>
        <PressableScale
          to={0.94}
          onPress={() => router.push('/(customer)/search')}
          className="size-9 items-center justify-center rounded-full bg-muted"
        >
          <Search size={17} color="#52525B" strokeWidth={2} />
        </PressableScale>
      </View>

      {/* Search Input in Food Surface */}
      <View className="bg-surface px-4 py-2.5">
        <View className="flex-row items-center gap-2.5 rounded-[12px] border border-border bg-background px-3 py-2">
          <Search size={15} color="#A1A1AA" strokeWidth={2} />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search Amma Mess, Biryani, Kari Dosa..."
            placeholderTextColor="#A1A1AA"
            className="flex-1 font-sans text-[13.5px] text-foreground"
          />
        </View>
      </View>

      {/* Cuisines Bar & Veg Filter */}
      <View className="border-b border-muted bg-background py-2">
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="gap-2 px-4">
          <Pressable
            onPress={() => setVegOnly((v) => !v)}
            className={`flex-row items-center gap-1.5 rounded-full border px-3 py-1.5 ${
              vegOnly ? 'border-grocery bg-grocery-tint' : 'border-border bg-surface'
            }`}
          >
            <View className={`size-2 rounded-full ${vegOnly ? 'bg-grocery' : 'bg-disabled'}`} />
            <T className={`text-[12px] font-semibold ${vegOnly ? 'text-grocery-fg' : 'text-body-strong'}`}>
              Pure Veg
            </T>
          </Pressable>

          {CUISINES.map((c) => {
            const active = selectedCuisine === c;
            return (
              <Pressable
                key={c}
                onPress={() => setSelectedCuisine(c)}
                className={`rounded-full border px-3.5 py-1.5 ${
                  active ? 'border-primary bg-primary' : 'border-border bg-surface'
                }`}
              >
                <T className={`text-[12px] font-medium ${active ? 'text-primary-foreground' : 'text-body-strong'}`}>
                  {c}
                </T>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {/* Restaurant List */}
      <ScrollView className="flex-1 bg-surface" contentContainerClassName="gap-3.5 p-4 pb-24">
        <View className="flex-row items-center justify-between">
          <T className="text-[13px] font-semibold text-body-strong">
            {restaurants.length} Authentic Madurai Kitchens
          </T>
          <T className="text-[11px] text-muted-foreground">Fastest delivery</T>
        </View>

        {restaurants.map((r, idx) => (
          <Animated.View key={r.id} entering={FadeInDown.delay(idx * 40).duration(200)}>
            <PressableScale
              to={0.98}
              onPress={() => router.push(`/(customer)/food/restaurant/${r.id}` as any)}
              className="overflow-hidden rounded-[16px] border border-border bg-background shadow-sm"
            >
              {/* Header Gradient */}
              <View
                style={{ backgroundColor: r.bannerGradient[0] }}
                className="h-24 justify-between p-3.5"
              >
                <View className="flex-row items-center justify-between">
                  <Badge
                    label={r.isPureVeg ? 'PURE VEG' : 'MADURAI SPECIAL'}
                    tone={r.isPureVeg ? 'grocery' : 'food'}
                  />
                  <View className="flex-row items-center gap-1 rounded-full bg-black/40 px-2 py-0.5 backdrop-blur-md">
                    <Star size={11} color="#FBBF24" fill="#FBBF24" />
                    <Num className="text-[11.5px] font-bold text-white">{r.rating}</Num>
                    <T className="text-[10px] text-white/80">({r.reviewCount})</T>
                  </View>
                </View>
                <View className="flex-row items-center gap-1">
                  <Sparkles size={13} color="#FEF08A" strokeWidth={2} />
                  <T className="text-[12px] font-semibold text-white shadow-sm" numberOfLines={1}>
                    {r.featuredDish}
                  </T>
                </View>
              </View>

              {/* Body */}
              <View className="gap-2 p-3.5">
                <View className="flex-row items-start justify-between">
                  <View className="flex-1">
                    <T className="text-[16px] font-bold tracking-tight text-foreground">{r.name}</T>
                    {r.nameTa ? <Ta className="text-[11.5px] text-muted-foreground">{r.nameTa}</Ta> : null}
                  </View>
                  <Num className="text-[12px] font-medium text-muted-foreground">
                    {formatInr(r.priceForTwoPaise)} for two
                  </Num>
                </View>

                <T className="text-[12px] text-muted-foreground" numberOfLines={1}>
                  {r.cuisines.join(' · ')}
                </T>

                <View className="flex-row items-center gap-3 border-t border-muted pt-2.5">
                  <View className="flex-row items-center gap-1">
                    <Clock size={12} color="#71717A" strokeWidth={2} />
                    <Num className="text-[11.5px] font-medium text-body-strong">{r.avgPrepMinutes + 10} mins</Num>
                  </View>
                  <T className="text-[11px] text-muted-foreground">·</T>
                  <View className="flex-row items-center gap-1">
                    <MapPin size={12} color="#71717A" strokeWidth={2} />
                    <Num className="text-[11.5px] font-medium text-body-strong">{r.distanceKm.toFixed(1)} km</Num>
                    <T className="text-[11px] text-placeholder">({r.localityName})</T>
                  </View>
                  <View className="ml-auto rounded-md bg-grocery-tint px-2 py-0.5">
                    <Num className="text-[11px] font-bold text-grocery-fg">
                      {r.deliveryFeePaise === 0 ? 'FREE DELIVERY' : `${formatInr(r.deliveryFeePaise)} delivery`}
                    </Num>
                  </View>
                </View>
              </View>
            </PressableScale>
          </Animated.View>
        ))}
      </ScrollView>

      {/* Floating Cart Bar */}
      {itemCount > 0 ? (
        <View className="absolute bottom-5 left-4 right-4">
          <PressableScale
            to={0.96}
            onPress={() => router.push('/(customer)/cart?service=food' as any)}
            className="flex-row items-center justify-between rounded-[14px] bg-primary p-3.5 shadow-lg"
          >
            <View className="gap-0.5">
              <View className="flex-row items-center gap-2">
                <Utensils size={15} color="#FAFAFA" strokeWidth={2} />
                <T className="text-[13px] font-bold text-primary-foreground">
                  {itemCount} {itemCount === 1 ? 'ITEM' : 'ITEMS'} ADDED
                </T>
              </View>
              <T className="text-[11px] text-primary-foreground/80">Tap to review and place order</T>
            </View>
            <View className="flex-row items-center gap-2">
              <Num className="text-[15px] font-bold text-primary-foreground">
                {formatInr(totalPaise)}
              </Num>
              <View className="rounded-md bg-white/20 px-2 py-1">
                <T className="text-[11px] font-bold text-white">VIEW CART →</T>
              </View>
            </View>
          </PressableScale>
        </View>
      ) : null}
    </Screen>
  );
}
