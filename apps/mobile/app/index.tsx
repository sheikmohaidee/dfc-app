/**
 * The role router.
 *
 * Decides, in order: is Firebase configured, has this person seen onboarding,
 * are they signed in, and which of the three apps do they belong in. The role
 * comes from the token claim rather than which binary they downloaded — a
 * vendor who installs the customer build still lands on their inbox.
 */

import * as React from 'react';
import { Redirect } from 'expo-router';
import { View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { useAuth } from '@/providers/auth';
import { ONBOARDED_KEY } from './(auth)/welcome';
import { Screen } from '@/ui';
import { Hero3D } from '@/ui/hero-3d';

/** The splash. The hero is already warm by the time sign-in mounts. */
function Booting() {
  return (
    <Screen>
      <View className="flex-1 items-center justify-center">
        <Hero3D tone="brand" height={200} />
      </View>
    </Screen>
  );
}

export default function Index() {
  const { user, role, loading } = useAuth();
  const [onboarded, setOnboarded] = React.useState<boolean | null>(null);

  React.useEffect(() => {
    void AsyncStorage.getItem(ONBOARDED_KEY)
      .then((v) => setOnboarded(v === '1'))
      .catch(() => setOnboarded(true)); // storage unavailable — do not trap anyone
  }, []);


  if (loading || onboarded === null) return <Booting />;
  if (!onboarded && !user) return <Redirect href="/(auth)/welcome" />;
  if (!user) return <Redirect href="/(auth)/sign-in" />;

  switch (role) {
    case 'vendor':
      return <Redirect href="/(vendor)/inbox" />;
    case 'rider':
      return <Redirect href="/(rider)/queue" />;
    default:
      return <Redirect href="/(customer)/chat" />;
  }
}
