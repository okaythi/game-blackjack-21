/**
 * Platform Storage Bridge for Blackjack 21
 *
 * Interacts with Nixlabs local storage protocol (prefixed with 'nixlabs.stats.<slug>')
 * to synchronize real Candy balances, detect first-time player status, and persist records.
 */

const STORAGE_PREFIX = 'nixlabs.'
const BLACKJACK_SLUG = 'blackjack-21'

const PLATFORM_GAME_SLUGS = [
  'blackjack-21',
  'avoid-the-spikes',
  'card-jitsu',
  'pong',
  'fl-tron-3',
  'tetris',
] as const

interface StoredStats {
  plays?: number
  best?: number | null
  candy?: number
}

function readStoredStats(slug: string): StoredStats {
  if (typeof window === 'undefined') return {}
  try {
    // 1. Try prefixed key ('nixlabs.stats.<slug>')
    const prefixedRaw = window.localStorage.getItem(`${STORAGE_PREFIX}stats.${slug}`)
    if (prefixedRaw) {
      return JSON.parse(prefixedRaw) as StoredStats
    }
    // 2. Try raw fallback ('stats.<slug>')
    const raw = window.localStorage.getItem(`stats.${slug}`)
    if (raw) {
      return JSON.parse(raw) as StoredStats
    }
  } catch {
    // Ignore storage parse errors
  }
  return {}
}

function writeStoredStats(slug: string, patch: Partial<StoredStats>): void {
  if (typeof window === 'undefined') return
  try {
    const current = readStoredStats(slug)
    const next: StoredStats = {
      plays: patch.plays ?? current.plays ?? 0,
      best: patch.best !== undefined ? patch.best : (current.best ?? null),
      candy: patch.candy !== undefined ? patch.candy : (current.candy ?? 0),
    }
    const serialized = JSON.stringify(next)
    window.localStorage.setItem(`${STORAGE_PREFIX}stats.${slug}`, serialized)
  } catch {
    // Ignore storage quota errors
  }
}

/**
 * Returns current player Candy balance from platform storage.
 */
export function getLocalCandyBalance(): number {
  if (typeof window === 'undefined') return 0
  for (const slug of PLATFORM_GAME_SLUGS) {
    const stats = readStoredStats(slug)
    if (typeof stats.candy === 'number' && stats.candy >= 0) {
      return stats.candy
    }
  }
  return 0
}

/**
 * Returns true if the player has never finished or started a Blackjack 21 session.
 */
export function isFirstTimeBlackjackPlayer(): boolean {
  if (typeof window === 'undefined') return true
  const stats = readStoredStats(BLACKJACK_SLUG)
  return !stats.plays || stats.plays === 0
}

/**
 * Increments the plays counter for Blackjack 21.
 */
export function recordBlackjackPlay(): void {
  const stats = readStoredStats(BLACKJACK_SLUG)
  const plays = (stats.plays ?? 0) + 1
  writeStoredStats(BLACKJACK_SLUG, { plays })
}

/**
 * Updates Candy balance across all platform game keys and dispatches event.
 */
export function adjustCandyBalance(deltaCandies: number): number {
  const current = getLocalCandyBalance()
  const nextCandy = Math.max(0, current + deltaCandies)

  for (const slug of PLATFORM_GAME_SLUGS) {
    writeStoredStats(slug, { candy: nextCandy })
  }

  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('nx:candy-updated', {
        detail: { candy: nextCandy },
      }),
    )
  }

  return nextCandy
}

/**
 * Records a peak bankroll highscore if it exceeds the previous personal best.
 */
export function recordBlackjackPeakScore(score: number): void {
  const stats = readStoredStats(BLACKJACK_SLUG)
  if (stats.best === null || stats.best === undefined || score > stats.best) {
    writeStoredStats(BLACKJACK_SLUG, { best: score })
  }
}

/**
 * Subscribes to Candy balance changes via window event or storage event.
 */
export function subscribeCandyBalance(onUpdate: (balance: number) => void): () => void {
  if (typeof window === 'undefined') return () => {}

  const handleCustomEvent = (e: Event) => {
    const custom = e as CustomEvent<{ candy?: number }>
    if (typeof custom.detail?.candy === 'number') {
      onUpdate(custom.detail.candy)
    } else {
      onUpdate(getLocalCandyBalance())
    }
  }

  const handleStorage = (e: StorageEvent) => {
    if (e.key?.includes('stats')) {
      onUpdate(getLocalCandyBalance())
    }
  }

  window.addEventListener('nx:candy-updated', handleCustomEvent)
  window.addEventListener('storage', handleStorage)

  return () => {
    window.removeEventListener('nx:candy-updated', handleCustomEvent)
    window.removeEventListener('storage', handleStorage)
  }
}
