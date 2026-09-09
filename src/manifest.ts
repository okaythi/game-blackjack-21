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
  tagline: 'Multi-seat casino blackjack with unrigged Basic Strategy and Card Counting companions.',
  description:
    'Take a seat at the warm sandstone felt alongside international AI companions. Play mathematically authentic Blackjack with optimal Basic Strategy and card-counting telemetry across Easy, Normal, and Expert tables.',
  status: 'playable',
  accent: 'amber',
  tags: ['casino', 'blackjack', 'cards', 'strategy', 'ai'],
  cover,
  banner,
  bannerAspectRatio: '16 / 9',
  layout: 'horizontal',
  aspect: 16 / 9,
  scoreLabel: 'Peak Bankroll',
  formatScore: (score) => (score !== null && score !== undefined ? `$${score.toLocaleString()}` : '$0'),
  bonusLabel: 'Candy',
  primaryLabel: 'Play',
  scoringNote:
    'Grow your chips across shoe penetrations. Your all-time peak bankroll determines your standing on the global leaderboard.',
  startLine: 'Place your wagers and press Deal to begin.',
  intro:
    'Classic multi-seat blackjack table. Hit, Stand, Double Down, or Split pairs against the house.',
  pauseNote: 'Table paused. Take your time between rounds.',
  tip: 'Basic Strategy yields a 99.5% theoretical return. On Expert tables, watch out for the true count.',
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
      title: 'The Granular AI Spectrum',
      body: 'Companions navigate a granular spectrum from amateur dealer-mimics to master card counters executing the Illustrious 18 deviations.',
    },
    {
      title: 'Unrigged Mathematics',
      body: 'Cards are shuffled using unbiased Fisher-Yates and cryptographic pseudo-random number generation (zero modulo bias). The shoe is never manipulated.',
    },
    {
      title: 'Shoe Penetration & Cut Card',
      body: 'A realistic 6-deck shoe with cut-card penetration. When the dealer draws past the marker, the shoe reshuffles at the end of the round.',
    },
  ],
  year: 2026,
}
