/**
 * Composite indexes, checked against the queries the app actually runs.
 *
 * This is the one class of production failure the emulator cannot show you.
 * The Firestore emulator serves any query regardless of `firestore.indexes.json`,
 * so a query needing a composite index passes every test in this repo and then
 * throws FAILED_PRECONDITION the first time it runs against the real project.
 *
 * Where that hurts most is a background trigger. `repriceOnCreate` needs
 * products by (storeId, isActive); with the index missing it throws where
 * nobody is looking, the catalogue price is never applied, and the customer is
 * quietly billed the model's guess instead. Nothing alerts — the order just
 * costs the wrong amount. That index was in fact missing until this file was
 * written.
 *
 * The manifest below is maintained by hand, which is the honest limitation:
 * it cannot notice a query nobody added here. What it does do is fail the
 * moment an index is deleted, renamed, reordered or has its direction changed
 * under a query that depends on it — and it forces the person adding a query
 * to think about the index, because the review will ask why the manifest did
 * not change.
 *
 *   npm run test:indexes -w @dfc/firebase
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));

interface IndexField {
  fieldPath: string;
  order?: 'ASCENDING' | 'DESCENDING';
  arrayConfig?: string;
}
interface CompositeIndex {
  collectionGroup: string;
  queryScope: string;
  fields: IndexField[];
}

const declared: { indexes: CompositeIndex[] } = JSON.parse(
  readFileSync(resolve(here, '../firestore.indexes.json'), 'utf8'),
);

/**
 * One entry per compound query in the product.
 *
 * `equality` lists the `==` / `in` filters, `range` the inequality field (if
 * any), and `orderBy` the sort. Firestore's rule: equality fields first in any
 * order, then the range/orderBy field, and the index direction must match the
 * orderBy direction.
 */
interface Q {
  what: string;
  where: string;
  collection: string;
  equality: string[];
  range?: string;
  orderBy?: { field: string; dir: 'ASCENDING' | 'DESCENDING' };
}

const QUERIES: Q[] = [
  {
    what: 'a customer’s own order history',
    where: 'apps/mobile/src/lib/orders.ts subscribeMyOrders',
    collection: 'orders',
    equality: ['customerUid'],
    orderBy: { field: 'createdAt', dir: 'DESCENDING' },
  },
  {
    what: 'a vendor’s live orders',
    where: 'apps/mobile/src/lib/orders.ts subscribeStoreOrders',
    collection: 'orders',
    equality: ['storeId', 'status'],
    orderBy: { field: 'createdAt', dir: 'DESCENDING' },
  },
  {
    what: 'a rider’s live tasks',
    where: 'apps/mobile/src/lib/orders.ts subscribeRiderOrders',
    collection: 'orders',
    equality: ['riderUid', 'status'],
    orderBy: { field: 'createdAt', dir: 'DESCENDING' },
  },
  {
    what: 'the admin Kanban board (48h window)',
    where: 'apps/admin-web/src/lib/orders.ts subscribeBoard',
    collection: 'orders',
    equality: ['status'],
    range: 'createdAt',
    orderBy: { field: 'createdAt', dir: 'DESCENDING' },
  },
  {
    what: 'the payment for one order',
    where: 'apps/mobile/src/lib/payments.ts + admin-web subscribePaymentFor',
    collection: 'payments',
    equality: ['orderId'],
    orderBy: { field: 'createdAt', dir: 'DESCENDING' },
  },
  {
    what: 'cash a rider is still holding',
    where: 'apps/mobile/src/lib/payments.ts',
    collection: 'payments',
    equality: ['heldByUid', 'state'],
    orderBy: { field: 'createdAt', dir: 'DESCENDING' },
  },
  {
    // The one that was missing. A background trigger, so it fails silently.
    what: 'a store’s catalogue, for auto-repricing',
    where: 'firebase/functions/src/admin.ts repriceOrderLogic',
    collection: 'products',
    equality: ['storeId', 'isActive'],
  },
];

/**
 * Does `index` serve `q`?
 *
 * Equality fields may appear in any order in the index, but they must all come
 * before the range/orderBy field, and nothing else may sit in between.
 */
function serves(index: CompositeIndex, q: Q): boolean {
  if (index.collectionGroup !== q.collection) return false;

  const tail = q.orderBy?.field ?? q.range;
  const expectedLength = q.equality.length + (tail ? 1 : 0);
  if (index.fields.length !== expectedLength) return false;

  const head = index.fields.slice(0, q.equality.length).map((f) => f.fieldPath);
  if ([...head].sort().join() !== [...q.equality].sort().join()) return false;

  if (!tail) return true;

  const last = index.fields[index.fields.length - 1]!;
  if (last.fieldPath !== tail) return false;
  if (q.orderBy && last.order !== q.orderBy.dir) return false;

  return true;
}

// ---------------------------------------------------------------------------

describe('every compound query has an index', () => {
  for (const q of QUERIES) {
    it(`${q.collection}: ${q.what}`, () => {
      const match = declared.indexes.find((ix) => serves(ix, q));
      assert.ok(
        match,
        `No composite index serves this query.\n` +
          `  query    ${q.collection} where ${q.equality.join(' == , ')} == ` +
          `${q.range ? `, ${q.range} range` : ''}` +
          `${q.orderBy ? ` orderBy ${q.orderBy.field} ${q.orderBy.dir}` : ''}\n` +
          `  used by  ${q.where}\n` +
          `  fix      add it to firestore.indexes.json, then ` +
          `\`npm run deploy:indexes -w @dfc/firebase\``,
      );
    });
  }
});

describe('the index file itself', () => {
  it('is valid and non-empty', () => {
    assert.ok(Array.isArray(declared.indexes));
    assert.ok(declared.indexes.length > 0);
  });

  it('declares a scope and at least two fields on every composite index', () => {
    for (const ix of declared.indexes) {
      assert.equal(ix.queryScope, 'COLLECTION', `${ix.collectionGroup} has an odd scope`);
      // A single-field index is created automatically; declaring one is a sign
      // somebody misunderstood what this file is for.
      assert.ok(
        ix.fields.length >= 1,
        `${ix.collectionGroup} index has no fields`,
      );
    }
  });

  it('gives every field a direction', () => {
    for (const ix of declared.indexes) {
      for (const f of ix.fields) {
        assert.ok(
          f.order || f.arrayConfig,
          `${ix.collectionGroup}.${f.fieldPath} has neither an order nor an arrayConfig`,
        );
      }
    }
  });

  it('has no exact duplicates', () => {
    const seen = new Set<string>();
    for (const ix of declared.indexes) {
      const key = `${ix.collectionGroup}:${ix.fields
        .map((f) => `${f.fieldPath}:${f.order ?? f.arrayConfig}`)
        .join(',')}`;
      assert.ok(!seen.has(key), `duplicate index: ${key}`);
      seen.add(key);
    }
  });
});
