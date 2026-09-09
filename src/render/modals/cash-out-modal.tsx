import { calculateCashableChips } from '../../engine/economy'

interface CashOutModalProps {
  readonly currentChips: number
  readonly depositedEur: number
  readonly bonusEur: number
  readonly onConfirmLeave: (candiesReturn: number) => void
  readonly onCancel: () => void
}

export function CashOutModal({
  currentChips,
  depositedEur,
  bonusEur,
  onConfirmLeave,
  onCancel,
}: CashOutModalProps) {
  const { cashableEur, lockedBonusEur, candiesReturn } = calculateCashableChips({
    depositedEur,
    bonusEur,
    currentChips,
  })

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(9, 9, 11, 0.85)',
        backdropFilter: 'blur(10px)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
      }}
    >
      <div
        style={{
          background: 'linear-gradient(145deg, #1c1a17 0%, #141210 100%)',
          border: '1px solid rgba(217, 119, 6, 0.5)',
          boxShadow: '0 20px 50px rgba(0,0,0,0.8)',
          borderRadius: '20px',
          maxWidth: '440px',
          width: '100%',
          padding: '24px',
          color: '#f4f4f5',
          textAlign: 'center',
          boxSizing: 'border-box',
        }}
      >
        <h3
          style={{
            margin: '0 0 6px',
            fontSize: '20px',
            fontWeight: 800,
            color: '#fef08a',
          }}
        >
          Leave the Table?
        </h3>
        <p style={{ margin: '0 0 16px', fontSize: '13px', color: '#a1a1aa' }}>
          Cash out your remaining table chips back into Candies.
        </p>

        <div
          style={{
            background: 'rgba(0, 0, 0, 0.4)',
            borderRadius: '12px',
            padding: '14px',
            marginBottom: '18px',
            textAlign: 'left',
            fontSize: '13px',
            border: '1px solid rgba(255,255,255,0.08)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
            <span style={{ color: '#a1a1aa' }}>Total Table Chips:</span>
            <span style={{ fontWeight: 700 }}>€{currentChips}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
            <span style={{ color: '#a1a1aa' }}>Cashable Chips:</span>
            <span style={{ fontWeight: 700, color: '#fef08a' }}>€{cashableEur}</span>
          </div>
          {lockedBonusEur > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', color: '#f59e0b', fontSize: '12px' }}>
              <span>Locked Bonus Chips:</span>
              <span>€{lockedBonusEur}</span>
            </div>
          )}
          <div
            style={{
              height: '1px',
              background: 'rgba(255,255,255,0.1)',
              margin: '8px 0',
            }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '15px', fontWeight: 800, color: '#4ade80' }}>
            <span>Candies Returned:</span>
            <span>🍬 {candiesReturn}</span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            type="button"
            onClick={onCancel}
            style={{
              flex: 1,
              background: 'rgba(255,255,255,0.08)',
              color: '#d4d4d8',
              border: '1px solid rgba(255,255,255,0.15)',
              borderRadius: '8px',
              padding: '10px 16px',
              fontSize: '13px',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            Keep Playing
          </button>
          <button
            type="button"
            onClick={() => onConfirmLeave(candiesReturn)}
            style={{
              flex: 1,
              background: 'linear-gradient(135deg, #d97706 0%, #b45309 100%)',
              color: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              padding: '10px 16px',
              fontSize: '13px',
              fontWeight: 800,
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(217, 119, 6, 0.4)',
            }}
          >
            Cash Out & Leave
          </button>
        </div>
      </div>
    </div>
  )
}
