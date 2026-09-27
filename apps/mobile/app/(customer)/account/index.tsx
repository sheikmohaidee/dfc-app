/**
 * DFC User Profile Hub — Stitch Dark Floating Theme
 * Profile Header Bento, Preferences Navigation, Role Switcher, Legal Links, and Logout.
 */

import * as React from 'react';
import {
  Alert,
  Image,
  Linking,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  Bell,
  Bike,
  ChevronRight,
  CreditCard,
  Edit,
  FileText,
  HelpCircle,
  LogOut,
  MapPin,
  RotateCcw,
  ScrollText,
  ShieldCheck,
  Star,
  Store,
  Trash2,
  Globe,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

import { COMPANY, COPY, localityById } from '@dfc/core';
import { useAuth } from '@/providers/auth';
import { DEMO_MODE } from '@/demo/config';
import { demoStorage } from '@/demo/storage';
import { mockAuthRepository } from '@/demo/repositories/auth.repository';
import { Screen } from '@/ui';
import { DFCPressable } from '@/ui/animated';
import { StitchHeader } from '@/ui/stitch-header';
import { StitchNav } from '@/ui/stitch-nav';

export default function AccountHub() {
  const router = useRouter();
  const { profile, user, signOut } = useAuth();

  const locality = localityById(profile?.localityId);

  return (
    <Screen edges={['top']} style={{ backgroundColor: '#0E0E10' }}>
      <StitchHeader
        title={locality?.name ?? 'Anna Nagar'}
        showNotifications={true}
        showCart={true}
        onLocationPress={() => router.push('/(customer)/account/addresses')}
      />

      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingTop: 16,
          paddingBottom: 110,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Hero Card */}
        <View
          style={{
            backgroundColor: '#18181B',
            borderRadius: 24,
            borderWidth: 1,
            borderColor: 'rgba(106, 90, 205, 0.3)',
            padding: 20,
            marginBottom: 20,
          }}
        >
          <View className="flex-row items-center gap-4 mb-4">
            {/* Avatar */}
            <View
              style={{
                width: 68,
                height: 68,
                borderRadius: 34,
                backgroundColor: '#6A5ACD',
                borderWidth: 2,
                borderColor: '#C8BFFF',
                alignItems: 'center',
                justifyContent: 'center',
                shadowColor: '#6A5ACD',
                shadowOpacity: 0.3,
                shadowRadius: 10,
                elevation: 4,
              }}
            >
              <Text style={{ fontFamily: 'PlusJakartaSans', fontSize: 26, fontWeight: '800', color: '#FFFFFF' }}>
                {(profile?.name ?? 'Karthik').slice(0, 1).toUpperCase()}
              </Text>
            </View>

            {/* Profile Info */}
            <View className="flex-1">
              <Text
                style={{
                  fontFamily: 'PlusJakartaSans',
                  fontSize: 19,
                  fontWeight: '700',
                  color: '#E5E1E4',
                  marginBottom: 2,
                }}
              >
                {profile?.name ?? 'Karthik Rajan'}
              </Text>
              <Text
                style={{
                  fontFamily: 'PlusJakartaSans',
                  fontSize: 13,
                  color: '#928F9E',
                  marginBottom: 8,
                }}
              >
                {profile?.phone ?? '+91 98765 43210'}
              </Text>

              {/* Premium Member Badge */}
              <View
                style={{
                  alignSelf: 'flex-start',
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 5,
                  backgroundColor: 'rgba(106, 90, 205, 0.15)',
                  paddingHorizontal: 10,
                  paddingVertical: 4,
                  borderRadius: 20,
                  borderWidth: 1,
                  borderColor: 'rgba(106, 90, 205, 0.3)',
                }}
              >
                <Star size={12} color="#FBBF24" fill="#FBBF24" />
                <Text
                  style={{
                    fontFamily: 'PlusJakartaSans',
                    fontSize: 11,
                    fontWeight: '700',
                    color: '#C8BFFF',
                  }}
                >
                  DFC Gold Member
                </Text>
              </View>
            </View>
          </View>

          {/* Edit Profile Button */}
          <DFCPressable
            scaleTo={0.97}
            onPress={() => router.push('/(customer)/account/profile')}
            style={{
              height: 42,
              backgroundColor: '#26252E',
              borderRadius: 12,
              borderWidth: 1,
              borderColor: '#383742',
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
            }}
          >
            <Edit size={15} color="#C8BFFF" strokeWidth={2.2} />
            <Text
              style={{
                fontFamily: 'PlusJakartaSans',
                fontSize: 13,
                fontWeight: '700',
                color: '#C8BFFF',
              }}
            >
              Edit Profile
            </Text>
          </DFCPressable>
        </View>

        {/* Account Preferences Section */}
        <Text
          style={{
            fontFamily: 'PlusJakartaSans',
            fontSize: 11,
            fontWeight: '700',
            color: '#C8BFFF',
            textTransform: 'uppercase',
            letterSpacing: 0.8,
            marginBottom: 10,
          }}
        >
          Account Preferences
        </Text>

        <View className="gap-2.5 mb-6">
          {/* Saved Addresses */}
          <DFCPressable
            scaleTo={0.98}
            onPress={() => router.push('/(customer)/account/addresses')}
            style={{
              backgroundColor: '#18181B',
              borderRadius: 16,
              borderWidth: 1,
              borderColor: '#26262B',
              padding: 14,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 12,
            }}
          >
            <View
              style={{
                width: 38,
                height: 38,
                borderRadius: 12,
                backgroundColor: 'rgba(106, 90, 205, 0.18)',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <MapPin size={18} color="#C8BFFF" />
            </View>
            <View className="flex-1">
              <Text style={{ fontFamily: 'PlusJakartaSans', fontSize: 14, fontWeight: '700', color: '#E5E1E4' }}>
                Saved Addresses
              </Text>
              <Text style={{ fontFamily: 'PlusJakartaSans', fontSize: 11, color: '#928F9E', marginTop: 1 }}>
                Home, Office, Relatives
              </Text>
            </View>
            <ChevronRight size={16} color="#6E6B77" />
          </DFCPressable>

          {/* Payment Methods */}
          <DFCPressable
            scaleTo={0.98}
            onPress={() => router.push('/(customer)/account/payments')}
            style={{
              backgroundColor: '#18181B',
              borderRadius: 16,
              borderWidth: 1,
              borderColor: '#26262B',
              padding: 14,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 12,
            }}
          >
            <View
              style={{
                width: 38,
                height: 38,
                borderRadius: 12,
                backgroundColor: 'rgba(106, 90, 205, 0.18)',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <CreditCard size={18} color="#C8BFFF" />
            </View>
            <View className="flex-1">
              <Text style={{ fontFamily: 'PlusJakartaSans', fontSize: 14, fontWeight: '700', color: '#E5E1E4' }}>
                Payment Methods
              </Text>
              <Text style={{ fontFamily: 'PlusJakartaSans', fontSize: 11, color: '#928F9E', marginTop: 1 }}>
                Saved UPI, Cards, Net Banking
              </Text>
            </View>
            <ChevronRight size={16} color="#6E6B77" />
          </DFCPressable>

          {/* Notifications */}
          <DFCPressable
            scaleTo={0.98}
            onPress={() => router.push('/(customer)/account/notifications')}
            style={{
              backgroundColor: '#18181B',
              borderRadius: 16,
              borderWidth: 1,
              borderColor: '#26262B',
              padding: 14,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 12,
            }}
          >
            <View
              style={{
                width: 38,
                height: 38,
                borderRadius: 12,
                backgroundColor: 'rgba(106, 90, 205, 0.18)',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Bell size={18} color="#C8BFFF" />
            </View>
            <View className="flex-1">
              <Text style={{ fontFamily: 'PlusJakartaSans', fontSize: 14, fontWeight: '700', color: '#E5E1E4' }}>
                Notifications
              </Text>
              <Text style={{ fontFamily: 'PlusJakartaSans', fontSize: 11, color: '#928F9E', marginTop: 1 }}>
                Order updates & discounts
              </Text>
            </View>
            <ChevronRight size={16} color="#6E6B77" />
          </DFCPressable>

          {/* Language Preference */}
          <DFCPressable
            scaleTo={0.98}
            onPress={() => router.push('/(customer)/account/language' as any)}
            style={{
              backgroundColor: '#18181B',
              borderRadius: 16,
              borderWidth: 1,
              borderColor: '#26262B',
              padding: 14,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 12,
            }}
          >
            <View
              style={{
                width: 38,
                height: 38,
                borderRadius: 12,
                backgroundColor: 'rgba(106, 90, 205, 0.18)',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Globe size={18} color="#C8BFFF" />
            </View>
            <View className="flex-1">
              <Text style={{ fontFamily: 'PlusJakartaSans', fontSize: 14, fontWeight: '700', color: '#E5E1E4' }}>
                Language / மொழி
              </Text>
              <Text style={{ fontFamily: 'PlusJakartaSans', fontSize: 11, color: '#928F9E', marginTop: 1 }}>
                English · தமிழ்
              </Text>
            </View>
            <ChevronRight size={16} color="#6E6B77" />
          </DFCPressable>

          {/* Help & Support */}
          <DFCPressable
            scaleTo={0.98}
            onPress={() => router.push('/(customer)/account/help')}
            style={{
              backgroundColor: '#18181B',
              borderRadius: 16,
              borderWidth: 1,
              borderColor: '#26262B',
              padding: 14,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 12,
            }}
          >
            <View
              style={{
                width: 38,
                height: 38,
                borderRadius: 12,
                backgroundColor: 'rgba(106, 90, 205, 0.18)',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <HelpCircle size={18} color="#C8BFFF" />
            </View>
            <View className="flex-1">
              <Text style={{ fontFamily: 'PlusJakartaSans', fontSize: 14, fontWeight: '700', color: '#E5E1E4' }}>
                Help & Support
              </Text>
              <Text style={{ fontFamily: 'PlusJakartaSans', fontSize: 11, color: '#928F9E', marginTop: 1 }}>
                24/7 Madurai support desk
              </Text>
            </View>
            <ChevronRight size={16} color="#6E6B77" />
          </DFCPressable>
        </View>

        {/* Demo Roles Switcher */}
        {DEMO_MODE ? (
          <View className="mb-6">
            <Text
              style={{
                fontFamily: 'PlusJakartaSans',
                fontSize: 11,
                fontWeight: '700',
                color: '#FBBF24',
                textTransform: 'uppercase',
                letterSpacing: 0.8,
                marginBottom: 10,
              }}
            >
              DEMO APP ROLE SWITCHER
            </Text>

            <View className="gap-2">
              <Pressable
                onPress={async () => {
                  void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  await mockAuthRepository.loginWithStaff('vendor@dfc.test', 'password');
                  router.replace('/(vendor)/inbox');
                }}
                style={{
                  backgroundColor: '#18181B',
                  borderWidth: 1,
                  borderColor: 'rgba(59, 130, 246, 0.3)',
                  borderRadius: 14,
                  padding: 14,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <View className="flex-row items-center gap-3">
                  <View
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 10,
                      backgroundColor: 'rgba(59, 130, 246, 0.2)',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Store size={18} color="#93C5FD" />
                  </View>
                  <View>
                    <Text style={{ fontFamily: 'PlusJakartaSans', fontSize: 14, fontWeight: '700', color: '#93C5FD' }}>
                      Switch to Vendor App
                    </Text>
                    <Text style={{ fontFamily: 'PlusJakartaSans', fontSize: 11, color: '#928F9E' }}>
                      Meenakshi Medicals Store Inbox
                    </Text>
                  </View>
                </View>
                <ChevronRight size={16} color="#93C5FD" />
              </Pressable>

              <Pressable
                onPress={async () => {
                  void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  await mockAuthRepository.loginWithStaff('rider@dfc.test', 'password');
                  router.replace('/(rider)/queue');
                }}
                style={{
                  backgroundColor: '#18181B',
                  borderWidth: 1,
                  borderColor: 'rgba(16, 185, 129, 0.3)',
                  borderRadius: 14,
                  padding: 14,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <View className="flex-row items-center gap-3">
                  <View
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 10,
                      backgroundColor: 'rgba(16, 185, 129, 0.2)',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Bike size={18} color="#6EE7B7" />
                  </View>
                  <View>
                    <Text style={{ fontFamily: 'PlusJakartaSans', fontSize: 14, fontWeight: '700', color: '#6EE7B7' }}>
                      Switch to Rider App
                    </Text>
                    <Text style={{ fontFamily: 'PlusJakartaSans', fontSize: 11, color: '#928F9E' }}>
                      Arun Captain Delivery Queue
                    </Text>
                  </View>
                </View>
                <ChevronRight size={16} color="#6EE7B7" />
              </Pressable>

              <Pressable
                onPress={() => {
                  Alert.alert(
                    'Reset Demo Data?',
                    'This will clear the cart and restore default seed orders.',
                    [
                      { text: 'Cancel', style: 'cancel' },
                      {
                        text: 'Reset Demo',
                        style: 'destructive',
                        onPress: async () => {
                          await demoStorage.resetDemoData();
                          Alert.alert('Demo Data Reset', 'Default demo state restored.');
                        },
                      },
                    ],
                  );
                }}
                style={{
                  backgroundColor: '#18181B',
                  borderWidth: 1,
                  borderColor: 'rgba(245, 158, 11, 0.3)',
                  borderRadius: 14,
                  padding: 14,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <View className="flex-row items-center gap-3">
                  <View
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 10,
                      backgroundColor: 'rgba(245, 158, 11, 0.2)',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <RotateCcw size={18} color="#FDE047" />
                  </View>
                  <View>
                    <Text style={{ fontFamily: 'PlusJakartaSans', fontSize: 14, fontWeight: '700', color: '#FDE047' }}>
                      Reset All Demo Data
                    </Text>
                    <Text style={{ fontFamily: 'PlusJakartaSans', fontSize: 11, color: '#928F9E' }}>
                      Restore seed orders & test cart
                    </Text>
                  </View>
                </View>
                <ChevronRight size={16} color="#FDE047" />
              </Pressable>
            </View>
          </View>
        ) : null}

        {/* Legal & Logout */}
        <View
          style={{
            backgroundColor: '#18181B',
            borderRadius: 20,
            borderWidth: 1,
            borderColor: '#26262B',
            overflow: 'hidden',
            marginBottom: 24,
          }}
        >
          <Pressable
            onPress={() => router.push('/(customer)/legal/privacy')}
            style={{
              padding: 16,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderBottomWidth: 1,
              borderBottomColor: '#26262B',
            }}
          >
            <View className="flex-row items-center gap-3">
              <ShieldCheck size={18} color="#928F9E" />
              <Text style={{ fontFamily: 'PlusJakartaSans', fontSize: 14, fontWeight: '500', color: '#E5E1E4' }}>
                Privacy Policy
              </Text>
            </View>
            <ChevronRight size={16} color="#6E6B77" />
          </Pressable>

          <Pressable
            onPress={() => router.push('/(customer)/legal/terms')}
            style={{
              padding: 16,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderBottomWidth: 1,
              borderBottomColor: '#26262B',
            }}
          >
            <View className="flex-row items-center gap-3">
              <ScrollText size={18} color="#928F9E" />
              <Text style={{ fontFamily: 'PlusJakartaSans', fontSize: 14, fontWeight: '500', color: '#E5E1E4' }}>
                Terms of Service
              </Text>
            </View>
            <ChevronRight size={16} color="#6E6B77" />
          </Pressable>

          <Pressable
            onPress={() => router.push('/(customer)/legal/refunds')}
            style={{
              padding: 16,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderBottomWidth: 1,
              borderBottomColor: '#26262B',
            }}
          >
            <View className="flex-row items-center gap-3">
              <FileText size={18} color="#928F9E" />
              <Text style={{ fontFamily: 'PlusJakartaSans', fontSize: 14, fontWeight: '500', color: '#E5E1E4' }}>
                Refund Policy
              </Text>
            </View>
            <ChevronRight size={16} color="#6E6B77" />
          </Pressable>

          {/* Logout Row */}
          <Pressable
            onPress={async () => {
              void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              await signOut();
              router.replace('/(auth)/sign-in');
            }}
            style={{
              padding: 16,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 12,
              borderBottomWidth: 1,
              borderBottomColor: '#26262B',
            }}
          >
            <LogOut size={18} color="#F87171" />
            <Text style={{ fontFamily: 'PlusJakartaSans', fontSize: 14, fontWeight: '700', color: '#F87171' }}>
              Logout
            </Text>
          </Pressable>

          {/* Delete Account */}
          <Pressable
            onPress={() => router.push('/(customer)/account/delete')}
            style={{
              padding: 16,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 12,
            }}
          >
            <Trash2 size={18} color="#F87171" />
            <Text style={{ fontFamily: 'PlusJakartaSans', fontSize: 13, fontWeight: '500', color: '#F87171' }}>
              Delete Account
            </Text>
          </Pressable>
        </View>

        {/* App Version Info */}
        <View className="items-center pb-4">
          <Text style={{ fontFamily: 'PlusJakartaSans', fontSize: 12, color: '#5C5A64' }}>
            {COMPANY.legalName} · v0.1.0 (Madurai)
          </Text>
          <Text style={{ fontFamily: 'PlusJakartaSans', fontSize: 11, color: '#5C5A64', marginTop: 2 }}>
            {COPY.appName.ta}
          </Text>
        </View>
      </ScrollView>

      <StitchNav activeTab="profile" />
    </Screen>
  );
}
