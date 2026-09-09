export interface AchievementDef {
  readonly id: string
  readonly pillar: string
  readonly track: string
  readonly name: string
  readonly description: string
  readonly icon: string
  readonly maxProgress: number | null
}

export const BLACKJACK_ACHIEVEMENTS: readonly AchievementDef[] = [
  {
    id: 'blackjack-21_natural_21',
    pillar: 'blackjack-21',
    track: 'Casino Classic',
    name: 'Natural 21',
    description: 'Get dealt a natural two-card Blackjack.',
    icon: 'blackjack',
    maxProgress: null,
  },
  {
    id: 'blackjack-21_split_master',
    pillar: 'blackjack-21',
    track: 'Tactics',
    name: 'The Split Master',
    description: 'Split a pair and win both resulting hands in one round.',
    icon: 'split',
    maxProgress: null,
  },
  {
    id: 'blackjack-21_double_trouble',
    pillar: 'blackjack-21',
    track: 'Tactics',
    name: 'Double Down Dynamo',
    description: 'Win a hand after doubling down your wager.',
    icon: 'double',
    maxProgress: null,
  },
  {
    id: 'blackjack-21_hot_streak',
    pillar: 'blackjack-21',
    track: 'Streak',
    name: 'Hot Streak',
    description: 'Win 5 consecutive rounds at the table.',
    icon: 'streak',
    maxProgress: 5,
  },
  {
    id: 'blackjack-21_high_roller',
    pillar: 'blackjack-21',
    track: 'Bankroll',
    name: 'High Roller',
    description: 'Reach an all-time peak bankroll of $5,000 chips or more.',
    icon: 'high-roller',
    maxProgress: 5000,
  },
  {
    id: 'blackjack-21_outplay_counter',
    pillar: 'blackjack-21',
    track: 'Mastery',
    name: 'Outsmart the Counter',
    description: 'Finish a shoe with higher net earnings than an Expert AI companion.',
    icon: 'card-counter',
    maxProgress: null,
  },
]
