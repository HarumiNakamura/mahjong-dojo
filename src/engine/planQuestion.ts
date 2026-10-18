// 配牌方針クイズの問題作り
//
// 問題はシードで決まる。一人麻雀(solo.ts)と同じ山の作り方なので、
// 回答のあと同じシードで一人麻雀を始めると、同じ配牌・同じツモで続きを打てる。

import { correctPlans, PLANS, scorePlans, type PlanContext, type PlanId, type PlanScore } from './plan'
import { createRng, randomInt, type Rng } from './random'
import { startSoloGame } from './solo'
import type { Tile } from './tiles'

export interface PlanQuestion {
  seed: number
  hand: Tile[]
  drawn: Tile
  context: PlanContext
  scores: PlanScore[]
  correct: PlanId[]
}

export function makePlanQuestion(seed: number): PlanQuestion {
  const game = startSoloGame(createRng(seed))
  const context: PlanContext = { doraIndicator: game.doraIndicator, seatWind: (seed % 4) + 1, roundWind: 1 }
  const scores = scorePlans([...game.hand, game.drawn!], context)
  return { seed, hand: game.hand, drawn: game.drawn!, context, scores, correct: correctPlans(scores) }
}

/**
 * 問題を作る。方針が偏らないよう、目標の方針をランダムに決めて、それが正解になる配牌を探す
 * (見つからなければ最後の配牌を使う)。正解が4つ以上ある(どれでもよい)配牌は避ける。
 */
export function generatePlanQuestion(rng: Rng, maxAttempts = 400): PlanQuestion {
  const target = PLANS[randomInt(rng, PLANS.length)].id
  let q = makePlanQuestion(randomInt(rng, 2 ** 31))
  for (let i = 0; i < maxAttempts; i++) {
    if (q.correct.length <= 3 && q.correct.includes(target)) return q
    q = makePlanQuestion(randomInt(rng, 2 ** 31))
  }
  return q
}

export function judgePlan(q: PlanQuestion, answer: PlanId): boolean {
  return q.correct.includes(answer)
}

export function toPlanData(q: PlanQuestion): { seed: number } {
  return { seed: q.seed }
}

export function fromPlanData(value: unknown): PlanQuestion {
  const d = value as { seed?: unknown } | null
  if (!d || typeof d.seed !== 'number' || !Number.isInteger(d.seed) || d.seed < 0) throw new Error('配牌方針の問題データが正しくありません')
  return makePlanQuestion(d.seed)
}

export const planKeyOf = (q: PlanQuestion) => String(q.seed)

export const planLabel = (id: PlanId) => PLANS.find((p) => p.id === id)?.label ?? id

export function isPlanId(value: unknown): value is PlanId {
  return PLANS.some((p) => p.id === value)
}
