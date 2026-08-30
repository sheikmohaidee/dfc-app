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
import { QrCode, Banknote } from 'lucide-react-native';

import {
  buildUpiUrl,
  changeBreakdown,
  changeFor,
  formatInr,
  paymentReference,
  tenderSuggestions,
  UPI_PAYEE,
} from '@dfc/core';

import { PressableScale } from './glass';
import { Button, Card, Divider, Num, T, Ta } from './index';
import { QrCodeSvg } from './qr-code-svg';

export function CashSheet({
  amountPaise,
  orderCode = 1001,
  busy,
  onCollect,
}: {
  amountPaise: number;
  orderCode?: number;
  busy?: boolean;
  onCollect: (tenderedPaise: number, mode?: 'cash' | 'upi') => void;
}) {
  const [mode, setMode] = React.useState<'cash' | 'upi'>('cash');
  const [tendered, setTendered] = React.useState<number | null>(null);
  const suggestions = React.useMemo(() => tenderSuggestions(amountPaise), [amountPaise]);

  const change = tendered === null ? 0 : changeFor(amountPaise, tendered);
  const breakdown = React.useMemo(() => changeBreakdown(change), [change]);
  const exact = tendered !== null && change === 0;

  const upiRef = React.useMemo(() => paymentReference(orderCode), [orderCode]);
  const upiUrl = React.useMemo(
    () =>
      buildUpiUrl({
        amountPaise,
        reference: upiRef,
        orderCode,
        payee: {
          vpa: UPI_PAYEE.vpa.includes('[') ? 'dfc.madurai@upi' : UPI_PAYEE.vpa,
          name: 'DFC Madurai Logistics',
        },
      }),
    [amountPaise, upiRef, orderCode],
  );

  return (
    <View className="gap-4">
      {/* Payment mode selector: Cash vs Dynamic UPI QR */}
      <View className="flex-row rounded-[12px] bg-muted p-1">
        <PressableScale
          to={0.97}
          onPress={() => setMode('cash')}
          className={`flex-1 flex-row items-center justify-center gap-2 rounded-[10px] py-2.5 ${
            mode === 'cash' ? 'bg-background shadow-sm' : ''
          }`}
        >
          <Banknote size={18} color={mode === 'cash' ? '#0E1726' : '#71717A'} strokeWidth={2.2} />
          <T className={`text-[13px] font-bold ${mode === 'cash' ? 'text-foreground' : 'text-muted-foreground'}`}>
            CASH
          </T>
        </PressableScale>

        <PressableScale
          to={0.97}
          onPress={() => setMode('upi')}
          className={`flex-1 flex-row items-center justify-center gap-2 rounded-[10px] py-2.5 ${
            mode === 'upi' ? 'bg-background shadow-sm' : ''
          }`}
        >
          <QrCode size={18} color={mode === 'upi' ? '#16A34A' : '#71717A'} strokeWidth={2.2} />
          <T className={`text-[13px] font-bold ${mode === 'upi' ? 'text-grocery-fg' : 'text-muted-foreground'}`}>
            DOORSTEP UPI QR
          </T>
        </PressableScale>
      </View>

      {mode === 'upi' ? (
        <Animated.View entering={FadeInDown.duration(240)} className="gap-4">
          <Card className="items-center gap-3.5 rounded-generative bg-white p-6 shadow-md border-grocery-border">
            <View className="items-center gap-1">
              <T className="text-[11px] font-bold tracking-[1.2px] text-grocery-fg">
                SCAN & PAY WITH ANY UPI APP
              </T>
              <Ta className="text-[11.5px] text-muted-foreground">
                GPay / PhonePe / Paytm / BHIM மூலம் ஸ்கேன் செய்யவும்
              </Ta>
            </View>

            {/* Render Dynamic Doorstep QR Code */}
            <View className="rounded-[16px] border-2 border-grocery-border p-3.5 bg-white shadow-inner">
              <QrCodeSvg value={upiUrl} size={210} color="#0E1726" backgroundColor="#FFFFFF" />
            </View>

            <View className="items-center gap-0.5">
              <Num style={{ fontSize: 36, fontWeight: '800', letterSpacing: -1.5 }} className="text-foreground">
                {formatInr(amountPaise)}
              </Num>
              <T className="text-[11.5px] font-medium text-muted-foreground">
                Ref: <Num className="text-[11.5px] font-semibold text-foreground">{upiRef}</Num>
              </T>
            </View>

            <Divider />

            <View className="w-full flex-row items-center justify-between px-1">
              <T className="text-[11.5px] text-muted-foreground">Payee: DFC Madurai</T>
              <T className="text-[11.5px] font-semibold text-grocery-fg">Zero Cash Handling</T>
            </View>
          </Card>

          <Button
            size="rider"
            label={`Received ${formatInr(amountPaise)} via UPI`}
            labelTa="UPI மூலம் பணம் பெறப்பட்டது"
            loading={busy}
            onPress={() => {
              void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              onCollect(amountPaise, 'upi');
            }}
          />
        </Animated.View>
      ) : (
        <Animated.View entering={FadeIn.duration(200)} className="gap-4">
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
              onCollect(tendered ?? amountPaise, 'cash');
            }}
          />
        </Animated.View>
      )}
    </View>
  );
}
