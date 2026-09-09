import type { DifficultyTier, TableRules } from './types'

export const TABLE_RULES: Record<DifficultyTier, TableRules> = {
  easy: {
    deckCount: 6,
    blackjackPayoutRatio: 1.5, // 3:2
    dealerHitsSoft17: false, // S17 (Dealer stands on soft 17)
    doubleAfterSplit: true,
    lateSurrender: true,
    resplitAces: true,
    maxSplitHands: 4,
    doubleAllowedOn: 'any',
    cutCardPenetration: 0.75,
    trainerModeAvailable: true,
    trainerModeDefaultOpen: true,
  },
  normal: {
    deckCount: 6,
    blackjackPayoutRatio: 1.5, // 3:2
    dealerHitsSoft17: false, // S17
    doubleAfterSplit: true,
    lateSurrender: false,
    resplitAces: false,
    maxSplitHands: 4,
    doubleAllowedOn: 'any',
    cutCardPenetration: 0.65,
    trainerModeAvailable: true,
    trainerModeDefaultOpen: false,
  },
  expert: {
    deckCount: 6,
    blackjackPayoutRatio: 1.2, // 6:5
    dealerHitsSoft17: true, // H17 (Dealer hits soft 17)
    doubleAfterSplit: false,
    lateSurrender: false,
    resplitAces: false,
    maxSplitHands: 2,
    doubleAllowedOn: '9-11',
    cutCardPenetration: 0.6,
    trainerModeAvailable: false,
    trainerModeDefaultOpen: false,
  },
}

export function getRulesForDifficulty(tier: DifficultyTier): TableRules {
  return TABLE_RULES[tier]
}
