import test from 'node:test';
import assert from 'node:assert/strict';

import {
  bilingualSearchMatch,
  calculateMonthlySubscriptionPaise,
  getKdsStage,
  isSubscriptionDueOnDate,
  SEED_SUBSCRIPTIONS,
} from '../index';

test('Bilingual Transliteration Search', async (t) => {
  await t.test('matches English query with English item', () => {
    const item = { name: 'Mutton Kari Dosa', nameTa: 'மட்டன் கறி தோசை' };
    assert.equal(bilingualSearchMatch('kari dosa', item), true);
  });

  await t.test('matches Tamil script query with English item', () => {
    const item = { name: 'Bun Parotta', nameTa: 'பன் பரோட்டா' };
    assert.equal(bilingualSearchMatch('பரோட்டா', item), true);
  });

  await t.test('matches phonetic Tanglish query to canonical item', () => {
    const item = { name: 'Special Bun Parotta', nameTa: 'ஸ்பெஷல் பன் பரோட்டா' };
    assert.equal(bilingualSearchMatch('pan parota', item), true);
  });

  await t.test('matches Jigarthanda Tanglish variations', () => {
    const item = { name: 'Famous Jigarthanda', nameTa: 'ஜிகர்தண்டா' };
    assert.equal(bilingualSearchMatch('jigar dhanda', item), true);
  });

  await t.test('rejects unrelated search', () => {
    const item = { name: 'Idli', nameTa: 'இட்லி' };
    assert.equal(bilingualSearchMatch('biryani', item), false);
  });
});

test('Daily Morning Subscriptions Engine', async (t) => {
  await t.test('calculates monthly costs accurately for daily schedule', () => {
    const sub = SEED_SUBSCRIPTIONS[0]!; // 2 packets of milk @ ₹30 = ₹60/day * 30 days = ₹1,800 (180,000 paise)
    const monthlyCost = calculateMonthlySubscriptionPaise(sub);
    assert.equal(monthlyCost, 180000);
  });

  await t.test('handles weekday filtering logic', () => {
    const weekdaySub = SEED_SUBSCRIPTIONS[1]!; // weekdays only
    // Sunday date: 2026-09-06
    const sunday = new Date('2026-09-06T06:30:00');
    assert.equal(isSubscriptionDueOnDate(weekdaySub, sunday), false);

    // Wednesday date: 2026-09-02
    const wednesday = new Date('2026-09-02T06:30:00');
    assert.equal(isSubscriptionDueOnDate(weekdaySub, wednesday), true);
  });
});

test('Kitchen Display System (KDS) Stage Classifier', async (t) => {
  await t.test('classifies paid/accepted orders as new', () => {
    assert.equal(getKdsStage('paid'), 'new');
    assert.equal(getKdsStage('vendor_accepted'), 'new');
  });

  await t.test('classifies packing orders as preparing', () => {
    assert.equal(getKdsStage('packing'), 'preparing');
  });

  await t.test('classifies ready_for_pickup as ready', () => {
    assert.equal(getKdsStage('ready_for_pickup'), 'ready');
  });

  await t.test('classifies dispatched/out_for_delivery as dispatched', () => {
    assert.equal(getKdsStage('dispatched'), 'dispatched');
    assert.equal(getKdsStage('out_for_delivery'), 'dispatched');
  });
});
