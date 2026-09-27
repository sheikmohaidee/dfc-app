/**
 * Stitch 06 — Product Details Screen
 * Immersive dark floating theme for product details:
 * - Product image hero with indicators
 * - Pricing matrix with MRP, Sell Price & Savings Badge
 * - Pack size selector pills
 * - Product Highlights grid (Organic, 12-Min Dispatch, Local Sourced)
 * - Storage & Nutritional profile
 * - Delicious Pairings section
 * - Sticky bottom bar with quantity stepper & Add to Cart
 */

import * as React from 'react';
import {
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Image } from 'expo-image';
import {
  ArrowLeft,
  Check,
  Clock,
  Heart,
  Minus,
  Plus,
  Share2,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Star,
  Truck,
  Zap,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

import { formatInr } from '@dfc/core';
import { mockGroceryRepository } from '@/demo/repositories/grocery.repository';
import type { GroceryProduct } from '@/demo/types';
import { useCart } from '@/providers/cart';
import { FloatingCard, GlowBadge, Screen } from '@/ui';

export default function ProductDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { cart, addItem, updateQuantity, itemCount } = useCart('grocery');

  const products = mockGroceryRepository.getAllProducts();
  const product: GroceryProduct =
    products.find((p) => p.id === id) || products[0]!;

  const cartEntry = cart.items.find((i) => i.id === product.id);
  const qty = cartEntry?.quantity || 0;

  const [selectedPack, setSelectedPack] = React.useState('Regular');
  const [isFavorite, setIsFavorite] = React.useState(false);

  const discountPercent = Math.round(
    ((product.mrpPaise - product.sellPaise) / product.mrpPaise) * 100,
  );

  const relatedProducts = products
    .filter((p) => p.id !== product.id && p.category === product.category)
    .slice(0, 4);

  return (
    <Screen edges={['top']} className="bg-surface-container-lowest">
      {/* Top Header */}
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

        <Text
          numberOfLines={1}
          style={{
            fontSize: 15,
            fontWeight: '700',
            color: '#E5E1E4',
            maxWidth: 200,
          }}
        >
          {product.name}
        </Text>

        <View className="flex-row items-center gap-2">
          <Pressable
            onPress={() => {
              void Haptics.selectionAsync();
              setIsFavorite((f) => !f);
            }}
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
            <Heart
              size={18}
              color={isFavorite ? '#FFB59C' : '#E5E1E4'}
              fill={isFavorite ? '#FFB59C' : 'transparent'}
            />
          </Pressable>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 110 }}
      >
        {/* Product Image Stage */}
        <View
          style={{
            height: 250,
            backgroundColor: '#131315',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
          }}
        >
          <Image
            source={{
              uri:
                (product as any).imageUrl ||
                'https://images.unsplash.com/photo-1542838132-92c53300491e?w=800&q=80',
            }}
            contentFit="cover"
            style={{ width: '100%', height: '100%' }}
          />
          <View
            style={{
              position: 'absolute',
              bottom: 12,
              flexDirection: 'row',
              gap: 6,
            }}
          >
            <View className="w-6 h-1.5 rounded-full bg-primary" />
            <View className="w-1.5 h-1.5 rounded-full bg-surface-container-highest" />
            <View className="w-1.5 h-1.5 rounded-full bg-surface-container-highest" />
          </View>
        </View>

        {/* Product Title & Pricing */}
        <View className="p-4">
          <View className="flex-row items-center justify-between mb-1.5">
            <GlowBadge label={product.category.toUpperCase()} tone="primary" />
            <View className="flex-row items-center gap-1 bg-secondary-container/25 px-2 py-0.5 rounded-md">
              <Star size={12} color="#FFB59C" fill="#FFB59C" />
              <Text style={{ fontSize: 11, fontWeight: '700', color: '#FFB59C' }}>
                4.8 (120+ reviews)
              </Text>
            </View>
          </View>

          <Text className="text-xl font-extrabold text-on-surface mb-1">
            {product.name}
          </Text>
          {product.nameTa ? (
            <Text className="text-xs text-on-surface-variant font-tamil mb-3">
              {product.nameTa}
            </Text>
          ) : null}

          {/* Pricing Row */}
          <View className="flex-row items-baseline gap-3 mb-4">
            <Text className="text-2xl font-extrabold font-mono text-on-surface">
              {formatInr(product.sellPaise)}
            </Text>
            {product.mrpPaise > product.sellPaise ? (
              <>
                <Text className="text-sm font-mono text-on-surface-variant line-through">
                  {formatInr(product.mrpPaise)}
                </Text>
                <View
                  style={{
                    backgroundColor: 'rgba(10, 106, 50, 0.25)',
                    borderColor: 'rgba(110, 231, 183, 0.3)',
                    borderWidth: 1,
                    borderRadius: 6,
                    paddingHorizontal: 6,
                    paddingVertical: 2,
                  }}
                >
                  <Text style={{ fontSize: 11, fontWeight: '800', color: '#6EE7B7' }}>
                    {discountPercent}% OFF
                  </Text>
                </View>
              </>
            ) : null}
          </View>

          {/* Pack Size Selector */}
          <Text className="text-xs font-bold text-on-surface uppercase tracking-wider mb-2">
            Available Pack Sizes
          </Text>
          <View className="flex-row gap-2.5 mb-5">
            {[
              { id: 'Regular', label: product.unit, sub: 'Standard Pack' },
              { id: 'Value', label: 'Twin Pack (2×)', sub: 'Save Extra 5%' },
            ].map((pack) => {
              const active = selectedPack === pack.id;
              return (
                <Pressable
                  key={pack.id}
                  onPress={() => setSelectedPack(pack.id)}
                  style={{
                    flex: 1,
                    backgroundColor: active ? 'rgba(106, 90, 205, 0.15)' : '#1C1B1D',
                    borderColor: active ? '#6A5ACD' : '#2A2A2C',
                    borderWidth: 1.5,
                    borderRadius: 14,
                    padding: 10,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 13,
                      fontWeight: '700',
                      color: active ? '#C8BFFF' : '#E5E1E4',
                    }}
                  >
                    {pack.label}
                  </Text>
                  <Text style={{ fontSize: 10, color: '#928F9E', marginTop: 2 }}>
                    {pack.sub}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* Highlights 4-Box Grid */}
          <Text className="text-xs font-bold text-on-surface uppercase tracking-wider mb-2.5">
            Quality Highlights
          </Text>
          <View className="flex-row flex-wrap justify-between gap-y-2.5 mb-5">
            {[
              { label: 'Farm Fresh & Pure', icon: Sparkles, color: '#6EE7B7' },
              { label: '12-Min Madurai Dispatch', icon: Zap, color: '#FFB59C' },
              { label: '100% Quality Checked', icon: ShieldCheck, color: '#7BD0FF' },
              { label: 'Doorstep Sealed Delivery', icon: Truck, color: '#C8BFFF' },
            ].map((h, i) => {
              const Icon = h.icon;
              return (
                <View
                  key={i}
                  style={{
                    width: '48.5%',
                    backgroundColor: '#1C1B1D',
                    borderColor: '#2A2A2C',
                    borderWidth: 1,
                    borderRadius: 14,
                    padding: 10,
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 8,
                  }}
                >
                  <Icon size={16} color={h.color} />
                  <Text style={{ fontSize: 11, fontWeight: '600', color: '#E5E1E4', flex: 1 }}>
                    {h.label}
                  </Text>
                </View>
              );
            })}
          </View>

          {/* Nutritional & Storage Profile */}
          <FloatingCard className="p-4 mb-5 bg-surface-container-low border-surface-container-high">
            <Text className="text-xs font-bold text-on-surface uppercase tracking-wider mb-2">
              Storage & Origin
            </Text>
            <View className="gap-2">
              <View className="flex-row justify-between">
                <Text className="text-xs text-on-surface-variant">Shelf Life</Text>
                <Text className="text-xs font-semibold text-on-surface">3-5 days refrigerated</Text>
              </View>
              <View className="flex-row justify-between">
                <Text className="text-xs text-on-surface-variant">Sourced From</Text>
                <Text className="text-xs font-semibold text-on-surface">Madurai Local Cooperatives</Text>
              </View>
              <View className="flex-row justify-between">
                <Text className="text-xs text-on-surface-variant">Vendor Hub</Text>
                <Text className="text-xs font-semibold text-on-surface">{product.storeName}</Text>
              </View>
            </View>
          </FloatingCard>

          {/* Related Products Carousel */}
          {relatedProducts.length > 0 ? (
            <View>
              <Text className="text-xs font-bold text-on-surface uppercase tracking-wider mb-2.5">
                Frequently Bought Together
              </Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: 10 }}
              >
                {relatedProducts.map((rel) => (
                  <Pressable
                    key={rel.id}
                    onPress={() => router.push(`/(customer)/grocery/product/${rel.id}` as any)}
                    style={{
                      width: 140,
                      backgroundColor: '#1C1B1D',
                      borderColor: '#2A2A2C',
                      borderWidth: 1,
                      borderRadius: 16,
                      padding: 10,
                    }}
                  >
                    <Image
                      source={{
                        uri:
                          (rel as any).imageUrl ||
                          'https://images.unsplash.com/photo-1542838132-92c53300491e?w=300&q=80',
                      }}
                      contentFit="cover"
                      style={{ width: '100%', height: 75, borderRadius: 10, marginBottom: 6 }}
                    />
                    <Text numberOfLines={1} className="text-xs font-bold text-on-surface">
                      {rel.name}
                    </Text>
                    <Text className="text-[10px] text-on-surface-variant mb-1.5">
                      {rel.unit}
                    </Text>
                    <Text className="text-xs font-mono font-bold text-on-surface">
                      {formatInr(rel.sellPaise)}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>
            </View>
          ) : null}
        </View>
      </ScrollView>

      {/* Sticky Bottom Action Bar */}
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
          flexDirection: 'row',
          alignItems: 'center',
          gap: 12,
        }}
      >
        {/* Stepper or Price Summary */}
        <View style={{ minWidth: 110 }}>
          {qty === 0 ? (
            <View>
              <Text className="text-[10px] text-on-surface-variant uppercase tracking-wider">Total Price</Text>
              <Text className="text-lg font-extrabold font-mono text-on-surface">
                {formatInr(product.sellPaise)}
              </Text>
            </View>
          ) : (
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: '#1C1B1D',
                borderColor: '#2A2A2C',
                borderWidth: 1,
                borderRadius: 14,
                paddingHorizontal: 6,
                height: 46,
              }}
            >
              <Pressable
                onPress={() => {
                  void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  void updateQuantity(product.id, -1);
                }}
                style={{ paddingHorizontal: 8, paddingVertical: 6 }}
              >
                <Minus size={15} color="#E5E1E4" strokeWidth={2.5} />
              </Pressable>
              <Text style={{ fontSize: 14, fontWeight: '800', color: '#FFFFFF', paddingHorizontal: 6 }}>
                {qty}
              </Text>
              <Pressable
                onPress={() => {
                  void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  void addItem({
                    id: product.id,
                    sourceId: product.storeId,
                    sourceName: product.storeName,
                    sourceCategory: 'grocery',
                    localityId: 'central-madurai',
                    name: product.name,
                    unit: product.unit,
                    pricePaise: product.sellPaise,
                    quantity: 1,
                  });
                }}
                style={{ paddingHorizontal: 8, paddingVertical: 6 }}
              >
                <Plus size={15} color="#C8BFFF" strokeWidth={2.5} />
              </Pressable>
            </View>
          )}
        </View>

        {/* Primary Action Button */}
        <Pressable
          disabled={product.inStock === false && qty === 0}
          onPress={() => {
            if (product.inStock === false) return;
            if (qty === 0) {
              void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              void addItem({
                id: product.id,
                sourceId: product.storeId,
                sourceName: product.storeName,
                sourceCategory: 'grocery',
                localityId: 'central-madurai',
                name: product.name,
                unit: product.unit,
                pricePaise: product.sellPaise,
                quantity: 1,
              });
            } else {
              router.push('/(customer)/cart?service=grocery');
            }
          }}
          style={{
            flex: 1,
            height: 48,
            backgroundColor: product.inStock === false && qty === 0 ? '#2A2A2C' : '#6A5ACD',
            borderRadius: 16,
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'row',
            gap: 8,
            shadowColor: '#6A5ACD',
            shadowOpacity: product.inStock === false ? 0 : 0.35,
            shadowRadius: 10,
            elevation: product.inStock === false ? 0 : 4,
          }}
        >
          <ShoppingBag size={18} color={product.inStock === false && qty === 0 ? '#928F9E' : '#FFFFFF'} strokeWidth={2} />
          <Text style={{ fontSize: 14, fontWeight: '800', color: product.inStock === false && qty === 0 ? '#928F9E' : '#FFFFFF' }}>
            {product.inStock === false && qty === 0 ? 'Out of Stock' : qty === 0 ? 'Add to Cart' : `View Cart (${itemCount})`}
          </Text>
        </Pressable>
      </View>
    </Screen>
  );
}
