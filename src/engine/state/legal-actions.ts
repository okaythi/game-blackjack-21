import type { LegalActions, RoundPhase, Seat, TableRules } from '../types'
import {
  canDoubleHand,
  canHitHand,
  canSplitHand,
  canStandHand,
  canSurrenderHand,
  evaluateHand,
} from '../hand'

export function getEmptyLegalActions(): LegalActions {
  return {
    canHit: false,
    canStand: false,
    canDouble: false,
    canSplit: false,
    canSurrender: false,
    canInsurance: false,
  }
}

/**
 * Pure resolver determining legal actions for a specific seat and hand.
 */
export function calculateLegalActions(
  seats: readonly Seat[],
  phase: RoundPhase,
  activeSeatIndex: number,
  activeHandIndex: number,
  rules: TableRules,
  targetSeatIndex?: number,
  targetHandIndex?: number,
): LegalActions {
  const sIdx = targetSeatIndex ?? activeSeatIndex
  const hIdx = targetHandIndex ?? activeHandIndex

  if (phase === 'insurance') {
    const seat = seats[sIdx]
    if (!seat) return getEmptyLegalActions()
    const insuranceCost = Math.floor(seat.currentBet / 2)
    const canInsurance = seat.bankroll >= insuranceCost
    return {
      canHit: false,
      canStand: false,
      canDouble: false,
      canSplit: false,
      canSurrender: false,
      canInsurance,
    }
  }

  if (phase !== 'player_turns') {
    return getEmptyLegalActions()
  }

  const seat = seats[sIdx]
  if (!seat) return getEmptyLegalActions()
  const hand = seat.hands[hIdx]
  if (!hand || hand.status !== 'active') return getEmptyLegalActions()

  const val = evaluateHand(hand.cards, hand.fromSplit)

  return {
    canHit: canHitHand(val),
    canStand: canStandHand(val),
    canDouble: canDoubleHand(hand.cards, seat.bankroll, hand.bet, rules, hand.fromSplit),
    canSplit: canSplitHand(
      hand.cards,
      seat.bankroll,
      hand.bet,
      seat.hands.length,
      rules,
      hand.fromSplit,
    ),
    canSurrender: canSurrenderHand(hand.cards, rules, hand.fromSplit),
    canInsurance: false,
  }
}
