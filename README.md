# Dinasari Food Courier (DFC)

Hyper-local multi-service delivery for Madurai — pharmacy, grocery, food and
ad-hoc concierge errands. A customer photographs a handwritten prescription or
says what they need in Tamil; Gemini turns that into a structured order; an
admin prices it; a store packs it; a rider delivers it.

Four surfaces, one shared domain model.

---

## What's in here

```
DFC/
├─ packages/core/          the domain model everything else imports
│  └─ src/
│     ├─ types.ts          shapes that travel through Firestore
│     ├─ schema.ts         zod validation + the Gemini JSON contract
│     ├─ prompt.ts         the system prompt (a product surface, not config)
│     ├─ status.ts         the order state machine + board mapping
│     ├─ order.ts          pure constructors and mutations over an Order
│     ├─ catalogue.ts      products, stock levels, promotions, ad targeting
│     ├─ money.ts          paise arithmetic, Indian digit grouping
│     ├─ madurai.ts        localities, seed stores, distance
│     ├─ i18n.ts           bilingual copy (English + Tamil)
│     ├─ tokens.ts         design tokens, shared by web and native
│     └─ paths.ts          Firestore + Storage layout
│
├─ apps/mobile/            Expo — customer, rider and vendor apps
│  ├─ app/                 expo-router file routes
│  │  ├─ (auth)/           biometric unlock + location auto-detect
│  │  ├─ (customer)/       the chat thread and order tracking
│  │  ├─ (vendor)/         inbox, packing checklist, pharmacist confirmation
│  │  └─ (rider)/          queue and the live task
│  └─ src/
│     ├─ lib/              firebase, ai, media capture, orders, riders
│     ├─ ui/               the shadcn vocabulary translated to React Native
│     ├─ providers/        auth + role
│     └─ hooks/            live rider tracking
│
├─ apps/admin-web/         Next.js command center
│  └─ src/
│     ├─ app/              board · live ops (3D) · catalogue · promotions
│     ├─ components/       board, sheets, primitives, live map
│     ├─ hooks/            the single board subscription
│     └─ lib/              firebase, orders, catalogue, auth
│
├─ firebase/               rules, indexes, emulators, seed data
└─ design/                 the design canvas source (.dc.html artboards)
```

One binary, three apps: `apps/mobile` builds as **Dinasari Food Courier**,
**DFC Rider** or **DFC Partner** depending on `APP_VARIANT`. They share every
screen and token; only the bundle id, name and landing route differ.

---

## Getting it running

You need Node 20+ and a Firebase project. This repo is already pointed at
`dfc-app-bdb4e`.

### 1. Install

```bash
npm run install:all
```

Two installs, on purpose. `packages/core`, `apps/admin-web` and `firebase` are
npm workspaces and share a hoisted `node_modules`. **`apps/mobile` is not** — it
keeps its own.

That is not an oversight. Expo's toolchain (`babel-preset-expo`,
`nativewind/metro`, `expo-router`) resolves its peers from wherever npm
physically places it, and hoisting in a mixed web+native repo kept moving
`react-native`, `expo-router` and `tailwindcss` out from under it — each time
with a different, misleading error. A self-contained `node_modules` for the
native app is boring and it always works. `metro.config.js` still watches the
repo root, so editing `packages/core` hot-reloads in the app.

### 2. Environment

```bash
cp .env.example .env
```

Fill in the Firebase **client** config from
*Firebase console → Project settings → General → Your apps*. Those values are
public by design — they ship inside every app bundle. What protects the data is
`firebase/firestore.rules` plus App Check, not hiding them.

The `dfc-app-bdb4e-firebase-adminsdk-*.json` in the repo root is a different
thing entirely: a **service-account private key**. It is server-only, it is
git-ignored, and it must never reach a mobile bundle or the browser.

For the two web/native apps, copy the matching prefixed block into:

- `apps/mobile/.env` — the `EXPO_PUBLIC_*` values
- `apps/admin-web/.env.local` — the `NEXT_PUBLIC_*` values

### 3. Deploy rules and seed

```bash
cd firebase
npx firebase login
npx firebase use dfc-app-bdb4e
npm run deploy:rules -w @dfc/firebase
npm run deploy:indexes -w @dfc/firebase
npm run seed -w @dfc/firebase
```

