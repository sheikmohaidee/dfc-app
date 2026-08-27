import '../global.css';

import * as React from 'react';
import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts } from 'expo-font';
import { Geist_400Regular, Geist_500Medium, Geist_600SemiBold, Geist_700Bold } from '@expo-google-fonts/geist';
import { GeistMono_400Regular, GeistMono_500Medium, GeistMono_600SemiBold } from '@expo-google-fonts/geist-mono';
import {
  HindMadurai_400Regular,
  HindMadurai_500Medium,
  HindMadurai_600SemiBold,
} from '@expo-google-fonts/hind-madurai';

import { AuthProvider } from '@/providers/auth';
import { onNotificationTap } from '@/lib/push';
import { ErrorBoundary } from '@/ui/error-boundary';
import { LanguageProvider } from '@/providers/language';

void SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const router = useRouter();

  // A tapped notification opens the thing it is about, not the home screen.
  React.useEffect(
    () => onNotificationTap((path) => router.push(path as never)),
    [router],
  );

  const [loaded, error] = useFonts({
    Geist: Geist_400Regular,
    GeistMedium: Geist_500Medium,
    GeistSemiBold: Geist_600SemiBold,
    GeistBold: Geist_700Bold,
    GeistMono: GeistMono_400Regular,
    GeistMonoMedium: GeistMono_500Medium,
    GeistMonoSemiBold: GeistMono_600SemiBold,
    HindMadurai: HindMadurai_400Regular,
    HindMaduraiMedium: HindMadurai_500Medium,
    HindMaduraiSemiBold: HindMadurai_600SemiBold,
  });

  React.useEffect(() => {
    // Proceed on error too — a missing webfont should degrade to the system
    // face, never hold the app on a splash screen.
    if (loaded || error) void SplashScreen.hideAsync();
  }, [loaded, error]);

  if (!loaded && !error) return null;

  // RNGH 3's root view already fills its parent; its props type no longer
  // accepts `style`, so there is nothing to pass here.
  return (
    <GestureHandlerRootView>
      <SafeAreaProvider>
        <AuthProvider>
          <LanguageProvider>
          {/* Wraps the whole navigator: one bad render anywhere is otherwise a
              white screen and a force-quit, which is costly on a rider's phone
              at somebody's door. */}
          <ErrorBoundary>
          <StatusBar style="dark" />
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: '#FFFFFF' },
              animation: 'slide_from_right',
            }}
          >
            <Stack.Screen name="index" options={{ animation: 'none' }} />
            <Stack.Screen name="(auth)" options={{ animation: 'fade' }} />
            <Stack.Screen name="(customer)" />
            <Stack.Screen name="(vendor)" />
            <Stack.Screen name="(rider)" />
          </Stack>
          </ErrorBoundary>
          </LanguageProvider>
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
