import type { AIProfile, DifficultyTier } from './types'

export interface CompanionPoolEntry {
  readonly name: string
  readonly flag: string
  readonly country: string
}

export const COMPANION_NAME_POOL: readonly CompanionPoolEntry[] = [
  // English (🇬🇧)
  { name: 'Oliver', flag: '🇬🇧', country: 'United Kingdom' },
  { name: 'Charlotte', flag: '🇬🇧', country: 'United Kingdom' },
  { name: 'Arthur', flag: '🇬🇧', country: 'United Kingdom' },
  { name: 'Eleanor', flag: '🇬🇧', country: 'United Kingdom' },
  { name: 'George', flag: '🇬🇧', country: 'United Kingdom' },
  { name: 'Amelia', flag: '🇬🇧', country: 'United Kingdom' },
  { name: 'Harry', flag: '🇬🇧', country: 'United Kingdom' },
  { name: 'Florence', flag: '🇬🇧', country: 'United Kingdom' },

  // Belgian (🇧🇪)
  { name: 'Elise', flag: '🇧🇪', country: 'Belgium' },
  { name: 'Lucas', flag: '🇧🇪', country: 'Belgium' },
  { name: 'Camille', flag: '🇧🇪', country: 'Belgium' },
  { name: 'Maxim', flag: '🇧🇪', country: 'Belgium' },
  { name: 'Juliette', flag: '🇧🇪', country: 'Belgium' },
  { name: 'Victor', flag: '🇧🇪', country: 'Belgium' },
  { name: 'Louise', flag: '🇧🇪', country: 'Belgium' },

  // Swedish (🇸🇪)
  { name: 'Astrid', flag: '🇸🇪', country: 'Sweden' },
  { name: 'Elias', flag: '🇸🇪', country: 'Sweden' },
  { name: 'Freja', flag: '🇸🇪', country: 'Sweden' },
  { name: 'Lars', flag: '🇸🇪', country: 'Sweden' },
  { name: 'Ebba', flag: '🇸🇪', country: 'Sweden' },
  { name: 'Axel', flag: '🇸🇪', country: 'Sweden' },
  { name: 'Saga', flag: '🇸🇪', country: 'Sweden' },

  // Brazilian (🇧🇷)
  { name: 'Thiago', flag: '🇧🇷', country: 'Brazil' },
  { name: 'Beatriz', flag: '🇧🇷', country: 'Brazil' },
  { name: 'Mateo', flag: '🇧🇷', country: 'Brazil' },
  { name: 'Isabela', flag: '🇧🇷', country: 'Brazil' },
  { name: 'Rodrigo', flag: '🇧🇷', country: 'Brazil' },
  { name: 'Mariana', flag: '🇧🇷', country: 'Brazil' },
  { name: 'Gabriel', flag: '🇧🇷', country: 'Brazil' },
  { name: 'Larissa', flag: '🇧🇷', country: 'Brazil' },

  // South African (🇿🇦)
  { name: 'Thabo', flag: '🇿🇦', country: 'South Africa' },
  { name: 'Zola', flag: '🇿🇦', country: 'South Africa' },
  { name: 'Sipho', flag: '🇿🇦', country: 'South Africa' },
  { name: 'Anika', flag: '🇿🇦', country: 'South Africa' },
  { name: 'Kagiso', flag: '🇿🇦', country: 'South Africa' },
  { name: 'Lindiwe', flag: '🇿🇦', country: 'South Africa' },
  { name: 'Duan', flag: '🇿🇦', country: 'South Africa' },

  // Chinese (🇨🇳)
  { name: 'Wei', flag: '🇨🇳', country: 'China' },
  { name: 'Ying', flag: '🇨🇳', country: 'China' },
  { name: 'Jun', flag: '🇨🇳', country: 'China' },
  { name: 'Mei', flag: '🇨🇳', country: 'China' },
  { name: 'Bo', flag: '🇨🇳', country: 'China' },
  { name: 'Lian', flag: '🇨🇳', country: 'China' },
  { name: 'Tao', flag: '🇨🇳', country: 'China' },
  { name: 'Zhen', flag: '🇨🇳', country: 'China' },

  // Japanese (🇯🇵)
  { name: 'Kenji', flag: '🇯🇵', country: 'Japan' },
  { name: 'Aoi', flag: '🇯🇵', country: 'Japan' },
  { name: 'Ren', flag: '🇯🇵', country: 'Japan' },
  { name: 'Hana', flag: '🇯🇵', country: 'Japan' },
  { name: 'Daiki', flag: '🇯🇵', country: 'Japan' },
  { name: 'Yuki', flag: '🇯🇵', country: 'Japan' },
  { name: 'Sora', flag: '🇯🇵', country: 'Japan' },
  { name: 'Kaori', flag: '🇯🇵', country: 'Japan' },

  // American (🇺🇸)
  { name: 'Mason', flag: '🇺🇸', country: 'United States' },
  { name: 'Harper', flag: '🇺🇸', country: 'United States' },
  { name: 'Wyatt', flag: '🇺🇸', country: 'United States' },
  { name: 'Chloe', flag: '🇺🇸', country: 'United States' },
  { name: 'Logan', flag: '🇺🇸', country: 'United States' },
  { name: 'Avery', flag: '🇺🇸', country: 'United States' },
  { name: 'Caleb', flag: '🇺🇸', country: 'United States' },
  { name: 'Nora', flag: '🇺🇸', country: 'United States' },

  // Portuguese (🇵🇹)
  { name: 'Dinis', flag: '🇵🇹', country: 'Portugal' },
  { name: 'Inês', flag: '🇵🇹', country: 'Portugal' },
  { name: 'Gonçalo', flag: '🇵🇹', country: 'Portugal' },
  { name: 'Matilde', flag: '🇵🇹', country: 'Portugal' },
  { name: 'Vasco', flag: '🇵🇹', country: 'Portugal' },
  { name: 'Leonor', flag: '🇵🇹', country: 'Portugal' },
  { name: 'Martim', flag: '🇵🇹', country: 'Portugal' },

  // Indonesian (🇮🇩)
  { name: 'Budi', flag: '🇮🇩', country: 'Indonesia' },
  { name: 'Siti', flag: '🇮🇩', country: 'Indonesia' },
  { name: 'Reza', flag: '🇮🇩', country: 'Indonesia' },
  { name: 'Dewi', flag: '🇮🇩', country: 'Indonesia' },
  { name: 'Arif', flag: '🇮🇩', country: 'Indonesia' },
  { name: 'Putri', flag: '🇮🇩', country: 'Indonesia' },
  { name: 'Bayu', flag: '🇮🇩', country: 'Indonesia' },
  { name: 'Intan', flag: '🇮🇩', country: 'Indonesia' },

  // Australian (🇦🇺)
  { name: 'Jack', flag: '🇦🇺', country: 'Australia' },
  { name: 'Ruby', flag: '🇦🇺', country: 'Australia' },
  { name: 'Cooper', flag: '🇦🇺', country: 'Australia' },
  { name: 'Isla', flag: '🇦🇺', country: 'Australia' },
  { name: 'Lachlan', flag: '🇦🇺', country: 'Australia' },
  { name: 'Mia', flag: '🇦🇺', country: 'Australia' },
  { name: 'Archer', flag: '🇦🇺', country: 'Australia' },

  // Spanish (🇪🇸)
  { name: 'Hugo', flag: '🇪🇸', country: 'Spain' },
  { name: 'Lucía', flag: '🇪🇸', country: 'Spain' },
  { name: 'Alvaro', flag: '🇪🇸', country: 'Spain' },
  { name: 'Valeria', flag: '🇪🇸', country: 'Spain' },
  { name: 'Diego', flag: '🇪🇸', country: 'Spain' },
  { name: 'Paula', flag: '🇪🇸', country: 'Spain' },
  { name: 'Pablo', flag: '🇪🇸', country: 'Spain' },
  { name: 'Carmen', flag: '🇪🇸', country: 'Spain' },

  // Argentinian (🇦🇷)
  { name: 'Joaquín', flag: '🇦🇷', country: 'Argentina' },
  { name: 'Milagros', flag: '🇦🇷', country: 'Argentina' },
  { name: 'Facundo', flag: '🇦🇷', country: 'Argentina' },
  { name: 'Delfina', flag: '🇦🇷', country: 'Argentina' },
  { name: 'Bautista', flag: '🇦🇷', country: 'Argentina' },
  { name: 'Catalina', flag: '🇦🇷', country: 'Argentina' },
  { name: 'Franco', flag: '🇦🇷', country: 'Argentina' },
  { name: 'Martina', flag: '🇦🇷', country: 'Argentina' },
]

