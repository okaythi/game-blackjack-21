/**
 * Blackjack 21 — Novice Amateur Heuristic AI
 * 
 * Implements simplified amateur behavior:
 * - Dealer mimic heuristic: hits hard <= 16, stands hard >= 17
 * - Misplays soft hands (stands on soft 17/18, hits blindly)
 * - Never splits, never doubles down, never surrenders
 * - Never buys insurance
 */

import { evaluateHand } from '../hand'
import type { ActionType, Card } from '../types'

/**
 * Returns novice action for a hand.
 */
export function getEasyAIAction(cards: readonly Card[]): ActionType {
  const handVal = evaluateHand(cards)

  if (handVal.isBust || handVal.total >= 21) {
    return 'stand'
  }

  // Novice dealer mimic heuristic:
  // If soft total is 17 or 18, novice stands thinking they have 17 or 18
  if (handVal.isSoft) {
    if (handVal.total >= 17) {
      return 'stand'
    }
    return 'hit'
  }

  // Hard total: hit <= 16, stand >= 17
  if (handVal.total <= 16) {
    return 'hit'
  }

  return 'stand'
}
