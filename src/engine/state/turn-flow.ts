import type { Seat } from '../types'

export interface NextTurnTarget {
  readonly activeSeatIndex: number
  readonly activeHandIndex: number
  readonly isRoundOverForPlayers: boolean
}

/**
 * Pure function to scan the table seats and find the next active player hand.
 */
export function findNextPlayableHand(
  seats: readonly Seat[],
  startSeatIdx: number,
  startHandIdx: number,
): NextTurnTarget {
  for (let sIdx = startSeatIdx; sIdx < seats.length; sIdx++) {
    const seat = seats[sIdx]!
    if (seat.hands.length === 0) continue

    const hStart = sIdx === startSeatIdx ? startHandIdx : 0
    for (let hIdx = hStart; hIdx < seat.hands.length; hIdx++) {
      const hand = seat.hands[hIdx]!
      if (hand.status === 'active') {
        return {
          activeSeatIndex: sIdx,
          activeHandIndex: hIdx,
          isRoundOverForPlayers: false,
        }
      }
    }
  }

  return {
    activeSeatIndex: -1,
    activeHandIndex: 0,
    isRoundOverForPlayers: true,
  }
}
