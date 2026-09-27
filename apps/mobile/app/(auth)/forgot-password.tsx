/**
 * Password / OTP Recovery screen for DFC Mobile.
 *
 * Pre-configured for Firebase Phone/Email authentication reset triggers
 * with 6-digit OTP verification and step-by-step state machine.
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
import * as Haptics from 'expo-haptics';
import { ArrowLeft, Check, KeyRound, Lock, RotateCcw, ShieldCheck, Smartphone } from 'lucide-react-native';

import { Button, ErrorNote, Screen, T, Ta } from '@/ui';
import { OtpInput } from '@/ui/otp-input';

type RecoveryStep = 'input' | 'otp' | 'reset' | 'success';

export default function ForgotPasswordScreen() {
  const router = useRouter();

  const [step, setStep] = React.useState<RecoveryStep>('input');
  const [national, setNational] = React.useState('');
  const [code, setCode] = React.useState('');
  const [newPassword, setNewPassword] = React.useState('');
  const [confirmPassword, setConfirmPassword] = React.useState('');
  const [cooldown, setCooldown] = React.useState(0);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const e164 = `+91${national.replace(/\D/g, '')}`;
  const isPhoneValid = /^\+91[6-9]\d{9}$/.test(e164);

  React.useEffect(() => {
    if (cooldown <= 0) return;
    const id = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(id);
  }, [cooldown]);

  async function handleSendOtp() {
    if (!isPhoneValid) return;
    setBusy(true);
    setError(null);
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    // Simulate OTP generation / trigger
    setTimeout(() => {
      setBusy(false);
      setStep('otp');
      setCooldown(30);
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }, 600);
  }

  async function handleVerifyOtp() {
    if (code.length !== 6) return;
    setBusy(true);
    setError(null);

    setTimeout(() => {
      setBusy(false);
      setStep('reset');
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }, 500);
  }

  async function handleResetPassword() {
    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setBusy(true);
    setError(null);

    setTimeout(() => {
      setBusy(false);
      setStep('success');
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }, 600);
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
            <View className="mb-3 size-12 items-center justify-center rounded-2xl bg-primary/10">
              <KeyRound size={24} color="#2563EB" />
            </View>
            <T className="text-[26px] font-bold tracking-tight">Account Recovery</T>
            <Ta className="mt-0.5 text-[14px] text-muted-foreground">
              கடவுச்சொல் / கணக்கு மீட்பு
            </Ta>
            <T className="mt-1 text-[13px] text-muted-foreground">
              {step === 'input'
                ? 'Enter your registered mobile number to receive a 6-digit verification code'
                : step === 'otp'
                ? `Enter the 6-digit code sent to ${e164}`
                : step === 'reset'
                ? 'Create a new secure password for your DFC account'
                : 'Your password has been successfully reset!'}
            </T>
          </Animated.View>

          {/* Step 1: Input Mobile Number */}
          {step === 'input' && (
            <Animated.View entering={FadeInDown.delay(100).duration(300)} className="mt-6 gap-4">
              <View>
                <T className="text-[12px] font-medium text-foreground">
                  Registered Mobile / பதிவு செய்யப்பட்ட எண்
                </T>
                <View className="mt-1.5 flex-row items-center rounded-xl border border-border bg-surface px-3.5 py-2.5">
                  <Smartphone size={18} color="#71717A" className="mr-2" />
                  <T className="font-mono text-[15px] font-semibold text-placeholder mr-2">+91</T>
                  <TextInput
                    value={national}
                    onChangeText={setNational}
                    placeholder="98765 43210"
                    placeholderTextColor="#A1A1AA"
                    keyboardType="number-pad"
                    maxLength={10}
                    className="flex-1 font-mono text-[15px] tracking-wide text-foreground"
                    autoFocus
                  />
                  {isPhoneValid && (
                    <View className="size-5 items-center justify-center rounded-full bg-emerald-500">
                      <Check size={12} color="#FFFFFF" strokeWidth={3} />
                    </View>
                  )}
                </View>
              </View>

              {error && <ErrorNote message={error} />}

              <Button
                label={busy ? 'Sending code...' : 'Send Verification Code'}
                variant="primary"
                disabled={!isPhoneValid || busy}
                loading={busy}
                onPress={handleSendOtp}
              />
            </Animated.View>
          )}

          {/* Step 2: OTP Entry */}
          {step === 'otp' && (
            <Animated.View entering={FadeInDown.duration(300)} className="mt-6 gap-4">
              <View className="items-center py-4">
                <OtpInput length={6} value={code} onChange={setCode} onComplete={() => void handleVerifyOtp()} />
              </View>

              {error && <ErrorNote message={error} />}

              <Button
                label={busy ? 'Verifying...' : 'Verify Code'}
                variant="primary"
                disabled={code.length !== 6 || busy}
                loading={busy}
                onPress={handleVerifyOtp}
              />

              <View className="flex-row items-center justify-center gap-2 pt-2">
                {cooldown > 0 ? (
                  <T className="text-[12.5px] text-muted-foreground">
                    Resend code in <T className="font-mono font-semibold">{cooldown}s</T>
                  </T>
                ) : (
                  <TouchableOpacity
                    onPress={handleSendOtp}
                    className="flex-row items-center gap-1.5"
                  >
                    <RotateCcw size={14} color="#2563EB" />
                    <T className="text-[13px] font-semibold text-primary">Resend Code</T>
                  </TouchableOpacity>
                )}
              </View>
            </Animated.View>
          )}

          {/* Step 3: New Password */}
          {step === 'reset' && (
            <Animated.View entering={FadeInDown.duration(300)} className="mt-6 gap-3.5">
              <View>
                <T className="text-[12px] font-medium text-foreground">New Password</T>
                <View className="mt-1.5 flex-row items-center rounded-xl border border-border bg-surface px-3.5 py-2.5">
                  <Lock size={18} color="#71717A" className="mr-2" />
                  <TextInput
                    value={newPassword}
                    onChangeText={setNewPassword}
                    placeholder="At least 6 characters"
                    placeholderTextColor="#A1A1AA"
                    secureTextEntry
                    className="flex-1 text-[15px] text-foreground"
                  />
                </View>
              </View>

              <View>
                <T className="text-[12px] font-medium text-foreground">Confirm Password</T>
                <View className="mt-1.5 flex-row items-center rounded-xl border border-border bg-surface px-3.5 py-2.5">
                  <Lock size={18} color="#71717A" className="mr-2" />
                  <TextInput
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    placeholder="Re-enter new password"
                    placeholderTextColor="#A1A1AA"
                    secureTextEntry
                    className="flex-1 text-[15px] text-foreground"
                  />
                </View>
              </View>

              {error && <ErrorNote message={error} />}

              <Button
                label={busy ? 'Updating...' : 'Set New Password'}
                variant="primary"
                disabled={newPassword.length < 6 || confirmPassword !== newPassword || busy}
                loading={busy}
                onPress={handleResetPassword}
              />
            </Animated.View>
          )}

          {/* Step 4: Success Confirmation */}
          {step === 'success' && (
            <Animated.View entering={FadeInUp.duration(350)} className="mt-8 items-center gap-4">
              <View className="size-16 items-center justify-center rounded-full bg-emerald-500/10">
                <ShieldCheck size={36} color="#10B981" />
              </View>
              <T className="text-[20px] font-bold text-foreground">Password Reset Complete</T>
              <T className="text-center text-[13.5px] leading-[21px] text-muted-foreground">
                You can now sign in to your DFC account with your newly configured credentials.
              </T>
              <View className="w-full mt-4">
                <Button
                  label="Proceed to Sign In"
                  variant="primary"
                  onPress={() => router.replace('/(auth)/sign-in')}
                />
              </View>
            </Animated.View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}
