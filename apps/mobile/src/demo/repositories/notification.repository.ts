/**
 * Mock Notification Repository for Demo Mode
 */

import { demoStorage } from '../storage';
import type { DemoNotification } from '../types';

export const mockNotificationRepository = {
  getNotifications(): DemoNotification[] {
    return demoStorage.getNotifications();
  },

  getUnreadCount(): number {
    return demoStorage.getNotifications().filter((n) => !n.read).length;
  },

  async markAsRead(id: string): Promise<void> {
    const list = demoStorage.getNotifications();
    const updated = list.map((n) => (n.id === id ? { ...n, read: true } : n));
    await demoStorage.saveNotifications(updated);
  },

  async markAllAsRead(): Promise<void> {
    const list = demoStorage.getNotifications();
    const updated = list.map((n) => ({ ...n, read: true }));
    await demoStorage.saveNotifications(updated);
  },
};
