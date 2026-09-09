import type { Card, DealerState } from '../../engine/types'
import { CardView } from '../card-view'
import { evaluateHand } from '../../engine/hand'

interface DealerAreaProps {
  readonly dealer: DealerState
}

export function DealerArea({ dealer }: DealerAreaProps) {
  const visibleCards = dealer.holeCardHidden
    ? dealer.cards.slice(0, 1)
    : dealer.cards
  const dealerVal = visibleCards.length > 0 ? evaluateHand(visibleCards) : null

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        zIndex: 10,
        marginTop: '0px',
      }}
    >
      {/* Dealer Identification Badge */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '5px',
          background: 'rgba(35, 35, 36, 0.88)',
          color: '#faf7f2',
          padding: '2px 8px',
          borderRadius: '999px',
          fontSize: '10px',
          fontWeight: 700,
          letterSpacing: '0.5px',
          textTransform: 'uppercase',
          marginBottom: '4px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
        }}
      >
        <span>Dealer</span>
        {dealerVal && visibleCards.length > 0 && (
          <span style={{ color: '#fef08a' }}>
            ({dealerVal.isSoft && dealerVal.total <= 21 ? `Soft ${dealerVal.total}` : dealerVal.total})
          </span>
        )}
      </div>

      {/* Dealer Cards Stack */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '5px', minHeight: '76px' }}>
        {dealer.cards.length === 0 ? (
          <div
            style={{
              width: '54px',
              height: '76px',
              borderRadius: '6px',
              border: '1.5px dashed rgba(35, 35, 36, 0.25)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'rgba(35, 35, 36, 0.3)',
              fontSize: '9.5px',
              fontWeight: 600,
            }}
          >
            Shoe
          </div>
        ) : (
          dealer.cards.map((card: Card, idx: number) => (
            <CardView
              key={card.id || idx}
              card={card}
              width={54}
              height={76}
              isHidden={idx === 1 && dealer.holeCardHidden}
            />
          ))
        )}
      </div>
    </div>
  )
}
