import { useCallback, useEffect, useRef, useState } from 'react'
import type {
  ActionType,
  ChipDenomination,
  DifficultyTier,
  LegalActions,
  TableState,
} from '../engine/types'
import { BlackjackTable } from '../engine/state-machine'
import { BlackjackAudioEngine } from '../engine/audio/audio-engine'
import { calculateAIDeliberationMs } from '../engine/ai/cadence'
import { TableView } from './table-view'
import { ActionBar } from './action-bar'
import { BettingControls } from './betting-controls'
import { TrainerDrawer } from './trainer-drawer'
import { BuyInModal } from './modals/buy-in-modal'
import { CashOutModal } from './modals/cash-out-modal'
import { fetchCompanions, type CompanionIdentity } from '../services/companion-client'
import {
  adjustCandyBalance,
  getLocalCandyBalance,
  isFirstTimeBlackjackPlayer,
  recordBlackjackPeakScore,
  recordBlackjackPlay,
  subscribeCandyBalance,
} from '../services/platform-storage'

export interface BlackjackStageProps {
  readonly initialBankroll?: number
  readonly initialCandy?: number
  readonly onBankCandy?: (amount: number) => void
  readonly onRecordHighscore?: (score: number) => void
  readonly onUnlockAchievement?: (id: string) => void
}

interface ActiveWallet {
  depositedEur: number
  bonusEur: number
  initialTotalEur: number
}

