/**
 * Print & Xerox Studio Screen — Stitch Dark Floating Theme
 * High-speed document upload and instant price quoting for Tallakulam Print Hub.
 * Supports B&W/Color, Single/Double sided, Staple/Spiral/Hardcover binding, and express doorstep delivery.
 */

import * as React from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import {
  ArrowLeft,
  Check,
  FileCheck,
  FileText,
  Minus,
  Plus,
  Printer,
  Shield,
  Sparkles,
  Layers,
  BookOpen,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

import { formatInr } from '@dfc/core';
import { mockPrintRepository } from '@/demo/repositories/print.repository';
import { useCart } from '@/providers/cart';
import { Screen } from '@/ui';
import { DFCPressable } from '@/ui/animated';
import { StitchHeader } from '@/ui/stitch-header';

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
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
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
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    router.push('/(customer)/cart?service=print' as any);
  }

  return (
    <Screen edges={['top']} style={{ backgroundColor: '#0E0E10' }}>
      {/* Header */}
      <StitchHeader
        showBack={true}
        title="Print & Xerox Studio"
        subtitle="Tallakulam Hub · 30-min Doorstep"
        showNotifications={false}
        rightAction={
          <View
            style={{
              backgroundColor: 'rgba(106, 90, 205, 0.15)',
              borderWidth: 1,
              borderColor: 'rgba(106, 90, 205, 0.35)',
              paddingHorizontal: 10,
              paddingVertical: 5,
              borderRadius: 20,
            }}
          >
            <Text
              style={{
                fontFamily: 'PlusJakartaSans',
                fontSize: 11,
                fontWeight: '700',
                color: '#C8BFFF',
              }}
            >
              A4 HD Laser
            </Text>
          </View>
        }
      />

      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingTop: 16,
          paddingBottom: 48,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Step 1: Document Selection */}
        <View className="mb-6">
          <View className="flex-row items-center gap-2 mb-3">
            <View
              style={{
                width: 22,
                height: 22,
                borderRadius: 11,
                backgroundColor: '#6A5ACD',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text style={{ fontFamily: 'PlusJakartaSans', fontSize: 12, fontWeight: '800', color: '#FFFFFF' }}>
                1
              </Text>
            </View>
            <Text
              style={{
                fontFamily: 'PlusJakartaSans',
                fontSize: 13,
                fontWeight: '700',
                color: '#E5E1E4',
                letterSpacing: 0.5,
              }}
            >
              SELECT DOCUMENT
            </Text>
          </View>

          <View className="gap-2.5">
            {sampleDocs.map((doc, idx) => {
              const active = selectedDocIdx === idx;
              return (
                <DFCPressable
                  key={doc.name}
                  onPress={() => {
                    void Haptics.selectionAsync();
                    setSelectedDocIdx(idx);
                  }}
                  scaleTo={0.98}
                  style={{
                    backgroundColor: active ? '#1E1D26' : '#18181B',
                    borderRadius: 16,
                    borderWidth: 1,
                    borderColor: active ? '#6A5ACD' : '#26262B',
                    padding: 14,
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 12,
                  }}
                >
                  <View
                    style={{
                      width: 42,
                      height: 42,
                      borderRadius: 12,
                      backgroundColor: active ? 'rgba(106, 90, 205, 0.25)' : '#201F24',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <FileText size={20} color={active ? '#C8BFFF' : '#928F9E'} />
                  </View>

                  <View className="flex-1">
                    <Text
                      style={{
                        fontFamily: 'PlusJakartaSans',
                        fontSize: 14,
                        fontWeight: '700',
                        color: active ? '#FFFFFF' : '#E5E1E4',
                      }}
                    >
                      {doc.name}
                    </Text>
                    <Text
                      style={{
                        fontFamily: 'PlusJakartaSans',
                        fontSize: 11,
                        color: '#928F9E',
                        marginTop: 2,
                      }}
                    >
                      {doc.pages} pages · {doc.size} · PDF
                    </Text>
                  </View>

                  {active ? (
                    <View
                      style={{
                        width: 24,
                        height: 24,
                        borderRadius: 12,
                        backgroundColor: '#6A5ACD',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Check size={14} color="#FFFFFF" strokeWidth={3} />
                    </View>
                  ) : null}
                </DFCPressable>
              );
            })}
          </View>
        </View>

        {/* Step 2: Print Specifications */}
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
          <View className="flex-row items-center gap-2 mb-4">
            <View
              style={{
                width: 22,
                height: 22,
                borderRadius: 11,
                backgroundColor: '#6A5ACD',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text style={{ fontFamily: 'PlusJakartaSans', fontSize: 12, fontWeight: '800', color: '#FFFFFF' }}>
                2
              </Text>
            </View>
            <Text
              style={{
                fontFamily: 'PlusJakartaSans',
                fontSize: 13,
                fontWeight: '700',
                color: '#E5E1E4',
                letterSpacing: 0.5,
              }}
            >
              PRINT SPECIFICATIONS
            </Text>
          </View>

          {/* Color Mode */}
          <View className="mb-4">
            <Text
              style={{
                fontFamily: 'PlusJakartaSans',
                fontSize: 12,
                fontWeight: '600',
                color: '#928F9E',
                marginBottom: 8,
              }}
            >
              Color Mode
            </Text>
            <View className="flex-row gap-2.5">
              <DFCPressable
                onPress={() => {
                  void Haptics.selectionAsync();
                  setColor('bw');
                }}
                scaleTo={0.97}
                style={{
                  flex: 1,
                  paddingVertical: 12,
                  alignItems: 'center',
                  borderRadius: 12,
                  borderWidth: 1,
                  backgroundColor: color === 'bw' ? 'rgba(106, 90, 205, 0.2)' : '#1F1E24',
                  borderColor: color === 'bw' ? '#6A5ACD' : '#2A2930',
                }}
              >
                <Text
                  style={{
                    fontFamily: 'PlusJakartaSans',
                    fontSize: 13,
                    fontWeight: '700',
                    color: color === 'bw' ? '#C8BFFF' : '#E5E1E4',
                  }}
                >
                  B & W (₹2/pg)
                </Text>
              </DFCPressable>

              <DFCPressable
                onPress={() => {
                  void Haptics.selectionAsync();
                  setColor('color');
                }}
                scaleTo={0.97}
                style={{
                  flex: 1,
                  paddingVertical: 12,
                  alignItems: 'center',
                  borderRadius: 12,
                  borderWidth: 1,
                  backgroundColor: color === 'color' ? 'rgba(106, 90, 205, 0.2)' : '#1F1E24',
                  borderColor: color === 'color' ? '#6A5ACD' : '#2A2930',
                }}
              >
                <Text
                  style={{
                    fontFamily: 'PlusJakartaSans',
                    fontSize: 13,
                    fontWeight: '700',
                    color: color === 'color' ? '#C8BFFF' : '#E5E1E4',
                  }}
                >
                  Color (₹8/pg)
                </Text>
              </DFCPressable>
            </View>
          </View>

          {/* Print Sides */}
          <View className="mb-4">
            <Text
              style={{
                fontFamily: 'PlusJakartaSans',
                fontSize: 12,
                fontWeight: '600',
                color: '#928F9E',
                marginBottom: 8,
              }}
            >
              Print Sides
            </Text>
            <View className="flex-row gap-2.5">
              <DFCPressable
                onPress={() => {
                  void Haptics.selectionAsync();
                  setSide('double');
                }}
                scaleTo={0.97}
                style={{
                  flex: 1,
                  paddingVertical: 12,
                  alignItems: 'center',
                  borderRadius: 12,
                  borderWidth: 1,
                  backgroundColor: side === 'double' ? 'rgba(106, 90, 205, 0.2)' : '#1F1E24',
                  borderColor: side === 'double' ? '#6A5ACD' : '#2A2930',
                }}
              >
                <Text
                  style={{
                    fontFamily: 'PlusJakartaSans',
                    fontSize: 13,
                    fontWeight: '700',
                    color: side === 'double' ? '#C8BFFF' : '#E5E1E4',
                  }}
                >
                  Back-to-Back (15% Off)
                </Text>
              </DFCPressable>

              <DFCPressable
                onPress={() => {
                  void Haptics.selectionAsync();
                  setSide('single');
                }}
                scaleTo={0.97}
                style={{
                  flex: 1,
                  paddingVertical: 12,
                  alignItems: 'center',
                  borderRadius: 12,
                  borderWidth: 1,
                  backgroundColor: side === 'single' ? 'rgba(106, 90, 205, 0.2)' : '#1F1E24',
                  borderColor: side === 'single' ? '#6A5ACD' : '#2A2930',
                }}
              >
                <Text
                  style={{
                    fontFamily: 'PlusJakartaSans',
                    fontSize: 13,
                    fontWeight: '700',
                    color: side === 'single' ? '#C8BFFF' : '#E5E1E4',
                  }}
                >
                  Single Sided
                </Text>
              </DFCPressable>
            </View>
          </View>

          {/* Binding & Finishing */}
          <View className="mb-4">
            <Text
              style={{
                fontFamily: 'PlusJakartaSans',
                fontSize: 12,
                fontWeight: '600',
                color: '#928F9E',
                marginBottom: 8,
              }}
            >
              Binding & Finishing
            </Text>
            <View className="flex-row flex-wrap gap-2">
              {[
                { k: 'none' as const, l: 'No Binding', p: '₹0' },
                { k: 'staple' as const, l: 'Corner Staple', p: '+₹5' },
                { k: 'spiral' as const, l: 'Spiral Bound', p: '+₹40' },
                { k: 'hard' as const, l: 'Hardcover Book', p: '+₹120' },
              ].map((b) => {
                const active = binding === b.k;
                return (
                  <DFCPressable
                    key={b.k}
                    onPress={() => {
                      void Haptics.selectionAsync();
                      setBinding(b.k);
                    }}
                    scaleTo={0.96}
                    style={{
                      flex: 1,
                      minWidth: 140,
                      borderRadius: 12,
                      borderWidth: 1,
                      backgroundColor: active ? 'rgba(106, 90, 205, 0.2)' : '#1F1E24',
                      borderColor: active ? '#6A5ACD' : '#2A2930',
                      padding: 12,
                    }}
                  >
                    <Text
                      style={{
                        fontFamily: 'PlusJakartaSans',
                        fontSize: 13,
                        fontWeight: '700',
                        color: active ? '#C8BFFF' : '#E5E1E4',
                      }}
                    >
                      {b.l}
                    </Text>
                    <Text
                      style={{
                        fontFamily: 'PlusJakartaSans',
                        fontSize: 11,
                        color: '#928F9E',
                        marginTop: 2,
                      }}
                    >
                      {b.p}
                    </Text>
                  </DFCPressable>
                );
              })}
            </View>
          </View>

          {/* Copies Stepper */}
          <View
            style={{
              borderTopWidth: 1,
              borderTopColor: '#26262B',
              paddingTop: 14,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <View>
              <Text style={{ fontFamily: 'PlusJakartaSans', fontSize: 13, fontWeight: '700', color: '#E5E1E4' }}>
                Number of Copies
              </Text>
              <Text style={{ fontFamily: 'PlusJakartaSans', fontSize: 11, color: '#928F9E' }}>
                Sealed weatherproof packaging
              </Text>
            </View>

            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: '#26252E',
                borderRadius: 10,
                borderWidth: 1,
                borderColor: '#383742',
                paddingHorizontal: 4,
                paddingVertical: 2,
              }}
            >
              <Pressable
                onPress={() => {
                  void Haptics.selectionAsync();
                  setCopies((c) => Math.max(1, c - 1));
                }}
                style={{ width: 32, height: 32, alignItems: 'center', justifyContent: 'center' }}
              >
                <Minus size={15} color="#C8BFFF" strokeWidth={2.5} />
              </Pressable>
              <Text
                style={{
                  fontFamily: 'PlusJakartaSans',
                  fontSize: 14,
                  fontWeight: '800',
                  color: '#FFFFFF',
                  minWidth: 28,
                  textAlign: 'center',
                }}
              >
                {copies}
              </Text>
              <Pressable
                onPress={() => {
                  void Haptics.selectionAsync();
                  setCopies((c) => c + 1);
                }}
                style={{ width: 32, height: 32, alignItems: 'center', justifyContent: 'center' }}
              >
                <Plus size={15} color="#C8BFFF" strokeWidth={2.5} />
              </Pressable>
            </View>
          </View>
        </View>

        {/* Step 3: Price Calculation & Cart CTA */}
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
          <View className="flex-row items-center gap-2 mb-3">
            <View
              style={{
                width: 22,
                height: 22,
                borderRadius: 11,
                backgroundColor: '#6A5ACD',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text style={{ fontFamily: 'PlusJakartaSans', fontSize: 12, fontWeight: '800', color: '#FFFFFF' }}>
                3
              </Text>
            </View>
            <Text
              style={{
                fontFamily: 'PlusJakartaSans',
                fontSize: 13,
                fontWeight: '700',
                color: '#E5E1E4',
                letterSpacing: 0.5,
              }}
            >
              PRICE ESTIMATE
            </Text>
          </View>

          <View className="gap-2 border-b border-[#26262B] pb-3 mb-3">
            <View className="flex-row justify-between">
              <Text style={{ fontFamily: 'PlusJakartaSans', fontSize: 13, color: '#928F9E' }}>
                Printing ({currentDoc.pages} pages × {copies} set)
              </Text>
              <Text style={{ fontFamily: 'PlusJakartaSans', fontSize: 13, color: '#E5E1E4', fontWeight: '600' }}>
                {formatInr(quote.itemTotalPaise)}
              </Text>
            </View>

            {quote.bindingPaise > 0 ? (
              <View className="flex-row justify-between">
                <Text style={{ fontFamily: 'PlusJakartaSans', fontSize: 13, color: '#928F9E' }}>
                  {binding.toUpperCase()} Binding
                </Text>
                <Text style={{ fontFamily: 'PlusJakartaSans', fontSize: 13, color: '#E5E1E4', fontWeight: '600' }}>
                  {formatInr(quote.bindingPaise)}
                </Text>
              </View>
            ) : null}

            <View className="flex-row justify-between">
              <Text style={{ fontFamily: 'PlusJakartaSans', fontSize: 13, color: '#928F9E' }}>
                Express 30-min Delivery
              </Text>
              <Text style={{ fontFamily: 'PlusJakartaSans', fontSize: 13, color: '#10B981', fontWeight: '600' }}>
                {quote.deliveryFeePaise === 0 ? 'FREE' : formatInr(quote.deliveryFeePaise)}
              </Text>
            </View>
          </View>

          <View className="flex-row items-center justify-between mb-4">
            <Text style={{ fontFamily: 'PlusJakartaSans', fontSize: 15, fontWeight: '700', color: '#E5E1E4' }}>
              Total Bill
            </Text>
            <Text style={{ fontFamily: 'PlusJakartaSans', fontSize: 20, fontWeight: '800', color: '#C8BFFF' }}>
              {formatInr(quote.totalPaise)}
            </Text>
          </View>

          <DFCPressable
            onPress={() => void onOrderPrint()}
            disabled={busy}
            scaleTo={0.97}
            style={{
              backgroundColor: '#6A5ACD',
              paddingVertical: 14,
              borderRadius: 14,
              alignItems: 'center',
              justifyContent: 'center',
              shadowColor: '#6A5ACD',
              shadowOpacity: 0.3,
              shadowRadius: 10,
              elevation: 4,
            }}
          >
            <Text
              style={{
                fontFamily: 'PlusJakartaSans',
                fontSize: 15,
                fontWeight: '700',
                color: '#FFFFFF',
              }}
            >
              {busy ? 'Adding to Cart...' : 'Add Print Order to Cart →'}
            </Text>
          </DFCPressable>
        </View>
      </ScrollView>
    </Screen>
  );
}
