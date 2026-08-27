/**
 * First run.
 *
 * Three slides, skippable, shown once. It exists because DFC is not a
 * catalogue app and people arrive expecting one — thirty seconds explaining
 * "photograph the prescription, we read it" saves a support call and a
 * one-star review that says "there are no products".
 *
 * The 3D parcel carries across all three slides and only the copy changes, so
 * it reads as one object being explained rather than three unrelated screens.
 */

import * as React from 'react';
import { Dimensions, ScrollView, View, type NativeSyntheticEvent, type NativeScrollEvent } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Animated, { FadeIn, FadeInDown, FadeOut } from 'react-native-reanimated';
import { Camera, Mic, ShieldCheck } from 'lucide-react-native';

import { Hero3D, type HeroTone } from '@/ui/hero-3d';
import { AuroraField, PressableScale } from '@/ui/glass';
import { Button, T, Ta } from '@/ui';
import { Screen } from '@/ui';

export const ONBOARDED_KEY = 'dfc.onboarded';

const { width } = Dimensions.get('window');

interface Slide {
  tone: HeroTone;
  icon: React.ReactNode;
  kicker: string;
  title: string;
  titleTa: string;
  body: string;
}

const SLIDES: Slide[] = [
  {
    tone: 'brand',
    icon: <Camera size={16} color="#2563EB" strokeWidth={2.2} />,
    kicker: 'NO CATALOGUE. NO CART.',
    title: 'Just show us\nwhat you need',
    titleTa: 'உங்களுக்கு என்ன வேண்டும் என்று காட்டுங்கள்',
    body: 'Photograph a handwritten prescription or a shopping list. We read it and turn it into an order you can check.',
  },
  {
    tone: 'grocery',
    icon: <Mic size={16} color="#16A34A" strokeWidth={2.2} />,
    kicker: 'TAMIL, ENGLISH OR BOTH',
    title: 'Or simply\nsay it out loud',
    titleTa: 'அல்லது சொன்னால் போதும்',
    body: '“Rendu muzham malligai, oru kilo paruppu” works exactly as well as typing it. Speak the way you speak.',
  },
  {
    tone: 'pharmacy',
    icon: <ShieldCheck size={16} color="#2563EB" strokeWidth={2.2} />,
    kicker: 'A PHARMACIST CHECKS EVERY ONE',
    title: 'Medicine,\nchecked by a human',
    titleTa: 'மருந்தாளர் உறுதிப்படுத்துகிறார்',
    body: 'Anything our system is unsure of is flagged and confirmed by a licensed pharmacist before it is dispensed. Never a guess.',
  },
];

export default function Welcome() {
  const router = useRouter();
  const [index, setIndex] = React.useState(0);
  const scrollRef = React.useRef<ScrollView>(null);

  const slide = SLIDES[index]!;
  const last = index === SLIDES.length - 1;

  async function finish() {
    await AsyncStorage.setItem(ONBOARDED_KEY, '1').catch(() => {});
    router.replace('/(auth)/sign-in');
  }

  function onScroll(e: NativeSyntheticEvent<NativeScrollEvent>) {
    const next = Math.round(e.nativeEvent.contentOffset.x / width);
    if (next !== index) setIndex(next);
  }

  function advance() {
    if (last) {
      void finish();
      return;
    }
    scrollRef.current?.scrollTo({ x: (index + 1) * width, animated: true });
  }

  return (
    <Screen edges={['top', 'bottom']}>
      <AuroraField tone={slide.tone}>
        <View className="flex-1">
          {/* Skip */}
          <View className="flex-row items-center justify-between px-5 pt-2">
            <View className="flex-row items-center gap-2.5">
              <View className="size-7 items-center justify-center rounded-[9px] bg-primary">
                <T className="text-[12px] font-semibold text-primary-foreground">D</T>
              </View>
              <T className="text-[13px] font-semibold tracking-tight">DFC</T>
            </View>
            <PressableScale to={0.94} onPress={() => void finish()} className="px-2 py-2">
              <T className="text-[13.5px] font-medium text-muted-foreground">Skip</T>
            </PressableScale>
          </View>

          {/* One object, explained three ways. */}
          <Hero3D tone={slide.tone} height={250} />

          <ScrollView
            ref={scrollRef}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={onScroll}
            scrollEventThrottle={16}
            className="flex-grow-0"
          >
            {SLIDES.map((s, i) => (
              <View key={i} style={{ width }} className="gap-3.5 px-7">
                <Animated.View
                  entering={FadeInDown.delay(60).duration(320)}
                  className="flex-row items-center gap-2 self-start rounded-full border border-border bg-background/70 px-3 py-1.5"
                >
                  {s.icon}
                  <T className="text-[10px] font-bold tracking-[0.9px] text-body-strong">
                    {s.kicker}
                  </T>
                </Animated.View>

                <T
                  style={{ fontSize: 32, fontWeight: '700', letterSpacing: -1.3, lineHeight: 38 }}
                >
                  {s.title}
                </T>
                <Ta className="text-[14px] leading-[21px]">{s.titleTa}</Ta>
                <T className="text-[15px] leading-[23px] text-muted-foreground">{s.body}</T>
              </View>
            ))}
          </ScrollView>

          <View className="flex-1" />

          {/* Progress + action */}
          <View className="gap-5 px-7 pb-6">
            <View className="flex-row justify-center gap-2">
              {SLIDES.map((_, i) => (
                <Animated.View
                  key={i}
                  entering={FadeIn}
                  exiting={FadeOut}
                  className={`h-1.5 rounded-full ${
                    i === index ? 'w-6 bg-primary' : 'w-1.5 bg-border'
                  }`}
                />
              ))}
            </View>

            <Button
              size="lg"
              label={last ? 'Get started' : 'Next'}
              labelTa={last ? 'தொடங்கலாம்' : undefined}
              onPress={advance}
            />
          </View>
        </View>
      </AuroraField>
    </Screen>
  );
}
