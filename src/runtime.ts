import { blackjack_21Manifest } from './manifest'

export function createBlackjack21Runtime(deps: { readonly current: any }) {
  let score = 0
  let isRunning = false
  let animId: number | null = null

  return {
    actions: {
      primary: () => {
        if (!isRunning) {
          isRunning = true
          deps.current.beginRun()
        }
      },
      pause: () => { isRunning = false },
      resume: () => { isRunning = true },
      restart: () => {
        score = 0
        isRunning = true
        deps.current.beginRun()
      },
      toggleMute: () => {},
    },
    attach: (host: any) => {
      const { canvas, context } = host
      const onFrameSub = host.onFrame((dt: number) => {
        if (!isRunning) return
        context.clearRect(0, 0, canvas.width, canvas.height)
        context.fillStyle = '#f6821f'
        context.fillRect(50, 50, 80, 80)
      })
      return {
        dispose: () => {
          onFrameSub.dispose()
        },
      }
    },
    dispose: () => {
      if (animId) cancelAnimationFrame(animId)
    },
  }
}
