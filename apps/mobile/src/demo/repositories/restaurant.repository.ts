/**
 * Mock Restaurant & Food Repository for Demo Mode
 */

import { DEMO_RESTAURANTS } from '../data/restaurants';
import type { MenuItem, Restaurant } from '../types';
import { demoStorage } from '../storage';
import { routeKm } from '@dfc/core';

export const mockRestaurantRepository = {
  getAll(): Restaurant[] {
    return DEMO_RESTAURANTS;
  },

  getForCurrentLocality(isVegOnly: boolean = false): Array<Restaurant & { distanceKm: number }> {
    const currentLocId = demoStorage.getLocalityId();
    return DEMO_RESTAURANTS
      .filter((r) => !isVegOnly || r.isPureVeg)
      .map((r) => {
        const km = routeKm(r.localityId, currentLocId);
        return {
          ...r,
          distanceKm: km,
          deliveryFeePaise: 2000 + Math.round(km * 400),
        };
      })
      .sort((a, b) => a.distanceKm - b.distanceKm);
  },

  getById(id: string): (Restaurant & { distanceKm: number }) | null {
    const r = DEMO_RESTAURANTS.find((x) => x.id === id);
    if (!r) return null;
    const currentLocId = demoStorage.getLocalityId();
    const km = routeKm(r.localityId, currentLocId);
    return {
      ...r,
      distanceKm: km,
      deliveryFeePaise: 2000 + Math.round(km * 400),
    };
  },

  search(query: string): {
    restaurants: Array<Restaurant & { distanceKm: number }>;
    dishes: Array<MenuItem & { restaurantId: string; restaurantName: string; pricePaise: number }>;
  } {
    const q = query.trim().toLowerCase();
    if (!q) return { restaurants: [], dishes: [] };

    const currentLocId = demoStorage.getLocalityId();

    const matchedRestaurants = DEMO_RESTAURANTS.filter(
      (r) =>
        r.name.toLowerCase().includes(q) ||
        r.cuisines.some((c) => c.toLowerCase().includes(q)) ||
        r.localityName.toLowerCase().includes(q) ||
        r.featuredDish.toLowerCase().includes(q),
    ).map((r) => ({
      ...r,
      distanceKm: routeKm(r.localityId, currentLocId),
    }));

    const matchedDishes: Array<
      MenuItem & { restaurantId: string; restaurantName: string; pricePaise: number }
    > = [];

    DEMO_RESTAURANTS.forEach((r) => {
      r.menu.forEach((item) => {
        if (
          item.name.toLowerCase().includes(q) ||
          item.description?.toLowerCase().includes(q) ||
          item.category.toLowerCase().includes(q)
        ) {
          matchedDishes.push({
            ...item,
            restaurantId: r.id,
            restaurantName: r.name,
            pricePaise: item.pricePaise,
          });
        }
      });
    });

    return {
      restaurants: matchedRestaurants,
      dishes: matchedDishes,
    };
  },
};
