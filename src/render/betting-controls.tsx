import React, { useEffect } from 'react'
import type { ChipDenomination } from '../engine/types'
import { Chip } from './chip-view'

interface BettingControlsProps {
  readonly currentBet: number
  readonly bankroll: number
  readonly minBet: number
  readonly maxBet: number
  readonly onAddChip: (denom: ChipDenomination) => void
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

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '12px',
        background: 'rgba(24, 24, 27, 0.94)',
        padding: '14px 20px',
        borderRadius: '16px',
        border: '1px solid rgba(217, 119, 6, 0.35)',
        boxShadow: '0 10px 30px rgba(0, 0, 0, 0.5)',
        backdropFilter: 'blur(10px)',
        maxWidth: '720px',
        margin: '0 auto',
      }}
    >
      {/* Chip Rack */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          flexWrap: 'wrap',
          padding: '4px 8px',
        }}
      >
        {CHIP_DENOMS.map((denom) => {
          const wouldExceed = currentBet + denom > bankroll || currentBet + denom > maxBet
          return (
            <Chip
              key={denom}
              denomination={denom}
              size={42}
              disabled={disabled || wouldExceed}
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
          gap: '10px',
          flexWrap: 'wrap',
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
            padding: '8px 16px',
            fontSize: '13px',
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
              padding: '8px 16px',
              fontSize: '13px',
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
            padding: '8px 16px',
            fontSize: '13px',
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
            padding: '9px 24px',
            fontSize: '14.5px',
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
              fontSize: '11px',
              background: 'rgba(0,0,0,0.25)',
              padding: '2px 6px',
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
