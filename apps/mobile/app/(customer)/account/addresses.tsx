/**
 * Saved addresses.
 *
 * Home / Work / Other, with one default. Stored on the user profile rather
 * than a subcollection — a person has three addresses, not three hundred, and
 * a subcollection would cost an extra read on every order for no benefit.
 */

import * as React from 'react';
import { Alert, TextInput, View } from 'react-native';
import { Briefcase, Check, House, MapPin, Plus, Trash2 } from 'lucide-react-native';
import { doc, updateDoc } from 'firebase/firestore';

import { COL, COPY, LOCALITIES, localityById } from '@dfc/core';

import { useAuth } from '@/providers/auth';
import { db } from '@/lib/firebase';
import { Button, Card, ErrorNote, T, Ta } from '@/ui';
import { Group, Row, SettingsScreen } from '@/ui/settings';

export type AddressLabel = 'home' | 'work' | 'other';

export interface SavedAddress {
  id: string;
  label: AddressLabel;
  line: string;
  localityId: string;
  isDefault: boolean;
}

const LABEL_ICON = {
  home: House,
  work: Briefcase,
  other: MapPin,
} as const;

const rid = () => `addr_${Math.random().toString(36).slice(2, 10)}`;

export default function Addresses() {
  const { user, profile } = useAuth();

  // Addresses live on the profile doc; the type in core keeps the base fields.
  const saved = ((profile as unknown as { addresses?: SavedAddress[] })?.addresses ??
    []) as SavedAddress[];

  const [adding, setAdding] = React.useState(saved.length === 0);
  const [label, setLabel] = React.useState<AddressLabel>('home');
  const [line, setLine] = React.useState('');
  const [localityId, setLocalityId] = React.useState(profile?.localityId ?? 'kk-nagar');
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function write(next: SavedAddress[]) {
    if (!user) return;
    setBusy(true);
    setError(null);
    try {
      await updateDoc(doc(db(), COL.users, user.uid), {
        addresses: next,
        updatedAt: Date.now(),
      });
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function add() {
    if (!line.trim()) {
      setError('Add a door number and street so a rider can find you.');
      return;
    }
    const entry: SavedAddress = {
      id: rid(),
      label,
      line: line.trim(),
      localityId,
      isDefault: saved.length === 0,
    };
    await write([...saved, entry]);
    setLine('');
    setAdding(false);
  }

  async function makeDefault(id: string) {
    await write(saved.map((a) => ({ ...a, isDefault: a.id === id })));
  }

  function remove(a: SavedAddress) {
    Alert.alert('Remove this address?', a.line, [
      { text: 'Keep', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: () => {
          const next = saved.filter((x) => x.id !== a.id);
          // Never leave the list without a default.
          if (a.isDefault && next[0]) next[0].isDefault = true;
          void write(next);
        },
      },
    ]);
  }

  return (
    <SettingsScreen title={COPY.savedAddresses.en} titleTa={COPY.savedAddresses.ta}>
      {saved.length > 0 ? (
        <Group label="Your addresses" footer="Tap an address to make it the default.">
          {saved.map((a) => {
            const Icon = LABEL_ICON[a.label];
            const loc = localityById(a.localityId);
            return (
              <Row
                key={a.id}
                icon={<Icon size={19} color="#52525B" strokeWidth={1.9} />}
                label={{
                  en: a.label === 'home' ? 'Home' : a.label === 'work' ? 'Work' : 'Other',
                  ta: a.label === 'home' ? COPY.home.ta : a.label === 'work' ? COPY.work.ta : COPY.other.ta,
                }}
                hint={`${a.line} · ${loc?.name ?? a.localityId}`}
                chevron={false}
                onPress={() => void makeDefault(a.id)}
                right={
                  <View className="flex-row items-center gap-3">
                    {a.isDefault ? (
                      <View className="rounded-chip border border-grocery-border bg-grocery-tint px-1.5 py-0.5">
                        <T className="text-[9px] font-bold tracking-[0.4px] text-grocery-fg">
                          DEFAULT
                        </T>
                      </View>
                    ) : null}
                    <Trash2
                      size={17}
                      color="#DC2626"
                      strokeWidth={1.9}
                      onPress={() => remove(a)}
                    />
                  </View>
                }
              />
            );
          })}
        </Group>
      ) : null}

      {adding ? (
        <Card className="gap-4 p-4">
          <T className="text-[13.5px] font-semibold tracking-tight">{COPY.addAddress.en}</T>

          <View className="flex-row gap-2">
            {(['home', 'work', 'other'] as AddressLabel[]).map((l) => {
              const Icon = LABEL_ICON[l];
              const on = label === l;
              return (
                <View
                  key={l}
                  onTouchEnd={() => setLabel(l)}
                  className={`h-10 flex-1 flex-row items-center justify-center gap-1.5 rounded-control border ${
                    on ? 'border-primary bg-primary' : 'border-border bg-background'
                  }`}
                >
                  <Icon size={15} color={on ? '#FAFAFA' : '#52525B'} strokeWidth={2} />
                  <T
                    className={`text-[13px] font-medium capitalize ${
                      on ? 'text-primary-foreground' : 'text-body-strong'
                    }`}
                  >
                    {l}
                  </T>
                </View>
              );
            })}
          </View>

          <TextInput
            value={line}
            onChangeText={setLine}
            placeholder="14/2, 2nd Main Road, near the temple"
            placeholderTextColor="#A1A1AA"
            multiline
            accessibilityLabel="Door number and street"
            className="min-h-[68px] rounded-control border border-border bg-background px-3.5 py-3 font-sans text-[15px] leading-[21px] text-foreground"
          />

          <View className="gap-2">
            <T className="text-[11px] font-bold tracking-[0.9px] text-placeholder">LOCALITY</T>
            <View className="flex-row flex-wrap gap-2">
              {LOCALITIES.map((l) => {
                const on = localityId === l.id;
                return (
                  <View
                    key={l.id}
                    onTouchEnd={() => setLocalityId(l.id)}
                    className={`h-9 justify-center rounded-full border px-3 ${
                      on ? 'border-primary bg-primary' : 'border-border bg-background'
                    }`}
                  >
                    <T
                      className={`text-[12.5px] font-medium ${
                        on ? 'text-primary-foreground' : 'text-body-strong'
                      }`}
                    >
                      {l.name}
                    </T>
                  </View>
                );
              })}
            </View>
          </View>

          {error ? <ErrorNote message={error} /> : null}

          <View className="flex-row gap-2.5">
            {saved.length > 0 ? (
              <Button
                variant="outline"
                size="md"
                label={COPY.cancel.en}
                className="flex-1"
                onPress={() => {
                  setAdding(false);
                  setError(null);
                }}
              />
            ) : null}
            <Button
              size="md"
              label={COPY.save.en}
              className="flex-1"
              loading={busy}
              left={<Check size={16} color="#FAFAFA" strokeWidth={2.4} />}
              onPress={() => void add()}
            />
          </View>
        </Card>
      ) : (
        <Button
          variant="outline"
          size="lg"
          label={COPY.addAddress.en}
          labelTa={COPY.addAddress.ta}
          left={<Plus size={17} color="#3F3F46" strokeWidth={2.2} />}
          onPress={() => setAdding(true)}
        />
      )}

      <Ta className="px-1 text-center text-[11px]">
        முகவரி சேமித்தால் ஒவ்வொரு முறையும் தட்டச்சு செய்ய வேண்டாம்
      </Ta>
    </SettingsScreen>
  );
}
