/**
 * Legal and policy content.
 *
 * Written once here so the in-app screens and the public web pages can never
 * drift apart — Apple and Google both check that the policy you link from the
 * store listing matches the one inside the app.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * THIS IS A DRAFT, NOT LEGAL ADVICE.
 *
 * It is structured correctly and covers what the DPDP Act 2023, the Apple
 * review guidelines and the Play Data Safety form actually ask for, but every
 * [BRACKETED] value is a real fact about your company that I cannot invent —
 * registered name, address, GSTIN, grievance officer. Fill them in, then have
 * a lawyer read it before you submit. A privacy policy with a placeholder in
 * it is an automatic store rejection.
 * ─────────────────────────────────────────────────────────────────────────
 */

export interface PolicySection {
  heading: string;
  headingTa?: string;
  /** Each string is a paragraph. */
  body: string[];
  /** Rendered as a bulleted list under the paragraphs. */
  bullets?: string[];
}

export interface PolicyDocument {
  id: 'privacy' | 'terms' | 'refunds' | 'delete-account';
  title: string;
  titleTa: string;
  /** ISO date. Bump this whenever the text changes — stores check it. */
  updated: string;
  summary: string;
  sections: PolicySection[];
}

/** Fill these in before you ship. Every one appears in the policies below. */
export const COMPANY = {
  legalName: '[REGISTERED COMPANY NAME]',
  tradingName: 'Dinasari Food Courier',
  address: '[REGISTERED ADDRESS, MADURAI, TAMIL NADU, PIN]',
  cin: '[CIN / REGISTRATION NUMBER]',
  gstin: '[GSTIN]',
  supportEmail: '[support@yourdomain.in]',
  privacyEmail: '[privacy@yourdomain.in]',
  grievanceOfficer: '[GRIEVANCE OFFICER NAME]',
  grievancePhone: '[+91 XXXXX XXXXX]',
  website: '[https://yourdomain.in]',

  /**
   * FSSAI licence. Required on every invoice and displayed in-app for anyone
   * handling or transporting food. A courier moving cooked food and groceries
   * needs its own registration — the restaurant's does not cover you.
   *
   * Single-state operation starts as a State licence; add the Central number
   * if you expand beyond Tamil Nadu.
   */
  fssaiLicence: '[FSSAI LICENCE NUMBER]',
  fssaiType: 'State' as 'State' | 'Central',
} as const;

/**
 * The pharmacy leg.
 *
 * DFC does not hold a drug licence and must never appear to. Scheduled
 * medicines are dispensed and invoiced by the partner pharmacy under their own
 * Form 20/21; DFC transports a sealed package and invoices only the delivery.
 *
 * This is not a formality — a courier that appears to sell prescription
 * medicine is operating a pharmacy without a licence. Every vendor agreement
 * has to say so explicitly, and the app has to show it.
 */
export const PHARMACY_DISCLOSURE = {
  en:
    'Medicines are dispensed and invoiced by the licensed partner pharmacy under their own ' +
    'Drug Licence (Form 20/21). Dinasari Food Courier transports the sealed package and ' +
    'charges only for delivery. We do not sell, substitute or advise on medicine.',
  ta:
    'மருந்துகள் உரிமம் பெற்ற மருந்தகத்தால் வழங்கப்படுகின்றன. தினசரி உணவு கூரியர் ' +
    'டெலிவரி மட்டுமே செய்கிறது.',
} as const;

/** Every licence a customer or a reviewer is entitled to see. */
export interface LicenceLine {
  label: string;
  value: string;
  note: string;
}

export function licences(): LicenceLine[] {
  return [
    {
      label: 'GSTIN',
      value: COMPANY.gstin,
      note: 'Goods and Services Tax registration',
    },
    {
      label: `FSSAI (${COMPANY.fssaiType})`,
      value: COMPANY.fssaiLicence,
      note: 'Food licence — required to transport cooked food and groceries',
    },
    {
      label: 'CIN',
      value: COMPANY.cin,
      note: 'Company registration',
    },
  ];
}

export const POLICY_UPDATED = '2026-08-24';

// ---------------------------------------------------------------------------
// Privacy
// ---------------------------------------------------------------------------

