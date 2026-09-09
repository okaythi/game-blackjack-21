import type { PlayerHand, TableRules, Card } from '../types'
import { evaluateHand } from '../hand'

export interface HandPayout {
  readonly result: PlayerHand['result']
  readonly payout: number
  readonly netWin: number
  readonly summary: string
}

/**
 * Pure function to resolve the payout of a single player hand against the dealer.
 */
export function evaluateHandPayout(
  hand: PlayerHand,
  dealerCards: readonly Card[],
  rules: TableRules,
): HandPayout {
  const playerVal = evaluateHand(hand.cards, hand.fromSplit)
  const dealerVal = evaluateHand(dealerCards)

  if (hand.status === 'surrendered') {
    return {
      result: 'surrendered',
      payout: hand.bet / 2,
      netWin: -hand.bet / 2,
      summary: 'Surrendered (half bet returned)',
    }
  }

  if (hand.status === 'busted') {
    return {
      result: 'loss',
      payout: 0,
      netWin: -hand.bet,
      summary: `Bust with ${playerVal.total}`,
    }
  }

  if (playerVal.isBlackjack) {
    if (dealerVal.isBlackjack) {
      return {
        result: 'push',
        payout: hand.bet,
        netWin: 0,
        summary: 'Natural Blackjack Push',
      }
    }
    const win = hand.bet * rules.blackjackPayoutRatio
    return {
      result: 'blackjack',
      payout: hand.bet + win,
      netWin: win,
      summary: `Natural Blackjack (3:2)`,
    }
  }

  if (dealerVal.isBlackjack) {
    return {
      result: 'loss',
      payout: 0,
      netWin: -hand.bet,
      summary: 'Dealer Natural Blackjack',
    }
  }

  if (dealerVal.isBust) {
    return {
      result: 'win',
      payout: hand.bet * 2,
      netWin: hand.bet,
      summary: `Dealer busts (${dealerVal.total}), Win`,
    }
  }

  if (playerVal.total > dealerVal.total) {
    return {
      result: 'win',
      payout: hand.bet * 2,
      netWin: hand.bet,
      summary: `Win (${playerVal.total} vs ${dealerVal.total})`,
    }
  }

  if (playerVal.total < dealerVal.total) {
    return {
      result: 'loss',
      payout: 0,
      netWin: -hand.bet,
      summary: `Loss (${playerVal.total} vs ${dealerVal.total})`,
    }
  }

  return {
    result: 'push',
    payout: hand.bet,
    netWin: 0,
    summary: `Push (${playerVal.total} vs ${dealerVal.total})`,
  }
}
