/**
 * Ingredient-Level Bill of Materials (BOM) Cascading Stock Engine.
 *
 * Maps base ingredients to finished dishes. When a merchant flags an ingredient
 * (e.g., "Parotta Dough" or "Basundi Cream") as out of stock, the engine
 * automatically cascades the unavailability to all linked menu items.
 */

import type { Product } from './catalogue';

export interface Ingredient {
  id: string;
  storeId: string;
  name: string;
  nameTa: string;
  unit: string;
  inStock: boolean;
  linkedProductIds: string[];
  updatedAt: number;
}

export interface BomCascadeResult {
  toggledIngredientId: string;
  ingredientName: string;
  newStockState: boolean;
  affectedProductIds: string[];
  affectedProductNames: string[];
  updatedProducts: Product[];
}

/**
 * Seed Ingredients for Madurai Partner Kitchens.
 */
export const SEED_INGREDIENTS: Ingredient[] = [
  {
    id: 'ing_parotta_dough',
    storeId: 'simmakkal-konar-mess',
    name: 'Special Parotta Dough',
    nameTa: 'பரோட்டா மாவு',
    unit: 'kg',
    inStock: true,
    linkedProductIds: ['prod-bun-parotta', 'prod-kothu-parotta', 'prod-egg-parotta', 'prod-ceylon-parotta'],
    updatedAt: Date.now(),
  },
  {
    id: 'ing_mutton_kari',
    storeId: 'simmakkal-konar-mess',
    name: 'Tender Mutton Kari Gravy',
    nameTa: 'மட்டன் கறி மசாலா',
    unit: 'kg',
    inStock: true,
    linkedProductIds: ['prod-mutton-kari-dosa', 'prod-mutton-chukka', 'prod-kothu-parotta'],
    updatedAt: Date.now(),
  },
  {
    id: 'ing_basundi_milk',
    storeId: 'famous-jigarthanda',
    name: 'Caramelized Basundi Buffalo Milk',
    nameTa: 'பாசுந்தி பால்',
    unit: 'litres',
    inStock: true,
    linkedProductIds: ['prod-jigarthanda-special', 'prod-basundi-cup', 'prod-jigarthanda-royal'],
    updatedAt: Date.now(),
  },
  {
    id: 'ing_idli_batter',
    storeId: 'murugan-idli-shop',
    name: 'Stone-ground Idli Batter',
    nameTa: 'இட்லி மாவு',
    unit: 'kg',
    inStock: true,
    linkedProductIds: ['prod-ghee-podi-idli', 'prod-plain-idli', 'prod-mini-ghee-idli'],
    updatedAt: Date.now(),
  },
];

/**
 * Toggles an ingredient's stock status and calculates the cascading impact on products.
 */
export function toggleIngredientStock(
  ingredient: Ingredient,
  inStock: boolean,
  currentProducts: Product[],
  now = Date.now(),
): BomCascadeResult {
  const affectedIds = new Set(ingredient.linkedProductIds);
  const affectedNames: string[] = [];

  const updatedProducts = currentProducts.map((prod) => {
    if (affectedIds.has(prod.id)) {
      affectedNames.push(prod.name);
      return {
        ...prod,
        // If ingredient is out of stock, product MUST be inactive.
        // If ingredient is restored, enable it.
        isActive: inStock,
        updatedAt: now,
      };
    }
    return prod;
  });

  return {
    toggledIngredientId: ingredient.id,
    ingredientName: ingredient.name,
    newStockState: inStock,
    affectedProductIds: Array.from(affectedIds),
    affectedProductNames: affectedNames,
    updatedProducts,
  };
}
