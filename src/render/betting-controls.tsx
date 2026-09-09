import { useEffect } from 'react'
import type { ChipDenomination } from '../engine/types'
import { Chip } from './chip-view'

interface BettingControlsProps {
  readonly currentBet: number
  readonly bankroll: number
  readonly minBet: number
  readonly maxBet: number
  readonly onAddChip: (denom: ChipDenomination) => void
  readonly onSetBet?: (amount: number) => void
  readonly onClearBet: () => void
  readonly onDoubleBet: () => void
  readonly onDeal: () => void
  readonly canRebet?: boolean
  readonly onRebet?: () => void
  readonly disabled?: boolean
}

const CHIP_DENOMS: readonly ChipDenomination[] = [
  1, 2.5, 5, 10, 25, 100, 500, 1000, 2000, 5000,
]

export function BettingControls({
  currentBet,
  bankroll,
  minBet,
  maxBet,
  onAddChip,
  onSetBet,
  onClearBet,
  onDoubleBet,
  onDeal,
  canRebet = false,
  onRebet,
  disabled = false,
}: BettingControlsProps) {
  // Key shortcut listener
  useEffect(() => {
    if (disabled) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return
      }

      if (e.key === ' ' || e.key === 'Enter') {
        if (currentBet >= minBet) {
          e.preventDefault()
          onDeal()
        }
      } else if (e.key === 'c' || e.key === 'C') {
        onClearBet()
      } else if (e.key === '1') {
        onAddChip(1)
      } else if (e.key === '2') {
        onAddChip(5)
      } else if (e.key === '3') {
        onAddChip(25)
      } else if (e.key === '4') {
        onAddChip(100)
      } else if (e.key === '5') {
        onAddChip(500)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [disabled, currentBet, minBet, onDeal, onClearBet, onAddChip])

  const canDeal = currentBet >= minBet && currentBet <= maxBet && !disabled
  const canDouble = currentBet * 2 <= bankroll && currentBet * 2 <= maxBet && currentBet > 0 && !disabled
  const maxWagerPossible = Math.min(bankroll, maxBet)

  const handleQuickBet = (amount: number) => {
    if (disabled) return
    const clamped = Math.max(minBet, Math.min(amount, maxWagerPossible))
    if (onSetBet) {
      onSetBet(clamped)
    } else {
      onClearBet()
    }
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '10px',
        background: 'rgba(24, 24, 27, 0.94)',
        padding: '12px 18px',
        borderRadius: '16px',
        border: '1px solid rgba(217, 119, 6, 0.35)',
        boxShadow: '0 10px 30px rgba(0, 0, 0, 0.5)',
        backdropFilter: 'blur(10px)',
        maxWidth: '720px',
        margin: '0 auto',
        width: '100%',
        boxSizing: 'border-box',
      }}
    >
      {/* Wager & Bankroll Summary Strip */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          width: '100%',
          padding: '0 4px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '12px', color: '#a1a1aa', fontWeight: 600 }}>Active Wager:</span>
          <span
            style={{
              fontSize: '17px',
              fontWeight: 800,
              color: currentBet > 0 ? '#fef08a' : '#71717a',
              letterSpacing: '0.3px',
            }}
          >
            €{currentBet}
          </span>
          {currentBet < minBet && (
            <span style={{ fontSize: '10.5px', color: '#f87171', fontWeight: 600 }}>
              (Min: €{minBet})
            </span>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#a1a1aa' }}>
          <span>Bankroll:</span>
          <span style={{ fontWeight: 800, color: '#4ade80', fontSize: '14px' }}>
            €{bankroll.toLocaleString()}
          </span>
        </div>
      </div>

      {/* Quick Bet Presets & Range Slider */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '8px',
          width: '100%',
          flexWrap: 'wrap',
        }}
      >
        <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
          {[
            { label: `Min (€${minBet})`, val: minBet },
            { label: '€25', val: 25 },
            { label: '€50', val: 50 },
            { label: '€100', val: 100 },
            { label: 'All-In', val: maxWagerPossible },
          ].map((preset) => {
            const isAffordable = preset.val <= maxWagerPossible
            return (
              <button
                key={preset.label}
                type="button"
                disabled={disabled || !isAffordable}
                onClick={() => handleQuickBet(preset.val)}
                style={{
                  background: currentBet === preset.val ? '#d97706' : 'rgba(255, 255, 255, 0.07)',
                  color: currentBet === preset.val ? '#ffffff' : isAffordable ? '#d4d4d8' : '#71717a',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '3px 8px',
                  fontSize: '11px',
                  fontWeight: 700,
                  cursor: isAffordable && !disabled ? 'pointer' : 'not-allowed',
                  transition: 'background 0.15s ease',
                }}
              >
                {preset.label}
              </button>
            )
          })}
        </div>

        {onSetBet && maxWagerPossible > minBet && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flex: '1 1 140px', minWidth: '120px' }}>
            <input
              type="range"
              min={minBet}
              max={maxWagerPossible}
              step={currentBet >= 100 ? 25 : 5}
              value={Math.max(minBet, Math.min(currentBet, maxWagerPossible))}
              disabled={disabled}
              onChange={(e) => onSetBet(Number(e.target.value))}
              style={{
                width: '100%',
                accentColor: '#d97706',
                cursor: disabled ? 'not-allowed' : 'pointer',
              }}
              title="Drag slider to set bet"
            />
          </div>
        )}
      </div>

      {/* Chip Rack (Draggable chips with grabbing hand cursor) */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '7px',
          flexWrap: 'wrap',
          padding: '2px 4px',
        }}
        title="Click or drag chips onto the betting spot"
      >
        {CHIP_DENOMS.map((denom) => {
          const wouldExceed = currentBet + denom > bankroll || currentBet + denom > maxBet
          return (
            <Chip
              key={denom}
              denomination={denom}
              size={40}
              disabled={disabled || wouldExceed}
              draggable={!disabled && !wouldExceed}
              onDragStart={(e) => {
                e.dataTransfer.setData('text/plain', String(denom))
                e.dataTransfer.effectAllowed = 'copy'
              }}
              onClick={() => onAddChip(denom)}
            />
          )
        })}
      </div>

      {/* Action Buttons Row */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          flexWrap: 'wrap',
          width: '100%',
          marginTop: '2px',
        }}
      >
        <button
          type="button"
          disabled={disabled || currentBet === 0}
          onClick={onClearBet}
          style={{
            background: 'rgba(255,255,255,0.08)',
            color: '#d4d4d8',
            border: '1px solid rgba(255,255,255,0.15)',
            borderRadius: '8px',
            padding: '7px 14px',
            fontSize: '12.5px',
            fontWeight: 600,
            cursor: currentBet > 0 && !disabled ? 'pointer' : 'not-allowed',
            opacity: currentBet > 0 ? 1 : 0.5,
          }}
        >
          Clear
        </button>

        {canRebet && onRebet && (
          <button
            type="button"
            disabled={disabled}
            onClick={onRebet}
            style={{
              background: 'rgba(255,255,255,0.08)',
              color: '#d4d4d8',
              border: '1px solid rgba(255,255,255,0.15)',
              borderRadius: '8px',
              padding: '7px 14px',
              fontSize: '12.5px',
              fontWeight: 600,
              cursor: !disabled ? 'pointer' : 'not-allowed',
            }}
          >
            Rebet
          </button>
        )}

        <button
          type="button"
          disabled={!canDouble}
          onClick={onDoubleBet}
          style={{
            background: canDouble ? 'rgba(245, 158, 11, 0.15)' : 'rgba(255,255,255,0.05)',
            color: canDouble ? '#fef08a' : '#71717a',
            border: '1px solid ' + (canDouble ? '#d97706' : 'transparent'),
            borderRadius: '8px',
            padding: '7px 14px',
            fontSize: '12.5px',
            fontWeight: 600,
            cursor: canDouble ? 'pointer' : 'not-allowed',
            opacity: canDouble ? 1 : 0.5,
          }}
        >
          Double (2×)
        </button>

        {/* DEAL BUTTON */}
        <button
          type="button"
          disabled={!canDeal}
          onClick={onDeal}
          style={{
            background: canDeal ? 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)' : 'rgba(255,255,255,0.08)',
            color: canDeal ? '#ffffff' : '#71717a',
            border: '1px solid ' + (canDeal ? '#22c55e' : 'transparent'),
            borderRadius: '8px',
            padding: '8px 22px',
            fontSize: '14px',
            fontWeight: 800,
            cursor: canDeal ? 'pointer' : 'not-allowed',
            boxShadow: canDeal ? '0 4px 14px rgba(22, 163, 74, 0.4)' : 'none',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            transition: 'all 0.15s ease',
          }}
        >
          <span>DEAL</span>
          <kbd
            style={{
              opacity: 0.8,
              fontSize: '10.5px',
              background: 'rgba(0,0,0,0.25)',
              padding: '1px 5px',
              borderRadius: '4px',
            }}
          >
            Space
          </kbd>
        </button>
      </div>
    </div>
  )
}