The seed creates one account per role, seven Madurai stores, twenty products
with real stock levels, three promotions and six orders spread across the
board:

| Role     | Email               | Password            |
| -------- | ------------------- | ------------------- |
| Admin    | `admin@dfc.test`    | `dfc-admin-2026`    |
| Customer | `customer@dfc.test` | `dfc-customer-2026` |
| Vendor   | `vendor@dfc.test`   | `dfc-vendor-2026`   |
| Rider    | `rider@dfc.test`    | `dfc-rider-2026`    |

### 4. Run

```bash
npm run admin      # http://localhost:3000
npm run mobile     # Expo dev server

APP_VARIANT=rider  npx expo start   # from apps/mobile
APP_VARIANT=vendor npx expo start
```

The mobile app needs a **development build**, not Expo Go — `react-native-maps`
and biometrics are native modules. `npx expo run:ios` / `npx expo run:android`,
or an EAS development build. In Expo Go the map degrades to a drawn schematic
rather than crashing.

---

## The end-to-end flow

1. **Customer** photographs a prescription, holds the mic and speaks in Tamil,
   or types. `src/lib/media.ts` captures it; `src/lib/ai.ts` sends it to Gemini
   through Firebase AI Logic — no server in the path.
2. **Gemini** returns JSON. `parseAiJson` validates it with zod; a malformed
   answer gets one repair attempt with the validation error quoted back, then
   falls through to a human.
3. The thread renders a **generative UI card**, not a paragraph — a read-only
   template for a prescription, an editable checklist for a voice note.
   Anything the model scored below 0.6 carries a `VERIFY` chip and starts
   unticked: the customer opts in rather than paying for a guess.
4. The order lands in Firestore. The **admin board** picks it up in the same
   second, showing the raw upload beside the AI's reading of it.
5. The admin prices it in the side sheet and sends it. **Concierge** errands get
   stop-by-stop availability and a manual delivery fee.
6. The **vendor** accepts against a clock, packs, and resolves whatever the
   model was unsure of. Confirming clears the `VERIFY` chip everywhere at once.
7. The **rider** gets the task with the order type as the loudest thing on
   screen, a live map, and 70px status buttons. COD shows the amount to collect
   at 54px on near-black.
8. The **customer** watches the rider move and reads out a four-digit OTP at the
   door.

Every status change goes through `transition()` in `packages/core/src/status.ts`.
The Firestore rules mirror the same table, so the client check is UX and the
rules are the actual guard.

---

## Design system

`packages/core/src/tokens.ts` is the source; `apps/admin-web/src/app/globals.css`
and `apps/mobile/tailwind.config.js` mirror it. shadcn zinc, unmodified, plus
four category hues and one verify amber. Colour only ever encodes a category or
a state — nothing is coloured for decoration.

Type: **Geist** for interface, **Geist Mono** for every figure (tabular, so ₹
columns line up down a board), **Hind Madurai** for Tamil. Tamil never replaces
English — it sits under it at 0.78× in placeholder grey.

Touch targets: 44px minimum, 52px for calls, 70px for rider status buttons.

The full sheet, and all thirteen screen artboards, are in `design/` and
published as a canvas.

---

## Notable engineering decisions

**Money is integer paise, everywhere.** In Firestore, in props, in the AI
contract. Floats never touch a rupee amount; `formatInr` is the only thing that
renders one.

**One board subscription.** The admin board runs a single `where status in [...]`
listener and groups in memory. Four filtered queries would cost four listeners
re-running on every write for the same working set.

**The model's doubt is a product feature.** `confidence` is surfaced, not
smoothed: below 0.6 an item is flagged in the customer app, blocks the vendor's
"ready" button, and shows in the admin's review column. A false high score is
how the wrong medicine gets delivered.

**Turn-by-turn is a hand-off.** Every rider in Madurai already navigates with
Google Maps. DFC shows situational awareness plus a Navigate button rather than
reimplementing navigation badly.

**Rider tracking is frugal.** 25 metres or 10 seconds, whichever comes first. A
1-second GPS stream would flatten a work phone by mid-afternoon while telling
nobody anything new.

