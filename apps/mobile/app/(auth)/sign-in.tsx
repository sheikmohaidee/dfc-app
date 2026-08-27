/**
 * Sign in.
 *
 * One screen, three states, no navigation between them: number → code →
 * (first time only) name. Bouncing between routes for a two-field flow is what
 * makes most Indian delivery apps feel like paperwork.
 *
 * A returning customer never sees any of it — a live session plus an enrolled
 * fingerprint means the app opens straight into the thread.
 *
 * Phone-first, because this is Madurai: nobody wants to invent a password to
 * buy paracetamol, and the number is what a rider needs anyway. Email is
 * tucked behind "Staff sign-in" for admins and vendors.
 */

import * as React from 'react';
import { KeyboardAvoidingView, Platform, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import Animated, { FadeIn, FadeInDown, FadeOut, Layout } from 'react-native-reanimated';
import * as Location from 'expo-location';
import * as Haptics from 'expo-haptics';
import { ArrowLeft, Check, Fingerprint, MapPin } from 'lucide-react-native';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { PhoneAuthProvider, signInWithCredential } from 'firebase/auth';

import { COL, COPY, nearestLocality, type Locality } from '@dfc/core';

import { useAuth } from '@/providers/auth';
import { auth, db } from '@/lib/firebase';
import { Hero3D } from '@/ui/hero-3d';
import { AuroraField, GlassCard, PressableScale, PulseDot, useShake } from '@/ui/glass';
import { OtpInput } from '@/ui/otp-input';
import { Button, ErrorNote, Num, Screen, T, Ta } from '@/ui';

type Step = 'number' | 'code' | 'name';

const OTP_LENGTH = 6;
const RESEND_SECONDS = 30;

export default function SignIn() {
  const router = useRouter();
  const {
    signIn,
    unlockWithBiometrics,
    biometricsAvailable,
    user,
    updateProfile,
  } = useAuth();

  const [step, setStep] = React.useState<Step>('number');
  const [national, setNational] = React.useState('');
  const [code, setCode] = React.useState('');
  const [name, setName] = React.useState('');
  const [verificationId, setVerificationId] = React.useState<string | null>(null);

  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [cooldown, setCooldown] = React.useState(0);
  const [locality, setLocality] = React.useState<Locality | null>(null);
  const [staffMode, setStaffMode] = React.useState(false);
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');

  const shake = useShake();

  const e164 = `+91${national.replace(/\D/g, '')}`;
  const numberValid = /^\+91[6-9]\d{9}$/.test(e164);

  // Location resolves alongside sign-in, so the app already knows the locality
  // by the time the session is live.
  React.useEffect(() => {
    void (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') return;
        const pos = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        setLocality(nearestLocality(pos.coords.latitude, pos.coords.longitude));
      } catch {
        /* the customer picks a locality later */
      }
    })();
  }, []);

  // Returning customer: skip the whole screen.
  React.useEffect(() => {
    if (user && biometricsAvailable) {
      void (async () => {
        const ok = await unlockWithBiometrics();
        if (ok) router.replace('/');
      })();
    }
  }, [user, biometricsAvailable, unlockWithBiometrics, router]);

  React.useEffect(() => {
    if (cooldown <= 0) return;
    const id = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(id);
  }, [cooldown]);

  // -------------------------------------------------------------------------

  async function sendCode() {
    setBusy(true);
    setError(null);
    try {
      const provider = new PhoneAuthProvider(auth());
      // On native, App Check supplies the attestation; the verifier argument
      // is a web-only construct.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const id = await provider.verifyPhoneNumber(e164, undefined as any);
      setVerificationId(id);
      setStep('code');
      setCooldown(RESEND_SECONDS);
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (e) {
      const msg = (e as Error).message;
      setError(
        msg.includes('reCAPTCHA') || msg.includes('auth/argument-error')
          ? 'Phone sign-in needs a development build with App Check configured — it cannot work in Expo Go. Use staff sign-in for now.'
          : msg,
      );
      shake.shake();
    } finally {
      setBusy(false);
    }
  }

  async function verify(submitted: string) {
    if (!verificationId) return;
    setBusy(true);
    setError(null);
    try {
      const credential = PhoneAuthProvider.credential(verificationId, submitted);
      const result = await signInWithCredential(auth(), credential);

      const ref = doc(db(), COL.users, result.user.uid);
      const existing = await getDoc(ref);

      if (!existing.exists()) {
        setStep('name');
        setBusy(false);
        return;
      }

      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace('/');
    } catch (e) {
      const c = (e as { code?: string }).code;
      setError(
        c === 'auth/invalid-verification-code'
          ? 'That code is not right. Check the SMS.'
          : c === 'auth/code-expired'
            ? 'That code expired. Ask for a new one.'
            : (e as Error).message,
      );
      setCode('');
      shake.shake();
    } finally {
      setBusy(false);
    }
  }

  async function createProfile() {
    const current = auth().currentUser;
    if (!current || !name.trim()) return;
    setBusy(true);
    setError(null);
    try {
      await setDoc(doc(db(), COL.users, current.uid), {
        uid: current.uid,
        role: 'customer',
        name: name.trim(),
        phone: e164,
        localityId: locality?.id ?? 'kk-nagar',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace('/');
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function staffSignIn() {
    setBusy(true);
    setError(null);
    try {
      await signIn(email, password);
      if (locality) await updateProfile({ localityId: locality.id });
      router.replace('/');
    } catch (e) {
      const c = (e as { code?: string }).code;
      setError(
        c === 'auth/invalid-credential' || c === 'auth/wrong-password'
          ? 'That email and password do not match an account.'
          : (e as Error).message,
      );
      shake.shake();
    } finally {
      setBusy(false);
    }
  }

  // -------------------------------------------------------------------------

  const heading =
    staffMode
      ? { en: 'Staff sign-in', ta: 'ஊழியர் உள்நுழைவு' }
      : step === 'number'
        ? { en: 'What is your\nnumber?', ta: 'உங்கள் எண் என்ன?' }
        : step === 'code'
          ? { en: 'Check your\nmessages', ta: 'குறியீட்டை உள்ளிடவும்' }
          : { en: 'What should we\ncall you?', ta: 'உங்கள் பெயர்' };

  const canBack = staffMode || step !== 'number';

  function back() {
    setError(null);
    if (staffMode) setStaffMode(false);
    else if (step === 'name') setStep('code');
    else if (step === 'code') setStep('number');
  }

  return (
    <Screen edges={['top', 'bottom']}>
      <AuroraField tone="brand">
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          className="flex-1"
        >
          {/* Header */}
          <View className="h-11 flex-row items-center px-4">
            {canBack ? (
              <PressableScale to={0.9} onPress={back} className="size-9 items-center justify-center">
                <ArrowLeft size={21} color="#18181B" strokeWidth={2} />
              </PressableScale>
            ) : (
              <View className="flex-row items-center gap-2.5 px-1">
                <View className="size-7 items-center justify-center rounded-[9px] bg-primary">
                  <T className="text-[12px] font-semibold text-primary-foreground">D</T>
                </View>
                <T className="text-[13px] font-semibold tracking-tight">DFC</T>
              </View>
            )}
          </View>

          {/* The hero shrinks once the keyboard matters. */}
          <Hero3D tone="brand" height={step === 'number' && !staffMode ? 196 : 128} />

          <Animated.View layout={Layout.springify()} className="flex-1 gap-6 px-7 pt-2">
            <View className="gap-2">
              <T style={{ fontSize: 30, fontWeight: '700', letterSpacing: -1.2, lineHeight: 36 }}>
                {heading.en}
              </T>
              <Ta className="text-[14px]">{heading.ta}</Ta>
            </View>

            <Animated.View style={shake.style} className="gap-4">
              {/* --- number --- */}
              {step === 'number' && !staffMode ? (
                <Animated.View entering={FadeInDown.duration(280)} exiting={FadeOut}>
                  <GlassCard className="rounded-[14px]">
                    <View className="flex-row items-center">
                      <View className="h-[58px] w-[72px] items-center justify-center border-r border-white/70">
                        <Num className="text-[16px] font-semibold text-body-strong">+91</Num>
                      </View>
                      <TextInput
                        value={national}
                        onChangeText={(v) => setNational(v.replace(/\D/g, '').slice(0, 10))}
                        placeholder="98765 43210"
                        placeholderTextColor="#A1A1AA"
                        keyboardType="number-pad"
                        textContentType="telephoneNumber"
                        autoFocus
                        accessibilityLabel="Mobile number"
                        className="h-[58px] flex-1 px-4 font-mono text-[20px] tracking-[1.5px] text-foreground"
                      />
                    </View>
                  </GlassCard>
                </Animated.View>
              ) : null}

              {/* --- code --- */}
              {step === 'code' && !staffMode ? (
                <Animated.View entering={FadeInDown.duration(280)} className="gap-4">
                  <View className="flex-row items-center gap-2">
                    <PulseDot color="#2563EB" size={7} />
                    <T className="text-[13.5px] text-muted-foreground">
                      {OTP_LENGTH} digits sent to{' '}
                      <T className="font-mono text-[13px] text-foreground">{e164}</T>
                    </T>
                  </View>

                  <OtpInput
                    value={code}
                    onChange={setCode}
                    onComplete={(v) => void verify(v)}
                    length={OTP_LENGTH}
                    autoFocus
                    error={!!error}
                    disabled={busy}
                  />

                  <PressableScale
                    to={0.96}
                    disabled={cooldown > 0 || busy}
                    onPress={() => void sendCode()}
                    className="h-10 items-center justify-center"
                  >
                    <T
                      className={`text-[13.5px] font-medium ${
                        cooldown > 0 ? 'text-placeholder' : 'text-foreground'
                      }`}
                    >
                      {cooldown > 0 ? `Resend in ${cooldown}s` : 'Send a new code'}
                    </T>
                  </PressableScale>
                </Animated.View>
              ) : null}

              {/* --- name (first sign-in only) --- */}
              {step === 'name' && !staffMode ? (
                <Animated.View entering={FadeInDown.duration(280)} className="gap-3">
                  <GlassCard className="rounded-[14px]">
                    <TextInput
                      value={name}
                      onChangeText={setName}
                      placeholder="R. Karthikeyan"
                      placeholderTextColor="#A1A1AA"
                      autoCapitalize="words"
                      autoFocus
                      accessibilityLabel="Your name"
                      className="h-[58px] px-4 font-sans text-[17px] text-foreground"
                    />
                  </GlassCard>
                  <T className="px-1 text-[12.5px] leading-[18px] text-muted-foreground">
                    Your rider asks for this name at the door.
                  </T>
                </Animated.View>
              ) : null}

              {/* --- staff --- */}
              {staffMode ? (
                <Animated.View entering={FadeInDown.duration(280)} className="gap-2.5">
                  <GlassCard className="rounded-[14px]">
                    <TextInput
                      value={email}
                      onChangeText={setEmail}
                      placeholder="you@dfc.in"
                      placeholderTextColor="#A1A1AA"
                      autoCapitalize="none"
                      autoComplete="email"
                      keyboardType="email-address"
                      className="h-[54px] px-4 font-sans text-[16px] text-foreground"
                    />
                  </GlassCard>
                  <GlassCard className="rounded-[14px]">
                    <TextInput
                      value={password}
                      onChangeText={setPassword}
                      placeholder="Password"
                      placeholderTextColor="#A1A1AA"
                      secureTextEntry
                      autoComplete="current-password"
                      className="h-[54px] px-4 font-sans text-[16px] text-foreground"
                    />
                  </GlassCard>
                </Animated.View>
              ) : null}
            </Animated.View>

            {/* Locality, resolved in the background. */}
            {locality && step === 'number' ? (
              <Animated.View
                entering={FadeIn.delay(200)}
                className="flex-row items-center gap-2 self-start rounded-full border border-grocery-border bg-grocery-tint px-3 py-1.5"
              >
                <Check size={12} color="#15803D" strokeWidth={3} />
                <MapPin size={12} color="#15803D" strokeWidth={2.2} />
                <T className="text-[11.5px] font-medium text-grocery-fg">
                  {locality.name}, Madurai
                </T>
              </Animated.View>
            ) : null}

            {error ? <ErrorNote message={error} /> : null}
          </Animated.View>

          {/* Action */}
          <View className="gap-2.5 px-7 pb-5">
            <Button
              size="lg"
              label={
                staffMode
                  ? 'Sign in'
                  : step === 'number'
                    ? 'Send code'
                    : step === 'code'
                      ? 'Verify'
                      : 'Create my account'
              }
              labelTa={
                staffMode ? undefined : step === 'number' ? 'குறியீடு அனுப்பு' : 'தொடரவும்'
              }
              loading={busy}
              disabled={
                staffMode
                  ? !email || !password
                  : step === 'number'
                    ? !numberValid
                    : step === 'code'
                      ? code.length < OTP_LENGTH
                      : !name.trim()
              }
              onPress={() => {
                if (staffMode) void staffSignIn();
                else if (step === 'number') void sendCode();
                else if (step === 'code') void verify(code);
                else void createProfile();
              }}
            />

            {!staffMode && step === 'number' ? (
              <View className="flex-row items-center justify-center gap-4 pt-1">
                {biometricsAvailable && user ? (
                  <PressableScale
                    to={0.94}
                    onPress={() => void unlockWithBiometrics().then((ok) => ok && router.replace('/'))}
                    className="h-10 flex-row items-center gap-2 px-2"
                  >
                    <Fingerprint size={17} color="#3F3F46" strokeWidth={1.9} />
                    <T className="text-[13.5px] font-medium text-body-strong">Unlock</T>
                  </PressableScale>
                ) : null}
                <PressableScale
                  to={0.94}
                  onPress={() => setStaffMode(true)}
                  className="h-10 justify-center px-2"
                >
                  <T className="text-[13.5px] font-medium text-muted-foreground">
                    Staff sign-in
                  </T>
                </PressableScale>
              </View>
            ) : null}

            {step === 'number' && !staffMode ? (
              <T className="px-2 text-center text-[11px] leading-[16px] text-placeholder">
                By continuing you agree to our Terms and Privacy Policy. SMS charges may apply.
              </T>
            ) : null}
          </View>

          <Ta className="pb-1 text-center text-[10.5px]">{COPY.appName.ta}</Ta>
        </KeyboardAvoidingView>
      </AuroraField>
    </Screen>
  );
}
