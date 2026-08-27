/**
 * The account hub.
 *
 * Every app-store requirement is reachable from here in one tap: privacy,
 * terms, and account deletion. Apple rejects apps where deletion is buried or
 * requires emailing support, so Delete account is a visible row on this
 * screen — not three levels down.
 */

import * as React from 'react';
import { Linking, View } from 'react-native';
import { useRouter } from 'expo-router';
import {
  Bell,
  CreditCard,
  FileText,
  Globe,
  LifeBuoy,
  LogOut,
  MapPin,
  Receipt,
  ScrollText,
  ShieldCheck,
  Trash2,
  User,
} from 'lucide-react-native';

import { COMPANY, COPY, localityById } from '@dfc/core';

import { useAuth } from '@/providers/auth';
import { useLang } from '@/providers/language';
import { Group, Row, SettingsScroll } from '@/ui/settings';
import { Screen, T, Ta } from '@/ui';

const ICON = { size: 19, color: '#52525B', strokeWidth: 1.9 } as const;

export default function AccountHub() {
  const router = useRouter();
  const { profile, user, signOut } = useAuth();
  const { mode, primary, bilingual } = useLang();

  const locality = localityById(profile?.localityId);
  const langLabel =
    mode === 'en' ? COPY.langEnglish.en : mode === 'ta' ? COPY.langTamil.en : 'EN + தமிழ்';

  return (
    <Screen>
      {/* Identity card */}
      <View className="flex-row items-center gap-3.5 px-5 pb-4 pt-3">
        <View className="size-14 items-center justify-center rounded-full bg-muted">
          <T className="text-[19px] font-semibold text-icon">
            {(profile?.name ?? 'DFC').slice(0, 2).toUpperCase()}
          </T>
        </View>
        <View className="flex-1">
          <T className="text-[19px] font-semibold tracking-[-0.4px]">
            {profile?.name ?? 'Your account'}
          </T>
          <T className="mt-0.5 font-mono text-[12.5px] text-muted-foreground">
            {profile?.phone ?? user?.email ?? ''}
          </T>
          {locality ? (
            <T className="mt-0.5 text-[11.5px] text-placeholder">{locality.name}, Madurai</T>
          ) : null}
        </View>
      </View>

      <SettingsScroll>
        <Group>
          <Row
            icon={<User {...ICON} />}
            label={COPY.profile}
            onPress={() => router.push('/(customer)/account/profile')}
          />
          <Row
            icon={<Receipt {...ICON} />}
            label={COPY.myOrders}
            onPress={() => router.push('/(customer)/orders')}
          />
          <Row
            icon={<MapPin {...ICON} />}
            label={COPY.savedAddresses}
            onPress={() => router.push('/(customer)/account/addresses')}
          />
          <Row
            icon={<CreditCard {...ICON} />}
            label={COPY.paymentMethods}
            onPress={() => router.push('/(customer)/account/payments')}
          />
        </Group>

        <Group label={primary({ en: 'Preferences', ta: 'விருப்பங்கள்' })}>
          <Row
            icon={<Globe {...ICON} />}
            label={COPY.language}
            value={langLabel}
            onPress={() => router.push('/(customer)/account/language')}
          />
          <Row
            icon={<Bell {...ICON} />}
            label={COPY.notifications}
            onPress={() => router.push('/(customer)/account/notifications')}
          />
        </Group>

        <Group label={primary({ en: 'Support', ta: 'உதவி' })}>
          <Row
            icon={<LifeBuoy {...ICON} />}
            label={COPY.helpSupport}
            onPress={() => router.push('/(customer)/account/help')}
          />
        </Group>

        <Group label={primary(COPY.legalPolicies)}>
          <Row
            icon={<ShieldCheck {...ICON} />}
            label={COPY.privacyPolicy}
            onPress={() => router.push('/(customer)/legal/privacy')}
          />
          <Row
            icon={<ScrollText {...ICON} />}
            label={COPY.termsOfService}
            onPress={() => router.push('/(customer)/legal/terms')}
          />
          <Row
            icon={<FileText {...ICON} />}
            label={COPY.refundPolicy}
            onPress={() => router.push('/(customer)/legal/refunds')}
          />
        </Group>

        <Group>
          <Row
            icon={<LogOut {...ICON} />}
            label={COPY.signOut}
            chevron={false}
            onPress={() => void signOut()}
          />
          {/* Visible, one tap from the hub — Apple 5.1.1(v). */}
          <Row
            icon={<Trash2 size={19} color="#DC2626" strokeWidth={1.9} />}
            label={COPY.deleteAccount}
            danger
            onPress={() => router.push('/(customer)/account/delete')}
          />
        </Group>

        <View className="items-center gap-1 pt-1">
          <T className="text-[11.5px] text-placeholder">
            {COPY.appName.en} · {COPY.version.en} 0.1.0
          </T>
          {bilingual ? <Ta className="text-[11px]">{COPY.appName.ta}</Ta> : null}
          <T
            className="mt-1 text-[11.5px] text-muted-foreground underline"
            onPress={() => void Linking.openURL(`mailto:${COMPANY.supportEmail}`)}
          >
            {COMPANY.supportEmail}
          </T>
        </View>
      </SettingsScroll>
    </Screen>
  );
}
