import { useState } from 'react'
import {
  CANDIES_PER_EUR,
  FIRST_TIME_HOUSE_BONUS_EUR,
  candiesToEur,
} from '../../engine/economy'

interface BuyInModalProps {
  readonly candyBalance: number
  readonly isFirstTimePlayer: boolean
  readonly onConfirmBuyIn: (depositedCandies: number, receivedChipsEur: number, bonusEur: number) => void
  readonly onCancel?: () => void
}

export function BuyInModal({
  candyBalance,
  isFirstTimePlayer,
  onConfirmBuyIn,
  onCancel,
}: BuyInModalProps) {
  const { eur: maxPossibleEur } = candiesToEur(candyBalance)

  // Default buy-in: up to €50 or max possible
  const defaultBuyIn = Math.min(maxPossibleEur, 50)
  const [selectedChipsEur, setSelectedChipsEur] = useState<number>(defaultBuyIn)

  const requiredCandies = selectedChipsEur * CANDIES_PER_EUR
  const bonusEur = isFirstTimePlayer ? FIRST_TIME_HOUSE_BONUS_EUR : 0
  const totalStartingChips = selectedChipsEur + bonusEur

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(9, 9, 11, 0.85)',
        backdropFilter: 'blur(12px)',
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
          border: '1px solid #d97706',
          boxShadow: '0 20px 50px rgba(0,0,0,0.8), 0 0 0 1px rgba(245,158,11,0.2)',
          borderRadius: '20px',
          maxWidth: '480px',
          width: '100%',
          padding: '28px 24px',
          color: '#f4f4f5',
          textAlign: 'center',
          boxSizing: 'border-box',
          position: 'relative',
        }}
      >
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            style={{
              position: 'absolute',
              top: '14px',
              right: '16px',
              background: 'transparent',
              border: 'none',
              color: '#a1a1aa',
              fontSize: '18px',
              cursor: 'pointer',
              padding: '4px',
            }}
            aria-label="Close"
          >
            ✕
          </button>
        )}
        <div style={{ fontSize: '32px', marginBottom: '8px' }}>♠️ 21 ♥️</div>
        <h2
          style={{
            margin: '0 0 4px',
            fontSize: '22px',
            fontWeight: 800,
            letterSpacing: '0.5px',
            color: '#fef08a',
          }}
        >
          Take a Seat at the Table
        </h2>
        <p style={{ margin: '0 0 16px', fontSize: '13px', color: '#a1a1aa' }}>
          Exchange your candies for table chips and take the Middle Seat.
        </p>

        {/* First-time Welcome Bonus Banner */}
        {isFirstTimePlayer && (
          <div
            style={{
              background: 'linear-gradient(135deg, rgba(217,119,6,0.15) 0%, rgba(245,158,11,0.25) 100%)',
              border: '1px solid #f59e0b',
              borderRadius: '12px',
              padding: '12px 14px',
              marginBottom: '18px',
              textAlign: 'left',
              fontSize: '12.5px',
            }}
          >
            <div style={{ fontWeight: 800, color: '#fef08a', marginBottom: '3px' }}>
              🎁 First-Time Welcome Bonus: €500 Table Chips
            </div>
            <div style={{ color: '#e4e4e7', lineHeight: 1.45 }}>
              The house provides €500 in chips for play at this table. Win above €500 or play your deposit to cash out back to Candies.
            </div>
          </div>
        )}

        {/* Candy to EUR Exchange Box */}
        <div
          style={{
            background: 'rgba(0, 0, 0, 0.4)',
            borderRadius: '12px',
            padding: '14px',
            marginBottom: '18px',
            border: '1px solid rgba(255,255,255,0.08)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '13px' }}>
            <span style={{ color: '#a1a1aa' }}>Your Candy Balance:</span>
            <span style={{ fontWeight: 700, color: '#4ade80' }}>🍬 {candyBalance} Candies</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '13px' }}>
            <span style={{ color: '#a1a1aa' }}>Exchange Rate:</span>
            <span style={{ fontWeight: 600, color: '#fbbf24' }}>3 🍬 = €1 Chip</span>
          </div>
          <div
            style={{
              height: '1px',
              background: 'rgba(255,255,255,0.1)',
              margin: '8px 0',
            }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', fontWeight: 700 }}>
            <span>Table Chips Received:</span>
            <span style={{ color: '#fef08a' }}>€{selectedChipsEur}</span>
          </div>
          {bonusEur > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#f59e0b', marginTop: '4px' }}>
              <span>+ House Bonus:</span>
              <span>+€{bonusEur}</span>
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '15px', fontWeight: 800, color: '#22c55e', marginTop: '6px' }}>
            <span>Starting Bankroll:</span>
            <span>€{totalStartingChips}</span>
          </div>
        </div>

        {/* Chips Slider / Selector */}
        {maxPossibleEur > 0 && (
          <div style={{ marginBottom: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#a1a1aa', marginBottom: '6px' }}>
              <span>Buy-In from Candies:</span>
              <span style={{ color: '#fef08a', fontWeight: 700 }}>
                {requiredCandies} Candies = €{selectedChipsEur}
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={maxPossibleEur}
              step={1}
              value={selectedChipsEur}
              onChange={(e) => setSelectedChipsEur(Number(e.target.value))}
              style={{
                width: '100%',
                accentColor: '#d97706',
                cursor: 'pointer',
              }}
            />
            {/* Quick Presets */}
            <div style={{ display: 'flex', gap: '6px', justifyContent: 'center', marginTop: '8px' }}>
              {[0, 10, 25, 50, maxPossibleEur].filter((v, i, a) => v <= maxPossibleEur && a.indexOf(v) === i).map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setSelectedChipsEur(val)}
                  style={{
                    background: selectedChipsEur === val ? '#d97706' : 'rgba(255,255,255,0.06)',
                    color: selectedChipsEur === val ? '#ffffff' : '#d4d4d8',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '4px 10px',
                    fontSize: '11px',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  {val === 0 ? '€0' : val === maxPossibleEur ? 'Max' : `€${val}`}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Take Seat Action */}
        <button
          type="button"
          disabled={totalStartingChips <= 0}
          onClick={() => onConfirmBuyIn(requiredCandies, selectedChipsEur, bonusEur)}
          style={{
            width: '100%',
            background: totalStartingChips > 0 ? 'linear-gradient(135deg, #d97706 0%, #b45309 100%)' : 'rgba(255,255,255,0.1)',
            color: totalStartingChips > 0 ? '#ffffff' : '#71717a',
            border: 'none',
            borderRadius: '10px',
            padding: '12px 20px',
            fontSize: '15px',
            fontWeight: 800,
            letterSpacing: '0.5px',
            cursor: totalStartingChips > 0 ? 'pointer' : 'not-allowed',
            boxShadow: totalStartingChips > 0 ? '0 4px 14px rgba(217, 119, 6, 0.4)' : 'none',
            transition: 'all 0.15s ease',
          }}
        >
          Sit Down with €{totalStartingChips} Chips
        </button>
      </div>
    </div>
  )
}
