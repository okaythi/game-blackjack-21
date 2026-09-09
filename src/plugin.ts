import type { GamePlugin } from '@nixlabs/game-core'
import { blackjack21Manifest } from './manifest'
import { createBlackjackRuntime } from './runtime'
import { BLACKJACK_ACHIEVEMENTS } from './achievements'
import { blackjackProfileCard } from './profile-card'
import { BlackjackStage } from './render/blackjack-stage'

export const blackjack21Plugin: GamePlugin = {
  manifest: blackjack21Manifest,
  Component: BlackjackStage,
  createRuntime: createBlackjackRuntime,
  achievements: BLACKJACK_ACHIEVEMENTS,
  profileCard: blackjackProfileCard,
  scoring: {
    mode: 'points',
    hasValidScore: (score) => score !== null && score > 0,
    formatScore: (score) => (score !== null && score !== undefined ? `€${score.toLocaleString()}` : '€0'),
  },
}

export default blackjack21Plugin
