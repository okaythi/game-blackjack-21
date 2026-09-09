/**
 * Blackjack 21 — AI Decision Dispatcher
 * 
 * Orchestrates companion decision-making according to the AI profile spectrum:
 * - Novice amateur (spectrum < 0.4)
 * - Basic Strategy regular (0.4 <= spectrum < 0.8)
 * - Master Card Counter with Illustrious 18 deviations (spectrum >= 0.8)
 * Also evaluates marginal decision detection for cadence and betting amounts.
 */

import { evaluateHand } from '../hand'
import { getBasicStrategyAction, normalizeDealerUpcard } from './basic-strategy'
import { calculateCardCounterBet, getIllustrious18Action, shouldTakeInsurance } from './card-counter-ai'
import { getEasyAIAction } from './easy-ai'
import type { ActionType, AIProfile, Card, LegalActions, PlayerHand, TableRules, TableTelemetry } from '../types'

/**
 * Detects whether the current decision is a "marginal" or high-stress index decision
 * that triggers extended expert deliberation time in cadence.ts.
 */
export function isMarginalDecision(
  cards: readonly Card[],
  dealerUpcard: Card,
  isInsuranceOffer: boolean = false,
): boolean {
  if (isInsuranceOffer) {
    return true
  }

  const handVal = evaluateHand(cards)
  if (handVal.isBust || handVal.total >= 21) {
    return false
  }

  const upcardKey = normalizeDealerUpcard(dealerUpcard)

  // Hard 16 vs 10, 9, A
  if (!handVal.isSoft && handVal.total === 16 && (upcardKey === '10' || upcardKey === '9' || upcardKey === 'A')) {
    return true
  }

  // Hard 15 vs 10
  if (!handVal.isSoft && handVal.total === 15 && upcardKey === '10') {
    return true
  }

  // Hard 12 vs 2, 3, 4
  if (!handVal.isSoft && handVal.total === 12 && ['2', '3', '4'].includes(upcardKey)) {
    return true
  }

  return false
}

/**
 * Determines whether an AI companion buys insurance.
 * Novices and normal players never buy insurance.
 * Card counters buy insurance if True Count >= +3.
 */
export function getAIInsuranceDecision(profile: AIProfile, telemetry: TableTelemetry): boolean {
  if (profile.spectrumLevel < 0.8) {
    return false
  }
  return shouldTakeInsurance(telemetry.trueCount)
}

/**
 * Computes the bet amount for an AI companion before dealing.
 */
export function getAIBetAmount(
  profile: AIProfile,
  bankroll: number,
  telemetry: TableTelemetry,
  tableMinBet: number = 10,
): number {
  if (profile.spectrumLevel >= 0.8) {
    return calculateCardCounterBet(profile, telemetry.trueCount, bankroll, tableMinBet)
  }

  // Normal / easy players bet base min bet, occasionally adding 1 unit if on a roll
  const base = Math.max(tableMinBet, profile.baseMinBet)
  if (bankroll <= base) {
    return Math.max(tableMinBet, bankroll)
  }
  return Math.min(bankroll, base)
}

/**
 * Dispatches an AI turn decision.
 */
export function getAIAction(
  profile: AIProfile,
  hand: PlayerHand,
  dealerUpcard: Card,
  rules: TableRules,
  telemetry: TableTelemetry,
  legalActions: LegalActions,
): ActionType {
  const cards = hand.cards
  const handVal = evaluateHand(cards, hand.fromSplit)

  if (handVal.isBust || handVal.total >= 21) {
    return 'stand'
  }

  // Check for simulated amateur mistake
  if (profile.mistakeRate > 0 && Math.random() < profile.mistakeRate) {
    // If hand is 12-16, mistake is usually hitting when standing or standing when hitting
    if (!handVal.isSoft && handVal.total >= 12 && handVal.total <= 16) {
      if (legalActions.canHit && Math.random() < 0.5) return 'hit'
      if (legalActions.canStand) return 'stand'
    }
  }

  // 1. Novice Amateur spectrum (< 0.4)
  if (profile.spectrumLevel < 0.4) {
    const easyAction = getEasyAIAction(cards)
    if (easyAction === 'hit' && legalActions.canHit) return 'hit'
    return 'stand'
  }

  // 2. Master Card Counter spectrum (>= 0.8)
  if (profile.spectrumLevel >= 0.8) {
    const deviation = getIllustrious18Action(
      cards,
      dealerUpcard,
      telemetry.trueCount,
      rules,
      legalActions.canDouble,
      legalActions.canSplit,
      hand.fromSplit,
    )

    if (deviation !== null) {
      if (deviation === 'split' && legalActions.canSplit) return 'split'
      if (deviation === 'double' && legalActions.canDouble) return 'double'
      if (deviation === 'stand' && legalActions.canStand) return 'stand'
      if (deviation === 'hit' && legalActions.canHit) return 'hit'
    }
  }

  // 3. Fallback: Standard Basic Strategy
  const bsAction = getBasicStrategyAction(cards, dealerUpcard, rules, {
    canDouble: legalActions.canDouble,
    canSplit: legalActions.canSplit,
    canSurrender: legalActions.canSurrender,
    fromSplit: hand.fromSplit,
  })

  // Ensure returned action is strictly legal
  if (bsAction === 'surrender' && legalActions.canSurrender) return 'surrender'
  if (bsAction === 'split' && legalActions.canSplit) return 'split'
  if (bsAction === 'double' && legalActions.canDouble) return 'double'
  if (bsAction === 'hit' && legalActions.canHit) return 'hit'
  if (bsAction === 'stand' && legalActions.canStand) return 'stand'

  // Safety fallbacks
  if (legalActions.canStand) return 'stand'
  if (legalActions.canHit) return 'hit'
  return 'stand'
}
