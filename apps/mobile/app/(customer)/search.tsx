/**
 * DFC Universal Search Screen - Full Stitch Design Implementation
 * Glassmorphism Search Input, Voice/Visual Search, Smart Suggestions, Recent Pills, and Browse Categories.
 */

import * as React from 'react';
import {
  Alert,
  Pressable,
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
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

import { formatInr } from '@dfc/core';
import { mockRestaurantRepository } from '@/demo/repositories/restaurant.repository';
import { mockGroceryRepository } from '@/demo/repositories/grocery.repository';
import { useCart } from '@/providers/cart';
import { Screen } from '@/ui';

export default function UniversalSearchScreen() {
  const router = useRouter();
  const { addItem, clearCart } = useCart('food');
  const [query, setQuery] = React.useState('');
  const [isVoiceActive, setIsVoiceActive] = React.useState(false);
  const [recentSearches, setRecentSearches] = React.useState([
    'Filter Coffee',
    'Amma Mess',
    'Chicken Biryani',
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
    <Screen edges={['top']}>
      {/* Top Header */}
      <View
        style={{
          height: 64,
          backgroundColor: '#F9F9FF',
          paddingHorizontal: 20,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Pressable
          onPress={() => router.back()}
          style={{
            width: 38,
            height: 38,
            borderRadius: 19,
            backgroundColor: '#E9EDFF',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <ArrowLeft size={20} color="#7A1F3D" strokeWidth={2.2} />
        </Pressable>

        <Text
          style={{
            fontFamily: 'Archivo',
            fontSize: 22,
            fontWeight: '800',
            color: '#7A1F3D',
            letterSpacing: -0.4,
          }}
        >
          Search
        </Text>

        <View style={{ width: 38 }} />
      </View>

      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingTop: 8,
          paddingBottom: 40,
        }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Glassmorphism Search Input Container */}
        <View
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: 16,
            borderWidth: 1,
            borderColor: '#DAC0C4',
            paddingHorizontal: 14,
            paddingVertical: 10,
            flexDirection: 'row',
            alignItems: 'center',
            shadowColor: '#000000',
            shadowOpacity: 0.05,
            shadowRadius: 10,
            shadowOffset: { width: 0, height: 4 },
            elevation: 3,
            marginBottom: 24,
          }}
        >
          <Search size={20} color="#887275" />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="What can we get for you?"
            placeholderTextColor="#887275"
            autoFocus
            style={{
              flex: 1,
              paddingHorizontal: 10,
              fontFamily: 'Archivo',
              fontSize: 15,
              color: '#141B2B',
            }}
          />

          {query.length > 0 ? (
            <Pressable onPress={() => setQuery('')} style={{ padding: 4 }}>
              <X size={18} color="#887275" />
            </Pressable>
          ) : (
            <View className="flex-row items-center gap-2 border-l border-[#DAC0C4] pl-3">
              {/* Voice Mic Button */}
              <Pressable
                onPress={handleVoiceSearch}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 16,
                  backgroundColor: isVoiceActive ? '#FFDAD6' : '#FDF2F5',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Mic size={18} color="#7A1F3D" />
              </Pressable>

              {/* Lens / Camera Button */}
              <Pressable
                onPress={() => router.push('/(customer)/chat')}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 16,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Camera size={18} color="#554245" />
              </Pressable>
            </View>
          )}
        </View>

        {/* If Active Search Query: Show Live Results */}
        {query.trim().length > 0 ? (
          <View className="gap-6">
            {!hasResults ? (
              <View className="items-center py-16">
                <Text style={{ fontFamily: 'Archivo', fontSize: 16, fontWeight: '700', color: '#141B2B' }}>
                  No matches found for "{query}"
                </Text>
                <Text style={{ fontFamily: 'Archivo', fontSize: 13, color: '#554245', textAlign: 'center', marginTop: 4 }}>
                  Try searching for Biryani, Dolo 650, Parotta, or Anna Nagar.
                </Text>
              </View>
            ) : (
              <>
                {/* Restaurants */}
                {searchResults && searchResults.restaurants.length > 0 ? (
                  <View className="gap-3">
                    <Text style={{ fontFamily: 'Archivo', fontSize: 14, fontWeight: '800', color: '#7A1F3D' }}>
                      RESTAURANTS ({searchResults.restaurants.length})
                    </Text>
                    {searchResults.restaurants.map((r) => (
                      <Pressable
                        key={r.id}
                        onPress={() => router.push(`/(customer)/food/restaurant/${r.id}` as any)}
                        style={{
                          backgroundColor: '#FFFFFF',
                          borderRadius: 12,
                          borderWidth: 1,
                          borderColor: '#DAC0C4',
                          padding: 14,
                          flexDirection: 'row',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                        }}
                      >
                        <View>
                          <Text style={{ fontFamily: 'Archivo', fontSize: 15, fontWeight: '700', color: '#141B2B' }}>
                            {r.name}
                          </Text>
                          <Text style={{ fontFamily: 'Archivo', fontSize: 12, color: '#554245' }}>
                            {r.localityName} · {r.cuisines.join(', ')}
                          </Text>
                        </View>
                        <Text style={{ fontFamily: 'Archivo', fontSize: 13, fontWeight: '700', color: '#7A1F3D' }}>
                          View Menu →
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                ) : null}

                {/* Dishes */}
                {searchResults && searchResults.dishes.length > 0 ? (
                  <View className="gap-3">
                    <Text style={{ fontFamily: 'Archivo', fontSize: 14, fontWeight: '800', color: '#7A1F3D' }}>
                      DISHES & FOOD ({searchResults.dishes.length})
                    </Text>
                    {searchResults.dishes.map((d) => (
                      <View
                        key={d.id}
                        style={{
                          backgroundColor: '#FFFFFF',
                          borderRadius: 12,
                          borderWidth: 1,
                          borderColor: '#DAC0C4',
                          padding: 14,
                          flexDirection: 'row',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                        }}
                      >
                        <View>
                          <Text style={{ fontFamily: 'Archivo', fontSize: 15, fontWeight: '700', color: '#141B2B' }}>
                            {d.name}
                          </Text>
                          <Text style={{ fontFamily: 'Archivo', fontSize: 12, color: '#554245' }}>
                            {d.restaurantName} · {formatInr(d.pricePaise)}
                          </Text>
                        </View>
                        <Pressable
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
                          style={{
                            backgroundColor: '#7A1F3D',
                            paddingHorizontal: 12,
                            paddingVertical: 6,
                            borderRadius: 6,
                          }}
                        >
                          <Text style={{ fontFamily: 'Archivo', fontSize: 12, fontWeight: '700', color: '#FFFFFF' }}>
                            ADD +
                          </Text>
                        </Pressable>
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
                  fontFamily: 'Archivo',
                  fontSize: 18,
                  fontWeight: '700',
                  color: '#141B2B',
                  marginBottom: 12,
                }}
              >
                Smart Suggestions
              </Text>

              <View className="gap-3">
                <Pressable
                  onPress={() => setQuery('2 mutton biryani from Amma Mess')}
                  style={{
                    backgroundColor: '#FFFFFF',
                    borderRadius: 12,
                    borderWidth: 1,
                    borderColor: '#DAC0C4',
                    padding: 14,
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 12,
                    shadowColor: '#000',
                    shadowOpacity: 0.03,
                    shadowRadius: 6,
                  }}
                >
                  <View
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 20,
                      backgroundColor: '#E9EDFF',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Utensils size={20} color="#7A1F3D" />
                  </View>
                  <View className="flex-1">
                    <Text style={{ fontFamily: 'Archivo', fontSize: 15, fontWeight: '700', color: '#141B2B' }}>
                      "2 mutton biryani from Amma Mess"
                    </Text>
                    <Text style={{ fontFamily: 'Archivo', fontSize: 12, color: '#554245', marginTop: 2 }}>
                      Estimated 35 mins
                    </Text>
                  </View>
                </Pressable>

                <Pressable
                  onPress={() => setQuery('Spiral binding print 20 pages')}
                  style={{
                    backgroundColor: '#FFFFFF',
                    borderRadius: 12,
                    borderWidth: 1,
                    borderColor: '#DAC0C4',
                    padding: 14,
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 12,
                    shadowColor: '#000',
                    shadowOpacity: 0.03,
                    shadowRadius: 6,
                  }}
                >
                  <View
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 20,
                      backgroundColor: '#F5F3FF',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Printer size={20} color="#7C3AED" />
                  </View>
                  <View className="flex-1">
                    <Text style={{ fontFamily: 'Archivo', fontSize: 15, fontWeight: '700', color: '#141B2B' }}>
                      "Spiral binding print 20 pages"
                    </Text>
                    <Text style={{ fontFamily: 'Archivo', fontSize: 12, color: '#554245', marginTop: 2 }}>
                      Express Print & Xerox available
                    </Text>
                  </View>
                </Pressable>
              </View>
            </View>

            {/* Recent Searches */}
            {recentSearches.length > 0 ? (
              <View className="mb-6">
                <View className="flex-row items-center justify-between mb-3">
                  <Text style={{ fontFamily: 'Archivo', fontSize: 18, fontWeight: '700', color: '#141B2B' }}>
                    Recent
                  </Text>
                  <Pressable onPress={() => setRecentSearches([])}>
                    <Text style={{ fontFamily: 'Archivo', fontSize: 13, fontWeight: '600', color: '#7A1F3D' }}>
                      Clear all
                    </Text>
                  </Pressable>
                </View>

                <View className="flex-row flex-wrap gap-2">
                  {recentSearches.map((item) => (
                    <Pressable
                      key={item}
                      onPress={() => setQuery(item)}
                      style={{
                        backgroundColor: '#FFFFFF',
                        borderWidth: 1,
                        borderColor: '#DAC0C4',
                        borderRadius: 9999,
                        paddingHorizontal: 14,
                        paddingVertical: 8,
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 6,
                      }}
                    >
                      <History size={14} color="#554245" />
                      <Text style={{ fontFamily: 'Archivo', fontSize: 13, color: '#141B2B', fontWeight: '500' }}>
                        {item}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            ) : null}

            {/* Browse Categories */}
            <View>
              <Text
                style={{
                  fontFamily: 'Archivo',
                  fontSize: 18,
                  fontWeight: '700',
                  color: '#141B2B',
                  marginBottom: 12,
                }}
              >
                Browse Categories
              </Text>

              <View className="flex-row flex-wrap gap-3">
                {/* Restaurants */}
                <Pressable
                  onPress={() => router.push('/(customer)/food')}
                  style={{
                    flex: 1,
                    minWidth: '45%',
                    backgroundColor: '#FFFFFF',
                    borderRadius: 16,
                    padding: 16,
                    borderWidth: 1,
                    borderColor: '#DAC0C4',
                  }}
                >
                  <Store size={28} color="#7A1F3D" />
                  <Text
                    style={{
                      fontFamily: 'Archivo',
                      fontSize: 16,
                      fontWeight: '700',
                      color: '#141B2B',
                      marginTop: 10,
                    }}
                  >
                    Restaurants
                  </Text>
                </Pressable>

                {/* Print & Xerox */}
                <Pressable
                  onPress={() => router.push('/(customer)/print')}
                  style={{
                    flex: 1,
                    minWidth: '45%',
                    backgroundColor: '#FFFFFF',
                    borderRadius: 16,
                    padding: 16,
                    borderWidth: 1,
                    borderColor: '#DAC0C4',
                  }}
                >
                  <Printer size={28} color="#7A1F3D" />
                  <Text
                    style={{
                      fontFamily: 'Archivo',
                      fontSize: 16,
                      fontWeight: '700',
                      color: '#141B2B',
                      marginTop: 10,
                    }}
                  >
                    Print & Xerox
                  </Text>
                </Pressable>

                {/* Groceries */}
                <Pressable
                  onPress={() => router.push('/(customer)/grocery')}
                  style={{
                    flex: 1,
                    minWidth: '45%',
                    backgroundColor: '#FFFFFF',
                    borderRadius: 16,
                    padding: 16,
                    borderWidth: 1,
                    borderColor: '#DAC0C4',
                  }}
                >
                  <ShoppingBag size={28} color="#7A1F3D" />
                  <Text
                    style={{
                      fontFamily: 'Archivo',
                      fontSize: 16,
                      fontWeight: '700',
                      color: '#141B2B',
                      marginTop: 10,
                    }}
                  >
                    Groceries
                  </Text>
                </Pressable>

                {/* Package Drop */}
                <Pressable
                  onPress={() => router.push('/(customer)/genie')}
                  style={{
                    flex: 1,
                    minWidth: '45%',
                    backgroundColor: '#FFFFFF',
                    borderRadius: 16,
                    padding: 16,
                    borderWidth: 1,
                    borderColor: '#DAC0C4',
                  }}
                >
                  <Package size={28} color="#7A1F3D" />
                  <Text
                    style={{
                      fontFamily: 'Archivo',
                      fontSize: 16,
                      fontWeight: '700',
                      color: '#141B2B',
                      marginTop: 10,
                    }}
                  >
                    Package Drop
                  </Text>
                </Pressable>
              </View>
            </View>
          </>
        )}
      </ScrollView>
    </Screen>
  );
}
