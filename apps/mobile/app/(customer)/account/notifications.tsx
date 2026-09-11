/**
 * Notification Center & Preferences
 */

import * as React from 'react';
import { Linking, Platform, Pressable, ScrollView, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Bell, CheckCircle2, Clock, MessageSquare, Sparkles, Tag, Truck } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { COPY } from '@dfc/core';
import { mockNotificationRepository } from '@/demo/repositories/notification.repository';
import { Button, Card, Num, T, Ta } from '@/ui';
import { Group, SettingsScreen, ToggleRow } from '@/ui/settings';
import { PressableScale } from '@/ui/glass';

const KEY = 'dfc.notify';
const ICON = { size: 19, color: '#52525B', strokeWidth: 1.9 } as const;

interface Prefs {
  orderUpdates: boolean;
  offers: boolean;
  sms: boolean;
}

const DEFAULTS: Prefs = { orderUpdates: true, offers: false, sms: true };

export default function NotificationSettings() {
  const router = useRouter();
  const [prefs, setPrefs] = React.useState<Prefs>(DEFAULTS);
  const [notifications, setNotifications] = React.useState(() =>
    mockNotificationRepository.getNotifications(),
  );

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

  function handleNotificationPress(orderId?: string) {
    if (orderId) {
      router.push(`/(customer)/order/${orderId}` as any);
    }
  }

  return (
    <SettingsScreen title={COPY.notifications.en} titleTa={COPY.notifications.ta}>
      {/* Recent Notifications Feed */}
      <View className="gap-2.5 px-4 pb-2">
        <View className="flex-row items-center justify-between">
          <T className="text-[12px] font-bold text-foreground">RECENT ALERTS & UPDATES</T>
          <Pressable
            onPress={() => {
              mockNotificationRepository.markAllAsRead();
              setNotifications(mockNotificationRepository.getNotifications());
            }}
          >
            <T className="text-[11px] font-semibold text-primary">Mark all read</T>
          </Pressable>
        </View>

        <View className="gap-2">
          {notifications.map((n) => (
            <PressableScale
              key={n.id}
              to={0.98}
              onPress={() => handleNotificationPress(n.orderId)}
              className={`rounded-xl border p-3 ${
                n.read ? 'border-border bg-surface' : 'border-blue-200 bg-blue-50/70'
              }`}
            >
              <View className="flex-row items-start gap-2.5">
                <View className="mt-0.5 size-7 items-center justify-center rounded-lg bg-primary">
                  {n.type === 'order' ? (
                    <Truck size={14} color="#FFFFFF" strokeWidth={2.2} />
                  ) : (
                    <Tag size={14} color="#FFFFFF" strokeWidth={2.2} />
                  )}
                </View>
                <View className="flex-1">
                  <View className="flex-row items-center justify-between">
                    <T className="text-[13px] font-bold text-foreground">{n.title}</T>
                    <T className="text-[10px] text-muted-foreground">
                      {new Date(n.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </T>
                  </View>
                  <T className="text-[11.5px] leading-[16px] text-muted-foreground">{n.message}</T>
                  {n.orderId ? (
                    <T className="mt-1 text-[11px] font-semibold text-primary">
                      Track Order #{n.orderId.replace('ord-demo-live-', '').replace('ord-demo-past-', '')} →
                    </T>
                  ) : null}
                </View>
              </View>
            </PressableScale>
          ))}
        </View>
      </View>

      {/* Preferences Group */}
      <Group
        label="Delivery & SMS Alerts"
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
        label="Promotions"
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

      <View className="h-4" />
    </SettingsScreen>
  );
}
