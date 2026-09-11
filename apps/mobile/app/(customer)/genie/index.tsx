/**
 * DFC Genie & Errand Concierge Screen
 */

import * as React from 'react';
import { Pressable, ScrollView, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, Check, Clock, MapPin, Package, Phone, ShoppingBag, Sparkles, Users } from 'lucide-react-native';

import { formatInr } from '@dfc/core';
import { mockGenieRepository } from '@/demo/repositories/genie.repository';
import { mockOrderRepository } from '@/demo/repositories/order.repository';
import { mockLocationRepository } from '@/demo/repositories/location.repository';
import { Button, Num, Screen, T, Ta } from '@/ui';
import { PressableScale } from '@/ui/glass';

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
    return mockGenieRepository.calculateQuote({
      kind: tab,
      pickupAddress: pickupAddr,
      pickupPhone,
      dropAddress: dropAddr,
      dropPhone,
      instructions,
    }, 4.2);
  }, [tab, pickupAddr, pickupPhone, dropAddr, dropPhone, instructions]);

  async function onBookGenie() {
    setBusy(true);
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
    router.push(`/(customer)/order/${order.id}` as any);
  }

  return (
    <Screen edges={['top']}>
      {/* Header */}
      <View className="flex-row items-center gap-3 border-b border-muted bg-background px-4 py-3">
        <PressableScale to={0.9} onPress={() => router.back()} className="size-9 items-center justify-center">
          <ArrowLeft size={22} color="#18181B" strokeWidth={2} />
        </PressableScale>
        <View className="flex-1">
          <View className="flex-row items-center gap-2">
            <T className="text-[17px] font-bold tracking-tight">DFC Genie Concierge</T>
            <Ta className="text-[12px] text-muted-foreground">சேவைகள்</Ta>
          </View>
          <T className="text-[11px] font-medium text-muted-foreground">
            Madurai City Errand Runner · Live GPS Tracked
          </T>
        </View>
        <View className="rounded-full bg-amber-50 px-2.5 py-1">
          <T className="text-[11px] font-bold text-amber-800">DEDICATED</T>
        </View>
      </View>

      <ScrollView className="flex-1 bg-surface" contentContainerClassName="gap-4 p-4 pb-28">
        {/* Service Kind Switcher */}
        <View className="gap-2">
          <T className="text-[13px] font-bold text-foreground">1. SELECT ERRAND TYPE</T>
          <View className="flex-row flex-wrap gap-2.5">
            {categories.map((c) => {
              const active = tab === c.id;
              return (
                <Pressable
                  key={c.id}
                  onPress={() => {
                    setTab(c.id as GenieTab);
                    if (c.id === 'pickup_drop') setInstructions('Pickup house keys and hand over to security desk.');
                    else if (c.id === 'buy_deliver') setInstructions('Buy 1 kg Nagapattinam Nei Mittai from Simmakkal sweet stall.');
                    else if (c.id === 'queue_errand') setInstructions('Collect registrar office token number in the morning queue.');
                    else setInstructions('Custom urgent parcel delivery within Madurai city.');
                  }}
                  className={`flex-1 min-w-[140px] rounded-xl border p-3 ${
                    active ? 'border-primary bg-primary-tint' : 'border-border bg-background'
                  }`}
                >
                  <View className="flex-row items-center gap-2">
                    {c.id === 'pickup_drop' ? <Package size={16} color={active ? '#2563EB' : '#71717A'} /> : null}
                    {c.id === 'buy_deliver' ? <ShoppingBag size={16} color={active ? '#2563EB' : '#71717A'} /> : null}
                    {c.id === 'queue_errand' ? <Users size={16} color={active ? '#2563EB' : '#71717A'} /> : null}
                    {c.id === 'other' ? <Sparkles size={16} color={active ? '#2563EB' : '#71717A'} /> : null}
                    <T className={`text-[13px] font-bold ${active ? 'text-primary' : 'text-foreground'}`}>
                      {c.title}
                    </T>
                  </View>
                  <T className="mt-1 text-[11px] text-muted-foreground" numberOfLines={2}>
                    {c.desc}
                  </T>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Task Details Form */}
        <View className="gap-3 rounded-[16px] border border-border bg-background p-4 shadow-sm">
          <T className="text-[13px] font-bold text-foreground">2. TASK & ADDRESS DETAILS</T>

          {/* Pickup Details */}
          <View className="gap-1.5">
            <View className="flex-row items-center gap-1.5">
              <MapPin size={13} color="#16A34A" />
              <T className="text-[12px] font-semibold text-body-strong">Pickup Point / Store</T>
            </View>
            <TextInput
              value={pickupAddr}
              onChangeText={setPickupAddr}
              placeholder="Enter pickup address in Madurai"
              className="rounded-xl border border-border bg-surface px-3.5 py-2.5 font-sans text-[13px] text-foreground"
            />
          </View>

          {/* Drop Details */}
          <View className="gap-1.5">
            <View className="flex-row items-center gap-1.5">
              <MapPin size={13} color="#DC2626" />
              <T className="text-[12px] font-semibold text-body-strong">Delivery Drop Address</T>
            </View>
            <TextInput
              value={dropAddr}
              onChangeText={setDropAddr}
              placeholder="Enter delivery address in Madurai"
              className="rounded-xl border border-border bg-surface px-3.5 py-2.5 font-sans text-[13px] text-foreground"
            />
          </View>

          {/* Task Instructions */}
          <View className="gap-1.5">
            <T className="text-[12px] font-semibold text-body-strong">Captain Instructions</T>
            <TextInput
              value={instructions}
              onChangeText={setInstructions}
              multiline
              numberOfLines={3}
              placeholder="What should the captain do?"
              className="min-h-[70px] rounded-xl border border-border bg-surface p-3 font-sans text-[13px] text-foreground"
            />
          </View>

          {tab === 'buy_deliver' ? (
            <View className="gap-1.5">
              <T className="text-[12px] font-semibold text-body-strong">Estimated Purchase Budget (₹)</T>
              <TextInput
                value={budget}
                onChangeText={setBudget}
                keyboardType="number-pad"
                placeholder="₹500"
                className="rounded-xl border border-border bg-surface px-3.5 py-2.5 font-sans text-[13px] text-foreground"
              />
              <T className="text-[10.5px] text-muted-foreground">
                Captain pays at the counter and provides original shop receipt upon delivery.
              </T>
            </View>
          ) : null}
        </View>

        {/* Instant Quote Card */}
        <View className="gap-2.5 rounded-[16px] border border-border bg-background p-4 shadow-sm">
          <T className="text-[13px] font-bold text-foreground">3. FARE ESTIMATE</T>

          <View className="gap-1.5 border-b border-muted pb-2.5">
            <View className="flex-row justify-between">
              <T className="text-[12px] text-muted-foreground">Genie Concierge Delivery (4.2 km)</T>
              <Num className="text-[12px] font-medium">{formatInr(quote.deliveryPaise)}</Num>
            </View>
            <View className="flex-row justify-between">
              <T className="text-[12px] text-muted-foreground">Safety & Insurance Fee</T>
              <Num className="text-[12px] font-medium">{formatInr(quote.platformFeePaise)}</Num>
            </View>
          </View>

          <View className="flex-row items-center justify-between pt-0.5">
            <T className="text-[14px] font-bold text-foreground">Total Errand Fee</T>
            <Num className="text-[17px] font-bold text-primary">{formatInr(quote.totalPaise)}</Num>
          </View>

          <Button
            size="lg"
            label="Assign Concierge Captain"
            loading={busy}
            onPress={() => void onBookGenie()}
            className="mt-1"
          />
        </View>
      </ScrollView>
    </Screen>
  );
}
