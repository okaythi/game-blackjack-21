/**
 * Blackjack 21 — Multi-Seat Table State Machine
 *
 * Lightweight orchestrator coordinating game flow across modular sub-engines:
 * - Seat Factory (seat-factory.ts)
 * - Dealing Pipeline (deal.ts)
 * - Legal Actions (legal-actions.ts)
 * - Action Dispatcher (actions.ts)
 * - Turn Flow (turn-flow.ts)
 * - Insurance & Peek (insurance.ts)
 * - Dealer Play (dealer-turn.ts)
 * - Payouts (payouts.ts)
 */

import { Shoe } from './cards'
import { evaluateHand, isTenValue } from './hand'
import { getAIAction, getAIBetAmount, getAIInsuranceDecision } from './ai/ai-decision'
import { getBasicStrategyAction } from './ai/basic-strategy'
import { getRulesForDifficulty } from './rules'
import { buildAIProfile } from './ai/profile'
import { getOfflineCompanionSeed, type CompanionIdentity } from '../services/companion-client'
import { createTableSeats } from './state/seat-factory'
import { evaluateHandPayout } from './state/payouts'
import { stepDealerTurn } from './state/dealer-turn'
import { calculateLegalActions } from './state/legal-actions'
import { executePlayerAction } from './state/actions'
import { findNextPlayableHand } from './state/turn-flow'
import {
  handleInsuranceDecision,
  resolveDealerPeekLogic,
} from './state/insurance'
import {
  buildDealSequence,
  executeDealStep,
  finalizeInitialHands,
  type DealStepTarget,
} from './state/deal'
import type {
  ActionType,
  DealerHand,
  DifficultyTier,
  LegalActions,
  PlayerHand,
  RoundPhase,
  RoundResolution,
  Seat,
  TableRules,
  TableState,
} from './types'

export interface TableConfig {
  readonly difficulty?: DifficultyTier | undefined
  readonly companionCount?: 1 | 2 | 3 | undefined
  readonly humanBankroll?: number | undefined
  readonly customRules?: Partial<TableRules> | undefined
  readonly companionIdentities?: readonly CompanionIdentity[] | undefined
}

export class BlackjackTable {
  private rules: TableRules
  private difficulty: DifficultyTier
  private shoe: Shoe
  private seats: Seat[]
  private dealer: DealerHand
  private phase: RoundPhase = 'betting'
  private activeSeatIndex: number = -1
  private activeHandIndex: number = 0
  private lastResolutions: RoundResolution[] = []
  private roundCount: number = 0
  private shoeReshufflePending: boolean = false
  private companionIdentities?: readonly CompanionIdentity[] | undefined

  // Sequential dealing pipeline
  private dealQueue: DealStepTarget[] = []

  // Insurance queue
  private insuranceSeatQueue: number[] = []

  constructor(config: TableConfig = {}) {
    this.difficulty = config.difficulty ?? 'normal'
    const baseRules = getRulesForDifficulty(this.difficulty)
    this.rules = config.customRules ? { ...baseRules, ...config.customRules } : baseRules
    this.companionIdentities = config.companionIdentities

    this.shoe = new Shoe(this.rules.deckCount, this.rules.cutCardPenetration)
    this.dealer = { cards: [], holeCardHidden: true }

    const companionCount = config.companionCount ?? 2
    const humanBankroll = config.humanBankroll ?? 500

    this.seats = createTableSeats({
      difficulty: this.difficulty,
      companionCount,
      humanBankroll,
      companionIdentities: this.companionIdentities,
    })
    this.prepareCompanionBets()
  }

  /**
   * Pre-calculates and places upcoming round bets for AI companions so their
   * chips and wagers are already visible on the felt during betting and round_over.
   */
  prepareCompanionBets(): void {
    const telemetry = this.shoe.getTelemetry()
    this.seats = this.seats.map((seat) => {
      if (seat.isHuman || !seat.profile) return seat
      const lastHand = seat.hands[0]
      const lastResult = lastHand?.result
      const lastBet = lastHand?.bet
      const plannedBet = getAIBetAmount(
        seat.profile,
        seat.bankroll,
        telemetry,
        10,
        this.difficulty,
        lastResult,
        lastBet,
      )
      const clampedBet = Math.max(10, Math.min(seat.bankroll, plannedBet))
      return {
        ...seat,
        currentBet: clampedBet,
      }
    })
  }

