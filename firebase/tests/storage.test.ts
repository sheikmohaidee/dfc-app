/**
 * Cloud Storage security rules, executed against the emulator.
 *
 * These guard the most sensitive data in the product. `uploads/{uid}/...` holds
 * photographs of prescriptions — a named person's medicines, which is health
 * data about an identifiable individual, and exactly the category the DPDP Act
 * treats least forgivingly. `pod/{orderId}/...` holds proof-of-delivery photos,
 * which are pictures of people's front doors.
 *
 * So the tests here are almost entirely about who is refused. The rules had no
 * tests at all until now, which for this bucket was the largest untested risk
 * in the project.
 *
 *   npm run test:storage -w @dfc/firebase
 */

import { describe, it, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing';
import { ref, uploadBytes, getBytes, deleteObject, updateMetadata } from 'firebase/storage';

const here = dirname(fileURLToPath(import.meta.url));

let env: RulesTestEnvironment;

const CUSTOMER = 'cust-1';
const OTHER_CUSTOMER = 'cust-2';
const VENDOR = 'vendor-1';
const RIDER = 'rider-1';
const ADMIN = 'admin-1';

const ctx = {
  customer: () => env.authenticatedContext(CUSTOMER, { role: 'customer' }).storage(),
  otherCustomer: () => env.authenticatedContext(OTHER_CUSTOMER, { role: 'customer' }).storage(),
  vendor: () => env.authenticatedContext(VENDOR, { role: 'vendor', storeId: 's1' }).storage(),
  rider: () => env.authenticatedContext(RIDER, { role: 'rider' }).storage(),
  admin: () => env.authenticatedContext(ADMIN, { role: 'admin' }).storage(),
  anon: () => env.unauthenticatedContext().storage(),
};

/** A blob of `bytes` bytes with the given content type. */
function file(bytes: number, contentType: string) {
  return {
    data: new Uint8Array(bytes),
    meta: { contentType },
  };
}

const JPEG = () => file(1024, 'image/jpeg');
const PNG = () => file(1024, 'image/png');
const WEBP = () => file(1024, 'image/webp');
const HEIC = () => file(1024, 'image/heic');
const M4A = () => file(1024, 'audio/m4a');

const MB = 1024 * 1024;

/**
 * Paths are unique per call.
 *
 * Uploads are immutable, so two tests sharing a path would couple: the second
 * would be refused because the first left an object there — including when the
 * first was a *rejected* oversize upload, which still leaves a partial object
 * behind in the emulator. Unique paths keep each test independent.
 */
let n = 0;
const mine = () => `uploads/${CUSTOMER}/2026-08/rx-${++n}.jpg`;
const theirs = () => `uploads/${OTHER_CUSTOMER}/2026-08/rx-${++n}.jpg`;
const pod = () => `pod/o${++n}/door.jpg`;

async function put(storage: ReturnType<typeof ctx.customer>, path: string, f = JPEG()) {
  return uploadBytes(ref(storage, path), f.data, f.meta);
}

before(async () => {
  env = await initializeTestEnvironment({
    projectId: 'dfc-storage-test',
    storage: {
      rules: readFileSync(resolve(here, '../storage.rules'), 'utf8'),
      host: '127.0.0.1',
      port: 9199,
    },
  });
});

after(async () => {
  await env.cleanup();
});

beforeEach(async () => {
  await env.clearStorage();
});

/** Seeds an object bypassing the rules, so read tests have something to read. */
async function seed(path: string, f = JPEG()) {
  await env.withSecurityRulesDisabled(async (c) => {
    await uploadBytes(ref(c.storage(), path), f.data, f.meta);
  });
}

// ---------------------------------------------------------------------------
// Customer uploads — the prescription photos
// ---------------------------------------------------------------------------

describe('a customer uploading', () => {
  it('can upload a photo under their own prefix', async () => {
    await assertSucceeds(put(ctx.customer(), mine()));
  });

  it('can upload each image type the app produces', async () => {
    for (const [name, f] of [['png', PNG()], ['webp', WEBP()], ['heic', HEIC()]] as const) {
      await assertSucceeds(
        put(ctx.customer(), `uploads/${CUSTOMER}/2026-08/rx.${name}`, f),
      );
    }
  });

  it('can upload a voice note', async () => {
    await assertSucceeds(put(ctx.customer(), `uploads/${CUSTOMER}/2026-08/note.m4a`, M4A()));
  });

  it('CANNOT upload into another customer’s folder', async () => {
    // The whole reason uploads are namespaced by uid. Without this, guessing a
    // uid is enough to plant a file in a stranger's medical history.
    await assertFails(put(ctx.customer(), theirs()));
  });

  it('CANNOT upload while signed out', async () => {
    await assertFails(put(ctx.anon(), mine()));
  });

  it('CANNOT upload an executable dressed as an upload', async () => {
    await assertFails(
      put(ctx.customer(), `uploads/${CUSTOMER}/2026-08/x.apk`, file(1024, 'application/vnd.android.package-archive')),
    );
  });

  it('CANNOT upload a PDF — the parser only handles images and audio', async () => {
    await assertFails(
      put(ctx.customer(), `uploads/${CUSTOMER}/2026-08/rx.pdf`, file(1024, 'application/pdf')),
    );
  });

  it('CANNOT upload an image over 8 MB', async () => {
    await assertFails(put(ctx.customer(), mine(), file(9 * MB, 'image/jpeg')));
  });

  it('CANNOT upload audio over 4 MB', async () => {
    // Audio has a tighter cap than images because a voice order is seconds
    // long; a 5 MB "voice note" is somebody uploading something else.
    await assertFails(
      put(ctx.customer(), `uploads/${CUSTOMER}/2026-08/note.m4a`, file(5 * MB, 'audio/m4a')),
    );
  });

  it('CAN upload an image just under the cap', async () => {
    await assertSucceeds(put(ctx.customer(), mine(), file(7 * MB, 'image/jpeg')));
  });

  it('CANNOT overwrite an upload — they are immutable', async () => {
    // A re-shot photo is a new object. Mutable uploads mean the photo an admin
    // priced against is not necessarily the photo still in the bucket.
    //
    // This is enforced by `resource == null` on create, NOT by
    // `allow update: if false` — overwriting an object's content is a `create`
    // in Storage rules, and `update` only covers metadata. That distinction is
    // exactly what this test caught.
    const p = mine();
    await seed(p);
    await assertFails(put(ctx.customer(), p));
  });
});

describe('a customer reading uploads', () => {
  it('can read their own', async () => {
    const p = mine();
    await seed(p);
    await assertSucceeds(getBytes(ref(ctx.customer(), p)));
  });

  it('CANNOT read another customer’s prescription', async () => {
    // The one that matters most in this file.
    const p = theirs();
    await seed(p);
    await assertFails(getBytes(ref(ctx.customer(), p)));
  });

  it('CANNOT be read by an anonymous caller', async () => {
    const p = mine();
    await seed(p);
    await assertFails(getBytes(ref(ctx.anon(), p)));
  });

  it('CANNOT be read directly by a vendor', async () => {
    // A vendor sees the parsed item list, not the photograph. If they ever
    // need the image it goes through a server-minted signed URL, scoped to
    // one object and one order.
    const p = mine();
    await seed(p);
    await assertFails(getBytes(ref(ctx.vendor(), p)));
  });

  it('CANNOT be read directly by a rider', async () => {
    const p = mine();
    await seed(p);
    await assertFails(getBytes(ref(ctx.rider(), p)));
  });

  it('can be read by an admin, who prices it', async () => {
    const p = mine();
    await seed(p);
    await assertSucceeds(getBytes(ref(ctx.admin(), p)));
  });
});

describe('deleting an upload', () => {
  it('is allowed for the owner — this is the account-deletion path', async () => {
    const p = mine();
    await seed(p);
    await assertSucceeds(deleteObject(ref(ctx.customer(), p)));
  });

  it('is allowed for an admin', async () => {
    const p = mine();
    await seed(p);
    await assertSucceeds(deleteObject(ref(ctx.admin(), p)));
  });

  it('is refused for another customer', async () => {
    const p = theirs();
    await seed(p);
    await assertFails(deleteObject(ref(ctx.customer(), p)));
  });

  it('is refused for a rider', async () => {
    const p = mine();
    await seed(p);
    await assertFails(deleteObject(ref(ctx.rider(), p)));
  });
});

// ---------------------------------------------------------------------------
// Proof of delivery
// ---------------------------------------------------------------------------

describe('proof of delivery', () => {
  it('can be uploaded by a rider', async () => {
    await assertSucceeds(put(ctx.rider(), pod()));
  });

  it('CANNOT be uploaded by a customer', async () => {
    // A customer who can write proof-of-delivery can manufacture a delivery.
    await assertFails(put(ctx.customer(), pod()));
  });

  it('CANNOT be uploaded by a vendor', async () => {
    await assertFails(put(ctx.vendor(), pod()));
  });

  it('CANNOT be uploaded while signed out', async () => {
    await assertFails(put(ctx.anon(), pod()));
  });

  it('CANNOT be audio — proof of delivery is a photograph', async () => {
    await assertFails(put(ctx.rider(), 'pod/o1/note.m4a', M4A()));
  });

  it('CANNOT be over 4 MB', async () => {
    await assertFails(put(ctx.rider(), pod(), file(5 * MB, 'image/jpeg')));
  });

  it('is readable by any signed-in user — the customer needs to see it', async () => {
    const p = pod();
    await seed(p);
    await assertSucceeds(getBytes(ref(ctx.customer(), p)));
    await assertSucceeds(getBytes(ref(ctx.vendor(), p)));
  });

  it('is NOT readable by an anonymous caller', async () => {
    const p = pod();
    await seed(p);
    await assertFails(getBytes(ref(ctx.anon(), p)));
  });

  it('CANNOT be deleted by the rider who took it', async () => {
    // The evidence must outlive the rider's second thoughts about it.
    const p = pod();
    await seed(p);
    await assertFails(deleteObject(ref(ctx.rider(), p)));
  });

  it('CANNOT have its metadata changed by the rider who took it', async () => {
    const p = pod();
    await seed(p);
    await assertFails(updateMetadata(ref(ctx.rider(), p), { contentType: 'image/png' }));
  });

  it('CANNOT be re-shot over by the rider who took it', async () => {
    // Distinct from the metadata test above, and the one that was actually
    // broken: replacing an object's CONTENT is a `create` in Storage rules,
    // so `allow update: if false` never stopped it. A rider who delivered to
    // the wrong door could have quietly swapped the photograph.
    const p = pod();
    await seed(p);
    await assertFails(put(ctx.rider(), p));
  });

  it('CANNOT be replaced by a different rider', async () => {
    const p = pod();
    await seed(p);
    const other = env.authenticatedContext('rider-2', { role: 'rider' }).storage();
    await assertFails(put(other, p));
  });

  it('can be deleted by an admin, for a takedown request', async () => {
    const p = pod();
    await seed(p);
    await assertSucceeds(deleteObject(ref(ctx.admin(), p)));
  });
});

// ---------------------------------------------------------------------------
// Everything else
// ---------------------------------------------------------------------------

describe('the rest of the bucket is closed', () => {
  const paths = [
    'random.jpg',
    'backups/firestore.json',
    'uploads/rx.jpg', // right prefix, wrong depth
    'invoices/DFC-2026-27-000001.pdf',
    'config/keys.json',
  ];

  for (const p of paths) {
    it(`refuses writes to ${p}`, async () => {
      await assertFails(put(ctx.customer(), p));
      await assertFails(put(ctx.admin(), p));
    });
  }

  it('refuses reads of anything outside the two known prefixes', async () => {
    await seed('backups/firestore.json', file(64, 'application/json'));
    await assertFails(getBytes(ref(ctx.admin(), 'backups/firestore.json')));
    await assertFails(getBytes(ref(ctx.customer(), 'backups/firestore.json')));
  });

  it('refuses a path that tries to climb out of its own prefix', async () => {
    // Belt and braces: Storage normalises paths, but assert it rather than
    // assume it.
    await assertFails(put(ctx.customer(), `uploads/${CUSTOMER}/../${OTHER_CUSTOMER}/2026-08/rx.jpg`));
  });
});
