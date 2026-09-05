/**
 * Registration screen for DFC mobile.
 *
 * Supports self-onboarding as Customer, Vendor, or Rider with Madurai
 * locality selection and instant offline mock token generation.
 */

import * as React from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { ArrowLeft, Check, MapPin, Store, Truck, User } from 'lucide-react-native';

import { LOCALITIES, type Locality, type Role } from '@dfc/core';
import { useAuth } from '@/providers/auth';
import { Button, ErrorNote, Screen, T, Ta } from '@/ui';

export default function RegisterScreen() {
  const router = useRouter();
  const { registerOfflineUser } = useAuth();

  const [name, setName] = React.useState('');
  const [national, setNational] = React.useState('');
  const [role, setRole] = React.useState<Role>('customer');
  const [selectedLocality, setSelectedLocality] = React.useState<Locality>(LOCALITIES[0]!);
  const [extraDetail, setExtraDetail] = React.useState('');
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const e164 = `+91${national.replace(/\D/g, '')}`;
  const isPhoneValid = /^\+91[6-9]\d{9}$/.test(e164);
  const canSubmit = name.trim().length >= 2 && isPhoneValid && !busy;

  async function handleRegister() {
    if (!canSubmit) return;
    setBusy(true);
    setError(null);

    try {
      await registerOfflineUser({
        name: name.trim(),
        phone: e164,
        role,
        localityId: selectedLocality.id,
        addressLine: extraDetail.trim() || `${selectedLocality.name}, Madurai`,
        ...(role === 'vendor' ? { storeId: 'simmakkal-konar-mess' } : {}),
      });

      router.replace('/');
    } catch (e) {
      setError((e as Error).message || 'Failed to complete registration');
      setBusy(false);
    }
  }

  return (
    <Screen>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1"
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 24, paddingVertical: 20 }}
        >
          {/* Back button */}
          <TouchableOpacity
            onPress={() => router.back()}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            className="mb-4 size-10 items-center justify-center rounded-full bg-surface border border-border"
          >
            <ArrowLeft size={18} color="#18181B" />
          </TouchableOpacity>

          {/* Header */}
          <Animated.View entering={FadeInDown.duration(300)}>
            <T className="text-[26px] font-bold tracking-tight">Join DFC Madurai</T>
            <Ta className="mt-0.5 text-[14px] text-muted-foreground">
              டி.எஃப்.சி-யில் புதிய கணக்கு தொடங்குங்கள்
            </Ta>
            <T className="mt-1 text-[13px] text-muted-foreground">
              Hyper-local food, grocery & concierge delivery
            </T>
          </Animated.View>

          {/* Role Selection */}
          <Animated.View entering={FadeInDown.delay(100).duration(300)} className="mt-6">
            <T className="text-[12px] font-bold uppercase tracking-wider text-placeholder">
              I am registering as
            </T>
            <View className="mt-2.5 flex-row gap-2">
              <TouchableOpacity
                onPress={() => setRole('customer')}
                className={`flex-1 items-center gap-1.5 rounded-xl border p-3 ${
                  role === 'customer'
                    ? 'border-primary bg-primary/10'
                    : 'border-border bg-surface/60'
                }`}
              >
                <User size={18} color={role === 'customer' ? '#2563EB' : '#71717A'} />
                <T
                  className={`text-[12.5px] font-semibold ${
                    role === 'customer' ? 'text-primary' : 'text-foreground'
                  }`}
                >
                  Customer
                </T>
                <Ta className="text-[10px] text-muted-foreground">வாடிக்கையாளர்</Ta>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setRole('vendor')}
                className={`flex-1 items-center gap-1.5 rounded-xl border p-3 ${
                  role === 'vendor'
                    ? 'border-primary bg-primary/10'
                    : 'border-border bg-surface/60'
                }`}
              >
                <Store size={18} color={role === 'vendor' ? '#2563EB' : '#71717A'} />
                <T
                  className={`text-[12.5px] font-semibold ${
                    role === 'vendor' ? 'text-primary' : 'text-foreground'
                  }`}
                >
                  Store Vendor
                </T>
                <Ta className="text-[10px] text-muted-foreground">வணிகர் / கடை</Ta>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setRole('rider')}
                className={`flex-1 items-center gap-1.5 rounded-xl border p-3 ${
                  role === 'rider'
                    ? 'border-primary bg-primary/10'
                    : 'border-border bg-surface/60'
                }`}
              >
                <Truck size={18} color={role === 'rider' ? '#2563EB' : '#71717A'} />
                <T
                  className={`text-[12.5px] font-semibold ${
                    role === 'rider' ? 'text-primary' : 'text-foreground'
                  }`}
                >
                  Delivery Rider
                </T>
                <Ta className="text-[10px] text-muted-foreground">டெலிவரி ரைடர்</Ta>
              </TouchableOpacity>
            </View>
          </Animated.View>

          {/* Form Fields */}
          <Animated.View entering={FadeInDown.delay(200).duration(300)} className="mt-5 gap-3.5">
            {/* Full Name */}
            <View>
              <T className="text-[12px] font-medium text-foreground">Full Name / முழு பெயர்</T>
              <View className="mt-1.5 flex-row items-center rounded-xl border border-border bg-surface px-3.5 py-2.5">
                <TextInput
                  value={name}
                  onChangeText={setName}
                  placeholder="e.g. Anand Kumar"
                  placeholderTextColor="#A1A1AA"
                  className="flex-1 text-[15px] text-foreground"
                  autoCapitalize="words"
                />
              </View>
            </View>

            {/* Mobile Number */}
            <View>
              <T className="text-[12px] font-medium text-foreground">
                Mobile Number / அலைபேசி எண்
              </T>
              <View className="mt-1.5 flex-row items-center rounded-xl border border-border bg-surface px-3.5 py-2.5">
                <T className="font-mono text-[15px] font-semibold text-placeholder mr-2">+91</T>
                <TextInput
                  value={national}
                  onChangeText={setNational}
                  placeholder="98765 43210"
                  placeholderTextColor="#A1A1AA"
                  keyboardType="number-pad"
                  maxLength={10}
                  className="flex-1 font-mono text-[15px] tracking-wide text-foreground"
                />
                {isPhoneValid && (
                  <View className="size-5 items-center justify-center rounded-full bg-emerald-500">
                    <Check size={12} color="#FFFFFF" strokeWidth={3} />
                  </View>
                )}
              </View>
            </View>

            {/* Locality Selector */}
            <View>
              <T className="text-[12px] font-medium text-foreground">
                Madurai Locality / பகுதி
              </T>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: 8, paddingVertical: 8 }}
              >
                {LOCALITIES.map((loc) => {
                  const isSelected = selectedLocality.id === loc.id;
                  return (
                    <TouchableOpacity
                      key={loc.id}
                      onPress={() => setSelectedLocality(loc)}
                      className={`flex-row items-center gap-1.5 rounded-full px-3 py-1.5 border ${
                        isSelected
                          ? 'border-primary bg-primary text-white'
                          : 'border-border bg-surface'
                      }`}
                    >
                      <MapPin size={12} color={isSelected ? '#FFFFFF' : '#71717A'} />
                      <T
                        className={`text-[12px] font-medium ${
                          isSelected ? 'text-white' : 'text-foreground'
                        }`}
                      >
                        {loc.name}
                      </T>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>

            {/* Role-Specific Detail Field */}
            <View>
              <T className="text-[12px] font-medium text-foreground">
                {role === 'vendor'
                  ? 'Store / Restaurant Name'
                  : role === 'rider'
                  ? 'Vehicle Details (e.g. Hero Splendor TN-59)'
                  : 'Delivery Address / Landmark'}
              </T>
              <View className="mt-1.5 flex-row items-center rounded-xl border border-border bg-surface px-3.5 py-2.5">
                <TextInput
                  value={extraDetail}
                  onChangeText={setExtraDetail}
                  placeholder={
                    role === 'vendor'
                      ? 'e.g. Simmakkal Konar Mess'
                      : role === 'rider'
                      ? 'e.g. Honda Activa 6G (TN-59-AB-1234)'
                      : 'e.g. 14, 80 Feet Road, Apollo Hospital Pakkam'
                  }
                  placeholderTextColor="#A1A1AA"
                  className="flex-1 text-[14px] text-foreground"
                />
              </View>
            </View>
          </Animated.View>

          {error && (
            <View className="mt-4">
              <ErrorNote message={error} />
            </View>
          )}

          {/* Submit Button */}
          <Animated.View entering={FadeInUp.delay(300).duration(300)} className="mt-6">
            <Button
              label={busy ? 'Creating account...' : 'Complete Registration'}
              variant="primary"
              disabled={!canSubmit}
              loading={busy}
              onPress={handleRegister}
            />
          </Animated.View>

          {/* Already have account */}
          <View className="mt-5 items-center">
            <TouchableOpacity onPress={() => router.back()} hitSlop={12}>
              <T className="text-[13px] text-muted-foreground">
                Already registered?{' '}
                <T className="font-semibold text-primary">Sign in here</T>
              </T>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}
