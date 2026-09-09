import React, { useEffect } from 'react'
import type { ActionType, LegalActions } from '../engine/types'

interface ActionBarProps {
  readonly legal: LegalActions
  readonly onAction: (action: ActionType) => void
  readonly disabled?: boolean
  readonly isInsurancePhase?: boolean
}

export function ActionBar({
  legal,
  onAction,
  disabled = false,
  isInsurancePhase = false,
}: ActionBarProps) {
  // Keyboard shortcut listener
  useEffect(() => {
    if (disabled) return

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if input/textarea focused
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return
      }

      const key = e.key.toLowerCase()

      if (isInsurancePhase) {
        if (key === 'y' && legal.canInsurance) onAction('insurance_yes')
        if (key === 'n' && legal.canInsurance) onAction('insurance_no')
        return
      }

      if (key === 'h' && legal.canHit) onAction('hit')
      else if (key === 's' && legal.canStand) onAction('stand')
      else if (key === 'd' && legal.canDouble) onAction('double')
      else if (key === 'p' && legal.canSplit) onAction('split')
      else if (key === 'u' && legal.canSurrender) onAction('surrender')
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [legal, onAction, disabled, isInsurancePhase])

  if (isInsurancePhase) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '12px',
          background: 'rgba(24, 24, 27, 0.95)',
          padding: '12px 24px',
          borderRadius: '12px',
          border: '1px solid #d97706',
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.5)',
          backdropFilter: 'blur(8px)',
        }}
      >
        <span style={{ color: '#fef08a', fontWeight: 600, fontSize: '14px', marginRight: '8px' }}>
          Dealer shows an Ace. Take Insurance? (2:1)
        </span>
        <button
          type="button"
          disabled={disabled || !legal.canInsurance}
          onClick={() => onAction('insurance_yes')}
          style={{
            background: '#16a34a',
            color: '#ffffff',
            border: 'none',
            borderRadius: '8px',
            padding: '8px 18px',
            fontSize: '13.5px',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          <span>Take Insurance</span>
          <kbd style={{ opacity: 0.7, fontSize: '11px', background: 'rgba(0,0,0,0.2)', padding: '2px 5px', borderRadius: '4px' }}>Y</kbd>
        </button>
        <button
          type="button"
          disabled={disabled || !legal.canInsurance}
          onClick={() => onAction('insurance_no')}
          style={{
            background: '#dc2626',
            color: '#ffffff',
            border: 'none',
            borderRadius: '8px',
            padding: '8px 18px',
            fontSize: '13.5px',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          <span>Decline</span>
          <kbd style={{ opacity: 0.7, fontSize: '11px', background: 'rgba(0,0,0,0.2)', padding: '2px 5px', borderRadius: '4px' }}>N</kbd>
        </button>
      </div>
    )
  }

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '10px',
        flexWrap: 'wrap',
        background: 'rgba(24, 24, 27, 0.92)',
        padding: '10px 18px',
        borderRadius: '14px',
        border: '1px solid rgba(217, 119, 6, 0.35)',
        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.45)',
        backdropFilter: 'blur(8px)',
      }}
    >
      {/* HIT */}
      <button
        type="button"
        disabled={disabled || !legal.canHit}
        onClick={() => onAction('hit')}
        style={{
          background: legal.canHit ? '#16a34a' : 'rgba(255,255,255,0.06)',
          color: legal.canHit ? '#ffffff' : '#71717a',
          border: '1px solid ' + (legal.canHit ? '#15803d' : 'transparent'),
          borderRadius: '8px',
          padding: '10px 20px',
          fontSize: '14px',
          fontWeight: 700,
          cursor: legal.canHit && !disabled ? 'pointer' : 'not-allowed',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          transition: 'all 0.15s ease',
        }}
      >
        <span>Hit</span>
        <kbd style={{ opacity: 0.8, fontSize: '11px', background: 'rgba(0,0,0,0.25)', padding: '1px 5px', borderRadius: '4px' }}>H</kbd>
      </button>

      {/* STAND */}
      <button
        type="button"
        disabled={disabled || !legal.canStand}
        onClick={() => onAction('stand')}
        style={{
          background: legal.canStand ? '#dc2626' : 'rgba(255,255,255,0.06)',
          color: legal.canStand ? '#ffffff' : '#71717a',
          border: '1px solid ' + (legal.canStand ? '#b91c1c' : 'transparent'),
          borderRadius: '8px',
          padding: '10px 20px',
          fontSize: '14px',
          fontWeight: 700,
          cursor: legal.canStand && !disabled ? 'pointer' : 'not-allowed',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          transition: 'all 0.15s ease',
        }}
      >
        <span>Stand</span>
        <kbd style={{ opacity: 0.8, fontSize: '11px', background: 'rgba(0,0,0,0.25)', padding: '1px 5px', borderRadius: '4px' }}>S</kbd>
      </button>

      {/* DOUBLE */}
      <button
        type="button"
        disabled={disabled || !legal.canDouble}
        onClick={() => onAction('double')}
        style={{
          background: legal.canDouble ? '#d97706' : 'rgba(255,255,255,0.06)',
          color: legal.canDouble ? '#ffffff' : '#71717a',
          border: '1px solid ' + (legal.canDouble ? '#b45309' : 'transparent'),
          borderRadius: '8px',
          padding: '10px 18px',
          fontSize: '14px',
          fontWeight: 700,
          cursor: legal.canDouble && !disabled ? 'pointer' : 'not-allowed',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          transition: 'all 0.15s ease',
        }}
      >
        <span>Double</span>
        <kbd style={{ opacity: 0.8, fontSize: '11px', background: 'rgba(0,0,0,0.25)', padding: '1px 5px', borderRadius: '4px' }}>D</kbd>
      </button>

      {/* SPLIT */}
      <button
        type="button"
        disabled={disabled || !legal.canSplit}
        onClick={() => onAction('split')}
        style={{
          background: legal.canSplit ? '#7c3aed' : 'rgba(255,255,255,0.06)',
          color: legal.canSplit ? '#ffffff' : '#71717a',
          border: '1px solid ' + (legal.canSplit ? '#6d28d9' : 'transparent'),
          borderRadius: '8px',
          padding: '10px 18px',
          fontSize: '14px',
          fontWeight: 700,
          cursor: legal.canSplit && !disabled ? 'pointer' : 'not-allowed',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          transition: 'all 0.15s ease',
        }}
      >
        <span>Split</span>
        <kbd style={{ opacity: 0.8, fontSize: '11px', background: 'rgba(0,0,0,0.25)', padding: '1px 5px', borderRadius: '4px' }}>P</kbd>
      </button>

      {/* SURRENDER */}
      {legal.canSurrender && (
        <button
          type="button"
          disabled={disabled}
          onClick={() => onAction('surrender')}
          style={{
            background: 'rgba(255,255,255,0.1)',
            color: '#e4e4e7',
            border: '1px solid rgba(255,255,255,0.2)',
            borderRadius: '8px',
            padding: '10px 16px',
            fontSize: '14px',
            fontWeight: 600,
            cursor: !disabled ? 'pointer' : 'not-allowed',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            transition: 'all 0.15s ease',
          }}
        >
          <span>Surrender</span>
          <kbd style={{ opacity: 0.8, fontSize: '11px', background: 'rgba(0,0,0,0.25)', padding: '1px 5px', borderRadius: '4px' }}>U</kbd>
        </button>
      )}
    </div>
  )
}