export const PRIVACY_POLICY: PolicyDocument = {
  id: 'privacy',
  title: 'Privacy Policy',
  titleTa: 'தனியுரிமைக் கொள்கை',
  updated: POLICY_UPDATED,
  summary:
    `${COMPANY.tradingName} collects the least it can to get an order from your phone to your door. ` +
    'This page says exactly what that is, who sees it, and how to get rid of it.',
  sections: [
    {
      heading: 'Who we are',
      headingTa: 'நாங்கள் யார்',
      body: [
        `${COMPANY.tradingName} is operated by ${COMPANY.legalName}, registered at ${COMPANY.address} (${COMPANY.cin}). We are the data fiduciary for the personal data described here, under India's Digital Personal Data Protection Act, 2023.`,
        `Questions about this policy go to ${COMPANY.privacyEmail}.`,
      ],
    },
    {
      heading: 'What we collect',
      headingTa: 'நாங்கள் என்ன சேகரிக்கிறோம்',
      body: ['Only what an order needs. Grouped by why we need it:'],
      bullets: [
        'Account — your name, phone number and, if you add one, an email address. Your phone number is your identity here; we cannot deliver without it.',
        'Delivery address — the address you type and the locality we detect. Location is read only while the app is open, and only to work out which part of Madurai you are in and what delivery should cost.',
        'What you order — photographs of prescriptions or shopping lists, voice notes, and typed messages, plus the structured order our system reads out of them.',
        'Payment status — whether an order was paid, and by what method. Card and UPI details are handled entirely by our payment provider and never reach our servers.',
        'Device and diagnostic data — crash reports and basic device information, so we can fix what breaks.',
        'Rider location — for rider accounts only, and only while a delivery is in progress.',
      ],
    },
    {
      heading: 'Prescriptions and health information',
      headingTa: 'மருந்துச் சீட்டு தகவல்',
      body: [
        'A photograph of a prescription is sensitive. We treat it that way.',
        'When you send one, it is read by an automated system to produce a list of medicines, and it is shown to the DFC staff member who prices your order and to the pharmacist who fills it. Nobody else sees it. It is not used to train any model, it is not sold, and it is not shared with insurers, employers or advertisers — ever.',
        'You can delete a prescription image from your order history at any time, and deleting your account removes all of them.',
      ],
    },
    {
      heading: 'Automated processing',
      headingTa: 'தானியங்கி செயலாக்கம்',
      body: [
        'Your photo, voice note or message is sent to Google\'s Gemini model through Firebase AI Logic to be turned into a list of items. Google processes it to answer that one request and, under the Firebase AI Logic terms, does not use it to train its models.',
        'The result is always reviewed by a person before anything is dispensed or charged. Where the system is unsure of a medicine, it says so and a pharmacist confirms it. No automated decision on this platform has a legal or similarly significant effect on you.',
      ],
    },
    {
      heading: 'Who else sees your data',
      headingTa: 'வேறு யார் பார்க்கிறார்கள்',
      body: ['Only the people and services that have to:'],
      bullets: [
        'The store filling your order — your first name, the items, and nothing else.',
        'Your rider — your name, delivery address and phone number, for the duration of the delivery only.',
        'Google Firebase — hosting, database, file storage and the AI processing described above.',
        'Our payment provider — to take payment.',
        'Law enforcement, where we are legally required to, and no further than required.',
      ],
    },
    {
      heading: 'Where your data lives',
      headingTa: 'தரவு எங்கே சேமிக்கப்படுகிறது',
      body: [
        'Order and account data is stored in Google Cloud regions. [CONFIRM YOUR FIREBASE REGION — set this to the actual region and state whether any processing happens outside India, which the DPDP Act requires you to disclose.]',
      ],
    },
    {
      heading: 'How long we keep it',
      headingTa: 'எவ்வளவு காலம் வைத்திருப்போம்',
      body: ['Not indefinitely.'],
      bullets: [
        'Prescription images and voice notes — 90 days after the order is delivered, then deleted.',
        'Order records — retained while your account exists, and afterwards only as long as tax and accounting law requires.',
        'Rider location history — discarded when the delivery completes.',
        'Everything else — deleted within 30 days of you deleting your account.',
      ],
    },
    {
      heading: 'Your rights',
      headingTa: 'உங்கள் உரிமைகள்',
      body: [
        'Under the DPDP Act 2023 you can ask us for a copy of your data, ask us to correct it, ask us to delete it, and withdraw consent you previously gave.',
        'Account, addresses and language can be changed in the app under Account. Deletion is under Account → Delete account, and takes effect immediately. You do not need to email anyone to delete your account.',
        `If we get something wrong, our Grievance Officer is ${COMPANY.grievanceOfficer}, reachable at ${COMPANY.privacyEmail} or ${COMPANY.grievancePhone}. We respond within 30 days. If you are not satisfied, you may complain to the Data Protection Board of India.`,
      ],
    },
    {
      heading: 'Children',
      headingTa: 'குழந்தைகள்',
      body: [
        'DFC is not for anyone under 18. We do not knowingly collect data from children. If you believe a child has given us data, write to us and we will remove it.',
      ],
    },
    {
      heading: 'Changes',
      headingTa: 'மாற்றங்கள்',
      body: [
        'If we change this policy materially, we will tell you in the app before the change takes effect. The date at the top always reflects the current version.',
      ],
    },
  ],
};

