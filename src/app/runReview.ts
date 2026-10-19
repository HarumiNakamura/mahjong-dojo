// 振り返りを Web Worker で計算する。Worker が使えない環境では、画面のスレッドで計算する

import type { Paipu } from '@kobalab/majiang-core'
import type { GameReview } from '../review/types'

const direct = (paipu: Paipu, playerId: number) => import('../review/reviewGame').then((m) => m.reviewGame(paipu, playerId))

export function runReview(paipu: Paipu, playerId = 0): Promise<GameReview> {
  if (typeof Worker === 'undefined') return direct(paipu, playerId)
  return new Promise((resolve, reject) => {
    let worker: Worker
    try {
      worker = new Worker(new URL('../review/review.worker.ts', import.meta.url), { type: 'module' })
    } catch {
      direct(paipu, playerId).then(resolve, reject)
      return
    }
    worker.onmessage = (e: MessageEvent<{ review?: GameReview; error?: string }>) => {
      worker.terminate()
      if (e.data.review) resolve(e.data.review)
      else reject(new Error(e.data.error ?? '振り返りの計算に失敗しました'))
    }
    worker.onerror = () => {
      worker.terminate()
      direct(paipu, playerId).then(resolve, reject)
    }
    worker.postMessage({ paipu, playerId })
  })
}