/**
 * Creates a distinct AI profile along a granular spectrum based on difficulty tier.
 */
export function createAIProfile(
  tier: DifficultyTier,
  seatIndex: number,
  usedNames: Set<string> = new Set(),
): AIProfile {
  const available = COMPANION_NAME_POOL.filter((c) => !usedNames.has(c.name))
  const pool = available.length > 0 ? available : COMPANION_NAME_POOL
  const picked = pool[Math.floor(Math.random() * pool.length)]!

  // Spectrum level defines AI decision accuracy (0.0 novice to 1.0 master)
  let spectrumLevel = 0.5
  let mistakeRate = 0.05
  let countSensitivity = 1.0
  let baseMinBet = 25

  if (tier === 'easy') {
    // 0.10 to 0.35 spectrum: leans novice, varied amateur heuristics
    spectrumLevel = 0.1 + Math.random() * 0.25
    mistakeRate = 0.25 - spectrumLevel * 0.4
    countSensitivity = 0.0 // No card counting
    baseMinBet = 10
  } else if (tier === 'normal') {
    // 0.50 to 0.75 spectrum: solid Basic Strategy with minor personality variances
    spectrumLevel = 0.5 + Math.random() * 0.25
    mistakeRate = 0.04 - (spectrumLevel - 0.5) * 0.1
    countSensitivity = 0.3 + Math.random() * 0.4 // gentle bet scaling
    baseMinBet = 25
  } else {
    // 0.85 to 1.0 spectrum: aggressive card counter, Illustrious 18 deviations
    spectrumLevel = 0.85 + Math.random() * 0.15
    mistakeRate = 0.005
    countSensitivity = 1.2 + Math.random() * 0.8 // high spread with True Count
    baseMinBet = 50
  }

  return {
    id: `ai_${picked.name.toLowerCase()}_${seatIndex}`,
    name: picked.name,
    flag: picked.flag,
    country: picked.country,
    spectrumLevel,
    baseMinBet,
    countSensitivity,
    mistakeRate: Math.max(0, mistakeRate),
  }
}