**Roles are custom claims, not documents.** The rules read
`request.auth.token.role`, so checking a role costs no document read and a
client can never grant itself one.

---

## Shipping to the App Store and Play Store

`apps/mobile/eas.json` has build and submit profiles for all three variants.

### One-time setup

```bash
npm i -g eas-cli
eas login
cd apps/mobile
eas init                  # writes the project id into app.config.ts extra
```

Then fill in the placeholders in `eas.json` → `submit`:

- `appleId`, `ascAppId`, `appleTeamId` from App Store Connect
- a Play Console service-account JSON at `secrets/play-service-account.json`
  (git-ignored — create the folder, it is not in the repo)

Create three apps in each store, matching the bundle ids in `app.config.ts`:

| Variant  | Bundle id                  |
| -------- | -------------------------- |
| customer | `in.dinasari.dfc`          |
| rider    | `in.dinasari.dfc.rider`    |
| vendor   | `in.dinasari.dfc.vendor`   |

### Getting an APK

Yes — Expo builds a real, installable `.apk`. The `preview` profiles in
`eas.json` are set to `buildType: "apk"` precisely so you can sideload one onto
a phone without going near the Play Store:

```bash
cd apps/mobile
eas build -p android --profile preview            # customer  -> .apk
eas build -p android --profile preview-rider      # rider     -> .apk
eas build -p android --profile preview-vendor     # vendor    -> .apk
```

EAS prints a download link when it finishes. Send it to a tester, they tap it,
Android installs it. No store account needed for this.

Two things worth knowing:

- **`preview` gives an APK, `production` gives an AAB.** Google Play only
  accepts Android App Bundles now, so the production profiles use
  `buildType: "app-bundle"`. APK is for sideloading and testing; AAB is for the
  store. Both come from the same code.
- **You can build locally instead** with `eas build --local` (needs the Android
  SDK installed) or `npx expo run:android --variant release`. EAS cloud builds
  are simpler because they need nothing installed.

For iOS there is no APK equivalent — distribution is TestFlight
(`eas build -p ios --profile preview` then `eas submit`), and it needs a paid
Apple Developer account. Android does not.

### Build and submit

```bash
# internal testing
eas build -p all --profile preview
eas build -p all --profile preview-rider
eas build -p all --profile preview-vendor

# store builds
eas build -p all --profile production
eas submit -p ios     --profile production
eas submit -p android --profile production
```

Repeat with `production-rider` and `production-vendor`.

### Before you submit — the things that actually get apps rejected

- **Permission strings.** Already written in `app.config.ts`, and they explain
  *why*, not *what*. Do not shorten them.
- **A demo account.** Both stores need reviewer credentials. Give them the
  seeded `customer@dfc.test`, and for the rider and vendor builds the matching
  role accounts — a reviewer who lands on an empty inbox will reject it.
- **Health claims.** DFC delivers medicine but must not diagnose, recommend or
  substitute one. The prompt forbids it explicitly; keep it that way, and expect
  Apple to ask about it under guideline 1.4.1.
- **Prescription handling.** `prescriptionOnly` products exist in the catalogue.
  Confirm with a pharmacist which of them legally need a prescription on file
  in Tamil Nadu before going live — that is a compliance question, not a code
  one, and I have not answered it here.
- **Play Data safety form.** Declare location (fine, foreground, rider only),
  camera, microphone, and that uploads go to Firebase Storage.
- **Background location.** Only the rider build declares it. Play requires a
  demo video justifying it; if that is friction you do not want yet, drop the
  `UIBackgroundModes` block and ship foreground-only tracking.
- **Age rating.** 4+/Everyone is right; there is no user-generated public
  content.

---

## Photo in, corrected list out

The customer photographs a prescription or a scribbled shopping list, Gemini
reads it, and the result comes back as an **editable** card rather than a
read-only summary. Every line can be renamed, re-united, re-quantified or
deleted, and missing lines can be added. This is the difference between an
admin telephoning somebody once per misread line and the customer fixing it in
five seconds, and on handwritten Tamil prescriptions there will be misreads.

The model also records `readAs` — the literal text on the paper — whenever it
expands an abbreviation, so a line named "Pantoprazole 40mg" can show that the
prescription said "Pan-40". An expansion the customer cannot see is one they
cannot correct.

