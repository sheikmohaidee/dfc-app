import type { ExpoConfig } from 'expo/config';

/**
 * One codebase, three shipped apps.
 *
 * `APP_VARIANT` picks which one this build is: customer, rider or vendor. They
 * share every screen, provider and design token — only the bundle id, name,
 * icon and the default landing route differ. That is why this is a config
 * function rather than a static app.json.
 *
 *   APP_VARIANT=rider npx expo run:ios
 *   APP_VARIANT=vendor eas build -p android
 */

type Variant = 'customer' | 'rider' | 'vendor';

const variant = (process.env.APP_VARIANT ?? 'customer') as Variant;

const VARIANTS: Record<Variant, { name: string; slug: string; scheme: string; id: string }> = {
  customer: {
    name: 'Dinasari Food Courier',
    slug: 'dfc-customer',
    scheme: 'dfc',
    id: 'in.dinasari.dfc',
  },
  rider: {
    name: 'DFC Rider',
    slug: 'dfc-rider',
    scheme: 'dfcrider',
    id: 'in.dinasari.dfc.rider',
  },
  vendor: {
    name: 'DFC Partner',
    slug: 'dfc-vendor',
    scheme: 'dfcvendor',
    id: 'in.dinasari.dfc.vendor',
  },
};

const v = VARIANTS[variant];

const config: ExpoConfig = {
  name: v.name,
  slug: v.slug,
  scheme: v.scheme,
  version: '0.1.0',
  orientation: 'portrait',
  userInterfaceStyle: 'light',
  newArchEnabled: true,
  assetBundlePatterns: ['**/*'],

  splash: {
    backgroundColor: '#FFFFFF',
    resizeMode: 'contain',
  },

  ios: {
    bundleIdentifier: v.id,
    supportsTablet: false,
    config: {
      // Apple Maps needs no key; this is only used when the app asks
      // react-native-maps for the Google provider on iOS.
      googleMapsApiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_IOS_KEY,
    },
    infoPlist: {
      // Every one of these is user-facing text in a system dialog. Vague
      // strings get apps rejected and make people tap Deny.
      NSCameraUsageDescription:
        'DFC uses the camera so you can photograph a prescription or a shopping list instead of typing it.',
      NSPhotoLibraryUsageDescription:
        'DFC needs access to your photos so you can attach a list you already saved.',
      NSMicrophoneUsageDescription:
        'DFC uses the microphone so you can say your order in Tamil or English instead of typing it.',
      NSLocationWhenInUseUsageDescription:
        'DFC uses your location to detect your Madurai locality and quote an accurate delivery fee.',
      NSFaceIDUsageDescription: 'DFC uses Face ID to unlock your account.',
      ITSAppUsesNonExemptEncryption: false,
    },
    ...(variant === 'rider'
      ? {
          infoPlistExtra: {
            UIBackgroundModes: ['location'],
          },
        }
      : {}),
  },

  android: {
    package: v.id,
    adaptiveIcon: { backgroundColor: '#18181B' },
    config: {
      googleMaps: { apiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_ANDROID_KEY ?? '' },
    },
    edgeToEdgeEnabled: true,
    permissions: [
      'CAMERA',
      'RECORD_AUDIO',
      'ACCESS_COARSE_LOCATION',
      'ACCESS_FINE_LOCATION',
      'USE_BIOMETRIC',
      'USE_FINGERPRINT',
      'VIBRATE',
    ],
  },

  plugins: [
    'expo-router',
    [
      'expo-image-picker',
      {
        photosPermission: 'DFC needs your photos so you can attach a list you already saved.',
        cameraPermission: 'DFC uses the camera to read a prescription or a handwritten list.',
      },
    ],
    [
      'expo-location',
      {
        locationWhenInUsePermission:
          'DFC uses your location to detect your Madurai locality and quote delivery accurately.',
      },
    ],
    [
      'expo-local-authentication',
      { faceIDPermission: 'DFC uses Face ID to unlock your account.' },
    ],
    ['expo-av', { microphonePermission: 'DFC uses the microphone so you can speak your order.' }],
    // react-native-maps ships no config plugin. Its Android key comes from
    // `android.config.googleMaps` above; iOS uses Apple Maps and needs none.
    'expo-splash-screen',
  ],

  experiments: { typedRoutes: true },

  extra: {
    variant,
    // EAS project id goes here once `eas init` has run.
  },
};

export default config;