  getState(): TableState {
    return {
      phase: this.phase,
      rules: this.rules,
      difficulty: this.difficulty,
      seats: [...this.seats],
      activeSeatIndex: this.activeSeatIndex,
      activeHandIndex: this.activeHandIndex,
      dealer: { ...this.dealer, cards: [...this.dealer.cards] },
      telemetry: this.shoe.getTelemetry(),
      lastResolutions: [...this.lastResolutions],
      roundCount: this.roundCount,
      shoeReshufflePending: this.shoeReshufflePending,
    }
  }

  setCompanionIdentities(identities: readonly CompanionIdentity[]): void {
    this.companionIdentities = identities
    let compIdx = 0
    this.seats = this.seats.map((seat, i) => {
      if (seat.isHuman) return seat
      const id = identities[compIdx] ?? getOfflineCompanionSeed(compIdx)
      compIdx++
      const profile = buildAIProfile(id, this.difficulty, i)
      return {
        ...seat,
        id: profile.id,
        profile,
      }
    })
    this.prepareCompanionBets()
  }

  placeBet(seatIndex: number, amount: number): void {
    if (this.phase !== 'betting' && this.phase !== 'round_over') {
      throw new Error(`Cannot place bet during ${this.phase} phase`)
    }
    const seat = this.seats[seatIndex]
    if (!seat) throw new Error(`Invalid seat index ${seatIndex}`)
    if (amount <= 0 || amount > seat.bankroll) {
      throw new Error(`Invalid bet amount ${amount} for bankroll ${seat.bankroll}`)
    }

    this.seats[seatIndex] = {
      ...seat,
      currentBet: amount,
    }
  }

  startRound(bets?: Record<number, number> | Map<number, number>, synchronous: boolean = true): void {
    if (this.phase !== 'betting' && this.phase !== 'round_over') {
      throw new Error(`Cannot start round during ${this.phase} phase`)
    }

    if (this.shoeReshufflePending || this.shoe.isReshuffleNeeded()) {
      this.shoe.reset()
      this.shoeReshufflePending = false
    }

    if (bets) {
      const entries = bets instanceof Map ? bets.entries() : Object.entries(bets)
      for (const [idxStr, amount] of entries) {
        const idx = Number(idxStr)
        if (this.seats[idx]) {
          this.placeBet(idx, amount)
        }
      }
    }

    // Ensure AI companions have their bets placed based on latest telemetry and difficulty
    const telemetry = this.shoe.getTelemetry()
    for (let i = 0; i < this.seats.length; i++) {
      const seat = this.seats[i]!
      if (!seat.isHuman && seat.profile) {
        if (seat.currentBet <= 0) {
          const lastHand = seat.hands[0]
          const bet = getAIBetAmount(
            seat.profile,
            seat.bankroll,
            telemetry,
            10,
            this.difficulty,
            lastHand?.result,
            lastHand?.bet,
          )
          this.placeBet(i, Math.max(10, bet))
        }
      }
    }

    const activeSeats = this.seats.filter((s) => s.currentBet > 0)
    if (activeSeats.length === 0) {
      throw new Error('No bets placed to start round')
    }

    // Deduct wagers and initialize empty hands
    this.seats = this.seats.map((seat) => {
      if (seat.currentBet > 0) {
        const newBankroll = seat.bankroll - seat.currentBet
        const initialHand: PlayerHand = {
          id: `${seat.id}_h0`,
          cards: [],
          bet: seat.currentBet,
          status: 'betting',
          result: 'pending',
          payout: 0,
          fromSplit: false,
        }
        return {
          ...seat,
          bankroll: newBankroll,
          insuranceBet: 0,
          hands: [initialHand],
          activeHandIndex: 0,
        }
      }
      return { ...seat, insuranceBet: 0, hands: [], activeHandIndex: 0 }
    })

    this.dealer = { cards: [], holeCardHidden: true }
    this.phase = 'dealing'
    this.roundCount++

    // Build the 2-round deal queue (player 1, player 2, dealer, etc.)
    this.dealQueue = buildDealSequence(this.seats)

    if (synchronous) {
      this.executeSynchronousInitialDeal()
    }
  }

