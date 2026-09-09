/**
 * Blackjack 21 — Core Card, Deck, and Shoe Entities
 * 
 * Provides cryptographically secure RNG with rejection sampling (zero modulo bias),
 * unbiased Fisher-Yates shuffle, standard 52-card deck generation, and a multi-deck
 * Shoe with cut-card penetration and visible Hi-Lo card counting tracking.
 */

import type { Card, Rank, Suit, TableTelemetry } from './types'

export const SUITS: readonly Suit[] = ['clubs', 'diamonds', 'hearts', 'spades'] as const

export const RANKS: readonly Rank[] = [
  '2',
  '3',
  '4',
  '5',
  '6',
  '7',
  '8',
  '9',
  '10',
  'J',
  'Q',
  'K',
  'A',
] as const

/**
 * Generates an integer in [0, maxExclusive) using rejection sampling to eliminate modulo bias.
 * Uses Web Crypto API (crypto.getRandomValues) which is available in browser and Node.js.
 */
export function secureRandomInt(maxExclusive: number): number {
  if (maxExclusive <= 0) {
    throw new RangeError(`maxExclusive must be > 0, got ${maxExclusive}`)
  }
  if (maxExclusive === 1) {
    return 0
  }

  // 2^32
  const maxUint32 = 0x100000000
  // Largest multiple of maxExclusive <= 2^32
  const limit = maxUint32 - (maxUint32 % maxExclusive)
  const buffer = new Uint32Array(1)

  while (true) {
    crypto.getRandomValues(buffer)
    const val = buffer[0]!
    if (val < limit) {
      return val % maxExclusive
    }
  }
}

/**
 * Creates a standard 52-card deck.
 * @param deckIndex Optional index to ensure unique card IDs across multi-deck shoes.
 */
export function createDeck(deckIndex: number = 0): Card[] {
  const cards: Card[] = []
  for (const suit of SUITS) {
    for (const rank of RANKS) {
      cards.push({
        suit,
        rank,
        id: `${rank}_${suit}_${deckIndex}`,
      })
    }
  }
  return cards
}

/**
 * Performs an unbiased Fisher-Yates (Knuth) shuffle in O(N) using secureRandomInt.
 */
export function fisherYatesShuffle<T>(items: readonly T[]): T[] {
  const shuffled = [...items]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = secureRandomInt(i + 1)
    const temp = shuffled[i]!
    shuffled[i] = shuffled[j]!
    shuffled[j] = temp
  }
  return shuffled
}

/**
 * Hi-Lo card counting value for a card rank:
 * 2-6: +1 (Low cards, good for player when dealt)
 * 7-9:  0 (Neutral cards)
 * 10-A: -1 (High cards, good for player when remaining in deck)
 */
export function getHiLoValue(rank: Rank): number {
  switch (rank) {
    case '2':
    case '3':
    case '4':
    case '5':
    case '6':
      return 1
    case '7':
    case '8':
    case '9':
      return 0
    case '10':
    case 'J':
    case 'Q':
    case 'K':
    case 'A':
      return -1
  }
}

/**
 * Multi-deck Shoe entity managing 6 or 8 decks, cut-card penetration,
 * dealing, and Hi-Lo telemetry tracking for visible cards.
 */
export class Shoe {
  readonly deckCount: number
  readonly cutCardPenetration: number

  private cards: Card[] = []
  private cutCardIndex: number = 0
  private dealtCountTotal: number = 0
  private runningCount: number = 0

  constructor(deckCount: number = 6, cutCardPenetration: number = 0.75) {
    if (deckCount < 1) {
      throw new RangeError(`deckCount must be >= 1, got ${deckCount}`)
    }
    if (cutCardPenetration <= 0 || cutCardPenetration >= 1) {
      throw new RangeError(
        `cutCardPenetration must be between 0 and 1 exclusive, got ${cutCardPenetration}`,
      )
    }
    this.deckCount = deckCount
    this.cutCardPenetration = cutCardPenetration
    this.reset()
  }

  /**
   * Resets and shuffles the shoe with full decks and resets Hi-Lo count.
   */
  reset(): void {
    const allCards: Card[] = []
    for (let d = 0; d < this.deckCount; d++) {
      allCards.push(...createDeck(d))
    }
    this.cards = fisherYatesShuffle(allCards)
    this.cutCardIndex = Math.floor(this.cards.length * this.cutCardPenetration)
    this.dealtCountTotal = 0
    this.runningCount = 0
  }

  /**
   * Deals the top card from the shoe.
   * @param countVisible Whether this card is visible to the table and should immediately update Hi-Lo count.
   * Defaults to true. Dealer hole cards should pass false until revealed.
   */
  dealCard(countVisible: boolean = true): Card {
    if (this.cards.length === 0) {
      // Emergency re-shuffle if shoe is exhausted
      this.reset()
    }

    const card = this.cards.pop()!
    this.dealtCountTotal++

    if (countVisible) {
      this.runningCount += getHiLoValue(card.rank)
    }

    return card
  }

  /**
   * Counts a previously dealt hidden card (e.g. dealer's hole card upon reveal) in Hi-Lo tracking.
   */
  countVisibleCard(card: Card): void {
    this.runningCount += getHiLoValue(card.rank)
  }

  /**
   * Returns true if the cut card has been reached or exceeded.
   */
  isReshuffleNeeded(): boolean {
    return this.dealtCountTotal >= this.cutCardIndex || this.cards.length === 0
  }

  /**
   * Current number of cards remaining in the shoe.
   */
  get cardsRemaining(): number {
    return this.cards.length
  }

  /**
   * Total cards dealt since last shuffle.
   */
  get cardsDealt(): number {
    return this.dealtCountTotal
  }

  /**
   * Current Hi-Lo running count.
   */
  get currentRunningCount(): number {
    return this.runningCount
  }

  /**
   * Estimated decks remaining (rounded to nearest 0.5 deck or continuous).
   */
  get decksRemaining(): number {
    return Math.max(0.5, this.cards.length / 52)
  }

  /**
   * Current Hi-Lo True Count = running count / decks remaining.
   */
  get trueCount(): number {
    return this.runningCount / this.decksRemaining
  }

  /**
   * Retrieves a snapshot of the table telemetry.
   */
  getTelemetry(): TableTelemetry {
    const decksRem = Number(this.decksRemaining.toFixed(2))
    const tc = Number(this.trueCount.toFixed(2))
    return {
      runningCount: this.runningCount,
      trueCount: tc,
      decksRemaining: decksRem,
      cardsDealtTotal: this.dealtCountTotal,
      cutCardReached: this.isReshuffleNeeded(),
    }
  }
}
