// 待ち当てドリルの問題作り
// 1色の牌(各4枚)から決まった枚数を取り、テンパイしている形だけを問題にする。

import { randomInt, shuffle, type Rng } from './random'
import { formatTiles, kindOf, parseTiles, sortTiles, suitOf, type Suit, type Tile } from './tiles'
import { findWaits, type WaitsResult } from './waits'

export type WaitsLevel = 4 | 7 | 10 | 13

export const WAITS_LEVELS: readonly { size: WaitsLevel; label: string; description: string; minWaits: number }[] = [
  { size: 4, label: '4枚形', description: '面子1つ+αの小さな形。両面・嵌張・単騎などの基本です。', minWaits: 1 },
  { size: 7, label: '7枚形', description: '面子2つ+α。複数の待ちが重なる形が出てきます。', minWaits: 2 },
  { size: 10, label: '10枚形', description: '面子3つ+α。多面待ちを見落とさない練習です。', minWaits: 2 },
  { size: 13, label: '13枚形(清一色)', description: '1色だけの13枚。待ちが3種以上ある難しい形です。', minWaits: 3 },
]

export interface WaitsQuestion {
  level: WaitsLevel
  /** 手牌(理牌済み) */
  hand: Tile[]
  result: WaitsResult
}

const SUITS: Suit[] = ['m', 'p', 's']

/** 段階に合った待ち当ての問題を作る */
export function generateWaitsQuestion(level: WaitsLevel, rng: Rng, maxAttempts = 20000): WaitsQuestion {
  const info = WAITS_LEVELS.find((l) => l.size === level)!
  const suit = SUITS[randomInt(rng, SUITS.length)]
  const pool: Tile[] = []
  for (let rank = 1; rank <= 9; rank++) for (let i = 0; i < 4; i++) pool.push({ kind: kindOf(suit, rank), red: false })
  for (let i = 0; i < maxAttempts; i++) {
    const hand = sortTiles(shuffle(pool, rng).slice(0, level))
    const result = findWaits(hand)
    if (result.waits.length >= info.minWaits) return { level, hand, result }
  }
  throw new Error(`待ち当ての問題を作れませんでした(${level}枚)`)
}

/** 回答(待ち牌の種類の集まり)が正解とぴったり同じか */
export function judgeWaits(question: WaitsQuestion, answer: readonly number[]): boolean {
  const correct = question.result.waits.map((w) => w.kind)
  const chosen = [...new Set(answer)].sort((a, b) => a - b)
  return chosen.length === correct.length && chosen.every((k, i) => k === correct[i])
}

/** 回答の見落としと余分 */
export function compareWaitsAnswer(question: WaitsQuestion, answer: readonly number[]): { missed: number[]; extra: number[] } {
  const correct = new Set(question.result.waits.map((w) => w.kind))
  const chosen = new Set(answer)
  return {
    missed: [...correct].filter((k) => !chosen.has(k)).sort((a, b) => a - b),
    extra: [...chosen].filter((k) => !correct.has(k)).sort((a, b) => a - b),
  }
}

/** 問題の色(m/p/s) */
export function suitOfQuestion(question: WaitsQuestion): Suit {
  return suitOf(question.hand[0].kind)
}

// ---- 保存用の形 ----

export interface WaitsQuestionData {
  level: WaitsLevel
  hand: string
}

export function toWaitsData(q: WaitsQuestion): WaitsQuestionData {
  return { level: q.level, hand: formatTiles(q.hand) }
}

export function waitsKeyOf(q: WaitsQuestion): string {
  return formatTiles(q.hand)
}

export function fromWaitsData(value: unknown): WaitsQuestion {
  const d = value as Partial<WaitsQuestionData> | null
  if (!d || !WAITS_LEVELS.some((l) => l.size === d.level) || typeof d.hand !== 'string') {
    throw new Error('待ち当ての問題データが正しくありません')
  }
  const hand = sortTiles(parseTiles(d.hand))
  if (hand.length !== d.level) throw new Error('待ち当ての問題データが正しくありません')
  return { level: d.level as WaitsLevel, hand, result: findWaits(hand) }
}
