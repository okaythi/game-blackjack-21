/**
 * Blackjack 21 — Pure Hand Valuation & Dynamic Ace Logic
 * 
 * Evaluates hand totals dynamically reducing Ace from 11 to 1 when busting,
 * detects soft totals, busts, and natural blackjacks vs split 21s, and enforces
 * pure action guards for hit, stand, double, split, and surrender.
 */

import type { Card, HandValue, Rank, TableRules } from './types'

/**
 * Returns true if rank is a 10-value card (10, J, Q, K).
 */
export function isTenValue(rank: Rank): boolean {
  return rank === '10' || rank === 'J' || rank === 'Q' || rank === 'K'
}

/**
 * Returns the base numerical value of a card assuming Ace = 1.
 */
export function getCardBaseValue(rank: Rank): number {
  switch (rank) {
    case 'A':
      return 1
    case '2':
    case '3':
    case '4':
    case '5':
    case '6':
    case '7':
    case '8':
    case '9':
      return Number(rank)
    case '10':
    case 'J':
    case 'Q':
    case 'K':
      return 10
  }
}

/**
 * Evaluates a set of cards according to pure Blackjack rules.
 * - Dynamic Ace valuation: Aces count as 11 unless total exceeds 21, reducing to 1.
 * - isSoft: true if at least one Ace remains valued at 11 without busting.
 * - isBust: total > 21.
 * - isBlackjack: exact 2-card 21 on initial deal (!isFromSplit && cards.length === 2 && total === 21).
 *   Split 21 is explicitly NOT a natural blackjack (pays 1:1, not 3:2).
 */
export function evaluateHand(cards: readonly Card[], isFromSplit: boolean = false): HandValue {
  let sumWithAcesAsOne = 0
  let aceCount = 0

  for (const card of cards) {
    if (card.rank === 'A') {
      aceCount++
      sumWithAcesAsOne += 1
    } else {
      sumWithAcesAsOne += getCardBaseValue(card.rank)
    }
  }

  const hardTotal = sumWithAcesAsOne
  const softTotal = aceCount > 0 ? sumWithAcesAsOne + 10 : sumWithAcesAsOne

  let total: number
  let isSoft: boolean

  // If we have at least one Ace, can we count one Ace as 11 (+10 to hard total) without busting?
  if (aceCount > 0 && sumWithAcesAsOne + 10 <= 21) {
    total = sumWithAcesAsOne + 10
    isSoft = true
  } else {
    total = sumWithAcesAsOne
    isSoft = false
  }

  const isBust = total > 21
  const isBlackjack = !isFromSplit && cards.length === 2 && total === 21

  return {
    total,
    isSoft,
    isBust,
    isBlackjack,
    hardTotal,
    softTotal,
  }
}

/**
 * Action Guard: Determines whether a hand can be split.
 * - Exactly 2 cards.
 * - Matching ranks or equal 10-values (e.g. 10-10, K-Q, 8-8).
 * - Player has sufficient bankroll to match the original bet.
 * - Table maximum split hands limit not yet reached.
 * - Resplit Aces rule checked if fromSplit.
 */
export function canSplitHand(
  cards: readonly Card[],
  bankroll: number,
  bet: number,
  handCount: number,
  rules: TableRules,
  fromSplit: boolean = false,
): boolean {
  if (cards.length !== 2) {
    return false
  }

  if (bankroll < bet) {
    return false
  }

  if (handCount >= rules.maxSplitHands) {
    return false
  }

  const c0 = cards[0]!
  const c1 = cards[1]!
  const isRankMatch = c0.rank === c1.rank
  const isTenMatch = isTenValue(c0.rank) && isTenValue(c1.rank)

  if (!isRankMatch && !isTenMatch) {
    return false
  }

  // Resplit Aces restriction
  if (fromSplit && (c0.rank === 'A' || c1.rank === 'A') && !rules.resplitAces) {
    return false
  }

  return true
}

/**
 * Action Guard: Determines whether a hand can double down.
 * - Exactly 2 cards in hand.
 * - Sufficient bankroll to match original bet.
 * - If hand is from split, doubleAfterSplit (DAS) must be allowed.
 * - Restricted double rules (e.g. '9-11') respected.
 */
export function canDoubleHand(
  cards: readonly Card[],
  bankroll: number,
  bet: number,
  rules: TableRules,
  fromSplit: boolean = false,
): boolean {
  if (cards.length !== 2) {
    return false
  }

  if (bankroll < bet) {
    return false
  }

  if (fromSplit && !rules.doubleAfterSplit) {
    return false
  }

  if (rules.doubleAllowedOn === '9-11') {
    const val = evaluateHand(cards, fromSplit)
    if (val.total < 9 || val.total > 11) {
      return false
    }
  }

  return true
}

/**
 * Action Guard: Determines whether late surrender is permitted.
 * - Allowed by rules.
 * - Initial 2 cards of the hand only.
 * - Never allowed after splitting.
 */
export function canSurrenderHand(
  cards: readonly Card[],
  rules: TableRules,
  fromSplit: boolean = false,
): boolean {
  if (!rules.lateSurrender) {
    return false
  }

  if (cards.length !== 2) {
    return false
  }

  if (fromSplit) {
    return false
  }

  return true
}

/**
 * Action Guard: Determines whether a hand can hit.
 * - Not busted.
 * - Total strictly below 21.
 * - Not a natural blackjack.
 */
export function canHitHand(handValue: HandValue): boolean {
  return !handValue.isBust && handValue.total < 21 && !handValue.isBlackjack
}

/**
 * Action Guard: Determines whether a hand can stand.
 * - Not busted.
 */
export function canStandHand(handValue: HandValue): boolean {
  return !handValue.isBust
}
