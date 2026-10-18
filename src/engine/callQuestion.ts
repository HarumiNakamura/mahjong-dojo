// 鳴き判断クイズの問題作り
//
// 山から配牌し、簡易プレイヤーで数巡進めた自分の手(門前13枚)に対して、
// 他家が鳴ける牌を切った場面を作る。鳴きが正解の問題とスルーが正解の問題が、おおよそ半分ずつ出るようにする。

import { analyzeCall, callCandidates, judgeCall, type CallAnalysis, type CallAnswer, type CallSituation } from './call'
import { chooseDiscard } from './danger'
import { randomInt, type Rng } from './random'
import { calcShantenFromTiles } from './shanten'
import { formatTiles, parseTiles, sortTiles } from './tiles'
import { createWall } from './wall'

export interface CallQuestion {
  situation: CallSituation
  analysis: CallAnalysis
}

export interface CallQuestionData {
  hand: string
  tile: string
  from: 1 | 2 | 3
  turn: number
  dora: string
  seatWind: number
  roundWind: number
}

export function buildCallQuestion(situation: CallSituation): CallQuestion {
  return { situation, analysis: analyzeCall(situation) }
}

function trySituation(rng: Rng): CallSituation | null {
  const wall = createWall(rng)
  const doraIndicator = wall.pop()!
  wall.splice(wall.length - 13, 13)
  let hand = sortTiles(wall.splice(0, 13))
  const turn = 2 + randomInt(rng, 11)
  // 自分以外の3人の分も山から減らしておく(残りの山を実戦に近づける)
  wall.splice(0, 39)
  for (let t = 1; t < turn; t++) {
    const hand14 = [...hand, wall.shift()!]
    if (calcShantenFromTiles(hand14).min === -1) return null
    const i = chooseDiscard(hand14, new Set(), rng)!
    hand = sortTiles(hand14.filter((_, j) => j !== i))
    wall.splice(0, 3)
  }
  if (calcShantenFromTiles(hand).min <= 0) return null
  const tile = wall[randomInt(rng, wall.length)]
  const base = { hand, tile, turn, doraIndicator, seatWind: 1 + randomInt(rng, 4), roundWind: rng() < 0.7 ? 1 : 2 }
  const chiOk = callCandidates({ ...base, from: 3 }).some((c) => c.type === 'chi')
  const ponOk = callCandidates({ ...base, from: 1 }).length > 0
  if (!chiOk && !ponOk) return null
  const from: 1 | 2 | 3 = chiOk && (!ponOk || rng() < 0.7) ? 3 : ((1 + randomInt(rng, 3)) as 1 | 2 | 3)
  return { ...base, from }
}

export function generateCallQuestion(rng: Rng, maxAttempts = 2000): CallQuestion {
  const want = rng() < 0.5 ? 'call' : 'skip'
  let fallback: CallQuestion | null = null
  for (let i = 0; i < maxAttempts; i++) {
    const s = trySituation(rng)
    if (!s) continue
    const q = buildCallQuestion(s)
    if (q.analysis.verdict === want) return q
    fallback ??= q
  }
  if (fallback) return fallback
  throw new Error('鳴き判断の問題を作れませんでした')
}

export function judgeCallQuestion(q: CallQuestion, answer: CallAnswer): boolean {
  return judgeCall(q.analysis, answer)
}

export function toCallData(q: CallQuestion): CallQuestionData {
  const s = q.situation
  return {
    hand: formatTiles(s.hand),
    tile: formatTiles([s.tile]),
    from: s.from,
    turn: s.turn,
    dora: formatTiles([s.doraIndicator]),
    seatWind: s.seatWind,
    roundWind: s.roundWind,
  }
}

export function fromCallData(value: unknown): CallQuestion {
  const d = value as Partial<CallQuestionData> | null
  if (
    !d ||
    typeof d.hand !== 'string' ||
    typeof d.tile !== 'string' ||
    ![1, 2, 3].includes(d.from as number) ||
    typeof d.turn !== 'number' ||
    typeof d.dora !== 'string' ||
    typeof d.seatWind !== 'number' ||
    typeof d.roundWind !== 'number'
  ) {
    throw new Error('鳴き判断の問題データが正しくありません')
  }
  const hand = parseTiles(d.hand)
  if (hand.length !== 13) throw new Error('鳴き判断の問題データが正しくありません')
  return buildCallQuestion({
    hand,
    tile: parseTiles(d.tile)[0],
    from: d.from as 1 | 2 | 3,
    turn: d.turn,
    doraIndicator: parseTiles(d.dora)[0],
    seatWind: d.seatWind,
    roundWind: d.roundWind,
  })
}

export function callKeyOf(q: CallQuestion): string {
  const d = toCallData(q)
  return [d.hand, d.tile, d.from, d.turn, d.dora, d.seatWind, d.roundWind].join('|')
}
