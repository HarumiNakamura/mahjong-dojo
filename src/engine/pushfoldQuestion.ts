// 押し引きジャッジの問題作り
//
// 他家1人がリーチしている局面(danger.ts と同じ作り方)から、
//   - 自分の手がテンパイかイーシャンテンで、
//   - その形を保つには危険な牌(危険度 MIN_DANGER% 以上)を切るしかない
// ものを選ぶ。押す(その危険牌を切る)か降りるかを答え、pushfold.ts の概算で判定する。

import { assessTile, generateSituation, riichiSeats, situationFromData, situationToData, visibleCounts, type DefenseSituation, type SituationData, type TileSafety } from './danger'
import { evaluatePushFold, isCorrectPushFold, type PushFoldInput, type PushFoldResult } from './pushfold'
import { PUSHFOLD_TABLE } from '../data/pushfold-table'
import { randomInt, type Rng } from './random'
import { calculateScore, doraFromIndicator, pointsFor } from './scoring'
import { calcShantenFromTiles } from './shanten'
import { calcUkeire } from './ukeire'
import { isHonor, rankOf, type Tile } from './tiles'
import { findWaits } from './waits'

/** 「危険な牌」とみなす危険度(%) */
export const MIN_DANGER = 6

export type PushFoldAnswer = 'push' | 'fold'

export interface PushFoldQuestion {
  situation: DefenseSituation
  /** 押すなら切る牌(手牌の形を保つ一番良い打牌) */
  discard: number
  safety: TileSafety
  /** 切ったあとの13枚 */
  rest: Tile[]
  riichiSeat: number
  /** テンパイなら待ち牌 */
  waits: number[]
  /** 手の説明(例: 「テンパイ(両面待ち・残り6枚)」) */
  handLabel: string
  /** 打点の説明(例: 「リーチ・ドラ1で 2,600点」) */
  valueLabel: string
  input: PushFoldInput
  result: PushFoldResult
}

export interface PushFoldQuestionData {
  situation: SituationData
  discard: number
}

const yen = (n: number) => `${n.toLocaleString('ja-JP')}点`

/** 自分の座席の風(1=東) */
function mySeatWind(s: DefenseSituation): number {
  return ((0 - s.dealerSeat + 4) % 4) + 1
}

/** 局面と切る牌から、問題の中身を組み立てる */
export function buildPushFoldQuestion(situation: DefenseSituation, discard: number): PushFoldQuestion {
  const s = situation
  const tiles = [...s.myHand, s.drawn]
  let idx = tiles.findIndex((t) => t.kind === discard && !t.red)
  if (idx < 0) idx = tiles.findIndex((t) => t.kind === discard)
  if (idx < 0) throw new Error('手牌にない牌です')
  const rest = tiles.filter((_, i) => i !== idx)
  const shanten = calcShantenFromTiles(rest).min
  if (shanten !== 0 && shanten !== 1) throw new Error('テンパイかイーシャンテンの手ではありません')
  const riichiSeat = riichiSeats(s)[0]
  const visible = visibleCounts(s)
  const iAmDealer = s.dealerSeat === 0
  const seatWind = mySeatWind(s)
  const doraKind = doraFromIndicator(s.doraIndicator.kind)

  let shape: 'good' | 'bad'
  let count: number
  let myValue: number
  let waits: number[] = []
  let handLabel: string
  let valueLabel: string
  if (shanten === 0) {
    const w = findWaits(rest)
    waits = w.waits.map((x) => x.kind)
    // 自分から見えていない残り枚数(切る牌は手牌に含めて数えているので、河に出ても同じ)
    const left = (k: number) => Math.max(0, 4 - visible[k])
    count = waits.reduce((sum, k) => sum + left(k), 0)
    const ryanmen = w.waits.some((x) => x.shapes.includes('ryanmen'))
    shape = ryanmen || waits.length >= 3 ? 'good' : 'bad'
    // リーチしてロンしたときの点数を、待ちの残り枚数で平均する
    let total = 0
    let weight = 0
    for (const k of waits) {
      const winTile: Tile = { kind: k, red: false }
      const r = calculateScore({
        hand: [...rest, winTile],
        winTile,
        context: { tsumo: false, riichi: true, roundWind: 1, seatWind, doraIndicators: [s.doraIndicator] },
      })
      if (!r.ok) continue
      const wgt = Math.max(1, left(k))
      total += r.points * wgt
      weight += wgt
    }
    myValue = weight > 0 ? Math.round(total / weight / 100) * 100 : pointsFor(1, 30, iAmDealer).ron
    const shapeName = ryanmen ? '両面待ち' : waits.length >= 3 ? '多面待ち' : '愚形待ち'
    handLabel = `テンパイ(${shapeName}・待ち牌の残り${count}枚)`
    valueLabel = `リーチしてロンすると 約${yen(myValue)}`
  } else {
    const u = calcUkeire(rest, [...s.rivers.flatMap((r) => r.map((x) => x.tile)), s.doraIndicator, tiles[idx]])
    count = u.total
    shape = count >= PUSHFOLD_TABLE.iishantenGoodUkeire ? 'good' : 'bad'
    // 打点の目安: リーチ + ドラ + 赤 + 断么九(すべて2〜8なら)。30符で計算
    const dora = rest.filter((t) => t.kind === doraKind).length
    const red = rest.filter((t) => t.red).length
    const tanyao = rest.every((t) => !isHonor(t.kind) && rankOf(t.kind) >= 2 && rankOf(t.kind) <= 8) ? 1 : 0
    const han = 1 + dora + red + tanyao
    myValue = pointsFor(han, 30, iAmDealer).ron
    handLabel = `イーシャンテン(受け入れ${count}枚・${shape === 'good' ? '良形' : '愚形が残る'})`
    const parts = ['リーチ', ...(tanyao ? ['断么九'] : []), ...(dora ? [`ドラ${dora}`] : []), ...(red ? [`赤${red}`] : [])]
    valueLabel = `テンパイしてリーチ・ロンなら 約${yen(myValue)}(${parts.join('・')}の${han}翻の目安)`
  }

  const safety = assessTile(s, discard)
  const input: PushFoldInput = {
    shanten: shanten as 0 | 1,
    shape,
    count,
    turn: s.turn,
    myValue,
    iAmDealer,
    opponent: { dealer: riichiSeat === s.dealerSeat, kind: 'riichi' },
    tileDanger: safety.danger,
  }
  return { situation: s, discard, safety, rest, riichiSeat, waits, handLabel, valueLabel, input, result: evaluatePushFold(input) }
}

