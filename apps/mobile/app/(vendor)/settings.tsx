/**
 * Vendor Business Settings & Store Profile — Stitch Dark Floating Theme
 *
 * Implements:
 * - 15 — Vendor Profile & Identity
 * - 16 — Business Settings & Kitchen Floor Controls
 * - Store Open / Busy / Closed floor toggle
 * - Bluetooth Thermal KOT Printer Status
 * - Payout Bank Account Details
 * - Order Chime & Floor Buffer Controls
 */

import * as React from 'react';
import {
  Alert,
  Linking,
  Pressable,
  ScrollView,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  AlertTriangle,
  ArrowLeft,
  Bell,
  CheckCircle2,
  ChevronRight,
  Clock,
  ExternalLink,
  Flame,
  Globe,
  HelpCircle,
  LogOut,
  Moon,
  PauseCircle,
  Percent,
  Phone,
  Printer,
  Receipt,
  RotateCcw,
  Shield,
  ShieldCheck,
  Sparkles,
  Star,
  Store,
  Trash2,
  UtensilsCrossed,
  Volume2,
  Wallet,
  Zap,
} from 'lucide-react-native';

import { COMPANY, localityById, storeById } from '@dfc/core';
import { useAuth } from '@/providers/auth';
import { useLang } from '@/providers/language';
import { VendorStitchNav } from '@/ui/vendor-nav';

