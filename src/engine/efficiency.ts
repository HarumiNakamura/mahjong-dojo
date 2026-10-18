// 何切る(牌効率)の正解の決め方
//
// 基本: シャンテン数が小さい打牌 → その中で受け入れ枚数が多い打牌が正解。
// 例外(シャンテン戻し): シャンテン数を保つ打牌の受け入れが少なすぎるとき(見えている牌で待ちが残っていないなど)
//   (最大でも BACKWARD_MAX_FORWARD 枚以下で、戻す打牌の受け入れがその BACKWARD_RATIO 倍以上、
//    かつ BACKWARD_MIN 枚以上)は、シャンテン数を1つ戻して受け入れを広げる打牌を正解にする。
// 受け入れ枚数が同じ打牌が複数あれば、どれも正解。

import type { Tile } from './tiles'
import { analyzeDiscards, type DiscardAnalysis, type DiscardOption } from './ukeire'

export const BACKWARD_MAX_FORWARD = 2
export const BACKWARD_RATIO = 8
export const BACKWARD_MIN = 16

export interface EfficiencyJudgement {
  analysis: DiscardAnalysis
  /** 正解が先頭に来るように並べた打牌候補 */
  ranked: DiscardOption[]
  /** 正解の打牌(牌の種類) */
  correctKinds: number[]
  /** 正解の打牌の代表 */
  best: DiscardOption
  /** シャンテン数を保つ打牌の中で一番よいもの */
  bestForward: DiscardOption
  /** シャンテン戻しが正解 */
  backwardCorrect: boolean
}

export function judgeDiscards(hand: readonly Tile[], visible: readonly Tile[] = []): EfficiencyJudgement {
  const analysis = analyzeDiscards(hand, visible)
  const bestForward = analysis.options[0]
  const backward = analysis.options
    .filter((o) => o.shanten === bestForward.shanten + 1)
    .sort((a, b) => b.total - a.total)[0]

  const backwardCorrect =
    backward !== undefined &&
    bestForward.total <= BACKWARD_MAX_FORWARD &&
    backward.total >= Math.max(BACKWARD_MIN, BACKWARD_RATIO * bestForward.total)

  const best = backwardCorrect ? backward : bestForward
  const isCorrect = (o: DiscardOption) => o.shanten === best.shanten && o.total === best.total
  const correct = analysis.options.filter(isCorrect)
  const ranked = [...correct, ...analysis.options.filter((o) => !isCorrect(o))]
  return {
    analysis,
    ranked,
    correctKinds: correct.map((o) => o.tile.kind),
    best,
    bestForward,
    backwardCorrect,
  }
}

export function isCorrectDiscard(judgement: EfficiencyJudgement, kind: number): boolean {
  return judgement.correctKinds.includes(kind)
}
