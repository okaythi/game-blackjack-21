import { AudioEngine as BaseAudioEngine, type AudioDeps } from '@nixlabs/game-core'
import { BLACKJACK_SFX, type BlackjackSfxName } from './sfx'

export type { BlackjackSfxName }

export class BlackjackAudioEngine extends BaseAudioEngine<BlackjackSfxName> {
  public constructor(deps: AudioDeps = {}) {
    super(BLACKJACK_SFX, deps)
  }
}
