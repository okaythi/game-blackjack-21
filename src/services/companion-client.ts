export interface CompanionIdentity {
  readonly name: string
  readonly code: string
  readonly country: string
}

const API_BASE_URL = 'https://blackjack-21-api.nixlabs.workers.dev'

/**
 * Strictly a 3-name minimal seed for offline/unit test reliability.
 * In production, the game fetches from blackjack-21-api.
 */
const TEST_OFFLINE_SEED: readonly CompanionIdentity[] = [
  { name: 'Oliver', code: 'GB', country: 'United Kingdom' },
  { name: 'Charlotte', code: 'GB', country: 'United Kingdom' },
  { name: 'Arthur', code: 'GB', country: 'United Kingdom' },
]

export async function fetchCompanions(
  count: number,
  excludeNames: readonly string[] = [],
): Promise<CompanionIdentity[]> {
  try {
    const excludeParam = excludeNames.map((n) => encodeURIComponent(n)).join(',')
    const url = `${API_BASE_URL}/companions?count=${count}${excludeParam ? `&exclude=${excludeParam}` : ''}`
    const res = await fetch(url, { signal: AbortSignal.timeout(3000) })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const data = (await res.json()) as { companions?: CompanionIdentity[] }
    if (Array.isArray(data.companions) && data.companions.length > 0) {
      return data.companions
    }
    throw new Error('Empty companions array')
  } catch {
    // Offline / unit test fallback: strictly 3-name seed
    const pool = TEST_OFFLINE_SEED.filter((c) => !excludeNames.includes(c.name))
    const available = pool.length > 0 ? pool : TEST_OFFLINE_SEED
    return available.slice(0, count)
  }
}

/** Synchronous resolver for unit tests and instant mock fallback */
export function getOfflineCompanionSeed(index: number): CompanionIdentity {
  return TEST_OFFLINE_SEED[index % TEST_OFFLINE_SEED.length]!
}
