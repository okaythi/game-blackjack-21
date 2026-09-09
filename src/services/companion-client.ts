export interface CompanionIdentity {
  readonly name: string
  readonly code: string
  readonly country: string
}

const API_BASE_URL = 'https://blackjack-21-api.nixlabs.workers.dev'
const CACHE_KEY = 'blackjack_21_cached_companions'

/**
 * 3-name diverse minimal seed for offline/unit test reliability.
 */
const TEST_OFFLINE_SEED: readonly CompanionIdentity[] = [
  { name: 'Astrid', code: 'SE', country: 'Sweden' },
  { name: 'Mateo', code: 'BR', country: 'Brazil' },
  { name: 'Kenji', code: 'JP', country: 'Japan' },
]

export function getCachedCompanions(count: number): CompanionIdentity[] {
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      const raw = window.localStorage.getItem(CACHE_KEY)
      if (raw) {
        const parsed = JSON.parse(raw) as CompanionIdentity[]
        if (Array.isArray(parsed) && parsed.length >= count) {
          return parsed.slice(0, count)
        }
      }
    } catch {
      // Fallback
    }
  }
  return TEST_OFFLINE_SEED.slice(0, count)
}

export function cacheCompanions(companions: readonly CompanionIdentity[]): void {
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      window.localStorage.setItem(CACHE_KEY, JSON.stringify(companions))
    } catch {
      // Ignore quota errors
    }
  }
}

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
      cacheCompanions(data.companions)
      return data.companions
    }
    throw new Error('Empty companions array')
  } catch {
    // Offline / unit test fallback: cached or diverse 3-name seed
    const cached = getCachedCompanions(count)
    const pool = cached.filter((c) => !excludeNames.includes(c.name))
    const available = pool.length > 0 ? pool : TEST_OFFLINE_SEED
    return available.slice(0, count)
  }
}

/** Synchronous resolver for unit tests and instant mock fallback */
export function getOfflineCompanionSeed(index: number): CompanionIdentity {
  return TEST_OFFLINE_SEED[index % TEST_OFFLINE_SEED.length]!
}
