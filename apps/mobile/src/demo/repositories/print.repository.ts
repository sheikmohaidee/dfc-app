/**
 * Mock Print Repository for Demo Mode
 */

import { calculatePrintPrice, PRINT_RATES, SAMPLE_DOCUMENTS } from '../data/print';
import type { PrintOptions } from '../types';

export const mockPrintRepository = {
  getSampleDocuments() {
    return SAMPLE_DOCUMENTS;
  },

  getRates() {
    return PRINT_RATES;
  },

  calculateQuote(options: PrintOptions) {
    return calculatePrintPrice(
      options.pageCount,
      options.copies,
      options.color,
      options.side,
      options.binding,
    );
  },
};
