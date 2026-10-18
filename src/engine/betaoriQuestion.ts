// ベタオリサバイバルを、ドリル(学習記録・解き直し)の形で扱う
//
// 問題 = シード(同じシードなら同じ配牌・同じ展開)。回答 = 切った牌の種類の並び。
// 放銃せずに終われたら「正解」とする。

import { replayBetaori, startBetaori, summarizeBetaori, type BetaoriGame } from './betaori'

export interface BetaoriQuestion {
  seed: number
  /** 始まりの局面 */
  game: BetaoriGame
}

export function makeBetaoriQuestion(seed: number): BetaoriQuestion {
  return { seed, game: startBetaori(seed) }
}

export function judgeBetaori(q: BetaoriQuestion, kinds: readonly number[]): boolean {
  const g = replayBetaori(q.seed, kinds)
  return g !== null && g.end !== null && !summarizeBetaori(g).dealtIn
}

export function toBetaoriData(q: BetaoriQuestion): { seed: number } {
  return { seed: q.seed }
}

export function fromBetaoriData(value: unknown): BetaoriQuestion {
  const d = value as { seed?: unknown } | null
  if (!d || typeof d.seed !== 'number' || !Number.isInteger(d.seed)) throw new Error('ベタオリの問題データが正しくありません')
  return makeBetaoriQuestion(d.seed)
}

export function betaoriKeyOf(q: BetaoriQuestion): string {
  return String(q.seed)
}
