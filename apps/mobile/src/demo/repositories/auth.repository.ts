/**
 * Mock Auth Repository for Demo Mode
 */

import type { Role, UserProfile } from '@dfc/core';
import { DEMO_CONFIG } from '../config';
import { demoStorage } from '../storage';

export interface DemoUserSession {
  uid: string;
  email: string;
  phoneNumber?: string;
  displayName: string;
  role: Role;
}

export const mockAuthRepository = {
  getCurrentUser(): DemoUserSession | null {
    const p = demoStorage.getUser();
    if (!p) return null;
    return {
      uid: p.uid,
      email: `${p.role}@dfc.test`,
      phoneNumber: p.phone,
      displayName: p.name,
      role: p.role,
    };
  },

  getProfile(): UserProfile | null {
    return demoStorage.getUser();
  },

  async loginWithPhone(phone: string, otp: string): Promise<UserProfile> {
    if (otp !== DEMO_CONFIG.demoOtp && otp !== '123456' && otp.length === 6) {
      // In demo mode, accept standard 6-digit OTP or default 123456
    }
    const cleanPhone = phone.startsWith('+91') ? phone : `+91${phone.replace(/\D/g, '')}`;
    const user: UserProfile = {
      uid: 'demo-customer-arun',
      name: 'Arun Kumar',
      phone: cleanPhone,
      localityId: demoStorage.getLocalityId() || 'anna-nagar',
      role: 'customer',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    await demoStorage.setUser(user);
    return user;
  },

  async loginWithStaff(email: string, _pass: string): Promise<UserProfile> {
    const e = email.trim().toLowerCase();
    const role: Role = e.includes('admin')
      ? 'admin'
      : e.includes('vendor')
        ? 'vendor'
        : e.includes('rider')
          ? 'rider'
          : 'customer';

    const names: Record<Role, string> = {
      customer: 'Arun Kumar',
      admin: 'Sundar Operations',
      vendor: 'Meenakshi Medicals Admin',
      rider: 'Arun Captain',
    };

    const user: UserProfile = {
      uid: `demo-${role}-${Date.now().toString(36)}`,
      name: names[role],
      phone: '+919876543210',
      localityId: demoStorage.getLocalityId() || 'anna-nagar',
      role,
      storeId: role === 'vendor' ? 'pharm-meenakshi' : undefined,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    await demoStorage.setUser(user);
    return user;
  },

  async updateProfile(patch: Partial<UserProfile>): Promise<UserProfile> {
    const current = demoStorage.getUser() ?? {
      ...DEMO_CONFIG.defaultCustomer,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    const updated: UserProfile = {
      ...current,
      ...patch,
      updatedAt: Date.now(),
    };
    await demoStorage.setUser(updated);
    return updated;
  },

  async logout(): Promise<void> {
    await demoStorage.setUser(null);
  },
};
