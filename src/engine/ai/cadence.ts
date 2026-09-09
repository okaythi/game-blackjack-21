/**
 * Blackjack 21 — AI Deliberation Cadence
 * 
 * Simulates natural human-like reaction and deliberation delays with Gaussian jitter,
 * scaled across difficulty tiers and game pacing (normal vs turbo).
 */

import type { DifficultyTier } from '../types'

/**
 * Standard Box-Muller transform producing a standard normal random variable N(0, 1).
 */
function randomGaussian(): number {
  let u1 = 0
  let u2 = 0
  while (u1 === 0) u1 = Math.random()
  while (u2 === 0) u2 = Math.random()
  return Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2)
}

/**
 * Calculates deliberation delay in milliseconds for an AI seat.
 * 
 * - Easy AI: 200–400ms (quick, impulsive novice reactions)
 * - Normal AI: 500–750ms (measured standard decisions)
 * - Expert AI: 900–1,600ms (deliberate, thoughtful counting)
 *   - Marginal decisions (e.g. 16 vs 10, 15 vs 10, insurance): 1,800–2,500ms
 * - Gaussian jitter: ±15% to ±25% applied to base deliberation
 * - Turbo mode: Capped at ~150ms for hyper-fast playback
 */
export function calculateAIDeliberationMs(
  tier: DifficultyTier,
  isMarginalDecision: boolean = false,
  isTurbo: boolean = false,
): number {
  if (isTurbo) {
    // In turbo mode, cap at 50-150ms
    const baseTurbo = 60 + Math.random() * 60
    return Math.min(150, Math.round(baseTurbo))
  }

  let minMs: number
  let maxMs: number

  switch (tier) {
    case 'easy':
      minMs = 200
      maxMs = 400
      break
    case 'normal':
      minMs = 500
      maxMs = 750
      break
    case 'hard':
    case 'expert':
      if (isMarginalDecision) {
        minMs = 1800
        maxMs = 2500
      } else {
        minMs = 900
        maxMs = 1600
      }
      break
  }

  const baseMs = minMs + Math.random() * (maxMs - minMs)
  // Gaussian jitter with standard deviation ~ 10% of base, clamped to ±20%
  const jitterStdDev = 0.10
  const jitterFraction = Math.max(-0.25, Math.min(0.25, randomGaussian() * jitterStdDev))
  const finalMs = baseMs * (1 + jitterFraction)

  return Math.max(minMs * 0.8, Math.round(finalMs))
}
