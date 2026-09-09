/**
 * Blackjack 21 — Mathematically Optimal Basic Strategy Tables
 * 
 * Provides complete lookup tables for Hard totals (5-21), Soft totals (A,2-A,9),
 * Pairs (2,2-A,A), and Surrender vs Dealer upcard (2-A), accounting for
 * Double After Split (DAS) and Dealer Hits/Stands Soft 17 (H17/S17).
 */

import { evaluateHand, isTenValue } from '../hand'
import type { ActionType, Card, Rank, TableRules } from '../types'

export type DealerUpcardKey = '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'A'

/**
 * Normalizes any card rank to one of the 10 dealer upcard keys.
 */
export function normalizeDealerUpcard(card: Card): DealerUpcardKey {
  if (card.rank === 'A') return 'A'
  if (isTenValue(card.rank)) return '10'
  return card.rank as DealerUpcardKey
}

/**
 * Normalizes pair rank for pair splitting lookup.
 */
export function getPairRankKey(cards: readonly Card[]): Rank | null {
  if (cards.length !== 2) return null
  const c0 = cards[0]!
  const c1 = cards[1]!
  if (c0.rank === c1.rank) return c0.rank
  if (isTenValue(c0.rank) && isTenValue(c1.rank)) return '10'
  return null
}

export interface BasicStrategyContext {
  readonly canDouble: boolean
  readonly canSplit: boolean
  readonly canSurrender: boolean
  readonly fromSplit?: boolean
}

/**
 * Determines the mathematically optimal Basic Strategy action.
 */
export function getBasicStrategyAction(
  cards: readonly Card[],
  dealerUpcard: Card,
  rules: TableRules,
  ctx: BasicStrategyContext,
): ActionType {
  const upcardKey = normalizeDealerUpcard(dealerUpcard)
  const handVal = evaluateHand(cards, ctx.fromSplit)

  if (handVal.isBust) {
    return 'stand'
  }
  if (handVal.total >= 21) {
    return 'stand'
  }

  // 1. SURRENDER CHECK (if allowed)
  if (ctx.canSurrender && cards.length === 2 && !ctx.fromSplit) {
    const hardTotal = handVal.hardTotal
    if (handVal.isSoft === false) {
      // 16 surrenders vs 9, 10, A (except 8,8 where split is preferred unless H17 vs A)
      if (hardTotal === 16) {
        const is88 = cards[0]!.rank === '8' && cards[1]!.rank === '8'
        if (is88 && ctx.canSplit) {
          if (rules.dealerHitsSoft17 && upcardKey === 'A') {
            return 'surrender'
          }
          // Otherwise will split 8s below
        } else if (upcardKey === '9' || upcardKey === '10' || upcardKey === 'A') {
          return 'surrender'
        }
      } else if (hardTotal === 15) {
        if (upcardKey === '10' || (rules.dealerHitsSoft17 && upcardKey === 'A')) {
          return 'surrender'
        }
      } else if (hardTotal === 17 && rules.dealerHitsSoft17 && upcardKey === 'A') {
        return 'surrender'
      }
    }
  }

  // 2. PAIR SPLITTING CHECK
  const pairRank = getPairRankKey(cards)
  if (pairRank !== null && ctx.canSplit) {
    const splitAction = getPairSplitAction(pairRank, upcardKey, rules.doubleAfterSplit)
    if (splitAction === 'split') {
      return 'split'
    }
  }

  // 3. SOFT TOTALS CHECK (Ace counted as 11)
  if (handVal.isSoft) {
    return getSoftHandAction(handVal.total, upcardKey, ctx.canDouble, rules.dealerHitsSoft17)
  }

  // 4. HARD TOTALS CHECK
  return getHardHandAction(handVal.total, upcardKey, ctx.canDouble, rules.dealerHitsSoft17)
}

