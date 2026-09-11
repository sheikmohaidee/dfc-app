/**
 * Print & Xerox Studio Screen
 */

import * as React from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, Check, FileCheck, FileText, Minus, Plus, Printer, Shield } from 'lucide-react-native';

import { formatInr } from '@dfc/core';
import { mockPrintRepository } from '@/demo/repositories/print.repository';
import { useCart } from '@/providers/cart';
import { Badge, Button, Num, Screen, T, Ta } from '@/ui';
import { GlassCard, PressableScale } from '@/ui/glass';

export default function PrintScreen() {
  const router = useRouter();
  const { addItem } = useCart('print');

  const sampleDocs = mockPrintRepository.getSampleDocuments();
  const [selectedDocIdx, setSelectedDocIdx] = React.useState(0);
  const [color, setColor] = React.useState<'bw' | 'color'>('bw');
  const [side, setSide] = React.useState<'single' | 'double'>('double');
  const [binding, setBinding] = React.useState<'none' | 'staple' | 'spiral' | 'hard'>('spiral');
  const [copies, setCopies] = React.useState(1);
  const [busy, setBusy] = React.useState(false);

  const currentDoc = sampleDocs[selectedDocIdx]!;
  const quote = React.useMemo(() => {
    return mockPrintRepository.calculateQuote({
      pageCount: currentDoc.pages,
      copies,
      color,
      side,
      paperSize: 'A4',
      binding,
    });
  }, [currentDoc.pages, copies, color, side, binding]);

  async function onOrderPrint() {
    setBusy(true);
    await addItem({
      id: `print-${Date.now()}`,
      sourceId: 'store-print-hub',
      sourceName: 'Tallakulam Xerox & Print Hub',
      sourceCategory: 'print',
      localityId: 'tallakulam',
      name: `Print: ${currentDoc.name} (${currentDoc.pages} pgs, ${color.toUpperCase()}, ${binding !== 'none' ? `${binding} bind` : 'no bind'})`,
      pricePaise: quote.itemTotalPaise + quote.bindingPaise,
      quantity: 1,
    });
    setBusy(false);
    router.push('/(customer)/cart?service=print' as any);
  }

  return (
    <Screen edges={['top']}>
      {/* Header */}
      <View className="flex-row items-center gap-3 border-b border-muted bg-background px-4 py-3">
        <PressableScale to={0.9} onPress={() => router.back()} className="size-9 items-center justify-center">
          <ArrowLeft size={22} color="#18181B" strokeWidth={2} />
        </PressableScale>
        <View className="flex-1">
          <View className="flex-row items-center gap-2">
            <T className="text-[17px] font-bold tracking-tight">Print & Xerox Express</T>
            <Ta className="text-[12px] text-muted-foreground">பிரிண்ட்</Ta>
          </View>
          <T className="text-[11px] font-medium text-muted-foreground">
            Tallakulam Print Hub · 30-min Doorstep Delivery
          </T>
        </View>
        <View className="rounded-full bg-blue-50 px-2.5 py-1">
          <T className="text-[11px] font-bold text-blue-700">A4 / A3 HD</T>
        </View>
      </View>

      <ScrollView className="flex-1 bg-surface" contentContainerClassName="gap-4 p-4 pb-28">
        {/* Document Selection Card */}
        <View className="gap-2">
          <T className="text-[13px] font-bold text-foreground">1. SELECT DOCUMENT TO PRINT</T>
          <View className="gap-2">
            {sampleDocs.map((doc, idx) => {
              const active = selectedDocIdx === idx;
              return (
                <Pressable
                  key={doc.name}
                  onPress={() => setSelectedDocIdx(idx)}
                  className={`flex-row items-center gap-3 rounded-[14px] border p-3.5 ${
                    active ? 'border-primary bg-primary-tint' : 'border-border bg-background'
                  }`}
                >
                  <View className={`size-9 items-center justify-center rounded-lg ${active ? 'bg-primary' : 'bg-muted'}`}>
                    <FileText size={18} color={active ? '#FFFFFF' : '#71717A'} />
                  </View>
                  <View className="flex-1">
                    <T className="text-[13.5px] font-semibold text-foreground">{doc.name}</T>
                    <T className="text-[11px] text-muted-foreground">
                      {doc.pages} pages · {doc.size} · PDF
                    </T>
                  </View>
                  {active ? (
                    <View className="size-6 items-center justify-center rounded-full bg-primary">
                      <Check size={13} color="#FFFFFF" strokeWidth={3} />
                    </View>
                  ) : null}
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Print Configuration */}
        <View className="gap-3 rounded-[16px] border border-border bg-background p-4 shadow-sm">
          <T className="text-[13px] font-bold text-foreground">2. PRINT SPECIFICATIONS</T>

          {/* Color Mode */}
          <View className="gap-1.5">
            <T className="text-[12px] font-semibold text-body-strong">Color Mode</T>
            <View className="flex-row gap-2.5">
              <Pressable
                onPress={() => setColor('bw')}
                className={`flex-1 items-center rounded-xl border py-2.5 ${
                  color === 'bw' ? 'border-primary bg-primary-tint' : 'border-border bg-surface'
                }`}
              >
                <T className={`text-[13px] font-semibold ${color === 'bw' ? 'text-primary' : 'text-body-strong'}`}>
                  B & W (₹2/pg)
                </T>
              </Pressable>
              <Pressable
                onPress={() => setColor('color')}
                className={`flex-1 items-center rounded-xl border py-2.5 ${
                  color === 'color' ? 'border-primary bg-primary-tint' : 'border-border bg-surface'
                }`}
              >
                <T className={`text-[13px] font-semibold ${color === 'color' ? 'text-primary' : 'text-body-strong'}`}>
                  Color (₹8/pg)
                </T>
              </Pressable>
            </View>
          </View>

          {/* Sides */}
          <View className="gap-1.5 pt-1">
            <T className="text-[12px] font-semibold text-body-strong">Print Sides</T>
            <View className="flex-row gap-2.5">
              <Pressable
                onPress={() => setSide('double')}
                className={`flex-1 items-center rounded-xl border py-2.5 ${
                  side === 'double' ? 'border-primary bg-primary-tint' : 'border-border bg-surface'
                }`}
              >
                <T className={`text-[13px] font-semibold ${side === 'double' ? 'text-primary' : 'text-body-strong'}`}>
                  Back-to-Back (15% Off)
                </T>
              </Pressable>
              <Pressable
                onPress={() => setSide('single')}
                className={`flex-1 items-center rounded-xl border py-2.5 ${
                  side === 'single' ? 'border-primary bg-primary-tint' : 'border-border bg-surface'
                }`}
              >
                <T className={`text-[13px] font-semibold ${side === 'single' ? 'text-primary' : 'text-body-strong'}`}>
                  Single Sided
                </T>
              </Pressable>
            </View>
          </View>

          {/* Binding Option */}
          <View className="gap-1.5 pt-1">
            <T className="text-[12px] font-semibold text-body-strong">Binding & Finishing</T>
            <View className="flex-row flex-wrap gap-2">
              {[
                { k: 'none' as const, l: 'No Binding', p: '₹0' },
                { k: 'staple' as const, l: 'Corner Staple', p: '+₹5' },
                { k: 'spiral' as const, l: 'Spiral Bound', p: '+₹40' },
                { k: 'hard' as const, l: 'Hardcover Book', p: '+₹120' },
              ].map((b) => (
                <Pressable
                  key={b.k}
                  onPress={() => setBinding(b.k)}
                  className={`flex-1 min-w-[130px] rounded-xl border p-2.5 ${
                    binding === b.k ? 'border-primary bg-primary-tint' : 'border-border bg-surface'
                  }`}
                >
                  <T className={`text-[12px] font-semibold ${binding === b.k ? 'text-primary' : 'text-body-strong'}`}>
                    {b.l}
                  </T>
                  <T className="text-[10.5px] text-muted-foreground">{b.p}</T>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Copies Stepper */}
          <View className="flex-row items-center justify-between border-t border-muted pt-3">
            <View>
              <T className="text-[13px] font-semibold text-body-strong">Number of Sets / Copies</T>
              <T className="text-[11px] text-muted-foreground">Delivered in sealed weatherproof envelope</T>
            </View>
            <View className="h-8 flex-row items-center rounded-lg border border-primary bg-primary px-1">
              <Pressable
                onPress={() => setCopies((c) => Math.max(1, c - 1))}
                className="size-7 items-center justify-center"
              >
                <Minus size={13} color="#FFFFFF" strokeWidth={2.5} />
              </Pressable>
              <Num className="min-w-[24px] text-center text-[13px] font-bold text-white">{copies}</Num>
              <Pressable
                onPress={() => setCopies((c) => c + 1)}
                className="size-7 items-center justify-center"
              >
                <Plus size={13} color="#FFFFFF" strokeWidth={2.5} />
              </Pressable>
            </View>
          </View>
        </View>

        {/* Live Calculation Quote Card */}
        <View className="gap-2.5 rounded-[16px] border border-border bg-background p-4 shadow-sm">
          <T className="text-[13px] font-bold text-foreground">3. PRICE ESTIMATE</T>

          <View className="gap-1.5 border-b border-muted pb-2.5 text-[12.5px]">
            <View className="flex-row justify-between">
              <T className="text-[12px] text-muted-foreground">
                Printing ({currentDoc.pages} pages × {copies} set)
              </T>
              <Num className="text-[12px] font-medium">{formatInr(quote.itemTotalPaise)}</Num>
            </View>
            {quote.bindingPaise > 0 ? (
              <View className="flex-row justify-between">
                <T className="text-[12px] text-muted-foreground">{binding.toUpperCase()} Binding</T>
                <Num className="text-[12px] font-medium">{formatInr(quote.bindingPaise)}</Num>
              </View>
            ) : null}
            <View className="flex-row justify-between">
              <T className="text-[12px] text-muted-foreground">Express 30-min Delivery</T>
              <Num className="text-[12px] font-medium">{formatInr(quote.deliveryFeePaise)}</Num>
            </View>
          </View>

          <View className="flex-row items-center justify-between pt-0.5">
            <T className="text-[14px] font-bold text-foreground">Total Bill</T>
            <Num className="text-[17px] font-bold text-primary">{formatInr(quote.totalPaise)}</Num>
          </View>

          <Button
            size="lg"
            label="Add Print Order to Cart"
            loading={busy}
            onPress={() => void onOrderPrint()}
            className="mt-1"
          />
        </View>
      </ScrollView>
    </Screen>
  );
}