Three rules hold this together and none of them are negotiable:

- **The photograph is never edited.** It is immutable in Storage (enforced by
  `resource == null`, see `storage.rules`) and stays what the pharmacist
  dispenses against. Editing changes the list DFC shops from, not the
  prescription, and the card says so in as many words.
- **A customer cannot set a price.** `editItem` ignores anything price-shaped
  it is handed; there is a test that smuggles one in to prove it.
- **The window is `incoming` only.** The Firestore rule already permitted
  `items` writes exactly then and no later, so the UI hides the affordance at
  the same moment the rule stops allowing it. Once an admin has priced the
  order, changing the wording underneath them would reprice their work.

Edited and added lines are marked `CUSTOMER EDITED` / `CUSTOMER ADDED` on the
vendor packing list and the admin sheet. A pharmacist has to be able to tell a
line lifted off the prescription from one somebody retyped.

## Composite indexes

`npm run test:indexes` checks every compound query in the app against
`firestore.indexes.json`. It needs no emulator, because it is guarding against
the one failure the emulator cannot show you: **the Firestore emulator serves
any query regardless of the index file**, so a query needing a composite index
passes every test here and then throws `FAILED_PRECONDITION` the first time it
runs against the real project.

That is worst in a background trigger. `repriceOnCreate` queries products by
`(storeId, isActive)`; with the index missing it throws where nobody is
looking, the catalogue price is never applied, and the customer is quietly
billed the model's estimate instead. Nothing alerts — the order just costs the
wrong amount. That index *was* missing, and writing this test is how it was
found.

The query manifest at the top of `firebase/tests/indexes.test.ts` is
hand-maintained, which is its honest limitation: it cannot notice a query
nobody added to it. Add an entry whenever you add a compound query. Deploy
indexes with `npm run deploy:indexes -w @dfc/firebase` — and remember they take
minutes to build on a populated collection, so deploy them *before* the code
that needs them.

## Two pins that will bite if you move them

**`@types/react` is pinned to 19.1.8** in the root `overrides`, and
`apps/admin-web` asks for exactly that version rather than a range. This is
load-bearing, not laziness. react-three-fiber v9 registers its JSX elements
(`<mesh>`, `<group>`, `<gridHelper>`) with `declare module 'react'`, and that
augmentation only reaches the *global* `JSX` namespace that Next.js resolves
against because @types/react 19.1 still re-exported one. 19.2 removed that
shim, and the live map stops compiling with a wall of
`Property 'group' does not exist on type 'JSX.IntrinsicElements'`.

Two things follow. Never install into `apps/admin-web` with
`--legacy-peer-deps` — it plants a nested `@types/react` that ignores the
override, and `npm install` will not remove it afterwards; you have to delete
`apps/admin-web/node_modules` and `package-lock.json` and reinstall. And
`@types/react-dom` has to stay on the matching 19.1.x, because 19.2.x peers on
`@types/react@^19.2.0` and drags the whole thing forward.

When you do want to move to 19.2+, the fix is a `three-env.d.ts` in
`apps/admin-web` registering `ThreeElements` against `React.JSX` — the mobile
app already carries exactly that file for the same reason.

**`apps/mobile/.npmrc` sets `legacy-peer-deps=true`, and removing it breaks
`npm install` outright.** `lucide-react-native@0.468.0` declares a peer range of
`react@^16 || ^17 || ^18`; Expo SDK 54 pins react 19.1.0. The package is SVG
icons rendered through react-native-svg and touches nothing that changed in
React 19 — the peer range is simply stale. Without the flag a fresh clone
cannot install the mobile app at all. Keep the file scoped to `apps/mobile`:
putting it at the repo root is what plants the nested `@types/react` described
above. Revisit when lucide publishes a React 19 range.

**`apps/mobile` is deliberately outside the npm workspaces** with its own
`node_modules`. Metro and npm hoisting do not get along; this is what stopped
`expo-router` becoming unresolvable from a hoisted `babel-preset-expo`. Install
it with `npm run install:all`, never by adding it to the workspaces array.

## Deploying the admin console

