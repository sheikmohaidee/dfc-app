/**
 * DFC Basket & Checkout Screen - Full Stitch Design Implementation
 * Your Basket Card, Steppers, Delivery Address Card, UPI/Card/COD Payment Radio, Bill Breakdown, and Fixed Place Order Button.
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
import { useRouter, useLocalSearchParams } from 'expo-router';
import {
  AlertTriangle,
  ArrowLeft,
  Check,
  CheckCircle2,
  Clock,
  CreditCard,
  Edit2,
  MapPin,
  Minus,
  Percent,
  Plus,
  QrCode,
  ShieldCheck,
  ShoppingBag,
  Truck,
  Utensils,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

import { formatInr, type Category, type PaymentMethod, type UserProfile } from '@dfc/core';
import { DEMO_MODE } from '@/demo/config';
import { createOrderFromCart } from '@/lib/orders';
import { useAuth } from '@/providers/auth';
import { mockOrderRepository } from '@/demo/repositories/order.repository';
import { mockProfileRepository } from '@/demo/repositories/profile.repository';
import { mockMenuRepository } from '@/demo/repositories/menu.repository';
import { useCart } from '@/providers/cart';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Screen } from '@/ui';

export default function CartScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { profile } = useAuth();
  // The checkout always belongs to exactly one service — the one whose cart
  // bar was tapped. Other service carts and active orders are untouched.
  const { service: serviceParam } = useLocalSearchParams<{ service?: string }>();
  const service = (serviceParam as Category) || 'food';
  const {
    cart,
    itemCount,
    subtotalPaise,
    totalPaise,
    deliveryFeePaise,
    platformFeePaise,
    taxPaise,
    discountPaise,
    updateQuantity,
    clearCart,
    applyCoupon,
    removeCoupon,
  } = useCart(service);

  const [menuVer, setMenuVer] = React.useState(0);
  React.useEffect(() => {
    return mockMenuRepository.subscribe(() => setMenuVer((v) => v + 1));
  }, []);

  const unavailableItems = React.useMemo(() => {
    return cart.items.filter((item) => !mockMenuRepository.isItemAvailable(item.id));
  }, [cart.items, menuVer]);

  const hasUnavailableItems = unavailableItems.length > 0;

  const [paymentMethod, setPaymentMethod] = React.useState<PaymentMethod>('upi_intent');
  const [selectedAddrId, setSelectedAddrId] = React.useState<string>('addr-home');
  const [couponInput, setCouponInput] = React.useState('');
  const [couponError, setCouponError] = React.useState<string | null>(null);
  const [placingOrder, setPlacingOrder] = React.useState(false);

  const addresses = React.useMemo(() => {
    if (profile && (profile as any).addresses && Array.isArray((profile as any).addresses) && (profile as any).addresses.length > 0) {
      return (profile as any).addresses;
    }
    return mockProfileRepository.getAddresses();
  }, [profile]);

  const currentAddress = addresses.find((a: any) => a.id === selectedAddrId) || addresses[0]!;

  const handleApplyCoupon = async () => {
    setCouponError(null);
    if (!couponInput.trim()) return;
    const res = await applyCoupon(couponInput);
    if (!res.success) {
      setCouponError(res.message);
    } else {
      setCouponInput('');
    }
  };

  const handlePlaceOrder = async () => {
    if (cart.items.length === 0) return;
    setPlacingOrder(true);
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    try {
      let order;
      if (!DEMO_MODE && profile) {
        order = await createOrderFromCart({
          customer: profile,
          cart,
          address: currentAddress,
          paymentMethod,
        });
        await clearCart();
      } else {
        order = await mockOrderRepository.createFromCart(
          cart,
          currentAddress,
          paymentMethod,
        );
      }
      router.replace(`/(customer)/order/${order.id}` as any);
    } catch (err: any) {
      Alert.alert('Order Placement Failed', err?.message || 'Please check your connection and try again.');
    } finally {
      setPlacingOrder(false);
    }
  };

  if (itemCount === 0) {
    return (
      <Screen edges={['top']}>
        {/* Header */}
        <View
          style={{
            height: 60,
            backgroundColor: '#F9F9FF',
            paddingHorizontal: 20,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 12,
            borderBottomWidth: 1,
            borderBottomColor: '#DAC0C430',
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
          <Text style={{ fontFamily: 'Archivo', fontSize: 20, fontWeight: '800', color: '#7A1F3D' }}>
            Checkout
          </Text>
        </View>

        <View className="flex-1 items-center justify-center gap-4 px-6">
          <View
            style={{
              width: 72,
              height: 72,
              borderRadius: 36,
              backgroundColor: '#E9EDFF',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <ShoppingBag size={32} color="#7A1F3D" />
          </View>
          <Text style={{ fontFamily: 'Archivo', fontSize: 20, fontWeight: '800', color: '#141B2B' }}>
            Your basket is empty
          </Text>
          <Text style={{ fontFamily: 'Archivo', fontSize: 13, color: '#554245', textAlign: 'center', maxWidth: 280 }}>
            Explore authentic Madurai kitchens, medicines, groceries, or book an express errand.
          </Text>
          <Pressable
            onPress={() => router.push('/(customer)/food')}
            style={{
              backgroundColor: '#7A1F3D',
              borderRadius: 12,
              paddingHorizontal: 24,
              paddingVertical: 12,
              marginTop: 8,
            }}
          >
            <Text style={{ fontFamily: 'Archivo', fontSize: 14, fontWeight: '700', color: '#FFFFFF' }}>
              Explore Food & Stores
            </Text>
          </Pressable>
        </View>
      </Screen>
    );
  }

  return (
    <Screen edges={['top']}>
      {/* Header */}
      <View
        style={{
          height: 60,
          backgroundColor: '#F9F9FF',
          paddingHorizontal: 20,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottomWidth: 1,
          borderBottomColor: '#DAC0C430',
        }}
      >
        <View className="flex-row items-center gap-3">
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
          <Text style={{ fontFamily: 'Archivo', fontSize: 22, fontWeight: '800', color: '#7A1F3D' }}>
            Checkout
          </Text>
        </View>

        <Pressable onPress={() => void clearCart()}>
          <Text style={{ fontFamily: 'Archivo', fontSize: 13, fontWeight: '600', color: '#BA1A1A' }}>
            Clear
          </Text>
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingTop: 16,
          paddingBottom: 120 + Math.max(insets.bottom, 16),
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Your Basket Card */}
        <View
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: 16,
            borderWidth: 1,
            borderColor: '#DAC0C4',
            padding: 16,
            marginBottom: 16,
            shadowColor: '#000000',
            shadowOpacity: 0.04,
            shadowRadius: 10,
            elevation: 2,
          }}
        >
          <View className="flex-row items-center justify-between mb-3 pb-2 border-b border-[#DAC0C4]/30">
            <Text style={{ fontFamily: 'Archivo', fontSize: 16, fontWeight: '700', color: '#141B2B' }}>
              Your Basket ({itemCount} {itemCount === 1 ? 'item' : 'items'})
            </Text>
            <Text style={{ fontFamily: 'Archivo', fontSize: 12, color: '#554245' }}>
              {cart.items[0]?.sourceName || 'DFC Express'}
            </Text>
          </View>

          {hasUnavailableItems ? (
            <View
              style={{
                backgroundColor: '#FEF2F2',
                borderWidth: 1,
                borderColor: '#FECACA',
                borderRadius: 10,
                padding: 12,
                marginBottom: 12,
                flexDirection: 'row',
                alignItems: 'flex-start',
                gap: 8,
              }}
            >
              <AlertTriangle size={16} color="#BA1A1A" style={{ marginTop: 2 }} />
              <View style={{ flex: 1 }}>
                <Text style={{ fontFamily: 'Archivo', fontSize: 13, fontWeight: '700', color: '#BA1A1A' }}>
                  {unavailableItems.length === 1 ? '1 item is' : `${unavailableItems.length} items are`} currently unavailable
                </Text>
                <Text style={{ fontFamily: 'Archivo', fontSize: 12, color: '#7F1D1D', marginTop: 2 }}>
                  Please remove unavailable items before continuing.
                </Text>
              </View>
            </View>
          ) : null}

          <View className="gap-3">
            {cart.items.map((item) => {
              const isUnavailable = unavailableItems.some((u) => u.id === item.id);
              return (
              <View key={item.id} className="flex-row items-center justify-between" style={isUnavailable ? { opacity: 0.5 } : undefined}>
                <View className="flex-1 pr-3">
                  <Text style={{ fontFamily: 'Archivo', fontSize: 15, fontWeight: '700', color: isUnavailable ? '#9CA3AF' : '#141B2B' }}>
                    {item.name}{isUnavailable ? ' (Unavailable)' : ''}
                  </Text>
                  <Text style={{ fontFamily: 'Archivo', fontSize: 13, fontWeight: '700', color: '#7A1F3D', marginTop: 2 }}>
                    {formatInr(item.pricePaise * item.quantity)}
                  </Text>
                </View>

                {/* Stepper */}
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    backgroundColor: '#FFFFFF',
                    borderWidth: 1.5,
                    borderColor: '#7A1F3D',
                    borderRadius: 8,
                    paddingHorizontal: 6,
                    height: 32,
                  }}
                >
                  <Pressable
                    onPress={() => {
                      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      void updateQuantity(item.id, -1);
                    }}
                    style={{ padding: 4 }}
                  >
                    <Minus size={12} color="#7A1F3D" strokeWidth={2.5} />
                  </Pressable>
                  <Text
                    style={{
                      fontFamily: 'Archivo',
                      fontSize: 13,
                      fontWeight: '800',
                      color: '#7A1F3D',
                      minWidth: 20,
                      textAlign: 'center',
                    }}
                  >
                    {item.quantity}
                  </Text>
                  <Pressable
                    onPress={() => {
                      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      void updateQuantity(item.id, 1);
                    }}
                    style={{ padding: 4 }}
                  >
                    <Plus size={12} color="#7A1F3D" strokeWidth={2.5} />
                  </Pressable>
                </View>
              </View>
              );
            })}
          </View>

          {/* Add more items link */}
          <Pressable
            onPress={() =>
              router.push(
                (service === 'grocery'
                  ? '/(customer)/grocery'
                  : service === 'print'
                  ? '/(customer)/print'
                  : '/(customer)/food') as any,
              )
            }
            style={{ marginTop: 14, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#DAC0C430' }}
          >
            <Text style={{ fontFamily: 'Archivo', fontSize: 13, fontWeight: '700', color: '#7A1F3D' }}>
              + Add more items
            </Text>
          </Pressable>
        </View>

        {/* Delivery Address Card */}
        <View
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: 16,
            borderWidth: 1,
            borderColor: '#DAC0C4',
            padding: 16,
            marginBottom: 16,
            shadowColor: '#000000',
            shadowOpacity: 0.04,
            shadowRadius: 10,
            elevation: 2,
          }}
        >
          <View className="flex-row items-center justify-between mb-2">
            <View className="flex-row items-center gap-2">
              <MapPin size={18} color="#7A1F3D" />
              <Text style={{ fontFamily: 'Archivo', fontSize: 15, fontWeight: '700', color: '#141B2B' }}>
                Delivery Address
              </Text>
            </View>
            <Pressable onPress={() => router.push('/(customer)/account/addresses')}>
              <Text style={{ fontFamily: 'Archivo', fontSize: 13, fontWeight: '700', color: '#7A1F3D' }}>
                Change
              </Text>
            </Pressable>
          </View>

          <Text style={{ fontFamily: 'Archivo', fontSize: 14, fontWeight: '700', color: '#141B2B', marginBottom: 2 }}>
            {currentAddress.title} - {currentAddress.label}
          </Text>
          <Text style={{ fontFamily: 'Archivo', fontSize: 13, color: '#554245', lineHeight: 18, marginBottom: 10 }}>
            {currentAddress.street}, {currentAddress.pincode}
          </Text>

          {/* Delivery ETA Pill */}
          <View
            style={{
              alignSelf: 'flex-start',
              flexDirection: 'row',
              alignItems: 'center',
              gap: 6,
              backgroundColor: '#ECFDF5',
              paddingHorizontal: 10,
              paddingVertical: 4,
              borderRadius: 9999,
              borderWidth: 1,
              borderColor: '#05966930',
            }}
          >
            <Clock size={12} color="#059669" />
            <Text style={{ fontFamily: 'Archivo', fontSize: 11, fontWeight: '700', color: '#065F46' }}>
              Delivery in 25-30 mins
            </Text>
          </View>
        </View>

        {/* Coupons & Promo Codes */}
        <View
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: 16,
            borderWidth: 1,
            borderColor: '#DAC0C4',
            padding: 16,
            marginBottom: 16,
          }}
        >
          <View className="flex-row items-center gap-2 mb-3">
            <Percent size={16} color="#D97706" />
            <Text style={{ fontFamily: 'Archivo', fontSize: 14, fontWeight: '700', color: '#141B2B' }}>
              Offers & Promo Codes
            </Text>
          </View>

          {cart.appliedCoupon ? (
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                backgroundColor: '#ECFDF5',
                padding: 10,
                borderRadius: 8,
                borderWidth: 1,
                borderColor: '#05966930',
              }}
            >
              <View>
                <Text style={{ fontFamily: 'Archivo', fontSize: 13, fontWeight: '700', color: '#065F46' }}>
                  '{cart.appliedCoupon}' Applied!
                </Text>
                <Text style={{ fontFamily: 'Archivo', fontSize: 11, color: '#047857' }}>
                  You saved {formatInr(discountPaise)}
                </Text>
              </View>
              <Pressable onPress={() => void removeCoupon()}>
                <Text style={{ fontFamily: 'Archivo', fontSize: 12, fontWeight: '700', color: '#BA1A1A' }}>
                  Remove
                </Text>
              </Pressable>
            </View>
          ) : (
            <View>
              <View className="flex-row items-center gap-2">
                <TextInput
                  value={couponInput}
                  onChangeText={setCouponInput}
                  placeholder="Enter code (DFC50 or FIRSTORDER)"
                  placeholderTextColor="#887275"
                  autoCapitalize="characters"
                  style={{
                    flex: 1,
                    height: 42,
                    borderWidth: 1,
                    borderColor: '#DAC0C4',
                    borderRadius: 8,
                    paddingHorizontal: 12,
                    fontFamily: 'Archivo',
                    fontSize: 13,
                    color: '#141B2B',
                    backgroundColor: '#F9F9FF',
                  }}
                />
                <Pressable
                  onPress={handleApplyCoupon}
                  style={{
                    height: 42,
                    backgroundColor: '#7A1F3D',
                    borderRadius: 8,
                    paddingHorizontal: 16,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Text style={{ fontFamily: 'Archivo', fontSize: 13, fontWeight: '700', color: '#FFFFFF' }}>
                    Apply
                  </Text>
                </Pressable>
              </View>
              {couponError ? (
                <Text style={{ fontFamily: 'Archivo', fontSize: 12, color: '#BA1A1A', marginTop: 4 }}>
                  {couponError}
                </Text>
              ) : null}
            </View>
          )}
        </View>

        {/* Payment Method Selector */}
        <View
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: 16,
            borderWidth: 1,
            borderColor: '#DAC0C4',
            padding: 16,
            marginBottom: 16,
          }}
        >
          <Text style={{ fontFamily: 'Archivo', fontSize: 14, fontWeight: '700', color: '#141B2B', marginBottom: 12 }}>
            Payment Method
          </Text>

          <View className="gap-2.5">
            {[
              {
                id: 'upi_intent' as const,
                title: 'UPI (Google Pay / PhonePe / Paytm)',
                icon: <QrCode size={18} color="#7A1F3D" />,
              },
              {
                id: 'gateway' as const,
                title: 'Credit / Debit Card',
                icon: <CreditCard size={18} color="#7A1F3D" />,
              },
              {
                id: 'cash' as const,
                title: 'Cash on Delivery (COD)',
                icon: <Truck size={18} color="#7A1F3D" />,
              },
            ].map((method) => {
              const isSelected = paymentMethod === method.id;
              return (
                <Pressable
                  key={method.id}
                  onPress={() => {
                    void Haptics.selectionAsync();
                    setPaymentMethod(method.id);
                  }}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: 12,
                    borderRadius: 10,
                    borderWidth: 1,
                    borderColor: isSelected ? '#7A1F3D' : '#DAC0C4',
                    backgroundColor: isSelected ? '#FDF2F5' : '#FFFFFF',
                  }}
                >
                  <View className="flex-row items-center gap-3">
                    {method.icon}
                    <Text
                      style={{
                        fontFamily: 'Archivo',
                        fontSize: 14,
                        fontWeight: isSelected ? '700' : '500',
                        color: '#141B2B',
                      }}
                    >
                      {method.title}
                    </Text>
                  </View>

                  <View
                    style={{
                      width: 20,
                      height: 20,
                      borderRadius: 10,
                      borderWidth: 2,
                      borderColor: isSelected ? '#7A1F3D' : '#DAC0C4',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {isSelected ? (
                      <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: '#7A1F3D' }} />
                    ) : null}
                  </View>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Bill Summary */}
        <View
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: 16,
            borderWidth: 1,
            borderColor: '#DAC0C4',
            padding: 16,
            marginBottom: 20,
          }}
        >
          <Text style={{ fontFamily: 'Archivo', fontSize: 14, fontWeight: '700', color: '#141B2B', marginBottom: 12 }}>
            Bill Details
          </Text>

          <View className="gap-2 pb-3 border-b border-[#DAC0C4]/40">
            <View className="flex-row items-center justify-between">
              <Text style={{ fontFamily: 'Archivo', fontSize: 13, color: '#554245' }}>Item Total</Text>
              <Text style={{ fontFamily: 'Archivo', fontSize: 13, fontWeight: '600', color: '#141B2B' }}>
                {formatInr(subtotalPaise)}
              </Text>
            </View>

            <View className="flex-row items-center justify-between">
              <Text style={{ fontFamily: 'Archivo', fontSize: 13, color: '#554245' }}>Delivery Fee</Text>
              <Text style={{ fontFamily: 'Archivo', fontSize: 13, fontWeight: '600', color: '#141B2B' }}>
                {formatInr(deliveryFeePaise)}
              </Text>
            </View>

            <View className="flex-row items-center justify-between">
              <Text style={{ fontFamily: 'Archivo', fontSize: 13, color: '#554245' }}>Taxes & Charges</Text>
              <Text style={{ fontFamily: 'Archivo', fontSize: 13, fontWeight: '600', color: '#141B2B' }}>
                {formatInr(taxPaise + platformFeePaise)}
              </Text>
            </View>

            {discountPaise > 0 ? (
              <View className="flex-row items-center justify-between">
                <Text style={{ fontFamily: 'Archivo', fontSize: 13, fontWeight: '600', color: '#059669' }}>
                  Promo Discount
                </Text>
                <Text style={{ fontFamily: 'Archivo', fontSize: 13, fontWeight: '700', color: '#059669' }}>
                  -{formatInr(discountPaise)}
                </Text>
              </View>
            ) : null}
          </View>

          <View className="flex-row items-center justify-between pt-3">
            <Text style={{ fontFamily: 'Archivo', fontSize: 16, fontWeight: '800', color: '#141B2B' }}>
              Grand Total
            </Text>
            <Text style={{ fontFamily: 'Archivo', fontSize: 20, fontWeight: '800', color: '#7A1F3D' }}>
              {formatInr(totalPaise)}
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Fixed Bottom Checkout Bar */}
      <View
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          backgroundColor: '#FFFFFF',
          borderTopWidth: 1,
          borderTopColor: '#DAC0C4',
          paddingHorizontal: 20,
          paddingTop: 12,
          paddingBottom: Math.max(insets.bottom, 16),
          shadowColor: '#000000',
          shadowOpacity: 0.08,
          shadowRadius: 10,
          elevation: 8,
        }}
      >
        <Pressable
          onPress={handlePlaceOrder}
          disabled={placingOrder || hasUnavailableItems}
          style={{
            backgroundColor: hasUnavailableItems ? '#D1D5DB' : '#7A1F3D',
            height: 52,
            borderRadius: 12,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            shadowColor: '#7A1F3D',
            shadowOpacity: hasUnavailableItems ? 0 : 0.3,
            shadowRadius: 8,
            shadowOffset: { width: 0, height: 4 },
            elevation: hasUnavailableItems ? 0 : 4,
          }}
        >
          <Text style={{ fontFamily: 'Archivo', fontSize: 16, fontWeight: '800', color: '#FFFFFF' }}>
            {hasUnavailableItems
              ? 'Remove unavailable items to continue'
              : placingOrder
                ? 'Placing Order...'
                : `Place Order • Pay ${formatInr(totalPaise)} →`}
          </Text>
        </Pressable>
      </View>
    </Screen>
  );
}
