/**
 * Mock Menu Repository
 *
 * Implements dynamic menu management: Add, Edit, Delete, and ON/OFF availability toggle.
 * Used by Vendor and Admin to manage catalogues and by Customer to validate cart items.
 */

import type { MenuItem } from '../types';

const now = Date.now();

const INITIAL_MENU_ITEMS: MenuItem[] = [
  {
    id: 'it-biryani-chicken',
    vendorId: 'rest-amma-mess',
    name: 'Chicken Biryani',
    nameTa: 'சிக்கன் பிரியாணி',
    description: 'Authentic Madurai style Seeraga Samba chicken biryani served with raita & salna.',
    price: 180,
    pricePaise: 18000,
    category: 'Main Course',
    isVeg: false,
    isPopular: true,
    isAvailable: true, // ON/OFF control
    createdAt: now - 30 * 24 * 60 * 60 * 1000,
    updatedAt: now - 1 * 60 * 60 * 1000,
  },
  {
    id: 'it-biryani-mutton',
    vendorId: 'rest-amma-mess',
    name: 'Special Mutton Seeraga Samba Biryani',
    nameTa: 'மட்டன் சீரக சம்பா பிரியாணி',
    description: 'Tender mutton pieces infused with Madurai aromatic spices and seeraga samba rice.',
    price: 320,
    pricePaise: 32000,
    category: 'Main Course',
    isVeg: false,
    isPopular: true,
    isAvailable: true,
    createdAt: now - 30 * 24 * 60 * 60 * 1000,
    updatedAt: now - 2 * 60 * 60 * 1000,
  },
  {
    id: 'it-bone-marrow',
    vendorId: 'rest-amma-mess',
    name: 'Bone Marrow Omelette',
    nameTa: 'எலும்பு மஜ்ஜை ஆம்லெட்',
    description: 'World-famous Madurai Amma Mess specialty omelette stuffed with rich mutton bone marrow.',
    price: 160,
    pricePaise: 16000,
    category: 'Starters',
    isVeg: false,
    isPopular: true,
    isAvailable: true,
    createdAt: now - 20 * 24 * 60 * 60 * 1000,
    updatedAt: now - 4 * 60 * 60 * 1000,
  },
  {
    id: 'it-kari-dosa',
    vendorId: 'rest-amma-mess',
    name: 'Madurai Kari Dosa (Mutton)',
    nameTa: 'மதுரை காரி தோசை',
    description: 'Thick three-layer dosa layered with egg omelette and spicy minced mutton sukka.',
    price: 210,
    pricePaise: 21000,
    category: 'Tiffin',
    isVeg: false,
    isPopular: true,
    isAvailable: true,
    createdAt: now - 15 * 24 * 60 * 60 * 1000,
    updatedAt: now - 5 * 60 * 60 * 1000,
  },
  {
    id: 'it-parotta',
    vendorId: 'rest-amma-mess',
    name: 'Fluffy Parotta (2 pcs) with Salna',
    nameTa: 'பரோட்டா (2) சால்னாவுடன்',
    description: 'Flaky layered Malabar-Madurai parottas served with rich chalna gravy.',
    price: 60,
    pricePaise: 6000,
    category: 'Breads',
    isVeg: false,
    isPopular: false,
    isAvailable: true,
    createdAt: now - 10 * 24 * 60 * 60 * 1000,
    updatedAt: now - 2 * 60 * 60 * 1000,
  },
  {
    id: 'it-veg-meals',
    vendorId: 'rest-amma-mess',
    name: 'Special Madurai Veg Meals',
    nameTa: 'சைவ சாப்பாடு',
    description: 'Steaming ponni rice with Sambar, Rasam, Vatha Kuzhambu, Poriyal, Kootu, and Appalam.',
    price: 140,
    pricePaise: 14000,
    category: 'Main Course',
    isVeg: true,
    isPopular: false,
    isAvailable: true,
    createdAt: now - 10 * 24 * 60 * 60 * 1000,
    updatedAt: now - 1 * 60 * 60 * 1000,
  },
  {
    id: 'it-jigarthanda',
    vendorId: 'rest-amma-mess',
    name: 'Famous Famous Jigarthanda',
    nameTa: 'ஜிகர்தண்டா',
    description: 'Chilled authentic Madurai dessert drink with almond gum, nannari syrup, and basundi ice cream.',
    price: 80,
    pricePaise: 8000,
    category: 'Dessert',
    isVeg: true,
    isPopular: true,
    isAvailable: true,
    createdAt: now - 10 * 24 * 60 * 60 * 1000,
    updatedAt: now - 1 * 60 * 60 * 1000,
  },
];

let memMenu: MenuItem[] = [...INITIAL_MENU_ITEMS];

const listeners: Array<() => void> = [];
const notify = () => listeners.forEach((fn) => fn());

export const mockMenuRepository = {
  subscribe(fn: () => void): () => void {
    listeners.push(fn);
    return () => {
      const idx = listeners.indexOf(fn);
      if (idx >= 0) listeners.splice(idx, 1);
    };
  },

  getAllItems(): MenuItem[] {
    return [...memMenu];
  },

  getMenuByVendor(vendorId: string): MenuItem[] {
    return memMenu.filter((item) => !item.vendorId || item.vendorId === vendorId);
  },

  getItemById(id: string): MenuItem | null {
    return memMenu.find((item) => item.id === id) ?? null;
  },

  isItemAvailable(id: string): boolean {
    const item = memMenu.find((i) => i.id === id);
    return item ? item.isAvailable !== false : true;
  },

  addItem(
    item: Omit<MenuItem, 'id' | 'createdAt' | 'updatedAt' | 'pricePaise'> & {
      pricePaise?: number;
    },
  ): MenuItem {
    const newItem: MenuItem = {
      ...item,
      id: `it_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      pricePaise: item.pricePaise || (item.price ? item.price * 100 : 0),
      isAvailable: item.isAvailable ?? true,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    memMenu = [newItem, ...memMenu];
    notify();
    return newItem;
  },

  updateItem(id: string, updates: Partial<MenuItem>): MenuItem | null {
    const idx = memMenu.findIndex((i) => i.id === id);
    if (idx < 0) return null;
    const existing = memMenu[idx]!;
    const updated: MenuItem = {
      ...existing,
      ...updates,
      pricePaise: updates.price ? updates.price * 100 : (updates.pricePaise || existing.pricePaise),
      updatedAt: Date.now(),
    };
    memMenu[idx] = updated;
    notify();
    return updated;
  },

  deleteItem(id: string): boolean {
    const initialLen = memMenu.length;
    memMenu = memMenu.filter((i) => i.id !== id);
    const deleted = memMenu.length < initialLen;
    if (deleted) notify();
    return deleted;
  },

  toggleItemAvailability(id: string, explicitAvailability?: boolean): MenuItem | null {
    const item = memMenu.find((i) => i.id === id);
    if (!item) return null;
    item.isAvailable = explicitAvailability !== undefined ? explicitAvailability : !item.isAvailable;
    item.updatedAt = Date.now();
    notify();
    return item;
  },
};
