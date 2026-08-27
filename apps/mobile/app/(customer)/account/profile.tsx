/**
 * Profile.
 *
 * Name and locality are editable. The phone number is not — it is the account
 * identity and how a rider reaches you, so changing it is a re-verification
 * flow rather than a text field.
 */

import * as React from 'react';
import { TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Check, Lock } from 'lucide-react-native';

import { COPY, LOCALITIES } from '@dfc/core';

import { useAuth } from '@/providers/auth';
import { Button, Card, ErrorNote, T, Ta } from '@/ui';
import { Group, Row, SettingsScreen } from '@/ui/settings';

export default function Profile() {
  const router = useRouter();
  const { profile, updateProfile } = useAuth();

  const [name, setName] = React.useState(profile?.name ?? '');
  const [address, setAddress] = React.useState(profile?.addressLine ?? '');
  const [localityId, setLocalityId] = React.useState(profile?.localityId ?? 'kk-nagar');
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [saved, setSaved] = React.useState(false);

  const dirty =
    name.trim() !== (profile?.name ?? '') ||
    address.trim() !== (profile?.addressLine ?? '') ||
    localityId !== profile?.localityId;

  async function save() {
    if (!name.trim()) {
      setError('A rider needs a name to ask for at the door.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await updateProfile({
        name: name.trim(),
        addressLine: address.trim(),
        localityId,
      });
      setSaved(true);
      setTimeout(() => router.back(), 500);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <SettingsScreen title={COPY.profile.en} titleTa={COPY.profile.ta}>
      <Card className="gap-4 p-4">
        <View className="gap-1.5">
          <T className="text-[11px] font-bold tracking-[0.9px] text-placeholder">NAME</T>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="R. Karthikeyan"
            placeholderTextColor="#A1A1AA"
            autoCapitalize="words"
            accessibilityLabel="Your name"
            className="h-12 rounded-control border border-border bg-background px-3.5 font-sans text-[15px] text-foreground"
          />
        </View>

        <View className="gap-1.5">
          <T className="text-[11px] font-bold tracking-[0.9px] text-placeholder">
            DOOR NUMBER & STREET
          </T>
          <TextInput
            value={address}
            onChangeText={setAddress}
            placeholder="14/2, 2nd Main Road"
            placeholderTextColor="#A1A1AA"
            multiline
            accessibilityLabel="Address line"
            className="min-h-[68px] rounded-control border border-border bg-background px-3.5 py-3 font-sans text-[15px] leading-[21px] text-foreground"
          />
        </View>
      </Card>

      <Group label="Locality" footer="Sets your default delivery area and what delivery costs.">
        {LOCALITIES.map((l) => (
          <Row
            key={l.id}
            label={{ en: l.name, ta: l.nameTa }}
            value={l.pincode}
            chevron={false}
            onPress={() => setLocalityId(l.id)}
            right={
              localityId === l.id ? (
                <View className="size-[22px] items-center justify-center rounded-full bg-primary">
                  <Check size={13} color="#FFFFFF" strokeWidth={3.2} />
                </View>
              ) : (
                <View className="size-[22px] rounded-full border-2 border-disabled" />
              )
            }
          />
        ))}
      </Group>

      <Group label="Phone" footer="Your number is your DFC account. To change it, contact support.">
        <Row
          icon={<Lock size={19} color="#A1A1AA" strokeWidth={1.9} />}
          label={profile?.phone ?? '—'}
          chevron={false}
        />
      </Group>

      {error ? <ErrorNote message={error} /> : null}

      <Button
        size="lg"
        label={saved ? 'Saved' : COPY.save.en}
        labelTa={saved ? undefined : COPY.save.ta}
        disabled={!dirty || saved}
        loading={busy}
        onPress={() => void save()}
      />

      <Ta className="px-1 text-center text-[11px]">{COPY.profile.ta}</Ta>
    </SettingsScreen>
  );
}
