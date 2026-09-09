import type { GameManifest, GameLegendItem } from '@nixlabs/game-core'
import cover from './cover.jpg'
import banner from './banner.jpg'

export const BLACKJACK_SLUG = 'blackjack-21' as const

const LEGEND: readonly GameLegendItem[] = [
  { swatch: 'amber', text: 'human player' },
  { swatch: 'graphite', text: 'ai companions' },
  { swatch: 'green', text: 'bankroll / candy' },
]

export const blackjack21Manifest: GameManifest = {
  slug: BLACKJACK_SLUG,
  title: 'Blackjack 21',
  tagline: 'Multi-seat casino blackjack with table companions and basic strategy.',
  description:
    'Take a seat at the felt alongside international table companions. Play classic multi-seat Blackjack with table strategy and running count telemetry across Casual, Regular, and High Roller tables.',
  status: 'playable',
  accent: 'amber',
  tags: ['casino', 'blackjack', 'cards', 'strategy', 'table'],
  cover,
  banner,
  bannerAspectRatio: '12 / 8',
  layout: 'horizontal',
  aspect: 16 / 9,
  scoreLabel: 'Peak Bankroll',
  formatScore: (score) => (score !== null && score !== undefined ? `€${score.toLocaleString()}` : '€0'),
  bonusLabel: 'Candy',
  primaryLabel: 'Play',
  scoringNote:
    'Grow your chips across shoe penetrations. Your all-time peak table bankroll determines your standing on the global leaderboard.',
  startLine: 'Place your wagers and press Deal to begin.',
  intro:
    'Classic multi-seat blackjack table. Hit, Stand, Double Down, or Split pairs against the house.',
  pauseNote: 'Table paused. Take your time between rounds.',
  tip: 'Basic Strategy yields a 99.5% theoretical return. Watch out for the running count on higher tiers.',
  legend: LEGEND,
  controls: [
    { input: 'Space / Enter', action: 'Deal / Start Round' },
    { input: 'H', action: 'Hit' },
    { input: 'S', action: 'Stand' },
    { input: 'D', action: 'Double Down' },
    { input: 'P', action: 'Split Pair' },
    { input: 'U', action: 'Surrender' },
    { input: '1-5', action: 'Select Bet Chips' },
    { input: 'C', action: 'Clear Bet' },
  ],
  mechanics: [
    {
      title: 'Table Companions',
      body: 'Companions seat themselves alongside you, each playing with distinct styles from relaxed table play to disciplined basic strategy and count tracking.',
    },
    {
      title: 'Casino Rules',
      body: 'Dealer stands on all 17s. Blackjack pays 3 to 2. Double down on any two initial cards, and split pairs to maximize your hands.',
    },
    {
      title: 'Shoe Penetration & Cut Card',
      body: 'A realistic 6-deck shoe with cut-card penetration. When the dealer draws past the marker, the shoe reshuffles at the end of the round.',
    },
  ],
  year: 2026,
}