export function BlackjackStage({
  initialBankroll,
  initialCandy,
  onBankCandy,
  onRecordHighscore,
  onUnlockAchievement,
}: BlackjackStageProps) {
  // Table Seated State
  const [isSeated, setIsSeated] = useState(false)
  const [showCashOutModal, setShowCashOutModal] = useState(false)
  const [candyBalance, setCandyBalance] = useState(() => initialCandy ?? getLocalCandyBalance())
  const [isFirstTimePlayer, setIsFirstTimePlayer] = useState(() => isFirstTimeBlackjackPlayer())
  const [wallet, setWallet] = useState<ActiveWallet>({ depositedEur: 0, bonusEur: 0, initialTotalEur: 0 })

  // Gameplay Settings
  const [difficulty, setDifficulty] = useState<DifficultyTier>('normal')
  const [companionCount, setCompanionCount] = useState<1 | 2 | 3>(2)
  const [companionIdentities, setCompanionIdentities] = useState<CompanionIdentity[]>([])
  const [isTurbo, setIsTurbo] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [currentBet, setCurrentBet] = useState(25)
  const [previousBet, setPreviousBet] = useState(25)
  const [lastMistake, setLastMistake] = useState<string | null>(null)
  const [humanStreak, setHumanStreak] = useState(0)
  const [peakBankroll, setPeakBankroll] = useState(initialBankroll ?? 500)

  // Audio Engine instance
  const audioRef = useRef<BlackjackAudioEngine | null>(null)
  if (!audioRef.current) {
    audioRef.current = new BlackjackAudioEngine()
  }

  // State Machine instance
  const tableRef = useRef<BlackjackTable | null>(null)
  if (!tableRef.current) {
    tableRef.current = new BlackjackTable({
      difficulty: 'normal',
      companionCount: 2,
      humanBankroll: initialBankroll ?? 500,
    })
  }

  const [tableState, setTableState] = useState<TableState>(() => tableRef.current!.getState())

  // Keep candy balance in sync with platform updates
  useEffect(() => {
    return subscribeCandyBalance((updated) => {
      setCandyBalance(updated)
    })
  }, [])

  // Fetch companion identities from Cloudflare Worker
  useEffect(() => {
    let cancelled = false
    void fetchCompanions(companionCount).then((companions) => {
      if (!cancelled && companions.length > 0) {
        setCompanionIdentities(companions)
        if (tableRef.current && (tableState.phase === 'betting' || tableState.phase === 'round_over')) {
          tableRef.current.setCompanionIdentities(companions)
          setTableState({ ...tableRef.current.getState() })
        }
      }
    })
    return () => {
      cancelled = true
    }
  }, [companionCount])

  // Sound helper
  const playSound = useCallback(
    (sound: import('../engine/audio/sfx').BlackjackSfxName) => {
      if (!isMuted && audioRef.current) {
        audioRef.current.play(sound)
      }
    },
    [isMuted],
  )

  // Sync state helper
  const refreshState = useCallback(() => {
    if (tableRef.current) {
      const state = tableRef.current.getState()
      setTableState({ ...state })

      // Check peak bankroll
      const human = state.seats.find((s) => s.isHuman)
      if (human && human.bankroll > peakBankroll) {
        setPeakBankroll(human.bankroll)
        onRecordHighscore?.(human.bankroll)
        recordBlackjackPeakScore(human.bankroll)
        if (human.bankroll >= 5000) {
          onUnlockAchievement?.('blackjack-21_high_roller')
        }
      }
    }
  }, [peakBankroll, onRecordHighscore, onUnlockAchievement])

  // Buy-In Handler: Player confirms taking a seat
  const handleConfirmBuyIn = useCallback(
    (depositedCandies: number, receivedChipsEur: number, bonusEur: number) => {
      const totalChips = receivedChipsEur + bonusEur
      if (totalChips <= 0) return

      // Deduct deposited candies
      if (depositedCandies > 0) {
        adjustCandyBalance(-depositedCandies)
        onBankCandy?.(-depositedCandies)
      }

      // Record first play & update state
      recordBlackjackPlay()
      setIsFirstTimePlayer(false)

      const newWallet: ActiveWallet = {
        depositedEur: receivedChipsEur,
        bonusEur,
        initialTotalEur: totalChips,
      }
      setWallet(newWallet)

      // Initialize table with player bankroll
      const newTable = new BlackjackTable({
        difficulty,
        companionCount,
        humanBankroll: totalChips,
        ...(companionIdentities.length > 0 ? { companionIdentities } : {}),
      })
      tableRef.current = newTable
      setTableState({ ...newTable.getState() })
      setCurrentBet(Math.min(25, totalChips))
      setIsSeated(true)
      playSound('chip_bet')
    },
    [difficulty, companionCount, companionIdentities, onBankCandy, playSound],
  )

  // Leave Table / Cash Out Handler
  const handleConfirmLeaveTable = useCallback(
    (candiesReturn: number) => {
      if (candiesReturn > 0) {
        adjustCandyBalance(candiesReturn)
        onBankCandy?.(candiesReturn)
      }

      const human = tableState.seats.find((s) => s.isHuman)
      if (human && human.bankroll > 0) {
        recordBlackjackPeakScore(human.bankroll)
        onRecordHighscore?.(human.bankroll)
      }

      setShowCashOutModal(false)
      setIsSeated(false)
      setCandyBalance(getLocalCandyBalance())
      playSound('win_chime')
    },
    [tableState.seats, onBankCandy, onRecordHighscore, playSound],
  )

  // Change difficulty
  const handleSelectDifficulty = useCallback(
    (newTier: DifficultyTier) => {
      setDifficulty(newTier)
      const currentHumanChips = tableState.seats.find((s) => s.isHuman)?.bankroll ?? wallet.initialTotalEur
      tableRef.current = new BlackjackTable({
        difficulty: newTier,
        companionCount,
        humanBankroll: currentHumanChips,
        ...(companionIdentities.length > 0 ? { companionIdentities } : {}),
      })
      refreshState()
    },
    [companionCount, tableState.seats, wallet.initialTotalEur, companionIdentities, refreshState],
  )

  // Change companion count
  const handleSelectCompanions = useCallback(
    (count: 1 | 2 | 3) => {
      setCompanionCount(count)
      const currentHumanChips = tableState.seats.find((s) => s.isHuman)?.bankroll ?? wallet.initialTotalEur
      tableRef.current = new BlackjackTable({
        difficulty,
        companionCount: count,
        humanBankroll: currentHumanChips,
        ...(companionIdentities.length > 0 ? { companionIdentities } : {}),
      })
      refreshState()
    },
    [difficulty, tableState.seats, wallet.initialTotalEur, companionIdentities, refreshState],
  )

  // Chip betting handlers
  const handleAddChip = useCallback(
    (denom: ChipDenomination) => {
      const human = tableState.seats.find((s) => s.isHuman)
      if (!human) return
      const maxBet = 5000
      if (currentBet + denom <= human.bankroll && currentBet + denom <= maxBet) {
        setCurrentBet((prev) => prev + denom)
        playSound('chip_click')
      }
    },
    [currentBet, tableState.seats, playSound],
  )

  const handleClearBet = useCallback(() => {
    setCurrentBet(0)
    playSound('ui_click')
  }, [playSound])

  const handleDoubleBet = useCallback(() => {
    const human = tableState.seats.find((s) => s.isHuman)
    if (!human) return
    const newBet = Math.min(human.bankroll, currentBet * 2)
    setCurrentBet(newBet)
    playSound('chip_bet')
  }, [currentBet, tableState.seats, playSound])

  const handleRebet = useCallback(() => {
    const human = tableState.seats.find((s) => s.isHuman)
    if (!human) return
    if (previousBet <= human.bankroll) {
      setCurrentBet(previousBet)
      playSound('chip_bet')
    }
  }, [previousBet, tableState.seats, playSound])

  // Pacing Loop: automated step dispatcher for dealing, AI turns, and dealer draw
  useEffect(() => {
    const table = tableRef.current
    if (!table || !isSeated) return undefined

    const { phase, activeSeatIndex, seats } = tableState

    // 1. Insurance phase: AI decision
    if (phase === 'insurance') {
      const seat = seats[activeSeatIndex]
      if (seat && !seat.isHuman) {
        const delay = calculateAIDeliberationMs(difficulty, true, isTurbo)
        const timer = setTimeout(() => {
          table.stepAI()
          refreshState()
        }, delay)
        return () => clearTimeout(timer)
      }
    }

    // 2. Player turns: AI action
    if (phase === 'player_turns') {
      const seat = seats[activeSeatIndex]
      if (seat && !seat.isHuman) {
        const delay = calculateAIDeliberationMs(difficulty, false, isTurbo)
        const timer = setTimeout(() => {
          const actionTaken = table.stepAI()
          if (actionTaken) {
            playSound('card_slide')
          }
          refreshState()
        }, delay)
        return () => clearTimeout(timer)
      }
    }

    // 3. Dealer turn: draw step by step
    if (phase === 'dealer_turn') {
      const delay = isTurbo ? 100 : 450
      const timer = setTimeout(() => {
        const isDone = table.advanceDealerTurn()
        playSound('card_flip')
        refreshState()
        if (isDone) {
          setTimeout(
            () => {
              const resolutions = table.resolveRound()
              refreshState()

              // Process resolutions for sounds & achievements
              const humanRes = resolutions.find((r) => r.seatIndex === 1)
              if (humanRes) {
                if (humanRes.result === 'blackjack') {
                  playSound('blackjack')
                  onUnlockAchievement?.('blackjack-21_natural_21')
                  setHumanStreak((s) => s + 1)
                } else if (humanRes.result === 'win') {
                  playSound('win_chime')
                  setHumanStreak((s) => s + 1)
                } else if (humanRes.result === 'loss') {
                  playSound('bust')
                  setHumanStreak(0)
                } else {
                  playSound('push')
                }

                // Check 5-win streak
                if (humanStreak + 1 >= 5) {
                  onUnlockAchievement?.('blackjack-21_hot_streak')
                }
              }
            },
            isTurbo ? 150 : 500,
          )
        }
      }, delay)
      return () => clearTimeout(timer)
    }

    return undefined
  }, [
    tableState,
    difficulty,
    isTurbo,
    isSeated,
    humanStreak,
    playSound,
    refreshState,
    onUnlockAchievement,
  ])

  // DEAL button handler
  const handleDeal = useCallback(() => {
    const table = tableRef.current
    if (!table) return
    const human = tableState.seats.find((s) => s.isHuman)
    if (!human || currentBet < 10) return

    setPreviousBet(currentBet)
    playSound('chip_bet')

    // Start round with human bet
    table.startRound({ 1: currentBet })
    playSound('card_slide')
    refreshState()
  }, [currentBet, tableState.seats, playSound, refreshState])

  // Human Action Dispatcher
  const handleHumanAction = useCallback(
    (action: ActionType) => {
      const table = tableRef.current
      if (!table) return

      const optimal = table.getOptimalAction(1)
      if (optimal && action !== optimal && action !== 'stand') {
        setLastMistake(`Basic Strategy suggests ${optimal.toUpperCase()} in this spot.`)
      } else {
        setLastMistake(null)
      }

      playSound(action === 'hit' ? 'card_slide' : action === 'double' ? 'chip_bet' : 'ui_click')
      table.handleAction(action)
      refreshState()

      // Achievement triggers
      if (action === 'double') {
        onUnlockAchievement?.('blackjack-21_double_trouble')
      } else if (action === 'split') {
        onUnlockAchievement?.('blackjack-21_split_master')
      }
    },
    [playSound, refreshState, onUnlockAchievement],
  )

  // Current human legal actions
  const humanSeat = tableState.seats.find((s) => s.isHuman)
  const isHumanTurn =
    (tableState.phase === 'player_turns' && tableState.activeSeatIndex === 1) ||
    (tableState.phase === 'insurance' && tableState.activeSeatIndex === 1)

  const legalActions: LegalActions = tableRef.current?.getLegalActions(1) ?? {
    canHit: false,
    canStand: false,
    canDouble: false,
    canSplit: false,
    canSurrender: false,
    canInsurance: false,
  }

  // Optimal advice for Trainer drawer
  const optimalAction = tableRef.current?.getOptimalAction(1)

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '8px',
        width: '100%',
        position: 'relative',
      }}
    >
      {/* Buy-In "Take a Seat" Modal */}
      {!isSeated && (
        <BuyInModal
          candyBalance={candyBalance}
          isFirstTimePlayer={isFirstTimePlayer}
          onConfirmBuyIn={handleConfirmBuyIn}
        />
      )}

      {/* Leave Table / Cash Out Confirmation Modal */}
      {showCashOutModal && (
        <CashOutModal
          currentChips={humanSeat?.bankroll ?? 0}
          depositedEur={wallet.depositedEur}
          bonusEur={wallet.bonusEur}
          onConfirmLeave={handleConfirmLeaveTable}
          onCancel={() => setShowCashOutModal(false)}
        />
      )}

      {/* Strategy Trainer HUD Drawer */}
      <TrainerDrawer
        tier={difficulty}
        telemetry={tableState.telemetry}
        optimalAction={optimalAction}
        lastMistake={lastMistake}
      />

      {/* Main Table Felt View */}
      <TableView
        state={tableState}
        onSelectDifficulty={handleSelectDifficulty}
        onSelectCompanions={handleSelectCompanions}
        isTurbo={isTurbo}
        onToggleTurbo={() => setIsTurbo((p) => !p)}
        isMuted={isMuted}
        onToggleMute={() => {
          setIsMuted((m) => {
            const next = !m
            if (audioRef.current) audioRef.current.setMuted(next)
            return next
          })
        }}
        onRequestLeaveTable={() => setShowCashOutModal(true)}
      />

      {/* Dynamic Controls Bottom Strip */}
      <div style={{ width: '100%', maxWidth: '720px', minHeight: '74px' }}>
        {tableState.phase === 'betting' ? (
          <BettingControls
            currentBet={currentBet}
            bankroll={humanSeat?.bankroll ?? 0}
            minBet={10}
            maxBet={5000}
            onAddChip={handleAddChip}
            onClearBet={handleClearBet}
            onDoubleBet={handleDoubleBet}
            onDeal={handleDeal}
            canRebet={previousBet > 0 && previousBet <= (humanSeat?.bankroll ?? 0)}
            onRebet={handleRebet}
            disabled={!isSeated}
          />
        ) : isHumanTurn ? (
          <ActionBar
            legal={legalActions}
            onAction={handleHumanAction}
            isInsurancePhase={tableState.phase === 'insurance'}
          />
        ) : (
          /* Pacing / Waiting Indicator */
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              padding: '10px 16px',
              background: 'rgba(24, 24, 27, 0.85)',
              borderRadius: '12px',
              border: '1px solid rgba(217, 119, 6, 0.25)',
              color: '#d4d4d8',
              fontSize: '13px',
              fontWeight: 600,
            }}
          >
            <span style={{ fontSize: '16px' }}>⏳</span>
            <span>
              {tableState.phase === 'dealer_turn'
                ? "Dealer's turn..."
                : tableState.seats[tableState.activeSeatIndex]?.isHuman
                  ? 'Your turn'
                  : `${tableState.seats[tableState.activeSeatIndex]?.profile?.name ?? 'Companion'} is deciding...`}
            </span>
          </div>
        )}
      </div>
    </div>
  )
}

export default BlackjackStage
