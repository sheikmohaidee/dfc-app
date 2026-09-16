/**
 * Mock Grocery Repository for Demo Mode
 */

import { DEMO_GROCERY_PRODUCTS, DEMO_GROCERY_STORES } from '../data/groceries';
import type { GroceryProduct, GroceryStore } from '../types';

export const mockGroceryRepository = {
  getStores(): GroceryStore[] {
    return DEMO_GROCERY_STORES;
  },

  getAllProducts(): GroceryProduct[] {
    return DEMO_GROCERY_PRODUCTS;
  },

  getByCategory(category: string): GroceryProduct[] {
    if (!category || category === 'All') return DEMO_GROCERY_PRODUCTS;
    return DEMO_GROCERY_PRODUCTS.filter((p) => p.category === category);
  },

  search(query: string): GroceryProduct[] {
    const q = query.trim().toLowerCase();
    if (!q) return DEMO_GROCERY_PRODUCTS;
    return DEMO_GROCERY_PRODUCTS.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        p.storeName.toLowerCase().includes(q),
    );
  },
};
