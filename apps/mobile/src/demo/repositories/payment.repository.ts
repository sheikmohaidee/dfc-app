/**
 * Mock Payment Repository for Demo Mode
 */

import type { Order, Payment, PaymentMethod } from '@dfc/core';
import { demoStorage } from '../storage';

export const mockPaymentRepository = {
  async simulatePayment(order: Order, method: PaymentMethod): Promise<Payment> {
    // 1 second realistic simulation
    await new Promise((res) => setTimeout(res, 800));

    const now = Date.now();
    const isCod = method === 'cash';

    const payment: Payment = {
      id: `pay-demo-${now}`,
      orderId: order.id,
      orderCode: order.code,
      customerUid: order.customerUid,
      amountPaise: order.pricing.totalPaise,
      receivedPaise: isCod ? 0 : order.pricing.totalPaise,
      method,
      state: isCod ? 'unpaid' : 'paid',
      reference: `UPI-MAD-${order.code}`,
      createdAt: now,
      updatedAt: now,
    };

    // Update order status
    const updatedOrder: Order = {
      ...order,
      status: isCod ? 'vendor_accepted' : 'paid',
      paymentMode: isCod ? 'cod' : 'prepaid',
      paymentStatus: isCod ? 'unpaid' : 'paid',
      updatedAt: now,
    };
    await demoStorage.saveOrder(updatedOrder);

    return payment;
  },
};