export default function VendorSettings() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, profile, signOut } = useAuth();
  const { mode, setMode } = useLang();

  const store = storeById(profile?.storeId ?? 'rest-the-smoke-co');

  // Business floor states
  const [storeOnline, setStoreOnline] = React.useState(true);
  const [autoAccept, setAutoAccept] = React.useState(false);
  const [printerConnected, setPrinterConnected] = React.useState(true);
  const [loudChime, setLoudChime] = React.useState(true);
  const [prepBufferMins, setPrepBufferMins] = React.useState(15);

  const handleSignOut = () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert('Sign Out', 'Are you sure you want to sign out from the Merchant App?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          await signOut();
          router.replace('/(auth)/sign-in');
        },
      },
    ]);
  };

  const handleTestPrint = () => {
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert(
      'KOT Thermal Test Print',
      'Test print sent to POS-80 Bluetooth Thermal Printer. Check kitchen feed roll.',
    );
  };

  const handleToggleStoreStatus = () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    const next = !storeOnline;
    setStoreOnline(next);
    Alert.alert(
      next ? 'Store Online' : 'Store Paused',
      next
        ? 'Your restaurant is now accepting new customer food orders.'
        : 'Store paused temporarily. Incoming orders are paused for 30 minutes.',
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#0E0E10' }}>
      {/* Top Header */}
      <View
        style={{
          paddingTop: Math.max(insets.top, 14),
          paddingHorizontal: 20,
          paddingBottom: 14,
          backgroundColor: '#18191B',
          borderBottomWidth: 1,
          borderBottomColor: '#222327',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <View
            style={{
              width: 38,
              height: 38,
              borderRadius: 10,
              backgroundColor: '#222327',
              alignItems: 'center',
              justifyContent: 'center',
              borderWidth: 1,
              borderColor: '#2A2A2E',
            }}
          >
            <Store size={20} color="#6A5ACD" />
          </View>
          <View>
            <Text
              style={{
                fontSize: 16,
                fontFamily: 'PlusJakartaSans_800ExtraBold',
                fontWeight: '800',
                color: '#F4F4F5',
              }}
            >
              Merchant Settings
            </Text>
            <Text style={{ fontSize: 11, color: '#A1A1AA' }}>
              Kitchen Controls & Store Profile
            </Text>
          </View>
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Sign Out"
          onPress={handleSignOut}
          style={{
            backgroundColor: 'rgba(239, 68, 68, 0.12)',
            paddingHorizontal: 10,
            paddingVertical: 6,
            borderRadius: 8,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 4,
          }}
        >
          <LogOut size={13} color="#EF4444" />
          <Text style={{ fontSize: 11, fontWeight: '700', color: '#EF4444' }}>Sign Out</Text>
        </Pressable>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 16, paddingBottom: 110, gap: 16 }}
      >
        {/* STORE PROFILE CARD */}
        <View
          style={{
            backgroundColor: '#18191B',
            borderRadius: 20,
            padding: 18,
            borderWidth: 1,
            borderColor: '#222327',
            gap: 16,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
            <View
              style={{
                width: 56,
                height: 56,
                borderRadius: 14,
                backgroundColor: '#222327',
                alignItems: 'center',
                justifyContent: 'center',
                borderWidth: 2,
                borderColor: storeOnline ? '#10B981' : '#71717A',
              }}
            >
              <UtensilsCrossed size={28} color={storeOnline ? '#10B981' : '#71717A'} />
            </View>

            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Text
                  style={{
                    fontSize: 17,
                    fontFamily: 'PlusJakartaSans_800ExtraBold',
                    fontWeight: '800',
                    color: '#F4F4F5',
                  }}
                >
                  {store?.name || profile?.name || 'The Smoke Co. Madurai'}
                </Text>
                <View
                  style={{
                    backgroundColor: storeOnline
                      ? 'rgba(16, 185, 129, 0.2)'
                      : 'rgba(239, 68, 68, 0.2)',
                    paddingHorizontal: 6,
                    paddingVertical: 2,
                    borderRadius: 4,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 10,
                      fontWeight: '800',
                      color: storeOnline ? '#34D399' : '#F87171',
                    }}
                  >
                    {storeOnline ? 'LIVE' : 'PAUSED'}
                  </Text>
                </View>
              </View>

              <Text style={{ fontSize: 12, color: '#A1A1AA', marginTop: 2 }}>
                FSSAI Reg: #12421999000142 · Tax SAC: 996331
              </Text>
              <Text style={{ fontSize: 11, color: '#71717A', marginTop: 1 }}>
                Locality: {localityById(store?.localityId ?? profile?.localityId)?.name ?? 'KK Nagar, Madurai'}
              </Text>
            </View>
          </View>

          {/* Floor Status Quick Switch */}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={storeOnline ? 'Pause Accepting Orders' : 'Resume Accepting Orders'}
            onPress={handleToggleStoreStatus}
            style={{
              backgroundColor: storeOnline ? 'rgba(239, 68, 68, 0.12)' : 'rgba(16, 185, 129, 0.15)',
              borderRadius: 12,
              paddingVertical: 12,
              alignItems: 'center',
              justifyContent: 'center',
              borderWidth: 1,
              borderColor: storeOnline ? 'rgba(239, 68, 68, 0.35)' : '#10B981',
              flexDirection: 'row',
              gap: 8,
            }}
          >
            {storeOnline ? (
              <>
                <PauseCircle size={16} color="#EF4444" />
                <Text style={{ fontSize: 13, fontWeight: '700', color: '#EF4444' }}>
                  Pause Taking New Orders (Kitchen Rush)
                </Text>
              </>
            ) : (
              <>
                <Zap size={16} color="#10B981" />
                <Text style={{ fontSize: 13, fontWeight: '700', color: '#10B981' }}>
                  Resume Accepting Orders (Go Online)
                </Text>
              </>
            )}
          </Pressable>
        </View>

        {/* KITCHEN FLOOR & DISPATCH CONTROLS */}
        <View
          style={{
            backgroundColor: '#18191B',
            borderRadius: 18,
            padding: 18,
            borderWidth: 1,
            borderColor: '#222327',
            gap: 14,
          }}
        >
          <Text style={{ fontSize: 12, fontWeight: '800', color: '#71717A', letterSpacing: 0.5 }}>
            KITCHEN FLOOR CONTROLS
          </Text>

          {/* Auto-Accept Orders */}
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={{ fontSize: 13, fontWeight: '700', color: '#F4F4F5' }}>
                Auto-Accept Food Orders
              </Text>
              <Text style={{ fontSize: 11, color: '#71717A' }}>
                Automatically accept incoming orders within 15 seconds
              </Text>
            </View>
            <Switch
              value={autoAccept}
              onValueChange={setAutoAccept}
              thumbColor={autoAccept ? '#6A5ACD' : '#71717A'}
              trackColor={{ false: '#222327', true: 'rgba(106, 90, 205, 0.4)' }}
            />
          </View>

          <View style={{ height: 1, backgroundColor: '#222327' }} />

          {/* Default Preparation Time Buffer */}
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <View style={{ gap: 2 }}>
              <Text style={{ fontSize: 13, fontWeight: '700', color: '#F4F4F5' }}>
                Default Prep Buffer
              </Text>
              <Text style={{ fontSize: 11, color: '#71717A' }}>
                Sent to Captain dispatch algorithm
              </Text>
            </View>

            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              {[10, 15, 20, 30].map((mins) => (
                <Pressable
                  key={mins}
                  onPress={() => {
                    setPrepBufferMins(mins);
                    void Haptics.selectionAsync();
                  }}
                  style={{
                    backgroundColor: prepBufferMins === mins ? '#6A5ACD' : '#222327',
                    paddingHorizontal: 8,
                    paddingVertical: 5,
                    borderRadius: 6,
                    borderWidth: 1,
                    borderColor: prepBufferMins === mins ? '#6A5ACD' : '#2A2A2E',
                  }}
                >
                  <Text
                    style={{
                      fontSize: 11,
                      fontWeight: '700',
                      color: prepBufferMins === mins ? '#FFFFFF' : '#A1A1AA',
                    }}
                  >
                    {mins}m
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          <View style={{ height: 1, backgroundColor: '#222327' }} />

          {/* Loud Kitchen Chime */}
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={{ fontSize: 13, fontWeight: '700', color: '#F4F4F5' }}>
                High-Volume Kitchen Audio Chime
              </Text>
              <Text style={{ fontSize: 11, color: '#71717A' }}>
                Plays siren sound through device speaker on new tickets
              </Text>
            </View>
            <Switch
              value={loudChime}
              onValueChange={setLoudChime}
              thumbColor={loudChime ? '#FF7F50' : '#71717A'}
              trackColor={{ false: '#222327', true: 'rgba(255, 127, 80, 0.4)' }}
            />
          </View>
        </View>

        {/* THERMAL PRINTER (KOT) SETTINGS */}
        <View
          style={{
            backgroundColor: '#18191B',
            borderRadius: 18,
            padding: 18,
            borderWidth: 1,
            borderColor: '#222327',
            gap: 12,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Text style={{ fontSize: 12, fontWeight: '800', color: '#71717A', letterSpacing: 0.5 }}>
              THERMAL KOT PRINTER
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <View style={{ width: 6, height: 6, borderRadius: 9999, backgroundColor: '#10B981' }} />
              <Text style={{ fontSize: 11, fontWeight: '700', color: '#10B981' }}>
                CONNECTED
              </Text>
            </View>
          </View>

          <View
            style={{
              backgroundColor: '#222327',
              borderRadius: 12,
              padding: 12,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <Printer size={20} color="#F4F4F5" />
              <View>
                <Text style={{ fontSize: 13, fontWeight: '700', color: '#F4F4F5' }}>
                  POS-80 Bluetooth Receipt Printer
                </Text>
                <Text style={{ fontSize: 11, color: '#A1A1AA' }}>
                  Auto-print on order acceptance: ENABLED
                </Text>
              </View>
            </View>
            <CheckCircle2 size={18} color="#10B981" />
          </View>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Test Thermal Print"
            onPress={handleTestPrint}
            style={{
              backgroundColor: '#222327',
              paddingVertical: 10,
              borderRadius: 10,
              alignItems: 'center',
              borderWidth: 1,
              borderColor: '#3F3F46',
            }}
          >
            <Text style={{ fontSize: 12, fontWeight: '700', color: '#6A5ACD' }}>
              Print Test KOT Ticket
            </Text>
          </Pressable>
        </View>

        {/* BANK ACCOUNT & ESCROW SETTLEMENT */}
        <View
          style={{
            backgroundColor: '#18191B',
            borderRadius: 18,
            padding: 18,
            borderWidth: 1,
            borderColor: '#222327',
            gap: 12,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Text style={{ fontSize: 12, fontWeight: '800', color: '#71717A', letterSpacing: 0.5 }}>
              SETTLEMENT BANK ACCOUNT
            </Text>
            <ShieldCheck size={16} color="#10B981" />
          </View>

          <View
            style={{
              backgroundColor: '#222327',
              borderRadius: 12,
              padding: 14,
              gap: 4,
            }}
          >
            <Text style={{ fontSize: 11, color: '#71717A' }}>Beneficiary Account</Text>
            <Text style={{ fontSize: 14, fontWeight: '700', color: '#F4F4F5' }}>
              HDFC Bank · A/C **** 9102
            </Text>
            <Text style={{ fontSize: 11, color: '#A1A1AA' }}>
              IFSC: HDFC0000142 · Madurai Main Branch
            </Text>
            <Text style={{ fontSize: 11, color: '#10B981', marginTop: 4, fontWeight: '600' }}>
              Auto-settlement every Monday at 6:00 AM IST
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Floating Bottom Nav */}
      <VendorStitchNav activeTab="overview" />
    </View>
  );
}