// ---------------------------------------------------------------------------
// Terms
// ---------------------------------------------------------------------------

export const TERMS_OF_SERVICE: PolicyDocument = {
  id: 'terms',
  title: 'Terms of Service',
  titleTa: 'சேவை விதிமுறைகள்',
  updated: POLICY_UPDATED,
  summary:
    'What you can expect from DFC, and what we expect from you. Plain terms, no traps.',
  sections: [
    {
      heading: 'What DFC is',
      headingTa: 'DFC என்றால் என்ன',
      body: [
        `${COMPANY.tradingName} is a local delivery service in Madurai. You tell us what you need; we buy it from a shop on your behalf and bring it to you.`,
        `Food and grocery deliveries are made under FSSAI ${COMPANY.fssaiType} licence ${COMPANY.fssaiLicence}.`,
        'We are a courier and errand service. The shop sells the goods; we fetch them. Where a product is defective or wrongly supplied, we will help you resolve it with the shop and, where the fault is ours, we will make it right.',
      ],
    },
    {
      heading: 'Your account',
      headingTa: 'உங்கள் கணக்கு',
      body: [
        'You must be 18 or older. Keep your phone number current — it is how we and your rider reach you. You are responsible for orders placed from your account.',
      ],
    },
    {
      heading: 'Medicines',
      headingTa: 'மருந்துகள்',
      body: [
        'DFC does not prescribe, diagnose, substitute or advise on medicine. Ever.',
        `${PHARMACY_DISCLOSURE.en}`,
        'Prescription-only medicines are dispensed by a licensed pharmacist, who is entitled to refuse an order, ask to see the original prescription, or contact the prescribing doctor. Where our system is unsure what a prescription says, a pharmacist confirms it before anything is dispensed.',
        'If a pharmacist refuses an item, you are not charged for it.',
      ],
    },
    {
      heading: 'Prices',
      headingTa: 'விலைகள்',
      body: [
        'Prices shown before a human has reviewed your order are estimates and are labelled as such. The price you are asked to approve is the price you pay.',
        'Delivery fees depend on distance and the number of stops, and are shown before you confirm. Cash-on-delivery orders are payable in full to the rider at the door.',
      ],
    },
    {
      heading: 'Cancelling',
      headingTa: 'ரத்து செய்தல்',
      body: [
        'You can cancel free of charge until the shop starts packing. After that, and before dispatch, we may charge for goods already bought on your behalf — perishables and prescription medicines in particular. Once a rider is on the way, the order is payable in full.',
        'We may cancel an order if the goods are unavailable, the address is unreachable, or we cannot contact you. You are refunded in full when we do.',
      ],
    },
    {
      heading: 'Behaviour',
      headingTa: 'நடத்தை',
      body: [
        'Riders and shop staff are people doing a job. Abuse, threats or harassment gets an account closed immediately and, where appropriate, reported.',
      ],
    },
    {
      heading: 'Liability',
      headingTa: 'பொறுப்பு',
      body: [
        'We are liable for what we do — losing your goods, damaging them, delivering to the wrong place. We are not liable for the quality or fitness of goods manufactured or sold by someone else, or for delays caused by weather, traffic, strikes or events outside our control.',
        'Nothing here limits liability that cannot be limited under Indian law, including liability for death or personal injury caused by negligence, or your rights under the Consumer Protection Act, 2019.',
      ],
    },
    {
      heading: 'Governing law',
      headingTa: 'சட்ட அதிகார வரம்பு',
      body: [
        'These terms are governed by the laws of India. Disputes are subject to the courts at Madurai, Tamil Nadu.',
      ],
    },
  ],
};

// ---------------------------------------------------------------------------
// Refunds
// ---------------------------------------------------------------------------

