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

/**
 * Calculates a "naturally dumb" casual casino player bet for Easy mode.
 * Real recreational human casino behavior:
 * - Hot hand fallacy: presses bet after wins / blackjacks (+€5 or +€10)
 * - Gambler's fallacy: chases losses after a loss thinking a win is "due" (+€5) or drops back to min
 * - Superstitious consistency: keeps same bet on push
 * - Clean casual denominations: only bets clean multiples of €5 (€10, €15, €20, €25, €30, €35, €50)
 * - Never makes nonsensical mathematical bets or random noisy bets
 */
export function calculateNaturallyDumbBet(
  bankroll: number,
  tableMinBet: number = 10,
  lastResult?: string | undefined,
  lastBet?: number | undefined,
): number {
  const min = Math.max(10, tableMinBet)
  if (bankroll <= min) return Math.min(bankroll, min)

  const previous = lastBet && lastBet >= min ? lastBet : min
  let target = min

  if (!lastResult || lastResult === 'pending') {
    // Session start / fresh shoe: casual hunch (€10, occasionally €15 or €20)
    const hunches = [min, min, min, min + 5, min + 10]
    target = hunches[Math.floor(Math.random() * hunches.length)] ?? min
  } else if (lastResult === 'win' || lastResult === 'blackjack') {
    // Hot hand fallacy: "I'm on a roll, press it!"
    if (Math.random() < 0.65) {
      target = previous + (lastResult === 'blackjack' ? 10 : 5)
    } else {
      target = previous
    }
  } else if (lastResult === 'loss') {
    // Gambler's fallacy: 40% chase loss, 60% retreat to base min
    if (Math.random() < 0.40 && previous < 35) {
      target = previous + 5
    } else {
      target = min
    }
  } else if (lastResult === 'push') {
    // Push: let it ride
    target = previous
  } else {
    target = min
  }

  // Easy mode ceiling: casual recreational cap (€50, max 15% of bankroll)
  const maxEasy = Math.max(min, Math.min(50, Math.floor(bankroll * 0.15)))
  const clamped = Math.max(min, Math.min(target, maxEasy))

  // Clean multiples of €5
  const rounded = Math.round(clamped / 5) * 5
  return Math.max(min, Math.min(bankroll, rounded))
}

