/**
 * Vendor Order History — Stitch Dark Floating Theme
 * Implements 07 — Order History
 *
 * Features:
 * - Search bar with barcode scanner trigger
 * - Date Range Tabs: Today (46), Yesterday (58), Last 7 Days, Custom
 * - Fulfillment Bento Card: Fulfilled ₹48,250, Avg Prep 13.8m, On-Time 98%
 * - Status Filter Chips (All, Completed, Cancelled, Disputed)
 * - Order history cards with captain info, item breakdown, and incident compensation
 * - KOT view, Tax invoice download, Daily CSV report export
 */

import * as React from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import {
  AlertTriangle,
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Clock,
  Download,
  FileSpreadsheet,
  Filter,
  MapPin,
  QrCode,
  Receipt,
  Search,
  Star,
  Store,
  TrendingUp,
  Truck,
  XCircle,
} from 'lucide-react-native';

import { VendorStitchNav } from '@/ui/vendor-nav';
import { useAuth } from '@/providers/auth';

type DateFilter = 'today' | 'yesterday' | 'week' | 'custom';
type StatusFilter = 'all' | 'completed' | 'cancelled' | 'disputed';

export default function VendorOrderHistory() {
  const router = useRouter();
  const { profile } = useAuth();

  const [dateFilter, setDateFilter] = React.useState<DateFilter>('today');
  const [statusFilter, setStatusFilter] = React.useState<StatusFilter>('all');
  const [searchQuery, setSearchQuery] = React.useState('');

  const handleExportCsv = () => {
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert('Report Exported', 'Daily Order Fulfillment Report (CSV) sent to registered merchant email.');
  };

  const handleViewKot = (code: string) => {
    void Haptics.selectionAsync();
    Alert.alert(`KOT Receipt #${code}`, 'Thermal Kitchen Order Ticket preview loaded.');
  };

  const handleTaxInvoice = (code: string) => {
    void Haptics.selectionAsync();
    Alert.alert(`Tax Invoice #${code}`, 'Downloading GST compliant tax invoice PDF...');
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
            <Receipt size={18} color="#C8BFFF" />
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
              Order History
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
        {/* Search Bar with Scanner Trigger */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: '#1C1B1D',
            borderRadius: 14,
            paddingHorizontal: 12,
            paddingVertical: 10,
            borderWidth: 1,
            borderColor: '#2A2A2C',
            gap: 8,
          }}
        >
          <Search size={18} color="#928F9E" />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search Order #, Customer, or Dish..."
            placeholderTextColor="#928F9E"
            style={{
              flex: 1,
              fontSize: 13,
              fontFamily: 'PlusJakartaSans_500Medium',
              color: '#E5E1E4',
              padding: 0,
            }}
          />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Barcode Scanner"
            onPress={() => Alert.alert('Barcode Scanner', 'Opening camera to scan kitchen receipt barcode...')}
            style={{
              padding: 6,
              borderRadius: 8,
              backgroundColor: '#2A2A2C',
            }}
          >
            <QrCode size={16} color="#C9C4D5" />
          </Pressable>
        </View>

        {/* Date Range Tabs */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
          {[
            { id: 'today', label: 'Today (46)' },
            { id: 'yesterday', label: 'Yesterday (58)' },
            { id: 'week', label: 'Last 7 Days' },
            { id: 'custom', label: 'Custom Range ▾' },
          ].map((tab) => {
            const isSelected = dateFilter === tab.id;
            return (
              <Pressable
                key={tab.id}
                onPress={() => {
                  void Haptics.selectionAsync();
                  setDateFilter(tab.id as DateFilter);
                }}
                style={{
                  paddingHorizontal: 14,
                  paddingVertical: 7,
                  borderRadius: 9999,
                  backgroundColor: isSelected ? '#6A5ACD' : '#201F21',
                  borderWidth: 1,
                  borderColor: isSelected ? '#6A5ACD' : '#2A2A2C',
                }}
              >
                <Text
                  style={{
                    fontSize: 12,
                    fontFamily: 'PlusJakartaSans_600SemiBold',
                    color: isSelected ? '#F0EBFF' : '#928F9E',
                  }}
                >
                  {tab.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* Operational Summary Strip (Bento Card) */}
        <View
          style={{
            borderRadius: 18,
            backgroundColor: '#1C1B1D',
            padding: 14,
            borderWidth: 1,
            borderColor: '#2A2A2C',
            gap: 10,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <TrendingUp size={16} color="#7BD0FF" />
              <Text
                style={{
                  fontSize: 10,
                  fontFamily: 'PlusJakartaSans_800ExtraBold',
                  fontWeight: '800',
                  color: '#928F9E',
                  letterSpacing: 0.8,
                  textTransform: 'uppercase',
                }}
              >
                TODAY'S FULFILLMENT
              </Text>
            </View>
            <View
              style={{
                backgroundColor: '#2A2A2C',
                paddingHorizontal: 7,
                paddingVertical: 2,
                borderRadius: 9999,
              }}
            >
              <Text style={{ fontSize: 9, fontFamily: 'PlusJakartaSans_700Bold', color: '#C8BFFF' }}>
                LIVE METRICS
              </Text>
            </View>
          </View>

          <View style={{ flexDirection: 'row', gap: 8 }}>
            <View style={{ flex: 1, backgroundColor: '#201F21', padding: 10, borderRadius: 12 }}>
              <Text style={{ fontSize: 10, color: '#928F9E', fontFamily: 'PlusJakartaSans_500Medium' }}>
                Fulfilled
              </Text>
              <Text
                style={{
                  fontSize: 16,
                  fontFamily: 'PlusJakartaSans_800ExtraBold',
                  fontWeight: '800',
                  color: '#E5E1E4',
                  marginTop: 2,
                }}
              >
                ₹48,250
              </Text>
            </View>

            <View style={{ flex: 1, backgroundColor: '#201F21', padding: 10, borderRadius: 12 }}>
              <Text style={{ fontSize: 10, color: '#928F9E', fontFamily: 'PlusJakartaSans_500Medium' }}>
                Avg Prep
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 }}>
                <Clock size={13} color="#7BD0FF" />
                <Text
                  style={{
                    fontSize: 16,
                    fontFamily: 'PlusJakartaSans_800ExtraBold',
                    fontWeight: '800',
                    color: '#E5E1E4',
                  }}
                >
                  13.8m
                </Text>
              </View>
            </View>

            <View style={{ flex: 1, backgroundColor: '#201F21', padding: 10, borderRadius: 12 }}>
              <Text style={{ fontSize: 10, color: '#928F9E', fontFamily: 'PlusJakartaSans_500Medium' }}>
                On-Time
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 }}>
                <CheckCircle2 size={13} color="#10B981" />
                <Text
                  style={{
                    fontSize: 16,
                    fontFamily: 'PlusJakartaSans_800ExtraBold',
                    fontWeight: '800',
                    color: '#E5E1E4',
                  }}
                >
                  98%
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Status Filter Chips */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
          {[
            { id: 'all', label: 'All Orders' },
            { id: 'completed', label: 'Completed (42)' },
            { id: 'cancelled', label: 'Cancelled / Refunded (3)' },
            { id: 'disputed', label: 'Disputed (1)' },
          ].map((chip) => {
            const isSelected = statusFilter === chip.id;
            return (
              <Pressable
                key={chip.id}
                onPress={() => {
                  void Haptics.selectionAsync();
                  setStatusFilter(chip.id as StatusFilter);
                }}
                style={{
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  borderRadius: 10,
                  backgroundColor: isSelected ? '#2A2A2C' : '#201F21',
                  borderWidth: 1,
                  borderColor: isSelected ? '#6A5ACD' : '#2A2A2C',
                }}
              >
                <Text
                  style={{
                    fontSize: 12,
                    fontFamily: 'PlusJakartaSans_600SemiBold',
                    color: isSelected ? '#C8BFFF' : '#928F9E',
                  }}
                >
                  {chip.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* Order Cards Stack */}
        <View style={{ gap: 12 }}>
          {/* Order 1: Delivered High Value */}
          <View
            style={{
              borderRadius: 18,
              backgroundColor: '#1C1B1D',
              padding: 14,
              borderWidth: 1,
              borderColor: '#2A2A2C',
              gap: 10,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <View
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 8,
                    backgroundColor: 'rgba(106, 90, 205, 0.2)',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Receipt size={16} color="#C8BFFF" />
                </View>
                <View>
                  <Text style={{ fontSize: 14, fontFamily: 'PlusJakartaSans_700Bold', color: '#E5E1E4' }}>
                    #DFC-8490
                  </Text>
                  <Text style={{ fontSize: 10, color: '#928F9E' }}>7:15 PM • Dine-in Speed Prep</Text>
                </View>
              </View>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 4,
                  paddingHorizontal: 8,
                  paddingVertical: 2,
                  borderRadius: 9999,
                  backgroundColor: 'rgba(16, 185, 129, 0.15)',
                }}
              >
                <View style={{ width: 5, height: 5, borderRadius: 9999, backgroundColor: '#10B981' }} />
                <Text style={{ fontSize: 10, fontFamily: 'PlusJakartaSans_700Bold', color: '#10B981' }}>
                  Delivered
                </Text>
              </View>
            </View>

            {/* Customer & Payment Info Bar */}
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                backgroundColor: '#201F21',
                paddingHorizontal: 10,
                paddingVertical: 6,
                borderRadius: 10,
              }}
            >
              <Text style={{ fontSize: 12, color: '#E5E1E4', fontFamily: 'PlusJakartaSans_600SemiBold' }}>
                Anand V. <Text style={{ color: '#928F9E', fontWeight: '400' }}>• 3 items</Text>
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Text style={{ fontSize: 13, fontFamily: 'PlusJakartaSans_700Bold', color: '#E5E1E4' }}>
                  ₹890
                </Text>
                <View style={{ backgroundColor: '#2A2A2C', paddingHorizontal: 4, paddingVertical: 1, borderRadius: 4 }}>
                  <Text style={{ fontSize: 9, color: '#C8BFFF', fontWeight: '700' }}>UPI</Text>
                </View>
              </View>
            </View>

            {/* Dish Breakdown */}
            <View style={{ gap: 3, paddingLeft: 4 }}>
              <Text style={{ fontSize: 11, color: '#928F9E' }}>
                <Text style={{ color: '#C8BFFF', fontWeight: '700' }}>1x</Text> Smoked Pork Belly Sliders
              </Text>
              <Text style={{ fontSize: 11, color: '#928F9E' }}>
                <Text style={{ color: '#C8BFFF', fontWeight: '700' }}>1x</Text> Truffle Fries
              </Text>
              <Text style={{ fontSize: 11, color: '#928F9E' }}>
                <Text style={{ color: '#C8BFFF', fontWeight: '700' }}>1x</Text> Craft Ginger Ale
              </Text>
            </View>

            {/* Captain Badge */}
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                <Truck size={14} color="#FFB59C" />
                <Text style={{ fontSize: 11, color: '#928F9E' }}>
                  Captain: <Text style={{ color: '#E5E1E4', fontWeight: '600' }}>Suresh Kumar</Text> (Ather EV)
                </Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
                <Star size={12} color="#FFB59C" fill="#FFB59C" />
                <Text style={{ fontSize: 11, color: '#FFB59C', fontWeight: '700' }}>5.0</Text>
              </View>
            </View>

            {/* Action Buttons */}
            <View style={{ flexDirection: 'row', gap: 8, paddingTop: 4 }}>
              <Pressable
                onPress={() => handleViewKot('DFC-8490')}
                style={{
                  flex: 1,
                  height: 36,
                  borderRadius: 10,
                  backgroundColor: '#2A2A2C',
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                }}
              >
                <Receipt size={14} color="#E5E1E4" />
                <Text style={{ fontSize: 11, fontFamily: 'PlusJakartaSans_600SemiBold', color: '#E5E1E4' }}>
                  View KOT
                </Text>
              </Pressable>

              <Pressable
                onPress={() => handleTaxInvoice('DFC-8490')}
                style={{
                  flex: 1,
                  height: 36,
                  borderRadius: 10,
                  backgroundColor: '#201F21',
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                  borderWidth: 1,
                  borderColor: '#2A2A2C',
                }}
              >
                <Download size={14} color="#928F9E" />
                <Text style={{ fontSize: 11, fontFamily: 'PlusJakartaSans_600SemiBold', color: '#C9C4D5' }}>
                  Tax Invoice
                </Text>
              </Pressable>
            </View>
          </View>

          {/* Order 2: Delivered Wings */}
          <View
            style={{
              borderRadius: 18,
              backgroundColor: '#1C1B1D',
              padding: 14,
              borderWidth: 1,
              borderColor: '#2A2A2C',
              gap: 8,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <View
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 8,
                    backgroundColor: 'rgba(106, 90, 205, 0.2)',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Receipt size={16} color="#C8BFFF" />
                </View>
                <View>
                  <Text style={{ fontSize: 14, fontFamily: 'PlusJakartaSans_700Bold', color: '#E5E1E4' }}>
                    #DFC-8482
                  </Text>
                  <Text style={{ fontSize: 10, color: '#928F9E' }}>6:40 PM • Express Dispatch</Text>
                </View>
              </View>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 4,
                  paddingHorizontal: 8,
                  paddingVertical: 2,
                  borderRadius: 9999,
                  backgroundColor: 'rgba(16, 185, 129, 0.15)',
                }}
              >
                <View style={{ width: 5, height: 5, borderRadius: 9999, backgroundColor: '#10B981' }} />
                <Text style={{ fontSize: 10, fontFamily: 'PlusJakartaSans_700Bold', color: '#10B981' }}>
                  Delivered
                </Text>
              </View>
            </View>

            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                backgroundColor: '#201F21',
                paddingHorizontal: 10,
                paddingVertical: 6,
                borderRadius: 10,
              }}
            >
              <Text style={{ fontSize: 12, color: '#E5E1E4', fontFamily: 'PlusJakartaSans_600SemiBold' }}>
                Meera Sen <Text style={{ color: '#928F9E', fontWeight: '400' }}>• 2 items</Text>
              </Text>
              <Text style={{ fontSize: 13, fontFamily: 'PlusJakartaSans_700Bold', color: '#E5E1E4' }}>
                ₹640
              </Text>
            </View>

            <Text style={{ fontSize: 11, color: '#928F9E', paddingLeft: 4 }}>
              <Text style={{ color: '#C8BFFF', fontWeight: '700' }}>2x</Text> BBQ Glazed Wings (8 pcs)
            </Text>
          </View>

          {/* Order 3: Cancelled / Rain Surge */}
          <View
            style={{
              borderRadius: 18,
              backgroundColor: '#1C1B1D',
              padding: 14,
              borderWidth: 1,
              borderColor: 'rgba(147, 0, 10, 0.3)',
              gap: 8,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <View
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 8,
                    backgroundColor: 'rgba(147, 0, 10, 0.2)',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <XCircle size={16} color="#FFB4AB" />
                </View>
                <View>
                  <Text style={{ fontSize: 14, fontFamily: 'PlusJakartaSans_700Bold', color: '#E5E1E4' }}>
                    #DFC-8475
                  </Text>
                  <Text style={{ fontSize: 10, color: '#928F9E' }}>5:50 PM • Customer Cancellation</Text>
                </View>
              </View>
              <View
                style={{
                  paddingHorizontal: 8,
                  paddingVertical: 2,
                  borderRadius: 9999,
                  backgroundColor: 'rgba(147, 0, 10, 0.3)',
                }}
              >
                <Text style={{ fontSize: 10, fontFamily: 'PlusJakartaSans_700Bold', color: '#FFB4AB' }}>
                  Cancelled
                </Text>
              </View>
            </View>

            {/* Incident Callout */}
            <View style={{ backgroundColor: '#201F21', borderRadius: 10, padding: 10, gap: 4 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <AlertTriangle size={14} color="#FFB59C" />
                <Text style={{ fontSize: 11, color: '#928F9E', flex: 1, lineHeight: 16 }}>
                  Reason: Delay exceeded 40 mins due to severe surge rain in catchment.
                </Text>
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 }}>
                <Text style={{ fontSize: 11, color: '#928F9E' }}>Merchant Compensation:</Text>
                <Text style={{ fontSize: 11, fontFamily: 'PlusJakartaSans_700Bold', color: '#10B981' }}>
                  +₹240 Credited
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Pagination & Export Daily Report Action */}
        <View style={{ alignItems: 'center', gap: 10, marginTop: 6 }}>
          <Text style={{ fontSize: 12, color: '#928F9E' }}>
            Showing <Text style={{ color: '#E5E1E4', fontWeight: '700' }}>46</Text> fulfilled orders today
          </Text>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Export Daily Report CSV"
            onPress={handleExportCsv}
            style={{
              width: '100%',
              height: 50,
              borderRadius: 16,
              backgroundColor: '#6A5ACD',
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              shadowColor: '#6A5ACD',
              shadowOffset: { width: 0, height: 6 },
              shadowOpacity: 0.5,
              shadowRadius: 16,
            }}
          >
            <FileSpreadsheet size={18} color="#F0EBFF" />
            <Text style={{ fontSize: 13, fontFamily: 'PlusJakartaSans_700Bold', color: '#F0EBFF' }}>
              Export Daily Report (CSV)
            </Text>
          </Pressable>
        </View>
      </ScrollView>

      {/* Floating Bottom Nav */}
      <VendorStitchNav activeTab="history" />
    </View>
  );
}
