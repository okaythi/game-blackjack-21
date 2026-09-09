import { useState, type DragEvent } from 'react'
import type { ChipDenomination, Seat, RoundPhase } from '../../engine/types'
import { CardView } from '../card-view'
import { evaluateHand } from '../../engine/hand'
import { FlagIcon } from './flag-icon'

interface SeatViewProps {
  readonly seat: Seat
  readonly isTurn: boolean
  readonly isMiddleHuman: boolean
  readonly pendingBet?: number | undefined
  readonly onDropChip?: ((denom: ChipDenomination) => void) | undefined
  readonly onClickBetSpot?: (() => void) | undefined
  readonly phase?: RoundPhase | undefined
}

export function SeatView({
  seat,
  isTurn,
  isMiddleHuman,
  pendingBet = 0,
  onDropChip,
  onClickBetSpot,
  phase,
}: SeatViewProps) {
  const [isDragOver, setIsDragOver] = useState(false)

  const totalHandsBet = seat.hands.reduce((sum, h) => sum + h.bet, 0)
  const hasActiveHands = seat.hands.length > 0 && seat.hands.some((h) => h.status !== 'settled')

  const displayBet = hasActiveHands
    ? totalHandsBet
    : isMiddleHuman
      ? pendingBet
      : seat.currentBet > 0
        ? seat.currentBet
        : totalHandsBet

  const canInteract = isMiddleHuman && (!phase || phase === 'betting' || phase === 'round_over')

  const handleDragOver = (e: DragEvent) => {
    if (canInteract && onDropChip) {
      e.preventDefault()
      e.dataTransfer.dropEffect = 'copy'
    }
  }

  const handleDrop = (e: DragEvent) => {
    if (canInteract && onDropChip) {
      e.preventDefault()
      const data = e.dataTransfer.getData('text/plain')
      const denom = Number(data) as ChipDenomination
      if (!Number.isNaN(denom)) {
        onDropChip(denom)
      }
    }
  }

  return (
    <div
      onDragOver={canInteract ? handleDragOver : undefined}
      onDrop={
        canInteract
          ? (e) => {
              setIsDragOver(false)
              handleDrop(e)
            }
          : undefined
      }
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '4px',
        transform: isTurn ? 'scale(1.03)' : 'scale(1)',
        transition: 'transform 0.2s ease',
      }}
    >
      {/* 1. CARDS AREA (Cards Fan or Dedicated Clean Placeholder) */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '74px',
          gap: '6px',
        }}
      >
        {seat.hands.length === 0 ? (
          <div
            style={{
              width: '46px',
              height: '66px',
              borderRadius: '6px',
              border: '1.5px dashed rgba(60, 45, 30, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'rgba(60, 45, 30, 0.3)',
              fontSize: '9px',
              fontWeight: 600,
              letterSpacing: '0.4px',
            }}
          >
            Cards
          </div>
        ) : (
          seat.hands.map((hand, hIdx) => {
            const handVal = evaluateHand(hand.cards, hand.fromSplit)
            const isActingHand = isTurn && seat.activeHandIndex === hIdx

            return (
              <div
                key={hand.id || hIdx}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  position: 'relative',
                  padding: '2px',
                  borderRadius: '6px',
                  background: isActingHand ? 'rgba(245, 158, 11, 0.22)' : 'transparent',
                  boxShadow: isActingHand ? '0 0 12px rgba(217, 119, 6, 0.45)' : 'none',
                }}
              >
                {/* Hand Total / Outcome Badge (WIN / PUSH / BUST / 21) */}
                <div
                  style={{
                    background:
                      hand.status === 'settled'
                        ? hand.result === 'blackjack'
                          ? '#d97706'
                          : hand.result === 'win'
                            ? '#16a34a'
                            : hand.result === 'push'
                              ? '#4b5563'
                              : hand.result === 'loss'
                                ? '#dc2626'
                                : '#6b7280'
                        : handVal.isBlackjack
                          ? '#d97706'
                          : handVal.isBust
                            ? '#dc2626'
                            : isActingHand
                              ? '#d97706'
                              : '#232324',
                    color: '#ffffff',
                    borderRadius: '999px',
                    padding: '1px 7px',
                    fontSize: '9.5px',
                    fontWeight: 800,
                    marginBottom: '2px',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
                    letterSpacing: '0.3px',
                  }}
                >
                  {hand.status === 'settled'
                    ? hand.result === 'blackjack'
                      ? '🏆 21'
                      : hand.result === 'win'
                        ? `WIN (${handVal.total})`
                        : hand.result === 'push'
                          ? `PUSH (${handVal.total})`
                          : handVal.isBust
                            ? `BUST (${handVal.total})`
                            : `LOSE (${handVal.total})`
                    : handVal.isBlackjack
                      ? 'BLACKJACK'
                      : handVal.isBust
                        ? `BUST (${handVal.total})`
                        : handVal.isSoft
                          ? `Soft ${handVal.total}`
                          : handVal.total}
                </div>

                {/* Staggered Cards Fan */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minHeight: '66px',
                  }}
                >
                  {hand.cards.map((card, cIdx) => (
                    <div
                      key={card.id || cIdx}
                      style={{
                        marginLeft: cIdx === 0 ? 0 : '-24px',
                        zIndex: cIdx + 1,
                        boxShadow: '0 3px 8px rgba(0,0,0,0.35)',
                        borderRadius: '6px',
                        transition: 'all 0.2s ease',
                      }}
                    >
                      <CardView card={card} width={48} height={68} />
                    </div>
                  ))}
                </div>

                {/* Split Hand Individual Wager */}
                {seat.hands.length > 1 && (
                  <div
                    style={{
                      fontSize: '9px',
                      fontWeight: 800,
                      color: '#18181b',
                      marginTop: '1px',
                      background: 'rgba(255, 255, 255, 0.9)',
                      padding: '0.5px 4px',
                      borderRadius: '3px',
                      boxShadow: '0 1px 2px rgba(0,0,0,0.15)',
                    }}
                  >
                    €{hand.bet}
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>

      {/* 2. DEDICATED VISUAL BETTING SPOT (Permanent Wager Circle on the Felt) */}
      <div
        onDragOver={(e) => {
          e.stopPropagation()
          handleDragOver(e)
        }}
        onDragEnter={(e) => {
          e.stopPropagation()
          e.preventDefault()
          if (canInteract) setIsDragOver(true)
        }}
        onDragLeave={(e) => {
          e.stopPropagation()
          setIsDragOver(false)
        }}
        onDrop={(e) => {
          e.stopPropagation()
          setIsDragOver(false)
          handleDrop(e)
        }}
        onClick={canInteract ? onClickBetSpot : undefined}
        style={{
          width: '42px',
          height: '42px',
          borderRadius: '50%',
          border: isDragOver
            ? '2.5px solid #f59e0b'
            : displayBet > 0
              ? '2px solid #d97706'
              : '2px dashed rgba(60, 45, 30, 0.38)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: isDragOver
            ? 'rgba(245, 158, 11, 0.35)'
            : displayBet > 0
              ? 'radial-gradient(circle, rgba(217, 119, 6, 0.24) 0%, rgba(217, 119, 6, 0.12) 100%)'
              : 'rgba(0, 0, 0, 0.04)',
          boxShadow: isDragOver
            ? '0 0 16px rgba(245, 158, 11, 0.85), inset 0 0 6px rgba(0,0,0,0.2)'
            : displayBet > 0
              ? '0 0 10px rgba(217, 119, 6, 0.4), inset 0 0 6px rgba(0,0,0,0.18)'
              : 'none',
          cursor: canInteract ? 'pointer' : 'default',
          transform: isDragOver ? 'scale(1.12)' : 'scale(1)',
          transition: 'all 0.18s ease',
          zIndex: 5,
        }}
        title={canInteract ? 'Drop chips or click to wager' : undefined}
      >
        {displayBet > 0 ? (
          <span
            style={{
              fontWeight: 800,
              fontSize: '11px',
              color: '#18181b',
              letterSpacing: '-0.2px',
            }}
          >
            €{displayBet}
          </span>
        ) : (
          <span
            style={{
              fontSize: '9px',
              color: '#52525b',
              fontWeight: 700,
              letterSpacing: '0.4px',
            }}
          >
            {isMiddleHuman ? 'BET' : 'READY'}
          </span>
        )}
      </div>

      {/* 3. SEAT AVATAR BADGE, NAME, CURRENT BET & BANKROLL */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          background: isTurn
            ? '#232324'
            : isMiddleHuman
              ? 'rgba(35, 35, 36, 0.92)'
              : 'rgba(35, 35, 36, 0.82)',
          color: isTurn ? '#fef08a' : '#faf7f2',
          padding: '3px 8px',
          borderRadius: '7px',
          border: `1.5px solid ${isTurn ? '#d97706' : 'rgba(255,255,255,0.08)'}`,
          boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
          minWidth: '82px',
        }}
      >
        {/* Name Row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '10.5px', fontWeight: 700 }}>
          {isMiddleHuman ? (
            <span>👤 You</span>
          ) : (
            <>
              <FlagIcon code={seat.profile?.code} size={16} title={seat.profile?.country} />
              <span>{seat.profile?.name ?? 'Companion'}</span>
            </>
          )}
        </div>

        {/* Current Bet & Bankroll */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '5px',
            fontSize: '9.5px',
            marginTop: '2px',
            whiteSpace: 'nowrap',
          }}
        >
          <span
            style={{
              color: '#fef08a',
              fontWeight: 800,
              background: 'rgba(217, 119, 6, 0.28)',
              padding: '0.5px 4px',
              borderRadius: '3px',
            }}
            title="Current Bet"
          >
            Bet: €{displayBet}
          </span>
          <span
            style={{
              color: '#4ade80',
              fontWeight: 700,
            }}
            title="Total Bankroll"
          >
            €{seat.bankroll.toLocaleString()}
          </span>
        </div>
      </div>
    </div>
  )
}
