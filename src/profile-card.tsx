import type React from 'react'

export const blackjack_21ProfileCard = {
  getMetrics: ({ stat }: any) => [
    { label: 'Personal Best', value: stat?.highscore ? String(stat.highscore) : '—' },
    { label: 'World Record', value: stat?.globalHighscore ? String(stat.globalHighscore) : '—' },
  ],
  runsLabel: 'Matches Played',
  actionLabel: {
    owner: 'Play Again',
    other: 'Challenge PB',
  },
}
