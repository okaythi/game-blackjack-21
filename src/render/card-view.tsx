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

const CARD_ANIMATION_CSS = `
@keyframes cardSlideInFromShoe {
  0% {
    opacity: 0;
    transform: translate3d(80px, -100px, 0) rotate(16deg) scale(0.6);
  }
  100% {
    opacity: 1;
    transform: translate3d(0, 0, 0) rotate(0deg) scale(1);
  }
}
`

export function CardView({
  card,
  isHidden = false,
  width = 58,
  height = 82,
  isDealing = false,
}: CardProps) {
  if (isHidden || !card) {
    return (
      <>
        <style>{CARD_ANIMATION_CSS}</style>
        <div
          className="card card-back"
          style={{
            width,
            height,
            borderRadius: '6px',
            border: '1.5px solid #d97706',
            boxShadow: '0 4px 10px rgba(0, 0, 0, 0.45), inset 0 0 4px rgba(0,0,0,0.3)',
            background: 'linear-gradient(135deg, #78350f 0%, #451a03 50%, #78350f 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            overflow: 'hidden',
            animation: 'cardSlideInFromShoe 0.32s cubic-bezier(0.2, 0.9, 0.3, 1) forwards',
            transform: isDealing ? 'scale(0.8) translateY(-8px)' : undefined,
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
            <rect x="5" y="5" width="90" height="130" rx="4" fill="none" stroke="#fbbf24" strokeWidth="1.2" opacity="0.6" />
            <rect x="8" y="8" width="84" height="124" fill="url(#cardBackPattern)" />
            <circle cx="50" cy="70" r="13" fill="#451a03" stroke="#f59e0b" strokeWidth="1.5" />
            <text x="50" y="74.5" textAnchor="middle" fill="#fbbf24" fontSize="12" fontWeight="bold">21</text>
          </svg>
        </div>
      </>
    )
  }

  const color = SUIT_COLORS[card.suit]
  const symbol = SUIT_SYMBOLS[card.suit]

  return (
    <>
      <style>{CARD_ANIMATION_CSS}</style>
      <div
        className="card card-face"
        style={{
          width,
          height,
          borderRadius: '6px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 4px 10px rgba(0, 0, 0, 0.35), inset 0 0 2px rgba(255,255,255,0.8)',
          background: '#fafaf9',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '4px',
          boxSizing: 'border-box',
          color,
          userSelect: 'none',
          position: 'relative',
          animation: 'cardSlideInFromShoe 0.32s cubic-bezier(0.2, 0.9, 0.3, 1) forwards',
          transform: isDealing ? 'scale(0.85) translateY(-6px)' : undefined,
          transition: 'transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)',
        }}
      >
        {/* Top Left Rank & Suit */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', lineHeight: 1 }}>
          <span style={{ fontSize: '12px', fontWeight: '800', letterSpacing: '-0.5px' }}>{card.rank}</span>
          <span style={{ fontSize: '10px', marginTop: '1px' }}>{symbol}</span>
        </div>

        {/* Center Large Suit Symbol */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            fontSize: '22px',
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
          <span style={{ fontSize: '12px', fontWeight: '800', letterSpacing: '-0.5px' }}>{card.rank}</span>
          <span style={{ fontSize: '10px', marginTop: '1px' }}>{symbol}</span>
        </div>
      </div>
    </>
  )
}
