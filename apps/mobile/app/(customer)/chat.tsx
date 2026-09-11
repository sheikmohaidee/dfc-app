/**
 * The customer app.
 *
 * Conversational thread with AI parser + Quick Service Hub + Locality Selector
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
import { Camera, Check, ChevronDown, ChevronRight, MapPin, Mic, User } from 'lucide-react-native';

import { COPY, formatInr, isTerminal, localityById, type Order } from '@dfc/core';

import { useAuth } from '@/providers/auth';
import { useCartsSummary } from '@/providers/cart';
import { mockLocationRepository } from '@/demo/repositories/location.repository';
import { DEMO_LOCALITIES } from '@/demo/data/localities';
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
import { DFCBottomNav } from '@/ui/bottom-nav';
import { ServiceHub } from '@/ui/service-hub';

type Turn =
  | { id: string; kind: 'bot-text'; text: string; textTa?: string }
  | { id: string; kind: 'user-photo'; uri: string; label: string }
  | { id: string; kind: 'user-voice'; durationMs: number; transcript?: string }
  | { id: string; kind: 'user-text'; text: string }
  | { id: string; kind: 'order'; orderId: string; variant: 'template' | 'review' }
  | { id: string; kind: 'status'; text: string; tone: 'working' | 'ok' };

const rid = () => Math.random().toString(36).slice(2, 10);

// ---------------------------------------------------------------------------

function Header({ onOpenLocality }: { onOpenLocality: () => void }) {
  const router = useRouter();
  const currentLocality = mockLocationRepository.getCurrentLocality();

  return (
    <View className="flex-row items-center gap-2.5 border-b border-muted bg-background px-4 pb-3 pt-3.5">
      <View className="size-[30px] items-center justify-center rounded-[9px] bg-primary">
        <T className="text-[13px] font-semibold tracking-tight text-primary-foreground">D</T>
      </View>
      <View className="flex-1">
        <T className="text-[14.5px] font-semibold tracking-tight">DFC</T>
        <Ta className="text-[10.5px]">{COPY.appName.ta}</Ta>
      </View>
      <Pressable
        onPress={onOpenLocality}
        className="flex-row items-center gap-1.5 rounded-full border border-border bg-surface px-2.5 py-1.5"
      >
        <MapPin size={13} color="#16A34A" strokeWidth={2.5} />
        <T className="text-xs font-medium text-body-strong">{currentLocality.name}</T>
        <ChevronDown size={12} color="#A1A1AA" strokeWidth={2.2} />
      </Pressable>

      <Pressable
        onPress={() => router.push('/(customer)/account' as any)}
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
        <AnimatedBar key={i} baseHeight={h} active={active} delay={i * 60} />
      ))}
    </View>
  );
}

function AnimatedBar({
  baseHeight,
  active,
  delay,
}: {
  baseHeight: number;
  active?: boolean;
  delay: number;
}) {
  const scale = useSharedValue(1);

  React.useEffect(() => {
    if (!active) {
      scale.value = 1;
      return;
    }
    const timeout = setTimeout(() => {
      scale.value = withRepeat(withTiming(1.6, { duration: 320 }), -1, true);
    }, delay);
    return () => clearTimeout(timeout);
  }, [active, delay, scale]);

  const style = useAnimatedStyle(() => ({
    height: baseHeight * scale.value,
  }));

  return (
    <Animated.View
      style={style}
      className="w-[2.5px] rounded-full bg-primary-foreground/80"
    />
  );
}

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

  const style = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={style}>
      <Pressable
        onPressIn={() => {
          if (disabled) return;
          scale.value = withSpring(1.12);
          onDown();
        }}
        onPressOut={() => {
          scale.value = withSpring(1);
          onUp();
        }}
        disabled={disabled}
        accessibilityRole="button"
        accessibilityLabel="Hold to speak"
        className={`size-[46px] items-center justify-center rounded-[12px] ${
          recording ? 'bg-destructive' : 'bg-primary'
        }`}
      >
        <Mic size={22} color="#FFFFFF" strokeWidth={2.2} />
      </Pressable>
    </Animated.View>
  );
}

// ---------------------------------------------------------------------------

export default function Chat() {
  const router = useRouter();
  const { user, profile, updateProfile } = useAuth();
  const summary = useCartsSummary();

  const [turns, setTurns] = React.useState<Turn[]>([]);
  const [orders, setOrders] = React.useState<Record<string, Order>>({});
  const [text, setText] = React.useState('');
  const [thinking, setThinking] = React.useState(false);
  const [recording, setRecording] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [showLocalityModal, setShowLocalityModal] = React.useState(false);

  const scrollRef = React.useRef<ScrollView>(null);

  // Completed and cancelled orders drop out of this count automatically.
  const activeOrderCount = React.useMemo(
    () => Object.values(orders).filter((o) => !isTerminal(o.status)).length,
    [orders],
  );

  const restored = React.useRef(false);

  React.useEffect(() => {
    if (!user) return;
    return subscribeMyOrders(user.uid, (list) => {
      setOrders(Object.fromEntries(list.map((o) => [o.id, o])));

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
    await run({ kind: 'voice', capture, variant: 'review' });
  }

  async function onSend() {
    const body = text.trim();
    if (!body) return;
    setText('');
    push({ id: rid(), kind: 'user-text', text: body });
    await run({ kind: 'text', text: body, variant: 'review' });
  }

  function onConfirm(order: Order) {
    if (!user) return;
    push({
      id: rid(),
      kind: 'bot-text',
      text: `Confirmed. ${formatInr(order.pricing.totalPaise)} — choose how you would like to pay.`,
    });
    router.push(`/(customer)/pay/${order.id}` as any);
  }

  // -------------------------------------------------------------------------

  return (
    <Screen edges={['top']}>
      <Header onOpenLocality={() => setShowLocalityModal(true)} />
      <ServiceHub />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
        className="flex-1"
      >
        <ScrollView
          ref={scrollRef}
          className="flex-1"
          contentContainerClassName="gap-4 px-4 py-4 pb-20"
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
                    <View className="max-w-[80%] rounded-[18px] rounded-br-[4px] bg-primary px-4 py-2.5">
                      <T className="text-[14.5px] text-primary-foreground">{turn.text}</T>
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
                    <View className="overflow-hidden rounded-[18px] rounded-br-[4px] border border-border bg-background">
                      <Image
                        source={{ uri: turn.uri }}
                        contentFit="cover"
                        className="h-[180px] w-[220px]"
                      />
                      <View className="px-3 py-1.5">
                        <T className="font-mono text-[11px] text-muted-foreground">
                          {turn.label}
                        </T>
                      </View>
                    </View>
                  </Animated.View>
                );

              case 'user-voice':
                return (
                  <Animated.View
                    key={turn.id}
                    entering={FadeInUp.duration(220)}
                    className="items-end gap-1"
                  >
                    <View className="flex-row items-center gap-3 rounded-[18px] rounded-br-[4px] bg-foreground px-4 py-2.5">
                      <Waveform active />
                      <Num className="text-[12px] font-medium text-background">
                        {(turn.durationMs / 1000).toFixed(1)}s
                      </Num>
                    </View>
                    {turn.transcript ? (
                      <T className="max-w-[80%] text-right text-[12px] italic text-muted-foreground">
                        “{turn.transcript}”
                      </T>
                    ) : null}
                  </Animated.View>
                );

              case 'status':
                return (
                  <Animated.View
                    key={turn.id}
                    entering={FadeIn.duration(180)}
                    className="flex-row items-center gap-2"
                  >
                    {turn.tone === 'working' ? (
                      <PulseDot color="#2563EB" size={7} />
                    ) : (
                      <View className="size-4 items-center justify-center rounded-full bg-grocery-tint">
                        <Check size={11} color="#15803D" strokeWidth={3} />
                      </View>
                    )}
                    <T className="font-mono text-[12px] text-muted-foreground">{turn.text}</T>
                  </Animated.View>
                );

              case 'order': {
                const o = orders[turn.orderId];
                if (!o) return null;
                return (
                  <View key={turn.id} className="gap-2">
                    {turn.variant === 'review' ? (
                      <OrderReviewCard
                        order={o}
                        onToggle={(itemId) => void toggleItem(o.id, itemId)}
                        onQuantity={(itemId, q) => void setQuantity(o.id, itemId, q)}
                        onEdit={(itemId, patch) => void editItem(o.id, itemId, patch)}
                        onAdd={(input) => void addItem(o.id, input)}
                        onRemove={(itemId) => void removeItem(o.id, itemId)}
                        onConfirm={() => onConfirm(o)}
                      />
                    ) : (
                      <OrderTemplateCard
                        order={o}
                        onConfirm={() => onConfirm(o)}
                      />
                    )}
                    <Pressable
                      onPress={() => router.push(`/(customer)/order/${o.id}` as any)}
                      className="items-center py-1"
                    >
                      <T className="text-[12px] font-semibold text-primary">Track this order →</T>
                    </Pressable>
                  </View>
                );
              }
            }
          })}

          {error ? <ErrorNote message={error} /> : null}
        </ScrollView>

        {/* Current order area: Active Orders tag + floating cart indicator */}
        {activeOrderCount > 0 ? (
          <View className="px-4 pb-2">
            <PressableScale
              to={0.96}
              onPress={() => router.push('/(customer)/active-orders' as any)}
              className="flex-row items-center justify-between rounded-xl border border-border bg-background px-4 py-2.5 shadow-md"
            >
              <View className="flex-row items-center gap-2">
                <PulseDot color="#2563EB" size={8} />
                <T className="text-[12.5px] font-bold text-foreground">
                  ACTIVE ORDERS ({activeOrderCount})
                </T>
              </View>
              <View className="flex-row items-center gap-1.5">
                <T className="text-[11px] font-medium text-muted-foreground">Tap to view</T>
                <ChevronRight size={14} color="#A1A1AA" strokeWidth={2.4} />
              </View>
            </PressableScale>
          </View>
        ) : null}

        {/* Floating Cart Indicator */}
        {summary.itemCount > 0 ? (
          <View className="px-4 pb-2">
            <PressableScale
              to={0.96}
              onPress={() =>
                router.push(
                  `/(customer)/cart?service=${summary.serviceWithItems ?? 'food'}` as any,
                )
              }
              className="flex-row items-center justify-between rounded-xl bg-primary px-4 py-2.5 shadow-md"
            >
              <T className="text-[12.5px] font-bold text-primary-foreground">
                🛒 {summary.itemCount} {summary.itemCount === 1 ? 'ITEM' : 'ITEMS'} IN CART
              </T>
              <View className="flex-row items-center gap-2">
                <Num className="text-[14px] font-bold text-primary-foreground">{formatInr(summary.totalPaise)}</Num>
                <T className="text-[11px] font-bold text-white/90">VIEW →</T>
              </View>
            </PressableScale>
          </View>
        ) : null}

        {/* Bottom dock: camera, text, mic */}
        <View className="gap-2.5 border-t border-muted bg-background px-4 pb-5 pt-2.5">
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
              <Pressable onPress={() => router.push('/(customer)/medicine' as any)}>
                <Chip label={COPY.pharmacy.en} />
              </Pressable>
              <Pressable onPress={() => router.push('/(customer)/grocery' as any)}>
                <Chip label={COPY.grocery.en} />
              </Pressable>
              <Pressable onPress={() => router.push('/(customer)/genie' as any)}>
                <Chip label={COPY.concierge.en} />
              </Pressable>
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

      {/* Locality Selector Modal */}
      {showLocalityModal ? (
        <View className="absolute inset-0 z-50 justify-end bg-black/50">
          <View className="max-h-[75%] gap-3 rounded-t-[24px] bg-background p-5">
            <View className="flex-row items-center justify-between border-b border-muted pb-3">
              <View>
                <T className="text-[16px] font-bold text-foreground">Select Madurai Locality</T>
                <T className="text-[11.5px] text-muted-foreground">Sets delivery hub & restaurant filtering</T>
              </View>
              <Pressable onPress={() => setShowLocalityModal(false)} className="p-1">
                <T className="text-[13px] font-bold text-primary">Done</T>
              </Pressable>
            </View>

            <ScrollView className="gap-2">
              {DEMO_LOCALITIES.map((loc) => {
                const currentLocId = mockLocationRepository.getCurrentLocality().id;
                const isSelected = currentLocId === loc.id;
                return (
                  <Pressable
                    key={loc.id}
                    onPress={() => {
                      void mockLocationRepository.setLocality(loc.id);
                      void updateProfile({ localityId: loc.id });
                      setShowLocalityModal(false);
                    }}
                    className={`flex-row items-center justify-between rounded-xl border p-3 ${
                      isSelected ? 'border-primary bg-primary-tint' : 'border-border bg-surface'
                    }`}
                  >
                    <View className="flex-1">
                      <View className="flex-row items-center gap-2">
                        <T className="text-[14px] font-bold text-foreground">{loc.name}</T>
                        <Ta className="text-[11px] text-muted-foreground">{loc.nameTa}</Ta>
                      </View>
                      <T className="text-[11px] text-muted-foreground">{loc.tagline}</T>
                    </View>
                    {isSelected ? <Check size={16} color="#2563EB" strokeWidth={3} /> : null}
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        </View>
      ) : null}

      <View className="hidden">
        <Badge label="DFC" />
      </View>

      <DFCBottomNav activeTab="home" />
    </Screen>
  );
}