Firebase Hosting serves `apps/admin-web` as a **static export** — plain HTML
and JS on the CDN. There is no SSR and no Cloud Run: the console talks to
Firestore directly from the browser and `firestore.rules` is the boundary, so
there is nothing for a server to do. The consequence to remember is that this
app has no API routes, no server actions and no middleware; anything that
genuinely needs a server belongs in `firebase/functions`.

```bash
firebase login          # interactive, needs a browser, once per machine
npm run deploy:hosting  # rebuilds the export, then deploys
```

That publishes to `dfc-app-bdb4e.web.app`. To check it locally first:

```bash
npm run serve:hosting   # builds, then serves on :5000 through the emulator
```

The four legal routes are the public URLs both app stores ask for —
`/legal/privacy`, `/legal/terms`, `/legal/refunds` and `/legal/delete-account`,
the last of which Google Play requires by name. They render today but carry
placeholders from `core/legal.ts` and say so in a banner; they are not
submittable until those are filled in.

### Client config

`.env` at the root, `apps/mobile/.env` and `apps/admin-web/.env.local` hold the
Firebase web config for `dfc-app-bdb4e`. Those values are public by design —
every Firebase web app ships them in its bundle — and what protects the project
is rules plus App Check, not hiding them. They are still git-ignored, because
the file also has room for keys that are not public.

`NEXT_PUBLIC_RECAPTCHA_SITE_KEY` is deliberately blank: leave it that way and
App Check simply does not initialise, and Firestore is protected by rules
alone. To turn it on, register the web app under App Check with reCAPTCHA v3
and paste the site key in.

The service-account JSON in the repo root is the opposite of all this: a real
secret, server-only, git-ignored, and it must never reach a browser or a mobile
bundle. The built `out/` directory is scanned for it as part of deploying.

## Testing the flow without three phones

```bash
cd firebase && npm run emulators -w @dfc/firebase
```

Then set `NEXT_PUBLIC_USE_EMULATOR=1` for the admin app. Sign in as the
customer on a simulator, as the vendor on a second one, and keep the board open
in a browser — the whole lifecycle is visible across the three at once.

---

## Every screen

27 screens across the three mobile apps:

| Area | Screens |
| --- | --- |
| Auth | Biometric unlock + location detect · **Phone OTP sign-in** · staff email sign-in |
| Customer | Chat thread · order tracking (live map + OTP) · **order history** |
| Account | Hub · **profile** · **saved addresses** · **language** · **notifications** · **payment methods** · **help & FAQ** · **delete account** |
| Legal | **Privacy policy** · **Terms of service** · **Refunds & cancellations** — in-app and on the web |
| Vendor | Inbox with accept clock · packing + pharmacist confirmation · **payouts** · **account** |
| Rider | Queue · live task · **earnings** · **account** |
| Admin web | Board · live-ops 3D map · catalogue & stock · promotions & ads · four public policy pages |

### The store-required ones

These are not optional, and both stores actively test them:

- **Account deletion inside the app** — Apple guideline 5.1.1(v). It is a
  visible row on the account hub, one tap from the top, and it actually deletes
  rather than opening a support email. It refuses while an order is live,
  removes every upload, strips identity from the retained financial records,
  then deletes the credential.
- **A public deletion URL** — Google Play requires one reachable without the
  app installed. That is `/legal/delete-account`.
- **Privacy policy and terms at public URLs** — `/legal/privacy`,
  `/legal/terms`, prerendered as static HTML, outside the auth wall so a
  reviewer can read them.

All four documents come from `packages/core/src/legal.ts`, so the policy you
link from the store listing and the one inside the app are literally the same
text and cannot drift.

**They are drafts.** Every `[BRACKETED]` value — registered name, address,
GSTIN, grievance officer — is a real fact about your company that I could not
invent. The apps show a loud warning while any placeholder remains, because a
policy with a placeholder in it is an automatic rejection. Fill them in, then
have a lawyer read them.

### Language

Three real choices, not a toggle: English, Tamil, or both (Tamil under English
at 0.78×, the default the design was drawn for). It is device-local, and the
picker shows a live preview using a real button from the app.

## Verified

Everything below was actually run on this checkout, not assumed:

