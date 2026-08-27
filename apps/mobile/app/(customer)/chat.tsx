/**
 * The customer app.
 *
 * There is no tab bar and no catalogue. The thread is the product: you speak,
 * photograph or type, and the model answers with a card you can pay from.
 */

import * as React from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  TextInput,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import * as Haptics from 'expo-haptics';
import Animated, {
  FadeIn,
  FadeInUp,
  Layout,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { Camera, Check, ChevronDown, MapPin, Mic, User } from 'lucide-react-native';

import { COPY, formatInr, isTerminal, localityById, type Order } from '@dfc/core';

import { useAuth } from '@/providers/auth';
import { extractOrder, fallbackExtraction } from '@/lib/ai';
import {
  cancelRecording,
  startRecording,
  stopRecording,
  takePhoto,
  uploadCapture,
  type Capture,
} from '@/lib/media';
import {
  addItem,
  createOrderFromExtraction,
  editItem,
  removeItem,
  setQuantity,
  subscribeMyOrders,
  toggleItem,
} from '@/lib/orders';
import { Badge, Chip, ErrorNote, Num, Screen, T, Ta } from '@/ui';
import { PressableScale, PulseDot } from '@/ui/glass';
import { OrderTemplateCard } from '@/ui/order-card';
import { OrderReviewCard } from '@/ui/review-card';

type Turn =
  | { id: string; kind: 'bot-text'; text: string; textTa?: string }
  | { id: string; kind: 'user-photo'; uri: string; label: string }
  | { id: string; kind: 'user-voice'; durationMs: number; transcript?: string }
  | { id: string; kind: 'user-text'; text: string }
  | { id: string; kind: 'status'; text: string; tone: 'ok' | 'working' }
  | { id: string; kind: 'order'; orderId: string; variant: 'template' | 'review' };

const rid = () => Math.random().toString(36).slice(2, 10);

// ---------------------------------------------------------------------------

function Header() {
  const { profile } = useAuth();
  const router = useRouter();
  const locality = localityById(profile?.localityId);

  return (
    <View className="flex-row items-center gap-2.5 border-b border-muted px-4 pb-3 pt-3.5">
      <View className="size-[30px] items-center justify-center rounded-[9px] bg-primary">
        <T className="text-[13px] font-semibold tracking-tight text-primary-foreground">D</T>
      </View>
      <View className="flex-1">
        <T className="text-[14.5px] font-semibold tracking-tight">DFC</T>
        <Ta className="text-[10.5px]">{COPY.appName.ta}</Ta>
      </View>
      <Pressable
        onPress={() => router.push('/(customer)/account/addresses')}
        className="flex-row items-center gap-1.5 rounded-full border border-border px-2.5 py-1.5"
      >
        <MapPin size={13} color="#71717A" strokeWidth={2} />
        <T className="text-xs font-medium text-body-strong">{locality?.name ?? 'Set area'}</T>
        <ChevronDown size={12} color="#A1A1AA" strokeWidth={2.2} />
      </Pressable>

      <Pressable
        onPress={() => router.push('/(customer)/account')}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel="Account"
        className="size-9 items-center justify-center rounded-full bg-muted"
      >
        <User size={17} color="#52525B" strokeWidth={2} />
      </Pressable>
    </View>
  );
}

function Waveform({ active }: { active?: boolean }) {
  const bars = [8, 15, 22, 12, 26, 18, 9, 20, 24, 11, 16, 7];
  return (
    <View className="h-[26px] flex-row items-center gap-[3px]">
      {bars.map((h, i) => (
        <View
          key={i}
          style={{ height: active ? h : h * 0.7 }}
          className={`w-[3px] rounded-full ${i % 3 === 0 ? 'bg-white/50' : 'bg-white'}`}
        />
      ))}
    </View>
  );
}

/**
 * The mic. It grows and pulses while recording, because a press-and-hold
 * gesture with no feedback is a gesture people do not trust — they let go
 * early and lose the recording.
 */
function MicButton({
  recording,
  disabled,
  onDown,
  onUp,
}: {
  recording: boolean;
  disabled?: boolean;
  onDown: () => void;
  onUp: () => void;
}) {
  const scale = useSharedValue(1);
  const halo = useSharedValue(0);

  React.useEffect(() => {
    if (recording) {
      scale.value = withSpring(1.12, { damping: 12, stiffness: 200 });
      halo.value = withRepeat(withTiming(1, { duration: 900 }), -1, false);
    } else {
      scale.value = withSpring(1, { damping: 15, stiffness: 240 });
      halo.value = withTiming(0, { duration: 180 });
    }
  }, [recording, scale, halo]);

  const body = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const ring = useAnimatedStyle(() => ({
    transform: [{ scale: 1 + halo.value * 0.85 }],
    opacity: (1 - halo.value) * 0.35,
  }));

  return (
    <View className="size-[54px] items-center justify-center">
      {recording ? (
        <Animated.View
          style={ring}
          className="absolute size-[54px] rounded-full bg-destructive"
        />
      ) : null}
      <Animated.View style={body}>
        <Pressable
          onPressIn={onDown}
          onPressOut={onUp}
          disabled={disabled}
          accessibilityRole="button"
          accessibilityLabel={recording ? 'Recording, release to send' : 'Hold to speak'}
          className={`size-[54px] items-center justify-center rounded-full ${
            recording ? 'bg-destructive' : 'bg-primary'
          }`}
          style={{
            shadowColor: recording ? '#DC2626' : '#09090B',
            shadowOpacity: recording ? 0.4 : 0.24,
            shadowRadius: recording ? 14 : 9,
            shadowOffset: { width: 0, height: 3 },
            elevation: 6,
          }}
        >
          <Mic size={23} color="#FAFAFA" strokeWidth={1.9} />
        </Pressable>
      </Animated.View>
    </View>
  );
}

// ---------------------------------------------------------------------------

export default function Chat() {
  const router = useRouter();
  const { user, profile } = useAuth();

  const [turns, setTurns] = React.useState<Turn[]>([]);
  const [orders, setOrders] = React.useState<Record<string, Order>>({});
  const [text, setText] = React.useState('');
  const [thinking, setThinking] = React.useState(false);
  const [recording, setRecording] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const scrollRef = React.useRef<ScrollView>(null);

  // Live view of my orders. This drives two things: a card already in the
  // thread updates when an admin prices it, and — on a cold start — the thread
  // is rebuilt from them, so closing the app does not lose the conversation.
  const restored = React.useRef(false);

  React.useEffect(() => {
    if (!user) return;
    return subscribeMyOrders(user.uid, (list) => {
      setOrders(Object.fromEntries(list.map((o) => [o.id, o])));

      // Rebuild once, from the most recent orders, oldest first so the thread
      // reads in the order it happened.
      if (restored.current || list.length === 0) return;
      restored.current = true;

      const recent = list.slice(0, 6).reverse();
      setTurns((prev) => [
        ...prev,
        ...recent.flatMap((o): Turn[] => [
          {
            id: `st_${o.id}`,
            kind: 'status',
            tone: 'ok',
            text: `${o.source.kind === 'voice' ? 'Heard' : o.source.kind === 'photo' ? 'Read' : 'Noted'} ${o.items.length} items · #${o.code}`,
          },
          {
            id: `ord_${o.id}`,
            kind: 'order',
            orderId: o.id,
            // A settled order is history: read-only. Still `incoming` means
            // the customer may edit it — the Firestore rule allows `items`
            // writes only in that window, so the card has to stop offering
            // them at exactly the same point the rule stops permitting them.
            variant: isTerminal(o.status) || o.status !== 'incoming' ? 'template' : 'review',
          },
        ]),
      ]);
    });
  }, [user]);

  React.useEffect(() => {
    if (turns.length === 0 && profile) {
      setTurns([
        {
          id: 'greeting',
          kind: 'bot-text',
          text: `${COPY.greeting.en}, ${profile.name.split(' ').slice(-1)[0]}.`,
          textTa: COPY.chatHint.ta,
        },
      ]);
    }
  }, [profile, turns.length]);

  const push = React.useCallback((t: Turn) => {
    setTurns((prev) => [...prev, t]);
    requestAnimationFrame(() => scrollRef.current?.scrollToEnd({ animated: true }));
  }, []);

  // -------------------------------------------------------------------------

  const run = React.useCallback(
    async (args: {
      kind: 'photo' | 'voice' | 'text';
      capture?: Capture;
      text?: string;
      variant: 'template' | 'review';
    }) => {
      if (!user || !profile) return;
      setError(null);
      setThinking(true);

      const statusId = rid();
      push({ id: statusId, kind: 'status', text: COPY.reading.en, tone: 'working' });

      try {
        const locality = localityById(profile.localityId);
        const started = Date.now();

        const result = await extractOrder({
          kind: args.kind,
          base64: args.capture?.base64,
          mimeType: args.capture?.mimeType,
          text: args.text,
          localityName: locality?.name,
        }).catch(() => ({
          extraction: fallbackExtraction(args.text ?? ''),
          raw: '',
          latencyMs: Date.now() - started,
          model: 'fallback',
        }));

        // The upload is for the admin's benefit, not the model's — do not make
        // the customer wait on it.
        const uploadPromise = args.capture
          ? uploadCapture(user.uid, args.capture).catch(() => undefined)
          : Promise.resolve(undefined);

        const order = await createOrderFromExtraction({
          customer: profile,
          extraction: result.extraction,
          source: {
            kind: args.kind,
            ...(args.text ? { transcript: args.text } : {}),
            ...(result.extraction.transcript ? { transcript: result.extraction.transcript } : {}),
            ...(args.capture ? { mimeType: args.capture.mimeType } : {}),
          },
          ai: {
            model: result.model,
            latencyMs: result.latencyMs,
            raw: result.raw,
            minConfidence: Math.min(
              ...result.extraction.items.map((i) => i.confidence),
              1,
            ),
            parsedAt: Date.now(),
          },
        });

        void uploadPromise;

        setTurns((prev) =>
          prev.map((t) =>
            t.id === statusId
              ? {
                  id: statusId,
                  kind: 'status',
                  text: `${result.extraction.summary || 'Read your request'} · ${(
                    result.latencyMs / 1000
                  ).toFixed(1)}s`,
                  tone: 'ok',
                }
              : t,
          ),
        );

        push({ id: rid(), kind: 'order', orderId: order.id, variant: args.variant });
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch (e) {
        setTurns((prev) => prev.filter((t) => t.id !== statusId));
        setError((e as Error).message);
      } finally {
        setThinking(false);
      }
    },
    [user, profile, push],
  );

  async function onCamera() {
    try {
      const capture = await takePhoto();
      if (!capture) return;
      push({
        id: rid(),
        kind: 'user-photo',
        uri: capture.uri,
        label: `prescription.jpg · ${(capture.sizeBytes / 1_000_000).toFixed(1)} MB`,
      });
      // A photograph produces the REVIEW card, not a read-only summary.
      // OCR on a handwritten prescription gets names wrong, and the customer
      // is the only person who can fix that without a phone call.
      await run({ kind: 'photo', capture, variant: 'review' });
    } catch (e) {
      setError((e as Error).message);
    }
  }

  async function onMicDown() {
    try {
      await startRecording();
      setRecording(true);
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch (e) {
      setError((e as Error).message);
    }
  }

  async function onMicUp() {
    if (!recording) return;
    setRecording(false);
    const capture = await stopRecording();
    if (!capture || capture.durationMs < 700) {
      await cancelRecording();
      return;
    }
    push({ id: rid(), kind: 'user-voice', durationMs: capture.durationMs });
    // Voice is looser than a prescription — give people the editable list.
    await run({ kind: 'voice', capture, variant: 'review' });
  }

  async function onSend() {
    const body = text.trim();
    if (!body) return;
    setText('');
    push({ id: rid(), kind: 'user-text', text: body });
    await run({ kind: 'text', text: body, variant: 'review' });
  }

  /**
   * Confirming does not take money — it hands off to the payment screen, which
   * is where cash and UPI actually diverge. Charging from a chat bubble would
   * mean duplicating that whole flow inline.
   */
  function onConfirm(order: Order) {
    if (!user) return;
    push({
      id: rid(),
      kind: 'bot-text',
      text: `Confirmed. ${formatInr(order.pricing.totalPaise)} — choose how you would like to pay.`,
    });
    router.push(`/(customer)/pay/${order.id}`);
  }

  // -------------------------------------------------------------------------

  return (
    <Screen edges={['top']}>
      <Header />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
        className="flex-1"
      >
        <ScrollView
          ref={scrollRef}
          className="flex-1"
          contentContainerClassName="gap-4 px-4 py-4"
          keyboardShouldPersistTaps="handled"
          onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
        >
          {turns.map((turn) => {
            switch (turn.kind) {
              case 'bot-text':
                return (
                  <Animated.View key={turn.id} entering={FadeInUp.duration(220)} className="gap-1">
                    <T className="text-[15px] leading-[22px]">{turn.text}</T>
                    {turn.textTa ? <Ta className="text-[13px]">{turn.textTa}</Ta> : null}
                  </Animated.View>
                );

              case 'user-text':
                return (
                  <Animated.View
                    key={turn.id}
                    entering={FadeInUp.duration(220)}
                    className="items-end"
                  >
                    <View className="max-w-[80%] rounded-2xl rounded-br-md bg-primary px-3.5 py-2.5">
                      <T className="text-[14.5px] leading-5 text-primary-foreground">
                        {turn.text}
                      </T>
                    </View>
                  </Animated.View>
                );

              case 'user-photo':
                return (
                  <Animated.View
                    key={turn.id}
                    entering={FadeInUp.duration(220)}
                    className="items-end gap-1.5"
                  >
                    <View className="w-[150px] overflow-hidden rounded-card border border-border">
                      <Image
                        source={{ uri: turn.uri }}
                        style={{ width: 150, height: 132 }}
                        contentFit="cover"
                        transition={180}
                      />
                    </View>
                    <Num className="text-[10.5px] text-placeholder">{turn.label}</Num>
                  </Animated.View>
                );

              case 'user-voice':
                return (
                  <Animated.View
                    key={turn.id}
                    entering={FadeInUp.duration(220)}
                    className="items-end"
                  >
                    <View className="flex-row items-center gap-3 rounded-2xl rounded-br-md bg-primary px-3.5 py-3">
                      <Waveform />
                      <Num className="text-[11px] text-placeholder">
                        0:{String(Math.round(turn.durationMs / 1000)).padStart(2, '0')}
                      </Num>
                    </View>
                  </Animated.View>
                );

              case 'status':
                return (
                  <Animated.View
                    key={turn.id}
                    entering={FadeIn}
                    layout={Layout.springify()}
                    className="flex-row items-center gap-2"
                  >
                    {turn.tone === 'working' ? (
                      <PulseDot color="#A1A1AA" size={7} />
                    ) : (
                      <Check size={13} color="#16A34A" strokeWidth={3} />
                    )}
                    <Num className="text-[11px] text-muted-foreground">{turn.text}</Num>
                  </Animated.View>
                );

              case 'order': {
                const order = orders[turn.orderId];
                if (!order) return null;
                return (
                  <Animated.View key={turn.id} entering={FadeInUp.duration(260)}>
                    {turn.variant === 'template' ? (
                      <OrderTemplateCard
                        order={order}
                        onConfirm={() => onConfirm(order)}
                      />
                    ) : (
                      <OrderReviewCard
                        order={order}
                        onToggle={(itemId) => void toggleItem(order.id, itemId)}
                        onQuantity={(itemId, q) => void setQuantity(order.id, itemId, q)}
                        onEdit={(itemId, patch) => void editItem(order.id, itemId, patch)}
                        onAdd={(input) => void addItem(order.id, input)}
                        onRemove={(itemId) => void removeItem(order.id, itemId)}
                        onConfirm={() => onConfirm(order)}
                      />
                    )}
                    <Pressable
                      onPress={() => router.push(`/(customer)/order/${order.id}`)}
                      className="mt-2 h-9 items-center justify-center"
                    >
                      <T className="text-[12.5px] font-medium text-muted-foreground">
                        Track this order
                      </T>
                    </Pressable>
                  </Animated.View>
                );
              }
            }
          })}

          {error ? <ErrorNote message={error} /> : null}
        </ScrollView>

        {/* Bottom dock: camera, text, mic — the three ways in. */}
        <View className="gap-2.5 border-t border-muted px-4 pb-5 pt-2.5">
          {recording ? (
            <Animated.View
              entering={FadeIn}
              className="flex-row items-center gap-2.5 rounded-control bg-destructive-tint px-3 py-2"
            >
              <PulseDot color="#DC2626" size={8} />
              <T className="flex-1 text-[12.5px] font-medium text-destructive-fg">
                {COPY.listening.en}
              </T>
              <Ta className="text-[11px] text-destructive-fg">{COPY.recordingHint.ta}</Ta>
            </Animated.View>
          ) : (
            <View className="flex-row gap-2">
              <Chip label={COPY.pharmacy.en} />
              <Chip label={COPY.grocery.en} />
              <Chip label={COPY.concierge.en} />
            </View>
          )}

          <View className="flex-row items-center gap-2.5">
            <PressableScale
              to={0.93}
              haptic
              onPress={() => void onCamera()}
              disabled={thinking}
              accessibilityRole="button"
              accessibilityLabel="Photograph a prescription or list"
              className="size-[46px] items-center justify-center rounded-[12px] border border-border bg-background"
            >
              <Camera size={20} color="#3F3F46" strokeWidth={1.9} />
            </PressableScale>

            <View className="h-[46px] flex-1 justify-center rounded-[10px] border border-border bg-background px-3.5">
              <TextInput
                value={text}
                onChangeText={setText}
                onSubmitEditing={() => void onSend()}
                editable={!thinking}
                placeholder={COPY.typeOrPaste.en}
                placeholderTextColor="#A1A1AA"
                returnKeyType="send"
                className="font-sans text-[13.5px] text-foreground"
              />
            </View>

            <MicButton
              recording={recording}
              disabled={thinking}
              onDown={() => void onMicDown()}
              onUp={() => void onMicUp()}
            />
          </View>
        </View>
      </KeyboardAvoidingView>

      {/* Hidden badge import keeps the design-system surface obvious. */}
      <View className="hidden">
        <Badge label="DFC" />
      </View>
    </Screen>
  );
}
