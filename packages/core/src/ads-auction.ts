/**
 * Algorithmic Cost-Per-Click (CPC) Sponsored Ads Auction Engine.
 *
 * Runs generalized second-price / quality-score auctions for top category
 * placements and sponsored search highlights, creating a high-margin ad revenue stream.
 */

import type { Category } from './types';

export interface AdCampaign {
  id: string;
  storeId: string;
  storeName: string;
  category: Category;
  headline: string;
  tagline: string;
  bidPerClickPaise: number; // e.g. 500 = ₹5.00
  dailyBudgetPaise: number; // e.g. 50000 = ₹500.00
  spentTodayPaise: number;
  qualityScore: number; // 1.0 to 10.0 based on CTR + merchant rating
  historicalCtr: number; // e.g. 0.08 (8%)
  status: 'active' | 'paused' | 'budget_exhausted';
  createdAt: number;
}

export interface SponsoredPlacementResult {
  campaign: AdCampaign;
  effectiveCpcPaise: number; // Price charged (second-price auction rule)
  rankScore: number;
  isSponsored: true;
}

/**
 * Seed Ad Campaigns for Madurai Merchants.
 */
export const SEED_AD_CAMPAIGNS: AdCampaign[] = [
  {
    id: 'ad_camp_jigarthanda',
    storeId: 'famous-jigarthanda',
    storeName: 'Famous Jigarthanda',
    category: 'food',
    headline: 'Original Madurai Jigarthanda',
    tagline: 'Beat the Heat · 100% Pure Milk & Basundi',
    bidPerClickPaise: 800, // ₹8 per click
    dailyBudgetPaise: 50000,
    spentTodayPaise: 12000,
    qualityScore: 9.4,
    historicalCtr: 0.12,
    status: 'active',
    createdAt: Date.now() - 86400000 * 2,
  },
  {
    id: 'ad_camp_murugan',
    storeId: 'murugan-idli-shop',
    storeName: 'Murugan Idli Shop',
    category: 'food',
    headline: 'Hot Ghee Podi Idlis & Chutneys',
    tagline: 'Authentic South Indian Breakfast Delivered Hot',
    bidPerClickPaise: 650, // ₹6.50
    dailyBudgetPaise: 40000,
    spentTodayPaise: 8450,
    qualityScore: 9.1,
    historicalCtr: 0.10,
    status: 'active',
    createdAt: Date.now() - 86400000 * 5,
  },
  {
    id: 'ad_camp_konar',
    storeId: 'simmakkal-konar-mess',
    storeName: 'Simmakkal Konar Mess',
    category: 'food',
    headline: 'Famous Madurai Bun Parotta',
    tagline: 'Crispy Layers · Spicy Mutton Pepper Salna',
    bidPerClickPaise: 1000, // ₹10.00
    dailyBudgetPaise: 60000,
    spentTodayPaise: 24000,
    qualityScore: 9.5,
    historicalCtr: 0.14,
    status: 'active',
    createdAt: Date.now() - 86400000 * 10,
  },
];

/**
 * Resolves the winning sponsored ad using Ad Rank = Bid × Quality Score.
 * Charges the second-price minimum required to maintain the slot.
 */
export function resolveSponsoredPlacements(
  campaigns: AdCampaign[],
  category?: Category,
  maxSlots = 2,
): SponsoredPlacementResult[] {
  const eligible = campaigns.filter(
    (c) =>
      c.status === 'active' &&
      c.spentTodayPaise < c.dailyBudgetPaise &&
      (!category || c.category === category),
  );

  if (eligible.length === 0) return [];

  // Calculate Ad Rank = Bid * Quality Score
  const ranked = eligible
    .map((c) => ({
      campaign: c,
      rankScore: c.bidPerClickPaise * c.qualityScore,
    }))
    .sort((a, b) => b.rankScore - a.rankScore);

  const results: SponsoredPlacementResult[] = [];

  for (let i = 0; i < Math.min(maxSlots, ranked.length); i++) {
    const winner = ranked[i]!;
    const nextRankScore = ranked[i + 1]?.rankScore ?? winner.campaign.bidPerClickPaise * 0.5;
    // Second-price formula: (Next Ad Rank / Winner Quality Score) + 1 paise
    const effectiveCpc = Math.min(
      winner.campaign.bidPerClickPaise,
      Math.max(100, Math.round(nextRankScore / winner.campaign.qualityScore) + 1),
    );

    results.push({
      campaign: winner.campaign,
      effectiveCpcPaise: effectiveCpc,
      rankScore: Number(winner.rankScore.toFixed(1)),
      isSponsored: true,
    });
  }

  return results;
}