| Check | Result |
| --- | --- |
| `packages/core` typecheck | clean |
| `apps/admin-web` typecheck | clean |
| `apps/mobile` typecheck | clean |
| `next build` | 11 pages, static export · 380 kB first load on the board |
| `expo export --platform ios` | 10.6 MB Hermes bundle |
| `expo export --platform android` | 10.6 MB Hermes bundle |
| `tsc --noEmit` · firebase/functions | clean |
| `tsc` · functions build | 4 modules compiled |
| `npm test -w @dfc/core` | **122 / 122**, 23 suites |
| `npm run test:indexes` · index coverage | **11 / 11**, 2 suites |
| `npm run test:rules` · Firestore emulator | **60 / 60**, 13 suites |
| `npm run test:storage` · Storage emulator | **41 / 41**, 5 suites |
| `npm run test:functions` · Functions + Firestore | **148 / 148**, 29 suites |
| `eslint .` · core, functions, mobile, admin-web | clean |
| Hosting emulator · every route | 8 × 200, unknown → 404 |
| `expo-doctor` | 17/18 |

The one `expo-doctor` failure is "duplicate react": it walks up and finds the
Next.js app's copy at the repo root. Metro never uses it — `metro.config.js`
pins `react` and `react-native` to the app's own `node_modules` via
`extraNodeModules`, which is what actually decides what lands in the bundle.
Expected for a repo that ships both a web app and a native app.

## The glossy layer

Gloss is applied where it earns attention and withheld where it costs
comprehension. Onboarding, sign-in and the cash-collection screen get depth,
glass and 3D. The Kanban board, the packing checklist and every item table stay
flat and hairline-sharp, because a shopkeeper counting strips of tablets needs
contrast, not atmosphere.

- **A real 3D hero** (`src/ui/hero-3d.tsx`) — a lit, turning parcel on
  three.js via `expo-gl`, carried across onboarding and sign-in. It is required
  lazily and falls back to a matched SVG illustration
  (`src/ui/hero-fallback.tsx`) when the native module is missing, so Expo Go
  degrades to *different*, never to *broken*. A crash on the login screen is
  the worst possible place for one.
- **`AuroraField`** — two slowly drifting colour pools behind a near-white
  field. Depth without the gradient wash that marks a template.
- **`GlassCard`** — `expo-blur` frosted glass, with a heavier tint on Android
  where the platform blur is weaker, so both land in the same place.
- **One spring, everywhere.** `PRESS_SPRING` in the `Button` and
  `PressableScale` share a single damping/stiffness pair, so the whole app
  moves with one hand. Rider buttons sink less and get a heavier haptic — they
  are pressed through a glove, at arm's length, next to a running engine.
- **`Shimmer` over spinners.** A skeleton shaped like the thing that is coming
  makes a 900 ms wait feel like 400.

### The login experience

One screen, three states, no navigation between them: number → code → name
(first time only). Bouncing between routes for a two-field flow is what makes
most delivery apps feel like paperwork.

- **Phone-first.** Nobody in Madurai wants to invent a password to buy
  paracetamol, and the number is what a rider needs anyway. Email is tucked
  behind "Staff sign-in".
- **A proper OTP field** (`src/ui/otp-input.tsx`) — six boxes, but *one* hidden
  `TextInput` behind them. Six separate inputs is the obvious implementation
  and the wrong one: it fights autofill, breaks paste, and backspace does
  nothing useful. One field with `textContentType="oneTimeCode"` gets the iOS
  keyboard suggestion and the Android SMS Retriever for free. It submits itself
  on the last digit.
- **Wrong code shakes**, with an error haptic — cheaper and faster to read than
  an error line.
- **Location resolves in the background**, so the locality chip is already
  filled in by the time the session is live.
- **A returning customer never sees any of it** — live session plus enrolled
  biometrics opens straight into the thread.

## Cloud Functions

`firebase/functions` — everything a client must not be trusted with. Region is
`asia-south1` (Mumbai): closest to Madurai, and it keeps order data in-country,
which the DPDP Act disclosure in the privacy policy depends on.

