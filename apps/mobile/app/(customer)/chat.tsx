/**
 * Stitch 01 — Flagship Customer Home Screen
 * Replaces legacy burgundy chat with modern Stitch dark floating ecosystem:
 * - Dynamic greeting & 22-min dispatch pill
 * - Active order live tracking card with progress indicator
 * - Spatial search bar with mic & filter triggers
 * - 3×2 Core Service Matrix (Food, Grocery, Print, Genie, Pickup/Drop, Buy/Deliver)
 * - Multimodal Shopping List spotlight card
 * - "Craving Something Delicious?" restaurant carousel
 * - "Daily Essentials" grocery carousel
 * - AI conversational ordering thread (Photo/Voice/Text/AR) intact
 * - StitchHeader & StitchNav (5-tab floating pill)
 */

import * as React from 'react';
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  TextInput,
  View,
  Text,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import * as Haptics from 'expo-haptics';
import Animated, {
  FadeIn,
  FadeInUp,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import {
  Camera,
  Check,
  ChevronRight,
  Clock,
  Flame,
  ListChecks,
  MapPin,
  Mic,
  Navigation,
  Package,
  Printer,
  Search,
  ShoppingBag,
  SlidersHorizontal,
  Sparkles,
  Star,
  Truck,
  Utensils,
  ShoppingBag as BagIcon,
  Zap,
} from 'lucide-react-native';

import { COPY, formatInr, isTerminal, localityById, predictContextualCart, type Order } from '@dfc/core';
import { ArDishModal } from '@/ui/ar-dish-modal';
import { usePlatformStatus } from '@/hooks/usePlatformStatus';
import { SleepModeBanner, RainSurgeBanner } from '@/ui/sleep-mode-sheet';

import { useAuth } from '@/providers/auth';
import { useCart, useCartsSummary } from '@/providers/cart';
import { mockLocationRepository } from '@/demo/repositories/location.repository';
import { mockRestaurantRepository } from '@/demo/repositories/restaurant.repository';
import { mockGroceryRepository } from '@/demo/repositories/grocery.repository';
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
import { Badge, Chip, ErrorNote, FloatingCard, GlowBadge, Num, Screen, SpatialSearchBar, T, Ta } from '@/ui';
import { DFCPressable } from '@/ui/animated';
import { SectionHeader, StatusBadge } from '@/ui/cards';
import { PressableScale, PulseDot } from '@/ui/glass';
import { OrderTemplateCard } from '@/ui/order-card';
import { OrderReviewCard } from '@/ui/review-card';
import { StitchHeader } from '@/ui/stitch-header';
import { StitchNav } from '@/ui/stitch-nav';

type Turn =
  | { id: string; kind: 'bot-text'; text: string; textTa?: string }
  | { id: string; kind: 'user-photo'; uri: string; label: string }
  | { id: string; kind: 'user-voice'; durationMs: number; transcript?: string }
  | { id: string; kind: 'user-text'; text: string }
  | { id: string; kind: 'order'; orderId: string; variant: 'template' | 'review' }
  | { id: string; kind: 'status'; text: string; tone: 'working' | 'ok' };

const rid = () => Math.random().toString(36).slice(2, 10);

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
      className="w-[2.5px] rounded-full bg-primary-container"
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
        style={{
          width: 44,
          height: 44,
          borderRadius: 14,
          backgroundColor: recording ? '#93000A' : '#6A5ACD',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Mic size={20} color="#FFFFFF" strokeWidth={2.2} />
      </Pressable>
    </Animated.View>
  );
}

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, profile, updateProfile } = useAuth();
  const summary = useCartsSummary();
  const groceryCart = useCart('grocery');

  const [keyboardOpen, setKeyboardOpen] = React.useState(false);

  React.useEffect(() => {
    const showSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      () => setKeyboardOpen(true),
    );
    const hideSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => setKeyboardOpen(false),
    );
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const navClearance = Math.max(insets.bottom, Platform.OS === 'ios' ? 16 : 10) + 64;

  const [turns, setTurns] = React.useState<Turn[]>([]);
  const [orders, setOrders] = React.useState<Record<string, Order>>({});
  const [text, setText] = React.useState('');
  const [thinking, setThinking] = React.useState(false);
  const [recording, setRecording] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [showLocalityModal, setShowLocalityModal] = React.useState(false);
  const [arModalVisible, setArModalVisible] = React.useState(false);
  const [arDishKey, setArDishKey] = React.useState('bun-parotta');
  const [dietaryFilter, setDietaryFilter] = React.useState<'all' | 'veg'>('all');
  const platform = usePlatformStatus();
  const [sleepBannerDismissed, setSleepBannerDismissed] = React.useState(false);
  const [rainBannerDismissed, setRainBannerDismissed] = React.useState(false);

  const scrollRef = React.useRef<ScrollView>(null);

  const activeOrders = React.useMemo(
    () => Object.values(orders).filter((o) => !isTerminal(o.status)),
    [orders],
  );
  const activeOrderCount = activeOrders.length;
  const latestActiveOrder = activeOrders[0];

  const currentLocality = mockLocationRepository.getCurrentLocality();
  const restaurants = React.useMemo(
    () => mockRestaurantRepository.getForCurrentLocality(dietaryFilter === 'veg'),
    [dietaryFilter, currentLocality],
  );
  const groceryItems = React.useMemo(
    () => mockGroceryRepository.getAllProducts().slice(0, 8),
    [],
  );

  const predictiveCard = React.useMemo(
    () => predictContextualCart(Object.values(orders), profile?.localityId ?? 'kk-nagar'),
    [orders, profile?.localityId],
  );

  const restored = React.useRef(false);

  React.useEffect(() => {
    if (!user) return;
    return subscribeMyOrders(user.uid, (list) => {
      setOrders(Object.fromEntries(list.map((o) => [o.id, o])));

      if (restored.current || list.length === 0) return;
      restored.current = true;

      const recent = list.slice(0, 4).reverse();
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

        const newOrder = await createOrderFromExtraction({
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

        push({ id: rid(), kind: 'order', orderId: newOrder.id, variant: args.variant });
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
        label: `photo.jpg · ${(capture.sizeBytes / 1_000_000).toFixed(1)} MB`,
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
      text: `Confirmed #${order.code}. ${formatInr(order.pricing.totalPaise)} — select payment method.`,
    });
    router.push(`/(customer)/pay/${order.id}` as any);
  }

  const getTimeGreeting = () => {
    const hr = new Date().getHours();
    if (hr < 12) return 'Good Morning';
    if (hr < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  const customerName = profile?.name ? profile.name.split(' ')[0] : 'Karthik';

  return (
    <Screen edges={['top']} className="bg-surface-container-lowest">
      <StitchHeader
        title={currentLocality.name}
        subtitle={`${currentLocality.nameTa} · Madurai`}
        onLocationPress={() => setShowLocalityModal(true)}
        showNotifications
        showCart
      />

      {/* Platform Sleep & Monsoon Banners */}
      {platform.status === 'sleep' && !sleepBannerDismissed ? (
        <SleepModeBanner
          nextOpenTime={platform.nextOpenTime}
          onPreOrderPress={() => router.push('/subscriptions' as never)}
          onDismiss={() => setSleepBannerDismissed(true)}
        />
      ) : null}

      {platform.rainSurge.active && !rainBannerDismissed ? (
        <RainSurgeBanner
          bonusAmount={`₹${Math.round(platform.rainSurge.riderSafetyBonusPaise / 100)}`}
          multiplier={`${platform.rainSurge.multiplier}x`}
          onDismiss={() => setRainBannerDismissed(true)}
        />
      ) : null}

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
        className="flex-1"
      >
        <ScrollView
          ref={scrollRef}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 120 }}
          keyboardShouldPersistTaps="handled"
        >
          {/* Greeting Section */}
          <View className="px-4 pt-4 pb-2">
            <View className="flex-row items-center justify-between">
              <View>
                <Text className="text-xs font-semibold text-primary uppercase tracking-wider">
                  Vanakkam · {getTimeGreeting()}
                </Text>
                <Text className="text-2xl font-extrabold text-on-surface tracking-tight">
                  {customerName}
                </Text>
              </View>

              <View
                style={{
                  backgroundColor: 'rgba(106, 90, 205, 0.16)',
                  borderColor: 'rgba(200, 191, 255, 0.25)',
                  borderWidth: 1,
                  borderRadius: 9999,
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                }}
                className="flex-row items-center gap-1.5"
              >
                <Zap size={14} color="#C8BFFF" />
                <Text style={{ fontSize: 11, fontWeight: '700', color: '#C8BFFF' }}>
                  22 Mins Dispatch
                </Text>
              </View>
            </View>
          </View>

          {/* Active Order Live Pill (if any) */}
          {latestActiveOrder ? (
            <View className="px-4 pt-2 pb-2">
              <DFCPressable
                onPress={() => router.push(`/(customer)/order/${latestActiveOrder.id}` as any)}
                scaleTo={0.98}
                style={{
                  backgroundColor: '#1C1B1D',
                  borderColor: '#2A2A2C',
                  borderWidth: 1,
                  borderRadius: 20,
                  padding: 14,
                  shadowColor: '#000000',
                  shadowOpacity: 0.25,
                  shadowRadius: 8,
                  elevation: 4,
                }}
              >
                <View className="flex-row items-center justify-between mb-2">
                  <View className="flex-row items-center gap-2">
                    <PulseDot color="#7BD0FF" size={8} />
                    <Text className="text-xs font-bold text-on-surface uppercase tracking-wider">
                      Live Order #{latestActiveOrder.code}
                    </Text>
                  </View>
                  <GlowBadge
                    label={latestActiveOrder.status.toUpperCase()}
                    tone={latestActiveOrder.status === 'out_for_delivery' ? 'success' : 'primary'}
                  />
                </View>

                <Text className="text-sm font-semibold text-on-surface mb-2">
                  {latestActiveOrder.storeName || 'DFC Express Delivery'}
                </Text>

                {/* Segmented Progress Bar */}
                <View className="flex-row items-center gap-1 mb-2.5">
                  <View className="h-1 flex-1 rounded-full bg-primary" />
                  <View
                    className={`h-1 flex-1 rounded-full ${
                      latestActiveOrder.status !== 'incoming' ? 'bg-primary' : 'bg-surface-container-highest'
                    }`}
                  />
                  <View
                    className={`h-1 flex-1 rounded-full ${
                      latestActiveOrder.status === 'out_for_delivery' || latestActiveOrder.status === 'delivered'
                        ? 'bg-primary'
                        : 'bg-surface-container-highest'
                    }`}
                  />
                </View>

                <View className="flex-row items-center justify-between">
                  <Text className="text-xs text-on-surface-variant font-medium">
                    {latestActiveOrder.items.length} items · {formatInr(latestActiveOrder.pricing.totalPaise)}
                  </Text>
                  <View className="flex-row items-center gap-1">
                    <Text className="text-xs font-bold text-primary">Live Tracking</Text>
                    <ChevronRight size={13} color="#C8BFFF" strokeWidth={2.5} />
                  </View>
                </View>
              </DFCPressable>
            </View>
          ) : null}

          {/* Spatial Search Bar */}
          <View className="px-4 py-2">
            <SpatialSearchBar
              placeholder="Search dishes, groceries, errands..."
              onPress={() => router.push('/(customer)/search')}
              onPressMic={() => void onMicDown()}
              onPressFilter={() => setDietaryFilter((prev) => (prev === 'veg' ? 'all' : 'veg'))}
              editable={false}
            />
          </View>

          {/* 3×2 Core Service Matrix */}
          <View className="px-4 py-2">
            <View className="flex-row items-center justify-between mb-3">
              <Text className="text-sm font-bold text-on-surface uppercase tracking-wider">
                Services Ecosystem
              </Text>
              <Pressable onPress={() => router.push('/(customer)/services' as any)}>
                <Text className="text-xs font-semibold text-primary">View All (6) →</Text>
              </Pressable>
            </View>

            <View className="flex-row flex-wrap justify-between gap-y-3">
              {[
                {
                  id: 'food',
                  title: 'Food & Mess',
                  ta: 'உணவு',
                  badge: 'HOT',
                  icon: <Utensils size={20} color="#FFB59C" />,
                  bg: 'rgba(142, 44, 1, 0.25)',
                  border: 'rgba(255, 181, 156, 0.25)',
                  route: '/(customer)/food',
                },
                {
                  id: 'grocery',
                  title: 'Supermarket',
                  ta: 'மளிகை',
                  badge: '15m',
                  icon: <ShoppingBag size={20} color="#6EE7B7" />,
                  bg: 'rgba(6, 78, 59, 0.25)',
                  border: 'rgba(110, 231, 183, 0.25)',
                  route: '/(customer)/grocery',
                },
                {
                  id: 'print',
                  title: 'Print & Xerox',
                  ta: 'பிரிண்டிங்',
                  badge: 'DOCS',
                  icon: <Printer size={20} color="#7BD0FF" />,
                  bg: 'rgba(0, 115, 156, 0.25)',
                  border: 'rgba(123, 208, 255, 0.25)',
                  route: '/(customer)/print',
                },
                {
                  id: 'genie',
                  title: 'Genie Runner',
                  ta: 'ஜீனி',
                  badge: 'TASK',
                  icon: <Package size={20} color="#C8BFFF" />,
                  bg: 'rgba(106, 90, 205, 0.25)',
                  border: 'rgba(200, 191, 255, 0.25)',
                  route: '/(customer)/genie',
                },
                {
                  id: 'pickup_drop',
                  title: 'Pickup & Drop',
                  ta: 'பிக்அப்',
                  badge: 'POINT',
                  icon: <Truck size={20} color="#FCD34D" />,
                  bg: 'rgba(217, 119, 6, 0.2)',
                  border: 'rgba(253, 230, 138, 0.25)',
                  route: '/(customer)/pickup-drop',
                },
                {
                  id: 'buy_deliver',
                  title: 'Buy & Deliver',
                  ta: 'வாங்கி தருதல்',
                  badge: 'STORE',
                  icon: <BagIcon size={20} color="#7BD0FF" />,
                  bg: 'rgba(0, 115, 156, 0.25)',
                  border: 'rgba(123, 208, 255, 0.25)',
                  route: '/(customer)/buy-deliver',
                },
              ].map((item) => (
                <DFCPressable
                  key={item.id}
                  scaleTo={0.94}
                  onPress={() => {
                    void Haptics.selectionAsync();
                    router.push(item.route as any);
                  }}
                  style={{
                    width: '31.5%',
                    backgroundColor: '#1C1B1D',
                    borderColor: '#2A2A2C',
                    borderWidth: 1,
                    borderRadius: 18,
                    padding: 12,
                    alignItems: 'center',
                    shadowColor: '#000000',
                    shadowOpacity: 0.15,
                    shadowRadius: 5,
                    shadowOffset: { width: 0, height: 2 },
                    elevation: 2,
                  }}
                >
                  <View
                    style={{
                      width: 42,
                      height: 42,
                      borderRadius: 14,
                      backgroundColor: item.bg,
                      borderColor: item.border,
                      borderWidth: 1,
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginBottom: 8,
                    }}
                  >
                    {item.icon}
                  </View>
                  <Text
                    numberOfLines={1}
                    className="text-xs font-bold text-on-surface text-center"
                  >
                    {item.title}
                  </Text>
                  <Text
                    numberOfLines={1}
                    className="text-[10px] text-on-surface-variant font-tamil text-center"
                  >
                    {item.ta}
                  </Text>
                </DFCPressable>
              ))}
            </View>
          </View>

          {/* Smart Shopping List Spotlight Card */}
          <View className="px-4 py-2">
            <FloatingCard
              glow
              onPress={() => router.push('/(customer)/shopping-list' as any)}
              className="p-4 bg-surface-container-low border-primary/30"
            >
              <View className="flex-row items-center justify-between mb-2">
                <View className="flex-row items-center gap-1.5">
                  <Sparkles size={16} color="#C8BFFF" />
                  <Text className="text-xs font-bold text-primary tracking-wider uppercase">
                    AI Multimodal Scanner
                  </Text>
                </View>
                <GlowBadge label="NEW" tone="primary" />
              </View>

              <Text className="text-lg font-bold text-on-surface mb-1">
                Smart Shopping List
              </Text>
              <Text className="text-xs text-on-surface-variant leading-5 mb-3">
                Photograph handwritten paper lists or voice-dictate items. Our AI matches products and builds your cart instantly.
              </Text>

              <View className="flex-row items-center justify-between pt-2 border-t border-surface-container-highest">
                <View className="flex-row items-center gap-2">
                  <ListChecks size={14} color="#928F9E" />
                  <Text className="text-xs text-on-surface-variant font-medium">
                    OCR + Voice + Template Matching
                  </Text>
                </View>
                <View className="flex-row items-center gap-1">
                  <Text className="text-xs font-bold text-primary">Open Scanner</Text>
                  <ChevronRight size={14} color="#C8BFFF" strokeWidth={2.5} />
                </View>
              </View>
            </FloatingCard>
          </View>

          {/* "Craving Something Delicious?" Restaurant Carousel */}
          <View className="pt-4 pb-2">
            <View className="flex-row items-center justify-between px-4 mb-3">
              <View>
                <Text className="text-base font-bold text-on-surface">
                  Craving Something Delicious?
                </Text>
                <Text className="text-xs text-on-surface-variant">
                  Top-rated kitchens in {currentLocality.name}
                </Text>
              </View>
              <Pressable onPress={() => router.push('/(customer)/food')}>
                <Text className="text-xs font-semibold text-primary">See All →</Text>
              </Pressable>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 16, gap: 12 }}
            >
              {restaurants.slice(0, 6).map((res) => (
                <DFCPressable
                  key={res.id}
                  scaleTo={0.96}
                  onPress={() => router.push(`/(customer)/food/restaurant/${res.id}` as any)}
                  style={{
                    width: 220,
                    backgroundColor: '#1C1B1D',
                    borderColor: '#2A2A2C',
                    borderWidth: 1,
                    borderRadius: 18,
                    overflow: 'hidden',
                    shadowColor: '#000000',
                    shadowOpacity: 0.2,
                    shadowRadius: 6,
                    shadowOffset: { width: 0, height: 2 },
                    elevation: 3,
                  }}
                >
                  <Image
                    source={{ uri: (res as any).imageUrl || 'https://images.unsplash.com/photo-1589302168068-964664d93dc0?w=600&q=80' }}
                    contentFit="cover"
                    style={{ width: '100%', height: 115 }}
                  />
                  <View className="p-3">
                    <View className="flex-row items-center justify-between mb-1">
                      <Text
                        numberOfLines={1}
                        className="text-sm font-bold text-on-surface flex-1 mr-2"
                      >
                        {res.name}
                      </Text>
                      <View className="flex-row items-center gap-0.5 bg-secondary-container/30 px-1.5 py-0.5 rounded-md">
                        <Star size={11} color="#FFB59C" fill="#FFB59C" />
                        <Text style={{ fontSize: 11, fontWeight: '700', color: '#FFB59C' }}>
                          {res.rating}
                        </Text>
                      </View>
                    </View>

                    <Text numberOfLines={1} className="text-xs text-on-surface-variant mb-2">
                      {res.cuisines.join(' · ')}
                    </Text>

                    <View className="flex-row items-center justify-between pt-2 border-t border-surface-container-highest">
                      <View className="flex-row items-center gap-1">
                        <Clock size={12} color="#928F9E" />
                        <Text className="text-[11px] text-on-surface-variant">
                          {res.avgPrepMinutes}-{res.avgPrepMinutes + 15}m
                        </Text>
                      </View>
                      <Text className="text-[11px] font-semibold text-primary">
                        {res.distanceKm.toFixed(1)} km
                      </Text>
                    </View>
                  </View>
                </DFCPressable>
              ))}
            </ScrollView>
          </View>

          {/* "Daily Essentials" Grocery Carousel */}
          <View className="pt-3 pb-2">
            <View className="flex-row items-center justify-between px-4 mb-3">
              <View>
                <Text className="text-base font-bold text-on-surface">
                  Daily Essentials
                </Text>
                <Text className="text-xs text-on-surface-variant">
                  Dispatched from local partner hubs
                </Text>
              </View>
              <Pressable onPress={() => router.push('/(customer)/grocery')}>
                <Text className="text-xs font-semibold text-primary">Supermarket →</Text>
              </Pressable>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 16, gap: 10 }}
            >
              {groceryItems.map((prod) => (
                <DFCPressable
                  key={prod.id}
                  scaleTo={0.96}
                  onPress={() => router.push('/(customer)/grocery')}
                  style={{
                    width: 140,
                    backgroundColor: '#1C1B1D',
                    borderColor: '#2A2A2C',
                    borderWidth: 1,
                    borderRadius: 16,
                    padding: 10,
                    shadowColor: '#000000',
                    shadowOpacity: 0.15,
                    shadowRadius: 5,
                    shadowOffset: { width: 0, height: 2 },
                    elevation: 2,
                  }}
                >
                  <Image
                    source={{ uri: (prod as any).imageUrl || 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=400&q=80' }}
                    contentFit="cover"
                    style={{ width: '100%', height: 80, borderRadius: 10, marginBottom: 8 }}
                  />
                  <Text
                    numberOfLines={1}
                    className="text-xs font-bold text-on-surface mb-0.5"
                  >
                    {prod.name}
                  </Text>
                  <Text className="text-[10px] text-on-surface-variant mb-2">
                    {prod.unit}
                  </Text>
                  <View className="flex-row items-center justify-between mt-auto">
                    <Text className="text-xs font-bold font-mono text-on-surface">
                      {formatInr(prod.sellPaise)}
                    </Text>
                    <DFCPressable
                      scaleTo={0.88}
                      onPress={async () => {
                        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        await groceryCart.addItem({
                          id: prod.id,
                          sourceId: prod.storeId,
                          sourceName: prod.storeName,
                          sourceCategory: 'grocery',
                          localityId: 'central-madurai',
                          name: prod.name,
                          unit: prod.unit,
                          pricePaise: prod.sellPaise,
                          quantity: 1,
                        });
                      }}
                      style={{
                        backgroundColor: '#6A5ACD',
                        paddingHorizontal: 8,
                        paddingVertical: 4,
                        borderRadius: 8,
                      }}
                    >
                      <Text style={{ fontSize: 11, fontWeight: '800', color: '#FFFFFF' }}>
                        +ADD
                      </Text>
                    </DFCPressable>
                  </View>
                </DFCPressable>
              ))}
            </ScrollView>
          </View>

          {/* Predictive Contextual Reorder (if applicable) */}
          <View className="px-4 py-2">
            <FloatingCard className="p-3.5 bg-surface-container-low border-primary/20">
              <View className="flex-row items-center justify-between mb-1">
                <Text className="text-[10px] font-extrabold tracking-wider text-primary uppercase">
                  {predictiveCard.kicker.en}
                </Text>
                <GlowBadge label="AI AFFINITY" tone="primary" />
              </View>
              <Text className="text-sm font-bold text-on-surface mb-0.5">
                {predictiveCard.title.en}
              </Text>
              <Text className="text-xs text-on-surface-variant font-tamil mb-2">
                {predictiveCard.title.ta}
              </Text>

              <View className="rounded-lg bg-surface-container p-2.5 gap-1 mb-2.5 border border-surface-container-highest">
                {predictiveCard.suggestedItems.map((item, idx) => (
                  <View key={idx} className="flex-row justify-between">
                    <Text className="text-xs text-on-surface-variant">
                      {item.quantity}× {item.name}
                    </Text>
                    <Text className="text-xs font-mono font-semibold text-on-surface">
                      {formatInr(item.pricePaise * item.quantity)}
                    </Text>
                  </View>
                ))}
              </View>

              <Pressable
                onPress={() => {
                  const query =
                    predictiveCard.suggestedItems
                      .map((i) => `${i.quantity} ${i.name}`)
                      .join(', ') + ` from ${predictiveCard.storeName}`;
                  void run({ kind: 'text', text: query, variant: 'review' });
                }}
                style={{
                  backgroundColor: '#6A5ACD',
                  paddingVertical: 9,
                  borderRadius: 12,
                  alignItems: 'center',
                  flexDirection: 'row',
                  justifyContent: 'center',
                  gap: 6,
                }}
              >
                <Sparkles size={14} color="#FFFFFF" />
                <Text style={{ fontSize: 12, fontWeight: '700', color: '#FFFFFF' }}>
                  1-Tap Reorder · {formatInr(predictiveCard.totalPaise)}
                </Text>
              </Pressable>
            </FloatingCard>
          </View>

          {/* AI Conversational Section & Active Turns */}
          {turns.length > 0 ? (
            <View className="px-4 pt-3 gap-3">
              <View className="flex-row items-center gap-2">
                <Sparkles size={16} color="#C8BFFF" />
                <Text className="text-xs font-bold text-primary uppercase tracking-wider">
                  AI Assistant & Active Requests
                </Text>
              </View>

              {turns.map((turn) => {
                switch (turn.kind) {
                  case 'bot-text':
                    return (
                      <Animated.View key={turn.id} entering={FadeInUp.duration(200)} className="gap-1">
                        <Text className="text-sm text-on-surface leading-5">{turn.text}</Text>
                        {turn.textTa ? (
                          <Text className="text-xs text-on-surface-variant font-tamil">{turn.textTa}</Text>
                        ) : null}
                      </Animated.View>
                    );

                  case 'user-text':
                    return (
                      <Animated.View
                        key={turn.id}
                        entering={FadeInUp.duration(200)}
                        className="items-end"
                      >
                        <View className="max-w-[85%] rounded-2xl rounded-br-sm bg-primary-container px-4 py-2.5">
                          <Text className="text-sm font-medium text-white">{turn.text}</Text>
                        </View>
                      </Animated.View>
                    );

                  case 'user-photo':
                    return (
                      <Animated.View
                        key={turn.id}
                        entering={FadeInUp.duration(200)}
                        className="items-end gap-1.5"
                      >
                        <View className="overflow-hidden rounded-2xl rounded-br-sm border border-surface-container-highest bg-surface-container">
                          <Image
                            source={{ uri: turn.uri }}
                            contentFit="cover"
                            style={{ height: 160, width: 200 }}
                          />
                          <View className="px-3 py-1.5">
                            <Text className="font-mono text-[11px] text-on-surface-variant">
                              {turn.label}
                            </Text>
                          </View>
                        </View>
                      </Animated.View>
                    );

                  case 'user-voice':
                    return (
                      <Animated.View
                        key={turn.id}
                        entering={FadeInUp.duration(200)}
                        className="items-end gap-1"
                      >
                        <View className="flex-row items-center gap-3 rounded-2xl rounded-br-sm bg-surface-container-high px-4 py-2.5">
                          <Waveform active />
                          <Num style={{ fontSize: 12, fontWeight: '600', color: '#E5E1E4' }}>
                            {(turn.durationMs / 1000).toFixed(1)}s
                          </Num>
                        </View>
                        {turn.transcript ? (
                          <Text className="max-w-[80%] text-right text-xs italic text-on-surface-variant">
                            “{turn.transcript}”
                          </Text>
                        ) : null}
                      </Animated.View>
                    );

                  case 'status':
                    return (
                      <Animated.View
                        key={turn.id}
                        entering={FadeIn.duration(160)}
                        className="flex-row items-center gap-2"
                      >
                        {turn.tone === 'working' ? (
                          <PulseDot color="#7BD0FF" size={7} />
                        ) : (
                          <View className="w-4 h-4 items-center justify-center rounded-full bg-emerald-950 border border-emerald-500/40">
                            <Check size={10} color="#6EE7B7" strokeWidth={3} />
                          </View>
                        )}
                        <Text className="font-mono text-xs text-on-surface-variant">{turn.text}</Text>
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
                          <OrderTemplateCard order={o} onConfirm={() => onConfirm(o)} />
                        )}
                        <Pressable
                          onPress={() => router.push(`/(customer)/order/${o.id}` as any)}
                          className="items-center py-1"
                        >
                          <Text className="text-xs font-semibold text-primary">Track this order →</Text>
                        </Pressable>
                      </View>
                    );
                  }
                }
              })}

              {error ? <ErrorNote message={error} /> : null}
            </View>
          ) : null}
        </ScrollView>

        {/* Floating Cart Pill (if items exist) */}
        {summary.itemCount > 0 ? (
          <View className="px-4 pb-2">
            <Pressable
              onPress={() =>
                router.push(
                  `/(customer)/cart?service=${summary.serviceWithItems ?? 'food'}` as any,
                )
              }
              style={{
                backgroundColor: '#6A5ACD',
                borderRadius: 16,
                paddingHorizontal: 16,
                paddingVertical: 12,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                shadowColor: '#6A5ACD',
                shadowOpacity: 0.4,
                shadowRadius: 10,
                elevation: 6,
              }}
            >
              <Text style={{ fontSize: 12.5, fontWeight: '800', color: '#FFFFFF' }}>
                🛒 {summary.itemCount} {summary.itemCount === 1 ? 'ITEM' : 'ITEMS'} IN CART
              </Text>
              <View className="flex-row items-center gap-2">
                <Text style={{ fontSize: 14, fontWeight: '800', color: '#FFFFFF', fontFamily: 'GeistMono' }}>
                  {formatInr(summary.totalPaise)}
                </Text>
                <Text style={{ fontSize: 11, fontWeight: '800', color: 'rgba(255,255,255,0.9)' }}>
                  VIEW →
                </Text>
              </View>
            </Pressable>
          </View>
        ) : null}

        {/* Bottom AI Ordering Bar */}
        <View
          style={{
            backgroundColor: '#0E0E10',
            borderTopColor: '#201F21',
            borderTopWidth: 1,
            paddingHorizontal: 16,
            paddingTop: 10,
            paddingBottom: keyboardOpen ? (Platform.OS === 'ios' ? 12 : 8) : navClearance,
          }}
          className="gap-2"
        >
          {recording ? (
            <Animated.View
              entering={FadeIn}
              style={{
                backgroundColor: 'rgba(147, 0, 10, 0.25)',
                borderColor: 'rgba(255, 180, 171, 0.3)',
                borderWidth: 1,
                borderRadius: 12,
                paddingHorizontal: 12,
                paddingVertical: 8,
              }}
              className="flex-row items-center gap-2"
            >
              <PulseDot color="#FFB4AB" size={8} />
              <Text className="flex-1 text-xs font-semibold text-error">
                {COPY.listening.en}
              </Text>
              <Text className="text-[11px] text-error font-tamil">{COPY.recordingHint.ta}</Text>
            </Animated.View>
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 6 }}
            >
              {[
                { label: '🍛 Order Dinner', text: 'Dinner for 2: 4 Parottas and Salna' },
                { label: '🥛 2L Milk', text: '2 Litre Aavin Green Milk' },
                { label: '📄 Print PDF', text: 'Doorstep Xerox 10 copies' },
                { label: '🏃 Courier', text: 'Pickup keys from Anna Nagar' },
              ].map((quick) => (
                <Pressable
                  key={quick.label}
                  onPress={() => void run({ kind: 'text', text: quick.text, variant: 'review' })}
                  style={{
                    backgroundColor: '#1C1B1D',
                    borderColor: '#2A2A2C',
                    borderWidth: 1,
                    borderRadius: 9999,
                    paddingHorizontal: 10,
                    paddingVertical: 5,
                  }}
                >
                  <Text style={{ fontSize: 11, fontWeight: '600', color: '#C9C4D5' }}>
                    {quick.label}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          )}

          <View className="flex-row items-center gap-2">
            <Pressable
              onPress={() => void onCamera()}
              disabled={thinking}
              style={{
                width: 44,
                height: 44,
                borderRadius: 14,
                backgroundColor: '#1C1B1D',
                borderColor: '#2A2A2C',
                borderWidth: 1,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Camera size={19} color="#C8BFFF" strokeWidth={2} />
            </Pressable>

            <View
              style={{
                height: 44,
                flex: 1,
                borderRadius: 14,
                backgroundColor: '#1C1B1D',
                borderColor: '#2A2A2C',
                borderWidth: 1,
                justifyContent: 'center',
                paddingHorizontal: 14,
              }}
            >
              <TextInput
                value={text}
                onChangeText={setText}
                onSubmitEditing={() => void onSend()}
                editable={!thinking}
                placeholder="Ask AI or type an order..."
                placeholderTextColor="#928F9E"
                returnKeyType="send"
                style={{
                  color: '#E5E1E4',
                  fontSize: 13.5,
                  fontWeight: '500',
                }}
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
        <View className="absolute inset-0 z-50 justify-end bg-black/70">
          <View
            style={{
              backgroundColor: '#1C1B1D',
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              padding: 20,
              maxHeight: '75%',
            }}
            className="gap-3"
          >
            <View className="flex-row items-center justify-between border-b border-surface-container-highest pb-3">
              <View>
                <Text className="text-base font-bold text-on-surface">Select Madurai Locality</Text>
                <Text className="text-xs text-on-surface-variant">Sets delivery hub & restaurant filtering</Text>
              </View>
              <Pressable onPress={() => setShowLocalityModal(false)} className="p-1">
                <Text className="text-xs font-bold text-primary">Done</Text>
              </Pressable>
            </View>

            <ScrollView className="gap-2">
              {DEMO_LOCALITIES.map((loc) => {
                const isSelected = currentLocality.id === loc.id;
                return (
                  <Pressable
                    key={loc.id}
                    onPress={() => {
                      void mockLocationRepository.setLocality(loc.id);
                      void updateProfile({ localityId: loc.id });
                      setShowLocalityModal(false);
                    }}
                    style={{
                      backgroundColor: isSelected ? 'rgba(106, 90, 205, 0.2)' : '#131315',
                      borderColor: isSelected ? '#6A5ACD' : '#2A2A2C',
                      borderWidth: 1,
                      borderRadius: 16,
                      padding: 12,
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginBottom: 8,
                    }}
                  >
                    <View className="flex-1">
                      <View className="flex-row items-center gap-2">
                        <Text className="text-sm font-bold text-on-surface">{loc.name}</Text>
                        <Text className="text-xs text-on-surface-variant font-tamil">{loc.nameTa}</Text>
                      </View>
                      <Text className="text-xs text-on-surface-variant">{loc.tagline}</Text>
                    </View>
                    {isSelected ? <Check size={18} color="#C8BFFF" strokeWidth={3} /> : null}
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        </View>
      ) : null}

      {/* 3D AR Dish Explorer Modal */}
      <ArDishModal
        visible={arModalVisible}
        dishKey={arDishKey}
        onClose={() => setArModalVisible(false)}
        onAddToCart={(d) => {
          void run({ kind: 'text', text: `1 ${d.name} from ${d.storeName}`, variant: 'review' });
        }}
      />

      <StitchNav activeTab="home" />
    </Screen>
  );
}
