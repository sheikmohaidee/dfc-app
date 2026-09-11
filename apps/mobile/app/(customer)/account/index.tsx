/**
 * DFC User Profile Hub - Full Stitch Design Implementation
 * Profile Header Bento, Bento Grid Navigation, Legal Policies, and Demo Roles.
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
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

import { COMPANY, COPY, localityById } from '@dfc/core';
import { useAuth } from '@/providers/auth';
import { DEMO_MODE } from '@/demo/config';
import { demoStorage } from '@/demo/storage';
import { mockAuthRepository } from '@/demo/repositories/auth.repository';
import { Screen } from '@/ui';
import { TopAppBar } from '@/ui/top-app-bar';
import { DFCBottomNav } from '@/ui/bottom-nav';

export default function AccountHub() {
  const router = useRouter();
  const { profile, user, signOut } = useAuth();

  const locality = localityById(profile?.localityId);

  return (
    <Screen edges={['top']}>
      {/* Top Header with Anna Nagar and Notifications */}
      <TopAppBar
        title={locality?.name ?? 'Anna Nagar'}
        showNotifications={true}
        onLocationPress={() => router.push('/(customer)/account/addresses')}
      />

      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingTop: 16,
          paddingBottom: 40,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Header Bento */}
        <View
          style={{
            backgroundColor: '#F9F9FF',
            borderRadius: 16,
            borderWidth: 1,
            borderColor: '#DAC0C4',
            padding: 20,
            marginBottom: 20,
            shadowColor: '#000000',
            shadowOpacity: 0.04,
            shadowRadius: 10,
            shadowOffset: { width: 0, height: 4 },
            elevation: 3,
          }}
        >
          <View className="flex-row items-center gap-4 mb-4">
            {/* Avatar */}
            <View
              style={{
                width: 72,
                height: 72,
                borderRadius: 36,
                backgroundColor: '#7A1F3D',
                borderWidth: 3,
                borderColor: '#FFFFFF',
                alignItems: 'center',
                justifyContent: 'center',
                shadowColor: '#000000',
                shadowOpacity: 0.1,
                shadowRadius: 6,
                elevation: 4,
              }}
            >
              <Text style={{ fontFamily: 'Archivo', fontSize: 26, fontWeight: '800', color: '#FFFFFF' }}>
                {(profile?.name ?? 'Karthik').slice(0, 1).toUpperCase()}
              </Text>
            </View>

            {/* Profile Info */}
            <View className="flex-1">
              <Text
                style={{
                  fontFamily: 'Archivo',
                  fontSize: 20,
                  fontWeight: '700',
                  color: '#141B2B',
                  letterSpacing: -0.4,
                  marginBottom: 2,
                }}
              >
                {profile?.name ?? 'Karthik Rajan'}
              </Text>
              <Text
                style={{
                  fontFamily: 'Archivo',
                  fontSize: 13,
                  fontWeight: '500',
                  color: '#554245',
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
                  gap: 4,
                  backgroundColor: '#F1F3FF',
                  paddingHorizontal: 10,
                  paddingVertical: 4,
                  borderRadius: 9999,
                  borderWidth: 1,
                  borderColor: '#DAC0C4',
                }}
              >
                <Star size={13} color="#7A1F3D" fill="#7A1F3D" />
                <Text style={{ fontFamily: 'Archivo', fontSize: 12, fontWeight: '600', color: '#141B2B' }}>
                  Premium Member
                </Text>
              </View>
            </View>
          </View>

          {/* Edit Profile Button */}
          <Pressable
            onPress={() => router.push('/(customer)/account/profile')}
            style={{
              height: 44,
              backgroundColor: '#FE98B3',
              borderRadius: 10,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
            }}
          >
            <Edit size={16} color="#792C45" strokeWidth={2.2} />
            <Text style={{ fontFamily: 'Archivo', fontSize: 14, fontWeight: '700', color: '#792C45' }}>
              Edit Profile
            </Text>
          </Pressable>
        </View>

        {/* Bento Grid Layout for Sections */}
        <Text
          style={{
            fontFamily: 'Archivo',
            fontSize: 11,
            fontWeight: '700',
            color: '#7A1F3D',
            textTransform: 'uppercase',
            letterSpacing: 0.8,
            marginBottom: 10,
          }}
        >
          Account Preferences
        </Text>

        <View className="gap-3 mb-6">
          {/* Saved Addresses */}
          <Pressable
            onPress={() => router.push('/(customer)/account/addresses')}
            style={{
              backgroundColor: '#F9F9FF',
              borderRadius: 14,
              borderWidth: 1,
              borderColor: '#DAC0C4',
              padding: 14,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 12,
            }}
          >
            <View
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: '#E9EDFF',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <MapPin size={20} color="#7A1F3D" />
            </View>
            <View className="flex-1">
              <Text style={{ fontFamily: 'Archivo', fontSize: 15, fontWeight: '700', color: '#141B2B' }}>
                Saved Addresses
              </Text>
              <Text style={{ fontFamily: 'Archivo', fontSize: 12, color: '#554245' }}>
                Home, Work, Other
              </Text>
            </View>
            <ChevronRight size={18} color="#554245" />
          </Pressable>

          {/* Payment Methods */}
          <Pressable
            onPress={() => router.push('/(customer)/account/payments')}
            style={{
              backgroundColor: '#F9F9FF',
              borderRadius: 14,
              borderWidth: 1,
              borderColor: '#DAC0C4',
              padding: 14,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 12,
            }}
          >
            <View
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: '#E9EDFF',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <CreditCard size={20} color="#7A1F3D" />
            </View>
            <View className="flex-1">
              <Text style={{ fontFamily: 'Archivo', fontSize: 15, fontWeight: '700', color: '#141B2B' }}>
                Payment Methods
              </Text>
              <Text style={{ fontFamily: 'Archivo', fontSize: 12, color: '#554245' }}>
                Cards, UPI, Wallets
              </Text>
            </View>
            <ChevronRight size={18} color="#554245" />
          </Pressable>

          {/* Notifications */}
          <Pressable
            onPress={() => router.push('/(customer)/account/notifications')}
            style={{
              backgroundColor: '#F9F9FF',
              borderRadius: 14,
              borderWidth: 1,
              borderColor: '#DAC0C4',
              padding: 14,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 12,
            }}
          >
            <View
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: '#E9EDFF',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Bell size={20} color="#7A1F3D" />
            </View>
            <View className="flex-1">
              <Text style={{ fontFamily: 'Archivo', fontSize: 15, fontWeight: '700', color: '#141B2B' }}>
                Notifications
              </Text>
              <Text style={{ fontFamily: 'Archivo', fontSize: 12, color: '#554245' }}>
                Push, Email, SMS preferences
              </Text>
            </View>
            <ChevronRight size={18} color="#554245" />
          </Pressable>

          {/* Help & Support */}
          <Pressable
            onPress={() => router.push('/(customer)/account/help')}
            style={{
              backgroundColor: '#F9F9FF',
              borderRadius: 14,
              borderWidth: 1,
              borderColor: '#DAC0C4',
              padding: 14,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 12,
            }}
          >
            <View
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: '#E9EDFF',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <HelpCircle size={20} color="#7A1F3D" />
            </View>
            <View className="flex-1">
              <Text style={{ fontFamily: 'Archivo', fontSize: 15, fontWeight: '700', color: '#141B2B' }}>
                Help & Support
              </Text>
              <Text style={{ fontFamily: 'Archivo', fontSize: 12, color: '#554245' }}>
                FAQs, Contact us
              </Text>
            </View>
            <ChevronRight size={18} color="#554245" />
          </Pressable>
        </View>

        {/* Demo Roles Switcher */}
        {DEMO_MODE ? (
          <View className="mb-6">
            <Text
              style={{
                fontFamily: 'Archivo',
                fontSize: 11,
                fontWeight: '700',
                color: '#7A1F3D',
                textTransform: 'uppercase',
                letterSpacing: 0.8,
                marginBottom: 10,
              }}
            >
              Multi-App Role Switcher
            </Text>

            <View className="gap-2">
              <Pressable
                onPress={async () => {
                  void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  await mockAuthRepository.loginWithStaff('vendor@dfc.test', 'password');
                  router.replace('/(vendor)/inbox');
                }}
                style={{
                  backgroundColor: '#EFF6FF',
                  borderWidth: 1,
                  borderColor: '#2563EB30',
                  borderRadius: 12,
                  padding: 14,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <View className="flex-row items-center gap-3">
                  <Store size={20} color="#2563EB" />
                  <View>
                    <Text style={{ fontFamily: 'Archivo', fontSize: 14, fontWeight: '700', color: '#1E40AF' }}>
                      Switch to Vendor App
                    </Text>
                    <Text style={{ fontFamily: 'Archivo', fontSize: 11, color: '#1E3A8A' }}>
                      Meenakshi Medicals Order Inbox
                    </Text>
                  </View>
                </View>
                <ChevronRight size={18} color="#2563EB" />
              </Pressable>

              <Pressable
                onPress={async () => {
                  void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  await mockAuthRepository.loginWithStaff('rider@dfc.test', 'password');
                  router.replace('/(rider)/queue');
                }}
                style={{
                  backgroundColor: '#ECFDF5',
                  borderWidth: 1,
                  borderColor: '#05966930',
                  borderRadius: 12,
                  padding: 14,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <View className="flex-row items-center gap-3">
                  <Bike size={20} color="#059669" />
                  <View>
                    <Text style={{ fontFamily: 'Archivo', fontSize: 14, fontWeight: '700', color: '#065F46' }}>
                      Switch to Rider App
                    </Text>
                    <Text style={{ fontFamily: 'Archivo', fontSize: 11, color: '#047857' }}>
                      Arun Captain Delivery Queue
                    </Text>
                  </View>
                </View>
                <ChevronRight size={18} color="#059669" />
              </Pressable>

              <Pressable
                onPress={() => {
                  Alert.alert(
                    'Reset Demo Data?',
                    'This will clear current cart and restore default seed orders (Amma Mess & Meenakshi Medicals).',
                    [
                      { text: 'Cancel', style: 'cancel' },
                      {
                        text: 'Reset Demo',
                        style: 'destructive',
                        onPress: async () => {
                          await demoStorage.resetDemoData();
                          Alert.alert('Demo Data Reset', 'Fresh demo state restored successfully.');
                        },
                      },
                    ],
                  );
                }}
                style={{
                  backgroundColor: '#FFFBEB',
                  borderWidth: 1,
                  borderColor: '#D9770630',
                  borderRadius: 12,
                  padding: 14,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <View className="flex-row items-center gap-3">
                  <RotateCcw size={20} color="#D97706" />
                  <View>
                    <Text style={{ fontFamily: 'Archivo', fontSize: 14, fontWeight: '700', color: '#92400E' }}>
                      Reset All Demo Data
                    </Text>
                    <Text style={{ fontFamily: 'Archivo', fontSize: 11, color: '#B45309' }}>
                      Restore default orders and cart
                    </Text>
                  </View>
                </View>
                <ChevronRight size={18} color="#D97706" />
              </Pressable>
            </View>
          </View>
        ) : null}

        {/* Legal & Logout Group */}
        <View
          style={{
            backgroundColor: '#F9F9FF',
            borderRadius: 16,
            borderWidth: 1,
            borderColor: '#DAC0C4',
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
              borderBottomColor: '#DAC0C4',
            }}
          >
            <View className="flex-row items-center gap-3">
              <ShieldCheck size={18} color="#554245" />
              <Text style={{ fontFamily: 'Archivo', fontSize: 14, fontWeight: '500', color: '#141B2B' }}>
                Privacy Policy
              </Text>
            </View>
            <ChevronRight size={16} color="#554245" />
          </Pressable>

          <Pressable
            onPress={() => router.push('/(customer)/legal/terms')}
            style={{
              padding: 16,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderBottomWidth: 1,
              borderBottomColor: '#DAC0C4',
            }}
          >
            <View className="flex-row items-center gap-3">
              <ScrollText size={18} color="#554245" />
              <Text style={{ fontFamily: 'Archivo', fontSize: 14, fontWeight: '500', color: '#141B2B' }}>
                Terms of Service
              </Text>
            </View>
            <ChevronRight size={16} color="#554245" />
          </Pressable>

          <Pressable
            onPress={() => router.push('/(customer)/legal/refunds')}
            style={{
              padding: 16,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderBottomWidth: 1,
              borderBottomColor: '#DAC0C4',
            }}
          >
            <View className="flex-row items-center gap-3">
              <FileText size={18} color="#554245" />
              <Text style={{ fontFamily: 'Archivo', fontSize: 14, fontWeight: '500', color: '#141B2B' }}>
                Refund Policy
              </Text>
            </View>
            <ChevronRight size={16} color="#554245" />
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
              borderBottomColor: '#DAC0C4',
            }}
          >
            <LogOut size={18} color="#BA1A1A" />
            <Text style={{ fontFamily: 'Archivo', fontSize: 15, fontWeight: '700', color: '#BA1A1A' }}>
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
            <Trash2 size={18} color="#BA1A1A" />
            <Text style={{ fontFamily: 'Archivo', fontSize: 14, fontWeight: '500', color: '#BA1A1A' }}>
              Delete Account
            </Text>
          </Pressable>
        </View>

        {/* App Version Info */}
        <View className="items-center pb-4">
          <Text style={{ fontFamily: 'Archivo', fontSize: 12, color: '#887275' }}>
            {COPY.appName.en} · v0.1.0 (Madurai)
          </Text>
          <Text style={{ fontFamily: 'HindMadurai', fontSize: 11, color: '#887275', marginTop: 2 }}>
            {COPY.appName.ta}
          </Text>
        </View>
      </ScrollView>

      <DFCBottomNav activeTab="profile" />
    </Screen>
  );
}
