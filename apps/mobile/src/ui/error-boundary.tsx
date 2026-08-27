/**
 * The last line of defence.
 *
 * Without this, one bad render anywhere in the tree is a white screen and a
 * force-quit. That is bad in a customer app and genuinely costly in the rider
 * app, where the person is standing at a door holding somebody's medicine.
 *
 * So the fallback is not a shrug. It says what broke, offers the two things
 * that actually help — retry, and a phone call — and on a rider's device it
 * says the delivery is safe, because their first thought will be that they
 * have lost it.
 *
 * Class component because React only exposes `componentDidCatch` that way;
 * there is no hook equivalent.
 */

import * as React from 'react';
import { Linking, ScrollView, View } from 'react-native';
import Constants from 'expo-constants';

import { COMPANY } from '@dfc/core';

import { Button, Card, Screen, T, Ta } from './index';

interface Props {
  children: React.ReactNode;
  /** Rider and vendor get reassurance copy; customers get the plain version. */
  audience?: 'customer' | 'staff';
}

interface State {
  error: Error | null;
  /** Bumping this remounts the subtree, which is what "try again" means. */
  attempt: number;
}

export class ErrorBoundary extends React.Component<Props, State> {
  override state: State = { error: null, attempt: 0 };

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { error };
  }

  override componentDidCatch(error: Error, info: React.ErrorInfo) {
    // Goes to the device log in dev and to Crashlytics once that is wired.
    console.error('[dfc] render crash', error, info.componentStack);
  }

  private reset = () => {
    this.setState((s) => ({ error: null, attempt: s.attempt + 1 }));
  };

  override render() {
    const { error } = this.state;
    if (!error) {
      // Keyed so a retry genuinely rebuilds the subtree rather than reusing
      // the state that crashed it.
      return <React.Fragment key={this.state.attempt}>{this.props.children}</React.Fragment>;
    }

    const staff = this.props.audience === 'staff';

    return (
      <Screen>
        <ScrollView contentContainerClassName="flex-1 justify-center gap-5 px-6 py-10">
          <View className="gap-2">
            <T style={{ fontSize: 26, fontWeight: '700', letterSpacing: -0.9 }}>
              Something broke
            </T>
            <Ta className="text-[14px]">ஏதோ தவறாகிவிட்டது</Ta>
          </View>

          <T className="text-[15px] leading-[23px] text-body-strong">
            {staff
              ? 'This is a display problem, not a data one. Your delivery and everything you have recorded are safe on our servers — reopening the screen will show them again.'
              : 'This is a problem with the app, not with your order. Nothing you have paid for is affected.'}
          </T>

          <Card className="gap-2 p-4">
            <T className="text-[10.5px] font-bold tracking-[0.9px] text-placeholder">
              WHAT WENT WRONG
            </T>
            <T className="font-mono text-[12px] leading-[18px] text-body-strong">
              {error.message || String(error)}
            </T>
            <T className="mt-1 font-mono text-[10.5px] text-placeholder">
              v{Constants.expoConfig?.version ?? '0.1.0'}
            </T>
          </Card>

          <View className="gap-2.5">
            <Button size="lg" label="Try again" labelTa="மீண்டும் முயற்சி" onPress={this.reset} />
            <Button
              variant="outline"
              size="md"
              label={`Call DFC · ${COMPANY.grievancePhone}`}
              onPress={() => void Linking.openURL(`tel:${COMPANY.grievancePhone}`)}
            />
          </View>

          <T className="text-center text-[11.5px] leading-[17px] text-placeholder">
            If this keeps happening, read the message above to us — it tells our engineers
            exactly where to look.
          </T>
        </ScrollView>
      </Screen>
    );
  }
}
