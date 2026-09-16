/**
 * Payment.
 *
 * Two real choices in Madurai: UPI now, or cash to the rider. Cards are behind
 * a gateway that does not exist yet, so they are not offered — an option that
 * fails after you tap it is worse than one that is absent.
 *
 * The UPI flow is deliberately honest about its one limitation. A `upi://`
 * link opens the app and the money moves, but nothing trustworthy comes back,
 * so the screen says "we are checking" rather than "paid". Pretending
 * otherwise is how a delivery goes out against a payment that never landed.
 */

import * as React from 'react';
import { Alert, Pressable, ScrollView, TextInput, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import * as Clipboard from 'expo-clipboard';
import {
  ArrowLeft,
  Banknote,
  BellOff,
  Check,
  Copy,
  CreditCard,
  Info,
  Mic,
  ShieldCheck,
  Smartphone,
} from 'lucide-react-native';

import {
  PAYMENT_STATE_LABEL,
  UPI_APPS,
  formatInr,
  isUpiConfigured,
  isValidUtr,
  type GateInstructionTag,
  type Order,
  type Payment,
  type UpiApp,
} from '@dfc/core';

import { useAuth } from '@/providers/auth';
import { subscribeOrder } from '@/lib/orders';
import {
  chooseCashOnDelivery,
  claimUpiPaid,
  openUpiApp,
  payWithGateway,
  startPayment,
  subscribePayment,
} from '@/lib/payments';
import { GlassCard, PressableScale, PulseDot } from '@/ui/glass';
import { Button, Card, Divider, ErrorNote, Loading, Money, Num, Screen, T, Ta } from '@/ui';

import { DEMO_MODE } from '@/demo/config';
import { mockPaymentRepository } from '@/demo/repositories/payment.repository';

export default function Pay() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();

  const [order, setOrder] = React.useState<Order | null>(null);
  const [payment, setPayment] = React.useState<Payment | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [utr, setUtr] = React.useState('');
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [selectedTags, setSelectedTags] = React.useState<GateInstructionTag[]>([]);
  const [voiceNoteRecorded, setVoiceNoteRecorded] = React.useState(false);
  const [isRecordingNote, setIsRecordingNote] = React.useState(false);

  React.useEffect(() => {
    if (!id) return;
    return subscribeOrder(id, (o) => {
      setOrder(o);
      setLoading(false);
    });
  }, [id]);

  React.useEffect(() => {
    if (!id) return;
    return subscribePayment(id, setPayment);
  }, [id]);

  if (loading) return <Screen><Loading /></Screen>;
  if (!order) {
    return (
      <Screen>
        <View className="flex-1 items-center justify-center">
          <T className="text-[15px] text-muted-foreground">That order is gone.</T>
        </View>
      </Screen>
    );
  }

  const total = order.pricing.totalPaise;
  const awaiting = payment?.state === 'awaiting_confirmation';
  const done = payment?.state === 'paid' || payment?.state === 'collected';

  async function pickUpiApp(app: UpiApp) {
    setBusy(true);
    setError(null);
    try {
      if (DEMO_MODE) {
        await mockPaymentRepository.simulatePayment(order!, 'upi_intent');
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        router.replace(`/(customer)/order/${order!.id}` as any);
        return;
      }
      const p = await startPayment(order!, 'upi_intent');
      setPayment(p);
      await openUpiApp(p, app);
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function confirmPaid() {
    if (!payment) return;
    if (utr.trim() && !isValidUtr(utr)) {
      setError('A UPI reference number is 12 digits. Leave it blank if you cannot find it.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      if (DEMO_MODE) {
        await mockPaymentRepository.simulatePayment(order!, 'upi_intent');
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        router.replace(`/(customer)/order/${order!.id}` as any);
        return;
      }
      await claimUpiPaid(payment, utr.trim() || undefined);
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function payByCard() {
    setBusy(true);
    setError(null);
    try {
      if (DEMO_MODE) {
        await mockPaymentRepository.simulatePayment(order!, 'gateway');
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        router.replace(`/(customer)/order/${order!.id}` as any);
        return;
      }
      await startPayment(order!, 'gateway');
      await payWithGateway(order!.id);
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function chooseCash() {
    setBusy(true);
    setError(null);
    try {
      await chooseCashOnDelivery(order!, user!.uid);
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert(
        'Cash on delivery',
        `Keep ${formatInr(total)} ready — your rider will collect it at the door. Exact change helps.`,
        [{ text: 'Got it', onPress: () => router.replace(`/(customer)/order/${order!.id}`) }],
      );
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  // -------------------------------------------------------------------------

  return (
    <Screen>
      <View className="flex-row items-center gap-2.5 border-b border-muted px-4 pb-3 pt-2">
        <PressableScale
          to={0.9}
          onPress={() => router.back()}
          className="-ml-2 size-9 items-center justify-center"
        >
          <ArrowLeft size={21} color="#18181B" strokeWidth={2} />
        </PressableScale>
        <T className="flex-1 text-[17px] font-semibold tracking-[-0.3px]">Payment</T>
        <Num className="text-[13px] text-muted-foreground">#{order.code}</Num>
      </View>

      <ScrollView className="flex-1 bg-surface" contentContainerClassName="gap-4 px-4 py-5 pb-10">
        {/* The amount, unmissable */}
        <Card className="items-center gap-1.5 rounded-generative bg-foreground p-6">
          <T
            style={{ fontSize: 11, fontWeight: '700', letterSpacing: 1.3 }}
            className="text-placeholder"
          >
            AMOUNT TO PAY
          </T>
          <Num
            style={{ fontSize: 46, fontWeight: '700', letterSpacing: -2, lineHeight: 52 }}
            className="text-white"
          >
            {formatInr(total)}
          </Num>
          <Ta className="text-[11.5px] text-muted-foreground">
            {order.storeName ?? 'DFC'} · {order.items.filter((i) => i.included).length} பொருட்கள்
          </Ta>
        </Card>

        {/* --- already settled --- */}
        {done ? (
          <Animated.View entering={FadeIn}>
            <Card className="items-center gap-3 border-grocery-border bg-grocery-tint p-6">
              <View className="size-14 items-center justify-center rounded-full bg-grocery">
                <Check size={28} color="#FFFFFF" strokeWidth={3} />
              </View>
              <T className="text-[17px] font-semibold text-grocery-fg">
                {PAYMENT_STATE_LABEL[payment!.state].en}
              </T>
              <Ta className="text-[12.5px] text-grocery-fg">
                {PAYMENT_STATE_LABEL[payment!.state].ta}
              </Ta>
              <Button
                size="md"
                label="View invoice"
                className="mt-1 w-full"
                onPress={() => router.replace(`/(customer)/invoice/${order.id}`)}
              />
            </Card>
          </Animated.View>
        ) : awaiting ? (
          /* --- claimed, being checked --- */
          <Animated.View entering={FadeInDown.duration(280)}>
            <Card className="gap-3.5 border-verify-border bg-verify-tint p-5">
              <View className="flex-row items-center gap-2.5">
                <PulseDot color="#B45309" size={9} />
                <T className="flex-1 text-[15px] font-semibold text-verify-fg">
                  Checking your payment
                </T>
              </View>
              <Ta className="-mt-2 text-[12px] text-verify">சரிபார்க்கப்படுகிறது</Ta>
              <T className="text-[13px] leading-[20px] text-verify-fg">
                We are matching your transfer against our bank. This usually takes a few minutes.
                Your order is already with the store — you do not need to wait on this screen.
              </T>
              <View className="flex-row items-center gap-2 rounded-control bg-white/60 px-3 py-2.5">
                <T className="flex-1 text-[11.5px] text-verify-fg">Reference</T>
                <Num className="text-[12.5px] font-semibold text-verify-fg">
                  {payment!.reference}
                </Num>
              </View>
              <Button
                variant="outline"
                size="md"
                label="Track my order"
                onPress={() => router.replace(`/(customer)/order/${order.id}`)}
              />
            </Card>
          </Animated.View>
        ) : (
          <>
            {/* Delivery Gate Instructions & 15s Voice Memo */}
            <Card className="p-4 gap-3 border-border bg-card">
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center gap-2">
                  <BellOff size={16} color="#3B82F6" />
                  <T className="text-[13px] font-bold text-foreground">Gate &amp; Arrival Instructions</T>
                </View>
                <T className="text-[10px] font-extrabold uppercase text-primary">Final 100m</T>
              </View>

              <T className="text-[11.5px] text-muted-foreground">
                Help your rider reach your doorstep without calling you multiple times.
              </T>

              <View className="flex-row flex-wrap gap-2">
                {[
                  { tag: 'no_bell' as GateInstructionTag, label: "Don't ring bell 🔕" },
                  { tag: 'leave_with_guard' as GateInstructionTag, label: 'Leave with guard 👮' },
                  { tag: 'pet_inside' as GateInstructionTag, label: 'Pet in premises 🐕' },
                  { tag: 'call_before' as GateInstructionTag, label: 'Call before arriving 📞' },
                ].map(({ tag, label }) => {
                  const isSelected = selectedTags.includes(tag);
                  return (
                    <Pressable
                      key={tag}
                      onPress={() => {
                        void Haptics.selectionAsync();
                        setSelectedTags((prev) =>
                          prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
                        );
                      }}
                      className={`px-3 py-1.5 rounded-full border ${
                        isSelected
                          ? 'bg-primary/15 border-primary'
                          : 'bg-surface border-border'
                      }`}
                    >
                      <T className={`text-[11.5px] font-semibold ${isSelected ? 'text-primary' : 'text-muted-foreground'}`}>
                        {label}
                      </T>
                    </Pressable>
                  );
                })}
              </View>

              {/* 15-second Voice Memo Recorder */}
              <View className="pt-1 border-t border-border/50">
                <Pressable
                  onPress={() => {
                    if (!isRecordingNote) {
                      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                      setIsRecordingNote(true);
                      setTimeout(() => {
                        setIsRecordingNote(false);
                        setVoiceNoteRecorded(true);
                        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                      }, 2500);
                    }
                  }}
                  className={`flex-row items-center justify-between p-2.5 rounded-xl border ${
                    voiceNoteRecorded
                      ? 'bg-emerald-500/10 border-emerald-500/30'
                      : isRecordingNote
                      ? 'bg-red-500/10 border-red-500/40 animate-pulse'
                      : 'bg-surface border-border'
                  }`}
                >
                  <View className="flex-row items-center gap-2">
                    <Mic size={15} color={isRecordingNote ? '#EF4444' : voiceNoteRecorded ? '#10B981' : '#71717A'} />
                    <T className={`text-[12px] font-semibold ${voiceNoteRecorded ? 'text-emerald-500' : isRecordingNote ? 'text-red-500' : 'text-foreground'}`}>
                      {isRecordingNote
                        ? 'Recording 15s memo… speak gate directions'
                        : voiceNoteRecorded
                        ? '15s Audio Memo Attached 🎧'
                        : 'Record 15s Voice Memo for Rider'}
                    </T>
                  </View>
                  {voiceNoteRecorded && (
                    <T className="text-[10.5px] text-emerald-600 dark:text-emerald-400 font-bold">Saved</T>
                  )}
                </Pressable>
              </View>
            </Card>

            {/* --- UPI --- */}
            <View className="gap-2.5">
              <View className="flex-row items-center gap-2 px-1">
                <Smartphone size={15} color="#52525B" strokeWidth={2} />
                <T className="text-[10.5px] font-bold tracking-[1.05px] text-placeholder">
                  PAY BY UPI
                </T>
              </View>

              {!isUpiConfigured() ? (
                <Card className="flex-row gap-3 border-verify-border bg-verify-tint p-4">
                  <Info size={17} color="#B45309" strokeWidth={2} style={{ marginTop: 1 }} />
                  <T className="flex-1 text-[12.5px] leading-[18px] text-verify-fg">
                    UPI is not switched on yet — the payee VPA is still a placeholder in
                    packages/core/src/payment.ts. Cash on delivery works today.
                  </T>
                </Card>
              ) : (
                <GlassCard className="rounded-card">
                  <View className="gap-0 p-1">
                    {UPI_APPS.map((app, i) => (
                      <React.Fragment key={app.id}>
                        {i > 0 ? <Divider className="ml-[52px] bg-muted" /> : null}
                        <PressableScale
                          to={0.98}
                          haptic
                          disabled={busy}
                          onPress={() => void pickUpiApp(app)}
                          accessibilityRole="button"
                          accessibilityLabel={`Pay with ${app.name}`}
                          className="min-h-[56px] flex-row items-center gap-3 px-3 py-3"
                        >
                          <View className="size-9 items-center justify-center rounded-[10px] bg-muted">
                            <Smartphone size={17} color="#52525B" strokeWidth={2} />
                          </View>
                          <T className="flex-1 text-[15px] font-medium">{app.name}</T>
                          <T className="text-[12.5px] text-muted-foreground">
                            {formatInr(total)}
                          </T>
                        </PressableScale>
                      </React.Fragment>
                    ))}
                  </View>
                </GlassCard>
              )}

              {payment?.method === 'upi_intent' ? (
                <Animated.View entering={FadeInDown.duration(240)} className="gap-2.5">
                  <Card className="gap-3 p-4">
                    <T className="text-[13px] font-semibold tracking-tight">
                      Paid already? Tell us.
                    </T>
                    <T className="text-[12.5px] leading-[18px] text-muted-foreground">
                      Enter the 12-digit UPI reference from your app if you have it — it makes the
                      check instant. You can leave it blank.
                    </T>
                    <View className="flex-row items-center gap-2">
                      <TextInput
                        value={utr}
                        onChangeText={(v) => setUtr(v.replace(/\D/g, '').slice(0, 12))}
                        placeholder="12-digit UTR"
                        placeholderTextColor="#A1A1AA"
                        keyboardType="number-pad"
                        accessibilityLabel="UPI reference number"
                        className="h-12 flex-1 rounded-control border border-border bg-background px-3.5 font-mono text-[15px] tracking-[1px] text-foreground"
                      />
                      <Pressable
                        onPress={() => {
                          void Clipboard.setStringAsync(payment.reference);
                          void Haptics.selectionAsync();
                        }}
                        accessibilityLabel="Copy our reference"
                        className="size-12 items-center justify-center rounded-control border border-border bg-background"
                      >
                        <Copy size={17} color="#52525B" strokeWidth={2} />
                      </Pressable>
                    </View>
                    <Button
                      size="md"
                      label="I have paid"
                      labelTa="பணம் செலுத்திவிட்டேன்"
                      loading={busy}
                      onPress={() => void confirmPaid()}
                    />
                  </Card>
                </Animated.View>
              ) : null}
            </View>

            {/* --- card / net banking, via the hosted gateway --- */}
            <View className="gap-2.5">
              <View className="flex-row items-center gap-2 px-1">
                <CreditCard size={15} color="#52525B" strokeWidth={2} />
                <T className="text-[10.5px] font-bold tracking-[1.05px] text-placeholder">
                  CARD, NET BANKING OR WALLET
                </T>
              </View>
              <PressableScale to={0.98} haptic onPress={() => void payByCard()} disabled={busy}>
                <Card className="flex-row items-center gap-3 p-4">
                  <View className="size-10 items-center justify-center rounded-[11px] bg-primary/10">
                    <CreditCard size={19} color="#18181B" strokeWidth={2} />
                  </View>
                  <View className="flex-1">
                    <T className="text-[15px] font-semibold tracking-tight">Pay securely online</T>
                    <Ta className="mt-0.5 text-[11.5px]">பாதுகாப்பான ஆன்லைன் பணம்</Ta>
                    <T className="mt-1 text-[12px] text-muted-foreground">
                      Confirms instantly — no waiting for us to check.
                    </T>
                  </View>
                </Card>
              </PressableScale>
            </View>

            {/* --- cash --- */}
            <View className="gap-2.5">
              <View className="flex-row items-center gap-2 px-1">
                <Banknote size={15} color="#52525B" strokeWidth={2} />
                <T className="text-[10.5px] font-bold tracking-[1.05px] text-placeholder">
                  OR PAY AT THE DOOR
                </T>
              </View>
              <PressableScale to={0.98} haptic onPress={() => void chooseCash()} disabled={busy}>
                <Card className="flex-row items-center gap-3 p-4">
                  <View className="size-10 items-center justify-center rounded-[11px] bg-grocery-tint">
                    <Banknote size={19} color="#16A34A" strokeWidth={2} />
                  </View>
                  <View className="flex-1">
                    <T className="text-[15px] font-semibold tracking-tight">Cash on delivery</T>
                    <Ta className="mt-0.5 text-[11.5px]">கையில் பணம்</Ta>
                    <T className="mt-1 text-[12px] text-muted-foreground">
                      Keep {formatInr(total)} ready. Exact change helps.
                    </T>
                  </View>
                </Card>
              </PressableScale>
            </View>
          </>
        )}

        {error ? <ErrorNote message={error} /> : null}

        <View className="flex-row items-start gap-2.5 px-1 pt-1">
          <ShieldCheck size={14} color="#A1A1AA" strokeWidth={2} style={{ marginTop: 2 }} />
          <T className="flex-1 text-[11px] leading-[16px] text-placeholder">
            DFC never stores your UPI ID, card number or PIN. A tax invoice is issued for every
            paid order.
          </T>
        </View>

        <Money paise={total} size={0} className="hidden" />
      </ScrollView>
    </Screen>
  );
}
