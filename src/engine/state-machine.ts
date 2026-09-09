/**
 * Blackjack 21 — Multi-Seat Table State Machine
 * 
 * Manages game flow, turn order, legal actions, dealer peek, insurance,
 * splitting/doubling/surrender, dealer drawing, and payout resolutions across
 * 1 human player (middle seat) and 1 to 3 AI companions.
 */

import { createAIProfile } from './companion-names'
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
import type {
  ActionType,
  AIProfile,
  Card,
  DealerHand,
  DifficultyTier,
  LegalActions,
  PlayerHand,
  RoundPhase,
  RoundResolution,
  Seat,
  TableRules,
  TableState,
  TableTelemetry,
} from './types'

export interface TableConfig {
  readonly difficulty?: DifficultyTier
  readonly companionCount?: 1 | 2 | 3
  readonly humanBankroll?: number
  readonly customRules?: Partial<TableRules>
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

  // Queue of seats pending insurance response during 'insurance' phase
  private insuranceSeatQueue: number[] = []

  constructor(config: TableConfig = {}) {
    this.difficulty = config.difficulty ?? 'normal'
    const baseRules = getRulesForDifficulty(this.difficulty)
    this.rules = config.customRules ? { ...baseRules, ...config.customRules } : baseRules

    this.shoe = new Shoe(this.rules.deckCount, this.rules.cutCardPenetration)
    this.dealer = { cards: [], holeCardHidden: true }

    const companionCount = config.companionCount ?? 2
    const humanBankroll = config.humanBankroll ?? 1000

    this.seats = this.initializeSeats(this.difficulty, companionCount, humanBankroll)
  }

