/**
 * Captain Hub & Profile Settings — Stitch Dark Floating Theme
 *
 * Implements:
 * - 16 — Captain Profile / Settings
 * - Vehicle & Equipment status
 * - Safety hotline & Emergency contacts
 * - Language selection & Sign out
 */

import * as React from 'react';
import {
  Alert,
  Linking,
  Pressable,
  ScrollView,
  Switch,
  Text,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  BatteryCharging,
  Bell,
  Bike,
  CheckCircle2,
  ChevronRight,
  Globe,
  HardHat,
  HelpCircle,
  LifeBuoy,
  LogOut,
  Moon,
  Phone,
  PhoneCall,
  Shield,
  ShieldCheck,
  Star,
  Trash2,
  User,
  Volume2,
  Zap,
} from 'lucide-react-native';

import { COMPANY, localityById } from '@dfc/core';
import { useAuth } from '@/providers/auth';
import { useLang } from '@/providers/language';
import { RiderStitchNav } from '@/ui/rider-nav';

export default function RiderSettings() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, profile, signOut } = useAuth();
  const { mode, setMode } = useLang();

  const [soundAlerts, setSoundAlerts] = React.useState(true);
  const [hapticsEnabled, setHapticsEnabled] = React.useState(true);
  const [batterySaver, setBatterySaver] = React.useState(false);

  const handleSignOut = () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert('Sign Out', 'Are you sure you want to sign out from the Captain App?', [
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

  const handleToggleLang = () => {
    void Haptics.selectionAsync();
    const next = mode === 'en' ? 'ta' : mode === 'ta' ? 'both' : 'en';
    void setMode(next);
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#0E0E10' }}>
      {/* Header */}
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
            <ShieldCheck size={20} color="#10B981" />
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
              Captain Hub
            </Text>
            <Text style={{ fontSize: 11, color: '#A1A1AA' }}>
              Profile, Vehicle & Safety Controls
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
        {/* CAPTAIN PROFILE CARD */}
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
                borderRadius: 9999,
                backgroundColor: '#222327',
                alignItems: 'center',
                justifyContent: 'center',
                borderWidth: 2,
                borderColor: '#10B981',
              }}
            >
              <Bike size={28} color="#10B981" />
            </View>

            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Text
                  style={{
                    fontSize: 18,
                    fontFamily: 'PlusJakartaSans_800ExtraBold',
                    fontWeight: '800',
                    color: '#F4F4F5',
                  }}
                >
                  {profile?.name || 'Captain'}
                </Text>
                <View
                  style={{
                    backgroundColor: 'rgba(16, 185, 129, 0.2)',
                    paddingHorizontal: 6,
                    paddingVertical: 2,
                    borderRadius: 4,
                  }}
                >
                  <Text style={{ fontSize: 10, fontWeight: '800', color: '#34D399' }}>VERIFIED</Text>
                </View>
              </View>

              <Text style={{ fontSize: 12, color: '#A1A1AA', marginTop: 2 }}>
                {profile?.phone || user?.phoneNumber || '+91 98401 23456'}
              </Text>
              <Text style={{ fontSize: 11, color: '#71717A', marginTop: 1 }}>
                ID: DFC-CAP-8491 · {localityById(profile?.localityId)?.name ?? 'Madurai Hub'}
              </Text>
            </View>
          </View>

          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-around',
              paddingTop: 14,
              borderTopWidth: 1,
              borderTopColor: '#222327',
            }}
          >
            <View style={{ alignItems: 'center' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Star size={14} color="#F59E0B" fill="#F59E0B" />
                <Text style={{ fontSize: 16, fontWeight: '800', color: '#F4F4F5' }}>4.92</Text>
              </View>
              <Text style={{ fontSize: 10, color: '#71717A', marginTop: 2 }}>RATING</Text>
            </View>

            <View style={{ width: 1, height: 24, backgroundColor: '#222327' }} />

            <View style={{ alignItems: 'center' }}>
              <Text style={{ fontSize: 16, fontWeight: '800', color: '#F4F4F5' }}>384</Text>
              <Text style={{ fontSize: 10, color: '#71717A', marginTop: 2 }}>TOTAL TRIPS</Text>
            </View>

            <View style={{ width: 1, height: 24, backgroundColor: '#222327' }} />

            <View style={{ alignItems: 'center' }}>
              <Text style={{ fontSize: 16, fontWeight: '800', color: '#10B981' }}>99.2%</Text>
              <Text style={{ fontSize: 10, color: '#71717A', marginTop: 2 }}>ON-TIME RATE</Text>
            </View>
          </View>
        </View>

        {/* VEHICLE & EQUIPMENT VERIFICATION */}
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
          <Text style={{ fontSize: 12, fontWeight: '800', color: '#71717A', letterSpacing: 0.5 }}>
            VEHICLE & EQUIPMENT AUDIT
          </Text>

          <View style={{ gap: 10 }}>
            {/* Vehicle Card */}
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
                <Bike size={20} color="#38BDF8" />
                <View>
                  <Text style={{ fontSize: 13, fontWeight: '700', color: '#F4F4F5' }}>
                    Ather 450X Gen 3 (EV)
                  </Text>
                  <Text style={{ fontSize: 11, color: '#A1A1AA' }}>TN-59-AZ-8812 · Green EV Badge</Text>
                </View>
              </View>
              <CheckCircle2 size={18} color="#10B981" />
            </View>

            {/* Helmet & Bag */}
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
                <HardHat size={20} color="#F59E0B" />
                <View>
                  <Text style={{ fontSize: 13, fontWeight: '700', color: '#F4F4F5' }}>
                    Helmet & Thermal Bag
                  </Text>
                  <Text style={{ fontSize: 11, color: '#A1A1AA' }}>Daily Safety Selfie Verified</Text>
                </View>
              </View>
              <CheckCircle2 size={18} color="#10B981" />
            </View>
          </View>
        </View>

        {/* PREFERENCES & CONTROLS */}
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
            APP PREFERENCES
          </Text>

          {/* Sound Alerts */}
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <Volume2 size={18} color="#A1A1AA" />
              <View>
                <Text style={{ fontSize: 13, fontWeight: '700', color: '#F4F4F5' }}>
                  Loud Dispatch Chimes
                </Text>
                <Text style={{ fontSize: 11, color: '#71717A' }}>High volume alert on new tasks</Text>
              </View>
            </View>
            <Switch
              value={soundAlerts}
              onValueChange={setSoundAlerts}
              thumbColor={soundAlerts ? '#FF7F50' : '#71717A'}
              trackColor={{ false: '#222327', true: 'rgba(255, 127, 80, 0.4)' }}
            />
          </View>

          <View style={{ height: 1, backgroundColor: '#222327' }} />

          {/* Language Switcher */}
          <Pressable
            onPress={handleToggleLang}
            style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <Globe size={18} color="#A1A1AA" />
              <View>
                <Text style={{ fontSize: 13, fontWeight: '700', color: '#F4F4F5' }}>
                  Language / மொழி
                </Text>
                <Text style={{ fontSize: 11, color: '#71717A' }}>
                  {mode === 'en' ? 'English' : mode === 'ta' ? 'தமிழ்' : 'English + தமிழ்'}
                </Text>
              </View>
            </View>
            <ChevronRight size={18} color="#71717A" />
          </Pressable>

          <View style={{ height: 1, backgroundColor: '#222327' }} />

          {/* Battery Saver */}
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <BatteryCharging size={18} color="#A1A1AA" />
              <View>
                <Text style={{ fontSize: 13, fontWeight: '700', color: '#F4F4F5' }}>
                  Battery Saver Mode
                </Text>
                <Text style={{ fontSize: 11, color: '#71717A' }}>Reduces background map rendering</Text>
              </View>
            </View>
            <Switch
              value={batterySaver}
              onValueChange={setBatterySaver}
              thumbColor={batterySaver ? '#10B981' : '#71717A'}
              trackColor={{ false: '#222327', true: 'rgba(16, 185, 129, 0.4)' }}
            />
          </View>
        </View>

        {/* 24/7 EMERGENCY & SUPPORT HOTLINE */}
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
          <Text style={{ fontSize: 12, fontWeight: '800', color: '#71717A', letterSpacing: 0.5 }}>
            24/7 FLEET SUPPORT & HELPLINE
          </Text>

          <Pressable
            onPress={() => void Linking.openURL('tel:18004259999')}
            style={{
              backgroundColor: '#222327',
              borderRadius: 12,
              padding: 14,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <PhoneCall size={18} color="#FF7F50" />
              <View>
                <Text style={{ fontSize: 13, fontWeight: '700', color: '#F4F4F5' }}>
                  DFC Madurai Fleet Dispatch
                </Text>
                <Text style={{ fontSize: 11, color: '#A1A1AA' }}>Toll Free 1800-425-9999 (24/7)</Text>
              </View>
            </View>
            <Text style={{ fontSize: 12, fontWeight: '700', color: '#FF7F50' }}>Call</Text>
          </Pressable>

          <Pressable
            onPress={() => void Linking.openURL('tel:112')}
            style={{
              backgroundColor: '#222327',
              borderRadius: 12,
              padding: 14,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <Shield size={18} color="#EF4444" />
              <View>
                <Text style={{ fontSize: 13, fontWeight: '700', color: '#F4F4F5' }}>
                  Police & Emergency Helpline
                </Text>
                <Text style={{ fontSize: 11, color: '#A1A1AA' }}>National Emergency 112</Text>
              </View>
            </View>
            <Text style={{ fontSize: 12, fontWeight: '700', color: '#EF4444' }}>Call 112</Text>
          </Pressable>
        </View>
      </ScrollView>

      {/* Floating Bottom Nav */}
      <RiderStitchNav activeTab="settings" />
    </View>
  );
}
