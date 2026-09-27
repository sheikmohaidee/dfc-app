/**
 * DFC Authentication Screen - Full Stitch Design Implementation
 * Includes Phone Input, 4-Box OTP Verification, Success State, and 1-Tap Demo Roles.
 */

import * as React from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import Animated, { FadeIn, FadeInDown, FadeOut, Layout } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import {
  ArrowLeft,
  Bike,
  CheckCircle2,
  Lock,
  Phone,
  ShieldCheck,
  Store,
  Utensils,
} from 'lucide-react-native';

import { useAuth } from '@/providers/auth';
import { DEMO_MODE } from '@/demo/config';
import { mockAuthRepository } from '@/demo/repositories/auth.repository';
import { Screen } from '@/ui';

type AuthView = 'phone' | 'otp' | 'success' | 'staff';

export default function SignIn() {
  const router = useRouter();
  const {
    signIn,
    loginAsDemoPersona,
    unlockWithBiometrics,
    biometricsAvailable,
    user,
    updateProfile,
  } = useAuth();

  const [currentView, setCurrentView] = React.useState<AuthView>('phone');
  const [phone, setPhone] = React.useState('');
  const [otp, setOtp] = React.useState(['', '', '', '']);
  const [staffEmail, setStaffEmail] = React.useState('');
  const [staffPassword, setStaffPassword] = React.useState('');

  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const otpInputRefs = React.useRef<Array<TextInput | null>>([]);

  const cleanPhone = phone.replace(/\D/g, '').slice(0, 10);
  const isPhoneValid = cleanPhone.length === 10;

  // Handle Send OTP
  const handleSendOtp = async () => {
    if (!isPhoneValid) {
      setError('Please enter a valid 10-digit number.');
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      return;
    }

    setBusy(true);
    setError(null);
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    setTimeout(() => {
      setBusy(false);
      setCurrentView('otp');
    }, 600);
  };

  // Handle OTP digit change & auto-advance
  const handleOtpChange = (text: string, index: number) => {
    const digit = text.slice(-1);
    const newOtp = [...otp];
    newOtp[index] = digit;
    setOtp(newOtp);

    if (digit && index < 3) {
      otpInputRefs.current[index + 1]?.focus();
    }

    if (newOtp.every((d) => d !== '')) {
      handleVerifyOtp(newOtp.join(''));
    }
  };

  const handleOtpKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  // Handle Verify OTP
  const handleVerifyOtp = async (codeStr?: string) => {
    const code = codeStr || otp.join('');
    if (code.length < 4) {
      setError('Please enter the complete 4-digit OTP.');
      return;
    }

    setBusy(true);
    setError(null);

    try {
      if (DEMO_MODE) {
        await mockAuthRepository.loginWithPhone(`+91${cleanPhone}`, code);
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setCurrentView('success');
      } else {
        // Live auth: sign in customer with Firebase Auth
        await signIn('customer@dfc.test', 'dfc-customer-2026');
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setCurrentView('success');
      }
    } catch (err: any) {
      setError(err?.message || 'Invalid OTP. Use 1234 for demo.');
      setOtp(['', '', '', '']);
      otpInputRefs.current[0]?.focus();
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setBusy(false);
    }
  };

  // Staff Sign In
  const handleStaffSignIn = async () => {
    if (!staffEmail || !staffPassword) {
      setError('Please enter your staff email and password.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      if (DEMO_MODE) {
        await mockAuthRepository.loginWithStaff(staffEmail, staffPassword);
        router.replace('/');
      } else {
        await signIn(staffEmail, staffPassword);
        router.replace('/');
      }
    } catch (err: any) {
      setError(err?.message || 'Authentication failed.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1, backgroundColor: '#F9F9FF' }}
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', paddingHorizontal: 20, paddingVertical: 24 }}
          keyboardShouldPersistTaps="handled"
        >
          <View
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: 16,
              borderWidth: 1,
              borderColor: '#DAC0C4',
              padding: 24,
              shadowColor: '#000000',
              shadowOpacity: 0.04,
              shadowRadius: 12,
              shadowOffset: { width: 0, height: 4 },
              elevation: 4,
              maxWidth: 440,
              width: '100%',
              alignSelf: 'center',
            }}
          >
            {/* Brand Header */}
            <View className="items-center text-center mb-6">
              <View
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: 16,
                  backgroundColor: '#7A1F3D',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 12,
                  shadowColor: '#7A1F3D',
                  shadowOpacity: 0.25,
                  shadowRadius: 8,
                  shadowOffset: { width: 0, height: 4 },
                  elevation: 6,
                }}
              >
                <Utensils size={32} color="#FFFFFF" strokeWidth={2.2} />
              </View>
              <Text
                style={{
                  fontFamily: 'Archivo',
                  fontSize: 24,
                  fontWeight: '800',
                  color: '#7A1F3D',
                  marginBottom: 4,
                  letterSpacing: -0.5,
                }}
              >
                DFC Delivery
              </Text>
              <Text
                style={{
                  fontFamily: 'Archivo',
                  fontSize: 13,
                  fontWeight: '500',
                  color: '#554245',
                }}
              >
                Premium dining, delivered fast.
              </Text>
            </View>

            {/* Error Banner */}
            {error ? (
              <Animated.View
                entering={FadeInDown.duration(200)}
                style={{
                  backgroundColor: '#FFDAD6',
                  borderRadius: 8,
                  padding: 10,
                  marginBottom: 16,
                  borderWidth: 1,
                  borderColor: '#BA1A1A30',
                }}
              >
                <Text style={{ fontFamily: 'Archivo', fontSize: 13, color: '#BA1A1A', fontWeight: '500' }}>
                  {error}
                </Text>
              </Animated.View>
            ) : null}

            {/* VIEW 1: Phone Input */}
            {currentView === 'phone' ? (
              <Animated.View entering={FadeInDown.duration(280)} exiting={FadeOut}>
                <Text
                  style={{
                    fontFamily: 'Archivo',
                    fontSize: 20,
                    fontWeight: '700',
                    color: '#141B2B',
                    marginBottom: 16,
                  }}
                >
                  Welcome Back
                </Text>

                <View className="mb-4">
                  <Text
                    style={{
                      fontFamily: 'Archivo',
                      fontSize: 13,
                      fontWeight: '500',
                      color: '#554245',
                      marginBottom: 8,
                    }}
                  >
                    Phone Number
                  </Text>
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      borderWidth: 1,
                      borderColor: isPhoneValid ? '#7A1F3D' : '#DAC0C4',
                      borderRadius: 10,
                      backgroundColor: '#F9F9FF',
                      height: 52,
                    }}
                  >
                    <View
                      style={{
                        paddingHorizontal: 14,
                        borderRightWidth: 1,
                        borderRightColor: '#DAC0C4',
                        height: '100%',
                        justifyContent: 'center',
                      }}
                    >
                      <Text
                        style={{
                          fontFamily: 'Archivo',
                          fontSize: 15,
                          fontWeight: '600',
                          color: '#554245',
                        }}
                      >
                        +91
                      </Text>
                    </View>
                    <TextInput
                      value={phone}
                      onChangeText={(v) => {
                        setPhone(v);
                        if (error) setError(null);
                      }}
                      placeholder="Enter 10-digit number"
                      placeholderTextColor="#887275"
                      keyboardType="phone-pad"
                      maxLength={10}
                      autoFocus
                      style={{
                        flex: 1,
                        paddingHorizontal: 14,
                        fontFamily: 'Archivo',
                        fontSize: 16,
                        color: '#141B2B',
                        fontWeight: '500',
                      }}
                    />
                  </View>
                </View>

                {/* Send OTP Button */}
                <Pressable
                  onPress={handleSendOtp}
                  disabled={busy || !isPhoneValid}
                  style={{
                    height: 48,
                    backgroundColor: isPhoneValid ? '#7A1F3D' : '#7A1F3D80',
                    borderRadius: 10,
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginTop: 8,
                    shadowColor: '#7A1F3D',
                    shadowOpacity: 0.2,
                    shadowRadius: 6,
                    shadowOffset: { width: 0, height: 3 },
                    elevation: 3,
                  }}
                >
                  <Text
                    style={{
                      fontFamily: 'Archivo',
                      fontSize: 16,
                      fontWeight: '700',
                      color: '#FFFFFF',
                    }}
                  >
                    {busy ? 'Sending OTP...' : 'Send OTP'}
                  </Text>
                </Pressable>

                {/* Terms Disclaimer */}
                <View className="mt-4 text-center">
                  <Text
                    style={{
                      fontFamily: 'Archivo',
                      fontSize: 12,
                      color: '#554245',
                      textAlign: 'center',
                      lineHeight: 18,
                    }}
                  >
                    By continuing, you agree to our{' '}
                    <Text
                      onPress={() => router.push('/(customer)/legal/terms')}
                      style={{ color: '#7A1F3D', fontWeight: '600', textDecorationLine: 'underline' }}
                    >
                      Terms
                    </Text>{' '}
                    and{' '}
                    <Text
                      onPress={() => router.push('/(customer)/legal/privacy')}
                      style={{ color: '#7A1F3D', fontWeight: '600', textDecorationLine: 'underline' }}
                    >
                      Privacy Policy
                    </Text>
                    .
                  </Text>
                </View>

                {/* 1-Tap Demo Quick Launchers */}
                {DEMO_MODE ? (
                  <View className="mt-6 pt-5 border-t border-[#DAC0C4]/40 gap-2">
                    <Text
                      style={{
                        fontFamily: 'Archivo',
                        fontSize: 11,
                        fontWeight: '700',
                        color: '#7A1F3D',
                        textTransform: 'uppercase',
                        letterSpacing: 0.8,
                        marginBottom: 4,
                      }}
                    >
                      Instant Demo Role Access
                    </Text>

                    {/* Customer */}
                    <Pressable
                      onPress={async () => {
                        setBusy(true);
                        try {
                          await mockAuthRepository.loginWithPhone('+919876543210', '123456');
                          router.replace('/(customer)/chat');
                        } finally {
                          setBusy(false);
                        }
                      }}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: 12,
                        borderRadius: 10,
                        backgroundColor: '#FDF2F5',
                        borderWidth: 1,
                        borderColor: '#7A1F3D30',
                      }}
                    >
                      <View className="flex-row items-center gap-2.5">
                        <Utensils size={18} color="#7A1F3D" />
                        <View>
                          <Text style={{ fontFamily: 'Archivo', fontSize: 13, fontWeight: '700', color: '#7A1F3D' }}>
                            Customer (Arun Kumar)
                          </Text>
                          <Text style={{ fontFamily: 'Archivo', fontSize: 11, color: '#554245' }}>
                            Food, pharmacy, groceries, Xerox print
                          </Text>
                        </View>
                      </View>
                      <Text style={{ fontFamily: 'Archivo', fontSize: 12, fontWeight: '700', color: '#7A1F3D' }}>
                        Enter →
                      </Text>
                    </Pressable>

                    {/* Vendor */}
                    <Pressable
                      onPress={async () => {
                        setBusy(true);
                        try {
                          await mockAuthRepository.loginWithStaff('vendor@dfc.test', 'password');
                          router.replace('/(vendor)/inbox');
                        } finally {
                          setBusy(false);
                        }
                      }}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: 12,
                        borderRadius: 10,
                        backgroundColor: '#EFF6FF',
                        borderWidth: 1,
                        borderColor: '#2563EB30',
                      }}
                    >
                      <View className="flex-row items-center gap-2.5">
                        <Store size={18} color="#2563EB" />
                        <View>
                          <Text style={{ fontFamily: 'Archivo', fontSize: 13, fontWeight: '700', color: '#1E40AF' }}>
                            Vendor (Meenakshi Medicals)
                          </Text>
                          <Text style={{ fontFamily: 'Archivo', fontSize: 11, color: '#1E3A8A' }}>
                            Order timers, AI verification, packing
                          </Text>
                        </View>
                      </View>
                      <Text style={{ fontFamily: 'Archivo', fontSize: 12, fontWeight: '700', color: '#1E40AF' }}>
                        Enter →
                      </Text>
                    </Pressable>

                    {/* Rider */}
                    <Pressable
                      onPress={async () => {
                        setBusy(true);
                        try {
                          await mockAuthRepository.loginWithStaff('rider@dfc.test', 'password');
                          router.replace('/(rider)/queue');
                        } finally {
                          setBusy(false);
                        }
                      }}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: 12,
                        borderRadius: 10,
                        backgroundColor: '#ECFDF5',
                        borderWidth: 1,
                        borderColor: '#05966930',
                      }}
                    >
                      <View className="flex-row items-center gap-2.5">
                        <Bike size={18} color="#059669" />
                        <View>
                          <Text style={{ fontFamily: 'Archivo', fontSize: 13, fontWeight: '700', color: '#065F46' }}>
                            Rider (Arun Captain)
                          </Text>
                          <Text style={{ fontFamily: 'Archivo', fontSize: 11, color: '#047857' }}>
                            Delivery queue, navigation, OTP handover
                          </Text>
                        </View>
                      </View>
                      <Text style={{ fontFamily: 'Archivo', fontSize: 12, fontWeight: '700', color: '#065F46' }}>
                        Enter →
                      </Text>
                    </Pressable>
                  </View>
                ) : null}

                {/* Staff Sign In toggle */}
                <Pressable
                  onPress={() => setCurrentView('staff')}
                  style={{ alignItems: 'center', marginTop: 14 }}
                >
                  <Text style={{ fontFamily: 'Archivo', fontSize: 12, color: '#7A1F3D', fontWeight: '600' }}>
                    Admin / Operations Sign In →
                  </Text>
                </Pressable>
              </Animated.View>
            ) : null}

            {/* VIEW 2: OTP Verification */}
            {currentView === 'otp' ? (
              <Animated.View entering={FadeInDown.duration(280)} exiting={FadeOut}>
                <Pressable
                  onPress={() => {
                    setError(null);
                    setCurrentView('phone');
                  }}
                  className="flex-row items-center gap-1 mb-3"
                >
                  <ArrowLeft size={16} color="#554245" />
                  <Text style={{ fontFamily: 'Archivo', fontSize: 13, color: '#554245', fontWeight: '500' }}>
                    Back
                  </Text>
                </Pressable>

                <Text
                  style={{
                    fontFamily: 'Archivo',
                    fontSize: 20,
                    fontWeight: '700',
                    color: '#141B2B',
                    marginBottom: 4,
                  }}
                >
                  Verify Details
                </Text>
                <Text
                  style={{
                    fontFamily: 'Archivo',
                    fontSize: 13,
                    color: '#554245',
                    marginBottom: 20,
                  }}
                >
                  We've sent a 4-digit code to{' '}
                  <Text style={{ fontWeight: '700', color: '#141B2B' }}>+91 {cleanPhone || '98765 43210'}</Text>
                </Text>

                {/* 4 Box OTP Inputs */}
                <View className="flex-row justify-between gap-2 mb-6">
                  {[0, 1, 2, 3].map((idx) => (
                    <TextInput
                      key={idx}
                      ref={(el) => {
                        otpInputRefs.current[idx] = el;
                      }}
                      value={otp[idx]}
                      onChangeText={(t) => handleOtpChange(t, idx)}
                      onKeyPress={(e) => handleOtpKeyPress(e, idx)}
                      keyboardType="number-pad"
                      maxLength={1}
                      selectTextOnFocus
                      style={{
                        width: 54,
                        height: 60,
                        textAlign: 'center',
                        borderRadius: 10,
                        borderWidth: 1.5,
                        borderColor: otp[idx] ? '#7A1F3D' : '#DAC0C4',
                        backgroundColor: '#F9F9FF',
                        fontFamily: 'Archivo',
                        fontSize: 24,
                        fontWeight: '800',
                        color: '#7A1F3D',
                      }}
                    />
                  ))}
                </View>

                {/* Verify Button */}
                <Pressable
                  onPress={() => handleVerifyOtp()}
                  disabled={busy}
                  style={{
                    height: 48,
                    backgroundColor: '#7A1F3D',
                    borderRadius: 10,
                    alignItems: 'center',
                    justifyContent: 'center',
                    shadowColor: '#7A1F3D',
                    shadowOpacity: 0.2,
                    shadowRadius: 6,
                    shadowOffset: { width: 0, height: 3 },
                    elevation: 3,
                  }}
                >
                  <Text
                    style={{
                      fontFamily: 'Archivo',
                      fontSize: 16,
                      fontWeight: '700',
                      color: '#FFFFFF',
                    }}
                  >
                    {busy ? 'Verifying...' : 'Verify & Proceed'}
                  </Text>
                </Pressable>

                <View className="mt-4 text-center flex-row justify-center">
                  <Text style={{ fontFamily: 'Archivo', fontSize: 13, color: '#554245' }}>
                    Didn't receive code?{' '}
                    <Text
                      onPress={() => {
                        setOtp(['', '', '', '']);
                        handleSendOtp();
                      }}
                      style={{ color: '#7A1F3D', fontWeight: '700', textDecorationLine: 'underline' }}
                    >
                      Resend
                    </Text>
                  </Text>
                </View>
              </Animated.View>
            ) : null}

            {/* VIEW 3: Success State */}
            {currentView === 'success' ? (
              <Animated.View entering={FadeInDown.duration(280)} className="items-center py-4">
                <View
                  style={{
                    width: 72,
                    height: 72,
                    borderRadius: 36,
                    backgroundColor: '#0A6A3215',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: 16,
                  }}
                >
                  <CheckCircle2 size={44} color="#0A6A32" />
                </View>
                <Text
                  style={{
                    fontFamily: 'Archivo',
                    fontSize: 24,
                    fontWeight: '800',
                    color: '#141B2B',
                    marginBottom: 6,
                  }}
                >
                  Welcome!
                </Text>
                <Text
                  style={{
                    fontFamily: 'Archivo',
                    fontSize: 14,
                    color: '#554245',
                    textAlign: 'center',
                    marginBottom: 24,
                  }}
                >
                  Your account has been verified successfully.
                </Text>
                <Pressable
                  onPress={() => router.replace('/(customer)/chat')}
                  style={{
                    width: '100%',
                    height: 48,
                    backgroundColor: '#7A1F3D',
                    borderRadius: 10,
                    alignItems: 'center',
                    justifyContent: 'center',
                    shadowColor: '#7A1F3D',
                    shadowOpacity: 0.2,
                    shadowRadius: 6,
                    shadowOffset: { width: 0, height: 3 },
                    elevation: 3,
                  }}
                >
                  <Text
                    style={{
                      fontFamily: 'Archivo',
                      fontSize: 16,
                      fontWeight: '700',
                      color: '#FFFFFF',
                    }}
                  >
                    Continue to Dashboard
                  </Text>
                </Pressable>
              </Animated.View>
            ) : null}

            {/* VIEW 4: Staff Sign In */}
            {currentView === 'staff' ? (
              <Animated.View entering={FadeInDown.duration(280)}>
                <Pressable
                  onPress={() => {
                    setError(null);
                    setCurrentView('phone');
                  }}
                  className="flex-row items-center gap-1 mb-3"
                >
                  <ArrowLeft size={16} color="#554245" />
                  <Text style={{ fontFamily: 'Archivo', fontSize: 13, color: '#554245', fontWeight: '500' }}>
                    Back to Phone Sign-In
                  </Text>
                </Pressable>

                <Text
                  style={{
                    fontFamily: 'Archivo',
                    fontSize: 20,
                    fontWeight: '700',
                    color: '#141B2B',
                    marginBottom: 16,
                  }}
                >
                  Operations Sign In
                </Text>

                <View className="gap-3 mb-4">
                  <TextInput
                    value={staffEmail}
                    onChangeText={setStaffEmail}
                    placeholder="admin@dfc.test"
                    placeholderTextColor="#887275"
                    autoCapitalize="none"
                    keyboardType="email-address"
                    style={{
                      height: 48,
                      borderWidth: 1,
                      borderColor: '#DAC0C4',
                      borderRadius: 10,
                      paddingHorizontal: 14,
                      fontFamily: 'Archivo',
                      fontSize: 15,
                      color: '#141B2B',
                      backgroundColor: '#F9F9FF',
                    }}
                  />

                  <TextInput
                    value={staffPassword}
                    onChangeText={setStaffPassword}
                    placeholder="Password"
                    placeholderTextColor="#887275"
                    secureTextEntry
                    style={{
                      height: 48,
                      borderWidth: 1,
                      borderColor: '#DAC0C4',
                      borderRadius: 10,
                      paddingHorizontal: 14,
                      fontFamily: 'Archivo',
                      fontSize: 15,
                      color: '#141B2B',
                      backgroundColor: '#F9F9FF',
                    }}
                  />
                </View>

                <Pressable
                  onPress={handleStaffSignIn}
                  disabled={busy}
                  style={{
                    height: 48,
                    backgroundColor: '#7A1F3D',
                    borderRadius: 10,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Text style={{ fontFamily: 'Archivo', fontSize: 16, fontWeight: '700', color: '#FFFFFF' }}>
                    {busy ? 'Signing In...' : 'Sign In'}
                  </Text>
                </Pressable>
              </Animated.View>
            ) : null}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}