  /**
   * Initializes seats ensuring Human is always in the Middle seat:
   * - 1 companion (2 seats): Seat 0 = AI, Seat 1 = Human (Middle)
   * - 2 companions (3 seats): Seat 0 = AI, Seat 1 = Human (Middle), Seat 2 = AI
   * - 3 companions (4 seats): Seat 0 = AI, Seat 1 = Human (Middle), Seat 2 = AI, Seat 3 = AI
   */
  private initializeSeats(
    difficulty: DifficultyTier,
    companionCount: number,
    humanBankroll: number,
  ): Seat[] {
    const seats: Seat[] = []
    const usedNames = new Set<string>()

    const totalSeats = companionCount + 1
    // Human is always Seat Index 1 (Middle)
    const humanIndex = 1

    for (let i = 0; i < totalSeats; i++) {
      if (i === humanIndex) {
        seats.push({
          id: 'seat_human',
          index: i,
          isHuman: true,
          bankroll: humanBankroll,
          currentBet: 0,
          insuranceBet: 0,
          hands: [],
          activeHandIndex: 0,
        })
      } else {
        const profile = createAIProfile(difficulty, i, usedNames)
        usedNames.add(profile.name)
        const startingBankroll = profile.baseMinBet * 40

        seats.push({
          id: profile.id,
          index: i,
          isHuman: false,
          profile,
          bankroll: startingBankroll,
          currentBet: 0,
          insuranceBet: 0,
          hands: [],
          activeHandIndex: 0,
        })
      }
    }

    return seats
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
   * If shoe reshuffle is pending, resets the shoe.
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
      return {
        ...seat,
        insuranceBet: 0,
        hands: [],
        activeHandIndex: 0,
      }
    })

    this.lastResolutions = []
    this.dealer = { cards: [], holeCardHidden: true }
    this.phase = 'dealing'

    // Deal initial cards: 2 cards each to active seats, 1 upcard + 1 hole card to dealer
    this.dealInitialCards()

    // Evaluate initial round state (Check for Ace upcard -> Insurance, or 10-value -> Peek)
    this.evaluatePostDeal()
  }

  private dealInitialCards(): void {
    // Deal 1st card to each active player seat
    for (let i = 0; i < this.seats.length; i++) {
      const seat = this.seats[i]!
      if (seat.hands.length > 0) {
        const card = this.shoe.dealCard(true)
        this.updateSeatHandCards(i, 0, [card])
      }
    }

    // Deal dealer upcard (visible)
    const dealerUpcard = this.shoe.dealCard(true)
    this.dealer = { cards: [dealerUpcard], holeCardHidden: true }

    // Deal 2nd card to each active player seat
    for (let i = 0; i < this.seats.length; i++) {
      const seat = this.seats[i]!
      if (seat.hands.length > 0) {
        const card = this.shoe.dealCard(true)
        const currentCards = seat.hands[0]!.cards
        this.updateSeatHandCards(i, 0, [...currentCards, card])
      }
    }

    // Deal dealer hole card (hidden from Hi-Lo count until revealed)
    const dealerHoleCard = this.shoe.dealCard(false)
    this.dealer = { cards: [...this.dealer.cards, dealerHoleCard], holeCardHidden: true }

    // Evaluate natural blackjacks for players
    this.seats = this.seats.map((seat) => {
      if (seat.hands.length === 0) return seat
      const hand = seat.hands[0]!
      const val = evaluateHand(hand.cards, false)
      if (val.isBlackjack) {
        return {
          ...seat,
          hands: [{ ...hand, status: 'blackjack' }],
        }
      }
      return {
        ...seat,
        hands: [{ ...hand, status: 'active' }],
      }
    })
  }

  private updateSeatHandCards(seatIndex: number, handIndex: number, cards: Card[]): void {
    const seat = this.seats[seatIndex]!
    const updatedHands = seat.hands.map((h, idx) => (idx === handIndex ? { ...h, cards } : h))
    this.seats[seatIndex] = { ...seat, hands: updatedHands }
  }

  private evaluatePostDeal(): void {
    const dealerUpcard = this.dealer.cards[0]!

    if (dealerUpcard.rank === 'A') {
      // Dealer shows Ace: offer insurance to all active seats
      this.phase = 'insurance'
      this.insuranceSeatQueue = this.seats
        .filter((s) => s.hands.length > 0)
        .map((s) => s.index)
      this.activeSeatIndex = this.insuranceSeatQueue[0] ?? -1
      return
    }

    if (isTenValue(dealerUpcard.rank)) {
      // Dealer shows 10/J/Q/K: peek for blackjack immediately
      this.phase = 'dealer_peek'
      this.resolveDealerPeek()
      return
    }

    // Dealer shows 2-9: no blackjack possible on dealer. Proceed directly to player turns
    this.startPlayerTurns()
  }

  /**
   * Resolves dealer peek for blackjack.
   * If dealer has BJ, reveals hole card, settles insurance, resolves round.
   */
  private resolveDealerPeek(): void {
    const dealerVal = evaluateHand(this.dealer.cards)

    if (dealerVal.isBlackjack) {
      // Dealer has Blackjack! Reveal hole card and count it in Hi-Lo
      const holeCard = this.dealer.cards[1]!
      this.dealer = { ...this.dealer, holeCardHidden: false }
      this.shoe.countVisibleCard(holeCard)

      // Resolve insurance payouts (pays 2:1)
      this.seats = this.seats.map((seat) => {
        if (seat.insuranceBet > 0) {
          // 2:1 on insurance bet + original insurance bet returned = 3x insuranceBet
          const insurancePayout = seat.insuranceBet * 3
          return {
            ...seat,
            bankroll: seat.bankroll + insurancePayout,
          }
        }
        return seat
      })

      // Resolve player hands against dealer natural blackjack
      this.resolveRound()
      return
    }

    // Dealer does NOT have blackjack. Hole card stays hidden.
    // Proceed to player turns
    this.startPlayerTurns()
  }

  private startPlayerTurns(): void {
    this.phase = 'player_turns'
    this.activeSeatIndex = -1
    this.activeHandIndex = 0

    // Find first seat with an active hand that isn't already blackjack
    this.advanceToNextPlayableHand(0, 0)
  }

  /**
   * Advances activeSeatIndex and activeHandIndex to the next playable hand.
   * If all player hands are completed, advances to dealer_turn.
   */
  private advanceToNextPlayableHand(startSeatIndex: number, startHandIndex: number): void {
    for (let s = startSeatIndex; s < this.seats.length; s++) {
      const seat = this.seats[s]!
      const hands = seat.hands
      const startH = s === startSeatIndex ? startHandIndex : 0

      for (let h = startH; h < hands.length; h++) {
        const hand = hands[h]!
        if (hand.status === 'active') {
          const val = evaluateHand(hand.cards, hand.fromSplit)
          if (val.total === 21) {
            // Automatically stand on 21
            this.updateHandStatus(s, h, 'stood')
            continue
          }
          this.activeSeatIndex = s
          this.activeHandIndex = h
          return
        }
      }
    }

    // No playable player hands remain: advance to dealer phase
    this.phase = 'dealer_turn'
    this.activeSeatIndex = -1
    this.advanceDealerTurn()
  }

  private updateHandStatus(
    seatIndex: number,
    handIndex: number,
    status: PlayerHand['status'],
    result: PlayerHand['result'] = 'pending',
  ): void {
    const seat = this.seats[seatIndex]!
    const updatedHands = seat.hands.map((h, idx) =>
      idx === handIndex ? { ...h, status, result } : h,
    )
    this.seats[seatIndex] = { ...seat, hands: updatedHands }
  }

  /**
   * Returns current legal actions for the active hand.
   */
  getLegalActions(
    seatIndex: number = this.activeSeatIndex,
    handIndex: number = this.activeHandIndex,
  ): LegalActions {
    if (this.phase === 'insurance') {
      const seat = this.seats[seatIndex]
      const canInsurance = seat ? seat.bankroll >= Math.floor(seat.currentBet / 2) : false
      return {
        canHit: false,
        canStand: false,
        canDouble: false,
        canSplit: false,
        canSurrender: false,
        canInsurance,
      }
    }

    if (this.phase !== 'player_turns' || seatIndex < 0) {
      return {
        canHit: false,
        canStand: false,
        canDouble: false,
        canSplit: false,
        canSurrender: false,
        canInsurance: false,
      }
    }

    const seat = this.seats[seatIndex]!
    const hand = seat.hands[handIndex]
    if (!hand || hand.status !== 'active') {
      return {
        canHit: false,
        canStand: false,
        canDouble: false,
        canSplit: false,
        canSurrender: false,
        canInsurance: false,
      }
    }

    const val = evaluateHand(hand.cards, hand.fromSplit)
    const canHit = canHitHand(val)
    const canStand = canStandHand(val)
    const canDouble = canDoubleHand(
      hand.cards,
      seat.bankroll,
      hand.bet,
      this.rules,
      hand.fromSplit,
    )
    const canSplit = canSplitHand(
      hand.cards,
      seat.bankroll,
      hand.bet,
      seat.hands.length,
      this.rules,
      hand.fromSplit,
    )
    const canSurrender = canSurrenderHand(hand.cards, this.rules, hand.fromSplit)

    return {
      canHit,
      canStand,
      canDouble,
      canSplit,
      canSurrender,
      canInsurance: false,
    }
  }

  /**
   * Handles player action (hit, stand, double, split, surrender, insurance_yes, insurance_no).
   */
  handleAction(action: ActionType, _amount?: number): void {
    if (this.phase === 'insurance') {
      this.handleInsuranceAction(action)
      return
    }

    if (this.phase !== 'player_turns') {
      throw new Error(`Cannot execute action ${action} in phase ${this.phase}`)
    }

    const seatIdx = this.activeSeatIndex
    const handIdx = this.activeHandIndex
    const seat = this.seats[seatIdx]
    if (!seat) {
      throw new Error(`Invalid active seat ${seatIdx}`)
    }
    const hand = seat.hands[handIdx]
    if (!hand) {
      throw new Error(`Invalid active hand ${handIdx}`)
    }

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
        this.updateHandStatus(seatIdx, handIdx, 'stood')
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

        // Deal 1 card to first hand, 1 card to second hand
        const newCard0 = this.shoe.dealCard(true)
        const newCard1 = this.shoe.dealCard(true)

        const isAcesSplit = card0.rank === 'A' || card1.rank === 'A'

        // In standard blackjack, split Aces receive exactly 1 card and stand
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

        // Replace split hand with the two new hands
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

    // Advance to next seat in insurance queue
    this.insuranceSeatQueue.shift()
    if (this.insuranceSeatQueue.length > 0) {
      this.activeSeatIndex = this.insuranceSeatQueue[0]!
    } else {
      // All seats answered insurance: peek dealer hole card
      this.phase = 'dealer_peek'
      this.resolveDealerPeek()
    }
  }

  /**
   * Dealer phase step: reveals hole card, counts in Hi-Lo, draws cards one-by-one until >= 17.
   * Returns true when dealer turn is complete, false if more cards remain to draw.
   */
  advanceDealerTurn(): boolean {
    this.phase = 'dealer_turn'

    if (this.dealer.holeCardHidden && this.dealer.cards.length > 1) {
      this.dealer = { ...this.dealer, holeCardHidden: false }
      this.shoe.countVisibleCard(this.dealer.cards[1]!)

      // If all player hands busted or surrendered, dealer does not draw
      const allHandsBustedOrSurrendered = this.seats.every((seat) =>
        seat.hands.every((h) => h.status === 'busted' || h.status === 'surrendered'),
      )
      if (allHandsBustedOrSurrendered) {
        return true
      }

      const dealerVal = evaluateHand(this.dealer.cards)
      const needsDraw =
        dealerVal.total < 17 ||
        (this.rules.dealerHitsSoft17 && dealerVal.total === 17 && dealerVal.isSoft)
      return !needsDraw
    }

    // Dealer draws 1 card
    let dealerVal = evaluateHand(this.dealer.cards)
    if (
      dealerVal.total < 17 ||
      (this.rules.dealerHitsSoft17 && dealerVal.total === 17 && dealerVal.isSoft)
    ) {
      const card = this.shoe.dealCard(true)
      this.dealer = { ...this.dealer, cards: [...this.dealer.cards, card] }
      dealerVal = evaluateHand(this.dealer.cards)
    }

    const stillNeedsDraw =
      dealerVal.total < 17 ||
      (this.rules.dealerHitsSoft17 && dealerVal.total === 17 && dealerVal.isSoft)

    return !stillNeedsDraw
  }

  /**
   * Resolves all payouts, compares player hands to dealer, updates bankrolls,
   * checks cut card for reshuffle, and sets phase to 'round_over'.
   */
  resolveRound(): RoundResolution[] {
    const dealerVal = evaluateHand(this.dealer.cards)
    const resolutions: RoundResolution[] = []

    this.seats = this.seats.map((seat) => {
      let newBankroll = seat.bankroll
      const updatedHands: PlayerHand[] = []

      for (let hIdx = 0; hIdx < seat.hands.length; hIdx++) {
        const hand = seat.hands[hIdx]!
        const playerVal = evaluateHand(hand.cards, hand.fromSplit)

        let result: PlayerHand['result'] = 'loss'
        let payout = 0
        let netWin = -hand.bet
        let summary = ''

        if (hand.status === 'surrendered') {
          result = 'surrendered'
          payout = hand.bet / 2
          netWin = -hand.bet / 2
          newBankroll += payout
          summary = 'Surrendered (half bet returned)'
        } else if (hand.status === 'busted') {
          result = 'loss'
          payout = 0
          netWin = -hand.bet
          summary = `Bust with ${playerVal.total}`
        } else if (playerVal.isBlackjack) {
          if (dealerVal.isBlackjack) {
            result = 'push'
            payout = hand.bet
            netWin = 0
            newBankroll += payout
            summary = 'Natural Blackjack Push'
          } else {
            result = 'blackjack'
            const win = hand.bet * this.rules.blackjackPayoutRatio
            payout = hand.bet + win
            netWin = win
            newBankroll += payout
            summary = `Natural Blackjack (3:2)`
          }
        } else if (dealerVal.isBlackjack) {
          // Dealer has natural blackjack and player doesn't
          result = 'loss'
          payout = 0
          netWin = -hand.bet
          summary = 'Dealer Natural Blackjack'
        } else if (dealerVal.isBust) {
          // Dealer busted, player did not
          result = 'win'
          payout = hand.bet * 2
          netWin = hand.bet
          newBankroll += payout
          summary = `Dealer busts (${dealerVal.total}), Win`
        } else if (playerVal.total > dealerVal.total) {
          result = 'win'
          payout = hand.bet * 2
          netWin = hand.bet
          newBankroll += payout
          summary = `Win (${playerVal.total} vs ${dealerVal.total})`
        } else if (playerVal.total < dealerVal.total) {
          result = 'loss'
          payout = 0
          netWin = -hand.bet
          summary = `Loss (${playerVal.total} vs ${dealerVal.total})`
        } else {
          // Push
          result = 'push'
          payout = hand.bet
          netWin = 0
          newBankroll += payout
          summary = `Push (${playerVal.total} vs ${dealerVal.total})`
        }

        resolutions.push({
          seatIndex: seat.index,
          handIndex: hIdx,
          result,
          netWin,
          playerTotal: playerVal.total,
          dealerTotal: dealerVal.total,
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
   * Reloads human player bankroll with VIP rebate/top-up.
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
   * Returns the optimal Basic Strategy action for Trainer Mode.
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
   * Automatically executes the next AI step if the active seat is an AI companion.
   * Returns true if an AI action was performed, false if waiting for human or round is not in playable phase.
   */
  stepAI(): boolean {
    if (this.phase === 'insurance') {
      const seat = this.seats[this.activeSeatIndex]
      if (!seat || seat.isHuman || !seat.profile) {
        return false
      }
      const takesInsurance = getAIInsuranceDecision(seat.profile, this.shoe.getTelemetry())
      this.handleAction(takesInsurance ? 'insurance_yes' : 'insurance_no')
      return true
    }

    if (this.phase === 'player_turns') {
      const seat = this.seats[this.activeSeatIndex]
      if (!seat || seat.isHuman || !seat.profile) {
        return false
      }
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
