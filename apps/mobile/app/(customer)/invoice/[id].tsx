/**
 * The tax invoice.
 *
 * Laid out like a document rather than an app screen, because that is what it
 * is — people forward these to an employer or a CA, and a card-based app
 * aesthetic makes it look unofficial.
 *
 * The two-part structure is the point: goods DFC bought on the customer's
 * behalf carry no DFC GST (pure agent, Rule 33), and only the delivery and
 * service fees are DFC's taxable supply. Showing them mixed together would be
 * a wrong invoice that happens to add up.
 */

import * as React from 'react';
import { ScrollView, Share, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Animated, { FadeIn } from 'react-native-reanimated';
import { ArrowLeft, Share2 } from 'lucide-react-native';

import { formatInr, hasUnfilledPlaceholders, type Invoice } from '@dfc/core';

import { issueInvoice, invoiceAsText, subscribeInvoice } from '@/lib/payments';
import { PressableScale } from '@/ui/glass';
import { Button, Card, Divider, ErrorNote, Loading, Num, Screen, T, Ta } from '@/ui';

function Money({ paise, bold }: { paise: number; bold?: boolean }) {
  return (
    <Num className={`text-[13px] ${bold ? 'font-semibold' : ''}`}>{formatInr(paise)}</Num>
  );
}

function Row({
  label,
  labelTa,
  paise,
  bold,
  muted,
}: {
  label: string;
  labelTa?: string;
  paise: number;
  bold?: boolean;
  muted?: boolean;
}) {
  return (
    <View className="flex-row items-center justify-between py-1.5">
      <View>
        <T
          className={`text-[12.5px] ${bold ? 'font-semibold text-foreground' : muted ? 'text-muted-foreground' : 'text-body-strong'}`}
        >
          {label}
        </T>
        {labelTa ? <Ta className="text-[10px]">{labelTa}</Ta> : null}
      </View>
      <Money paise={paise} bold={bold} />
    </View>
  );
}

export default function InvoiceScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const [invoice, setInvoice] = React.useState<Invoice | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!id) return;
    return subscribeInvoice(id, (inv) => {
      setInvoice(inv);
      setLoading(false);
    });
  }, [id]);

  // No invoice yet — issue it. Idempotent, and the transaction inside means two
  // devices opening this at once still produce one document.
  React.useEffect(() => {
    if (loading || invoice || !id) return;
    void issueInvoice(id).catch((e) => setError((e as Error).message));
  }, [loading, invoice, id]);

  if (loading || (!invoice && !error)) {
    return (
      <Screen>
        <Loading />
      </Screen>
    );
  }

  if (!invoice) {
    return (
      <Screen>
        <View className="flex-1 justify-center gap-3 px-6">
          <ErrorNote message={error ?? 'That invoice could not be issued.'} />
          <Button variant="outline" size="md" label="Go back" onPress={() => router.back()} />
        </View>
      </Screen>
    );
  }

  const goods = invoice.lines.filter((l) => l.kind === 'reimbursement');
  const services = invoice.lines.filter((l) => l.kind === 'service');

  return (
    <Screen>
      <View className="flex-row items-center gap-2.5 border-b border-muted px-4 pb-3 pt-2">
        <PressableScale
          to={0.9}
          onPress={() => router.back()}
          className="-ml-2 size-9 items-center justify-center"
        >
          <ArrowLeft size={21} color="#18181B" strokeWidth={2} />
        </PressableScale>
        <T className="flex-1 text-[17px] font-semibold tracking-[-0.3px]">Tax invoice</T>
        <PressableScale
          to={0.9}
          haptic
          onPress={() =>
            void Share.share({ message: invoiceAsText(invoice), title: invoice.number })
          }
          accessibilityLabel="Share invoice"
          className="size-9 items-center justify-center"
        >
          <Share2 size={19} color="#18181B" strokeWidth={2} />
        </PressableScale>
      </View>

      <ScrollView className="flex-1 bg-surface" contentContainerClassName="px-4 py-5 pb-12 gap-4">
        {hasUnfilledPlaceholders() ? (
          <Card className="border-verify-border bg-verify-tint p-3.5">
            <T className="text-[12px] leading-[18px] text-verify-fg">
              This invoice carries placeholder company details. Fill in COMPANY in
              packages/core/src/legal.ts — a GST invoice without a real GSTIN is not valid.
            </T>
          </Card>
        ) : null}

        <Animated.View entering={FadeIn}>
          <Card className="gap-4 p-5">
            {/* Masthead */}
            <View className="gap-1">
              <View className="flex-row items-start justify-between">
                <View className="flex-1">
                  <T className="text-[16px] font-semibold tracking-[-0.3px]">
                    {invoice.supplier.name}
                  </T>
                  <T className="mt-1 text-[11px] leading-[16px] text-muted-foreground">
                    {invoice.supplier.address}
                  </T>
                  <Num className="mt-1 text-[11px] text-muted-foreground">
                    GSTIN {invoice.supplier.gstin}
                  </Num>
                  {invoice.supplier.fssai ? (
                    <Num className="text-[11px] text-muted-foreground">
                      FSSAI {invoice.supplier.fssai}
                    </Num>
                  ) : null}
                </View>
                <View className="size-9 items-center justify-center rounded-[10px] bg-primary">
                  <T className="text-[15px] font-semibold text-primary-foreground">D</T>
                </View>
              </View>
            </View>

            <Divider className="bg-border" />

            <View className="flex-row justify-between">
              <View className="gap-0.5">
                <T className="text-[9.5px] font-bold tracking-[0.9px] text-placeholder">
                  INVOICE NO.
                </T>
                <Num className="text-[12.5px] font-semibold">{invoice.number}</Num>
              </View>
              <View className="items-end gap-0.5">
                <T className="text-[9.5px] font-bold tracking-[0.9px] text-placeholder">DATE</T>
                <Num className="text-[12.5px]">
                  {new Date(invoice.issuedAt).toLocaleDateString('en-IN', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                  })}
                </Num>
              </View>
            </View>

            <View className="gap-0.5">
              <T className="text-[9.5px] font-bold tracking-[0.9px] text-placeholder">BILLED TO</T>
              <T className="text-[13px] font-medium">{invoice.customer.name}</T>
              <T className="text-[11.5px] leading-[16px] text-muted-foreground">
                {invoice.customer.address}
                {invoice.customer.phone ? `\n${invoice.customer.phone}` : ''}
              </T>
            </View>

            <Divider className="bg-border" />

            {/* Goods — reimbursed, not taxed by DFC */}
            {goods.length ? (
              <View className="gap-1">
                <T className="text-[9.5px] font-bold tracking-[0.9px] text-placeholder">
                  GOODS PURCHASED ON YOUR BEHALF
                </T>
                {goods.map((l, i) => (
                  <View key={i} className="flex-row items-center justify-between py-1">
                    <View className="flex-1 pr-3">
                      <T className="text-[12.5px]">{l.description}</T>
                      {l.quantity > 1 ? (
                        <Num className="text-[10px] text-placeholder">
                          {l.quantity} × {formatInr(l.unitPaise)}
                        </Num>
                      ) : null}
                    </View>
                    <Money paise={l.totalPaise} />
                  </View>
                ))}
                <View className="mt-1 flex-row items-center justify-between border-t border-muted pt-1.5">
                  <T className="text-[12px] font-medium text-body-strong">Reimbursement</T>
                  <Money paise={invoice.reimbursementPaise} bold />
                </View>
                <T className="text-[10.5px] leading-[15px] text-placeholder">
                  Sold by the store. GST on these is already inside the price they charge.
                </T>
              </View>
            ) : null}

            {/* Services — DFC's own taxable supply */}
            {services.length ? (
              <View className="gap-1">
                <T className="text-[9.5px] font-bold tracking-[0.9px] text-placeholder">
                  OUR SERVICES
                </T>
                {services.map((l, i) => (
                  <View key={i} className="flex-row items-center justify-between py-1">
                    <View className="flex-1 pr-3">
                      <T className="text-[12.5px]">{l.description}</T>
                      <Num className="text-[10px] text-placeholder">SAC {l.sac}</Num>
                    </View>
                    <Money paise={l.taxablePaise} />
                  </View>
                ))}
              </View>
            ) : null}

            <Divider className="bg-border" />

            {/* Totals */}
            <View>
              <Row label="Taxable value" paise={invoice.taxablePaise} muted />
              <Row label="CGST 9%" paise={invoice.cgstPaise} muted />
              <Row label="SGST 9%" paise={invoice.sgstPaise} muted />
              {invoice.reimbursementPaise > 0 ? (
                <Row label="Reimbursement" paise={invoice.reimbursementPaise} muted />
              ) : null}
              {invoice.roundOffPaise !== 0 ? (
                <Row label="Round off" paise={invoice.roundOffPaise} muted />
              ) : null}
            </View>

            <View className="flex-row items-center justify-between rounded-control bg-foreground px-4 py-3">
              <View>
                <T className="text-[12.5px] font-semibold text-white">Total</T>
                <Ta className="text-[10px] text-placeholder">மொத்தம்</Ta>
              </View>
              <Num
                style={{ fontSize: 22, fontWeight: '700', letterSpacing: -0.8 }}
                className="text-white"
              >
                {formatInr(invoice.totalPaise)}
              </Num>
            </View>

            <T className="text-[11.5px] italic leading-[17px] text-body-strong">
              {invoice.amountInWords}
            </T>

            <Divider className="bg-muted" />

            <View className="gap-1.5">
              <Num className="text-[10px] text-placeholder">
                Place of supply: {invoice.placeOfSupply}
              </Num>
              {invoice.notes.map((n, i) => (
                <T key={i} className="text-[10px] leading-[15px] text-placeholder">
                  {n}
                </T>
              ))}
              <T className="mt-1 text-[10px] text-placeholder">
                Computer generated invoice. No signature required.
              </T>
            </View>
          </Card>
        </Animated.View>

        <Button
          variant="outline"
          size="md"
          label="Share invoice"
          onPress={() =>
            void Share.share({ message: invoiceAsText(invoice), title: invoice.number })
          }
        />
      </ScrollView>
    </Screen>
  );
}
