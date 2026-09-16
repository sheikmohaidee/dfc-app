/**
 * Mock Profile & Address Repository for Demo Mode
 */

import { demoStorage } from '../storage';
import type { SavedAddress } from '../types';

export const mockProfileRepository = {
  getAddresses(): SavedAddress[] {
    return demoStorage.getAddresses();
  },

  async addAddress(addr: Omit<SavedAddress, 'id'>): Promise<SavedAddress> {
    const list = demoStorage.getAddresses();
    const id = `addr-${Date.now()}`;
    const newAddr: SavedAddress = { ...addr, id };

    let updated = [...list, newAddr];
    if (newAddr.isDefault) {
      updated = updated.map((a) => ({ ...a, isDefault: a.id === id }));
    }
    await demoStorage.saveAddresses(updated);
    return newAddr;
  },

  async updateAddress(id: string, patch: Partial<SavedAddress>): Promise<SavedAddress | null> {
    const list = demoStorage.getAddresses();
    const idx = list.findIndex((a) => a.id === id);
    if (idx < 0) return null;

    const updatedItem = { ...list[idx]!, ...patch };
    let updatedList = [...list];
    updatedList[idx] = updatedItem;

    if (patch.isDefault) {
      updatedList = updatedList.map((a) => ({ ...a, isDefault: a.id === id }));
    }
    await demoStorage.saveAddresses(updatedList);
    return updatedItem;
  },

  async deleteAddress(id: string): Promise<void> {
    const list = demoStorage.getAddresses();
    const updated = list.filter((a) => a.id !== id);
    if (updated.length > 0 && !updated.some((a) => a.isDefault)) {
      updated[0]!.isDefault = true;
    }
    await demoStorage.saveAddresses(updated);
  },

  async setDefaultAddress(id: string): Promise<void> {
    const list = demoStorage.getAddresses();
    const updated = list.map((a) => ({ ...a, isDefault: a.id === id }));
    await demoStorage.saveAddresses(updated);
  },

  async resetAllDemoData(): Promise<void> {
    await demoStorage.resetDemoData();
  },
};
