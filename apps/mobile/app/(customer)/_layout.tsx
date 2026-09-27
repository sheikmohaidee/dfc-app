import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

export default function CustomerLayout() {
  return (
    <>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: '#0E0E10' },
          animation: 'slide_from_right',
        }}
      />
    </>
  );
}
