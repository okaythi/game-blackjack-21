import type { Seat } from '../../engine/types'
import { CardView } from '../card-view'
import { evaluateHand } from '../../engine/hand'

interface SeatViewProps {
  readonly seat: Seat
  readonly isTurn: boolean
  readonly isMiddleHuman: boolean
}

export function SeatView({ seat, isTurn, isMiddleHuman }: SeatViewProps) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '4px',
        transform: isTurn ? 'scale(1.02)' : 'scale(1)',
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
          /* Empty Betting Spot Circle */
          <div
            style={{
              width: '52px',
              height: '52px',
              borderRadius: '50%',
              border: '2px solid rgba(35, 35, 36, 0.3)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#232324',
              background: seat.currentBet > 0 ? 'rgba(217, 119, 6, 0.2)' : 'transparent',
            }}
          >
            {seat.currentBet > 0 ? (
              <span style={{ fontWeight: 800, fontSize: '12px', color: '#18181b' }}>
                €{seat.currentBet}
              </span>
            ) : (
              <span style={{ fontSize: '9.5px', opacity: 0.6, fontWeight: 700 }}>BET</span>
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
                  padding: '2px',
                  borderRadius: '6px',
                  background: isActingHand ? 'rgba(245, 158, 11, 0.18)' : 'transparent',
                  boxShadow: isActingHand ? '0 0 10px rgba(217, 119, 6, 0.35)' : 'none',
                }}
              >
                {/* Hand Total Badge */}
                <div
                  style={{
                    background: handVal.isBlackjack
                      ? '#d97706'
                      : handVal.isBust
                        ? '#dc2626'
                        : '#232324',
                    color: '#ffffff',
                    borderRadius: '999px',
                    padding: '1px 7px',
                    fontSize: '10px',
                    fontWeight: 800,
                    marginBottom: '2px',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.25)',
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

                {/* Overlapping Cards */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    position: 'relative',
                    paddingLeft: `${Math.max(0, (hand.cards.length - 1) * 14)}px`,
                  }}
                >
                  {hand.cards.map((card, cIdx) => (
                    <div
                      key={card.id || cIdx}
                      style={{
                        position: cIdx === 0 ? 'relative' : 'absolute',
                        left: `${cIdx * 16}px`,
                        zIndex: cIdx + 1,
                      }}
                    >
                      <CardView card={card} width={48} height={68} />
                    </div>
                  ))}
                </div>

                {/* Hand Bet Amount */}
                <div
                  style={{
                    fontSize: '10.5px',
                    fontWeight: 700,
                    color: '#232324',
                    marginTop: '2px',
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
              ? 'rgba(35, 35, 36, 0.9)'
              : 'rgba(35, 35, 36, 0.78)',
          color: isTurn ? '#fef08a' : '#faf7f2',
          padding: '3px 8px',
          borderRadius: '7px',
          border: `1.5px solid ${isTurn ? '#d97706' : 'transparent'}`,
          boxShadow: '0 2px 6px rgba(0,0,0,0.25)',
          minWidth: '78px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '10.5px', fontWeight: 700 }}>
          {isMiddleHuman ? (
            <span>👤 You</span>
          ) : (
            <>
              {/* Reliable ISO Country Code Badge (works universally on Windows, Mac, Linux) */}
              <span
                style={{
                  background: isTurn ? '#d97706' : '#52525b',
                  color: '#ffffff',
                  borderRadius: '3px',
                  padding: '1px 4px',
                  fontSize: '9px',
                  fontWeight: 800,
                  letterSpacing: '0.4px',
                }}
                title={seat.profile?.country}
              >
                {seat.profile?.code ?? 'AI'}
              </span>
              <span>{seat.profile?.name ?? 'Companion'}</span>
            </>
          )}
        </div>
        <div style={{ fontSize: '10.5px', color: isTurn ? '#fef08a' : '#fbbf24', fontWeight: 800, marginTop: '1px' }}>
          €{seat.bankroll.toLocaleString()}
        </div>
      </div>
    </div>
  )
}