  /**
   * Advances one card deal in the sequential dealing sequence.
   * Returns true if initial deal sequence has completed, false if more cards remain.
   */
  stepDeal(): boolean {
    if (this.phase !== 'dealing') {
      return true
    }
    if (this.dealQueue.length === 0) {
      this.finishInitialDeal()
      return true
    }
    const step = this.dealQueue.shift()!
    const result = executeDealStep(step, this.seats, this.dealer, this.shoe)
    this.seats = result.updatedSeats
    this.dealer = result.updatedDealer

    if (this.dealQueue.length === 0) {
      this.finishInitialDeal()
      return true
    }
    return false
  }

  /**
   * Executes initial 2 cards deal synchronously.
   */
  private executeSynchronousInitialDeal(): void {
    while (this.dealQueue.length > 0) {
      const step = this.dealQueue.shift()!
      const result = executeDealStep(step, this.seats, this.dealer, this.shoe)
      this.seats = result.updatedSeats
      this.dealer = result.updatedDealer
    }

    this.finishInitialDeal()
  }

  private finishInitialDeal(): void {
    this.seats = finalizeInitialHands(this.seats)

    const dealerUpcard = this.dealer.cards[0]!
    if (dealerUpcard.rank === 'A') {
      this.initiateInsurancePhase()
    } else if (isTenValue(dealerUpcard.rank)) {
      this.phase = 'dealer_peek'
      this.resolveDealerPeek()
    } else {
      this.startPlayerTurns()
    }
  }

  private initiateInsurancePhase(): void {
    this.phase = 'insurance'
    this.insuranceSeatQueue = this.seats
      .filter((s) => s.hands.length > 0)
      .map((s) => s.index)

    if (this.insuranceSeatQueue.length > 0) {
      this.activeSeatIndex = this.insuranceSeatQueue[0]!
    } else {
      this.phase = 'dealer_peek'
      this.resolveDealerPeek()
    }
  }

  private resolveDealerPeek(): void {
    const result = resolveDealerPeekLogic(this.dealer, this.seats, this.shoe)
    this.dealer = result.updatedDealer
    this.seats = result.updatedSeats

    if (result.dealerHasBlackjack) {
      this.resolveRound()
    } else {
      this.startPlayerTurns()
    }
  }

  private startPlayerTurns(): void {
    this.phase = 'player_turns'
    this.advanceToNextPlayableHand(0, 0)
  }

  private advanceToNextPlayableHand(startSeatIdx: number, startHandIdx: number): void {
    const next = findNextPlayableHand(this.seats, startSeatIdx, startHandIdx)
    this.activeSeatIndex = next.activeSeatIndex
    this.activeHandIndex = next.activeHandIndex

    if (next.isRoundOverForPlayers) {
      this.phase = 'dealer_turn'
    } else {
      const seat = this.seats[this.activeSeatIndex]
      if (seat) {
        this.seats[this.activeSeatIndex] = { ...seat, activeHandIndex: this.activeHandIndex }
      }
    }
  }

  getLegalActions(seatIndex?: number, handIndex?: number): LegalActions {
    return calculateLegalActions(
      this.seats,
      this.phase,
      this.activeSeatIndex,
      this.activeHandIndex,
      this.rules,
      seatIndex,
      handIndex,
    )
  }

  handleAction(action: ActionType): void {
    if (this.phase === 'insurance') {
      const result = handleInsuranceDecision(
        action,
        this.seats,
        this.activeSeatIndex,
        this.insuranceSeatQueue,
      )
      this.seats = result.updatedSeats
      this.insuranceSeatQueue = result.updatedQueue
      this.activeSeatIndex = result.nextActiveSeatIndex

      if (result.isInsuranceComplete) {
        this.phase = 'dealer_peek'
        this.resolveDealerPeek()
      }
      return
    }

    if (this.phase !== 'player_turns') {
      throw new Error(`Cannot perform action ${action} during ${this.phase} phase`)
    }

    const legal = this.getLegalActions(this.activeSeatIndex, this.activeHandIndex)
    const result = executePlayerAction(
      action,
      this.seats,
      this.activeSeatIndex,
      this.activeHandIndex,
      this.shoe,
      this.rules,
      legal,
    )

    this.seats = result.updatedSeats

    if (result.mustAdvanceHand) {
      this.advanceToNextPlayableHand(this.activeSeatIndex, this.activeHandIndex + 1)
    }
  }

  advanceDealerTurn(): boolean {
    this.phase = 'dealer_turn'
    const allBustedOrSurrendered = this.seats.every((seat) =>
      seat.hands.every((h) => h.status === 'busted' || h.status === 'surrendered'),
    )

    const result = stepDealerTurn(
      this.dealer,
      this.shoe,
      this.rules,
      allBustedOrSurrendered,
    )

    this.dealer = result.dealer
    return result.isTurnComplete
  }

