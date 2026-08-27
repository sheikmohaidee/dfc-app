/**
 * Account deletion.
 *
 * Apple guideline 5.1.1(v) and Google Play's data-deletion policy both require
 * this to be reachable from inside the app without contacting support. A
 * reviewer will look for it, so it is a visible row on the account hub and
 * this screen does the work rather than opening a mailto: link.
 *
 * It is also honest about what survives: Indian tax law requires keeping a
 * financial record of completed transactions, and pretending otherwise would
 * be a lie in a legal document.
 */

import * as React from 'react';
import { Alert, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { AlertTriangle, Check } from 'lucide-react-native';
import { deleteUser, signOut as fbSignOut } from 'firebase/auth';
import { collection, deleteDoc, doc, getDocs, query, where, writeBatch } from 'firebase/firestore';
import { deleteObject, ref } from 'firebase/storage';

import { COL, COPY, DELETE_ACCOUNT_POLICY, OPEN_STATUSES } from '@dfc/core';

import { useAuth } from '@/providers/auth';
import { auth, db, storage } from '@/lib/firebase';
import { Button, Card, ErrorNote, Screen, T, Ta } from '@/ui';
import { SettingsHeader, SettingsScroll } from '@/ui/settings';

const CONFIRM_WORD = 'DELETE';

export default function DeleteAccount() {
  const router = useRouter();
  const { user, profile } = useAuth();

  const [typed, setTyped] = React.useState('');
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const armed = typed.trim().toUpperCase() === CONFIRM_WORD;

  /**
   * Deletes what the client is allowed to delete, then the auth user. Orders
   * are never hard-deleted — the rules forbid it and the ledger has to survive
   * an audit — so they are stripped of identity instead.
   */
  async function performDeletion() {
    if (!user) return;
    setBusy(true);
    setError(null);

    try {
      // 1. Refuse while money or goods are in motion.
      const live = await getDocs(
        query(
          collection(db(), COL.orders),
          where('customerUid', '==', user.uid),
          where('status', 'in', OPEN_STATUSES),
        ),
      );
      if (!live.empty) {
        setBusy(false);
        Alert.alert(
          'You have an order in progress',
          `There ${live.size === 1 ? 'is 1 order' : `are ${live.size} orders`} still running. Let ${live.size === 1 ? 'it' : 'them'} finish, or cancel first, then delete your account.`,
        );
        return;
      }

      // 2. Remove every upload this account made.
      const past = await getDocs(
        query(collection(db(), COL.orders), where('customerUid', '==', user.uid)),
      );
      await Promise.all(
        past.docs.map(async (d) => {
          const path = (d.data() as { source?: { storagePath?: string } }).source?.storagePath;
          if (!path) return;
          await deleteObject(ref(storage(), path)).catch(() => {
            /* already gone, or denied — not worth blocking deletion over */
          });
        }),
      );

      // 3. Strip identity from the retained financial records.
      const batch = writeBatch(db());
      for (const d of past.docs) {
        batch.update(d.ref, {
          customerName: 'Deleted user',
          customerPhone: '',
          addressLine: '',
          source: { kind: 'text' },
          ai: null,
          updatedAt: Date.now(),
        });
      }
      await batch.commit();

      // 4. Drop the profile.
      await deleteDoc(doc(db(), COL.users, user.uid));

      // 5. Drop the credential.
      const current = auth().currentUser;
      if (current) {
        try {
          await deleteUser(current);
        } catch (e) {
          // Firebase requires a recent login before deleting a credential.
          if ((e as { code?: string }).code === 'auth/requires-recent-login') {
            await fbSignOut(auth());
            Alert.alert(
              'Almost done',
              'Your data has been deleted. For security, Firebase needs a fresh sign-in to remove the login itself — sign in once more and delete again, and it will complete.',
            );
            router.replace('/(auth)/sign-in');
            return;
          }
          throw e;
        }
      }

      Alert.alert('Account deleted', 'Your DFC account and data are gone. Thank you for using us.');
      router.replace('/(auth)/sign-in');
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  function confirm() {
    Alert.alert(
      'Delete your account?',
      'This is permanent. Your orders, prescriptions and addresses are removed and cannot be restored.',
      [
        { text: 'Keep my account', style: 'cancel' },
        { text: 'Delete forever', style: 'destructive', onPress: () => void performDeletion() },
      ],
    );
  }

  return (
    <Screen>
      <SettingsHeader title={COPY.deleteAccount.en} titleTa={COPY.deleteAccount.ta} />

      <SettingsScroll>
        <Card className="gap-3 border-destructive-border bg-destructive-tint p-4">
          <View className="flex-row items-center gap-2.5">
            <AlertTriangle size={18} color="#B91C1C" strokeWidth={2} />
            <T className="text-[14px] font-semibold text-destructive-fg">
              {COPY.deleteWarning.en}
            </T>
          </View>
          <Ta className="text-[12px] text-destructive-fg">{COPY.deleteWarning.ta}</Ta>
          <T className="text-[13px] leading-[19px] text-destructive-fg">
            {DELETE_ACCOUNT_POLICY.summary}
          </T>
        </Card>

        {DELETE_ACCOUNT_POLICY.sections
          .filter((s) => s.heading === 'What gets deleted' || s.heading === 'What we have to keep')
          .map((s) => (
            <Card key={s.heading} className="gap-2.5 p-4">
              <T className="text-[13.5px] font-semibold tracking-tight">{s.heading}</T>
              {s.body.map((para, i) => (
                <T key={i} className="text-[13px] leading-[19px] text-body-strong">
                  {para}
                </T>
              ))}
              {s.bullets?.map((b, i) => (
                <View key={i} className="flex-row gap-2.5">
                  <Check size={14} color="#71717A" strokeWidth={2.4} style={{ marginTop: 3 }} />
                  <T className="flex-1 text-[13px] leading-[19px] text-body-strong">{b}</T>
                </View>
              ))}
            </Card>
          ))}

        <Card className="gap-3 p-4">
          <T className="text-[13px] font-semibold tracking-tight">{COPY.deleteConfirmPhrase.en}</T>
          <Ta className="-mt-2 text-[11.5px]">{COPY.deleteConfirmPhrase.ta}</Ta>
          <TextInput
            value={typed}
            onChangeText={setTyped}
            autoCapitalize="characters"
            autoCorrect={false}
            placeholder={CONFIRM_WORD}
            placeholderTextColor="#D4D4D8"
            accessibilityLabel="Type DELETE to confirm"
            className="h-12 rounded-control border border-border bg-background px-3.5 font-mono text-[16px] tracking-[2px] text-foreground"
          />
        </Card>

        {error ? <ErrorNote message={error} /> : null}

        <Button
          variant="destructive"
          size="lg"
          label={COPY.deleteForever.en}
          labelTa={COPY.deleteForever.ta}
          disabled={!armed}
          loading={busy}
          onPress={confirm}
        />

        <T className="px-1 text-center text-[11.5px] leading-[17px] text-placeholder">
          Signed in as {profile?.phone ?? user?.email ?? 'this account'}.
        </T>
      </SettingsScroll>
    </Screen>
  );
}
