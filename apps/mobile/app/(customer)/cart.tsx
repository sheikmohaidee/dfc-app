/**
 * DFC Basket & Checkout Screen — Stitch Dark Floating Theme
 * Basket Items List, Steppers, Delivery Address Card, UPI/Card/COD Payment Radio,
 * Bill Breakdown, and Fixed Place Order Button with tactile feedback.
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
  Trash2,
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
import { DFCPressable } from '@/ui/animated';
import { StitchHeader } from '@/ui/stitch-header';

export default function CartScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { profile } = useAuth();
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
    if (
      profile &&
      (profile as any).addresses &&
      Array.isArray((profile as any).addresses) &&
      (profile as any).addresses.length > 0
    ) {
      return (profile as any).addresses;
    }
    return mockProfileRepository.getAddresses();
  }, [profile]);

  const currentAddress = addresses.find((a: any) => a.id === selectedAddrId) || addresses[0]!;

  const handleApplyCoupon = async () => {
    setCouponError(null);
    if (!couponInput.trim()) return;
    void Haptics.selectionAsync();
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
      <Screen edges={['top']} style={{ backgroundColor: '#0E0E10' }}>
        <StitchHeader showBack={true} title="Checkout" showNotifications={false} />

        <View className="flex-1 items-center justify-center gap-4 px-6">
          <View
            style={{
              width: 76,
              height: 76,
              borderRadius: 38,
              backgroundColor: '#1E1D26',
              borderWidth: 1,
              borderColor: '#2E2D38',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <ShoppingBag size={34} color="#6A5ACD" />
          </View>
          <Text
            style={{
              fontFamily: 'PlusJakartaSans',
              fontSize: 20,
              fontWeight: '800',
              color: '#E5E1E4',
            }}
          >
            Your basket is empty
          </Text>
          <Text
            style={{
              fontFamily: 'PlusJakartaSans',
              fontSize: 13,
              color: '#928F9E',
              textAlign: 'center',
              maxWidth: 290,
              lineHeight: 18,
            }}
          >
            Explore authentic Madurai restaurants, daily fresh groceries, or summon a courier runner.
          </Text>
          <Pressable
            onPress={() => router.push('/(customer)/food')}
            style={{
              backgroundColor: '#6A5ACD',
              borderRadius: 14,
              paddingHorizontal: 24,
              paddingVertical: 13,
              marginTop: 10,
            }}
          >
            <Text
              style={{
                fontFamily: 'PlusJakartaSans',
                fontSize: 14,
                fontWeight: '700',
                color: '#FFFFFF',
              }}
            >
              Explore Food & Stores
            </Text>
          </Pressable>
        </View>
      </Screen>
    );
  }

  return (
    <Screen edges={['top']} style={{ backgroundColor: '#0E0E10' }}>
      {/* Header */}
      <StitchHeader
        showBack={true}
        title="Checkout"
        showNotifications={false}
        rightAction={
          <Pressable
            onPress={() => {
              void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              void clearCart();
            }}
            hitSlop={8}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}
          >
            <Trash2 size={15} color="#F87171" />
            <Text
              style={{
                fontFamily: 'PlusJakartaSans',
                fontSize: 12,
                fontWeight: '700',
                color: '#F87171',
              }}
            >
              Clear
            </Text>
          </Pressable>
        }
      />

      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingTop: 16,
          paddingBottom: 130 + Math.max(insets.bottom, 16),
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Your Basket Card */}
        <View
          style={{
            backgroundColor: '#18181B',
            borderRadius: 20,
            borderWidth: 1,
            borderColor: '#26262B',
            padding: 16,
            marginBottom: 16,
          }}
        >
          <View className="flex-row items-center justify-between mb-3.5 pb-2.5 border-b border-[#26262B]">
            <Text
              style={{
                fontFamily: 'PlusJakartaSans',
                fontSize: 15,
                fontWeight: '700',
                color: '#E5E1E4',
              }}
            >
              Your Basket ({itemCount} {itemCount === 1 ? 'item' : 'items'})
            </Text>
            <Text
              style={{
                fontFamily: 'PlusJakartaSans',
                fontSize: 12,
                color: '#C8BFFF',
                fontWeight: '600',
              }}
            >
              {cart.items[0]?.sourceName || 'DFC Express'}
            </Text>
          </View>

          {hasUnavailableItems ? (
            <View
              style={{
                backgroundColor: 'rgba(239, 68, 68, 0.15)',
                borderWidth: 1,
                borderColor: 'rgba(239, 68, 68, 0.3)',
                borderRadius: 12,
                padding: 12,
                marginBottom: 12,
                flexDirection: 'row',
                alignItems: 'flex-start',
                gap: 8,
              }}
            >
              <AlertTriangle size={16} color="#F87171" style={{ marginTop: 2 }} />
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    fontFamily: 'PlusJakartaSans',
                    fontSize: 13,
                    fontWeight: '700',
                    color: '#F87171',
                  }}
                >
                  {unavailableItems.length === 1 ? '1 item is' : `${unavailableItems.length} items are`} currently
                  unavailable
                </Text>
                <Text
                  style={{
                    fontFamily: 'PlusJakartaSans',
                    fontSize: 11,
                    color: '#FCA5A5',
                    marginTop: 2,
                  }}
                >
                  Please remove unavailable items before continuing checkout.
                </Text>
              </View>
            </View>
          ) : null}

          <View className="gap-3">
            {cart.items.map((item) => {
              const isUnavailable = unavailableItems.some((u) => u.id === item.id);
              return (
                <View
                  key={item.id}
                  className="flex-row items-center justify-between"
                  style={isUnavailable ? { opacity: 0.5 } : undefined}
                >
                  <View className="flex-1 pr-3">
                    <Text
                      style={{
                        fontFamily: 'PlusJakartaSans',
                        fontSize: 14,
                        fontWeight: '600',
                        color: isUnavailable ? '#71717A' : '#E5E1E4',
                      }}
                    >
                      {item.name}
                      {isUnavailable ? ' (Unavailable)' : ''}
                    </Text>
                    <Text
                      style={{
                        fontFamily: 'PlusJakartaSans',
                        fontSize: 13,
                        fontWeight: '700',
                        color: '#C8BFFF',
                        marginTop: 2,
                      }}
                    >
                      {formatInr(item.pricePaise * item.quantity)}
                    </Text>
                  </View>

                  {/* Stepper */}
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      backgroundColor: '#26252E',
                      borderWidth: 1,
                      borderColor: '#383742',
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
                      style={{ padding: 4 }}
                    >
                      <Minus size={12} color="#C8BFFF" strokeWidth={2.5} />
                    </Pressable>
                    <Text
                      style={{
                        fontFamily: 'PlusJakartaSans',
                        fontSize: 13,
                        fontWeight: '800',
                        color: '#FFFFFF',
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
                      <Plus size={12} color="#C8BFFF" strokeWidth={2.5} />
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
            style={{
              marginTop: 14,
              paddingTop: 10,
              borderTopWidth: 1,
              borderTopColor: '#26262B',
            }}
          >
            <Text
              style={{
                fontFamily: 'PlusJakartaSans',
                fontSize: 13,
                fontWeight: '700',
                color: '#C8BFFF',
              }}
            >
              + Add more items
            </Text>
          </Pressable>
        </View>

        {/* Delivery Address Card */}
        <View
          style={{
            backgroundColor: '#18181B',
            borderRadius: 20,
            borderWidth: 1,
            borderColor: '#26262B',
            padding: 16,
            marginBottom: 16,
          }}
        >
          <View className="flex-row items-center justify-between mb-2">
            <View className="flex-row items-center gap-2">
              <MapPin size={17} color="#C8BFFF" />
              <Text
                style={{
                  fontFamily: 'PlusJakartaSans',
                  fontSize: 15,
                  fontWeight: '700',
                  color: '#E5E1E4',
                }}
              >
                Delivery Address
              </Text>
            </View>
            <Pressable onPress={() => router.push('/(customer)/account/addresses')}>
              <Text
                style={{
                  fontFamily: 'PlusJakartaSans',
                  fontSize: 13,
                  fontWeight: '700',
                  color: '#C8BFFF',
                }}
              >
                Change
              </Text>
            </Pressable>
          </View>

          <Text
            style={{
              fontFamily: 'PlusJakartaSans',
              fontSize: 14,
              fontWeight: '700',
              color: '#E5E1E4',
              marginBottom: 2,
            }}
          >
            {currentAddress.title} - {currentAddress.label}
          </Text>
          <Text
            style={{
              fontFamily: 'PlusJakartaSans',
              fontSize: 13,
              color: '#928F9E',
              lineHeight: 18,
              marginBottom: 10,
            }}
          >
            {currentAddress.street}, {currentAddress.pincode}
          </Text>

          {/* Delivery ETA Pill */}
          <View
            style={{
              alignSelf: 'flex-start',
              flexDirection: 'row',
              alignItems: 'center',
              gap: 6,
              backgroundColor: 'rgba(16, 185, 129, 0.15)',
              paddingHorizontal: 10,
              paddingVertical: 4,
              borderRadius: 9999,
              borderWidth: 1,
              borderColor: 'rgba(16, 185, 129, 0.3)',
            }}
          >
            <Clock size={12} color="#10B981" />
            <Text
              style={{
                fontFamily: 'PlusJakartaSans',
                fontSize: 11,
                fontWeight: '700',
                color: '#34D399',
              }}
            >
              Express Doorstep · 20-30 mins
            </Text>
          </View>
        </View>

        {/* Coupons & Promo Codes */}
        <View
          style={{
            backgroundColor: '#18181B',
            borderRadius: 20,
            borderWidth: 1,
            borderColor: '#26262B',
            padding: 16,
            marginBottom: 16,
          }}
        >
          <View className="flex-row items-center gap-2 mb-3">
            <Percent size={16} color="#FBBF24" />
            <Text
              style={{
                fontFamily: 'PlusJakartaSans',
                fontSize: 14,
                fontWeight: '700',
                color: '#E5E1E4',
              }}
            >
              Offers & Coupons
            </Text>
          </View>

          {cart.appliedCoupon ? (
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                backgroundColor: 'rgba(16, 185, 129, 0.15)',
                padding: 12,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: 'rgba(16, 185, 129, 0.3)',
              }}
            >
              <View>
                <Text
                  style={{
                    fontFamily: 'PlusJakartaSans',
                    fontSize: 13,
                    fontWeight: '700',
                    color: '#34D399',
                  }}
                >
                  '{cart.appliedCoupon}' Applied!
                </Text>
                <Text style={{ fontFamily: 'PlusJakartaSans', fontSize: 11, color: '#6EE7B7' }}>
                  You saved {formatInr(discountPaise)}
                </Text>
              </View>
              <Pressable onPress={() => void removeCoupon()}>
                <Text
                  style={{
                    fontFamily: 'PlusJakartaSans',
                    fontSize: 12,
                    fontWeight: '700',
                    color: '#F87171',
                  }}
                >
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
                  placeholderTextColor="#5C5A64"
                  autoCapitalize="characters"
                  style={{
                    flex: 1,
                    height: 44,
                    borderWidth: 1,
                    borderColor: '#2D2C34',
                    borderRadius: 12,
                    paddingHorizontal: 12,
                    fontFamily: 'PlusJakartaSans',
                    fontSize: 13,
                    color: '#E5E1E4',
                    backgroundColor: '#121215',
                  }}
                />
                <Pressable
                  onPress={handleApplyCoupon}
                  style={{
                    height: 44,
                    backgroundColor: '#6A5ACD',
                    borderRadius: 12,
                    paddingHorizontal: 16,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Text
                    style={{
                      fontFamily: 'PlusJakartaSans',
                      fontSize: 13,
                      fontWeight: '700',
                      color: '#FFFFFF',
                    }}
                  >
                    Apply
                  </Text>
                </Pressable>
              </View>
              {couponError ? (
                <Text
                  style={{
                    fontFamily: 'PlusJakartaSans',
                    fontSize: 12,
                    color: '#F87171',
                    marginTop: 6,
                  }}
                >
                  {couponError}
                </Text>
              ) : null}
            </View>
          )}
        </View>

        {/* Payment Method Selector */}
        <View
          style={{
            backgroundColor: '#18181B',
            borderRadius: 20,
            borderWidth: 1,
            borderColor: '#26262B',
            padding: 16,
            marginBottom: 16,
          }}
        >
          <Text
            style={{
              fontFamily: 'PlusJakartaSans',
              fontSize: 14,
              fontWeight: '700',
              color: '#E5E1E4',
              marginBottom: 12,
            }}
          >
            Payment Mode
          </Text>

          <View className="gap-2.5">
            {[
              {
                id: 'upi_intent' as const,
                title: 'UPI (Google Pay / PhonePe / Paytm)',
                icon: <QrCode size={18} color="#C8BFFF" />,
              },
              {
                id: 'gateway' as const,
                title: 'Credit / Debit Card / Net Banking',
                icon: <CreditCard size={18} color="#C8BFFF" />,
              },
              {
                id: 'cash' as const,
                title: 'Cash on Delivery (COD)',
                icon: <Truck size={18} color="#C8BFFF" />,
              },
            ].map((method) => {
              const isSelected = paymentMethod === method.id;
              return (
                <DFCPressable
                  key={method.id}
                  scaleTo={0.98}
                  onPress={() => {
                    void Haptics.selectionAsync();
                    setPaymentMethod(method.id);
                  }}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: 14,
                    borderRadius: 14,
                    borderWidth: 1,
                    borderColor: isSelected ? '#6A5ACD' : '#26262B',
                    backgroundColor: isSelected ? '#1F1E26' : '#121215',
                  }}
                >
                  <View className="flex-row items-center gap-3">
                    {method.icon}
                    <Text
                      style={{
                        fontFamily: 'PlusJakartaSans',
                        fontSize: 13,
                        fontWeight: isSelected ? '700' : '500',
                        color: isSelected ? '#FFFFFF' : '#C9C5D0',
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
                      borderColor: isSelected ? '#6A5ACD' : '#35343A',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {isSelected ? (
                      <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: '#6A5ACD' }} />
                    ) : null}
                  </View>
                </DFCPressable>
              );
            })}
          </View>
        </View>

        {/* Bill Summary */}
        <View
          style={{
            backgroundColor: '#18181B',
            borderRadius: 20,
            borderWidth: 1,
            borderColor: '#26262B',
            padding: 16,
            marginBottom: 20,
          }}
        >
          <Text
            style={{
              fontFamily: 'PlusJakartaSans',
              fontSize: 14,
              fontWeight: '700',
              color: '#E5E1E4',
              marginBottom: 12,
            }}
          >
            Bill Details
          </Text>

          <View className="gap-2 pb-3 border-b border-[#26262B]">
            <View className="flex-row items-center justify-between">
              <Text style={{ fontFamily: 'PlusJakartaSans', fontSize: 13, color: '#928F9E' }}>Item Total</Text>
              <Text style={{ fontFamily: 'PlusJakartaSans', fontSize: 13, fontWeight: '600', color: '#E5E1E4' }}>
                {formatInr(subtotalPaise)}
              </Text>
            </View>

            <View className="flex-row items-center justify-between">
              <Text style={{ fontFamily: 'PlusJakartaSans', fontSize: 13, color: '#928F9E' }}>Delivery Partner Fee</Text>
              <Text style={{ fontFamily: 'PlusJakartaSans', fontSize: 13, fontWeight: '600', color: '#E5E1E4' }}>
                {deliveryFeePaise === 0 ? 'FREE' : formatInr(deliveryFeePaise)}
              </Text>
            </View>

            <View className="flex-row items-center justify-between">
              <Text style={{ fontFamily: 'PlusJakartaSans', fontSize: 13, color: '#928F9E' }}>Taxes & Handling</Text>
              <Text style={{ fontFamily: 'PlusJakartaSans', fontSize: 13, fontWeight: '600', color: '#E5E1E4' }}>
                {formatInr(taxPaise + platformFeePaise)}
              </Text>
            </View>

            {discountPaise > 0 ? (
              <View className="flex-row items-center justify-between">
                <Text style={{ fontFamily: 'PlusJakartaSans', fontSize: 13, fontWeight: '600', color: '#34D399' }}>
                  Coupon Discount
                </Text>
                <Text style={{ fontFamily: 'PlusJakartaSans', fontSize: 13, fontWeight: '700', color: '#34D399' }}>
                  -{formatInr(discountPaise)}
                </Text>
              </View>
            ) : null}
          </View>

          <View className="flex-row items-center justify-between pt-3">
            <Text style={{ fontFamily: 'PlusJakartaSans', fontSize: 16, fontWeight: '800', color: '#E5E1E4' }}>
              Grand Total
            </Text>
            <Text style={{ fontFamily: 'PlusJakartaSans', fontSize: 20, fontWeight: '800', color: '#C8BFFF' }}>
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
          backgroundColor: '#18181B',
          borderTopWidth: 1,
          borderTopColor: '#26262B',
          paddingHorizontal: 16,
          paddingTop: 12,
          paddingBottom: Math.max(insets.bottom, 16),
          shadowColor: '#000000',
          shadowOpacity: 0.2,
          shadowRadius: 10,
          elevation: 8,
        }}
      >
        <DFCPressable
          scaleTo={0.97}
          onPress={handlePlaceOrder}
          disabled={placingOrder || hasUnavailableItems}
          style={{
            backgroundColor: hasUnavailableItems ? '#35343A' : '#6A5ACD',
            height: 52,
            borderRadius: 14,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            shadowColor: '#6A5ACD',
            shadowOpacity: hasUnavailableItems ? 0 : 0.4,
            shadowRadius: 10,
            elevation: hasUnavailableItems ? 0 : 4,
          }}
        >
          <Text style={{ fontFamily: 'PlusJakartaSans', fontSize: 16, fontWeight: '800', color: '#FFFFFF' }}>
            {hasUnavailableItems
              ? 'Remove unavailable items to proceed'
              : placingOrder
              ? 'Confirming Order...'
              : `Place Order • Pay ${formatInr(totalPaise)} →`}
          </Text>
        </DFCPressable>
      </View>
    </Screen>
  );
}
