import type { Card, DealerState, TableRules } from '../types'
import { evaluateHand } from '../hand'
import { Shoe } from '../cards'

export interface DealerStepResult {
  readonly dealer: DealerState
  readonly isTurnComplete: boolean
  readonly drawnCard?: Card
}

/**
 * Checks if dealer needs to draw another card according to table rules.
 */
export function dealerNeedsDraw(cards: readonly Card[], rules: TableRules): boolean {
  const val = evaluateHand(cards)
  if (val.total < 17) return true
  if (rules.dealerHitsSoft17 && val.total === 17 && val.isSoft) return true
  return false
}

/**
 * Executes one step of the dealer's turn.
 * 1. If hole card is hidden, reveals hole card and checks if draw is needed.
 * 2. Otherwise deals one card and evaluates if more cards are required.
 */
export function stepDealerTurn(
  dealer: DealerState,
  shoe: Shoe,
  rules: TableRules,
  allPlayerHandsBustedOrSurrendered: boolean,
): DealerStepResult {
  // Step 1: Reveal hole card
  if (dealer.holeCardHidden && dealer.cards.length > 1) {
    const revealedHoleCard = dealer.cards[1]!
    shoe.countVisibleCard(revealedHoleCard)

    const updatedDealer: DealerState = {
      ...dealer,
      holeCardHidden: false,
    }

    if (allPlayerHandsBustedOrSurrendered) {
      return { dealer: updatedDealer, isTurnComplete: true }
    }

    const needsMore = dealerNeedsDraw(updatedDealer.cards, rules)
    return { dealer: updatedDealer, isTurnComplete: !needsMore }
  }

  // Step 2: Draw 1 card if needed
  if (dealerNeedsDraw(dealer.cards, rules)) {
    const drawnCard = shoe.dealCard(true)
    const updatedCards = [...dealer.cards, drawnCard]
    const updatedDealer: DealerState = {
      ...dealer,
      cards: updatedCards,
      holeCardHidden: false,
    }
    const needsMore = dealerNeedsDraw(updatedCards, rules)
    return { dealer: updatedDealer, isTurnComplete: !needsMore, drawnCard }
  }

  return { dealer, isTurnComplete: true }
}
