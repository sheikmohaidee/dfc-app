/**
 * Cash collection, at the door.
 *
 * The rider is standing outside, often in the dark, holding a bag. The whole
 * job of this component is that they never do mental arithmetic: tap what the
 * customer handed over, read the change back, done.
 *
 * The breakdown is exact — notes down to ₹10 and coins below that — because a
 * rider will trust it, and a breakdown that quietly loses ₹7 is worse than no
 * breakdown at all.
 */

import * as React from 'react';
import { View } from 'react-native';
import * as Haptics from 'expo-haptics';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';

import { changeBreakdown, changeFor, formatInr, tenderSuggestions } from '@dfc/core';

import { PressableScale } from './glass';
import { Button, Card, Divider, Num, T, Ta } from './index';

export function CashSheet({
  amountPaise,
  busy,
  onCollect,
}: {
  amountPaise: number;
  busy?: boolean;
  onCollect: (tenderedPaise: number) => void;
}) {
  const [tendered, setTendered] = React.useState<number | null>(null);
  const suggestions = React.useMemo(() => tenderSuggestions(amountPaise), [amountPaise]);

  const change = tendered === null ? 0 : changeFor(amountPaise, tendered);
  const breakdown = React.useMemo(() => changeBreakdown(change), [change]);
  const exact = tendered !== null && change === 0;

  return (
    <View className="gap-4">
      {/* What to collect */}
      <Card className="gap-1.5 rounded-generative bg-foreground p-5">
        <View className="flex-row items-center justify-between">
          <T
            style={{ fontSize: 11, fontWeight: '700', letterSpacing: 1.3 }}
            className="text-placeholder"
          >
            COLLECT
          </T>
          <Ta className="text-[11px] text-muted-foreground">பணம் வாங்கவும்</Ta>
        </View>
        <Num
          style={{ fontSize: 52, fontWeight: '700', letterSpacing: -2.3, lineHeight: 58 }}
          className="text-white"
        >
          {formatInr(amountPaise)}
        </Num>
      </Card>

      {/* What they handed over */}
      <View className="gap-2.5">
        <T className="px-1 text-[10.5px] font-bold tracking-[1.05px] text-placeholder">
          CUSTOMER GAVE
        </T>
        <View className="flex-row flex-wrap gap-2.5">
          {suggestions.map((s) => {
            const on = tendered === s;
            return (
              <PressableScale
                key={s}
                to={0.94}
                haptic
                onPress={() => setTendered(s)}
                accessibilityRole="button"
                accessibilityLabel={`Customer gave ${formatInr(s)}`}
                className={`h-14 min-w-[88px] flex-1 items-center justify-center rounded-[12px] border-[1.5px] ${
                  on ? 'border-primary bg-primary' : 'border-border bg-background'
                }`}
              >
                <Num
                  className={`text-[18px] font-semibold ${on ? 'text-primary-foreground' : 'text-foreground'}`}
                >
                  {formatInr(s)}
                </Num>
                {s === amountPaise ? (
                  <T
                    className={`text-[9.5px] ${on ? 'text-white/60' : 'text-placeholder'}`}
                  >
                    exact
                  </T>
                ) : null}
              </PressableScale>
            );
          })}
        </View>
      </View>

      {/* Change to hand back */}
      {tendered !== null ? (
        <Animated.View entering={FadeInDown.duration(240)}>
          <Card
            className={`gap-2.5 p-4 ${
              exact ? 'border-grocery-border bg-grocery-tint' : 'border-verify-border bg-verify-tint'
            }`}
          >
            <View className="flex-row items-baseline justify-between">
              <T
                className={`text-[11px] font-bold tracking-[1.05px] ${
                  exact ? 'text-grocery-fg' : 'text-verify-fg'
                }`}
              >
                {exact ? 'NO CHANGE NEEDED' : 'GIVE BACK'}
              </T>
              {!exact ? (
                <Num
                  style={{ fontSize: 30, fontWeight: '700', letterSpacing: -1.2 }}
                  className="text-verify-fg"
                >
                  {formatInr(change)}
                </Num>
              ) : null}
            </View>

            {!exact ? (
              <>
                <Divider className="bg-verify-border" />
                <View className="gap-1.5">
                  {breakdown.map((b) => (
                    <View key={b.note} className="flex-row items-center justify-between">
                      <Num className="text-[13px] text-verify-fg">
                        {b.count} × {formatInr(b.note)}
                      </Num>
                      <Num className="text-[13px] font-medium text-verify-fg">
                        {formatInr(b.note * b.count)}
                      </Num>
                    </View>
                  ))}
                </View>
                <Ta className="text-[11px] text-verify">சில்லறை திருப்பி கொடுக்கவும்</Ta>
              </>
            ) : (
              <Animated.View entering={FadeIn} className="flex-row items-center gap-2">
                <Ta className="text-[12px] text-grocery-fg">சரியான தொகை</Ta>
              </Animated.View>
            )}
          </Card>
        </Animated.View>
      ) : null}

      <Button
        size="rider"
        label={
          tendered === null
            ? `Cash collected · ${formatInr(amountPaise)}`
            : exact
              ? `Collected ${formatInr(amountPaise)}`
              : `Collected · give back ${formatInr(change)}`
        }
        labelTa="பணம் வாங்கியாயிற்று"
        loading={busy}
        onPress={() => {
          void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          onCollect(tendered ?? amountPaise);
        }}
      />
    </View>
  );
}
