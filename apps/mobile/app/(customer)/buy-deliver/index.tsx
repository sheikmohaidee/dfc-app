/**
 * DFC Buy & Deliver Screen — Stitch Dark Floating Theme
 * Request Captain to purchase items from any store in Madurai and deliver to doorstep.
 */

import * as React from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import {
  ArrowLeft,
  Check,
  Clock,
  MapPin,
  ShoppingBag,
  Sparkles,
  ShieldCheck,
  Store,
  Receipt,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

import { formatInr } from '@dfc/core';
import { mockGenieRepository } from '@/demo/repositories/genie.repository';
import { mockOrderRepository } from '@/demo/repositories/order.repository';
import { Screen } from '@/ui';
import { DFCPressable } from '@/ui/animated';
import { StitchHeader } from '@/ui/stitch-header';

export default function BuyDeliverScreen() {
  const router = useRouter();

  const [storeName, setStoreName] = React.useState('Preetha Sweets & Bakery, Simmakkal');
  const [itemsList, setItemsList] = React.useState('1 kg Special Ghee Mysore Pak, 500g Mixture');
  const [estimatedBudget, setEstimatedBudget] = React.useState('650');
  const [dropAddr, setDropAddr] = React.useState('No 12, West Tower Street, Simmakkal');
  const [dropPhone, setDropPhone] = React.useState('+919876500002');
  const [instructions, setInstructions] = React.useState('Please ensure freshly packed box with bill attached.');
  const [busy, setBusy] = React.useState(false);

  const quote = React.useMemo(() => {
    return mockGenieRepository.calculateQuote(
      {
        kind: 'buy_deliver',
        pickupAddress: storeName,
        pickupPhone: '',
        dropAddress: dropAddr,
        dropPhone,
        instructions,
      },
      3.2,
    );
  }, [storeName, dropAddr, dropPhone, instructions]);

  async function onBookBuy() {
    setBusy(true);
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const order = await mockOrderRepository.createDirectOrder({
      category: 'concierge',
      storeName: `Buy & Deliver: ${storeName}`,
      items: [
        {
          name: `Purchase: ${itemsList.slice(0, 45)}...`,
          quantity: 1,
          pricePaise: quote.totalPaise,
        },
      ],
      totalPaise: quote.totalPaise,
      transcript: `Buy from: ${storeName}. Items: ${itemsList}. Estimated budget: ₹${estimatedBudget}. Notes: ${instructions}`,
    });
    setBusy(false);
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    router.push(`/(customer)/order/${order.id}` as any);
  }

  return (
    <Screen edges={['top']} style={{ backgroundColor: '#0E0E10' }}>
      <StitchHeader
        showBack={true}
        title="Buy & Deliver Anything"
        subtitle="Captain purchases from any Madurai store"
        showNotifications={false}
      />

      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingTop: 16,
          paddingBottom: 48,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Banner Card */}
        <View
          style={{
            backgroundColor: '#1C1B24',
            borderRadius: 18,
            borderWidth: 1,
            borderColor: 'rgba(106, 90, 205, 0.3)',
            padding: 16,
            marginBottom: 20,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 12,
          }}
        >
          <View
            style={{
              width: 44,
              height: 44,
              borderRadius: 14,
              backgroundColor: 'rgba(106, 90, 205, 0.2)',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Receipt size={22} color="#C8BFFF" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontFamily: 'PlusJakartaSans', fontSize: 14, fontWeight: '700', color: '#E5E1E4' }}>
              Genuine Store Receipts Guaranteed
            </Text>
            <Text style={{ fontFamily: 'PlusJakartaSans', fontSize: 11, color: '#928F9E', marginTop: 2 }}>
              Your captain pays in cash/UPI at the shop and hands over the store's physical bill upon delivery.
            </Text>
          </View>
        </View>

        {/* Purchase Order Form */}
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
              fontSize: 13,
              fontWeight: '700',
              color: '#E5E1E4',
              letterSpacing: 0.5,
              marginBottom: 14,
            }}
          >
            PURCHASE DETAILS
          </Text>

          {/* Store Name */}
          <View className="mb-4">
            <View className="flex-row items-center gap-1.5 mb-1.5">
              <Store size={13} color="#6EE7B7" />
              <Text style={{ fontFamily: 'PlusJakartaSans', fontSize: 12, fontWeight: '600', color: '#C9C5D0' }}>
                Store Name & Location
              </Text>
            </View>
            <TextInput
              value={storeName}
              onChangeText={setStoreName}
              placeholder="e.g. Nagapattinam Nei Mittai, Simmakkal"
              placeholderTextColor="#5C5A64"
              style={{
                borderRadius: 12,
                borderWidth: 1,
                borderColor: '#2D2C34',
                backgroundColor: '#121215',
                paddingHorizontal: 14,
                paddingVertical: 10,
                fontFamily: 'PlusJakartaSans',
                fontSize: 13,
                color: '#E5E1E4',
              }}
            />
          </View>

          {/* Items to buy */}
          <View className="mb-4">
            <Text
              style={{
                fontFamily: 'PlusJakartaSans',
                fontSize: 12,
                fontWeight: '600',
                color: '#C9C5D0',
                marginBottom: 6,
              }}
            >
              Items to Purchase & Quantities
            </Text>
            <TextInput
              value={itemsList}
              onChangeText={setItemsList}
              multiline
              numberOfLines={3}
              placeholder="List items, brand, quantity"
              placeholderTextColor="#5C5A64"
              style={{
                minHeight: 70,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: '#2D2C34',
                backgroundColor: '#121215',
                padding: 12,
                fontFamily: 'PlusJakartaSans',
                fontSize: 13,
                color: '#E5E1E4',
                textAlignVertical: 'top',
              }}
            />
          </View>

          {/* Estimated Budget */}
          <View className="mb-4">
            <Text
              style={{
                fontFamily: 'PlusJakartaSans',
                fontSize: 12,
                fontWeight: '600',
                color: '#C9C5D0',
                marginBottom: 6,
              }}
            >
              Estimated Purchase Budget (₹)
            </Text>
            <TextInput
              value={estimatedBudget}
              onChangeText={setEstimatedBudget}
              keyboardType="number-pad"
              placeholder="₹500"
              placeholderTextColor="#5C5A64"
              style={{
                borderRadius: 12,
                borderWidth: 1,
                borderColor: '#2D2C34',
                backgroundColor: '#121215',
                paddingHorizontal: 14,
                paddingVertical: 10,
                fontFamily: 'PlusJakartaSans',
                fontSize: 13,
                color: '#E5E1E4',
              }}
            />
          </View>

          {/* Delivery Drop */}
          <View className="mb-4">
            <View className="flex-row items-center gap-1.5 mb-1.5">
              <MapPin size={13} color="#EF4444" />
              <Text style={{ fontFamily: 'PlusJakartaSans', fontSize: 12, fontWeight: '600', color: '#C9C5D0' }}>
                Delivery Drop Address
              </Text>
            </View>
            <TextInput
              value={dropAddr}
              onChangeText={setDropAddr}
              placeholder="Delivery destination"
              placeholderTextColor="#5C5A64"
              style={{
                borderRadius: 12,
                borderWidth: 1,
                borderColor: '#2D2C34',
                backgroundColor: '#121215',
                paddingHorizontal: 14,
                paddingVertical: 10,
                fontFamily: 'PlusJakartaSans',
                fontSize: 13,
                color: '#E5E1E4',
                marginBottom: 8,
              }}
            />
            <TextInput
              value={dropPhone}
              onChangeText={setDropPhone}
              placeholder="Contact phone"
              placeholderTextColor="#5C5A64"
              keyboardType="phone-pad"
              style={{
                borderRadius: 12,
                borderWidth: 1,
                borderColor: '#2D2C34',
                backgroundColor: '#121215',
                paddingHorizontal: 14,
                paddingVertical: 10,
                fontFamily: 'PlusJakartaSans',
                fontSize: 13,
                color: '#E5E1E4',
              }}
            />
          </View>
        </View>

        {/* Fare & Booking */}
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
          <View className="gap-2 border-b border-[#26262B] pb-3 mb-3">
            <View className="flex-row justify-between">
              <Text style={{ fontFamily: 'PlusJakartaSans', fontSize: 13, color: '#928F9E' }}>
                Courier & Buying Service Fee
              </Text>
              <Text style={{ fontFamily: 'PlusJakartaSans', fontSize: 13, color: '#E5E1E4', fontWeight: '600' }}>
                {formatInr(quote.deliveryPaise)}
              </Text>
            </View>
            <View className="flex-row justify-between">
              <Text style={{ fontFamily: 'PlusJakartaSans', fontSize: 13, color: '#928F9E' }}>
                Estimated Item Budget (Pay at doorstep)
              </Text>
              <Text style={{ fontFamily: 'PlusJakartaSans', fontSize: 13, color: '#C8BFFF', fontWeight: '600' }}>
                ₹{estimatedBudget}
              </Text>
            </View>
          </View>

          <View className="flex-row items-center justify-between mb-4">
            <Text style={{ fontFamily: 'PlusJakartaSans', fontSize: 15, fontWeight: '700', color: '#E5E1E4' }}>
              Service Fee Now
            </Text>
            <Text style={{ fontFamily: 'PlusJakartaSans', fontSize: 20, fontWeight: '800', color: '#C8BFFF' }}>
              {formatInr(quote.totalPaise)}
            </Text>
          </View>

          <DFCPressable
            onPress={() => void onBookBuy()}
            disabled={busy}
            scaleTo={0.97}
            style={{
              backgroundColor: '#6A5ACD',
              paddingVertical: 14,
              borderRadius: 14,
              alignItems: 'center',
              justifyContent: 'center',
              shadowColor: '#6A5ACD',
              shadowOpacity: 0.3,
              shadowRadius: 10,
              elevation: 4,
            }}
          >
            <Text
              style={{
                fontFamily: 'PlusJakartaSans',
                fontSize: 15,
                fontWeight: '700',
                color: '#FFFFFF',
              }}
            >
              {busy ? 'Assigning Buyer...' : 'Dispatch Captain to Store →'}
            </Text>
          </DFCPressable>
        </View>
      </ScrollView>
    </Screen>
  );
}
