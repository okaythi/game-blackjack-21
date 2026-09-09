import type { Card, DealerHand, PlayerHand, Seat } from '../types'
import type { Shoe } from '../cards'
import { evaluateHand } from '../hand'

export interface DealStepTarget {
  readonly type: 'seat' | 'dealer'
  readonly seatIndex?: number
  readonly isVisible: boolean
}

/**
 * Builds the standard dealing sequence list:
 * Round 1: 1 card to each active player seat, 1 face-up card to dealer
 * Round 2: 1 card to each active player seat, 1 face-down hole card to dealer
 */
export function buildDealSequence(seats: readonly Seat[]): DealStepTarget[] {
  const activeSeats = seats.filter((s) => s.currentBet > 0)
  const sequence: DealStepTarget[] = []

  // Round 1
  for (const s of activeSeats) {
    sequence.push({ type: 'seat', seatIndex: s.index, isVisible: true })
  }
  sequence.push({ type: 'dealer', isVisible: true })

  // Round 2
  for (const s of activeSeats) {
    sequence.push({ type: 'seat', seatIndex: s.index, isVisible: true })
  }
  sequence.push({ type: 'dealer', isVisible: false })

  return sequence
}

/**
 * Deals a single card according to a sequence step.
 */
export function executeDealStep(
  step: DealStepTarget,
  seats: readonly Seat[],
  dealer: DealerHand,
  shoe: Shoe,
): { updatedSeats: Seat[]; updatedDealer: DealerHand; dealtCard: Card } {
  const dealtCard = shoe.dealCard(step.isVisible)
  const updatedSeats = [...seats]
  let updatedDealer = { ...dealer }

  if (step.type === 'dealer') {
    updatedDealer = {
      ...dealer,
      cards: [...dealer.cards, dealtCard],
    }
  } else if (step.seatIndex !== undefined) {
    const sIdx = step.seatIndex
    const seat = updatedSeats[sIdx]
    if (seat && seat.hands.length > 0) {
      const hand = seat.hands[0]!
      const updatedHand: PlayerHand = {
        ...hand,
        cards: [...hand.cards, dealtCard],
      }
      updatedSeats[sIdx] = {
        ...seat,
        hands: [updatedHand],
      }
    }
  }

  return { updatedSeats, updatedDealer, dealtCard }
}

/**
 * Evaluates all hands after initial 2-card deal finishes.
 */
export function finalizeInitialHands(seats: readonly Seat[]): Seat[] {
  return seats.map((seat) => {
    if (seat.hands.length === 0) return seat
    const hand = seat.hands[0]!
    const val = evaluateHand(hand.cards)
    const status = val.isBlackjack ? 'blackjack' : 'active'
    return {
      ...seat,
      hands: [{ ...hand, status }],
    }
  })
}
