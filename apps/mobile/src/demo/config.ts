/**
 * DFC Demo Mode Configuration
 *
 * When DEMO_MODE is true, the mobile application runs completely on local mock
 * repositories and AsyncStorage without requiring Firebase Auth, Firestore,
 * Storage, FCM, Google Maps, or external AI APIs.
 */

export const DEMO_MODE = true;

export const DEMO_CONFIG = {
  defaultLocalityId: 'anna-nagar',
  defaultCustomer: {
    uid: 'demo-customer-arun',
    name: 'Arun Kumar',
    phone: '+919876543210',
    email: 'customer@dfc.test',
    localityId: 'anna-nagar',
    role: 'customer' as const,
  },
  demoOtp: '123456',
  captain: {
    name: 'Arun K.',
    phone: '+919876500004',
    rating: 4.8,
    vehicle: 'Honda Activa (TN-58-AB-2026)',
    photo: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
    currentLat: 9.9312,
    currentLng: 78.1256,
  },
  platformFeePaise: 500, // ₹5.00
  deliveryBasePaise: 2500, // ₹25.00
  deliveryPerKmPaise: 800, // ₹8.00/km
  gstPercent: 18,
};
