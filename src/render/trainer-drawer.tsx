import type { ActionType, DifficultyTier, TableTelemetry } from '../engine/types'

interface TrainerDrawerProps {
  readonly tier: DifficultyTier
  readonly telemetry: TableTelemetry
  readonly optimalAction?: ActionType | undefined
  readonly lastMistake?: string | null
  readonly isOpen: boolean
  readonly onClose: () => void
}

export function TrainerDrawer({
  tier,
  telemetry,
  optimalAction,
  lastMistake = null,
  isOpen,
  onClose,
}: TrainerDrawerProps) {
  // If Hard/Expert, strictly disabled
  if (tier === 'expert' || tier === 'hard') {
    return null
  }

  if (!isOpen) {
    return null
  }

  const actionLabels: Record<ActionType, { text: string; color: string }> = {
    hit: { text: 'HIT', color: '#16a34a' },
    stand: { text: 'STAND', color: '#dc2626' },
    double: { text: 'DOUBLE DOWN', color: '#d97706' },
    split: { text: 'SPLIT PAIR', color: '#7c3aed' },
    surrender: { text: 'SURRENDER', color: '#71717a' },
    insurance_yes: { text: 'TAKE INSURANCE', color: '#16a34a' },
    insurance_no: { text: 'DECLINE INSURANCE', color: '#dc2626' },
  }

  return (
    <aside
      className="trainer-drawer"
      aria-label="Strategy Trainer and Card Telemetry"
      style={{
        position: 'absolute',
        top: '40px',
        right: '12px',
        zIndex: 50,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-end',
      }}
    >
      {/* Drawer Panel */}
      <div
        style={{
          background: 'rgba(24, 24, 27, 0.96)',
          border: '1px solid #d97706',
          borderRadius: '12px',
          padding: '12px 16px',
          width: '240px',
          boxShadow: '0 10px 25px rgba(0, 0, 0, 0.6)',
          backdropFilter: 'blur(10px)',
          color: '#e4e4e7',
          fontSize: '12.5px',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '8px',
            borderBottom: '1px solid rgba(255,255,255,0.1)',
            paddingBottom: '6px',
          }}
        >
          <strong style={{ color: '#fef08a', fontSize: '12px', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
            Trainer Telemetry
          </strong>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#a1a1aa',
              fontSize: '13px',
              cursor: 'pointer',
              padding: '0 4px',
            }}
            title="Close Trainer"
          >
            ✕
          </button>
        </div>

          {/* Optimal Action Hint */}
          {optimalAction && (
            <div style={{ marginBottom: '10px', background: 'rgba(0,0,0,0.3)', padding: '8px 10px', borderRadius: '6px' }}>
              <div style={{ color: '#a1a1aa', fontSize: '11px', marginBottom: '2px' }}>Basic Strategy Advice:</div>
              <div
                style={{
                  fontWeight: 800,
                  fontSize: '14px',
                  color: actionLabels[optimalAction]?.color ?? '#fef08a',
                }}
              >
                {actionLabels[optimalAction]?.text ?? optimalAction.toUpperCase()}
              </div>
            </div>
          )}

          {/* Hi-Lo Counting Telemetry */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '10px' }}>
            <div style={{ background: 'rgba(255,255,255,0.04)', padding: '6px 8px', borderRadius: '6px' }}>
              <div style={{ fontSize: '10.5px', color: '#a1a1aa' }}>Running Count</div>
              <div
                style={{
                  fontSize: '16px',
                  fontWeight: 800,
                  color: telemetry.runningCount > 0 ? '#4ade80' : telemetry.runningCount < 0 ? '#f87171' : '#e4e4e7',
                }}
              >
                {telemetry.runningCount > 0 ? `+${telemetry.runningCount}` : telemetry.runningCount}
              </div>
            </div>

            <div style={{ background: 'rgba(255,255,255,0.04)', padding: '6px 8px', borderRadius: '6px' }}>
              <div style={{ fontSize: '10.5px', color: '#a1a1aa' }}>True Count</div>
              <div
                style={{
                  fontSize: '16px',
                  fontWeight: 800,
                  color: telemetry.trueCount >= 2 ? '#fbbf24' : telemetry.trueCount < 0 ? '#f87171' : '#e4e4e7',
                }}
              >
                {telemetry.trueCount > 0 ? `+${telemetry.trueCount.toFixed(1)}` : telemetry.trueCount.toFixed(1)}
              </div>
            </div>
          </div>

          {/* Shoe Penetration Meter */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#a1a1aa', marginBottom: '3px' }}>
              <span>Shoe Penetration</span>
              <span>{telemetry.decksRemaining.toFixed(1)} decks left</span>
            </div>
            <div style={{ height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '999px', overflow: 'hidden' }}>
              <div
                style={{
                  height: '100%',
                  width: `${Math.min(100, Math.max(0, 100 - (telemetry.decksRemaining / 6) * 100))}%`,
                  background: telemetry.cutCardReached ? '#dc2626' : '#f59e0b',
                  borderRadius: '999px',
                  transition: 'width 0.3s ease',
                }}
              />
            </div>
            {telemetry.cutCardReached && (
              <span style={{ fontSize: '10px', color: '#ef4444', display: 'block', marginTop: '3px' }}>
                ⚠️ Cut card reached. Reshuffle after round.
              </span>
            )}
          </div>

          {/* Last Mistake Feedback */}
          {lastMistake && (
            <div
              style={{
                marginTop: '10px',
                background: 'rgba(239, 68, 68, 0.12)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                padding: '6px 8px',
                borderRadius: '6px',
                fontSize: '11px',
                color: '#fca5a5',
              }}
            >
              ⚠️ {lastMistake}
            </div>
          )}
        </div>
      </aside>
    )
  }
