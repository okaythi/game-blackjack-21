/**
 * Platform Storage Bridge for Blackjack 21
 *
 * Interacts with server-authoritative Cloudflare D1 database APIs
 * (/api/blackjack/session, /api/blackjack/deposit, /api/blackjack/cashout)
 * to ensure player bankrolls, candies, and session state are persisted
 * reliably in the database and never lost on refresh.
 */

export interface ActiveWallet {
  depositedEur: number
  bonusEur: number
  initialTotalEur: number
}

export interface BlackjackSessionState {
  bankroll: number
  wallet: ActiveWallet
  difficulty?: 'easy' | 'normal' | 'hard' | 'expert'
  companionCount?: 1 | 2 | 3
  firstTimeGranted?: boolean
}

export interface BlackjackSessionResult {
  ok: boolean
  session: BlackjackSessionState
  candy: number
  isFirstTime?: boolean
}

export interface BlackjackDepositResult {
  ok: boolean
  candy: number
  bankroll: number
  wallet: ActiveWallet
  error?: string
}

export interface BlackjackCashOutResult {
  ok: boolean
  cashedOutEur: number
  cashedOutCandies: number
  candy: number
  bankroll: number
  wallet: ActiveWallet
  error?: string
}

// In-memory runtime cache for seamless offline/standalone testing
let runtimeMemorySession: BlackjackSessionState = {
  bankroll: 500,
  wallet: { depositedEur: 0, bonusEur: 500, initialTotalEur: 500 },
  difficulty: 'normal',
  companionCount: 2,
  firstTimeGranted: true,
}
let runtimeCandyBalance = 151

/**
 * Fetches server-authoritative Blackjack table session from D1 database.
 */
export async function fetchBlackjackSession(): Promise<BlackjackSessionResult> {
  if (typeof window === 'undefined') {
    return { ok: true, session: runtimeMemorySession, candy: runtimeCandyBalance, isFirstTime: false }
  }

  try {
    const res = await fetch('/api/blackjack/session', {
      headers: { accept: 'application/json', 'x-nixlabs-client': '1' },
      credentials: 'same-origin',
    })

    if (res.ok) {
      const data = (await res.json()) as {
        ok: boolean
        session: BlackjackSessionState
        candy: number
        isFirstTime?: boolean
      }
      if (data.ok && data.session) {
        runtimeMemorySession = data.session
        runtimeCandyBalance = data.candy ?? runtimeCandyBalance
        return {
          ok: true,
          session: data.session,
          candy: data.candy ?? runtimeCandyBalance,
          isFirstTime: data.isFirstTime ?? false,
        }
      }
    }
  } catch (err) {
    console.warn('[Blackjack] Network error loading server session, using fallback:', err)
  }

  return {
    ok: false,
    session: runtimeMemorySession,
    candy: runtimeCandyBalance,
    isFirstTime: false,
  }
}

let syncTimeout: any = null

/**
 * Persists active table session to D1 database asynchronously.
 */
export function saveBlackjackSession(session: BlackjackSessionState): void {
  runtimeMemorySession = { ...session }
  if (typeof window === 'undefined') return

  if (syncTimeout) {
    clearTimeout(syncTimeout)
  }

  syncTimeout = setTimeout(async () => {
    try {
      await fetch('/api/blackjack/session', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-nixlabs-client': '1',
        },
        credentials: 'same-origin',
        body: JSON.stringify({
          bankroll: session.bankroll,
          wallet: session.wallet,
          difficulty: session.difficulty,
          companionCount: session.companionCount,
        }),
      })
    } catch (err) {
      console.warn('[Blackjack] Failed to sync session to D1:', err)
    }
  }, 200)
}

/**
 * Converts player Candies to table EUR chips in D1 database (3 Candies = 1 EUR).
 */
