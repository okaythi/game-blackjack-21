/**
 * Blackjack 21 — Card Counter AI & Illustrious 18 Deviations
 * 
 * Implements the Hi-Lo counting system (+1 for 2-6, 0 for 7-9, -1 for 10-A),
 * True Count calculation (Running Count / Decks Remaining), dynamic True Count
 * bet sizing, and the complete Don Schlesinger Illustrious 18 strategy index deviations.
 */

import { evaluateHand, isTenValue } from '../hand'
import { getHiLoValue } from '../cards'
import { normalizeDealerUpcard } from './basic-strategy'
import type { ActionType, AIProfile, Card, TableRules } from '../types'

/**
 * Hi-Lo count for a single card.
 */
export function getHiLoCount(card: Card): number {
  return getHiLoValue(card.rank)
}

/**
 * Hi-Lo running count for an array of cards.
 */
export function calculateRunningCount(cards: readonly Card[]): number {
  return cards.reduce((acc, card) => acc + getHiLoValue(card.rank), 0)
}

/**
 * Calculates the True Count = Running Count / Decks Remaining.
 * Clamps decks remaining to a minimum of 0.5 to prevent division by zero or extreme skew.
 */
export function calculateTrueCount(runningCount: number, cardsRemaining: number): number {
  const decksRemaining = Math.max(0.5, cardsRemaining / 52)
  return runningCount / decksRemaining
}

/**
 * Calculates AGI-level optimal card counter bet based on True Count,
 * mathematical player advantage, Kelly criterion unit spreading,
 * bankroll compounding, and clean casino chip denominations.
 */
export function calculateCardCounterBet(
  profile: AIProfile,
  trueCount: number,
  bankroll: number,
  tableMinBet: number = 10,
  tier: string = 'normal',
): number {
  const baseMin = Math.max(tableMinBet, profile.baseMinBet || (tier === 'expert' ? 50 : 25))

  if (bankroll <= baseMin) {
    return Math.max(tableMinBet, Math.min(bankroll, baseMin))
  }

  // Dynamic unit sizing: scales as bankroll compounds (1 unit = ~2.5% of bankroll, min table base)
  const bankrollUnit = Math.floor(bankroll / 40 / 25) * 25
  const dynamicUnit = Math.max(baseMin, bankrollUnit || baseMin)

  // Baseline house edge: ~ -0.5% on 3:2, ~ -1.9% on 6:5 (hard/expert)
  const baselineEdge = tier === 'hard' || tier === 'expert' ? -0.019 : -0.005
  // Each +1 True Count shifts edge by ~ +0.51%
  const playerAdvantage = baselineEdge + 0.0051 * trueCount

  // When house has the mathematical edge (playerAdvantage <= 0 or TC <= +1.0):
  // AGI bets strictly the 1-unit minimum. Never over-bets when negative expectation.
  if (playerAdvantage <= 0 || trueCount <= 1.0) {
    return Math.min(bankroll, dynamicUnit)
  }

  // When player has mathematical advantage (EV+):
  // Half-Kelly optimal unit spread:
  // TC 1.5 - 2.5: 2 units
  // TC 2.5 - 3.5: 4 units
  // TC 3.5 - 4.5: 6 units
  // TC 4.5 - 5.5: 8 units
  // TC >= 5.5: 12 units
  let units = 1
  if (trueCount >= 5.5) {
    units = 12
  } else if (trueCount >= 4.5) {
    units = 8
  } else if (trueCount >= 3.5) {
    units = 6
  } else if (trueCount >= 2.5) {
    units = 4
  } else if (trueCount >= 1.5) {
    units = 2
  }

  const sensitivity = Math.max(0.8, profile.countSensitivity || 1.0)
  const spreadUnits = Math.round(units * sensitivity)
  const rawBet = dynamicUnit * spreadUnits

  // Risk-of-ruin cap: max 20% of bankroll or table max 5000
  const maxSafeBet = Math.max(dynamicUnit, Math.floor(bankroll * 0.2))
  const clampedBet = Math.min(bankroll, Math.min(5000, Math.min(rawBet, maxSafeBet)))

  // Round to clean casino chip denominations
  let rounded = clampedBet
  if (clampedBet >= 300) {
    rounded = Math.round(clampedBet / 100) * 100
  } else if (clampedBet >= 100) {
    rounded = Math.round(clampedBet / 50) * 50
  } else if (clampedBet >= 25) {
    rounded = Math.round(clampedBet / 25) * 25
  } else {
    rounded = Math.round(clampedBet / 5) * 5
  }

  return Math.max(tableMinBet, Math.min(bankroll, rounded))
}

