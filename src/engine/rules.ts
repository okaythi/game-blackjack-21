import type { DifficultyTier, TableRules } from './types'

export const TABLE_RULES: Record<DifficultyTier, TableRules> = {
  // Easy Mode (Player-Friendly Rules / House Edge ~0.2%):
  // - Blackjack pays 3:2.
  // - Dealer stands on all 17s (S17).
  // - Double Down allowed on any two cards and Double After Split (DAS) permitted.
  // - Late surrender enabled (forfeit half your bet if handed a hopeless total like 16 vs 10).
  easy: {
    deckCount: 6,
    blackjackPayoutRatio: 1.5, // 3:2
    dealerHitsSoft17: false, // S17 (Dealer stands on all 17s)
    doubleAfterSplit: true, // DAS permitted
    lateSurrender: true, // Late surrender enabled
    resplitAces: true,
    maxSplitHands: 4,
    doubleAllowedOn: 'any', // Double Down allowed on any two cards
    cutCardPenetration: 0.75,
    trainerModeAvailable: true,
    trainerModeDefaultOpen: true,
  },

  // Normal Mode (Standard Authentic Rules / House Edge ~0.5%):
  // - Standard 6-deck shoe with standard cut-card penetration.
  // - Dealer stands on all 17s.
  // - DAS allowed, but no surrender.
  normal: {
    deckCount: 6, // Standard 6-deck shoe
    blackjackPayoutRatio: 1.5, // 3:2
    dealerHitsSoft17: false, // S17 (Dealer stands on all 17s)
    doubleAfterSplit: true, // DAS allowed
    lateSurrender: false, // No surrender
    resplitAces: false,
    maxSplitHands: 4,
    doubleAllowedOn: 'any',
    cutCardPenetration: 0.75, // Standard cut-card penetration
    trainerModeAvailable: true,
    trainerModeDefaultOpen: false,
  },

  // Hard Mode (Vegas Strip / Unfavourable House Edge ~2.0%+):
  // - Dealer hits on Soft 17 (H17) — gives house an extra ~0.22% edge.
  // - Blackjack pays 6:5 instead of 3:2 (10-Candy bet pays 12 Candies instead of 15).
  // - Doubling restricted strictly to 9, 10, or 11. No re-splitting Aces.
  hard: {
    deckCount: 6,
    blackjackPayoutRatio: 1.2, // 6:5 instead of 3:2
    dealerHitsSoft17: true, // H17 (Dealer hits on Soft 17)
    doubleAfterSplit: false,
    lateSurrender: false, // No surrender
    resplitAces: false, // No re-splitting Aces
    maxSplitHands: 2,
    doubleAllowedOn: '9-11', // Doubling restricted strictly to 9, 10, or 11
    cutCardPenetration: 0.65,
    trainerModeAvailable: false,
    trainerModeDefaultOpen: false,
  },

  // Expert alias to Hard mode for backwards compatibility
  expert: {
    deckCount: 6,
    blackjackPayoutRatio: 1.2,
    dealerHitsSoft17: true,
    doubleAfterSplit: false,
    lateSurrender: false,
    resplitAces: false,
    maxSplitHands: 2,
    doubleAllowedOn: '9-11',
    cutCardPenetration: 0.65,
    trainerModeAvailable: false,
    trainerModeDefaultOpen: false,
  },
}

export function getRulesForDifficulty(tier: DifficultyTier): TableRules {
  return TABLE_RULES[tier]
}
