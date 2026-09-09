import type { ActionType, LegalActions, PlayerHand, Seat, TableRules } from '../types'
import type { Shoe } from '../cards'
import { evaluateHand } from '../hand'

export interface ActionResult {
  readonly updatedSeats: Seat[]
  readonly mustAdvanceHand: boolean
}

/**
 * Pure handler executing a player action (hit, stand, double, split, surrender)
 * on the active seat and hand.
 */
export function executePlayerAction(
  action: ActionType,
  seats: readonly Seat[],
  seatIdx: number,
  handIdx: number,
  shoe: Shoe,
  rules: TableRules,
  legal: LegalActions,
): ActionResult {
  const seat = seats[seatIdx]
  if (!seat) throw new Error(`Invalid active seat ${seatIdx}`)
  const hand = seat.hands[handIdx]
  if (!hand) throw new Error(`Invalid active hand ${handIdx}`)

  const updatedSeats = [...seats]

  switch (action) {
    case 'hit': {
      if (!legal.canHit) throw new Error('Action hit is not legal')
      const card = shoe.dealCard(true)
      const newCards = [...hand.cards, card]
      const val = evaluateHand(newCards, hand.fromSplit)

      if (val.isBust) {
        const updatedHands = seat.hands.map((h, i) =>
          i === handIdx
            ? { ...h, cards: newCards, status: 'busted' as const, result: 'loss' as const }
            : h,
        )
        updatedSeats[seatIdx] = { ...seat, hands: updatedHands }
        return { updatedSeats, mustAdvanceHand: true }
      } else if (val.total === 21) {
        const updatedHands = seat.hands.map((h, i) =>
          i === handIdx ? { ...h, cards: newCards, status: 'stood' as const } : h,
        )
        updatedSeats[seatIdx] = { ...seat, hands: updatedHands }
        return { updatedSeats, mustAdvanceHand: true }
      } else {
        const updatedHands = seat.hands.map((h, i) =>
          i === handIdx ? { ...h, cards: newCards } : h,
        )
        updatedSeats[seatIdx] = { ...seat, hands: updatedHands }
        return { updatedSeats, mustAdvanceHand: false }
      }
    }

    case 'stand': {
      if (!legal.canStand) throw new Error('Action stand is not legal')
      const updatedHands = seat.hands.map((h, i) =>
        i === handIdx ? { ...h, status: 'stood' as const } : h,
      )
      updatedSeats[seatIdx] = { ...seat, hands: updatedHands }
      return { updatedSeats, mustAdvanceHand: true }
    }

    case 'double': {
      if (!legal.canDouble) throw new Error('Action double is not legal')
      const additionalBet = hand.bet
      const newBankroll = seat.bankroll - additionalBet
      const card = shoe.dealCard(true)
      const newCards = [...hand.cards, card]
      const val = evaluateHand(newCards, hand.fromSplit)
      const newStatus = val.isBust ? 'busted' : 'doubled'
      const newResult = val.isBust ? 'loss' : 'pending'

      const updatedHands = seat.hands.map((h, i) =>
        i === handIdx
          ? {
              ...h,
              cards: newCards,
              bet: hand.bet * 2,
              status: newStatus as PlayerHand['status'],
              result: newResult as PlayerHand['result'],
            }
          : h,
      )
      updatedSeats[seatIdx] = { ...seat, bankroll: newBankroll, hands: updatedHands }
      return { updatedSeats, mustAdvanceHand: true }
    }

    case 'split': {
      if (!legal.canSplit) throw new Error('Action split is not legal')
      const splitBet = hand.bet
      const newBankroll = seat.bankroll - splitBet

      const card0 = hand.cards[0]!
      const card1 = hand.cards[1]!

      const newCard0 = shoe.dealCard(true)
      const newCard1 = shoe.dealCard(true)

      const isAcesSplit = card0.rank === 'A' || card1.rank === 'A'
      const hand0Status = isAcesSplit && !rules.resplitAces ? 'stood' : 'active'
      const hand1Status = isAcesSplit && !rules.resplitAces ? 'stood' : 'active'

      const hand0: PlayerHand = {
        id: `${seat.id}_h${seat.hands.length}_0`,
        cards: [card0, newCard0],
        bet: splitBet,
        status: hand0Status,
        result: 'pending',
        payout: 0,
        fromSplit: true,
      }

      const hand1: PlayerHand = {
        id: `${seat.id}_h${seat.hands.length}_1`,
        cards: [card1, newCard1],
        bet: splitBet,
        status: hand1Status,
        result: 'pending',
        payout: 0,
        fromSplit: true,
      }

      const updatedHands = [
        ...seat.hands.slice(0, handIdx),
        hand0,
        hand1,
        ...seat.hands.slice(handIdx + 1),
      ]

      const mustAdvanceHand = hand0Status !== 'active'
      updatedSeats[seatIdx] = { ...seat, bankroll: newBankroll, hands: updatedHands }
      return { updatedSeats, mustAdvanceHand }
    }

    case 'surrender': {
      if (!legal.canSurrender) throw new Error('Action surrender is not legal')
      const updatedHands = seat.hands.map((h, i) =>
        i === handIdx
          ? { ...h, status: 'surrendered' as const, result: 'surrendered' as const }
          : h,
      )
      updatedSeats[seatIdx] = { ...seat, hands: updatedHands }
      return { updatedSeats, mustAdvanceHand: true }
    }

    default:
      throw new Error(`Unexpected action ${action} during player turns`)
  }
}