function getPairSplitAction(
  pair: Rank,
  upcard: DealerUpcardKey,
  das: boolean,
): 'split' | 'other' {
  switch (pair) {
    case 'A':
      return 'split' // Always split Aces
    case '10':
    case 'J':
    case 'Q':
    case 'K':
      return 'other' // Never split 10s (Stand)
    case '9':
      // Split vs 2-6, 8, 9; Stand vs 7, 10, A
      if (['2', '3', '4', '5', '6', '8', '9'].includes(upcard)) {
        return 'split'
      }
      return 'other'
    case '8':
      return 'split' // Always split 8s
    case '7':
      // Split vs 2-7
      if (['2', '3', '4', '5', '6', '7'].includes(upcard)) {
        return 'split'
      }
      return 'other'
    case '6':
      if (das) {
        if (['2', '3', '4', '5', '6'].includes(upcard)) return 'split'
      } else {
        if (['3', '4', '5', '6'].includes(upcard)) return 'split'
      }
      return 'other'
    case '5':
      return 'other' // Never split 5s (Double or Hit as hard 10)
    case '4':
      if (das && (upcard === '5' || upcard === '6')) {
        return 'split'
      }
      return 'other'
    case '3':
    case '2':
      if (das) {
        if (['2', '3', '4', '5', '6', '7'].includes(upcard)) return 'split'
      } else {
        if (['4', '5', '6', '7'].includes(upcard)) return 'split'
      }
      return 'other'
  }
}

function getSoftHandAction(
  softTotal: number,
  upcard: DealerUpcardKey,
  canDouble: boolean,
  h17: boolean,
): ActionType {
  switch (softTotal) {
    case 20:
    case 21:
      return 'stand'
    case 19:
      // Double vs 6 in H17, otherwise Stand
      if (upcard === '6' && h17 && canDouble) return 'double'
      return 'stand'
    case 18:
      // vs 2-6: Double if allowed, else Stand
      if (['2', '3', '4', '5', '6'].includes(upcard)) {
        return canDouble ? 'double' : 'stand'
      }
      // vs 7, 8: Stand
      if (upcard === '7' || upcard === '8') {
        return 'stand'
      }
      // vs A in H17: Double if allowed, else Hit
      if (upcard === 'A' && h17 && canDouble) {
        return 'double'
      }
      // vs 9, 10, A: Hit
      return 'hit'
    case 17:
      // Double vs 3-6
      if (['3', '4', '5', '6'].includes(upcard)) {
        return canDouble ? 'double' : 'hit'
      }
      return 'hit'
    case 16:
    case 15:
      // Double vs 4-6
      if (['4', '5', '6'].includes(upcard)) {
        return canDouble ? 'double' : 'hit'
      }
      return 'hit'
    case 14:
    case 13:
      // Double vs 5, 6
      if (upcard === '5' || upcard === '6') {
        return canDouble ? 'double' : 'hit'
      }
      return 'hit'
    default:
      return 'hit'
  }
}

function getHardHandAction(
  hardTotal: number,
  upcard: DealerUpcardKey,
  canDouble: boolean,
  h17: boolean,
): ActionType {
  if (hardTotal >= 17) {
    return 'stand'
  }

  switch (hardTotal) {
    case 16:
    case 15:
    case 14:
    case 13:
      // Stand vs 2-6, Hit vs 7-A
      if (['2', '3', '4', '5', '6'].includes(upcard)) {
        return 'stand'
      }
      return 'hit'
    case 12:
      // Stand vs 4-6, Hit vs 2, 3, 7-A
      if (['4', '5', '6'].includes(upcard)) {
        return 'stand'
      }
      return 'hit'
    case 11:
      // Double vs 2-10, and vs A if H17
      if (upcard === 'A') {
        if (h17 && canDouble) return 'double'
        return 'hit'
      }
      return canDouble ? 'double' : 'hit'
    case 10:
      // Double vs 2-9
      if (['2', '3', '4', '5', '6', '7', '8', '9'].includes(upcard)) {
        return canDouble ? 'double' : 'hit'
      }
      return 'hit'
    case 9:
      // Double vs 3-6
      if (['3', '4', '5', '6'].includes(upcard)) {
        return canDouble ? 'double' : 'hit'
      }
      return 'hit'
    default:
      // 8 or below: Always Hit
      return 'hit'
  }
}
