import type { DifficultyTier, RoundPhase } from '../../engine/types'

interface TableHeaderProps {
  readonly difficulty: DifficultyTier
  readonly companionCount: number
  readonly phase: RoundPhase
  readonly isTurbo: boolean
  readonly isMuted: boolean
  readonly onSelectDifficulty: (tier: DifficultyTier) => void
  readonly onSelectCompanions: (count: 1 | 2 | 3) => void
  readonly onToggleTurbo: () => void
  readonly onToggleMute: () => void
  readonly onRequestLeaveTable?: (() => void) | undefined
}

export function TableHeader({
  difficulty,
  companionCount,
  phase,
  isTurbo,
  isMuted,
  onSelectDifficulty,
  onSelectCompanions,
  onToggleTurbo,
  onToggleMute,
  onRequestLeaveTable,
}: TableHeaderProps) {
  const canModifyTable = phase === 'betting' || phase === 'round_over'

  return (
    <header
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '6px',
        marginBottom: '6px',
        padding: '5px 10px',
        background: 'rgba(24, 24, 27, 0.9)',
        borderRadius: '8px',
        border: '1px solid rgba(217, 119, 6, 0.25)',
        backdropFilter: 'blur(8px)',
        fontSize: '11px',
        color: '#d4d4d8',
      }}
    >
      {/* Left: Game Title & Difficulty Tier */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <span style={{ color: '#fef08a', fontWeight: 800, letterSpacing: '0.5px' }}>
          BLACKJACK 21
        </span>
        <span style={{ color: '#52525b' }}>•</span>
        <span style={{ color: '#a1a1aa' }}>Tier:</span>
        {([
          { id: 'easy', label: 'Easy', title: 'Easy Mode (~0.2% edge): 3:2 BJ, S17, Double Any Two, DAS, Late Surrender' },
          { id: 'normal', label: 'Normal', title: 'Normal Mode (~0.5% edge): 3:2 BJ, S17, 6-Deck Shoe, DAS, No Surrender' },
          { id: 'hard', label: 'Hard', title: 'Hard Mode (~2.0%+ edge): 6:5 BJ, H17, Double 9-11 only, No Resplit Aces' },
        ] as const).map((tier) => {
          const isActive = difficulty === tier.id || (tier.id === 'hard' && difficulty === 'expert')
          return (
            <button
              key={tier.id}
              type="button"
              title={tier.title}
              disabled={!canModifyTable}
              onClick={() => onSelectDifficulty(tier.id)}
              style={{
                background: isActive ? '#d97706' : 'rgba(255,255,255,0.06)',
                color: isActive ? '#ffffff' : '#a1a1aa',
                border: 'none',
                borderRadius: '4px',
                padding: '2px 6px',
                fontSize: '10.5px',
                fontWeight: 700,
                cursor: canModifyTable ? 'pointer' : 'not-allowed',
                textTransform: 'capitalize',
              }}
            >
              {tier.label}
            </button>
          )
        })}
      </div>

      {/* Right: Companions, Turbo, Audio & Cash Out */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
          <span style={{ color: '#a1a1aa' }}>Companions:</span>
          {([1, 2, 3] as const).map((cnt) => (
            <button
              key={cnt}
              type="button"
              disabled={!canModifyTable}
              onClick={() => onSelectCompanions(cnt)}
              style={{
                background: companionCount === cnt ? '#d97706' : 'rgba(255,255,255,0.06)',
                color: companionCount === cnt ? '#ffffff' : '#a1a1aa',
                border: 'none',
                borderRadius: '4px',
                padding: '2px 5px',
                fontSize: '10.5px',
                fontWeight: 700,
                cursor: canModifyTable ? 'pointer' : 'not-allowed',
              }}
            >
              {cnt}
            </button>
          ))}
        </div>

        {/* Turbo Toggle */}
        <button
          type="button"
          onClick={onToggleTurbo}
          style={{
            background: isTurbo ? 'rgba(245, 158, 11, 0.2)' : 'rgba(255,255,255,0.06)',
            color: isTurbo ? '#fef08a' : '#a1a1aa',
            border: `1px solid ${isTurbo ? '#d97706' : 'rgba(255,255,255,0.1)'}`,
            borderRadius: '5px',
            padding: '2px 6px',
            fontSize: '10.5px',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '3px',
          }}
        >
          <span>⚡</span>
          <span>{isTurbo ? 'Turbo' : 'Normal'}</span>
        </button>

        {/* Audio Mute */}
        <button
          type="button"
          onClick={onToggleMute}
          style={{
            background: 'rgba(255,255,255,0.06)',
            color: '#a1a1aa',
            border: 'none',
            borderRadius: '5px',
            padding: '2px 6px',
            fontSize: '11px',
            cursor: 'pointer',
          }}
          aria-label={isMuted ? 'Unmute Audio' : 'Mute Audio'}
        >
          {isMuted ? '🔇' : '🔊'}
        </button>

        {/* Leave Table / Cash Out Button */}
        {onRequestLeaveTable && (
          <button
            type="button"
            disabled={!canModifyTable}
            onClick={onRequestLeaveTable}
            style={{
              background: 'rgba(220, 38, 38, 0.15)',
              color: canModifyTable ? '#fca5a5' : '#71717a',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: '5px',
              padding: '2px 8px',
              fontSize: '10.5px',
              fontWeight: 700,
              cursor: canModifyTable ? 'pointer' : 'not-allowed',
            }}
          >
            Cash Out
          </button>
        )}
      </div>
    </header>
  )
}