| Function | Kind | Job |
| --- | --- | --- |
| `createPaymentLink` | callable | Hosted checkout — UPI, cards, net banking, wallets. No native SDK. |
| `razorpayWebhook` | HTTP | The **only** thing allowed to write `paid`. HMAC-verifies the raw body before believing a word of it. |
| `createGatewayOrder` | callable | Reads the amount from Firestore, never the client. Idempotent. |
| `onOrderChanged` | trigger | FCM fan-out — vendor alarm, rider ping, customer milestones. |
| `onRiderArrived` | trigger | The at-the-door push, with the OTP and the cash figure. |
| `setUserRole` | callable | Writes the custom claim every rule reads. Admin-only. |
| `redeemPromotion` | callable | Re-evaluates the discount server-side and increments counters atomically. |
| `trackPromotion` | callable | Impressions and clicks. |
| `repriceOnCreate` | trigger | Replaces the model's price estimates with catalogue prices. |

Three deliberate details worth knowing:

- **The webhook verifies over `req.rawBody`.** Re-stringifying the parsed body
  changes key order and whitespace, and the signature will never match.
  Comparison is `timingSafeEqual`, because `===` on a signature leaks its
  prefix through timing.
- **A short payment is not a payment.** If the captured amount is under the
  order total, the payment goes to `awaiting_confirmation` rather than `paid` —
  goods are not released on a partial.
- **`repriceOnCreate` is conservative.** `matchProduct` returns null on an
  ambiguous match rather than guessing, and an unmatched item keeps its
  estimate and its VERIFY chip. Being wrong here means dispensing the wrong
  medicine.

### Secrets

```bash
firebase functions:secrets:set RAZORPAY_KEY_ID
firebase functions:secrets:set RAZORPAY_KEY_SECRET
firebase functions:secrets:set RAZORPAY_WEBHOOK_SECRET
npm --prefix firebase/functions run deploy
```

Then point Razorpay's webhook at the deployed `razorpayWebhook` URL and
subscribe it to `payment.captured`, `payment.failed`, `refund.processed`.

## Push notifications

Three audiences, three urgencies — treating them the same is how an app gets
muted.

| Audience | Channel | Why |
| --- | --- | --- |
| Vendor | MAX importance, own sound, bypasses DND | An unanswered order costs a sale and gets reassigned |
| Rider | HIGH, vibration | Time-critical, not an emergency |
| Customer | DEFAULT, milestones only | Nobody needs a chime because a shop opened a box |

Android channels are declared client-side (`src/lib/push.ts`) with ids matching
the server's — a message naming an unknown channel is silently downgraded,
which is how a vendor misses an order and nobody can work out why. Dead tokens
are pruned server-side on send.

## Built for the field

Two changes that only matter once the app is on a bike in Madurai:

- **Offline cache.** Firestore uses a disk-backed persistent cache, so a rider
  in a dead spot still has the active task — address, phone, OTP, items — and
  status taps queue and replay when signal returns. Without it the screen goes
  blank mid-delivery.
- **GPS backs off when stationary.** A fixed 25 m / 10 s stream runs the radio
  flat over an eight-hour shift, and a rider parked at a signal is writing the
  same point over and over. After 90 seconds without real movement the writes
  stop; the local dot keeps tracking.

## Money

The whole flow, closed: choose a method → pay → get a GST tax invoice.

### Two methods, because two are real

**Cash** is the default outside pharmacy. The rider's screen does the
arithmetic: tap what the customer handed over, read the change back, with an
exact denomination breakdown down to ₹1 coins. A breakdown that stops at ₹10
would quietly lose ₹7 on a ₹243 bill paid with ₹500 — and a rider would trust
it. Every change amount from ₹0 to ₹500 is asserted to break down exactly.

**UPI** opens GPay / PhonePe / Paytm / BHIM with the amount and a DFC reference
pre-filled, via a `upi://pay` intent link. No gateway, no merchant onboarding.

### The honest bit about UPI

A `upi://` link opens the app and the money moves. What it *cannot* do is prove
the money arrived — the payer's app returns a status string a modified client
can forge. Treating that as proof is how you get robbed.

