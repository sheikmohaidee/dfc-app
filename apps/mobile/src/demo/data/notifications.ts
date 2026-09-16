/**
 * Notifications Data for Demo
 */

import type { DemoNotification } from '../types';

const now = Date.now();

export const SEED_NOTIFICATIONS: DemoNotification[] = [
  {
    id: 'notif-1',
    title: 'Order Out for Delivery! 🚴',
    titleTa: 'ஆர்டர் டெலிவரிக்கு வந்து கொண்டிருக்கிறது!',
    message: 'Captain Arun is on his way to Sri Meenakshi Enclave with your Amma Mess order (#1047). OTP: 4829.',
    timestamp: now - 5 * 60 * 1000,
    read: false,
    orderId: 'ord-demo-live-1047',
    type: 'order',
  },
  {
    id: 'notif-2',
    title: 'Amma Mess Accepted Order #1047 🍳',
    titleTa: 'அம்மா மெஸ் ஆர்டரை உறுதி செய்தது',
    message: 'Your Biryani and Omelette are being freshly prepared in the kitchen.',
    timestamp: now - 16 * 60 * 1000,
    read: true,
    orderId: 'ord-demo-live-1047',
    type: 'order',
  },
  {
    id: 'notif-3',
    title: 'Flat ₹50 OFF on Madurai Messes 🎉',
    titleTa: 'மதுரை மெஸ் உணவுகளுக்கு ₹50 தள்ளுபடி',
    message: 'Use coupon DFC50 on orders above ₹299. Valid today across Anna Nagar & Simmakkal.',
    timestamp: now - 3 * 3600 * 1000,
    read: true,
    type: 'promo',
  },
  {
    id: 'notif-4',
    title: 'Prescription Order Delivered ✅',
    titleTa: 'மருந்து ஆர்டர் டெலிவரி செய்யப்பட்டது',
    message: 'Order #1024 from Meenakshi Medicals was delivered successfully.',
    timestamp: now - 86_400_000,
    read: true,
    orderId: 'ord-demo-past-1024',
    type: 'order',
  },
];
