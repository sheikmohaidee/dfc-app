/**
 * Sleep Mode & Operating Hours Banner / Sheet.
 *
 * Rich Madurai midnight theme with Tamil/English bilingual messaging,
 * reopening countdown, and Morning Drops breakfast pre-order call-to-action.
 */

import * as React from 'react';
import { Pressable, View } from 'react-native';
import { Clock, Coffee, Moon, Sparkles, Sun, X } from 'lucide-react-native';

import { T, Ta } from '@/ui';

export function SleepModeBanner({
  nextOpenTime = '06:00 AM',
  onPreOrderPress,
  onDismiss,
}: {
  nextOpenTime?: string;
  onPreOrderPress?: () => void;
  onDismiss?: () => void;
}) {
  return (
    <View className="mx-4 my-2 overflow-hidden rounded-2xl border border-amber-500/30 bg-zinc-950 p-4 shadow-lg">
      {/* Decorative Night Glow */}
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center gap-2">
          <View className="grid size-8 place-items-center rounded-full bg-amber-500/20 border border-amber-500/40">
            <Moon size={16} color="#F59E0B" />
          </View>
          <View>
            <View className="flex-row items-center gap-1.5">
              <T className="text-xs font-bold text-amber-400">SLEEP MODE · இரவு ஓய்வு</T>
              <Sparkles size={11} color="#F59E0B" />
            </View>
            <Ta className="text-[11px] text-zinc-400">மதுரை உறங்குகிறது — காலை {nextOpenTime} மணிக்கு சந்திப்போம்</Ta>
          </View>
        </View>

        {onDismiss ? (
          <Pressable onPress={onDismiss} hitSlop={10} className="p-1">
            <X size={16} color="#71717A" />
          </Pressable>
        ) : null}
      </View>

      {/* Reopening details */}
      <View className="mt-3 rounded-xl border border-zinc-800 bg-zinc-900/80 p-3">
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center gap-1.5">
            <Clock size={13} color="#A1A1AA" />
            <T className="text-xs text-zinc-300">Reopening Time</T>
          </View>
          <T className="text-xs font-bold text-amber-400">{nextOpenTime} Tomorrow</T>
        </View>

        <T className="mt-2 text-[11.5px] leading-relaxed text-zinc-400">
          Immediate dispatch is paused for the night. You can pre-order now for tomorrow morning&apos;s first delivery drop!
        </T>
      </View>

      {/* Morning Breakfast Drops Shortcut */}
      <View className="mt-3 flex-row items-center gap-2">
        <Pressable
          onPress={onPreOrderPress}
          className="flex-1 flex-row items-center justify-center gap-2 rounded-xl bg-amber-500 py-2.5 px-3 active:opacity-90"
        >
          <Coffee size={15} color="#18181B" strokeWidth={2.5} />
          <T className="text-xs font-bold text-zinc-950">Pre-Order Morning Breakfast (6 AM)</T>
        </Pressable>
      </View>

      {/* Cultural Highlights Footer */}
      <View className="mt-2.5 flex-row items-center justify-around border-t border-zinc-800/80 pt-2">
        <T className="text-[10px] text-zinc-500">🥞 Murugan Idli</T>
        <T className="text-[10px] text-zinc-500">☕ Degree Coffee</T>
        <T className="text-[10px] text-zinc-500">🌸 Fresh Madurai Malli</T>
      </View>
    </View>
  );
}

export function RainSurgeBanner({
  bonusAmount = '₹20',
  multiplier = '1.25x',
  onDismiss,
}: {
  bonusAmount?: string;
  multiplier?: string;
  onDismiss?: () => void;
}) {
  return (
    <View className="mx-4 my-2 flex-row items-center justify-between rounded-xl border border-blue-500/30 bg-blue-950/80 p-3 shadow-md">
      <View className="flex-1 pr-2">
        <View className="flex-row items-center gap-1.5">
          <Sun size={13} color="#60A5FA" />
          <T className="text-xs font-bold text-blue-300">Monsoon Rain Guard ({multiplier})</T>
        </View>
        <T className="mt-0.5 text-[11px] text-zinc-300">
          Heavy rains in Madurai. An extra {bonusAmount} safety allowance goes 100% directly to your delivery captain.
        </T>
      </View>

      {onDismiss ? (
        <Pressable onPress={onDismiss} hitSlop={10} className="p-1">
          <X size={15} color="#94A3B8" />
        </Pressable>
      ) : null}
    </View>
  );
}
