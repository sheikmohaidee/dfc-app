/**
 * Notification preferences.
 *
 * Order updates default on and are the only ones that matter; marketing
 * defaults OFF. Opt-in rather than opt-out is what the DPDP Act expects for
 * anything that is not necessary to deliver the service, and it is also just
 * the decent default.
 */

import * as React from 'react';
import { Linking, Platform, View } from 'react-native';
import { Bell, MessageSquare, Tag } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { COPY } from '@dfc/core';

import { Button, Card, T } from '@/ui';
import { Group, SettingsScreen, ToggleRow } from '@/ui/settings';

const KEY = 'dfc.notify';
const ICON = { size: 19, color: '#52525B', strokeWidth: 1.9 } as const;

interface Prefs {
  orderUpdates: boolean;
  offers: boolean;
  sms: boolean;
}

const DEFAULTS: Prefs = { orderUpdates: true, offers: false, sms: true };

export default function NotificationSettings() {
  const [prefs, setPrefs] = React.useState<Prefs>(DEFAULTS);

  React.useEffect(() => {
    void (async () => {
      try {
        const raw = await AsyncStorage.getItem(KEY);
        if (raw) setPrefs({ ...DEFAULTS, ...(JSON.parse(raw) as Partial<Prefs>) });
      } catch {
        /* keep defaults */
      }
    })();
  }, []);

  function set<K extends keyof Prefs>(k: K, v: Prefs[K]) {
    const next = { ...prefs, [k]: v };
    setPrefs(next);
    void AsyncStorage.setItem(KEY, JSON.stringify(next)).catch(() => {});
  }

  return (
    <SettingsScreen title={COPY.notifications.en} titleTa={COPY.notifications.ta}>
      <Group
        label="Order"
        footer="Order updates are how you know a rider is at your door. Turning them off is allowed, but you will have to check the app yourself."
      >
        <ToggleRow
          icon={<Bell {...ICON} />}
          label={COPY.notifyOrderUpdates}
          hint={COPY.notifyOrderUpdatesHint.en}
          value={prefs.orderUpdates}
          onChange={(v) => set('orderUpdates', v)}
        />
        <ToggleRow
          icon={<MessageSquare {...ICON} />}
          label={COPY.notifySms}
          hint={COPY.notifySmsHint.en}
          value={prefs.sms}
          onChange={(v) => set('sms', v)}
        />
      </Group>

      <Group
        label="Marketing"
        footer="Off unless you turn it on. We do not sell your number, and we do not send more than one offer a day."
      >
        <ToggleRow
          icon={<Tag {...ICON} />}
          label={COPY.notifyOffers}
          hint={COPY.notifyOffersHint.en}
          value={prefs.offers}
          onChange={(v) => set('offers', v)}
        />
      </Group>

      <Card className="gap-3 p-4">
        <T className="text-[13px] leading-[19px] text-body-strong">
          These switches control what DFC sends. Whether your phone shows them is a{' '}
          {Platform.OS === 'ios' ? 'iOS' : 'system'} setting.
        </T>
        <Button
          variant="outline"
          size="sm"
          label="Open system notification settings"
          onPress={() => void Linking.openSettings()}
        />
      </Card>

      <View className="h-2" />
    </SettingsScreen>
  );
}
