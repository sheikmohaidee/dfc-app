/**
 * Bilingual copy.
 *
 * The pairing rule from the Foundations sheet: Tamil never *replaces* English,
 * it sits under it at 0.78x size in muted-foreground. So `t()` returns both
 * strings and the component decides how to stack them — there is no "current
 * language" global, because there is no single language.
 */

export interface Bi {
  en: string;
  ta: string;
}

export const COPY = {
  // --- brand -------------------------------------------------------------
  appName: { en: 'Dinasari Food Courier', ta: 'தினசரி உணவு கூரியர்' },
  appShort: { en: 'DFC', ta: 'DFC' },

  // --- auth --------------------------------------------------------------
  unlock: { en: 'Unlock DFC', ta: 'DFC-ஐ கைரேகை மூலம் திறக்கவும்' },
  touchToContinue: { en: 'Touch to continue', ta: 'தொடர்ந்து செல்ல தொடவும்' },
  useOtpInstead: { en: 'Use OTP instead', ta: 'OTP பயன்படுத்தவும்' },
  detectingLocation: { en: 'Detecting location…', ta: 'இருப்பிடம் கண்டறியப்படுகிறது…' },
  change: { en: 'Change', ta: 'மாற்று' },
  securedByBiometrics: { en: 'Secured by device biometrics', ta: 'சாதன பாதுகாப்பு' },

  // --- customer chat -----------------------------------------------------
  greeting: { en: 'Hello', ta: 'வணக்கம்' },
  chatHint: { en: 'Speak, snap a list, or just type.', ta: 'பேசுங்கள், படம் எடுங்கள், அல்லது எழுதுங்கள்.' },
  typeOrPaste: { en: 'Type or paste a list…', ta: 'பட்டியலை எழுதுங்கள்' },
  noteForStore: { en: 'Add a note for the store…', ta: 'கடைக்கு குறிப்பு' },
  reading: { en: 'Reading your request…', ta: 'உங்கள் கோரிக்கையை படிக்கிறோம்…' },
  listening: { en: 'Listening…', ta: 'கேட்கிறோம்…' },
  recordingHint: { en: 'Release to send', ta: 'விட்டால் அனுப்பப்படும்' },

  // --- categories --------------------------------------------------------
  pharmacy: { en: 'Pharmacy', ta: 'மருந்தகம்' },
  grocery: { en: 'Grocery', ta: 'மளிகை' },
  food: { en: 'Food', ta: 'உணவு' },
  concierge: { en: 'Concierge', ta: 'சிறப்பு பணி' },

  // --- money -------------------------------------------------------------
  subtotal: { en: 'Subtotal', ta: 'கூட்டுத்தொகை' },
  items: { en: 'Items', ta: 'பொருட்கள்' },
  delivery: { en: 'Delivery', ta: 'டெலிவரி கட்டணம்' },
  serviceFee: { en: 'Concierge service', ta: 'சேவை கட்டணம்' },
  total: { en: 'Total', ta: 'மொத்தம்' },
  confirmAndPay: { en: 'Confirm & Pay', ta: 'உறுதி செய்து பணம் செலுத்துங்கள்' },
  // The review step sends the list to a shop; money comes later, once a human
  // has priced it. Promising 'pay' here would be a lie about what the tap does.
  sendToStore: { en: 'Send to the shop', ta: 'கடைக்கு அனுப்பு' },
  correctThisLine: { en: 'Correct this line', ta: 'இதைச் சரிசெய்' },
  addSomethingElse: { en: 'Add something else', ta: 'வேறு ஏதாவது சேர்' },
  payOnDelivery: { en: 'Pay cash on delivery', ta: 'டெலிவரியில் பணம் செலுத்துங்கள்' },
  editItems: { en: 'Edit items', ta: 'பொருட்களை மாற்று' },
  selected: { en: 'selected', ta: 'தேர்ந்தெடுக்கப்பட்டது' },

  // --- verification ------------------------------------------------------
  verify: { en: 'VERIFY', ta: 'சரிபார்க்கவும்' },
  unclear: { en: 'handwriting unclear', ta: 'கையெழுத்து தெளிவாக இல்லை' },
  needsPharmacist: { en: 'Pharmacist confirms the flagged item before dispatch.', ta: 'மருந்தாளர் உறுதிப்படுத்திய பின்பே அனுப்பப்படும்.' },

  // --- vendor ------------------------------------------------------------
  newRequest: { en: 'New request', ta: 'புதிய கோரிக்கை' },
  inProgress: { en: 'In progress', ta: 'நடப்பில் உள்ளவை' },
  accept: { en: 'Accept', ta: 'ஏற்றுக்கொள்' },
  reject: { en: 'Reject', ta: 'நிராகரி' },
  packItems: { en: 'Pack items', ta: 'பொருட்களை எடுக்கவும்' },
  markReady: { en: 'Mark ready for pickup', ta: 'டெலிவரிக்கு தயார்' },
  pharmacistConfirmation: { en: 'Pharmacist confirmation', ta: 'மருந்தாளர் உறுதிப்படுத்தல்' },
  thatsCorrect: { en: "Yes, that's correct", ta: 'ஆம், சரி' },
  differentMedicine: { en: 'Different medicine', ta: 'வேறு மருந்து' },
  notAvailable: { en: 'Not available', ta: 'கையிருப்பில் இல்லை' },
  available: { en: 'Available', ta: 'உள்ளது' },
  storeOpen: { en: 'OPEN', ta: 'திறந்துள்ளது' },
  storeClosed: { en: 'CLOSED', ta: 'மூடப்பட்டுள்ளது' },
  today: { en: 'Today', ta: 'இன்று' },
  orders: { en: 'Orders', ta: 'ஆர்டர்கள்' },
  avgPrep: { en: 'Avg prep', ta: 'சராசரி நேரம்' },

  // --- rider -------------------------------------------------------------
  prepaid: { en: 'PRE-PAID', ta: 'முன்பணம் செலுத்தப்பட்டது' },
  cod: { en: 'CASH ON DELIVERY', ta: 'பணம் வசூலிக்க வேண்டும்' },
  drop: { en: 'DROP', ta: 'இறக்குமிடம்' },
  pickup: { en: 'PICKUP', ta: 'எடுக்குமிடம்' },
  arrivedAtStore: { en: 'Arrived at store', ta: 'கடையை அடைந்தேன்' },
  pickedUp: { en: 'Picked up', ta: 'பொருள் எடுத்தாயிற்று' },
  outForDelivery: { en: 'Out for delivery', ta: 'டெலிவரிக்கு புறப்பட்டேன்' },
  markDelivered: { en: 'Delivered', ta: 'வழங்கப்பட்டது' },
  collectCash: { en: 'COLLECT CASH', ta: 'பணம் வாங்கவும்' },
  cashCollected: { en: 'Cash collected', ta: 'பணம் வாங்கியாயிற்று' },
  paidByUpi: { en: 'Customer paid by UPI instead', ta: 'UPI மூலம் பணம் செலுத்தினார்' },
  nothingToCollect: { en: 'Nothing to collect', ta: 'வசூலிக்க எதுவும் இல்லை' },
  exactChange: { en: 'Exact change preferred', ta: 'சில்லறை கொடுக்கவும்' },
  deliveryOtp: { en: 'Delivery OTP', ta: 'வாடிக்கையாளரிடம் கேளுங்கள்' },
  youveArrived: { en: "You've arrived", ta: 'நீங்கள் வந்துவிட்டீர்கள்' },
  reportProblem: { en: 'Report a problem', ta: 'பிரச்சனையை தெரிவிக்கவும்' },
  goOnline: { en: 'Go online', ta: 'வேலைக்கு தயார்' },
  goOffline: { en: 'Go offline', ta: 'ஓய்வு' },
  noTasks: { en: 'No tasks right now', ta: 'இப்போது வேலை இல்லை' },

  // --- admin -------------------------------------------------------------
  commandCenter: { en: 'Command Center', ta: 'கட்டளை மையம்' },
  searchPlaceholder: { en: 'Search order, phone, store…', ta: 'தேடுங்கள்' },
  manualOrder: { en: 'Manual order', ta: 'கைமுறை ஆர்டர்' },
  comfortable: { en: 'Comfortable', ta: 'விரிவாக' },
  dense: { en: 'Dense', ta: 'சுருக்கமாக' },
  live: { en: 'live', ta: 'நடப்பில்' },
  adhocConcierge: { en: 'Ad-hoc Concierge', ta: 'சிறப்பு பணி' },
  originalRequest: { en: 'ORIGINAL REQUEST', ta: 'அசல் கோரிக்கை' },
  stopsAvailability: { en: 'STOPS & AVAILABILITY', ta: 'கடையில் உள்ளதா?' },
  deliveryFee: { en: 'DELIVERY FEE', ta: 'டெலிவரி கட்டணம்' },
  sendToCustomer: { en: 'Send price to customer', ta: 'விலையை அனுப்பு' },
  callCustomer: { en: 'Call customer', ta: 'வாடிக்கையாளரை அழைக்கவும்' },
  assignRider: { en: 'Assign rider', ta: 'டெலிவரி நபரை நியமி' },
  noOrders: { en: 'Nothing here', ta: 'எதுவும் இல்லை' },

  // --- account & settings -------------------------------------------------
  account: { en: 'Account', ta: 'கணக்கு' },
  profile: { en: 'Profile', ta: 'சுயவிவரம்' },
  myOrders: { en: 'My orders', ta: 'என் ஆர்டர்கள்' },
  savedAddresses: { en: 'Saved addresses', ta: 'சேமித்த முகவரிகள்' },
  addAddress: { en: 'Add an address', ta: 'முகவரி சேர்க்கவும்' },
  language: { en: 'Language', ta: 'மொழி' },
  notifications: { en: 'Notifications', ta: 'அறிவிப்புகள்' },
  paymentMethods: { en: 'Payment methods', ta: 'பணம் செலுத்தும் முறைகள்' },
  helpSupport: { en: 'Help & support', ta: 'உதவி' },
  legalPolicies: { en: 'Legal', ta: 'சட்ட ஆவணங்கள்' },
  privacyPolicy: { en: 'Privacy policy', ta: 'தனியுரிமைக் கொள்கை' },
  termsOfService: { en: 'Terms of service', ta: 'சேவை விதிமுறைகள்' },
  refundPolicy: { en: 'Refunds & cancellations', ta: 'பணத்திரும்பல் & ரத்து' },
  deleteAccount: { en: 'Delete account', ta: 'கணக்கை நீக்கவும்' },
  signOut: { en: 'Sign out', ta: 'வெளியேறு' },
  home: { en: 'Home', ta: 'வீடு' },
  work: { en: 'Work', ta: 'அலுவலகம்' },
  other: { en: 'Other', ta: 'மற்றவை' },
  setDefault: { en: 'Set as default', ta: 'இயல்பாக அமைக்கவும்' },
  save: { en: 'Save', ta: 'சேமி' },
  edit: { en: 'Edit', ta: 'திருத்து' },
  remove: { en: 'Remove', ta: 'நீக்கு' },
  callUs: { en: 'Call us', ta: 'எங்களை அழைக்கவும்' },
  whatsapp: { en: 'WhatsApp', ta: 'வாட்ஸ்அப்' },
  faq: { en: 'Common questions', ta: 'பொதுவான கேள்விகள்' },
  reorder: { en: 'Order again', ta: 'மீண்டும் ஆர்டர்' },
  noOrdersYet: { en: 'No orders yet', ta: 'இதுவரை ஆர்டர் இல்லை' },
  version: { en: 'Version', ta: 'பதிப்பு' },

  // --- language picker ----------------------------------------------------
  langEnglish: { en: 'English', ta: 'ஆங்கிலம்' },
  langTamil: { en: 'Tamil', ta: 'தமிழ்' },
  langBoth: { en: 'English + Tamil', ta: 'ஆங்கிலம் + தமிழ்' },
  langBothHint: { en: 'Tamil shown under English', ta: 'ஆங்கிலத்தின் கீழ் தமிழ்' },

  // --- notification prefs -------------------------------------------------
  notifyOrderUpdates: { en: 'Order updates', ta: 'ஆர்டர் நிலை' },
  notifyOrderUpdatesHint: { en: 'When your order is accepted, packed and on the way', ta: 'ஆர்டர் நிலை மாறும்போது' },
  notifyOffers: { en: 'Offers near you', ta: 'சலுகைகள்' },
  notifyOffersHint: { en: 'Free delivery hours and discounts in your locality', ta: 'உங்கள் பகுதியில் உள்ள சலுகைகள்' },
  notifySms: { en: 'SMS fallback', ta: 'SMS' },
  notifySmsHint: { en: 'Texts when the app cannot reach you', ta: 'செயலி இணைப்பு இல்லாதபோது' },

  // --- deletion -----------------------------------------------------------
  deleteWarning: { en: 'This cannot be undone', ta: 'இதை மாற்ற முடியாது' },
  deleteConfirmPhrase: { en: 'Type DELETE to confirm', ta: 'உறுதிப்படுத்த DELETE என தட்டச்சு செய்யவும்' },
  deleteForever: { en: 'Delete my account forever', ta: 'கணக்கை நிரந்தரமாக நீக்கு' },

  // --- generic -----------------------------------------------------------
  retry: { en: 'Try again', ta: 'மீண்டும் முயற்சி' },
  cancel: { en: 'Cancel', ta: 'ரத்து' },
  somethingWentWrong: { en: 'Something went wrong', ta: 'ஏதோ தவறாகிவிட்டது' },
  offline: { en: 'You are offline', ta: 'இணைப்பு இல்லை' },
} as const satisfies Record<string, Bi>;

export type CopyKey = keyof typeof COPY;

/** `t('total')` -> `{ en: 'Total', ta: 'மொத்தம்' }` */
export const t = (key: CopyKey): Bi => COPY[key];

/** English only, for places with no room for a second line (dense tables). */
export const en = (key: CopyKey): string => COPY[key].en;
export const ta = (key: CopyKey): string => COPY[key].ta;

import type { Category } from './types';

export const CATEGORY_LABEL: Record<Category, Bi> = {
  pharmacy: COPY.pharmacy,
  grocery: COPY.grocery,
  food: COPY.food,
  concierge: COPY.concierge,
  print: { en: 'Print & Xerox', ta: 'அச்சு & செராக்ஸ்' },
  pickup_drop: { en: 'Pickup & Drop', ta: 'பிக்அப் & டிராப்' },
  buy_deliver: { en: 'Buy & Deliver', ta: 'வாங்கி கொடு' },
};

/** Two-letter code used by the dense board. */
export const CATEGORY_CODE: Record<Category, string> = {
  pharmacy: 'RX',
  grocery: 'GR',
  food: 'FD',
  concierge: 'CN',
  print: 'PX',
  pickup_drop: 'PD',
  buy_deliver: 'BD',
};
