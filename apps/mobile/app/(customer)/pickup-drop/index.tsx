/**
 * DFC Pickup & Drop Screen — Stitch Dark Floating Theme
 * Fast-track point-to-point courier across Madurai with instant dispatch,
 * secure OTP delivery, and live GPS rider tracking.
 */

import * as React from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import {
  ArrowLeft,
  Check,
  Clock,
  MapPin,
  Package,
  Phone,
  ShieldCheck,
  Truck,
  FileText,
  Key,
  Smartphone,
  Coffee,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

import { formatInr } from '@dfc/core';
import { mockGenieRepository } from '@/demo/repositories/genie.repository';
import { mockOrderRepository } from '@/demo/repositories/order.repository';
import { Screen } from '@/ui';
import { DFCPressable } from '@/ui/animated';
import { StitchHeader } from '@/ui/stitch-header';

type ParcelType = 'documents' | 'keys' | 'electronics' | 'tiffin' | 'other';

export default function PickupDropScreen() {
  const router = useRouter();

  const [parcelType, setParcelType] = React.useState<ParcelType>('keys');
  const [pickupAddr, setPickupAddr] = React.useState('Flat 3B, Sri Meenakshi Enclave, Anna Nagar');
  const [pickupPhone, setPickupPhone] = React.useState('+919876543210');
  const [dropAddr, setDropAddr] = React.useState('No 12, West Tower Street, Simmakkal');
  const [dropPhone, setDropPhone] = React.useState('+919876500002');
  const [instructions, setInstructions] = React.useState('Hand over parcel directly to reception desk.');
  const [busy, setBusy] = React.useState(false);

  const parcelTypes: { id: ParcelType; label: string; icon: any }[] = [
    { id: 'keys', label: 'Keys', icon: Key },
    { id: 'documents', label: 'Docs', icon: FileText },
    { id: 'electronics', label: 'Gadget', icon: Smartphone },
    { id: 'tiffin', label: 'Tiffin/Food', icon: Coffee },
    { id: 'other', label: 'Box/Parcel', icon: Package },
  ];

  const quote = React.useMemo(() => {
    return mockGenieRepository.calculateQuote(
      {
        kind: 'pickup_drop',
        pickupAddress: pickupAddr,
        pickupPhone,
        dropAddress: dropAddr,
        dropPhone,
        instructions,
      },
      3.8,
    );
  }, [pickupAddr, pickupPhone, dropAddr, dropPhone, instructions]);

  async function onBookPickup() {
    setBusy(true);
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const order = await mockOrderRepository.createDirectOrder({
      category: 'concierge',
      storeName: `Pickup & Drop (${parcelType.toUpperCase()})`,
      items: [
        {
          name: `Point-to-point courier: ${parcelType}`,
          quantity: 1,
          pricePaise: quote.totalPaise,
        },
      ],
      totalPaise: quote.totalPaise,
      transcript: instructions,
    });
    setBusy(false);
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    router.push(`/(customer)/order/${order.id}` as any);
  }

  return (
    <Screen edges={['top']} style={{ backgroundColor: '#0E0E10' }}>
      <StitchHeader
        showBack={true}
        title="Pickup & Drop Courier"
        subtitle="Madurai Express Delivery · 30 Mins"
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
        {/* Parcel Category Chips */}
        <View className="mb-6">
          <Text
            style={{
              fontFamily: 'PlusJakartaSans',
              fontSize: 13,
              fontWeight: '700',
              color: '#E5E1E4',
              letterSpacing: 0.5,
              marginBottom: 10,
            }}
          >
            WHAT ARE YOU SENDING?
          </Text>

          <View className="flex-row flex-wrap gap-2.5">
            {parcelTypes.map((item) => {
              const active = parcelType === item.id;
              const IconComp = item.icon;
              return (
                <DFCPressable
                  key={item.id}
                  onPress={() => {
                    void Haptics.selectionAsync();
                    setParcelType(item.id);
                  }}
                  scaleTo={0.94}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 8,
                    paddingHorizontal: 14,
                    paddingVertical: 10,
                    borderRadius: 14,
                    borderWidth: 1,
                    backgroundColor: active ? 'rgba(106, 90, 205, 0.2)' : '#18181B',
                    borderColor: active ? '#6A5ACD' : '#26262B',
                  }}
                >
                  <IconComp size={16} color={active ? '#C8BFFF' : '#928F9E'} />
                  <Text
                    style={{
                      fontFamily: 'PlusJakartaSans',
                      fontSize: 13,
                      fontWeight: '700',
                      color: active ? '#C8BFFF' : '#E5E1E4',
                    }}
                  >
                    {item.label}
                  </Text>
                </DFCPressable>
              );
            })}
          </View>
        </View>

        {/* Route Details Card */}
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
            ROUTE DETAILS
          </Text>

          {/* Pickup */}
          <View className="mb-4">
            <View className="flex-row items-center gap-1.5 mb-1.5">
              <MapPin size={13} color="#10B981" />
              <Text style={{ fontFamily: 'PlusJakartaSans', fontSize: 12, fontWeight: '600', color: '#C9C5D0' }}>
                Pickup Address
              </Text>
            </View>
            <TextInput
              value={pickupAddr}
              onChangeText={setPickupAddr}
              placeholder="Enter pickup location"
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
              value={pickupPhone}
              onChangeText={setPickupPhone}
              placeholder="Pickup contact phone"
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

          {/* Drop */}
          <View className="mb-4">
            <View className="flex-row items-center gap-1.5 mb-1.5">
              <MapPin size={13} color="#EF4444" />
              <Text style={{ fontFamily: 'PlusJakartaSans', fontSize: 12, fontWeight: '600', color: '#C9C5D0' }}>
                Drop Address
              </Text>
            </View>
            <TextInput
              value={dropAddr}
              onChangeText={setDropAddr}
              placeholder="Enter drop location"
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
              placeholder="Drop contact phone"
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

          {/* Notes */}
          <View>
            <Text
              style={{
                fontFamily: 'PlusJakartaSans',
                fontSize: 12,
                fontWeight: '600',
                color: '#C9C5D0',
                marginBottom: 6,
              }}
            >
              Delivery Notes & Package Instructions
            </Text>
            <TextInput
              value={instructions}
              onChangeText={setInstructions}
              multiline
              numberOfLines={2}
              placeholder="Any special handling for rider?"
              placeholderTextColor="#5C5A64"
              style={{
                minHeight: 60,
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
        </View>

        {/* Fare Card */}
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
                Distance Fare (3.8 km)
              </Text>
              <Text style={{ fontFamily: 'PlusJakartaSans', fontSize: 13, color: '#E5E1E4', fontWeight: '600' }}>
                {formatInr(quote.deliveryPaise)}
              </Text>
            </View>
            <View className="flex-row justify-between">
              <Text style={{ fontFamily: 'PlusJakartaSans', fontSize: 13, color: '#928F9E' }}>
                Insurance & Handling
              </Text>
              <Text style={{ fontFamily: 'PlusJakartaSans', fontSize: 13, color: '#E5E1E4', fontWeight: '600' }}>
                {formatInr(quote.platformFeePaise)}
              </Text>
            </View>
          </View>

          <View className="flex-row items-center justify-between mb-4">
            <Text style={{ fontFamily: 'PlusJakartaSans', fontSize: 15, fontWeight: '700', color: '#E5E1E4' }}>
              Total Fare
            </Text>
            <Text style={{ fontFamily: 'PlusJakartaSans', fontSize: 20, fontWeight: '800', color: '#C8BFFF' }}>
              {formatInr(quote.totalPaise)}
            </Text>
          </View>

          <DFCPressable
            onPress={() => void onBookPickup()}
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
              {busy ? 'Dispatching...' : 'Request Express Pickup →'}
            </Text>
          </DFCPressable>
        </View>
      </ScrollView>
    </Screen>
  );
}
