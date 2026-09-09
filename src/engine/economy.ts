/**
 * Blackjack 21 Casino Economy & Conversion Mechanics
 *
 * Rules:
 * 1. 3 Candies = 1 € chip.
 * 2. If it is a user's first time ever playing, they receive €500 table chips from the house for use AT BLACKJACK.
 * 3. Cash-out rules:
 *    - The house €500 bonus cannot be directly cashed out without play.
 *    - A player can cash out if their table chips reach €500 + €1 or more.
 *    - Any portion deposited by the player with their own candies (e.g. €50 from 150 candies) is ALWAYS theirs.
 *    - If total bankroll drops below €500, any winnings or remaining bankroll can be proportionately cashed out:
 *      ownRatio = depositedChips / (bonusChips + depositedChips)
 *      when chips <= bonusChips: cashableChips = Math.round(chips * ownRatio)
 *      when chips > bonusChips: cashableChips = chips - bonusChips
 */

export const CANDIES_PER_EUR = 3
export const FIRST_TIME_HOUSE_BONUS_EUR = 500

export interface TableWallet {
  /** User's deposited money from Candies (in €) */
  readonly depositedEur: number
  /** Initial house bonus received (in €) */
  readonly bonusEur: number
  /** Current active chips at the table (in €) */
  readonly currentChips: number
  /** Whether the player has ever played Blackjack 21 before */
  readonly isFirstTimePlayer: boolean
}

/** Converts Candy balance to maximum whole EUR chips */
export function candiesToEur(candies: number): { eur: number; remainderCandies: number } {
  const safeCandies = Math.max(0, Math.floor(candies))
  const eur = Math.floor(safeCandies / CANDIES_PER_EUR)
  const remainderCandies = safeCandies % CANDIES_PER_EUR
  return { eur, remainderCandies }
}

/** Converts EUR chips back into Candies */
export function eurToCandies(eur: number): number {
  return Math.max(0, Math.floor(eur)) * CANDIES_PER_EUR
}

/**
 * Calculates exactly how many chips can be cashed out into real Candies,
 * strictly upholding the proportionate cash-out rules for the €500 house bonus.
 */
export function calculateCashableChips(wallet: {
  depositedEur: number
  bonusEur: number
  currentChips: number
}): { cashableEur: number; lockedBonusEur: number; candiesReturn: number } {
  const { depositedEur, bonusEur, currentChips } = wallet
  const safeChips = Math.max(0, Math.floor(currentChips))
  const totalInitial = depositedEur + bonusEur

  if (safeChips <= 0 || totalInitial <= 0) {
    return { cashableEur: 0, lockedBonusEur: 0, candiesReturn: 0 }
  }

  // If there was no bonus, 100% of current chips are cashable
  if (bonusEur <= 0) {
    return {
      cashableEur: safeChips,
      lockedBonusEur: 0,
      candiesReturn: eurToCandies(safeChips),
    }
  }

  let cashableEur = 0

  if (safeChips > bonusEur) {
    // When chips exceed the €500 house bonus, all chips beyond the bonus are cashable
    // (this covers the player's own deposit plus any profit)
    cashableEur = safeChips - bonusEur
  } else {
    // Below or at bonus amount:
    // If player deposited their own money, they can proportionately cash out their share of remaining chips
    if (depositedEur > 0) {
      const ownRatio = depositedEur / totalInitial
      cashableEur = Math.round(safeChips * ownRatio)
    } else {
      // 100% house bonus funds, under or at €500: cannot cash out
      cashableEur = 0
    }
  }

  // Clamp to current chips
  cashableEur = Math.min(cashableEur, safeChips)
  const lockedBonusEur = safeChips - cashableEur

  return {
    cashableEur,
    lockedBonusEur,
    candiesReturn: eurToCandies(cashableEur),
  }
}
