/**
 * The account screen for riders and vendors.
 *
 * Same requirements as the customer's — language, legal, deletion, sign out —
 * but a shorter list, because a rider does not have saved addresses and a
 * shopkeeper does not have a payment method. Shared rather than duplicated so
 * the store-required rows cannot go missing from one of the three apps.
 */

import * as React from 'react';
import { Alert, Linking, View } from 'react-native';
import { useRouter } from 'expo-router';
import {
  FileText,
  Globe,
  LifeBuoy,
  LogOut,
  Phone,
  ScrollText,
  ShieldCheck,
  Trash2,
} from 'lucide-react-native';

import { COMPANY, COPY, localityById } from '@dfc/core';

import { useAuth } from '@/providers/auth';
import { useLang } from '@/providers/language';
import { Screen, T, Ta } from './index';
import { Group, Row, SettingsHeader, SettingsScroll } from './settings';

const ICON = { size: 19, color: '#52525B', strokeWidth: 1.9 } as const;

export function StaffSettings({ role }: { role: 'rider' | 'vendor' }) {
  const router = useRouter();
  const { profile, user, signOut } = useAuth();
  const { mode, primary } = useLang();

  const langLabel =
    mode === 'en' ? 'English' : mode === 'ta' ? 'தமிழ்' : 'EN + தமிழ்';
  const base = role === 'rider' ? '/(rider)' : '/(vendor)';

  /**
   * Staff accounts are created by DFC operations, so self-service deletion
   * would orphan live deliveries and payout records. The store requirement is
   * a *route* to deletion, not necessarily a button — so this one is honest
   * about the process instead of pretending.
   */
  function requestDeletion() {
    Alert.alert(
      'Delete this account?',
      `${role === 'rider' ? 'Rider' : 'Partner'} accounts are closed by DFC operations so that outstanding payouts and live deliveries settle correctly. We will confirm within 7 days.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Email the request',
          onPress: () =>
            void Linking.openURL(
              `mailto:${COMPANY.privacyEmail}?subject=${encodeURIComponent(
                `Account deletion request — ${role}`,
              )}&body=${encodeURIComponent(
                `Please delete my DFC ${role} account.\n\nName: ${profile?.name ?? ''}\nPhone: ${profile?.phone ?? ''}\n`,
              )}`,
            ),
        },
      ],
    );
  }

  return (
    <Screen>
      <SettingsHeader title={COPY.account.en} titleTa={COPY.account.ta} />

      <SettingsScroll>
        <View className="flex-row items-center gap-3.5 px-1">
          <View className="size-14 items-center justify-center rounded-full bg-muted">
            <T className="text-[19px] font-semibold text-icon">
              {(profile?.name ?? 'DFC').slice(0, 2).toUpperCase()}
            </T>
          </View>
          <View className="flex-1">
            <T className="text-[18px] font-semibold tracking-[-0.35px]">
              {profile?.name ?? 'Your account'}
            </T>
            <T className="mt-0.5 font-mono text-[12.5px] text-muted-foreground">
              {profile?.phone ?? user?.email ?? ''}
            </T>
            <T className="mt-0.5 text-[11.5px] text-placeholder">
              {role === 'rider' ? 'DFC rider' : 'DFC partner store'}
              {profile?.localityId ? ` · ${localityById(profile.localityId)?.name}` : ''}
            </T>
          </View>
        </View>

        <Group label={primary({ en: 'Preferences', ta: 'விருப்பங்கள்' })}>
          <Row
            icon={<Globe {...ICON} />}
            label={COPY.language}
            value={langLabel}
            onPress={() => router.push(`${base}/language` as never)}
          />
        </Group>

        <Group label={primary({ en: 'Support', ta: 'உதவி' })}>
          <Row
            icon={<Phone size={19} color="#16A34A" strokeWidth={1.9} />}
            label={{ en: 'Call DFC operations', ta: 'DFC-ஐ அழைக்கவும்' }}
            value={COMPANY.grievancePhone}
            onPress={() => void Linking.openURL(`tel:${COMPANY.grievancePhone}`)}
          />
          <Row
            icon={<LifeBuoy {...ICON} />}
            label={{ en: 'Email support', ta: 'மின்னஞ்சல்' }}
            onPress={() => void Linking.openURL(`mailto:${COMPANY.supportEmail}`)}
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
          <Row
            icon={<Trash2 size={19} color="#DC2626" strokeWidth={1.9} />}
            label={COPY.deleteAccount}
            danger
            onPress={requestDeletion}
          />
        </Group>

        <View className="items-center gap-1 pt-1">
          <T className="text-[11.5px] text-placeholder">
            {COPY.appName.en} · {COPY.version.en} 0.1.0
          </T>
          <Ta className="text-[11px]">{COPY.appName.ta}</Ta>
        </View>
      </SettingsScroll>
    </Screen>
  );
}
