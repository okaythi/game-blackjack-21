import type { ChipDenomination } from '../engine/types'

export interface ChipTheme {
  readonly label: string
  readonly bg: string
  readonly text: string
  readonly edgeStripe: string
  readonly border: string
  readonly innerRing: string
}

export const CHIP_THEMES: Record<ChipDenomination, ChipTheme> = {
  1: {
    label: '€1',
    bg: '#f8fafc',
    text: '#1e293b',
    edgeStripe: '#94a3b8',
    border: '#cbd5e1',
    innerRing: '#e2e8f0',
  },
  2.5: {
    label: '€2.50',
    bg: '#fb7185',
    text: '#ffffff',
    edgeStripe: '#ffffff',
    border: '#f43f5e',
    innerRing: '#fda4af',
  },
  5: {
    label: '€5',
    bg: '#dc2626',
    text: '#ffffff',
    edgeStripe: '#ffffff',
    border: '#b91c1c',
    innerRing: '#f87171',
  },
  10: {
    label: '€10',
    bg: '#2563eb', // Original casino blue for dimes
    text: '#ffffff',
    edgeStripe: '#ffffff',
    border: '#1d4ed8',
    innerRing: '#60a5fa',
  },
  25: {
    label: '€25',
    bg: '#16a34a',
    text: '#ffffff',
    edgeStripe: '#fef08a',
    border: '#15803d',
    innerRing: '#4ade80',
  },
  100: {
    label: '€100',
    bg: '#18181b',
    text: '#fef08a',
    edgeStripe: '#f59e0b',
    border: '#27272a',
    innerRing: '#d97706',
  },
  500: {
    label: '€500',
    bg: '#7c3aed',
    text: '#ffffff',
    edgeStripe: '#ffffff',
    border: '#6d28d9',
    innerRing: '#a78bfa',
  },
  1000: {
    label: '€1K',
    bg: '#eab308',
    text: '#18181b',
    edgeStripe: '#78350f',
    border: '#ca8a04',
    innerRing: '#fde047',
  },
  2000: {
    label: '€2K',
    bg: '#94a3b8',
    text: '#0f172a',
    edgeStripe: '#334155',
    border: '#64748b',
    innerRing: '#e2e8f0',
  },
  5000: {
    label: '€5K',
    bg: '#881337', // Cranberry
    text: '#fef08a',
    edgeStripe: '#fef08a',
    border: '#4c0519',
    innerRing: '#be123c',
  },
}

interface ChipProps {
  readonly denomination: ChipDenomination
  readonly size?: number
  readonly count?: number
  readonly selected?: boolean
  readonly disabled?: boolean
  readonly draggable?: boolean
  readonly onClick?: () => void
  readonly onDragStart?: (e: React.DragEvent<HTMLButtonElement>) => void
}

export function Chip({
  denomination,
  size = 44,
  count,
  selected = false,
  disabled = false,
  draggable = false,
  onClick,
  onDragStart,
}: ChipProps) {
  const theme = CHIP_THEMES[denomination]
  const isMovable = !disabled && draggable

  return (
    <button
      type="button"
      className={`chip-btn ${selected ? 'chip-selected' : ''} ${disabled ? 'chip-disabled' : ''}`}
      onClick={disabled ? undefined : onClick}
      draggable={isMovable}
      onDragStart={isMovable ? onDragStart : undefined}
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        padding: 0,
        border: 'none',
        background: 'transparent',
        cursor: disabled ? 'not-allowed' : isMovable ? 'grab' : 'pointer',
        position: 'relative',
        filter: selected
          ? 'drop-shadow(0 0 8px rgba(245, 158, 11, 0.8))'
          : 'drop-shadow(0 3px 6px rgba(0, 0, 0, 0.35))',
        transform: selected ? 'translateY(-3px) scale(1.08)' : 'scale(1)',
        transition: 'transform 0.15s ease, filter 0.15s ease',
        opacity: disabled ? 0.45 : 1,
        touchAction: 'none',
        userSelect: 'none',
      }}
      aria-label={`Bet ${theme.label}`}
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        style={{ display: 'block' }}
      >
        {/* Outer Shadow Ring */}
        <circle cx="50" cy="50" r="48" fill={theme.border} />

        {/* Outer Body */}
        <circle cx="50" cy="50" r="45" fill={theme.bg} />

        {/* Edge Stripes (Casino Clay Inserts) */}
        {[0, 60, 120, 180, 240, 300].map((deg) => (
          <g key={deg} transform={`rotate(${deg} 50 50)`}>
            <rect
              x="46"
              y="5"
              width="8"
              height="11"
              rx="1.5"
              fill={theme.edgeStripe}
            />
          </g>
        ))}

        {/* Outer Inlay Groove */}
        <circle
          cx="50"
          cy="50"
          r="34"
          fill="none"
          stroke={theme.innerRing}
          strokeWidth="1.8"
          strokeDasharray="4 2"
        />

        {/* Center Recessed Inlay */}
        <circle cx="50" cy="50" r="28" fill={theme.border} opacity="0.25" />
        <circle cx="50" cy="50" r="26" fill={theme.bg} />

        {/* Denomination Text */}
        <text
          x="50"
          y="56"
          textAnchor="middle"
          fontSize={denomination >= 1000 ? '22' : '24'}
          fontWeight="800"
          fontFamily="system-ui, -apple-system, sans-serif"
          fill={theme.text}
          letterSpacing="-0.5px"
        >
          {theme.label}
        </text>
      </svg>

      {/* Chip Multiplier Count Badge */}
      {count !== undefined && count > 1 && (
        <span
          style={{
            position: 'absolute',
            top: -5,
            right: -5,
            background: '#18181b',
            color: '#fef08a',
            border: '1.5px solid #d97706',
            borderRadius: '999px',
            fontSize: '10px',
            fontWeight: 700,
            padding: '1px 5px',
            pointerEvents: 'none',
          }}
        >
          ×{count}
        </span>
      )}
    </button>
  )
}
