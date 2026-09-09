import type { AIProfile, DifficultyTier } from '../types'
import type { CompanionIdentity } from '../../services/companion-client'

/**
 * Pure factory creating an AI companion profile from an identity and difficulty tier.
 * Differentiates base units, sensitivity, and bankroll per companion to prevent identical bets.
 */
export function buildAIProfile(
  identity: CompanionIdentity,
  tier: DifficultyTier,
  seatIndex: number,
): AIProfile {
  let spectrumLevel = 0.5
  let mistakeRate = 0.05
  let countSensitivity = 1.0
  let baseMinBet = 15

  if (tier === 'easy') {
    // Leans novice, dealer-mimic tendencies, casual recreational bets
    spectrumLevel = 0.1 + Math.random() * 0.25
    mistakeRate = 0.25 - spectrumLevel * 0.4
    countSensitivity = 0.0 // Oblivious to card counting
    baseMinBet = 10
  } else if (tier === 'normal') {
    // Solid Basic Strategy player with modest count awareness
    spectrumLevel = 0.5 + Math.random() * 0.25
    mistakeRate = 0.03 - (spectrumLevel - 0.5) * 0.05
    const normalSensitivities = [0.8, 1.0, 1.2]
    countSensitivity = normalSensitivities[seatIndex % normalSensitivities.length] ?? 1.0
    const normalUnits = [10, 15, 20]
    baseMinBet = normalUnits[seatIndex % normalUnits.length] ?? 15
  } else {
    // Hard & Expert: AGI Superintelligent card counters with Kelly unit spreading
    spectrumLevel = 0.90 + Math.random() * 0.10
    mistakeRate = 0.002
    // Distinct Kelly sensitivity and aggressive unit spread per companion
    const agiSensitivities = [1.1, 1.35, 1.6]
    countSensitivity = agiSensitivities[seatIndex % agiSensitivities.length] ?? 1.35
    const agiUnits = [15, 20, 25]
    baseMinBet = agiUnits[seatIndex % agiUnits.length] ?? 20
  }

  return {
    id: `ai_${identity.name.toLowerCase()}_${seatIndex}`,
    name: identity.name,
    code: identity.code,
    country: identity.country,
    spectrumLevel,
    baseMinBet,
    countSensitivity,
    mistakeRate: Math.max(0, mistakeRate),
  }
}
