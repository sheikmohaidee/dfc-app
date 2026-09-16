/**
 * Deterministic Mock AI Extractor for Demo Mode
 */

import { type AiExtraction } from '@dfc/core';

export const mockAiRepository = {
  extractOrderFromInput(input: {
    kind: 'photo' | 'voice' | 'text';
    text?: string;
    localityName?: string;
  }): {
    extraction: AiExtraction;
    latencyMs: number;
    model: string;
  } {
    const raw = (input.text || '').toLowerCase();

    // 1. Food / Restaurant matching (Biryani, Kari Dosa, Jigarthanda, Idli)
    if (raw.includes('biryani') || raw.includes('kari dosa') || raw.includes('dosa') || raw.includes('amma mess') || raw.includes('jigarthanda') || raw.includes('idli')) {
      return {
        extraction: {
          category: 'food',
          storeHint: 'Amma Mess',
          items: [
            { name: 'Ayira Meen Kozhambu', quantity: 1, unit: 'portion', estimatedPriceRupees: 380, confidence: 0.98 },
            { name: 'Madurai Mutton Biryani', quantity: 1, unit: 'plate', estimatedPriceRupees: 320, confidence: 0.99 },
            { name: 'Famous Special Jigarthanda', quantity: 2, unit: 'glass', estimatedPriceRupees: 70, confidence: 0.95 },
          ],
          stops: [],
          transcript: input.text || '2 Jigarthanda, 1 Mutton Biryani, 1 Ayira Meen Kozhambu',
          summary: 'Read 3 items from Amma Mess & Famous Jigarthanda',
          needsHuman: false,
        },
        latencyMs: 820,
        model: 'gemini-2.5-flash (demo)',
      };
    }

    // 2. Pharmacy matching (Dolo, Pan 40, Azithral, Prescription)
    if (input.kind === 'photo' || raw.includes('dolo') || raw.includes('pan 40') || raw.includes('medicine') || raw.includes('tablets') || raw.includes('paracetamol')) {
      return {
        extraction: {
          category: 'pharmacy',
          storeHint: 'Meenakshi Medicals',
          items: [
            { name: 'Dolo 650 Tablet', quantity: 1, unit: 'strip of 15', estimatedPriceRupees: 31, confidence: 0.99 },
            { name: 'Pan 40 Tablet', quantity: 1, unit: 'strip of 15', estimatedPriceRupees: 148, confidence: 0.97 },
            { name: 'Cetzine 10mg Tablet', quantity: 1, unit: 'strip of 10', estimatedPriceRupees: 21, confidence: 0.52, note: 'Needs pharmacist confirmation' },
          ],
          stops: [],
          transcript: input.text || 'Prescription OCR scan',
          summary: 'Read 3 medicines from handwritten prescription (1 needs confirmation)',
          needsHuman: true,
        },
        latencyMs: 1100,
        model: 'gemini-2.5-flash (demo)',
      };
    }

    // 3. Grocery matching (Rice, Milk, Dal, Oil)
    if (raw.includes('milk') || raw.includes('arisi') || raw.includes('paruppu') || raw.includes('oil') || raw.includes('malligai') || raw.includes('grocery')) {
      return {
        extraction: {
          category: 'grocery',
          storeHint: 'Amma Mini Mart',
          items: [
            { name: 'Ponni Boiled Rice (5 kg)', quantity: 1, unit: '5 kg bag', estimatedPriceRupees: 340, confidence: 0.99 },
            { name: 'Aavin Green Magic Milk (500ml)', quantity: 2, unit: '500 ml pouch', estimatedPriceRupees: 24, confidence: 0.98 },
            { name: 'Madurai Malligai Poo (2 Muzham)', quantity: 1, unit: '2 muzham', estimatedPriceRupees: 60, confidence: 0.96 },
          ],
          stops: [],
          transcript: input.text || 'Grocery voice request',
          summary: 'Read 3 grocery items · Amma Mini Mart',
          needsHuman: false,
        },
        latencyMs: 750,
        model: 'gemini-2.5-flash (demo)',
      };
    }

    // 4. Default Concierge / General Request
    return {
      extraction: {
        category: 'concierge',
        storeHint: null,
        items: [
          { name: input.text || 'Custom Concierge Delivery Request', quantity: 1, unit: 'task', estimatedPriceRupees: 150, confidence: 0.95 },
        ],
        stops: [],
        transcript: input.text || 'Concierge errand request',
        summary: 'Understood concierge errand request',
        needsHuman: false,
      },
      latencyMs: 650,
      model: 'gemini-2.5-flash (demo)',
    };
  },
};
