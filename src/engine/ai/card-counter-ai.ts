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
  _tier: string = 'normal',
): number {
  const min = Math.max(10, tableMinBet)
  const baseUnit = Math.max(min, profile.baseMinBet || 15)

  if (bankroll <= min) {
    return Math.min(bankroll, min)
  }

  // Unit sizing: starts at companion's distinct base unit (e.g. 15, 20, 25)
  // Compounds only if bankroll expands from substantial profits (> 120 units)
  let unit = baseUnit
  if (bankroll > baseUnit * 120) {
    unit = Math.max(baseUnit, Math.round((bankroll * 0.01) / 5) * 5)
  }
  unit = Math.min(unit, Math.max(baseUnit, Math.floor(bankroll * 0.05)))

  // Sensitivity from companion profile (e.g. 0.8 to 1.8)
  const sensitivity = Math.max(0.7, profile.countSensitivity || 1.0)

  let multiplier = 1.0

  if (trueCount <= -1.0) {
    // Negative count (house edge heavy):
    // AGI drops strictly to table minimum to minimize negative expectation.
    return min
  } else if (trueCount <= 0.2) {
    // Neutral count: bets standard 1 base unit
    multiplier = 1.0
  } else {
    // Advantage count (True Count > 0):
    // Optimal Kelly spread ramps smoothly with count
    // TC 1 -> ~2x, TC 2 -> ~3.5x, TC 3 -> ~5.5x, TC 4 -> ~8x, TC 5 -> ~11x, TC 6+ -> ~14x-16x
    const rawSpread = 1.0 + Math.pow(trueCount, 1.35) * 1.25 * sensitivity
    multiplier = Math.max(1.0, Math.min(16.0, rawSpread))
  }

  const rawBet = Math.round(unit * multiplier)

  // Risk-of-ruin protection: maximum bet cannot exceed 20% of current bankroll
  const maxSafeBet = Math.max(unit, Math.floor(bankroll * 0.20))
  const clamped = Math.max(min, Math.min(bankroll, Math.min(5000, Math.min(rawBet, maxSafeBet))))

  // Round to clean casino chip denominations
  let rounded = clamped
  if (clamped >= 250) {
    rounded = Math.round(clamped / 50) * 50
  } else if (clamped >= 100) {
    rounded = Math.round(clamped / 25) * 25
  } else if (clamped >= 30) {
    rounded = Math.round(clamped / 10) * 10
  } else {
    rounded = Math.round(clamped / 5) * 5
  }

  return Math.max(min, Math.min(bankroll, rounded))
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
