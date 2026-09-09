import type { AIProfile, DifficultyTier } from '../types'
import type { CompanionIdentity } from '../../services/companion-client'

/**
 * Pure factory creating an AI companion profile from an identity and difficulty tier.
 */
export function buildAIProfile(
  identity: CompanionIdentity,
  tier: DifficultyTier,
  seatIndex: number,
): AIProfile {
  let spectrumLevel = 0.5
  let mistakeRate = 0.05
  let countSensitivity = 1.0
  let baseMinBet = 25

  if (tier === 'easy') {
    // Leans novice, dealer-mimic tendencies
    spectrumLevel = 0.1 + Math.random() * 0.25
    mistakeRate = 0.25 - spectrumLevel * 0.4
    countSensitivity = 0.0 // No card counting
    baseMinBet = 10
  } else if (tier === 'normal') {
    // Solid Basic Strategy player
    spectrumLevel = 0.5 + Math.random() * 0.25
    mistakeRate = 0.04 - (spectrumLevel - 0.5) * 0.1
    countSensitivity = 0.3 + Math.random() * 0.4
    baseMinBet = 25
  } else {
    // Expert card counter with Illustrious 18 deviations
    spectrumLevel = 0.85 + Math.random() * 0.15
    mistakeRate = 0.005
    countSensitivity = 1.2 + Math.random() * 0.8
    baseMinBet = 50
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
