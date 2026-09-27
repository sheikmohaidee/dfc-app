/**
 * DFC Genie & Errand Concierge Screen — Stitch Dark Floating Theme
 * Madurai city errand runner supporting pickup & drop, buy & deliver, queue errands,
 * and custom errands with live GPS tracking and dedicated Captain dispatch.
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
  ShoppingBag,
  Sparkles,
  Users,
  ShieldCheck,
  Navigation,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

import { formatInr } from '@dfc/core';
import { mockGenieRepository } from '@/demo/repositories/genie.repository';
import { mockOrderRepository } from '@/demo/repositories/order.repository';
import { mockLocationRepository } from '@/demo/repositories/location.repository';
import { Screen } from '@/ui';
import { DFCPressable } from '@/ui/animated';
import { StitchHeader } from '@/ui/stitch-header';

type GenieTab = 'pickup_drop' | 'buy_deliver' | 'queue_errand' | 'other';

export default function GenieScreen() {
  const router = useRouter();
  const [tab, setTab] = React.useState<GenieTab>('pickup_drop');

  const [pickupAddr, setPickupAddr] = React.useState('Flat 3B, Sri Meenakshi Enclave, Anna Nagar');
  const [pickupPhone, setPickupPhone] = React.useState('+919876543210');
  const [dropAddr, setDropAddr] = React.useState('No 12, West Tower Street, Simmakkal');
  const [dropPhone, setDropPhone] = React.useState('+919876500002');
  const [instructions, setInstructions] = React.useState('Pickup house keys and hand over to security desk.');
  const [budget, setBudget] = React.useState('500');
  const [busy, setBusy] = React.useState(false);

  const categories = mockGenieRepository.getCategories();
  const currentLocality = mockLocationRepository.getCurrentLocality();

  const quote = React.useMemo(() => {
    return mockGenieRepository.calculateQuote(
      {
        kind: tab,
        pickupAddress: pickupAddr,
        pickupPhone,
        dropAddress: dropAddr,
        dropPhone,
        instructions,
      },
      4.2,
    );
  }, [tab, pickupAddr, pickupPhone, dropAddr, dropPhone, instructions]);

  async function onBookGenie() {
    setBusy(true);
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const catName = categories.find((c) => c.id === tab)?.title || 'Genie Errand';
    const order = await mockOrderRepository.createDirectOrder({
      category: 'concierge',
      storeName: `Genie: ${catName}`,
      items: [
        {
          name: `${catName} (${instructions.slice(0, 45)}...)`,
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
      {/* Header */}
      <StitchHeader
        showBack={true}
        title="DFC Genie Concierge"
        subtitle="Madurai City Errand Runner · Live GPS"
        showNotifications={false}
        rightAction={
          <View
            style={{
              backgroundColor: 'rgba(236, 72, 153, 0.15)',
              borderWidth: 1,
              borderColor: 'rgba(236, 72, 153, 0.35)',
              paddingHorizontal: 10,
              paddingVertical: 5,
              borderRadius: 20,
            }}
          >
            <Text
              style={{
                fontFamily: 'PlusJakartaSans',
                fontSize: 11,
                fontWeight: '700',
                color: '#F472B6',
              }}
            >
              Dedicated
            </Text>
          </View>
        }
      />

      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingTop: 16,
          paddingBottom: 48,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Step 1: Select Errand Type */}
        <View className="mb-6">
          <View className="flex-row items-center gap-2 mb-3">
            <View
              style={{
                width: 22,
                height: 22,
                borderRadius: 11,
                backgroundColor: '#6A5ACD',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text style={{ fontFamily: 'PlusJakartaSans', fontSize: 12, fontWeight: '800', color: '#FFFFFF' }}>
                1
              </Text>
            </View>
            <Text
              style={{
                fontFamily: 'PlusJakartaSans',
                fontSize: 13,
                fontWeight: '700',
                color: '#E5E1E4',
                letterSpacing: 0.5,
              }}
            >
              SELECT ERRAND TYPE
            </Text>
          </View>

          <View className="flex-row flex-wrap gap-2.5">
            {categories.map((c) => {
              const active = tab === c.id;
              return (
                <DFCPressable
                  key={c.id}
                  scaleTo={0.96}
                  onPress={() => {
                    void Haptics.selectionAsync();
                    setTab(c.id as GenieTab);
                    if (c.id === 'pickup_drop') setInstructions('Pickup house keys and hand over to security desk.');
                    else if (c.id === 'buy_deliver')
                      setInstructions('Buy 1 kg Nagapattinam Nei Mittai from Simmakkal sweet stall.');
                    else if (c.id === 'queue_errand')
                      setInstructions('Collect registrar office token number in the morning queue.');
                    else setInstructions('Custom urgent parcel delivery within Madurai city.');
                  }}
                  style={{
                    flex: 1,
                    minWidth: 150,
                    borderRadius: 16,
                    borderWidth: 1,
                    backgroundColor: active ? '#1F1E26' : '#18181B',
                    borderColor: active ? '#6A5ACD' : '#26262B',
                    padding: 14,
                    shadowColor: '#000000',
                    shadowOpacity: 0.15,
                    shadowRadius: 4,
                    shadowOffset: { width: 0, height: 2 },
                    elevation: 2,
                  }}
                >
                  <View className="flex-row items-center gap-2.5 mb-1.5">
                    <View
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: 10,
                        backgroundColor: active ? 'rgba(106, 90, 205, 0.25)' : '#201F24',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {c.id === 'pickup_drop' ? (
                        <Package size={16} color={active ? '#C8BFFF' : '#928F9E'} />
                      ) : c.id === 'buy_deliver' ? (
                        <ShoppingBag size={16} color={active ? '#C8BFFF' : '#928F9E'} />
                      ) : c.id === 'queue_errand' ? (
                        <Users size={16} color={active ? '#C8BFFF' : '#928F9E'} />
                      ) : (
                        <Sparkles size={16} color={active ? '#C8BFFF' : '#928F9E'} />
                      )}
                    </View>
                    <Text
                      style={{
                        fontFamily: 'PlusJakartaSans',
                        fontSize: 13,
                        fontWeight: '700',
                        color: active ? '#C8BFFF' : '#E5E1E4',
                      }}
                    >
                      {c.title}
                    </Text>
                  </View>
                  <Text
                    numberOfLines={2}
                    style={{
                      fontFamily: 'PlusJakartaSans',
                      fontSize: 11,
                      color: '#928F9E',
                      lineHeight: 16,
                    }}
                  >
                    {c.desc}
                  </Text>
                </DFCPressable>
              );
            })}
          </View>
        </View>

        {/* Step 2: Task & Address Details */}
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
          <View className="flex-row items-center gap-2 mb-4">
            <View
              style={{
                width: 22,
                height: 22,
                borderRadius: 11,
                backgroundColor: '#6A5ACD',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text style={{ fontFamily: 'PlusJakartaSans', fontSize: 12, fontWeight: '800', color: '#FFFFFF' }}>
                2
              </Text>
            </View>
            <Text
              style={{
                fontFamily: 'PlusJakartaSans',
                fontSize: 13,
                fontWeight: '700',
                color: '#E5E1E4',
                letterSpacing: 0.5,
              }}
            >
              TASK & ADDRESS DETAILS
            </Text>
          </View>

          {/* Pickup */}
          <View className="mb-4">
            <View className="flex-row items-center gap-1.5 mb-1.5">
              <MapPin size={13} color="#10B981" />
              <Text style={{ fontFamily: 'PlusJakartaSans', fontSize: 12, fontWeight: '600', color: '#C9C5D0' }}>
                Pickup Point / Store
              </Text>
            </View>
            <TextInput
              value={pickupAddr}
              onChangeText={setPickupAddr}
              placeholder="Enter pickup address in Madurai"
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

          {/* Drop */}
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
              placeholder="Enter delivery address in Madurai"
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

          {/* Instructions */}
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
              Captain Instructions
            </Text>
            <TextInput
              value={instructions}
              onChangeText={setInstructions}
              multiline
              numberOfLines={3}
              placeholder="What should the captain do?"
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

          {tab === 'buy_deliver' ? (
            <View className="mb-2">
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
                value={budget}
                onChangeText={setBudget}
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
              <Text
                style={{
                  fontFamily: 'PlusJakartaSans',
                  fontSize: 11,
                  color: '#928F9E',
                  marginTop: 4,
                }}
              >
                Captain pays upfront at counter and hands over genuine receipt.
              </Text>
            </View>
          ) : null}
        </View>

        {/* Step 3: Fare Estimate & Booking */}
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
          <View className="flex-row items-center gap-2 mb-3">
            <View
              style={{
                width: 22,
                height: 22,
                borderRadius: 11,
                backgroundColor: '#6A5ACD',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text style={{ fontFamily: 'PlusJakartaSans', fontSize: 12, fontWeight: '800', color: '#FFFFFF' }}>
                3
              </Text>
            </View>
            <Text
              style={{
                fontFamily: 'PlusJakartaSans',
                fontSize: 13,
                fontWeight: '700',
                color: '#E5E1E4',
                letterSpacing: 0.5,
              }}
            >
              FARE ESTIMATE
            </Text>
          </View>

          <View className="gap-2 border-b border-[#26262B] pb-3 mb-3">
            <View className="flex-row justify-between">
              <Text style={{ fontFamily: 'PlusJakartaSans', fontSize: 13, color: '#928F9E' }}>
                Genie Concierge Delivery (4.2 km)
              </Text>
              <Text style={{ fontFamily: 'PlusJakartaSans', fontSize: 13, color: '#E5E1E4', fontWeight: '600' }}>
                {formatInr(quote.deliveryPaise)}
              </Text>
            </View>

            <View className="flex-row justify-between">
              <Text style={{ fontFamily: 'PlusJakartaSans', fontSize: 13, color: '#928F9E' }}>
                Safety & Insurance Protection
              </Text>
              <Text style={{ fontFamily: 'PlusJakartaSans', fontSize: 13, color: '#E5E1E4', fontWeight: '600' }}>
                {formatInr(quote.platformFeePaise)}
              </Text>
            </View>
          </View>

          <View className="flex-row items-center justify-between mb-4">
            <Text style={{ fontFamily: 'PlusJakartaSans', fontSize: 15, fontWeight: '700', color: '#E5E1E4' }}>
              Total Errand Fee
            </Text>
            <Text style={{ fontFamily: 'PlusJakartaSans', fontSize: 20, fontWeight: '800', color: '#C8BFFF' }}>
              {formatInr(quote.totalPaise)}
            </Text>
          </View>

          <DFCPressable
            onPress={() => void onBookGenie()}
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
              {busy ? 'Assigning Captain...' : 'Assign Concierge Captain →'}
            </Text>
          </DFCPressable>
        </View>
      </ScrollView>
    </Screen>
  );
}
