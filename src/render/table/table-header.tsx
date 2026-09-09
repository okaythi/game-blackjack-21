import type { DifficultyTier, RoundPhase } from '../../engine/types'

interface TableHeaderProps {
  readonly difficulty: DifficultyTier
  readonly companionCount: number
  readonly phase: RoundPhase
  readonly isTurbo: boolean
  readonly isMuted: boolean
  readonly isTrainerOpen?: boolean | undefined
  readonly isTrainerAvailable?: boolean | undefined
  readonly onSelectDifficulty: (tier: DifficultyTier) => void
  readonly onSelectCompanions: (count: 1 | 2 | 3) => void
  readonly onToggleTurbo: () => void
  readonly onToggleMute: () => void
  readonly onToggleTrainer?: (() => void) | undefined
  readonly onRequestLeaveTable?: (() => void) | undefined
}

export function TableHeader({
  difficulty,
  companionCount,
  phase,
  isTurbo,
  isMuted,
  isTrainerOpen = false,
  isTrainerAvailable = true,
  onSelectDifficulty,
  onSelectCompanions,
  onToggleTurbo,
  onToggleMute,
  onToggleTrainer,
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
              title={canModifyTable ? tier.title : 'Tier locked during round'}
              disabled={!canModifyTable}
              onClick={() => onSelectDifficulty(tier.id)}
              style={{
                background: isActive ? '#d97706' : 'rgba(255,255,255,0.06)',
                color: isActive ? '#ffffff' : canModifyTable ? '#a1a1aa' : '#52525b',
                border: 'none',
                borderRadius: '4px',
                padding: '2px 6px',
                fontSize: '10.5px',
                fontWeight: 700,
                cursor: canModifyTable ? 'pointer' : 'not-allowed',
                opacity: canModifyTable ? 1 : 0.5,
                textTransform: 'capitalize',
              }}
            >
              {tier.label}
            </button>
          )
        })}
      </div>

      {/* Right: Companions, Speed Segmented Control, Trainer, Audio & Cash Out */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
          <span style={{ color: '#a1a1aa' }}>Companions:</span>
          {([1, 2, 3] as const).map((cnt) => (
            <button
              key={cnt}
              type="button"
              title={canModifyTable ? undefined : 'Companions locked during round'}
              disabled={!canModifyTable}
              onClick={() => onSelectCompanions(cnt)}
              style={{
                background: companionCount === cnt ? '#d97706' : 'rgba(255,255,255,0.06)',
                color: companionCount === cnt ? '#ffffff' : canModifyTable ? '#a1a1aa' : '#52525b',
                border: 'none',
                borderRadius: '4px',
                padding: '2px 5px',
                fontSize: '10.5px',
                fontWeight: 700,
                cursor: canModifyTable ? 'pointer' : 'not-allowed',
                opacity: canModifyTable ? 1 : 0.5,
              }}
            >
              {cnt}
            </button>
          ))}
        </div>

        {/* Speed Segmented Control (Intuitive Normal vs Turbo) */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            background: 'rgba(255,255,255,0.06)',
            borderRadius: '6px',
            padding: '2px',
            gap: '2px',
            border: '1px solid rgba(255,255,255,0.08)',
          }}
        >
          <span style={{ color: '#71717a', fontSize: '9.5px', padding: '0 3px', fontWeight: 600 }}>Speed</span>
          <button
            type="button"
            onClick={() => isTurbo && onToggleTurbo()}
            style={{
              background: !isTurbo ? '#d97706' : 'transparent',
              color: !isTurbo ? '#ffffff' : '#a1a1aa',
              border: 'none',
              borderRadius: '4px',
              padding: '2px 5px',
              fontSize: '10px',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            Normal
          </button>
          <button
            type="button"
            onClick={() => !isTurbo && onToggleTurbo()}
            style={{
              background: isTurbo ? '#d97706' : 'transparent',
              color: isTurbo ? '#ffffff' : '#a1a1aa',
              border: 'none',
              borderRadius: '4px',
              padding: '2px 5px',
              fontSize: '10px',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            ⚡ Turbo
          </button>
        </div>

        {/* Strategy Trainer Toggle Button (Integrated directly into header) */}
        {isTrainerAvailable && onToggleTrainer && (
          <button
            type="button"
            onClick={onToggleTrainer}
            style={{
              background: isTrainerOpen ? '#d97706' : 'rgba(255,255,255,0.06)',
              color: isTrainerOpen ? '#ffffff' : '#fef08a',
              border: '1px solid ' + (isTrainerOpen ? '#b45309' : 'rgba(217, 119, 6, 0.4)'),
              borderRadius: '5px',
              padding: '2px 7px',
              fontSize: '10.5px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '3px',
            }}
            title="Toggle Strategy Trainer & Hi-Lo Telemetry"
          >
            <span>🎓</span>
            <span>Trainer</span>
          </button>
        )}

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
              opacity: canModifyTable ? 1 : 0.5,
            }}
          >
            Cash Out
          </button>
        )}
      </div>
    </header>
  )
}
