/**
 * Handing off to another app.
 *
 * DFC leaves the app for two things: paying (a UPI app) and navigating (the
 * map the rider already trusts). Both platforms now treat "which apps are
 * installed?" as private — iOS since 9, Android since 11 — and both answer a
 * `canOpenURL` probe for an undeclared scheme with a flat `false` rather than
 * an error. That failure mode is indistinguishable from "not installed", so
 * gating a hand-off on `canOpenURL` means one missing entry in
 * `LSApplicationQueriesSchemes` or `<queries>` silently breaks payments on
 * every device, and looks like a UPI outage rather than a config bug.
 *
 * So: ask the OS to actually open it, and take the rejection as the answer.
 * The declarations are still there (app.config.ts, plugins/with-payment-
 * queries.js) because they make the system chooser behave — they are just not
 * what correctness rests on.
 */

import { Linking } from 'react-native';

/** Opens `url`, resolving false rather than throwing when nothing handles it. */
export async function tryOpenUrl(url: string): Promise<boolean> {
  try {
    await Linking.openURL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Tries each URL in turn and stops at the first the OS accepts.
 *
 * Order the list most-specific first: the app you actually want, then the
 * generic scheme, then an https fallback that always resolves to a browser.
 * Returns the URL that opened, or null if none did.
 */
export async function openFirstAvailable(urls: readonly string[]): Promise<string | null> {
  for (const url of urls) {
    if (await tryOpenUrl(url)) return url;
  }
  return null;
}
