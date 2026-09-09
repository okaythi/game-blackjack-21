/**
 * Blackjack 21 — Pure Domain Model & Type Contracts
 * 
 * Strict decoupled models defining cards, hands, table state, rulesets,
 * and AI profiles without UI or rendering dependencies.
 */

export type Suit = 'clubs' | 'diamonds' | 'hearts' | 'spades'

export type Rank =
  | '2'
  | '3'
  | '4'
  | '5'
  | '6'
  | '7'
  | '8'
  | '9'
  | '10'
  | 'J'
  | 'Q'
  | 'K'
  | 'A'

export interface Card {
  readonly suit: Suit
  readonly rank: Rank
  readonly id: string
}

export interface HandValue {
  readonly total: number
  readonly isSoft: boolean
  readonly isBust: boolean
  readonly isBlackjack: boolean
  readonly hardTotal: number
  readonly softTotal: number
}

export type HandStatus =
  | 'betting'
  | 'active'
  | 'stood'
  | 'busted'
  | 'doubled'
  | 'blackjack'
  | 'surrendered'
  | 'settled'

export type HandResult =
  | 'pending'
  | 'win'
  | 'loss'
  | 'push'
  | 'blackjack'
  | 'surrendered'

export interface PlayerHand {
  readonly id: string
  readonly cards: readonly Card[]
  readonly bet: number
  readonly status: HandStatus
  readonly result: HandResult
  readonly payout: number
  readonly fromSplit: boolean
}

export interface DealerHand {
  readonly cards: readonly Card[]
  readonly holeCardHidden: boolean
}

export type DealerState = DealerHand

export type DifficultyTier = 'easy' | 'normal' | 'expert'

export type ChipDenomination =
  | 1
  | 2.5
  | 5
  | 10
  | 25
  | 100
  | 500
  | 1000
  | 2000
  | 5000

export interface TableRules {
  readonly deckCount: number
  readonly blackjackPayoutRatio: number // 1.5 for 3:2, 1.2 for 6:5
  readonly dealerHitsSoft17: boolean // false for S17, true for H17
  readonly doubleAfterSplit: boolean
  readonly lateSurrender: boolean
  readonly resplitAces: boolean
  readonly maxSplitHands: number
  readonly doubleAllowedOn: 'any' | '9-11'
  readonly cutCardPenetration: number // 0.60 to 0.75
  readonly trainerModeAvailable: boolean
  readonly trainerModeDefaultOpen: boolean
}

export interface AIProfile {
  readonly id: string
  readonly name: string
  readonly code: string
  readonly country: string
  readonly flag?: string
  readonly spectrumLevel: number // 0.0 (novice) to 1.0 (master card counter)
  readonly baseMinBet: number
  readonly countSensitivity: number // True Count betting multiplier
  readonly mistakeRate: number // probability of deviating from optimal (0.0 to 0.35)
}

export interface Seat {
  readonly id: string
  readonly index: number // 0 = first base, 1 = middle (human), 2 = third base (for 3-seat)
  readonly isHuman: boolean
  readonly profile?: AIProfile | undefined
  readonly bankroll: number
  readonly currentBet: number
  readonly insuranceBet: number
  readonly hands: readonly PlayerHand[]
  readonly activeHandIndex: number
}

export type RoundPhase =
  | 'betting'
  | 'dealing'
  | 'insurance'
  | 'dealer_peek'
  | 'player_turns'
  | 'dealer_turn'
  | 'payout'
  | 'round_over'

export type ActionType =
  | 'hit'
  | 'stand'
  | 'double'
  | 'split'
  | 'surrender'
  | 'insurance_yes'
  | 'insurance_no'

export interface LegalActions {
  readonly canHit: boolean
  readonly canStand: boolean
  readonly canDouble: boolean
  readonly canSplit: boolean
  readonly canSurrender: boolean
  readonly canInsurance: boolean
}

export interface TableTelemetry {
  readonly runningCount: number
  readonly trueCount: number
  readonly decksRemaining: number
  readonly cardsDealtTotal: number
  readonly cutCardReached: boolean
}

export interface RoundResolution {
  readonly seatIndex: number
  readonly handIndex: number
  readonly result: HandResult
  readonly netWin: number
  readonly playerTotal: number
  readonly dealerTotal: number
  readonly summary: string
}

export interface TableState {
  readonly phase: RoundPhase
  readonly rules: TableRules
  readonly difficulty: DifficultyTier
  readonly seats: readonly Seat[]
  readonly activeSeatIndex: number
  readonly activeHandIndex: number
  readonly dealer: DealerHand
  readonly telemetry: TableTelemetry
  readonly lastResolutions: readonly RoundResolution[]
  readonly roundCount: number
  readonly shoeReshufflePending: boolean
}
