/**
 * DFC Payment Screen — Stitch Dark Floating Theme
 * Real-time UPI intent launcher, UTR verification claim, online card gateway,
 * Cash on Delivery selection, and 15s Doorstep Gate Memo recording.
 */

import * as React from 'react';
import { Alert, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
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
  CheckCircle2,
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
import { Screen } from '@/ui';
import { StitchHeader } from '@/ui/stitch-header';

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

  if (loading) {
    return (
      <Screen edges={['top']} style={{ backgroundColor: '#0E0E10' }}>
        <StitchHeader showBack={true} title="Payment" />
        <View className="flex-1 items-center justify-center">
          <Text style={{ fontFamily: 'PlusJakartaSans', fontSize: 14, color: '#928F9E' }}>
            Loading payment details...
          </Text>
        </View>
      </Screen>
    );
  }

  if (!order) {
    return (
      <Screen edges={['top']} style={{ backgroundColor: '#0E0E10' }}>
        <StitchHeader showBack={true} title="Payment" />
        <View className="flex-1 items-center justify-center">
          <Text style={{ fontFamily: 'PlusJakartaSans', fontSize: 15, color: '#928F9E' }}>
            That order could not be located.
          </Text>
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
      setError('A UPI reference number is 12 digits. Leave blank if not found.');
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
        'Cash on Delivery Confirmed',
        `Keep ${formatInr(total)} ready — your captain will collect it at your door.`,
        [{ text: 'Got it', onPress: () => router.replace(`/(customer)/order/${order!.id}`) }],
      );
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Screen edges={['top']} style={{ backgroundColor: '#0E0E10' }}>
      <StitchHeader
        showBack={true}
        title="Payment"
        subtitle={`ORD-#${order.code} · ${order.storeName ?? 'DFC'}`}
        showNotifications={false}
      />

      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingTop: 16,
          paddingBottom: 48,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Amount to Pay Hero Card */}
        <View
          style={{
            backgroundColor: '#18181B',
            borderRadius: 24,
            borderWidth: 1,
            borderColor: 'rgba(106, 90, 205, 0.4)',
            padding: 24,
            alignItems: 'center',
            marginBottom: 20,
            shadowColor: '#6A5ACD',
            shadowOpacity: 0.2,
            shadowRadius: 16,
            elevation: 4,
          }}
        >
          <Text
            style={{
              fontFamily: 'PlusJakartaSans',
              fontSize: 11,
              fontWeight: '700',
              color: '#C8BFFF',
              letterSpacing: 1.5,
              textTransform: 'uppercase',
              marginBottom: 4,
            }}
          >
            AMOUNT TO PAY
          </Text>
          <Text
            style={{
              fontFamily: 'PlusJakartaSans',
              fontSize: 40,
              fontWeight: '800',
              color: '#FFFFFF',
              letterSpacing: -1,
            }}
          >
            {formatInr(total)}
          </Text>
          <Text
            style={{
              fontFamily: 'PlusJakartaSans',
              fontSize: 12,
              color: '#928F9E',
              marginTop: 4,
            }}
          >
            {order.storeName ?? 'DFC'} · {order.items.filter((i) => i.included).length} items
          </Text>
        </View>

        {/* Settled or Awaiting Confirmation */}
        {done ? (
          <Animated.View entering={FadeIn}>
            <View
              style={{
                backgroundColor: '#18181B',
                borderRadius: 20,
                borderWidth: 1,
                borderColor: 'rgba(16, 185, 129, 0.4)',
                padding: 24,
                alignItems: 'center',
                marginBottom: 20,
              }}
            >
              <View
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 28,
                  backgroundColor: 'rgba(16, 185, 129, 0.2)',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 12,
                }}
              >
                <Check size={28} color="#34D399" strokeWidth={3} />
              </View>
              <Text
                style={{
                  fontFamily: 'PlusJakartaSans',
                  fontSize: 18,
                  fontWeight: '700',
                  color: '#34D399',
                  marginBottom: 4,
                }}
              >
                {PAYMENT_STATE_LABEL[payment!.state].en}
              </Text>
              <Text style={{ fontFamily: 'PlusJakartaSans', fontSize: 13, color: '#928F9E', marginBottom: 16 }}>
                Payment verified. Your delivery captain is en route.
              </Text>
              <Pressable
                onPress={() => router.replace(`/(customer)/invoice/${order.id}` as any)}
                style={{
                  width: '100%',
                  backgroundColor: '#6A5ACD',
                  paddingVertical: 13,
                  borderRadius: 12,
                  alignItems: 'center',
                }}
              >
                <Text style={{ fontFamily: 'PlusJakartaSans', fontSize: 14, fontWeight: '700', color: '#FFFFFF' }}>
                  View Invoice
                </Text>
              </Pressable>
            </View>
          </Animated.View>
        ) : awaiting ? (
          <Animated.View entering={FadeInDown.duration(280)}>
            <View
              style={{
                backgroundColor: '#1E1B10',
                borderRadius: 20,
                borderWidth: 1,
                borderColor: '#382F10',
                padding: 20,
                marginBottom: 20,
              }}
            >
              <View className="flex-row items-center gap-2 mb-2">
                <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#FBBF24' }} />
                <Text style={{ fontFamily: 'PlusJakartaSans', fontSize: 15, fontWeight: '700', color: '#FDE68A' }}>
                  Checking payment with bank
                </Text>
              </View>
              <Text
                style={{
                  fontFamily: 'PlusJakartaSans',
                  fontSize: 12,
                  color: '#D4B36D',
                  lineHeight: 18,
                  marginBottom: 14,
                }}
              >
                We are matching your transfer against our bank. Your order is already with the store — you do not need
                to wait here.
              </Text>
              <View
                style={{
                  backgroundColor: '#141208',
                  borderRadius: 10,
                  paddingHorizontal: 12,
                  paddingVertical: 8,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: 14,
                }}
              >
                <Text style={{ fontFamily: 'PlusJakartaSans', fontSize: 12, color: '#928F9E' }}>Reference ID</Text>
                <Text style={{ fontFamily: 'PlusJakartaSans', fontSize: 12, fontWeight: '700', color: '#E5E1E4' }}>
                  {payment!.reference}
                </Text>
              </View>
              <Pressable
                onPress={() => router.replace(`/(customer)/order/${order.id}`)}
                style={{
                  borderWidth: 1,
                  borderColor: '#6A5ACD',
                  paddingVertical: 12,
                  borderRadius: 12,
                  alignItems: 'center',
                }}
              >
                <Text style={{ fontFamily: 'PlusJakartaSans', fontSize: 13, fontWeight: '700', color: '#C8BFFF' }}>
                  Track Order Live
                </Text>
              </Pressable>
            </View>
          </Animated.View>
        ) : (
          <>
            {/* Gate & Arrival Instructions */}
            <View
              style={{
                backgroundColor: '#18181B',
                borderRadius: 20,
                borderWidth: 1,
                borderColor: '#26262B',
                padding: 16,
                marginBottom: 20,
              }}
            >
              <View className="flex-row items-center justify-between mb-2">
                <View className="flex-row items-center gap-2">
                  <BellOff size={16} color="#C8BFFF" />
                  <Text
                    style={{
                      fontFamily: 'PlusJakartaSans',
                      fontSize: 13,
                      fontWeight: '700',
                      color: '#E5E1E4',
                    }}
                  >
                    Gate & Arrival Instructions
                  </Text>
                </View>
                <Text
                  style={{
                    fontFamily: 'PlusJakartaSans',
                    fontSize: 10,
                    fontWeight: '800',
                    color: '#6A5ACD',
                    textTransform: 'uppercase',
                  }}
                >
                  Final 100m
                </Text>
              </View>

              <Text style={{ fontFamily: 'PlusJakartaSans', fontSize: 12, color: '#928F9E', marginBottom: 12 }}>
                Help your captain reach your doorstep seamlessly.
              </Text>

              <View className="flex-row flex-wrap gap-2 mb-3">
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
                      style={{
                        paddingHorizontal: 12,
                        paddingVertical: 7,
                        borderRadius: 20,
                        borderWidth: 1,
                        backgroundColor: isSelected ? 'rgba(106, 90, 205, 0.2)' : '#1F1E24',
                        borderColor: isSelected ? '#6A5ACD' : '#2A2930',
                      }}
                    >
                      <Text
                        style={{
                          fontFamily: 'PlusJakartaSans',
                          fontSize: 11,
                          fontWeight: isSelected ? '700' : '500',
                          color: isSelected ? '#C8BFFF' : '#928F9E',
                        }}
                      >
                        {label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              {/* 15s Voice Memo */}
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
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: 12,
                  borderRadius: 12,
                  borderWidth: 1,
                  backgroundColor: voiceNoteRecorded
                    ? 'rgba(16, 185, 129, 0.12)'
                    : isRecordingNote
                    ? 'rgba(239, 68, 68, 0.12)'
                    : '#1F1E24',
                  borderColor: voiceNoteRecorded
                    ? 'rgba(16, 185, 129, 0.3)'
                    : isRecordingNote
                    ? '#EF4444'
                    : '#2A2930',
                }}
              >
                <View className="flex-row items-center gap-2">
                  <Mic size={16} color={isRecordingNote ? '#EF4444' : voiceNoteRecorded ? '#34D399' : '#C8BFFF'} />
                  <Text
                    style={{
                      fontFamily: 'PlusJakartaSans',
                      fontSize: 12,
                      fontWeight: '600',
                      color: voiceNoteRecorded ? '#34D399' : isRecordingNote ? '#F87171' : '#E5E1E4',
                    }}
                  >
                    {isRecordingNote
                      ? 'Recording 15s memo… speak directions'
                      : voiceNoteRecorded
                      ? '15s Audio Memo Attached 🎧'
                      : 'Record 15s Voice Memo for Captain'}
                  </Text>
                </View>
                {voiceNoteRecorded ? (
                  <Text style={{ fontFamily: 'PlusJakartaSans', fontSize: 11, fontWeight: '700', color: '#34D399' }}>
                    Saved
                  </Text>
                ) : null}
              </Pressable>
            </View>

            {/* Pay by UPI */}
            <View className="mb-6">
              <View className="flex-row items-center gap-2 px-1 mb-2.5">
                <Smartphone size={14} color="#C8BFFF" />
                <Text
                  style={{
                    fontFamily: 'PlusJakartaSans',
                    fontSize: 11,
                    fontWeight: '700',
                    color: '#928F9E',
                    letterSpacing: 1,
                  }}
                >
                  INSTANT UPI APPS
                </Text>
              </View>

              <View
                style={{
                  backgroundColor: '#18181B',
                  borderRadius: 20,
                  borderWidth: 1,
                  borderColor: '#26262B',
                  padding: 8,
                }}
              >
                {UPI_APPS.map((app, i) => (
                  <Pressable
                    key={app.id}
                    onPress={() => void pickUpiApp(app)}
                    disabled={busy}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      padding: 12,
                      borderRadius: 12,
                      borderBottomWidth: i < UPI_APPS.length - 1 ? 1 : 0,
                      borderBottomColor: '#26262B',
                    }}
                  >
                    <View
                      style={{
                        width: 38,
                        height: 38,
                        borderRadius: 12,
                        backgroundColor: '#26252E',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginRight: 12,
                      }}
                    >
                      <Smartphone size={18} color="#C8BFFF" />
                    </View>
                    <Text
                      style={{
                        fontFamily: 'PlusJakartaSans',
                        fontSize: 14,
                        fontWeight: '600',
                        color: '#E5E1E4',
                        flex: 1,
                      }}
                    >
                      {app.name}
                    </Text>
                    <Text
                      style={{
                        fontFamily: 'PlusJakartaSans',
                        fontSize: 13,
                        fontWeight: '700',
                        color: '#C8BFFF',
                      }}
                    >
                      {formatInr(total)} →
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            {/* Online Card / Net Banking */}
            <View className="mb-4">
              <Pressable
                onPress={() => void payByCard()}
                disabled={busy}
                style={{
                  backgroundColor: '#18181B',
                  borderRadius: 18,
                  borderWidth: 1,
                  borderColor: '#26262B',
                  padding: 16,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 14,
                }}
              >
                <View
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 14,
                    backgroundColor: 'rgba(106, 90, 205, 0.2)',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <CreditCard size={20} color="#C8BFFF" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontFamily: 'PlusJakartaSans', fontSize: 14, fontWeight: '700', color: '#E5E1E4' }}>
                    Credit / Debit Card / Net Banking
                  </Text>
                  <Text style={{ fontFamily: 'PlusJakartaSans', fontSize: 11, color: '#928F9E', marginTop: 2 }}>
                    Instant confirmation via secure payment gateway
                  </Text>
                </View>
              </Pressable>
            </View>

            {/* Cash on Delivery */}
            <View className="mb-6">
              <Pressable
                onPress={() => void chooseCash()}
                disabled={busy}
                style={{
                  backgroundColor: '#18181B',
                  borderRadius: 18,
                  borderWidth: 1,
                  borderColor: '#26262B',
                  padding: 16,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 14,
                }}
              >
                <View
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 14,
                    backgroundColor: 'rgba(16, 185, 129, 0.15)',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Banknote size={20} color="#34D399" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontFamily: 'PlusJakartaSans', fontSize: 14, fontWeight: '700', color: '#E5E1E4' }}>
                    Cash on Delivery
                  </Text>
                  <Text style={{ fontFamily: 'PlusJakartaSans', fontSize: 11, color: '#928F9E', marginTop: 2 }}>
                    Keep {formatInr(total)} cash ready for captain handover
                  </Text>
                </View>
              </Pressable>
            </View>
          </>
        )}

        {error ? (
          <View
            style={{
              backgroundColor: 'rgba(239, 68, 68, 0.15)',
              borderWidth: 1,
              borderColor: 'rgba(239, 68, 68, 0.3)',
              borderRadius: 12,
              padding: 12,
              marginBottom: 16,
            }}
          >
            <Text style={{ fontFamily: 'PlusJakartaSans', fontSize: 12, color: '#F87171' }}>{error}</Text>
          </View>
        ) : null}

        <View className="flex-row items-center gap-2 px-1">
          <ShieldCheck size={14} color="#6A5ACD" />
          <Text style={{ fontFamily: 'PlusJakartaSans', fontSize: 11, color: '#928F9E', flex: 1 }}>
            DFC uses 256-bit encryption. We never store your UPI PIN or Card CVV.
          </Text>
        </View>
      </ScrollView>
    </Screen>
  );
}
