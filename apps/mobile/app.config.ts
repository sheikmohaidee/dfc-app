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

      // iOS 9+ refuses `canOpenURL` for any scheme not declared here — it
      // returns false and logs "not allowed to query for scheme". Without
      // this list every UPI hand-off in payments.ts reported "that app is not
      // installed" on a phone that had it installed, and pushed the customer
      // to cash. These are query permissions, not entitlements: listing an
      // app does not grant access to anything it holds.
      LSApplicationQueriesSchemes: UPI_SCHEMES,

      // Rider only, and only when it is the rider build: a delivery app that
      // stops reporting position the moment the screen locks is useless to
      // the customer watching the map. Requires the Always usage string
      // below — iOS shows that text in the "keep allowing?" prompt.
      //
      // This was previously written as `ios.infoPlistExtra`, which is not a
      // key Expo knows, so it was dropped silently and the rider build never
      // had the capability it claimed.
      //
      // Before submitting the rider app: useRiderTracking currently asks only
      // for foreground permission, and App Review rejects a declared
      // background mode the app never uses (Guideline 2.5.4). Either finish
      // the background task or drop these two keys.
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
      // Android 13+ will not deliver a single notification without this, and
      // an order the vendor never hears about is the whole product failing.
      'POST_NOTIFICATIONS',
      ...(variant === 'rider'
        ? [
            // Android 14 (API 34) rejects a location foreground service at
            // runtime unless the typed permission is declared alongside the
            // generic one.
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
        // Android draws the status-bar icon as a silhouette and tints it with
        // this. Left unset it is white-on-white on most launchers.
        color: '#18181B',
        // The channel FCM falls back to when a message names none. Each build
        // gets the one that matters to the person holding it.
        defaultChannel:
          variant === 'vendor'
            ? 'dfc-vendor-orders'
            : variant === 'rider'
              ? 'dfc-rider-tasks'
              : 'dfc-customer-updates',
      },
    ],
    'expo-splash-screen',
    // Android 11+ package visibility for the UPI and maps hand-offs above.
    './plugins/with-payment-queries',
    // Not listed: react-native-maps ships no config plugin. Its Android key
    // comes from `android.config.googleMaps` above; iOS uses Apple Maps and
    // needs none.
  ],

  experiments: { typedRoutes: true },

  extra: {
    variant,
    // EAS project id goes here once `eas init` has run.
  },
};

export default config;
