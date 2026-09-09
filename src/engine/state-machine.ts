/**
 * Blackjack 21 — Multi-Seat Table State Machine
 *
 * Orchestrates game flow, turn order, legal actions, dealer peek, insurance,
 * splitting/doubling/surrender, dealer drawing, and payout resolutions across
 * 1 human player (middle seat) and 1 to 3 AI companions.
 */

import { Shoe } from './cards'
import {
  canDoubleHand,
  canHitHand,
  canSplitHand,
  canStandHand,
  canSurrenderHand,
  evaluateHand,
  isTenValue,
} from './hand'
import { getAIAction, getAIBetAmount, getAIInsuranceDecision } from './ai/ai-decision'
import { getBasicStrategyAction } from './ai/basic-strategy'
import { getRulesForDifficulty } from './rules'
import { createTableSeats } from './state/seat-factory'
import { evaluateHandPayout } from './state/payouts'
import { stepDealerTurn } from './state/dealer-turn'
import { buildAIProfile } from './ai/profile'
import { getOfflineCompanionSeed, type CompanionIdentity } from '../services/companion-client'
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

  // Queue of seats pending insurance response during 'insurance' phase
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
  }

  /**
   * Returns an immutable snapshot of current table state.
   */
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

  /**
   * Sets or updates the companion identities from the Cloudflare Worker API.
   */
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
  }

  /**
   * Places or updates a bet for a specific seat.
   */
  placeBet(seatIndex: number, amount: number): void {
    if (this.phase !== 'betting' && this.phase !== 'round_over') {
      throw new Error(`Cannot place bet during ${this.phase} phase`)
    }
    const seat = this.seats[seatIndex]
    if (!seat) {
      throw new Error(`Invalid seat index ${seatIndex}`)
    }
    if (amount <= 0 || amount > seat.bankroll) {
      throw new Error(`Invalid bet amount ${amount} for bankroll ${seat.bankroll}`)
    }

    this.seats[seatIndex] = {
      ...seat,
      currentBet: amount,
    }
  }

  /**
   * Starts a new round.
   * If bets are provided, sets them; otherwise ensures all active seats have valid bets.
   */
  startRound(bets?: Record<number, number> | Map<number, number>): void {
    if (this.phase !== 'betting' && this.phase !== 'round_over') {
      throw new Error(`Cannot start round during ${this.phase} phase`)
    }

    // Reshuffle if cut card was reached in previous round
    if (this.shoeReshufflePending || this.shoe.isReshuffleNeeded()) {
      this.shoe.reset()
      this.shoeReshufflePending = false
    }

    // Set bets from argument if provided
    if (bets) {
      const entries = bets instanceof Map ? bets.entries() : Object.entries(bets)
      for (const [idxStr, amount] of entries) {
        const idx = Number(idxStr)
        if (this.seats[idx]) {
          this.placeBet(idx, amount)
        }
      }
    }

    // Ensure AI seats have bets
    const telemetry = this.shoe.getTelemetry()
    for (let i = 0; i < this.seats.length; i++) {
      const seat = this.seats[i]!
      if (!seat.isHuman && seat.profile) {
        const bet = getAIBetAmount(seat.profile, seat.bankroll, telemetry)
        this.placeBet(i, Math.max(10, bet))
      }
    }

    // Validate that at least human or one seat has a bet
    const activeSeats = this.seats.filter((s) => s.currentBet > 0)
    if (activeSeats.length === 0) {
      throw new Error('No bets placed to start round')
    }

    // Deduct initial bets and set initial hands
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
    this.lastResolutions = []
    this.phase = 'dealing'

    // Deal two cards to each active seat and dealer
    this.dealInitialCards()
  }

  private dealInitialCards(): void {
    // Round 1 of dealing: 1 card to each active player, 1 to dealer (upcard)
    this.seats = this.seats.map((seat) => {
      if (seat.hands.length === 0) return seat
      const card = this.shoe.dealCard(true)
      const hand = seat.hands[0]!
      return {
        ...seat,
        hands: [{ ...hand, cards: [...hand.cards, card] }],
      }
    })
    const dealerUpcard = this.shoe.dealCard(true)
    this.dealer = {
      ...this.dealer,
      cards: [...this.dealer.cards, dealerUpcard],
    }

    // Round 2 of dealing: 1 card to each active player, 1 hole card to dealer (hidden)
    this.seats = this.seats.map((seat) => {
      if (seat.hands.length === 0) return seat
      const card = this.shoe.dealCard(true)
      const hand = seat.hands[0]!
      return {
        ...seat,
        hands: [{ ...hand, cards: [...hand.cards, card] }],
      }
    })
    const dealerHoleCard = this.shoe.dealCard(false)
    this.dealer = {
      ...this.dealer,
      cards: [...this.dealer.cards, dealerHoleCard],
    }

    // Update hand statuses to 'active' or 'blackjack'
    this.seats = this.seats.map((seat) => {
      if (seat.hands.length === 0) return seat
      const hand = seat.hands[0]!
      const val = evaluateHand(hand.cards)
      const status = val.isBlackjack ? 'blackjack' : 'active'
      return {
        ...seat,
        hands: [{ ...hand, status }],
      }
    })

    // After deal: check insurance or dealer peek
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
    const dealerVal = evaluateHand(this.dealer.cards)

    if (dealerVal.isBlackjack) {
      // Dealer has Blackjack! Reveal hole card immediately
      this.dealer = { ...this.dealer, holeCardHidden: false }
      this.shoe.countVisibleCard(this.dealer.cards[1]!)

      // Pay insurance 2:1 to insured players
      this.seats = this.seats.map((seat) => {
        if (seat.insuranceBet > 0) {
          const insurancePayout = seat.insuranceBet * 3 // Original bet + 2:1 win
          return {
            ...seat,
            bankroll: seat.bankroll + insurancePayout,
          }
        }
        return seat
      })

      // Immediately resolve round
      this.resolveRound()
    } else {
      // Dealer does NOT have blackjack: forfeit insurance bets and proceed to player turns
      this.seats = this.seats.map((seat) => ({ ...seat, insuranceBet: 0 }))
      this.startPlayerTurns()
    }
  }

  private startPlayerTurns(): void {
    this.phase = 'player_turns'
    this.activeSeatIndex = -1
    this.activeHandIndex = 0
    this.advanceToNextPlayableHand(0, 0)
  }

  private advanceToNextPlayableHand(startSeatIdx: number, startHandIdx: number): void {
    for (let sIdx = startSeatIdx; sIdx < this.seats.length; sIdx++) {
      const seat = this.seats[sIdx]!
      if (seat.hands.length === 0) continue

      const hStart = sIdx === startSeatIdx ? startHandIdx : 0
      for (let hIdx = hStart; hIdx < seat.hands.length; hIdx++) {
        const hand = seat.hands[hIdx]!
        if (hand.status === 'active') {
          this.activeSeatIndex = sIdx
          this.activeHandIndex = hIdx
          this.seats[sIdx] = { ...seat, activeHandIndex: hIdx }
          return
        }
      }
    }

    // No more active player hands: advance to dealer turn
    this.phase = 'dealer_turn'
    this.activeSeatIndex = -1
    this.activeHandIndex = 0
  }

  /**
   * Returns current legal actions for the active hand.
   */
  getLegalActions(seatIndex?: number, handIndex?: number): LegalActions {
    const sIdx = seatIndex ?? this.activeSeatIndex
    const hIdx = handIndex ?? this.activeHandIndex

    if (this.phase === 'insurance') {
      const seat = this.seats[sIdx]
      if (!seat) return this.noLegalActions()
      const insuranceCost = Math.floor(seat.currentBet / 2)
      const canInsurance = seat.bankroll >= insuranceCost
      return {
        canHit: false,
        canStand: false,
        canDouble: false,
        canSplit: false,
        canSurrender: false,
        canInsurance,
      }
    }

    if (this.phase !== 'player_turns') {
      return this.noLegalActions()
    }

    const seat = this.seats[sIdx]
    if (!seat) return this.noLegalActions()
    const hand = seat.hands[hIdx]
    if (!hand || hand.status !== 'active') return this.noLegalActions()

    const val = evaluateHand(hand.cards, hand.fromSplit)

    return {
      canHit: canHitHand(val),
      canStand: canStandHand(val),
      canDouble: canDoubleHand(hand.cards, seat.bankroll, hand.bet, this.rules, hand.fromSplit),
      canSplit: canSplitHand(
        hand.cards,
        seat.bankroll,
        hand.bet,
        seat.hands.length,
        this.rules,
        hand.fromSplit,
      ),
      canSurrender: canSurrenderHand(hand.cards, this.rules, hand.fromSplit),
      canInsurance: false,
    }
  }

  private noLegalActions(): LegalActions {
    return {
      canHit: false,
      canStand: false,
      canDouble: false,
      canSplit: false,
      canSurrender: false,
      canInsurance: false,
    }
  }

  /**
   * Applies an action to the active seat/hand.
   */
  handleAction(action: ActionType): void {
    if (this.phase === 'insurance') {
      this.handleInsuranceAction(action)
      return
    }

    if (this.phase !== 'player_turns') {
      throw new Error(`Cannot perform action ${action} during ${this.phase} phase`)
    }

    const seatIdx = this.activeSeatIndex
    const handIdx = this.activeHandIndex
    const seat = this.seats[seatIdx]
    if (!seat) throw new Error(`Invalid active seat ${seatIdx}`)
    const hand = seat.hands[handIdx]
    if (!hand) throw new Error(`Invalid active hand ${handIdx}`)

    const legal = this.getLegalActions(seatIdx, handIdx)

    switch (action) {
      case 'hit': {
        if (!legal.canHit) throw new Error('Action hit is not legal')
        const card = this.shoe.dealCard(true)
        const newCards = [...hand.cards, card]
        const val = evaluateHand(newCards, hand.fromSplit)

        if (val.isBust) {
          const updatedHands = seat.hands.map((h, i) =>
            i === handIdx ? { ...h, cards: newCards, status: 'busted' as const, result: 'loss' as const } : h,
          )
          this.seats[seatIdx] = { ...seat, hands: updatedHands }
          this.advanceToNextPlayableHand(seatIdx, handIdx + 1)
        } else if (val.total === 21) {
          const updatedHands = seat.hands.map((h, i) =>
            i === handIdx ? { ...h, cards: newCards, status: 'stood' as const } : h,
          )
          this.seats[seatIdx] = { ...seat, hands: updatedHands }
          this.advanceToNextPlayableHand(seatIdx, handIdx + 1)
        } else {
          const updatedHands = seat.hands.map((h, i) =>
            i === handIdx ? { ...h, cards: newCards } : h,
          )
          this.seats[seatIdx] = { ...seat, hands: updatedHands }
        }
        break
      }

      case 'stand': {
        if (!legal.canStand) throw new Error('Action stand is not legal')
        const updatedHands = seat.hands.map((h, i) =>
          i === handIdx ? { ...h, status: 'stood' as const } : h,
        )
        this.seats[seatIdx] = { ...seat, hands: updatedHands }
        this.advanceToNextPlayableHand(seatIdx, handIdx + 1)
        break
      }

      case 'double': {
        if (!legal.canDouble) throw new Error('Action double is not legal')
        const additionalBet = hand.bet
        const newBankroll = seat.bankroll - additionalBet
        const card = this.shoe.dealCard(true)
        const newCards = [...hand.cards, card]
        const val = evaluateHand(newCards, hand.fromSplit)
        const newStatus = val.isBust ? 'busted' : 'doubled'
        const newResult = val.isBust ? 'loss' : 'pending'

        const updatedHands = seat.hands.map((h, i) =>
          i === handIdx
            ? {
                ...h,
                cards: newCards,
                bet: hand.bet * 2,
                status: newStatus as PlayerHand['status'],
                result: newResult as PlayerHand['result'],
              }
            : h,
        )
        this.seats[seatIdx] = { ...seat, bankroll: newBankroll, hands: updatedHands }
        this.advanceToNextPlayableHand(seatIdx, handIdx + 1)
        break
      }

      case 'split': {
        if (!legal.canSplit) throw new Error('Action split is not legal')
        const splitBet = hand.bet
        const newBankroll = seat.bankroll - splitBet

        const card0 = hand.cards[0]!
        const card1 = hand.cards[1]!

        const newCard0 = this.shoe.dealCard(true)
        const newCard1 = this.shoe.dealCard(true)

        const isAcesSplit = card0.rank === 'A' || card1.rank === 'A'
        const hand0Status = isAcesSplit && !this.rules.resplitAces ? 'stood' : 'active'
        const hand1Status = isAcesSplit && !this.rules.resplitAces ? 'stood' : 'active'

        const hand0: PlayerHand = {
          id: `${seat.id}_h${seat.hands.length}_0`,
          cards: [card0, newCard0],
          bet: splitBet,
          status: hand0Status,
          result: 'pending',
          payout: 0,
          fromSplit: true,
        }

        const hand1: PlayerHand = {
          id: `${seat.id}_h${seat.hands.length}_1`,
          cards: [card1, newCard1],
          bet: splitBet,
          status: hand1Status,
          result: 'pending',
          payout: 0,
          fromSplit: true,
        }

        const updatedHands = [
          ...seat.hands.slice(0, handIdx),
          hand0,
          hand1,
          ...seat.hands.slice(handIdx + 1),
        ]

        this.seats[seatIdx] = { ...seat, bankroll: newBankroll, hands: updatedHands }
        this.advanceToNextPlayableHand(seatIdx, handIdx)
        break
      }

      case 'surrender': {
        if (!legal.canSurrender) throw new Error('Action surrender is not legal')
        const updatedHands = seat.hands.map((h, i) =>
          i === handIdx
            ? { ...h, status: 'surrendered' as const, result: 'surrendered' as const }
            : h,
        )
        this.seats[seatIdx] = { ...seat, hands: updatedHands }
        this.advanceToNextPlayableHand(seatIdx, handIdx + 1)
        break
      }

      default:
        throw new Error(`Unexpected action ${action} during player turns`)
    }
  }

  private handleInsuranceAction(action: ActionType): void {
    const seatIdx = this.activeSeatIndex
    const seat = this.seats[seatIdx]!

    if (action === 'insurance_yes') {
      const insuranceCost = Math.floor(seat.currentBet / 2)
      if (seat.bankroll >= insuranceCost) {
        this.seats[seatIdx] = {
          ...seat,
          bankroll: seat.bankroll - insuranceCost,
          insuranceBet: insuranceCost,
        }
      }
    } else if (action === 'insurance_no') {
      this.seats[seatIdx] = {
        ...seat,
        insuranceBet: 0,
      }
    }

    this.insuranceSeatQueue.shift()
    if (this.insuranceSeatQueue.length > 0) {
      this.activeSeatIndex = this.insuranceSeatQueue[0]!
    } else {
      this.phase = 'dealer_peek'
      this.resolveDealerPeek()
    }
  }

  /**
   * Advances the dealer turn one card at a time.
   */
  advanceDealerTurn(): boolean {
    this.phase = 'dealer_turn'

    const allHandsBustedOrSurrendered = this.seats.every((seat) =>
      seat.hands.every((h) => h.status === 'busted' || h.status === 'surrendered'),
    )

    const result = stepDealerTurn(
      this.dealer,
      this.shoe,
      this.rules,
      allHandsBustedOrSurrendered,
    )

    this.dealer = result.dealer
    return result.isTurnComplete
  }

  /**
   * Resolves round payouts using the pure payouts engine.
   */
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
          playerTotal: evaluateHand(hand.cards, hand.fromSplit).total,
          dealerTotal: evaluateHand(this.dealer.cards).total,
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

    this.lastResolutions = resolutions
    this.roundCount++
    if (this.shoe.isReshuffleNeeded()) {
      this.shoeReshufflePending = true
    }
    this.phase = 'round_over'
    this.activeSeatIndex = -1
    return resolutions
  }

  /**
   * Reloads human player bankroll.
   */
  reloadHumanBankroll(amount: number = 500): void {
    const humanIdx = this.seats.findIndex((s) => s.isHuman)
    if (humanIdx >= 0) {
      const seat = this.seats[humanIdx]!
      this.seats[humanIdx] = {
        ...seat,
        bankroll: seat.bankroll + amount,
      }
    }
  }

  /**
   * Returns optimal Basic Strategy action for Trainer Mode.
   */
  getOptimalAction(seatIndex: number = 1, handIndex: number = 0): ActionType | undefined {
    const seat = this.seats[seatIndex]
    if (!seat) return undefined
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

  /**
   * Steps the AI companion if active.
   */
  stepAI(): boolean {
    if (this.phase === 'insurance') {
      const seat = this.seats[this.activeSeatIndex]
      if (!seat || seat.isHuman || !seat.profile) return false
      const takesInsurance = getAIInsuranceDecision(seat.profile, this.shoe.getTelemetry())
      this.handleAction(takesInsurance ? 'insurance_yes' : 'insurance_no')
      return true
    }

    if (this.phase === 'player_turns') {
      const seat = this.seats[this.activeSeatIndex]
      if (!seat || seat.isHuman || !seat.profile) return false
      const hand = seat.hands[this.activeHandIndex]
      if (!hand) return false

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
    }

    return false
  }
}
