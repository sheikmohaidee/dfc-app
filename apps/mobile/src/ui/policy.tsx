/**
 * Renders a PolicyDocument from @dfc/core.
 *
 * One renderer for all four documents, and the same source the public web
 * pages use — so the policy you link from the store listing and the policy
 * inside the app can never disagree, which is a thing reviewers check.
 */

import * as React from 'react';
import { View } from 'react-native';
import { AlertTriangle } from 'lucide-react-native';

import { hasUnfilledPlaceholders, type PolicyDocument } from '@dfc/core';

import { useLang } from '@/providers/language';
import { Card, Screen, T, Ta } from './index';
import { SettingsHeader, SettingsScroll } from './settings';

export function PolicyView({ doc }: { doc: PolicyDocument }) {
  const { bilingual } = useLang();

  const updated = new Date(doc.updated).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <Screen>
      <SettingsHeader title={doc.title} titleTa={doc.titleTa} />

      <SettingsScroll>
        {/* Developer-facing, and deliberately loud. A policy shipped with a
            placeholder in it is an automatic store rejection. */}
        {__DEV__ && hasUnfilledPlaceholders() ? (
          <Card className="flex-row gap-2.5 border-verify-border bg-verify-tint p-3.5">
            <AlertTriangle size={16} color="#B45309" strokeWidth={2} style={{ marginTop: 1 }} />
            <T className="flex-1 text-[12px] leading-[18px] text-verify-fg">
              Company details are still placeholders. Fill in COMPANY in
              packages/core/src/legal.ts and have a lawyer review this before submitting to
              either store.
            </T>
          </Card>
        ) : null}

        <View className="gap-2 px-1">
          <T className="text-[13.5px] leading-[20px] text-body-strong">{doc.summary}</T>
          <T className="font-mono text-[11px] text-placeholder">Last updated {updated}</T>
        </View>

        {doc.sections.map((section) => (
          <View key={section.heading} className="gap-2">
            <View>
              <T className="text-[15px] font-semibold tracking-[-0.2px]">{section.heading}</T>
              {section.headingTa && bilingual ? (
                <Ta className="mt-0.5 text-[12px]">{section.headingTa}</Ta>
              ) : null}
            </View>

            {section.body.map((para, i) => (
              <T key={i} className="text-[13.5px] leading-[21px] text-body-strong">
                {para}
              </T>
            ))}

            {section.bullets ? (
              <View className="mt-0.5 gap-2">
                {section.bullets.map((b, i) => (
                  <View key={i} className="flex-row gap-2.5">
                    <View className="mt-[9px] size-1.5 rounded-full bg-disabled" />
                    <T className="flex-1 text-[13.5px] leading-[21px] text-body-strong">{b}</T>
                  </View>
                ))}
              </View>
            ) : null}
          </View>
        ))}
      </SettingsScroll>
    </Screen>
  );
}
