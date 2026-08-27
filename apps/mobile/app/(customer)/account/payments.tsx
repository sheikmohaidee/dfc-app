/**
 * Payment methods.
 *
 * Honest about its state: the payment provider is not wired yet, so rather
 * than draw fake saved cards this screen shows what will be accepted and says
 * plainly that cash is what works today. A screen that pretends to hold a card
 * it cannot charge is worse than one that admits the gap.
 */

import * as React from 'react';
import { View } from 'react-native';
import { Banknote, CreditCard, Info, Smartphone } from 'lucide-react-native';

import { COPY } from '@dfc/core';

import { Card, T, Ta } from '@/ui';
import { Group, Row, SettingsScreen } from '@/ui/settings';

const ICON = { size: 19, color: '#52525B', strokeWidth: 1.9 } as const;

export default function Payments() {
  return (
    <SettingsScreen title={COPY.paymentMethods.en} titleTa={COPY.paymentMethods.ta}>
      <Group label="Available now">
        <Row
          icon={<Banknote size={19} color="#16A34A" strokeWidth={1.9} />}
          label={{ en: 'Cash on delivery', ta: 'கையில் பணம்' }}
          hint="Pay the rider at your door. Exact change helps."
          chevron={false}
          right={
            <View className="rounded-chip border border-grocery-border bg-grocery-tint px-1.5 py-0.5">
              <T className="text-[9px] font-bold tracking-[0.4px] text-grocery-fg">ACTIVE</T>
            </View>
          }
        />
      </Group>

      <Group
        label="Coming with the payment provider"
        footer="Pharmacy orders are pre-paid, so UPI is the first thing being wired up."
      >
        <Row
          icon={<Smartphone {...ICON} />}
          label={{ en: 'UPI', ta: 'UPI' }}
          hint="GPay, PhonePe, Paytm, BHIM"
          chevron={false}
          right={
            <View className="rounded-chip border border-border bg-muted px-1.5 py-0.5">
              <T className="text-[9px] font-bold tracking-[0.4px] text-muted-foreground">SOON</T>
            </View>
          }
        />
        <Row
          icon={<CreditCard {...ICON} />}
          label={{ en: 'Cards', ta: 'கார்டுகள்' }}
          hint="Credit and debit"
          chevron={false}
          right={
            <View className="rounded-chip border border-border bg-muted px-1.5 py-0.5">
              <T className="text-[9px] font-bold tracking-[0.4px] text-muted-foreground">SOON</T>
            </View>
          }
        />
      </Group>

      <Card className="flex-row gap-3 p-4">
        <Info size={17} color="#71717A" strokeWidth={2} style={{ marginTop: 1 }} />
        <View className="flex-1 gap-1">
          <T className="text-[13px] leading-[19px] text-body-strong">
            DFC never stores your card or UPI details. When online payment goes live it will be
            handled entirely by a PCI-compliant provider — the numbers never touch our servers.
          </T>
          <Ta className="text-[11.5px]">உங்கள் கார்டு விவரங்கள் எங்களிடம் சேமிக்கப்படாது</Ta>
        </View>
      </Card>
    </SettingsScreen>
  );
}
