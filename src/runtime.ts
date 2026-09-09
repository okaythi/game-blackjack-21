import {
  createStore,
  emptyGameSnapshot,
  type GameRuntime,
  type GameRuntimeDeps,
  type GameSnapshot,
} from '@nixlabs/game-core'

export function createBlackjackRuntime(deps: { readonly current: GameRuntimeDeps }): GameRuntime {
  let bankroll = 1000
  let isRunning = false

  const initialSnapshot: GameSnapshot = {
    ...emptyGameSnapshot(),
    status: 'ready',
    score: bankroll,
    best: deps.current.best,
    bonus: deps.current.bonus,
    tiles: [
      { label: 'Bankroll', value: `$${bankroll.toLocaleString()}`, note: 'Current chips' },
      { label: 'Shoe', value: '6 Decks', note: 'Standard S17' },
      { label: 'House Rule', value: '3:2 BJ', note: 'Unrigged Odds' },
    ],
    badges: ['Unrigged', '6 Decks', 'Multi-Seat'],
  }

  const store = createStore<GameSnapshot>(initialSnapshot)

  return {
    store,
    actions: {
      primary: () => {
        if (!isRunning) {
          isRunning = true
          deps.current.beginRun()
          store.update((s) => ({ ...s, status: 'running' }))
        }
      },
      pause: () => {
        isRunning = false
        store.update((s) => ({ ...s, status: 'paused' }))
      },
      resume: () => {
        isRunning = true
        store.update((s) => ({ ...s, status: 'running' }))
      },
      restart: () => {
        bankroll = 1000
        isRunning = true
        deps.current.beginRun()
        store.update((s) => ({
          ...s,
          status: 'running',
          score: bankroll,
        }))
      },
      toggleMute: () => {
        store.update((s) => ({ ...s, muted: !s.muted }))
      },
    },
    attach: (host) => {
      const { canvas, context, onFrame } = host
      const onFrameSub = onFrame(() => {
        // Immediate mode canvas background preview
        context.clearRect(0, 0, canvas.width, canvas.height)
        context.fillStyle = '#dfd5c2'
        context.fillRect(0, 0, canvas.width, canvas.height)
      })

      return {
        dispose: () => {
          onFrameSub.dispose()
        },
      }
    },
    dispose: () => {
      isRunning = false
    },
  }
}