export async function depositCandiesToChips(candies: number): Promise<BlackjackDepositResult> {
  if (typeof window === 'undefined') {
    const eur = Math.floor(candies / 3)
    runtimeCandyBalance = Math.max(0, runtimeCandyBalance - eur * 3)
    runtimeMemorySession.bankroll += eur
    runtimeMemorySession.wallet.depositedEur += eur
    runtimeMemorySession.wallet.initialTotalEur += eur
    return {
      ok: true,
      candy: runtimeCandyBalance,
      bankroll: runtimeMemorySession.bankroll,
      wallet: runtimeMemorySession.wallet,
    }
  }

  try {
    const res = await fetch('/api/blackjack/deposit', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-nixlabs-client': '1',
      },
      credentials: 'same-origin',
      body: JSON.stringify({ candies }),
    })

    if (res.ok) {
      const data = (await res.json()) as BlackjackDepositResult
      if (data.ok) {
        runtimeCandyBalance = data.candy
        runtimeMemorySession.bankroll = data.bankroll
        runtimeMemorySession.wallet = data.wallet

        window.dispatchEvent(
          new CustomEvent('nx:candy-updated', {
            detail: { candy: data.candy },
          }),
        )

        return data
      }
    }
  } catch (err) {
    console.error('[Blackjack] Error depositing candies to chips:', err)
  }

  return {
    ok: false,
    candy: runtimeCandyBalance,
    bankroll: runtimeMemorySession.bankroll,
    wallet: runtimeMemorySession.wallet,
    error: 'deposit-failed',
  }
}

/**
 * Cashes out active table chips back into player Candies in D1 database.
 */
export async function cashOutChips(): Promise<BlackjackCashOutResult> {
  if (typeof window === 'undefined') {
    const { bankroll, wallet } = runtimeMemorySession
    let cashoutEur = 0
    if (bankroll > wallet.initialTotalEur) {
      cashoutEur = wallet.depositedEur + (bankroll - wallet.initialTotalEur)
    } else if (wallet.initialTotalEur > 0) {
      cashoutEur = Math.floor(bankroll * (wallet.depositedEur / wallet.initialTotalEur))
    }
    const candiesAwarded = cashoutEur * 3
    runtimeCandyBalance += candiesAwarded
    runtimeMemorySession.bankroll = 0
    runtimeMemorySession.wallet = { bonusEur: 0, depositedEur: 0, initialTotalEur: 0 }
    return {
      ok: true,
      cashedOutEur: cashoutEur,
      cashedOutCandies: candiesAwarded,
      candy: runtimeCandyBalance,
      bankroll: 0,
      wallet: runtimeMemorySession.wallet,
    }
  }

  try {
    const res = await fetch('/api/blackjack/cashout', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-nixlabs-client': '1',
      },
      credentials: 'same-origin',
    })

    if (res.ok) {
      const data = (await res.json()) as BlackjackCashOutResult
      if (data.ok) {
        runtimeCandyBalance = data.candy
        runtimeMemorySession.bankroll = 0
        runtimeMemorySession.wallet = data.wallet

        window.dispatchEvent(
          new CustomEvent('nx:candy-updated', {
            detail: { candy: data.candy },
          }),
        )

        return data
      }
    }
  } catch (err) {
    console.error('[Blackjack] Error cashing out chips:', err)
  }

  return {
    ok: false,
    cashedOutEur: 0,
    cashedOutCandies: 0,
    candy: runtimeCandyBalance,
    bankroll: 0,
    wallet: { bonusEur: 0, depositedEur: 0, initialTotalEur: 0 },
    error: 'cashout-failed',
  }
}

/**
 * Returns current player Candy balance from memory or default.
 */
export function getLocalCandyBalance(): number {
  return runtimeCandyBalance
}

/**
 * Subscribes to Candy balance updates across the platform.
 */
export function subscribeCandyBalance(onUpdate: (balance: number) => void): () => void {
  if (typeof window === 'undefined') return () => {}

  const handleCustomEvent = (e: Event) => {
    const custom = e as CustomEvent<{ candy?: number }>
    if (typeof custom.detail?.candy === 'number') {
      runtimeCandyBalance = custom.detail.candy
      onUpdate(custom.detail.candy)
    }
  }

  window.addEventListener('nx:candy-updated', handleCustomEvent)

  return () => {
    window.removeEventListener('nx:candy-updated', handleCustomEvent)
  }
}