  resolveRound(): RoundResolution[] {
    const resolutions: RoundResolution[] = []

    this.seats = this.seats.map((seat) => {
      let newBankroll = seat.bankroll
      const updatedHands: PlayerHand[] = []

      for (let hIdx = 0; hIdx < seat.hands.length; hIdx++) {
        const hand = seat.hands[hIdx]!
        const { result, payout, netWin, summary } = evaluateHandPayout(
          hand,
          this.dealer.cards,
          this.rules,
        )

        newBankroll += payout
        resolutions.push({
          seatIndex: seat.index,
          handIndex: hIdx,
          result,
          netWin,
          playerTotal: hand.cards.length > 0 ? evaluateHand(hand.cards, hand.fromSplit).total : 0,
          dealerTotal: this.dealer.cards.length > 0 ? evaluateHand(this.dealer.cards).total : 0,
          summary,
        })

        updatedHands.push({
          ...hand,
          result,
          payout,
          status: 'settled',
        })
      }

      return {
        ...seat,
        bankroll: newBankroll,
        currentBet: 0,
        insuranceBet: 0,
        hands: updatedHands,
      }
    })

    this.phase = 'round_over'
    this.activeSeatIndex = -1
    this.activeHandIndex = 0
    this.lastResolutions = resolutions

    if (this.shoe.isReshuffleNeeded()) {
      this.shoeReshufflePending = true
    }

    this.prepareCompanionBets()

    return resolutions
  }

  reloadHumanBankroll(amount: number = 500): void {
    const humanIdx = this.seats.findIndex((s) => s.isHuman)
    if (humanIdx !== -1) {
      const human = this.seats[humanIdx]!
      this.seats[humanIdx] = {
        ...human,
        bankroll: human.bankroll + amount,
      }
    }
  }

  getOptimalAction(seatIndex: number = 1, handIndex: number = 0): ActionType | undefined {
    const seat = this.seats[seatIndex]
    if (!seat || seat.hands.length === 0) return undefined
    const hand = seat.hands[handIndex]
    if (!hand || hand.status !== 'active') return undefined

    const dealerUpcard = this.dealer.cards[0]
    if (!dealerUpcard) return undefined

    const legal = this.getLegalActions(seatIndex, handIndex)
    return getBasicStrategyAction(hand.cards, dealerUpcard, this.rules, {
      canDouble: legal.canDouble,
      canSplit: legal.canSplit,
      canSurrender: legal.canSurrender,
      fromSplit: hand.fromSplit,
    })
  }

  stepAI(): boolean {
    if (this.phase === 'insurance') {
      const seat = this.seats[this.activeSeatIndex]
      if (!seat || seat.isHuman || !seat.profile) {
        return false
      }
      try {
        const takesInsurance = getAIInsuranceDecision(seat.profile, this.shoe.getTelemetry())
        this.handleAction(takesInsurance ? 'insurance_yes' : 'insurance_no')
        return true
      } catch (err) {
        console.warn('AI insurance action error, declining insurance:', err)
        this.handleAction('insurance_no')
        return true
      }
    }

    if (this.phase === 'player_turns') {
      const seat = this.seats[this.activeSeatIndex]
      if (!seat || seat.isHuman || !seat.profile) {
        this.advanceToNextPlayableHand(this.activeSeatIndex, this.activeHandIndex + 1)
        return false
      }
      const hand = seat.hands[this.activeHandIndex]
      if (!hand || hand.status !== 'active') {
        this.advanceToNextPlayableHand(this.activeSeatIndex, this.activeHandIndex + 1)
        return true
      }

      try {
        const legal = this.getLegalActions()
        const dealerUpcard = this.dealer.cards[0]!
        const action = getAIAction(
          seat.profile,
          hand,
          dealerUpcard,
          this.rules,
          this.shoe.getTelemetry(),
          legal,
        )

        this.handleAction(action)
        return true
      } catch (err) {
        console.warn('AI turn error, auto-standing to prevent freeze:', err)
        try {
          this.handleAction('stand')
        } catch {
          this.advanceToNextPlayableHand(this.activeSeatIndex, this.activeHandIndex + 1)
        }
        return true
      }
    }

    return false
  }
}
