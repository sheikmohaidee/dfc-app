// @ts-check

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

const variant = process.env.APP_VARIANT ?? 'customer';

const VARIANTS = {
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

const v = VARIANTS[variant] || VARIANTS.customer;

/**
 * Every URL scheme the app probes with `Linking.canOpenURL`.
 *
 * Both platforms now require an app to declare, ahead of time, which other
 * apps it is allowed to ask about — iOS via `LSApplicationQueriesSchemes`,
 * Android via `<queries>` (see ./plugins/with-payment-queries.js). Undeclared
 * schemes do not error; `canOpenURL` just answers `false`, which reads
 * identically to "not installed" and is why this list is easy to forget until
 * payments quietly stop working on real devices.
 *
 * Keep in step with UPI_APPS in packages/core/src/payment.ts. Duplicated
 * rather than imported because this file is evaluated by the Expo CLI before
 * any workspace package has necessarily been built.
 */
const UPI_SCHEMES = [
  'upi', //     generic intent — Android shows a chooser, iOS needs a specific app
  'gpay',
  'phonepe',
  'paytmmp',
  'bhim',
  // The rider's Navigate hand-off in src/ui/live-map.tsx.
  'maps', //             Apple Maps
  'comgooglemaps', //    Google Maps, when the rider has it
  'google.navigation',
  'geo',
];

module.exports = {
  expo: {
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
        googleMapsApiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_IOS_KEY,
      },
      infoPlist: {
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
        LSApplicationQueriesSchemes: UPI_SCHEMES,
        ...(variant === 'rider' ? { UIBackgroundModes: ['location'] } : {}),
        ...(variant === 'rider'
          ? {
              NSLocationAlwaysAndWhenInUseUsageDescription:
                'DFC keeps your location updating while a delivery is active so the customer can watch you approach, even when your screen is off. It stops the moment the task ends.',
            }
          : {}),
      },
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
        'POST_NOTIFICATIONS',
        ...(variant === 'rider'
          ? [
              'FOREGROUND_SERVICE',
              'FOREGROUND_SERVICE_LOCATION',
            ]
          : []),
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
      [
        'expo-notifications',
        {
          color: '#18181B',
          defaultChannel:
            variant === 'vendor'
              ? 'dfc-vendor-orders'
              : variant === 'rider'
                ? 'dfc-rider-tasks'
                : 'dfc-customer-updates',
        },
      ],
      'expo-splash-screen',
      './plugins/with-payment-queries',
    ],

    experiments: { typedRoutes: true },

    extra: {
      variant,
      eas: {
        projectId: process.env.EXPO_PUBLIC_EAS_PROJECT_ID || '50f68acd-4c33-4975-a495-77f857d5aeda',
      },
    },
  },
};
