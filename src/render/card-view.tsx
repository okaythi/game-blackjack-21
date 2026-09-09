import type { Card, Suit } from '../engine/types'

interface CardProps {
  readonly card?: Card | undefined
  readonly isHidden?: boolean
  readonly width?: number
  readonly height?: number
  readonly isDealing?: boolean
}

const SUIT_SYMBOLS: Record<Suit, string> = {
  spades: '♠',
  clubs: '♣',
  hearts: '♥',
  diamonds: '♦',
}

const SUIT_COLORS: Record<Suit, string> = {
  spades: '#18181b', // Deep ink
  clubs: '#18181b',
  hearts: '#dc2626', // Rich crimson
  diamonds: '#dc2626',
}

export function CardView({
  card,
  isHidden = false,
  width = 68,
  height = 96,
  isDealing = false,
}: CardProps) {
  if (isHidden || !card) {
    return (
      <div
        className="card card-back"
        style={{
          width,
          height,
          borderRadius: '7px',
          border: '1.5px solid #d97706',
          boxShadow: '0 4px 10px rgba(0, 0, 0, 0.45), inset 0 0 4px rgba(0,0,0,0.3)',
          background: 'linear-gradient(135deg, #78350f 0%, #451a03 50%, #78350f 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          overflow: 'hidden',
          transform: isDealing ? 'scale(0.8) translateY(-12px)' : 'scale(1)',
          transition: 'transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)',
        }}
      >
        {/* Luxury Gold Guilloche Pattern */}
        <svg width="100%" height="100%" viewBox="0 0 100 140" style={{ position: 'absolute', top: 0, left: 0 }}>
          <pattern id="cardBackPattern" width="16" height="16" patternUnits="userSpaceOnUse">
            <path
              d="M 8,0 L 16,8 L 8,16 L 0,8 Z"
              fill="none"
              stroke="#fbbf24"
              strokeWidth="0.8"
              opacity="0.35"
            />
            <circle cx="8" cy="8" r="2.5" fill="#f59e0b" opacity="0.45" />
          </pattern>
          <rect x="6" y="6" width="88" height="128" rx="4" fill="none" stroke="#fbbf24" strokeWidth="1.2" opacity="0.6" />
          <rect x="9" y="9" width="82" height="122" fill="url(#cardBackPattern)" />
          <circle cx="50" cy="70" r="14" fill="#451a03" stroke="#f59e0b" strokeWidth="1.5" />
          <text x="50" y="75" textAnchor="middle" fill="#fbbf24" fontSize="13" fontWeight="bold">21</text>
        </svg>
      </div>
    )
  }

  const color = SUIT_COLORS[card.suit]
  const symbol = SUIT_SYMBOLS[card.suit]

  return (
    <div
      className="card card-face"
      style={{
        width,
        height,
        borderRadius: '7px',
        border: '1px solid #e2e8f0',
        boxShadow: '0 4px 10px rgba(0, 0, 0, 0.35), inset 0 0 2px rgba(255,255,255,0.8)',
        background: '#fafaf9',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '5px',
        boxSizing: 'border-box',
        color,
        userSelect: 'none',
        position: 'relative',
        transform: isDealing ? 'scale(0.85) translateY(-8px)' : 'scale(1)',
        transition: 'transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)',
      }}
    >
      {/* Top Left Rank & Suit */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', lineHeight: 1 }}>
        <span style={{ fontSize: '13px', fontWeight: '800', letterSpacing: '-0.5px' }}>{card.rank}</span>
        <span style={{ fontSize: '11px', marginTop: '1px' }}>{symbol}</span>
      </div>

      {/* Center Large Suit Symbol */}
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          fontSize: '26px',
          opacity: 0.9,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {symbol}
      </div>

      {/* Bottom Right Rank & Suit (Inverted) */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          lineHeight: 1,
          transform: 'rotate(180deg)',
        }}
      >
        <span style={{ fontSize: '13px', fontWeight: '800', letterSpacing: '-0.5px' }}>{card.rank}</span>
        <span style={{ fontSize: '11px', marginTop: '1px' }}>{symbol}</span>
      </div>
    </div>
  )
}
