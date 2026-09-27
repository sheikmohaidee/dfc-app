/**
 * Vendor Merchant Earnings & Escrow Settlement — Stitch Dark Floating Theme
 *
 * Displays:
 * - Real-time merchant revenue & pending escrow
 * - Weekly settlement schedule (Auto-credit Monday 6:00 AM)
 * - Financial breakdown (Gross sales, DFC commission, packaging, net payable)
 * - Prepaid vs COD split
 * - Settlement history with UTR tracking and PDF invoices
 */

import * as React from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import {
  ArrowLeft,
  Banknote,
  Calendar,
  CheckCircle2,
  Clock,
  Download,
  FileText,
  HelpCircle,
  Receipt,
  ShieldCheck,
  Store,
  TrendingUp,
  Wallet,
  Zap,
} from 'lucide-react-native';

import { formatInr } from '@dfc/core';
import { useAuth } from '@/providers/auth';
import { VendorStitchNav } from '@/ui/vendor-nav';

export default function VendorPayouts() {
  const router = useRouter();
  const { profile } = useAuth();

  const handleDownloadReport = () => {
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert('Report Exported', 'Merchant Weekly Payout Statement (PDF) downloaded to device.');
  };

  const handleDownloadInvoice = (utr: string) => {
    void Haptics.selectionAsync();
    Alert.alert('Tax Invoice', `Downloading GST invoice for settlement UTR #${utr}...`);
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#0E0E10' }}>
      {/* Header */}
      <View
        style={{
          paddingTop: 48,
          paddingHorizontal: 16,
          paddingBottom: 12,
          backgroundColor: '#18191B',
          borderBottomWidth: 1,
          borderBottomColor: '#201F21',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
          <View
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              backgroundColor: '#201F21',
              alignItems: 'center',
              justifyContent: 'center',
              borderWidth: 1,
              borderColor: '#2A2A2C',
            }}
          >
            <Wallet size={18} color="#7BD0FF" />
          </View>
          <View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
              <View style={{ width: 6, height: 6, borderRadius: 9999, backgroundColor: '#10B981' }} />
              <Text style={{ fontSize: 10, fontFamily: 'PlusJakartaSans_700Bold', color: '#10B981' }}>
                ONLINE STORE
              </Text>
            </View>
            <Text
              style={{
                fontSize: 16,
                fontFamily: 'PlusJakartaSans_800ExtraBold',
                fontWeight: '800',
                color: '#E5E1E4',
                letterSpacing: -0.2,
              }}
            >
              Merchant Earnings
            </Text>
          </View>
        </View>

        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 4,
            paddingHorizontal: 10,
            paddingVertical: 5,
            borderRadius: 9999,
            backgroundColor: '#201F21',
            borderWidth: 1,
            borderColor: '#2A2A2C',
          }}
        >
          <Store size={13} color="#7BD0FF" />
          <Text style={{ fontSize: 11, fontFamily: 'PlusJakartaSans_600SemiBold', color: '#C9C4D5' }}>
            Indiranagar
          </Text>
        </View>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 14, paddingBottom: 120, gap: 14 }}
      >
        {/* Total Escrow Card */}
        <View
          style={{
            borderRadius: 20,
            backgroundColor: '#1C1B1D',
            padding: 18,
            borderWidth: 1,
            borderColor: '#2A2A2C',
            gap: 12,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 12 },
            shadowOpacity: 0.7,
            shadowRadius: 24,
          }}
        >
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text
              style={{
                fontSize: 11,
                fontFamily: 'PlusJakartaSans_800ExtraBold',
                fontWeight: '800',
                color: '#928F9E',
                letterSpacing: 0.8,
                textTransform: 'uppercase',
              }}
            >
              PENDING ESCROW PAYOUT
            </Text>
            <View
              style={{
                backgroundColor: 'rgba(123, 208, 255, 0.15)',
                paddingHorizontal: 8,
                paddingVertical: 3,
                borderRadius: 9999,
              }}
            >
              <Text style={{ fontSize: 10, fontFamily: 'PlusJakartaSans_700Bold', color: '#7BD0FF' }}>
                AUTO-SETTLE READY
              </Text>
            </View>
          </View>

          <View>
            <Text
              style={{
                fontSize: 34,
                fontFamily: 'PlusJakartaSans_800ExtraBold',
                fontWeight: '800',
                color: '#E5E1E4',
                letterSpacing: -1,
              }}
            >
              ₹48,250.00
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 }}>
              <Clock size={13} color="#FFB59C" />
              <Text style={{ fontSize: 12, color: '#FFB59C', fontFamily: 'PlusJakartaSans_600SemiBold' }}>
                Next settlement: Tomorrow, 6:00 AM via UPI / Escrow
              </Text>
            </View>
          </View>

          <View
            style={{
              backgroundColor: '#201F21',
              borderRadius: 12,
              padding: 10,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <ShieldCheck size={16} color="#10B981" />
              <Text style={{ fontSize: 11, color: '#E5E1E4', fontFamily: 'PlusJakartaSans_500Medium' }}>
                Verified Bank: HDFC Bank •••• 9102
              </Text>
            </View>
            <Text style={{ fontSize: 11, fontFamily: 'PlusJakartaSans_700Bold', color: '#C8BFFF' }}>
              Instant
            </Text>
          </View>
        </View>

        {/* Financial Breakdown Bento */}
        <View
          style={{
            borderRadius: 20,
            backgroundColor: '#201F21',
            padding: 16,
            borderWidth: 1,
            borderColor: '#2A2A2C',
            gap: 10,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Text style={{ fontSize: 14, fontFamily: 'PlusJakartaSans_700Bold', color: '#E5E1E4' }}>
              Cycle Breakdown (This Week)
            </Text>
            <Text style={{ fontSize: 11, color: '#928F9E' }}>Sep 15 – Sep 21</Text>
          </View>

          <View style={{ gap: 8, marginTop: 4 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={{ fontSize: 12, color: '#928F9E' }}>Gross Customer Sales (46 orders)</Text>
              <Text style={{ fontSize: 12, color: '#E5E1E4', fontWeight: '600' }}>₹52,445.00</Text>
            </View>

            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={{ fontSize: 12, color: '#928F9E' }}>Packaging Fee Collected</Text>
              <Text style={{ fontSize: 12, color: '#E5E1E4', fontWeight: '600' }}>+₹820.00</Text>
            </View>

            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={{ fontSize: 12, color: '#FFB4AB' }}>DFC Platform Commission (8%)</Text>
              <Text style={{ fontSize: 12, color: '#FFB4AB', fontWeight: '600' }}>-₹4,195.00</Text>
            </View>

            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={{ fontSize: 12, color: '#928F9E' }}>TDS & TCS Withholding (1%)</Text>
              <Text style={{ fontSize: 12, color: '#928F9E', fontWeight: '600' }}>-₹524.45</Text>
            </View>

            <View style={{ height: 1, backgroundColor: '#2A2A2C', marginVertical: 4 }} />

            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <View>
                <Text style={{ fontSize: 14, fontFamily: 'PlusJakartaSans_700Bold', color: '#E5E1E4' }}>
                  Total Cycle Net Payable
                </Text>
                <Text style={{ fontSize: 10, color: '#928F9E' }}>Direct merchant remittance</Text>
              </View>
              <Text
                style={{
                  fontSize: 20,
                  fontFamily: 'PlusJakartaSans_800ExtraBold',
                  fontWeight: '800',
                  color: '#C8BFFF',
                }}
              >
                ₹48,545.55
              </Text>
            </View>
          </View>
        </View>

        {/* Payment Channels (Prepaid vs COD) */}
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <View
            style={{
              flex: 1,
              backgroundColor: '#201F21',
              borderRadius: 16,
              padding: 14,
              borderWidth: 1,
              borderColor: '#2A2A2C',
              gap: 4,
            }}
          >
            <Text style={{ fontSize: 11, color: '#928F9E', fontFamily: 'PlusJakartaSans_500Medium' }}>
              Prepaid (UPI/Card)
            </Text>
            <Text
              style={{
                fontSize: 18,
                fontFamily: 'PlusJakartaSans_800ExtraBold',
                fontWeight: '800',
                color: '#E5E1E4',
              }}
            >
              ₹38,125
            </Text>
            <Text style={{ fontSize: 10, color: '#7BD0FF', marginTop: 2 }}>In Escrow (Safe)</Text>
          </View>

          <View
            style={{
              flex: 1,
              backgroundColor: '#201F21',
              borderRadius: 16,
              padding: 14,
              borderWidth: 1,
              borderColor: '#2A2A2C',
              gap: 4,
            }}
          >
            <Text style={{ fontSize: 11, color: '#928F9E', fontFamily: 'PlusJakartaSans_500Medium' }}>
              Cash on Delivery
            </Text>
            <Text
              style={{
                fontSize: 18,
                fontFamily: 'PlusJakartaSans_800ExtraBold',
                fontWeight: '800',
                color: '#E5E1E4',
              }}
            >
              ₹10,125
            </Text>
            <Text style={{ fontSize: 10, color: '#FFB59C', marginTop: 2 }}>Rider reconciled</Text>
          </View>
        </View>

        {/* Settlement History */}
        <View style={{ gap: 10 }}>
          <Text
            style={{
              fontSize: 11,
              fontFamily: 'PlusJakartaSans_800ExtraBold',
              fontWeight: '800',
              color: '#928F9E',
              letterSpacing: 0.8,
              textTransform: 'uppercase',
            }}
          >
            RECENT SETTLEMENTS
          </Text>

          {[
            { date: '14 Sep 2026', amount: '₹42,180.00', utr: 'HDFC009214981', status: 'Settled' },
            { date: '07 Sep 2026', amount: '₹39,850.00', utr: 'HDFC008812301', status: 'Settled' },
            { date: '31 Aug 2026', amount: '₹45,210.00', utr: 'HDFC007901192', status: 'Settled' },
          ].map((item, idx) => (
            <View
              key={idx}
              style={{
                borderRadius: 16,
                backgroundColor: '#201F21',
                padding: 14,
                borderWidth: 1,
                borderColor: '#2A2A2C',
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <View>
                <Text style={{ fontSize: 14, fontFamily: 'PlusJakartaSans_700Bold', color: '#E5E1E4' }}>
                  {item.amount}
                </Text>
                <Text style={{ fontSize: 11, color: '#928F9E', marginTop: 1 }}>
                  {item.date} • UTR: {item.utr}
                </Text>
              </View>

              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Download Invoice for ${item.utr}`}
                onPress={() => handleDownloadInvoice(item.utr)}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 4,
                  paddingHorizontal: 10,
                  paddingVertical: 6,
                  borderRadius: 8,
                  backgroundColor: '#2A2A2C',
                }}
              >
                <Download size={13} color="#7BD0FF" />
                <Text style={{ fontSize: 11, fontFamily: 'PlusJakartaSans_600SemiBold', color: '#7BD0FF' }}>
                  Invoice
                </Text>
              </Pressable>
            </View>
          ))}
        </View>

        {/* Export Statement CTA */}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Download Statement"
          onPress={handleDownloadReport}
          style={{
            height: 50,
            borderRadius: 16,
            backgroundColor: '#6A5ACD',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            marginTop: 4,
            shadowColor: '#6A5ACD',
            shadowOffset: { width: 0, height: 6 },
            shadowOpacity: 0.5,
            shadowRadius: 16,
          }}
        >
          <FileText size={18} color="#F0EBFF" />
          <Text style={{ fontSize: 13, fontFamily: 'PlusJakartaSans_700Bold', color: '#F0EBFF' }}>
            Download Weekly Merchant Statement (PDF)
          </Text>
        </Pressable>
      </ScrollView>

      {/* Floating Bottom Nav */}
      <VendorStitchNav activeTab="earnings" />
    </View>
  );
}
