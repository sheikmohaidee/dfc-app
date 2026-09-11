/**
 * Android package visibility for the apps DFC hands off to.
 *
 * Android 11 (API 30) made the installed-app list private. A `<queries>` entry
 * is now the only way `Linking.canOpenURL` can answer truthfully about another
 * app: without one it returns `false` even when the app is installed and the
 * intent would have resolved fine.
 *
 * That is not cosmetic here. `openUpiApp` gates on `canOpenURL('upi://pay…')`,
 * so on every Android 11+ phone — which is effectively every phone in the
 * field — the customer was told "no UPI app is installed" and pushed to cash.
 * Same story for the rider's Navigate button and `google.navigation:`.
 *
 * Expo's app config has no `android.queries` key, so this has to be a plugin.
 * It is additive and idempotent: re-running prebuild will not duplicate the
 * entries, and it leaves queries contributed by other libraries alone.
 */

const { withAndroidManifest } = require('@expo/config-plugins');

const VIEW = 'android.intent.action.VIEW';

/** Schemes DFC probes with `canOpenURL` before it opens them. */
const SCHEMES = [
  'upi', //               the generic UPI intent — resolves to the system chooser
  'gpay', //              Google Pay
  'phonepe', //           PhonePe
  'paytmmp', //           Paytm
  'bhim', //              BHIM
  'google.navigation', // turn-by-turn hand-off from the rider's task screen
  'geo', //               map fallback when Google Maps is absent
];

const intentFor = (scheme) => ({
  action: [{ $: { 'android:name': VIEW } }],
  data: [{ $: { 'android:scheme': scheme } }],
});

const schemeOf = (query) => query?.intent?.[0]?.data?.[0]?.$?.['android:scheme'];

module.exports = function withPaymentQueries(config) {
  return withAndroidManifest(config, (cfg) => {
    const manifest = cfg.modResults.manifest;
    manifest.queries = manifest.queries ?? [];

    const declared = new Set(manifest.queries.map(schemeOf).filter(Boolean));

    for (const scheme of SCHEMES) {
      if (declared.has(scheme)) continue;
      manifest.queries.push({ intent: [intentFor(scheme)] });
    }

    return cfg;
  });
};
