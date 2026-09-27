import { Stack } from 'expo-router';

export default function VendorLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: '#0E0E10' },
        animation: 'slide_from_right',
      }}
    />
  );
}