/**
 * Checks whether an insurance decision should be made based on the Illustrious 18:
 * Index #1: Take insurance when True Count >= +3.
 */
export function shouldTakeInsurance(trueCount: number): boolean {
  return trueCount >= 3.0
}

/**
 * Evaluates Don Schlesinger's Illustrious 18 deviations.
 * Returns null if no index deviation applies, deferring to Basic Strategy.
 */
export function getIllustrious18Action(
  cards: readonly Card[],
  dealerUpcard: Card,
  trueCount: number,
  rules: TableRules,
  canDouble: boolean,
  canSplit: boolean,
  fromSplit: boolean = false,
): ActionType | null {
  const upcardKey = normalizeDealerUpcard(dealerUpcard)
  const handVal = evaluateHand(cards, fromSplit)

  if (handVal.isBust || handVal.total >= 21) {
    return null
  }

  const isPair = cards.length === 2 && (
    cards[0]!.rank === cards[1]!.rank || (isTenValue(cards[0]!.rank) && isTenValue(cards[1]!.rank))
  )

  // 4 & 5. Pair of 10s: Split 10,10 vs 5 (TC >= +5), vs 6 (TC >= +4)
  if (isPair && isTenValue(cards[0]!.rank) && canSplit) {
    if (upcardKey === '6' && trueCount >= 4.0) {
      return 'split'
    }
    if (upcardKey === '5' && trueCount >= 5.0) {
      return 'split'
    }
  }

  // Deviations for Hard Totals (only when hand is NOT soft)
  if (!handVal.isSoft) {
    const total = handVal.total

    // 2. 16 vs 10: Stand if TC >= 0 (normally Hit)
    if (total === 16 && upcardKey === '10') {
      return trueCount >= 0 ? 'stand' : 'hit'
    }

    // 3. 15 vs 10: Stand if TC >= +4 (normally Hit)
    if (total === 15 && upcardKey === '10') {
      if (trueCount >= 4.0) return 'stand'
    }

    // 6. 10 vs 10: Double if TC >= +4 and canDouble (normally Hit)
    if (total === 10 && upcardKey === '10' && canDouble) {
      if (trueCount >= 4.0) return 'double'
    }

    // 7. 12 vs 3: Stand if TC >= +2 (normally Hit)
    if (total === 12 && upcardKey === '3') {
      return trueCount >= 2.0 ? 'stand' : 'hit'
    }

    // 8. 12 vs 2: Stand if TC >= +3 (normally Hit)
    if (total === 12 && upcardKey === '2') {
      return trueCount >= 3.0 ? 'stand' : 'hit'
    }

    // 9. 11 vs A: Double if TC >= +1 in S17 (normally Hit)
    if (total === 11 && upcardKey === 'A' && canDouble && !rules.dealerHitsSoft17) {
      if (trueCount >= 1.0) return 'double'
    }

    // 10. 9 vs 2: Double if TC >= +1 and canDouble (normally Hit)
    if (total === 9 && upcardKey === '2' && canDouble) {
      if (trueCount >= 1.0) return 'double'
    }

    // 11. 10 vs A: Double if TC >= +4 and canDouble (normally Hit)
    if (total === 10 && upcardKey === 'A' && canDouble) {
      if (trueCount >= 4.0) return 'double'
    }

    // 12. 9 vs 7: Double if TC >= +3 and canDouble (normally Hit)
    if (total === 9 && upcardKey === '7' && canDouble) {
      if (trueCount >= 3.0) return 'double'
    }

    // 13. 16 vs 9: Stand if TC >= +5 (normally Hit)
    if (total === 16 && upcardKey === '9') {
      if (trueCount >= 5.0) return 'stand'
    }

    // 14. 13 vs 2: Hit if TC < -1 (normally Stand)
    if (total === 13 && upcardKey === '2') {
      if (trueCount < -1.0) return 'hit'
    }

    // 15. 12 vs 4: Stand if TC >= 0, Hit if TC < 0 (normally Stand)
    if (total === 12 && upcardKey === '4') {
      return trueCount >= 0 ? 'stand' : 'hit'
    }

    // 16. 12 vs 5: Stand if TC >= -2, Hit if TC < -2 (normally Stand)
    if (total === 12 && upcardKey === '5') {
      return trueCount >= -2.0 ? 'stand' : 'hit'
    }

    // 17. 12 vs 6: Stand if TC >= -1, Hit if TC < -1 (normally Stand)
    if (total === 12 && upcardKey === '6') {
      return trueCount >= -1.0 ? 'stand' : 'hit'
    }

    // 18. 13 vs 3: Hit if TC < -2 (normally Stand)
    if (total === 13 && upcardKey === '3') {
      if (trueCount < -2.0) return 'hit'
    }
  }

  return null
}
