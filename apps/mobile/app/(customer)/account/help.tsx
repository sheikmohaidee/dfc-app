/**
 * Help and support.
 *
 * Phone first. This is Madurai and the customer is often an older person
 * holding a prescription — a chat widget is not the answer, a number that
 * rings is. WhatsApp second, because that is what people actually use.
 */

import * as React from 'react';
import { Linking, View } from 'react-native';
import { useRouter } from 'expo-router';
import { ChevronDown, Mail, MessageCircle, Phone } from 'lucide-react-native';

import { COMPANY, COPY, PHARMACY_DISCLOSURE, licences } from '@dfc/core';

import { Card, T, Ta } from '@/ui';
import { Group, Row, SettingsScreen } from '@/ui/settings';

const FAQ: { q: string; qTa: string; a: string }[] = [
  {
    q: 'How does DFC read my prescription?',
    qTa: 'மருந்துச் சீட்டு எப்படி படிக்கப்படுகிறது?',
    a: 'You photograph it, and an automated system reads the medicines off it. Anything it is unsure of is flagged, and a licensed pharmacist confirms every flagged item before it is dispensed. Nothing is dispensed on a guess.',
  },
  {
    q: 'Why is my price an estimate at first?',
    qTa: 'விலை ஏன் மாறுகிறது?',
    a: 'Until a shop confirms what it actually has in stock, the price is our best estimate and is labelled with a question mark. The price you are asked to approve is the final one — it never goes up after you pay.',
  },
  {
    q: 'Can I order in Tamil?',
    qTa: 'தமிழில் ஆர்டர் செய்யலாமா?',
    a: 'Yes. Speak or type in Tamil, English, or a mix of both — "rendu muzham malligai" works exactly as well as "two muzham of jasmine".',
  },
  {
    q: 'What is the OTP the rider asks for?',
    qTa: 'OTP என்றால் என்ன?',
    a: 'A four-digit code shown on your order screen once the rider is on the way. It proves the goods reached you and not someone else. Never give it out before you have the order in your hand.',
  },
  {
    q: 'How do I pay?',
    qTa: 'எப்படி பணம் செலுத்துவது?',
    a: 'Pharmacy orders are pre-paid in the app. Everything else can be cash to the rider at the door. Exact change helps.',
  },
  {
    q: 'Something is missing or wrong.',
    qTa: 'பொருள் இல்லை / தவறாக வந்தது',
    a: 'Report it within 48 hours from the order screen, or call us. Missing and damaged items are refunded; you are never charged for something a pharmacist refused.',
  },
];

function FaqItem({ item }: { item: (typeof FAQ)[number] }) {
  const [open, setOpen] = React.useState(false);
  return (
    <Card className="overflow-hidden">
      <View
        onTouchEnd={() => setOpen((v) => !v)}
        className="min-h-[56px] flex-row items-center gap-3 px-4 py-3.5"
      >
        <View className="flex-1">
          <T className="text-[14px] font-medium leading-[20px]">{item.q}</T>
          <Ta className="mt-0.5 text-[11.5px]">{item.qTa}</Ta>
        </View>
        <ChevronDown
          size={17}
          color="#A1A1AA"
          strokeWidth={2}
          style={{ transform: [{ rotate: open ? '180deg' : '0deg' }] }}
        />
      </View>
      {open ? (
        <View className="border-t border-muted px-4 py-3.5">
          <T className="text-[13.5px] leading-[21px] text-body-strong">{item.a}</T>
        </View>
      ) : null}
    </Card>
  );
}

export default function Help() {
  const router = useRouter();

  return (
    <SettingsScreen title={COPY.helpSupport.en} titleTa={COPY.helpSupport.ta}>
      <Group label="Talk to a person" footer="Open 7 AM to 11 PM, every day.">
        <Row
          icon={<Phone size={19} color="#16A34A" strokeWidth={1.9} />}
          label={COPY.callUs}
          value={COMPANY.grievancePhone}
          onPress={() => void Linking.openURL(`tel:${COMPANY.grievancePhone}`)}
        />
        <Row
          icon={<MessageCircle size={19} color="#16A34A" strokeWidth={1.9} />}
          label={COPY.whatsapp}
          hint="Send a photo of the problem"
          onPress={() =>
            void Linking.openURL(
              `whatsapp://send?phone=${COMPANY.grievancePhone.replace(/[^\d+]/g, '')}`,
            ).catch(() => Linking.openURL(`tel:${COMPANY.grievancePhone}`))
          }
        />
        <Row
          icon={<Mail size={19} color="#52525B" strokeWidth={1.9} />}
          label={{ en: 'Email', ta: 'மின்னஞ்சல்' }}
          value={COMPANY.supportEmail}
          onPress={() => void Linking.openURL(`mailto:${COMPANY.supportEmail}`)}
        />
      </Group>

      <View className="gap-2">
        <T className="px-1 text-[10.5px] font-bold tracking-[1.05px] text-placeholder">
          {COPY.faq.en.toUpperCase()}
        </T>
        <View className="gap-2">
          {FAQ.map((f) => (
            <FaqItem key={f.q} item={f} />
          ))}
        </View>
      </View>

      <Group label={COPY.legalPolicies.en}>
        <Row
          label={COPY.refundPolicy}
          onPress={() => router.push('/(customer)/legal/refunds')}
        />
        <Row
          label={COPY.privacyPolicy}
          onPress={() => router.push('/(customer)/legal/privacy')}
        />
      </Group>

      {/* A store reviewer looks for these, and so does anyone deciding whether
          to hand a prescription to a stranger. */}
      <Group label="Licences" footer={PHARMACY_DISCLOSURE.en}>
        {licences().map((l) => (
          <Row key={l.label} label={l.label} value={l.value} hint={l.note} chevron={false} />
        ))}
      </Group>

      <T className="px-1 text-center text-[11px] leading-[17px] text-placeholder">
        Grievance Officer: {COMPANY.grievanceOfficer}
        {'\n'}
        {COMPANY.legalName} · {COMPANY.address}
      </T>
    </SettingsScreen>
  );
}