export const REFUND_POLICY: PolicyDocument = {
  id: 'refunds',
  title: 'Refunds & Cancellations',
  titleTa: 'பணத்திரும்பல் & ரத்து',
  updated: POLICY_UPDATED,
  summary: 'When you get your money back, how much, and how quickly.',
  sections: [
    {
      heading: 'Full refund',
      headingTa: 'முழு பணத்திரும்பல்',
      body: ['You get everything back, including the delivery fee, when:'],
      bullets: [
        'You cancel before the shop starts packing.',
        'We cancel because the goods are unavailable.',
        'The order never arrives.',
        'The wrong items arrive and you do not want them.',
        'A pharmacist refuses an item — that item is refunded in full.',
      ],
    },
    {
      heading: 'Partial refund',
      headingTa: 'பகுதி பணத்திரும்பல்',
      body: [
        'Where some items are missing, damaged or substituted without your agreement, we refund those items. The delivery fee stands if the rest of the order arrived as ordered.',
      ],
    },
    {
      heading: 'No refund',
      headingTa: 'பணத்திரும்பல் இல்லை',
      body: [
        'Once a rider has handed over the correct goods in good condition, the order is complete. Prescription medicines cannot be returned once dispensed — that is a legal restriction, not our preference.',
      ],
    },
    {
      heading: 'How long it takes',
      headingTa: 'எவ்வளவு நேரம் ஆகும்',
      body: [
        'We approve refunds within 24 hours of agreeing one. Money reaches a UPI account in 1–3 working days and a card in 5–7, depending on your bank. Cash-on-delivery refunds are paid by UPI to a number you nominate.',
      ],
    },
    {
      heading: 'Raising a problem',
      headingTa: 'புகார் தெரிவிக்க',
      body: [
        `Report it from Account → Help within 48 hours of delivery, or call ${COMPANY.grievancePhone}. Tell us the order number — it is the four digits at the top of the order.`,
      ],
    },
  ],
};

// ---------------------------------------------------------------------------
// Account deletion — a store requirement, not a nicety
// ---------------------------------------------------------------------------

export const DELETE_ACCOUNT_POLICY: PolicyDocument = {
  id: 'delete-account',
  title: 'Delete Your Account',
  titleTa: 'கணக்கை நீக்கவும்',
  updated: POLICY_UPDATED,
  summary:
    'You can delete your DFC account and your data from inside the app, in two taps, without asking anyone.',
  sections: [
    {
      heading: 'From the app',
      headingTa: 'செயலியிலிருந்து',
      body: [
        'Open DFC, go to Account, scroll to the bottom, and tap Delete account. Confirm, and it happens immediately.',
      ],
    },
    {
      heading: 'Without the app',
      headingTa: 'செயலி இல்லாமல்',
      body: [
        `If you have uninstalled DFC, email ${COMPANY.privacyEmail} from the address on your account, or send a request from the phone number on your account to ${COMPANY.grievancePhone}. We verify it is you, then delete within 7 days and confirm when it is done.`,
      ],
    },
    {
      heading: 'What gets deleted',
      headingTa: 'என்ன நீக்கப்படும்',
      body: ['Immediately, and permanently:'],
      bullets: [
        'Your name, phone number, email and saved addresses.',
        'Every prescription photograph, voice note and message you sent.',
        'Your order history and chat threads.',
        'Your notification and language preferences.',
      ],
    },
    {
      heading: 'What we have to keep',
      headingTa: 'நாங்கள் வைத்திருக்க வேண்டியவை',
      body: [
        'Indian tax and accounting law requires us to keep a financial record of completed transactions — the amount, the date and the invoice — for the statutory period. Those records are detached from your identity as far as the law allows, and are used for nothing else.',
        'If you have an order in progress or an unresolved payment, we will ask you to let it finish before deleting.',
      ],
    },
    {
      heading: 'It is not reversible',
      headingTa: 'இதை மாற்ற முடியாது',
      body: [
        'Deleting is permanent. Signing up again with the same number creates a new, empty account — your history does not come back.',
      ],
    },
  ],
};

export const POLICIES: Record<PolicyDocument['id'], PolicyDocument> = {
  privacy: PRIVACY_POLICY,
  terms: TERMS_OF_SERVICE,
  refunds: REFUND_POLICY,
  'delete-account': DELETE_ACCOUNT_POLICY,
};

export const POLICY_LIST: PolicyDocument[] = [
  PRIVACY_POLICY,
  TERMS_OF_SERVICE,
  REFUND_POLICY,
  DELETE_ACCOUNT_POLICY,
];

/** True while any [PLACEHOLDER] is still unfilled — the apps warn on this. */
export function hasUnfilledPlaceholders(): boolean {
  return Object.values(COMPANY).some((v) => v.includes('['));
}
