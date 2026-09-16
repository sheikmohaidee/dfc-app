/**
 * Grocery Stores & Products Data for Demo
 */

import type { GroceryProduct, GroceryStore } from '../types';

export const DEMO_GROCERY_STORES: GroceryStore[] = [
  {
    id: 'store-amma-mart',
    name: 'Amma Mini Mart',
    nameTa: 'அம்மா மினி மார்ட்',
    localityId: 'kk-nagar',
    localityName: 'K.K. Nagar',
    rating: 4.8,
    deliveryMinutes: 15,
    isOpen: true,
  },
  {
    id: 'store-balaji',
    name: 'Sri Balaji Stores',
    nameTa: 'ஸ்ரீ பாலாஜி ஸ்டோர்ஸ்',
    localityId: 'thirunagar',
    localityName: 'Thirunagar',
    rating: 4.7,
    deliveryMinutes: 20,
    isOpen: true,
  },
  {
    id: 'store-flower-market',
    name: 'Simmakkal Flower Market',
    nameTa: 'சிம்மக்கல் பூ மார்க்கெட்',
    localityId: 'simmakkal',
    localityName: 'Simmakkal',
    rating: 4.9,
    deliveryMinutes: 15,
    isOpen: true,
  },
  {
    id: 'store-nilgiris',
    name: 'Nilgiris Supermarket',
    nameTa: 'நீலகிரீஸ் சூப்பர் மார்க்கெட்',
    localityId: 'anna-nagar',
    localityName: 'Anna Nagar',
    rating: 4.8,
    deliveryMinutes: 15,
    isOpen: true,
  },
];

export const DEMO_GROCERY_PRODUCTS: GroceryProduct[] = [
  {
    id: 'groc-1',
    name: 'Aavin Green Magic Milk (500ml)',
    nameTa: 'ஆவின் பசும்பால்',
    category: 'Dairy & Eggs',
    unit: '500 ml pouch',
    mrpPaise: 2400,
    sellPaise: 2400, // ₹24.00
    storeId: 'store-amma-mart',
    storeName: 'Amma Mini Mart',
    inStock: true,
  },
  {
    id: 'groc-2',
    name: 'Ponni Boiled Rice (5 kg)',
    nameTa: 'பொன்னி புழுங்கல் அரிசி (5 கிலோ)',
    category: 'Staples & Rice',
    unit: '5 kg bag',
    mrpPaise: 38000,
    sellPaise: 34000, // ₹340.00
    storeId: 'store-amma-mart',
    storeName: 'Amma Mini Mart',
    inStock: true,
  },
  {
    id: 'groc-3',
    name: 'Gold Winner Refined Sunflower Oil (1L)',
    nameTa: 'சூரியகாந்தி எண்ணெய் (1 லிட்டர்)',
    category: 'Oils & Ghee',
    unit: '1 litre pouch',
    mrpPaise: 15500,
    sellPaise: 13800, // ₹138.00
    storeId: 'store-amma-mart',
    storeName: 'Amma Mini Mart',
    inStock: true,
  },
  {
    id: 'groc-4',
    name: 'Madurai Malligai Poo (2 Muzham)',
    nameTa: 'மதுரை மல்லிகைப் பூ (2 முழம்)',
    category: 'Flowers & Puja',
    unit: '2 muzham fresh garland',
    mrpPaise: 7000,
    sellPaise: 6000, // ₹60.00
    storeId: 'store-flower-market',
    storeName: 'Simmakkal Flower Market',
    inStock: true,
  },
  {
    id: 'groc-5',
    name: 'Unpolished Toor Dal (1 kg)',
    nameTa: 'துவரம் பருப்பு (1 கிலோ)',
    category: 'Staples & Rice',
    unit: '1 kg pack',
    mrpPaise: 16500,
    sellPaise: 14800, // ₹148.00
    storeId: 'store-nilgiris',
    storeName: 'Nilgiris Supermarket',
    inStock: true,
  },
  {
    id: 'groc-6',
    name: 'Fresh Country Eggs (6 pcs)',
    nameTa: 'நாட்டுக்கோழி முட்டை (6)',
    category: 'Dairy & Eggs',
    unit: 'pack of 6 eggs',
    mrpPaise: 6500,
    sellPaise: 5800, // ₹58.00
    storeId: 'store-amma-mart',
    storeName: 'Amma Mini Mart',
    inStock: true,
  },
  {
    id: 'groc-7',
    name: 'Madurai Round Gundu Chilli (250g)',
    nameTa: 'மதுரை குண்டு மிளகாய்',
    category: 'Spices',
    unit: '250 g pack',
    mrpPaise: 5500,
    sellPaise: 4800, // ₹48.00
    storeId: 'store-balaji',
    storeName: 'Sri Balaji Stores',
    inStock: true,
  },
  {
    id: 'groc-8',
    name: 'Aashirvaad Shudh Chakki Atta (5kg)',
    nameTa: 'ஆசிர்வாத் கோதுமை மாவு',
    category: 'Staples & Rice',
    unit: '5 kg bag',
    mrpPaise: 29500,
    sellPaise: 26500, // ₹265.00
    storeId: 'store-nilgiris',
    storeName: 'Nilgiris Supermarket',
    inStock: true,
  },
  {
    id: 'groc-9',
    name: 'GRB Pure Cow Ghee (200ml)',
    nameTa: 'ஜி.ஆர்.பி சுத்தமான பசு நெய்',
    category: 'Oils & Ghee',
    unit: '200 ml jar',
    mrpPaise: 18500,
    sellPaise: 16800, // ₹168.00
    storeId: 'store-amma-mart',
    storeName: 'Amma Mini Mart',
    inStock: true,
  },
];
