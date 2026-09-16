/**
 * Mock Location Repository for Demo Mode
 */

import { DEMO_LOCALITIES, type DemoLocality, getLocality } from '../data/localities';
import { demoStorage } from '../storage';
import { routeKm } from '@dfc/core';

export const mockLocationRepository = {
  getAllLocalities(): DemoLocality[] {
    return DEMO_LOCALITIES;
  },

  getCurrentLocality(): DemoLocality {
    const id = demoStorage.getLocalityId();
    return getLocality(id);
  },

  async setLocality(localityId: string): Promise<DemoLocality> {
    await demoStorage.setLocalityId(localityId);
    return getLocality(localityId);
  },

  getDistanceKm(fromLocalityId: string, toLocalityId: string): number {
    return routeKm(fromLocalityId, toLocalityId);
  },

  calculateDeliveryFee(fromLocalityId: string, toLocalityId: string): number {
    const km = routeKm(fromLocalityId, toLocalityId);
    return 2000 + Math.round(km * 500); // Base ₹20 + ₹5/km
  },
};
