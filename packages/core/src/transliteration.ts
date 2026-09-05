/**
 * Bilingual Transliteration & Phonetic Search Indexer.
 *
 * Implements fuzzy matching between Tamil Unicode script, phonetic English (Tanglish),
 * and standard English terminology for Madurai regional food and grocery dishes.
 */

export interface TransliterationEntry {
  canonical: string;
  tamil: string;
  tanglishVariants: string[];
}

export const MADURAI_TRANSLITERATION_DICTIONARY: TransliterationEntry[] = [
  {
    canonical: 'bun parotta',
    tamil: 'பன் பரோட்டா',
    tanglishVariants: ['bun parotta', 'bun barotta', 'pan parota', 'bun parota', 'barotta', 'parotta'],
  },
  {
    canonical: 'mutton kari dosa',
    tamil: 'மட்டன் கறி தோசை',
    tanglishVariants: ['mutton kari dosa', 'kari dosai', 'mutton curry dosa', 'kari dosa', 'kari thosai', 'dosai'],
  },
  {
    canonical: 'jigarthanda',
    tamil: 'ஜிகர்தண்டா',
    tanglishVariants: ['jigarthanda', 'jigar dhanda', 'jigarthanta', 'famous jigarthanda', 'basundi'],
  },
  {
    canonical: 'ghee podi idli',
    tamil: 'நெய் பொடி இட்லி',
    tanglishVariants: ['ghee podi idli', 'podi idly', 'nei podi idli', 'podi idli', 'ghee idli', 'idly', 'idli'],
  },
  {
    canonical: 'medhu vada',
    tamil: 'மெது வடை',
    tanglishVariants: ['medhu vada', 'medu vadai', 'ulunthu vadai', 'vada', 'vadai'],
  },
  {
    canonical: 'madurai malligai',
    tamil: 'மதுரை மல்லிகை',
    tanglishVariants: ['madurai malligai', 'malligai poo', 'jasmine', 'mallipoo', 'malli'],
  },
  {
    canonical: 'kumbakonam degree coffee',
    tamil: 'டிகிரி காபி',
    tanglishVariants: ['degree coffee', 'filter coffee', 'kaapi', 'degree kaapi'],
  },
  {
    canonical: 'sona masoori rice',
    tamil: 'சோனா மசூரி அரிசி',
    tanglishVariants: ['sona masoori', 'masoori rice', 'arisi', 'rice bag'],
  },
];

/**
 * Normalizes text by trimming, lowercasing, and removing punctuation.
 */
export function normalizeSearchString(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, '')
    .replace(/\s+/g, ' ');
}

/**
 * Checks if a search query matches an item via English, Tamil script, or phonetic Tanglish.
 */
export function bilingualSearchMatch(
  query: string,
  item: { name: string; nameTa?: string; tags?: string[] },
): boolean {
  const normalizedQuery = normalizeSearchString(query);
  if (!normalizedQuery) return true;

  // Direct English match
  if (normalizeSearchString(item.name).includes(normalizedQuery)) return true;

  // Direct Tamil script match
  if (item.nameTa && item.nameTa.includes(normalizedQuery)) return true;

  // Check tags
  if (item.tags?.some((t) => normalizeSearchString(t).includes(normalizedQuery))) {
    return true;
  }

  // Cross-reference phonetic dictionary
  for (const entry of MADURAI_TRANSLITERATION_DICTIONARY) {
    const queryMatchesEntry =
      normalizedQuery.includes(entry.canonical) ||
      entry.tanglishVariants.some((v) => normalizedQuery.includes(v) || v.includes(normalizedQuery)) ||
      (entry.tamil && normalizedQuery.includes(entry.tamil));

    if (queryMatchesEntry) {
      const itemMatchesEntry =
        normalizeSearchString(item.name).includes(entry.canonical) ||
        (item.nameTa && item.nameTa.includes(entry.tamil)) ||
        entry.tanglishVariants.some((v) => normalizeSearchString(item.name).includes(v));

      if (itemMatchesEntry) return true;
    }
  }

  return false;
}
