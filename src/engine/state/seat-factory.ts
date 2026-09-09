import type { DifficultyTier, Seat } from '../types'
import { buildAIProfile } from '../ai/profile'
import { getOfflineCompanionSeed, type CompanionIdentity } from '../../services/companion-client'

export interface SeatInitializationOptions {
  readonly difficulty: DifficultyTier
  readonly companionCount: number
  readonly humanBankroll: number
  readonly companionIdentities?: readonly CompanionIdentity[] | undefined
}

/**
 * Creates the initial multi-seat table layout.
 * Human is strictly anchored at Seat Index 1 (Middle seat in 3-seat table).
 */
export function createTableSeats(options: SeatInitializationOptions): Seat[] {
  const { difficulty, companionCount, humanBankroll, companionIdentities } = options
  const seats: Seat[] = []
  const totalSeats = companionCount + 1
  const humanIndex = 1

  let companionIdCounter = 0

  for (let i = 0; i < totalSeats; i++) {
    if (i === humanIndex) {
      seats.push({
        id: 'seat_human',
        index: i,
        isHuman: true,
        bankroll: humanBankroll,
        currentBet: 0,
        insuranceBet: 0,
        hands: [],
        activeHandIndex: 0,
      })
    } else {
      const identity: CompanionIdentity =
        companionIdentities && companionIdentities[companionIdCounter]
          ? companionIdentities[companionIdCounter]!
          : getOfflineCompanionSeed(companionIdCounter)

      companionIdCounter++

      const profile = buildAIProfile(identity, difficulty, i)
      const startingBankroll = profile.baseMinBet * (difficulty === 'easy' ? 40 : 70)

      seats.push({
        id: profile.id,
        index: i,
        isHuman: false,
        profile,
        bankroll: startingBankroll,
        currentBet: 0,
        insuranceBet: 0,
        hands: [],
        activeHandIndex: 0,
      })
    }
  }

  return seats
}
