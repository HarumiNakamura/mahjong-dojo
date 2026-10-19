// 振り返りの計算を、画面と別のスレッド(Web Worker)で行う(スマホでも画面が固まらないように)

import type { Paipu } from '@kobalab/majiang-core'
import { reviewGame } from './reviewGame'

self.onmessage = (e: MessageEvent<{ paipu: Paipu; playerId: number }>) => {
  try {
    self.postMessage({ review: reviewGame(e.data.paipu, e.data.playerId) })
  } catch (err) {
    self.postMessage({ error: err instanceof Error ? err.message : String(err) })
  }
}
