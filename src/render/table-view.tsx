import type { DifficultyTier, TableState } from '../engine/types'
import { CardView } from './card-view'
import { evaluateHand } from '../engine/hand'

interface TableViewProps {
  readonly state: TableState
  readonly onSelectDifficulty: (tier: DifficultyTier) => void
  readonly onSelectCompanions: (count: 1 | 2 | 3) => void
  readonly isTurbo: boolean
  readonly onToggleTurbo: () => void
  readonly isMuted: boolean
  readonly onToggleMute: () => void
  readonly onReloadBankroll?: () => void
}

export function TableView({
  state,
  onSelectDifficulty,
  onSelectCompanions,
  isTurbo,
  onToggleTurbo,
  isMuted,
  onToggleMute,
  onReloadBankroll,
}: TableViewProps) {
  const { rules, difficulty, seats, activeSeatIndex, dealer, phase } = state

  // Compute dealer hand evaluation
  const dealerVisibleCards = dealer.holeCardHidden
    ? dealer.cards.slice(0, 1)
    : dealer.cards
  const dealerVal = dealerVisibleCards.length > 0 ? evaluateHand(dealerVisibleCards) : null

  return (
    <div
      className="blackjack-table-container"
      style={{
        width: '100%',
        maxWidth: '1020px',
        margin: '0 auto',
        userSelect: 'none',
        position: 'relative',
      }}
    >
      {/* Top Chrome Bar: Difficulty, Companions, Turbo, Audio */}
      <header
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '8px',
          marginBottom: '10px',
          padding: '6px 12px',
          background: 'rgba(24, 24, 27, 0.85)',
          borderRadius: '10px',
          border: '1px solid rgba(217, 119, 6, 0.25)',
          backdropFilter: 'blur(8px)',
          fontSize: '12px',
          color: '#d4d4d8',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ color: '#fef08a', fontWeight: 800, letterSpacing: '0.5px' }}>
            BLACKJACK 21
          </span>
          <span style={{ color: '#71717a' }}>•</span>
          <span>Tier:</span>
          {(['easy', 'normal', 'expert'] as const).map((tier) => (
            <button
              key={tier}
              type="button"
              disabled={phase !== 'betting'}
              onClick={() => onSelectDifficulty(tier)}
              style={{
                background: difficulty === tier ? '#d97706' : 'rgba(255,255,255,0.06)',
                color: difficulty === tier ? '#ffffff' : '#a1a1aa',
                border: 'none',
                borderRadius: '5px',
                padding: '3px 8px',
                fontSize: '11px',
                fontWeight: 700,
                cursor: phase === 'betting' ? 'pointer' : 'not-allowed',
                textTransform: 'capitalize',
              }}
            >
              {tier}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {/* Companion Count */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ color: '#a1a1aa' }}>AI Companions:</span>
            {([1, 2, 3] as const).map((cnt) => (
              <button
                key={cnt}
                type="button"
                disabled={phase !== 'betting'}
                onClick={() => onSelectCompanions(cnt)}
                style={{
                  background: seats.length - 1 === cnt ? '#d97706' : 'rgba(255,255,255,0.06)',
                  color: seats.length - 1 === cnt ? '#ffffff' : '#a1a1aa',
                  border: 'none',
                  borderRadius: '5px',
                  padding: '2px 7px',
                  fontSize: '11px',
                  fontWeight: 700,
                  cursor: phase === 'betting' ? 'pointer' : 'not-allowed',
                }}
              >
                {cnt}
              </button>
            ))}
          </div>

          {/* Turbo Toggle */}
          <button
            type="button"
            onClick={onToggleTurbo}
            style={{
              background: isTurbo ? 'rgba(245, 158, 11, 0.2)' : 'rgba(255,255,255,0.06)',
              color: isTurbo ? '#fef08a' : '#a1a1aa',
              border: `1px solid ${isTurbo ? '#d97706' : 'rgba(255,255,255,0.1)'}`,
              borderRadius: '6px',
              padding: '3px 8px',
              fontSize: '11px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            <span>⚡</span>
            <span>{isTurbo ? 'Turbo ON' : 'Turbo'}</span>
          </button>

          {/* Audio Mute */}
          <button
            type="button"
            onClick={onToggleMute}
            style={{
              background: 'rgba(255,255,255,0.06)',
              color: '#a1a1aa',
              border: 'none',
              borderRadius: '6px',
              padding: '3px 8px',
              fontSize: '12px',
              cursor: 'pointer',
            }}
            aria-label={isMuted ? 'Unmute Audio' : 'Mute Audio'}
          >
            {isMuted ? '🔇' : '🔊'}
          </button>
        </div>
      </header>

      {/* Semicircular Luxury Felt Table Surface */}
      <main
        style={{
          width: '100%',
          aspectRatio: '16 / 9.5',
          background: 'radial-gradient(ellipse at 50% 15%, #ece4d4 0%, #dfd5c2 65%, #c8bc9f 100%)',
          borderRadius: '16px 16px 260px 260px',
          border: '14px solid #332014', // Mahogany / leather padded armrest rail
          boxShadow:
            'inset 0 0 60px rgba(0, 0, 0, 0.4), 0 16px 36px rgba(0, 0, 0, 0.6), 0 0 0 2px #d97706',
          position: 'relative',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '24px 28px 40px',
          boxSizing: 'border-box',
        }}
      >
        {/* Table Felt Inscriptions & Arch Rule Lines */}
        <svg
          width="100%"
          height="100%"
          viewBox="0 0 1000 580"
          style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none' }}
        >
          {/* Outer Arch Table Outline */}
          <path
            d="M 120,260 A 420,380 0 0,0 880,260"
            fill="none"
            stroke="#232324"
            strokeWidth="2.5"
            strokeOpacity="0.25"
          />
          {/* Inner Arch Rule Line */}
          <path
            d="M 180,240 A 340,310 0 0,0 820,240"
            fill="none"
            stroke="#232324"
            strokeWidth="1.2"
            strokeOpacity="0.2"
          />
          {/* Casino Rule Branding Text Along Arc */}
          <text
            x="500"
            y="200"
            textAnchor="middle"
            fill="#232324"
            fontSize="18"
            fontWeight="800"
            letterSpacing="2px"
            opacity="0.38"
            fontFamily="system-ui, -apple-system, sans-serif"
          >
            {rules.blackjackPayoutRatio === 1.5 ? 'BLACKJACK PAYS 3 TO 2' : 'BLACKJACK PAYS 6 TO 5'}
          </text>
          <text
            x="500"
            y="226"
            textAnchor="middle"
            fill="#232324"
            fontSize="13"
            fontWeight="700"
            letterSpacing="1.2px"
            opacity="0.32"
            fontFamily="system-ui, -apple-system, sans-serif"
          >
            {rules.dealerHitsSoft17 ? 'DEALER MUST HIT SOFT 17' : 'DEALER MUST STAND ON ALL 17s'}
          </text>
          <text
            x="500"
            y="248"
            textAnchor="middle"
            fill="#232324"
            fontSize="11.5"
            fontWeight="600"
            letterSpacing="0.8px"
            opacity="0.26"
            fontFamily="system-ui, -apple-system, sans-serif"
          >
            INSURANCE PAYS 2 TO 1
          </text>
        </svg>

        {/* TOP: DEALER POSITION */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            zIndex: 10,
            marginTop: '4px',
          }}
        >
          {/* Dealer Identification Badge */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: 'rgba(35, 35, 36, 0.85)',
              color: '#faf7f2',
              padding: '3px 12px',
              borderRadius: '999px',
              fontSize: '11px',
              fontWeight: 700,
              letterSpacing: '0.6px',
              textTransform: 'uppercase',
              marginBottom: '8px',
              boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
            }}
          >
            <span>Dealer</span>
            {dealerVal && dealerVisibleCards.length > 0 && (
              <span style={{ color: '#fef08a' }}>
                ({dealerVal.isSoft && dealerVal.total <= 21 ? `Soft ${dealerVal.total}` : dealerVal.total})
              </span>
            )}
          </div>

          {/* Dealer Cards Stack */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minHeight: '96px' }}>
            {dealer.cards.length === 0 ? (
              <div
                style={{
                  width: '68px',
                  height: '96px',
                  borderRadius: '7px',
                  border: '1.5px dashed rgba(35, 35, 36, 0.25)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'rgba(35, 35, 36, 0.3)',
                  fontSize: '11px',
                  fontWeight: 600,
                }}
              >
                Shoe
              </div>
            ) : (
              dealer.cards.map((card, idx) => (
                <CardView
                  key={card.id || idx}
                  card={card}
                  isHidden={idx === 1 && dealer.holeCardHidden}
                />
              ))
            )}
          </div>
        </div>

        {/* BOTTOM: MULTI-SEAT ARC POSITIONS (2 to 4 Seats, Middle is ALWAYS Human) */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${seats.length}, 1fr)`,
            alignItems: 'end',
            gap: '12px',
            zIndex: 10,
            marginTop: '20px',
          }}
        >
          {seats.map((seat) => {
            const isTurn = phase === 'player_turns' && activeSeatIndex === seat.index
            const isMiddleHuman = seat.isHuman

            return (
              <div
                key={seat.id}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '6px',
                  transform: isTurn ? 'scale(1.03)' : 'scale(1)',
                  transition: 'transform 0.2s ease',
                }}
              >
                {/* Seat Hands Rendering (Supports Split Hands) */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    minHeight: '96px',
                    marginBottom: '4px',
                  }}
                >
                  {seat.hands.length === 0 ? (
                    /* Empty Betting Spot Circle */
                    <div
                      style={{
                        width: '60px',
                        height: '60px',
                        borderRadius: '50%',
                        border: '2px solid rgba(35, 35, 36, 0.25)',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#232324',
                        background: seat.currentBet > 0 ? 'rgba(217, 119, 6, 0.15)' : 'transparent',
                      }}
                    >
                      {seat.currentBet > 0 ? (
                        <span style={{ fontWeight: 800, fontSize: '13px', color: '#18181b' }}>
                          ${seat.currentBet}
                        </span>
                      ) : (
                        <span style={{ fontSize: '10px', opacity: 0.5, fontWeight: 700 }}>BET</span>
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
                            background: isActingHand ? 'rgba(245, 158, 11, 0.18)' : 'transparent',
                            boxShadow: isActingHand ? '0 0 12px rgba(217, 119, 6, 0.4)' : 'none',
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
                              padding: '1px 8px',
                              fontSize: '11px',
                              fontWeight: 800,
                              marginBottom: '3px',
                              boxShadow: '0 2px 4px rgba(0,0,0,0.25)',
                            }}
                          >
                            {handVal.isBlackjack
                              ? 'BLACKJACK!'
                              : handVal.isBust
                                ? `BUST (${handVal.total})`
                                : handVal.isSoft
                                  ? `Soft ${handVal.total}`
                                  : handVal.total}
                          </div>

                          {/* Overlapping Cards Container */}
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              position: 'relative',
                              paddingLeft: `${Math.max(0, (hand.cards.length - 1) * 16)}px`,
                            }}
                          >
                            {hand.cards.map((card, cIdx) => (
                              <div
                                key={card.id || cIdx}
                                style={{
                                  position: cIdx === 0 ? 'relative' : 'absolute',
                                  left: `${cIdx * 18}px`,
                                  zIndex: cIdx + 1,
                                }}
                              >
                                <CardView card={card} width={56} height={78} />
                              </div>
                            ))}
                          </div>

                          {/* Hand Bet Amount */}
                          <div
                            style={{
                              fontSize: '11px',
                              fontWeight: 700,
                              color: '#232324',
                              marginTop: '4px',
                            }}
                          >
                            ${hand.bet}
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
                        ? 'rgba(35, 35, 36, 0.85)'
                        : 'rgba(35, 35, 36, 0.72)',
                    color: isTurn ? '#fef08a' : '#faf7f2',
                    padding: '4px 10px',
                    borderRadius: '8px',
                    border: `1.5px solid ${isTurn ? '#d97706' : 'transparent'}`,
                    boxShadow: '0 3px 8px rgba(0,0,0,0.25)',
                    minWidth: '85px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11.5px', fontWeight: 700 }}>
                    <span>{isMiddleHuman ? '👤' : seat.profile?.flag ?? '🤖'}</span>
                    <span>{isMiddleHuman ? 'You (Middle)' : seat.profile?.name ?? 'Companion'}</span>
                  </div>
                  <div style={{ fontSize: '11px', color: isTurn ? '#fef08a' : '#fbbf24', fontWeight: 800 }}>
                    ${seat.bankroll.toLocaleString()}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </main>

      {/* Low Bankroll Reload Button */}
      {seats.find((s) => s.isHuman)?.bankroll! < rules.doubleAllowedOn.length && onReloadBankroll && (
        <div style={{ textAlign: 'center', marginTop: '8px' }}>
          <button
            type="button"
            onClick={onReloadBankroll}
            style={{
              background: '#d97706',
              color: '#ffffff',
              border: 'none',
              borderRadius: '6px',
              padding: '6px 14px',
              fontSize: '12px',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            Bank Reload (+$500 VIP Rebate)
          </button>
        </div>
      )}
    </div>
  )
}
