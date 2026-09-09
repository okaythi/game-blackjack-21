import type { GamePluginProfileCard, ProfileCardProps } from '@nixlabs/game-core'

export const blackjackProfileCard: GamePluginProfileCard = {
  getMetrics: ({ stat }: ProfileCardProps) => [
    {
      label: 'Peak Bankroll',
      value: stat?.highscore !== null && stat?.highscore !== undefined ? `$${stat.highscore.toLocaleString()}` : '—',
    },
    {
      label: 'World Record',
      value:
        stat?.globalHighscore !== null && stat?.globalHighscore !== undefined
          ? `$${stat.globalHighscore.toLocaleString()}`
          : '—',
    },
  ],
  runsLabel: 'Hands Played',
  actionLabel: {
    owner: 'Take a Seat',
    other: 'Challenge Bankroll',
  },
}
