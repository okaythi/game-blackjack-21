import type { ChipDenomination, DifficultyTier, TableState } from '../engine/types'
import { TableHeader } from './table/table-header'
import { DealerArea } from './table/dealer-area'
import { SeatView } from './table/seat-view'

interface TableViewProps {
  readonly state: TableState
  readonly currentBet?: number
  readonly candyBalance?: number | undefined
  readonly onRequestDeposit?: (() => void) | undefined
  readonly onSelectDifficulty: (tier: DifficultyTier) => void
  readonly onSelectCompanions: (count: 1 | 2 | 3) => void
  readonly isTurbo: boolean
  readonly onToggleTurbo: () => void
  readonly isMuted: boolean
  readonly onToggleMute: () => void
  readonly isTrainerOpen?: boolean
  readonly isTrainerAvailable?: boolean
  readonly onToggleTrainer?: () => void
  readonly onDropChip?: (denom: ChipDenomination) => void
  readonly onClickBetSpot?: () => void
  readonly onReloadBankroll?: (() => void) | undefined
  readonly onRequestLeaveTable?: (() => void) | undefined
}

export function TableView({
  state,
  currentBet = 0,
  candyBalance,
  onRequestDeposit,
  onSelectDifficulty,
  onSelectCompanions,
  isTurbo,
  onToggleTurbo,
  isMuted,
  onToggleMute,
  isTrainerOpen = false,
  isTrainerAvailable = true,
  onToggleTrainer,
  onDropChip,
  onClickBetSpot,
  onRequestLeaveTable,
}: TableViewProps) {
  const { rules, difficulty, seats, activeSeatIndex, dealer, phase } = state

  return (
    <div
      className="blackjack-table-container"
      style={{
        width: '100%',
        maxWidth: '920px',
        margin: '0 auto',
        userSelect: 'none',
        position: 'relative',
        boxSizing: 'border-box',
      }}
    >
      {/* Top Chrome Bar: Difficulty, Companions, Speed, Trainer, Audio, Cash Out */}
      <TableHeader
        difficulty={difficulty}
        companionCount={seats.length - 1}
        phase={phase}
        isTurbo={isTurbo}
        isMuted={isMuted}
        isTrainerOpen={isTrainerOpen}
        isTrainerAvailable={isTrainerAvailable}
        candyBalance={candyBalance}
        onRequestDeposit={onRequestDeposit}
        onSelectDifficulty={onSelectDifficulty}
        onSelectCompanions={onSelectCompanions}
        onToggleTurbo={onToggleTurbo}
        onToggleMute={onToggleMute}
        onToggleTrainer={onToggleTrainer}
        onRequestLeaveTable={onRequestLeaveTable}
      />

      {/* Semicircular Luxury Felt Table Surface */}
      <main
        style={{
          width: '100%',
          aspectRatio: '16 / 7.2',
          maxHeight: 'min(430px, calc(100vh - 200px))',
          background: 'radial-gradient(ellipse at 50% 12%, #ece4d4 0%, #ded4c0 60%, #c4b798 100%)',
          borderRadius: '14px 14px 220px 220px',
          border: '7px solid #332014', // Mahogany / leather padded armrest rail
          boxShadow:
            'inset 0 0 40px rgba(0, 0, 0, 0.4), 0 10px 24px rgba(0, 0, 0, 0.5), 0 0 0 1.5px #d97706',
          position: 'relative',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '10px 14px 14px',
          boxSizing: 'border-box',
        }}
      >
        {/* Table Felt Inscriptions & Arch Rule Lines */}
        <svg
          viewBox="0 0 1000 450"
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            pointerEvents: 'none',
            zIndex: 1,
          }}
          aria-hidden="true"
        >
          {/* Main Semi-circular Betting Boundary Arc */}
          <path
            d="M 120 160 A 380 300 0 0 0 880 160"
            fill="none"
            stroke="#d97706"
            strokeWidth="2"
            strokeOpacity="0.55"
          />
          <path
            d="M 150 160 A 350 270 0 0 0 850 160"
            fill="none"
            stroke="#d97706"
            strokeWidth="1"
            strokeOpacity="0.35"
          />

          {/* Traditional Casino Table Rules Curved Text */}
          <path id="archRulePath" d="M 230 165 A 280 220 0 0 0 770 165" fill="none" />
          <text
            fill="#854d0e"
            fontSize="14"
            fontWeight="800"
            letterSpacing="2.5"
            opacity="0.8"
            style={{ textTransform: 'uppercase' }}
          >
            <textPath href="#archRulePath" startOffset="50%" textAnchor="middle">
              BLACKJACK PAYS {rules.blackjackPayoutRatio === 1.5 ? '3 TO 2' : '6 TO 5'}
            </textPath>
          </text>

          {/* Subtitle Rule */}
          <text
            x="500"
            y="190"
            textAnchor="middle"
            fill="#713f12"
            fontSize="9.5"
            fontWeight="700"
            letterSpacing="1"
            opacity="0.65"
          >
            {rules.dealerHitsSoft17
              ? 'DEALER MUST HIT SOFT 17 AND STAND ON HARD 17'
              : 'DEALER MUST STAND ON 17 AND DRAW TO 16'}
          </text>

          {/* Insurance Inscription */}
          <text
            x="500"
            y="208"
            textAnchor="middle"
            fill="#854d0e"
            fontSize="8.5"
            fontWeight="800"
            letterSpacing="1.5"
            opacity="0.55"
          >
            INSURANCE PAYS 2 TO 1
          </text>
        </svg>

        {/* TOP: DEALER POSITION */}
        <DealerArea dealer={dealer} />

        {/* BOTTOM: PLAYERS ARC SEATING */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-around',
            alignItems: 'flex-end',
            width: '100%',
            maxWidth: '820px',
            margin: '0 auto',
            zIndex: 10,
            gap: '8px',
          }}
        >
          {seats.map((seat) => {
            const isTurn = phase === 'player_turns' && activeSeatIndex === seat.index
            return (
              <SeatView
                key={seat.id}
                seat={seat}
                isTurn={isTurn}
                isMiddleHuman={seat.isHuman}
                pendingBet={currentBet}
                onDropChip={onDropChip}
                onClickBetSpot={onClickBetSpot}
              />
            )
          })}
        </div>
      </main>
    </div>
  )
}
