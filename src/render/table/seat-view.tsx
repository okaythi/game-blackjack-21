import type { ChipDenomination, Seat } from '../../engine/types'
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
}

export function SeatView({
  seat,
  isTurn,
  isMiddleHuman,
  pendingBet = 0,
  onDropChip,
  onClickBetSpot,
}: SeatViewProps) {
  const displayBet = isMiddleHuman && seat.hands.length === 0 && pendingBet > 0 ? pendingBet : seat.currentBet

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '4px',
        transform: isTurn ? 'scale(1.03)' : 'scale(1)',
        transition: 'transform 0.2s ease',
      }}
    >
      {/* Seat Hands (Supports Split Hands) */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          minHeight: '84px',
          marginBottom: '2px',
        }}
      >
        {seat.hands.length === 0 ? (
          /* Empty / Active Betting Spot Circle */
          <div
            onDragOver={(e) => {
              if (isMiddleHuman && onDropChip) {
                e.preventDefault()
                e.dataTransfer.dropEffect = 'copy'
              }
            }}
            onDrop={(e) => {
              if (isMiddleHuman && onDropChip) {
                e.preventDefault()
                const data = e.dataTransfer.getData('text/plain')
                const denom = Number(data) as ChipDenomination
                if (!Number.isNaN(denom)) {
                  onDropChip(denom)
                }
              }
            }}
            onClick={isMiddleHuman ? onClickBetSpot : undefined}
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              border: displayBet > 0 ? '2px solid #d97706' : '2px dashed rgba(35, 35, 36, 0.35)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              background: displayBet > 0 ? 'rgba(217, 119, 6, 0.2)' : 'rgba(0, 0, 0, 0.04)',
              boxShadow: displayBet > 0 ? '0 0 12px rgba(217, 119, 6, 0.4), inset 0 0 8px rgba(0,0,0,0.2)' : 'none',
              cursor: isMiddleHuman ? 'pointer' : 'default',
              transition: 'all 0.2s ease',
            }}
            title={isMiddleHuman ? 'Click or drop chips here to wager' : undefined}
          >
            {displayBet > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', lineHeight: 1.1 }}>
                <span style={{ fontSize: '13px' }}>🪙</span>
                <span style={{ fontWeight: 800, fontSize: '11.5px', color: '#18181b', marginTop: '1px' }}>
                  €{displayBet}
                </span>
              </div>
            ) : (
              <span style={{ fontSize: '10px', color: '#52525b', fontWeight: 700, letterSpacing: '0.4px' }}>
                {isMiddleHuman ? 'BET' : 'READY'}
              </span>
            )}
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
                  padding: '3px',
                  borderRadius: '8px',
                  background: isActingHand ? 'rgba(245, 158, 11, 0.22)' : 'transparent',
                  boxShadow: isActingHand ? '0 0 14px rgba(217, 119, 6, 0.45)' : 'none',
                }}
              >
                {/* Hand Total Badge */}
                <div
                  style={{
                    background: handVal.isBlackjack
                      ? '#d97706'
                      : handVal.isBust
                        ? '#dc2626'
                        : isActingHand
                          ? '#d97706'
                          : '#232324',
                    color: '#ffffff',
                    borderRadius: '999px',
                    padding: '1px 8px',
                    fontSize: '10px',
                    fontWeight: 800,
                    marginBottom: '3px',
                    boxShadow: '0 2px 5px rgba(0,0,0,0.3)',
                    letterSpacing: '0.3px',
                  }}
                >
                  {handVal.isBlackjack
                    ? 'BLACKJACK'
                    : handVal.isBust
                      ? `BUST (${handVal.total})`
                      : handVal.isSoft
                        ? `Soft ${handVal.total}`
                        : handVal.total}
                </div>

                {/* Staggered Cards Fan (Clear Horizontal Overlap, No 98% Occlusion) */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minHeight: '74px',
                  }}
                >
                  {hand.cards.map((card, cIdx) => (
                    <div
                      key={card.id || cIdx}
                      style={{
                        marginLeft: cIdx === 0 ? 0 : '-28px',
                        zIndex: cIdx + 1,
                        boxShadow: '0 4px 10px rgba(0,0,0,0.4)',
                        borderRadius: '7px',
                        transition: 'all 0.2s ease',
                      }}
                    >
                      <CardView card={card} width={50} height={72} />
                    </div>
                  ))}
                </div>

                {/* Hand Bet Amount */}
                <div
                  style={{
                    fontSize: '10.5px',
                    fontWeight: 800,
                    color: '#18181b',
                    marginTop: '3px',
                    background: 'rgba(255, 255, 255, 0.8)',
                    padding: '1px 6px',
                    borderRadius: '4px',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
                  }}
                >
                  €{hand.bet}
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Seat Avatar Badge & Name */}
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
          padding: '4px 10px',
          borderRadius: '8px',
          border: `1.5px solid ${isTurn ? '#d97706' : 'rgba(255,255,255,0.08)'}`,
          boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
          minWidth: '84px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11px', fontWeight: 700 }}>
          {isMiddleHuman ? (
            <span>👤 You</span>
          ) : (
            <>
              {/* Reliable SVG Country Flag */}
              <FlagIcon code={seat.profile?.code} size={18} title={seat.profile?.country} />
              <span>{seat.profile?.name ?? 'Companion'}</span>
            </>
          )}
        </div>

        {/* Bankroll Chips */}
        <div
          style={{
            fontSize: '10.5px',
            color: isTurn ? '#ffffff' : '#fbbf24',
            fontWeight: 800,
            marginTop: '1px',
          }}
        >
          €{seat.bankroll.toLocaleString()}
        </div>
      </div>
    </div>
  )
}
