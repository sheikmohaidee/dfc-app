/**
 * Madurai Localities for Demo
 */

import { LOCALITIES, type LocalityGeo } from '@dfc/core';

export interface DemoLocality extends LocalityGeo {
  popularHub: string;
  tagline: string;
}

export const DEMO_LOCALITIES: DemoLocality[] = [
  {
    id: 'anna-nagar',
    name: 'Anna Nagar',
    nameTa: 'அண்ணா நகர்',
    pincode: '625020',
    lat: 9.9312,
    lng: 78.1256,
    popularHub: 'Ambika Theatre Junction',
    tagline: 'Food & medical hub with fast 15-min delivery',
  },
  {
    id: 'simmakkal',
    name: 'Simmakkal',
    nameTa: 'சிம்மக்கல்',
    pincode: '625001',
    lat: 9.9214,
    lng: 78.1187,
    popularHub: 'Flower Market & Heritage Street',
    tagline: 'Traditional eateries, markets and heritage pharmacies',
  },
  {
    id: 'kk-nagar',
    name: 'K.K. Nagar',
    nameTa: 'கே.கே. நகர்',
    pincode: '625020',
    lat: 9.9095,
    lng: 78.0985,
    popularHub: 'Walkers Club & Arch',
    tagline: 'Residential area with supermarket & bakery network',
  },
  {
    id: 'tallakulam',
    name: 'Tallakulam',
    nameTa: 'தல்லாகுளம்',
    pincode: '625002',
    lat: 9.9380,
    lng: 78.1330,
    popularHub: 'Perumal Temple Road',
    tagline: 'Famous non-veg messes & printing hubs',
  },
  {
    id: 'goripalayam',
    name: 'Goripalayam',
    nameTa: 'கோரிப்பாளையம்',
    pincode: '625002',
    lat: 9.9296,
    lng: 78.1240,
    popularHub: 'Dargah Circle',
    tagline: 'Late night Kari Dosa & tea stalls',
  },
  {
    id: 'villapuram',
    name: 'Villapuram',
    nameTa: 'விளாபுரம்',
    pincode: '625012',
    lat: 9.8874,
    lng: 78.1042,
    popularHub: 'Housing Board',
    tagline: 'Quick delivery from local provisional stores',
  },
  {
    id: 'thirunagar',
    name: 'Thirunagar',
    nameTa: 'திருநகர்',
    pincode: '625006',
    lat: 9.8698,
    lng: 78.0640,
    popularHub: 'Bus Stand Junction',
    tagline: 'South Madurai grocery & organic produce',
  },
  {
    id: 'mattuthavani',
    name: 'Mattuthavani',
    nameTa: 'மாட்டுத்தாவணி',
    pincode: '625007',
    lat: 9.9482,
    lng: 78.1553,
    popularHub: 'Integrated Bus Terminal',
    tagline: '24/7 parcel dispatch & medicine pickups',
  },
];

export const getLocality = (id: string) =>
  DEMO_LOCALITIES.find((l) => l.id === id) ?? DEMO_LOCALITIES[0]!;