/** 形を保つ打牌のうち一番良いもの。安全な牌(危険度 MIN_DANGER 未満)で形を保てるなら null */
function forcedDangerousDiscard(s: DefenseSituation): number | null {
  const tiles = [...s.myHand, s.drawn]
  const kinds = [...new Set(tiles.map((t) => t.kind))]
  const options = kinds.map((k) => {
    const i = tiles.findIndex((t) => t.kind === k)
    const rest = tiles.filter((_, j) => j !== i)
    return { kind: k, rest, shanten: calcShantenFromTiles(rest).min }
  })
  const best = Math.min(...options.map((o) => o.shanten))
  if (best !== 0 && best !== 1) return null
  const keep = options.filter((o) => o.shanten === best)
  if (keep.some((o) => assessTile(s, o.kind).danger < MIN_DANGER)) return null
  // 受け入れが一番多いもの
  const scored = keep.map((o) => ({ kind: o.kind, total: calcUkeire(o.rest).total }))
  scored.sort((a, b) => b.total - a.total || a.kind - b.kind)
  return scored[0].kind
}

/** 問題を作る。押しが正解・降りが正解の問題が同じくらい出るようにする */
export function generatePushFoldQuestion(rng: Rng, maxAttempts = 3000): PushFoldQuestion {
  const want = randomInt(rng, 2) === 0 ? 'push' : 'fold'
  let fallback: PushFoldQuestion | null = null
  for (let i = 0; i < maxAttempts; i++) {
    const s = generateSituation(rng, { riichiCount: 1, minTurnsAfterRiichi: randomInt(rng, 3) })
    const discard = forcedDangerousDiscard(s)
    if (discard === null) continue
    const q = buildPushFoldQuestion(s, discard)
    if (q.result.verdict === want) return q
    fallback ??= q
    if (i > 200 && fallback) return fallback
  }
  if (fallback) return fallback
  throw new Error('押し引きの問題を作れませんでした')
}

export function judgePushFold(q: PushFoldQuestion, answer: PushFoldAnswer): boolean {
  return isCorrectPushFold(q.result.verdict, answer)
}

export function toPushFoldData(q: PushFoldQuestion): PushFoldQuestionData {
  return { situation: situationToData(q.situation), discard: q.discard }
}

export function fromPushFoldData(value: unknown): PushFoldQuestion {
  const d = value as Partial<PushFoldQuestionData> | null
  if (!d || typeof d.discard !== 'number') throw new Error('押し引きの問題データが正しくありません')
  return buildPushFoldQuestion(situationFromData(d.situation), d.discard)
}

export function pushFoldKeyOf(q: PushFoldQuestion): string {
  const s = situationToData(q.situation)
  return [s.hand, s.drawn, s.rivers.join(','), s.seq, s.riichi.join(','), q.discard].join('|')
}
