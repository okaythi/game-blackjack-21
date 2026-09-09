import { blackjack_21Manifest } from './manifest'
import { createBlackjack21Runtime } from './runtime'
import { blackjack_21Achievements } from './achievements'
import { blackjack_21ProfileCard } from './profile-card'

export const gamePlugin = {
  manifest: blackjack_21Manifest,
  createRuntime: createBlackjack21Runtime,
  achievements: blackjack_21Achievements,
  profileCard: blackjack_21ProfileCard,
  scoring: {
    mode: 'points',
    hasValidScore: (s: number | null) => s !== null && s > 0,
  },
}

export default gamePlugin
