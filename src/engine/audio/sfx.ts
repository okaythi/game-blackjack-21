import type { SfxCatalog, SoundDesign } from '@nixlabs/game-core'

export type BlackjackSfxName =
  | 'card_slide'
  | 'card_flip'
  | 'chip_click'
  | 'chip_bet'
  | 'win_chime'
  | 'blackjack'
  | 'bust'
  | 'push'
  | 'ui_click'

export const BLACKJACK_SFX: SfxCatalog<BlackjackSfxName> = {
  // Felt friction card slide
  card_slide: {
    voices: [
      { kind: 'triangle', from: 240, to: 160, delay: 0, duration: 0.08, gain: 0.04 },
    ],
    noise: { delay: 0, duration: 0.09, gain: 0.07, filterFrom: 3400, filterTo: 1100 },
  },

  // Snappy card snap / turn
  card_flip: {
    voices: [
      { kind: 'sine', from: 520, to: 280, delay: 0, duration: 0.04, gain: 0.06 },
    ],
    noise: { delay: 0, duration: 0.035, gain: 0.09, filterFrom: 4200, filterTo: 1800 },
  },

  // Ceramic chip collision / clink
  chip_click: {
    voices: [
      { kind: 'sine', from: 1850, to: 1100, delay: 0, duration: 0.04, gain: 0.12, curve: 'exp' },
      { kind: 'triangle', from: 2400, to: 1700, delay: 0.005, duration: 0.03, gain: 0.08 },
    ],
    noise: { delay: 0, duration: 0.02, gain: 0.06, filterFrom: 6000, filterTo: 3000 },
  },

  // Heavy chip stack onto betting circle
  chip_bet: {
    voices: [
      { kind: 'sine', from: 1400, to: 820, delay: 0, duration: 0.06, gain: 0.14, curve: 'exp' },
      { kind: 'sine', from: 850, to: 380, delay: 0.02, duration: 0.07, gain: 0.12 },
    ],
    noise: { delay: 0, duration: 0.05, gain: 0.08, filterFrom: 5000, filterTo: 2000 },
  },

  // Pentatonic warm win chime
  win_chime: {
    voices: [
      { kind: 'sine', from: 523.25, to: 523.25, delay: 0, duration: 0.16, gain: 0.14 }, // C5
      { kind: 'sine', from: 659.25, to: 659.25, delay: 0.08, duration: 0.20, gain: 0.15 }, // E5
      { kind: 'sine', from: 783.99, to: 783.99, delay: 0.16, duration: 0.32, gain: 0.18 }, // G5
    ],
  },

  // Natural Blackjack golden arpeggio
  blackjack: {
    voices: [
      { kind: 'triangle', from: 523.25, to: 523.25, delay: 0, duration: 0.14, gain: 0.15 }, // C5
      { kind: 'triangle', from: 659.25, to: 659.25, delay: 0.08, duration: 0.14, gain: 0.16 }, // E5
      { kind: 'triangle', from: 783.99, to: 783.99, delay: 0.16, duration: 0.16, gain: 0.18 }, // G5
      { kind: 'sine', from: 1046.5, to: 1046.5, delay: 0.24, duration: 0.45, gain: 0.22 }, // C6
    ],
  },

  // Low muted felt thud on bust
  bust: {
    voices: [
      { kind: 'sine', from: 180, to: 65, delay: 0, duration: 0.28, gain: 0.22, curve: 'exp' },
    ],
    noise: { delay: 0, duration: 0.12, gain: 0.08, filterFrom: 1800, filterTo: 400 },
    sub: { kind: 'sine', from: 70, to: 35, delay: 0, duration: 0.30, gain: 0.18 },
  },

  // Neutral push tone
  push: {
    voices: [
      { kind: 'sine', from: 440, to: 440, delay: 0, duration: 0.15, gain: 0.12 },
      { kind: 'sine', from: 440, to: 440, delay: 0.12, duration: 0.22, gain: 0.12 },
    ],
  },

  // Tactile micro-click for UI buttons
  ui_click: {
    voices: [
      { kind: 'sine', from: 880, to: 440, delay: 0, duration: 0.02, gain: 0.08 },
    ],
    noise: { delay: 0, duration: 0.015, gain: 0.04, filterFrom: 4000, filterTo: 2000 },
  },
}
