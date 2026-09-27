/**
 * DFC Universal Search Screen — Stitch Dark Floating Theme
 * Glassmorphic Search Input, Voice/Visual Search, Smart Suggestions, Recent Pills, and Browse Categories.
 */

import * as React from 'react';
import {
  Alert,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  ArrowLeft,
  Camera,
  History,
  Mic,
  Package,
  Printer,
  Search,
  ShoppingBag,
  Sparkles,
  Store,
  Utensils,
  X,
  ChevronRight,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

import { formatInr } from '@dfc/core';
import { mockRestaurantRepository } from '@/demo/repositories/restaurant.repository';
import { mockGroceryRepository } from '@/demo/repositories/grocery.repository';
import { useCart } from '@/providers/cart';
import { Screen } from '@/ui';
import { DFCPressable } from '@/ui/animated';
import { StitchHeader } from '@/ui/stitch-header';

export default function UniversalSearchScreen() {
  const router = useRouter();
  const { addItem, clearCart } = useCart('food');
  const [query, setQuery] = React.useState('');
  const [isVoiceActive, setIsVoiceActive] = React.useState(false);
  const [recentSearches, setRecentSearches] = React.useState([
    'Filter Coffee',
    'Amma Mess Biryani',
    'A4 Color Printout',
    'Jigarthanda',
  ]);

  const searchResults = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return null;

    const restaurants = mockRestaurantRepository.search(q);
    const groceries = mockGroceryRepository.search(q);

    return {
      restaurants: restaurants.restaurants,
      dishes: restaurants.dishes,
      groceries,
    };
  }, [query]);

  const hasResults =
    searchResults &&
    (searchResults.restaurants.length > 0 ||
      searchResults.dishes.length > 0 ||
      searchResults.groceries.length > 0);

  const handleVoiceSearch = () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setIsVoiceActive(true);
    // Simulate AI speech recognition in Tamil/English
    setTimeout(() => {
      setQuery('2 Mutton Biryani from Amma Mess');
      setIsVoiceActive(false);
    }, 1200);
  };

  return (
    <Screen edges={['top']} style={{ backgroundColor: '#0E0E10' }}>
      {/* Top Header */}
      <StitchHeader
        showBack={true}
        title="Search Anything"
        subtitle="Food, Groceries, Prints & Errands in Madurai"
        showNotifications={false}
      />

      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingTop: 8,
          paddingBottom: 40,
        }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Floating Search Input Container */}
        <View
          style={{
            backgroundColor: '#18181B',
            borderRadius: 18,
            borderWidth: 1,
            borderColor: '#26262B',
            paddingHorizontal: 14,
            paddingVertical: 10,
            flexDirection: 'row',
            alignItems: 'center',
            shadowColor: '#000000',
            shadowOpacity: 0.4,
            shadowRadius: 12,
            shadowOffset: { width: 0, height: 4 },
            elevation: 4,
            marginBottom: 20,
          }}
        >
          <Search size={18} color="#928F9E" />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search dishes, groceries, stores, xerox..."
            placeholderTextColor="#5C5A64"
            autoFocus
            style={{
              flex: 1,
              paddingHorizontal: 10,
              fontFamily: 'PlusJakartaSans',
              fontSize: 14,
              color: '#E5E1E4',
            }}
          />

          {query.length > 0 ? (
            <DFCPressable onPress={() => setQuery('')} scaleTo={0.9} style={{ padding: 4 }}>
              <X size={18} color="#928F9E" />
            </DFCPressable>
          ) : (
            <View className="flex-row items-center gap-2 border-l border-[#26262B] pl-3">
              {/* Voice Mic Button */}
              <DFCPressable
                onPress={handleVoiceSearch}
                scaleTo={0.9}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 16,
                  backgroundColor: isVoiceActive ? 'rgba(106, 90, 205, 0.4)' : '#201F25',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Mic size={16} color={isVoiceActive ? '#C8BFFF' : '#A09CA8'} />
              </DFCPressable>

              {/* Lens / Camera Button */}
              <DFCPressable
                onPress={() => router.push('/(customer)/chat')}
                scaleTo={0.9}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 16,
                  backgroundColor: '#201F25',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Camera size={16} color="#A09CA8" />
              </DFCPressable>
            </View>
          )}
        </View>

        {/* If Active Search Query: Show Live Results */}
        {query.trim().length > 0 ? (
          <View className="gap-6">
            {!hasResults ? (
              <View className="items-center py-16">
                <Text style={{ fontFamily: 'PlusJakartaSans', fontSize: 16, fontWeight: '700', color: '#E5E1E4' }}>
                  No matches found for "{query}"
                </Text>
                <Text style={{ fontFamily: 'PlusJakartaSans', fontSize: 13, color: '#928F9E', textAlign: 'center', marginTop: 6, lineHeight: 18 }}>
                  Try searching for Biryani, Fresh Milk, Xerox, or Anna Nagar.
                </Text>
              </View>
            ) : (
              <>
                {/* Restaurants */}
                {searchResults && searchResults.restaurants.length > 0 ? (
                  <View className="gap-3">
                    <Text style={{ fontFamily: 'PlusJakartaSans', fontSize: 12, fontWeight: '700', color: '#C8BFFF', letterSpacing: 0.5 }}>
                      RESTAURANTS ({searchResults.restaurants.length})
                    </Text>
                    {searchResults.restaurants.map((r) => (
                      <DFCPressable
                        key={r.id}
                        onPress={() => router.push(`/(customer)/food/restaurant/${r.id}` as any)}
                        scaleTo={0.98}
                        style={{
                          backgroundColor: '#18181B',
                          borderRadius: 16,
                          borderWidth: 1,
                          borderColor: '#26262B',
                          padding: 14,
                          flexDirection: 'row',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                        }}
                      >
                        <View style={{ flex: 1, paddingRight: 10 }}>
                          <Text style={{ fontFamily: 'PlusJakartaSans', fontSize: 15, fontWeight: '700', color: '#E5E1E4' }}>
                            {r.name}
                          </Text>
                          <Text style={{ fontFamily: 'PlusJakartaSans', fontSize: 12, color: '#928F9E', marginTop: 2 }}>
                            {r.localityName} · {r.cuisines.join(', ')}
                          </Text>
                        </View>
                        <View className="flex-row items-center gap-1">
                          <Text style={{ fontFamily: 'PlusJakartaSans', fontSize: 12, fontWeight: '700', color: '#C8BFFF' }}>
                            Menu
                          </Text>
                          <ChevronRight size={14} color="#C8BFFF" />
                        </View>
                      </DFCPressable>
                    ))}
                  </View>
                ) : null}

                {/* Dishes */}
                {searchResults && searchResults.dishes.length > 0 ? (
                  <View className="gap-3">
                    <Text style={{ fontFamily: 'PlusJakartaSans', fontSize: 12, fontWeight: '700', color: '#C8BFFF', letterSpacing: 0.5 }}>
                      DISHES & FOOD ({searchResults.dishes.length})
                    </Text>
                    {searchResults.dishes.map((d) => (
                      <View
                        key={d.id}
                        style={{
                          backgroundColor: '#18181B',
                          borderRadius: 16,
                          borderWidth: 1,
                          borderColor: '#26262B',
                          padding: 14,
                          flexDirection: 'row',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                        }}
                      >
                        <View style={{ flex: 1, paddingRight: 12 }}>
                          <View className="flex-row items-center gap-2">
                            <View
                              style={{
                                width: 12,
                                height: 12,
                                borderWidth: 1.5,
                                borderColor: d.isVeg ? '#10B981' : '#EF4444',
                                alignItems: 'center',
                                justifyContent: 'center',
                                borderRadius: 3,
                              }}
                            >
                              <View
                                style={{
                                  width: 5,
                                  height: 5,
                                  borderRadius: 2.5,
                                  backgroundColor: d.isVeg ? '#10B981' : '#EF4444',
                                }}
                              />
                            </View>
                            <Text style={{ fontFamily: 'PlusJakartaSans', fontSize: 15, fontWeight: '700', color: '#E5E1E4' }}>
                              {d.name}
                            </Text>
                          </View>
                          <Text style={{ fontFamily: 'PlusJakartaSans', fontSize: 12, color: '#928F9E', marginTop: 2 }}>
                            {d.restaurantName} · <Text style={{ color: '#C8BFFF', fontWeight: '700' }}>{formatInr(d.pricePaise)}</Text>
                          </Text>
                        </View>
                        <DFCPressable
                          onPress={async () => {
                            void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                            const payload = {
                              id: d.id,
                              sourceId: d.restaurantId,
                              sourceName: d.restaurantName,
                              sourceCategory: 'food' as const,
                              localityId: 'anna-nagar',
                              name: d.name,
                              pricePaise: d.pricePaise,
                              quantity: 1,
                              isVeg: d.isVeg,
                            };
                            const result = await addItem(payload);
                            if (!result.ok && result.reason === 'restaurant_conflict') {
                              Alert.alert(
                                'One Food order = one restaurant',
                                `Your Food cart has items from ${result.conflict.sourceName}. Place that order first, or start a new Food order from ${d.restaurantName}. Your other orders continue normally.`,
                                [
                                  { text: 'Keep Existing', style: 'cancel' },
                                  {
                                    text: `Start New from ${d.restaurantName}`,
                                    onPress: async () => {
                                      await clearCart();
                                      await addItem(payload);
                                    },
                                  },
                                ],
                              );
                            }
                          }}
                          scaleTo={0.94}
                          style={{
                            backgroundColor: '#6A5ACD',
                            paddingHorizontal: 14,
                            paddingVertical: 8,
                            borderRadius: 10,
                          }}
                        >
                          <Text style={{ fontFamily: 'PlusJakartaSans', fontSize: 12, fontWeight: '700', color: '#FFFFFF' }}>
                            ADD +
                          </Text>
                        </DFCPressable>
                      </View>
                    ))}
                  </View>
                ) : null}
              </>
            )}
          </View>
        ) : (
          /* Default Browse State */
          <>
            {/* AI Smart Suggestions */}
            <View className="mb-6">
              <Text
                style={{
                  fontFamily: 'PlusJakartaSans',
                  fontSize: 13,
                  fontWeight: '700',
                  color: '#E5E1E4',
                  letterSpacing: 0.5,
                  marginBottom: 12,
                }}
              >
                SMART SUGGESTIONS
              </Text>

              <View className="gap-3">
                <DFCPressable
                  onPress={() => setQuery('2 mutton biryani from Amma Mess')}
                  scaleTo={0.98}
                  style={{
                    backgroundColor: '#18181B',
                    borderRadius: 16,
                    borderWidth: 1,
                    borderColor: '#26262B',
                    padding: 14,
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 12,
                  }}
                >
                  <View
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 12,
                      backgroundColor: 'rgba(106, 90, 205, 0.2)',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Utensils size={18} color="#C8BFFF" />
                  </View>
                  <View className="flex-1">
                    <Text style={{ fontFamily: 'PlusJakartaSans', fontSize: 14, fontWeight: '700', color: '#E5E1E4' }}>
                      "2 mutton biryani from Amma Mess"
                    </Text>
                    <Text style={{ fontFamily: 'PlusJakartaSans', fontSize: 12, color: '#928F9E', marginTop: 2 }}>
                      Estimated 35 mins · Trending lunch
                    </Text>
                  </View>
                </DFCPressable>

                <DFCPressable
                  onPress={() => setQuery('Spiral binding print 20 pages')}
                  scaleTo={0.98}
                  style={{
                    backgroundColor: '#18181B',
                    borderRadius: 16,
                    borderWidth: 1,
                    borderColor: '#26262B',
                    padding: 14,
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 12,
                  }}
                >
                  <View
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 12,
                      backgroundColor: 'rgba(59, 130, 246, 0.2)',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Printer size={18} color="#93C5FD" />
                  </View>
                  <View className="flex-1">
                    <Text style={{ fontFamily: 'PlusJakartaSans', fontSize: 14, fontWeight: '700', color: '#E5E1E4' }}>
                      "Spiral binding print 20 pages"
                    </Text>
                    <Text style={{ fontFamily: 'PlusJakartaSans', fontSize: 12, color: '#928F9E', marginTop: 2 }}>
                      Express Print & Xerox · Tallakulam Hub
                    </Text>
                  </View>
                </DFCPressable>
              </View>
            </View>

            {/* Recent Searches */}
            {recentSearches.length > 0 ? (
              <View className="mb-6">
                <View className="flex-row items-center justify-between mb-3">
                  <Text style={{ fontFamily: 'PlusJakartaSans', fontSize: 13, fontWeight: '700', color: '#E5E1E4', letterSpacing: 0.5 }}>
                    RECENT SEARCHES
                  </Text>
                  <DFCPressable onPress={() => setRecentSearches([])} scaleTo={0.94}>
                    <Text style={{ fontFamily: 'PlusJakartaSans', fontSize: 12, fontWeight: '600', color: '#C8BFFF' }}>
                      Clear all
                    </Text>
                  </DFCPressable>
                </View>

                <View className="flex-row flex-wrap gap-2">
                  {recentSearches.map((item) => (
                    <DFCPressable
                      key={item}
                      onPress={() => setQuery(item)}
                      scaleTo={0.94}
                      style={{
                        backgroundColor: '#18181B',
                        borderWidth: 1,
                        borderColor: '#26262B',
                        borderRadius: 20,
                        paddingHorizontal: 12,
                        paddingVertical: 7,
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 6,
                      }}
                    >
                      <History size={13} color="#928F9E" />
                      <Text style={{ fontFamily: 'PlusJakartaSans', fontSize: 12, color: '#E5E1E4', fontWeight: '600' }}>
                        {item}
                      </Text>
                    </DFCPressable>
                  ))}
                </View>
              </View>
            ) : null}

            {/* Browse Categories */}
            <View>
              <Text
                style={{
                  fontFamily: 'PlusJakartaSans',
                  fontSize: 13,
                  fontWeight: '700',
                  color: '#E5E1E4',
                  letterSpacing: 0.5,
                  marginBottom: 12,
                }}
              >
                BROWSE CATEGORIES
              </Text>

              <View className="flex-row flex-wrap gap-3">
                {/* Restaurants */}
                <DFCPressable
                  onPress={() => router.push('/(customer)/food')}
                  scaleTo={0.97}
                  style={{
                    flex: 1,
                    minWidth: '45%',
                    backgroundColor: '#18181B',
                    borderRadius: 18,
                    padding: 16,
                    borderWidth: 1,
                    borderColor: '#26262B',
                  }}
                >
                  <View
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 14,
                      backgroundColor: 'rgba(239, 68, 68, 0.15)',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginBottom: 12,
                    }}
                  >
                    <Store size={22} color="#F87171" />
                  </View>
                  <Text
                    style={{
                      fontFamily: 'PlusJakartaSans',
                      fontSize: 15,
                      fontWeight: '700',
                      color: '#E5E1E4',
                    }}
                  >
                    Restaurants
                  </Text>
                  <Text style={{ fontFamily: 'PlusJakartaSans', fontSize: 11, color: '#928F9E', marginTop: 2 }}>
                    42+ iconic eateries
                  </Text>
                </DFCPressable>

                {/* Print & Xerox */}
                <DFCPressable
                  onPress={() => router.push('/(customer)/print')}
                  scaleTo={0.97}
                  style={{
                    flex: 1,
                    minWidth: '45%',
                    backgroundColor: '#18181B',
                    borderRadius: 18,
                    padding: 16,
                    borderWidth: 1,
                    borderColor: '#26262B',
                  }}
                >
                  <View
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 14,
                      backgroundColor: 'rgba(59, 130, 246, 0.15)',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginBottom: 12,
                    }}
                  >
                    <Printer size={22} color="#60A5FA" />
                  </View>
                  <Text
                    style={{
                      fontFamily: 'PlusJakartaSans',
                      fontSize: 15,
                      fontWeight: '700',
                      color: '#E5E1E4',
                    }}
                  >
                    Print & Xerox
                  </Text>
                  <Text style={{ fontFamily: 'PlusJakartaSans', fontSize: 11, color: '#928F9E', marginTop: 2 }}>
                    Laser A4 & binding
                  </Text>
                </DFCPressable>

                {/* Groceries */}
                <DFCPressable
                  onPress={() => router.push('/(customer)/grocery')}
                  scaleTo={0.97}
                  style={{
                    flex: 1,
                    minWidth: '45%',
                    backgroundColor: '#18181B',
                    borderRadius: 18,
                    padding: 16,
                    borderWidth: 1,
                    borderColor: '#26262B',
                  }}
                >
                  <View
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 14,
                      backgroundColor: 'rgba(16, 185, 129, 0.15)',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginBottom: 12,
                    }}
                  >
                    <ShoppingBag size={22} color="#34D399" />
                  </View>
                  <Text
                    style={{
                      fontFamily: 'PlusJakartaSans',
                      fontSize: 15,
                      fontWeight: '700',
                      color: '#E5E1E4',
                    }}
                  >
                    Groceries
                  </Text>
                  <Text style={{ fontFamily: 'PlusJakartaSans', fontSize: 11, color: '#928F9E', marginTop: 2 }}>
                    Fresh produce & dairy
                  </Text>
                </DFCPressable>

                {/* Package Drop / Genie */}
                <DFCPressable
                  onPress={() => router.push('/(customer)/genie')}
                  scaleTo={0.97}
                  style={{
                    flex: 1,
                    minWidth: '45%',
                    backgroundColor: '#18181B',
                    borderRadius: 18,
                    padding: 16,
                    borderWidth: 1,
                    borderColor: '#26262B',
                  }}
                >
                  <View
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 14,
                      backgroundColor: 'rgba(168, 85, 247, 0.15)',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginBottom: 12,
                    }}
                  >
                    <Package size={22} color="#C084FC" />
                  </View>
                  <Text
                    style={{
                      fontFamily: 'PlusJakartaSans',
                      fontSize: 15,
                      fontWeight: '700',
                      color: '#E5E1E4',
                    }}
                  >
                    Genie Concierge
                  </Text>
                  <Text style={{ fontFamily: 'PlusJakartaSans', fontSize: 11, color: '#928F9E', marginTop: 2 }}>
                    Any errand or courier
                  </Text>
                </DFCPressable>
              </View>
            </View>
          </>
        )}
      </ScrollView>
    </Screen>
  );
}
