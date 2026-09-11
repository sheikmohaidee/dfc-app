/**
 * Mock Genie / Concierge Repository for Demo Mode
 */

import { calculateGenieFare, GENIE_CATEGORIES } from '../data/genie';
import type { GenieTask } from '../types';

export const mockGenieRepository = {
  getCategories() {
    return GENIE_CATEGORIES;
  },

  calculateQuote(task: GenieTask, distanceKm: number = 3.5) {
    return calculateGenieFare(task.kind, distanceKm);
  },
};
