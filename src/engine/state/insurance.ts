import type { ActionType, DealerHand, Seat } from '../types'
import type { Shoe } from '../cards'
import { evaluateHand } from '../hand'

export interface InsuranceStepResult {
  readonly updatedSeats: Seat[]
  readonly updatedQueue: number[]
  readonly nextActiveSeatIndex: number
  readonly isInsuranceComplete: boolean
}

export function handleInsuranceDecision(
  action: ActionType,
  seats: readonly Seat[],
  activeSeatIndex: number,
  insuranceQueue: readonly number[],
): InsuranceStepResult {
  const updatedSeats = [...seats]
  const seat = updatedSeats[activeSeatIndex]

  if (seat) {
    if (action === 'insurance_yes') {
      const cost = Math.floor(seat.currentBet / 2)
      if (seat.bankroll >= cost) {
        updatedSeats[activeSeatIndex] = {
          ...seat,
          bankroll: seat.bankroll - cost,
          insuranceBet: cost,
        }
      }
    } else {
      updatedSeats[activeSeatIndex] = {
        ...seat,
        insuranceBet: 0,
      }
    }
  }

  const updatedQueue = insuranceQueue.slice(1)
  const isInsuranceComplete = updatedQueue.length === 0
  const nextActiveSeatIndex = isInsuranceComplete ? -1 : updatedQueue[0]!

  return {
    updatedSeats,
    updatedQueue,
    nextActiveSeatIndex,
    isInsuranceComplete,
  }
}

export interface DealerPeekResult {
  readonly dealerHasBlackjack: boolean
  readonly updatedDealer: DealerHand
  readonly updatedSeats: Seat[]
}

export function resolveDealerPeekLogic(
  dealer: DealerHand,
  seats: readonly Seat[],
  shoe: Shoe,
): DealerPeekResult {
  const dealerVal = evaluateHand(dealer.cards)

  if (dealerVal.isBlackjack) {
    // Reveal hole card
    const updatedDealer: DealerHand = { ...dealer, holeCardHidden: false }
    if (dealer.cards.length > 1) {
      shoe.countVisibleCard(dealer.cards[1]!)
    }

    // Pay insurance 2:1
    const updatedSeats = seats.map((seat) => {
      if (seat.insuranceBet > 0) {
        const payout = seat.insuranceBet * 3 // Original + 2:1 profit
        return { ...seat, bankroll: seat.bankroll + payout }
      }
      return seat
    })

    return {
      dealerHasBlackjack: true,
      updatedDealer,
      updatedSeats,
    }
  }

  // Dealer does not have blackjack: forfeit insurance bets
  const updatedSeats = seats.map((seat) => ({ ...seat, insuranceBet: 0 }))
  return {
    dealerHasBlackjack: false,
    updatedDealer: dealer,
    updatedSeats,
  }
}
