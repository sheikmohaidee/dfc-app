/**
 * Print & Xerox Rates & Options for Demo
 */

export const PRINT_RATES = {
  bwPerPagePaise: 200, // ₹2.00
  colorPerPagePaise: 800, // ₹8.00
  doubleSidedDiscountPercent: 15,
  binding: {
    none: 0,
    staple: 500, // ₹5.00
    spiral: 4000, // ₹40.00
    hard: 12000, // ₹120.00
  },
  deliveryFeePaise: 2000, // ₹20.00
};

export const SAMPLE_DOCUMENTS = [
  { name: 'College_Project_Final.pdf', pages: 24, size: '2.4 MB' },
  { name: 'Aadhaar_Pan_Copy.pdf', pages: 2, size: '420 KB' },
  { name: 'House_Rental_Agreement.pdf', pages: 6, size: '850 KB' },
  { name: 'Medical_Reports_Summary.pdf', pages: 8, size: '1.2 MB' },
];

export function calculatePrintPrice(
  pages: number,
  copies: number,
  color: 'bw' | 'color',
  side: 'single' | 'double',
  binding: 'none' | 'staple' | 'spiral' | 'hard',
): {
  itemTotalPaise: number;
  bindingPaise: number;
  deliveryFeePaise: number;
  totalPaise: number;
} {
  const baseRate = color === 'color' ? PRINT_RATES.colorPerPagePaise : PRINT_RATES.bwPerPagePaise;
  const ratePerSheet = side === 'double' ? baseRate * 2 * 0.85 : baseRate;
  const sheets = side === 'double' ? Math.ceil(pages / 2) : pages;
  const itemTotalPaise = Math.round(sheets * ratePerSheet * copies);
  const bindingPaise = PRINT_RATES.binding[binding] * copies;
  const deliveryFeePaise = PRINT_RATES.deliveryFeePaise;
  const totalPaise = itemTotalPaise + bindingPaise + deliveryFeePaise;

  return { itemTotalPaise, bindingPaise, deliveryFeePaise, totalPaise };
}