So a UPI payment lands in `awaiting_confirmation`, never `paid`. An admin
matches the reference (or the customer's 12-digit UTR) against the bank in the
order sheet, and two clicks moves it. The Firestore rules enforce this: a
customer may write `awaiting_confirmation` and can never write `paid`.

That is a real, working flow for day one. `method: 'gateway'` is wired as a
drop-in for when Razorpay/PhonePe credentials exist — the webhook writes `paid`
and the human step disappears for those orders.

### Invoicing, done correctly

`packages/core/src/invoice.ts`. DFC is a courier, not a shop, so an invoice has
two kinds of line:

| | Treatment |
| --- | --- |
| Goods bought for the customer | Pure-agent reimbursement, Rule 33 CGST. **No DFC GST** — the store's GST is already inside the MRP. |
| Delivery + concierge fees | DFC's own supply. **CGST 9% + SGST 9%**, intra-state. |

Charging GST on the whole basket double-taxes the goods and fails an audit;
charging none understates DFC's supply. Fees are quoted GST-inclusive and split
backwards, so the invoice total equals the number the customer approved —
₹243 stays ₹243.

Also handled: sequential per-financial-year numbering (`DFC/2026-27/000123`,
allocated in a transaction because a gap is a compliance problem), SAC codes,
place of supply, and the amount in words in Indian numbering
("Rupees One Lakh Twenty Four Thousand Five Hundred Only").

Invoices are immutable — `allow update, delete: if false`. A correction is a
credit note, not an edit.

**Verified by running it**, not by inspection: GST splits re-sum exactly across
every tested fee, amount-in-words is right through crore, the financial year
rolls on 1 April, and a real ₹243 order produces a balancing invoice.

## Built to stay fast

- **The board is bounded twice.** 48 hours and 300 orders
  (`BOARD_WINDOW_HOURS`, `BOARD_MAX_ORDERS`). Firestore streams and retains
  every matching document, so an unbounded live query quietly becomes a
  multi-thousand-document subscription that re-renders on every write. When the
  cap bites, the board says so rather than silently lying.
- **Cards are memoised on `updatedAt`.** One write re-delivers the whole
  snapshot; without this, a rider tapping one button re-renders every card in
  every column.
- **Every mobile listener is capped** — 30 orders of customer history, 60 live
  store orders, 10 rider tasks, 100 thread messages. Unbounded listeners on a
  phone cost battery and reads that grow forever, and nobody scrolls that far.
- **Rider GPS is throttled to 25 m / 10 s.** A 1-second stream would flatten a
  work phone by mid-afternoon while telling nobody anything new.
- **three.js is dynamically imported**, so the 3D live-ops map costs the board
  nothing — `/live` adds 3.6 kB over the shared chunk.
- **One board listener, not four.** Grouping happens in memory; four filtered
  queries would cost four listeners over the same working set.

## Known gaps

These are deliberate, and each is a decision waiting on you rather than an
oversight:

- **Gateway credentials.** The Razorpay integration is written and compiles —
  webhook, signature verification, order creation, refunds. It has never run
  against a real key, because there isn't one yet. Set the three secrets and
  it takes over from the manual confirmation step.
- **The UPI payee is a placeholder.** `UPI_PAYEE.vpa` in
  `packages/core/src/payment.ts` must be your real VPA before you take a rupee;
  the app refuses to build a link until it is.
- **Push needs an EAS project id.** Registration is wired, but
  `getExpoPushTokenAsync` needs `eas init` to have run. Until then it returns
  `no-project-id` and degrades quietly.
- **Real road polylines.** The map draws an arc. Set
  `EXPO_PUBLIC_GOOGLE_DIRECTIONS_KEY` and swap `arc()` in
  `apps/mobile/src/ui/live-map.tsx` for a decoded Directions response.
- **Tests cover the domain logic, both rule sets and the whole server.** 382
  in total: 122 unit tests on money, state and item edits, 11 index-coverage
  checks, 60 Firestore rules tests, 41 Storage rules tests, and 148 Cloud
  Functions tests. The screens have none —
  `firebase emulators` plus the seeded accounts is how those get exercised
  today.

  `npm run verify` at the root runs typecheck across all four packages, then
  lint, then all four suites. The emulator-backed suites need Java on PATH.

  The four suites answer different questions and the split is deliberate: the
  unit tests ask whether the arithmetic is right; the Firestore and Storage
  rules tests ask what a *client* is allowed to write; and the functions tests
  ask what the server does once a request is already past the rules — where
  the only thing left protecting the data is the code.
