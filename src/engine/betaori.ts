// ベタオリサバイバル: 他家のリーチのあと、流局まで1巡ずつ安全な牌を切り続ける
//
// - 局面は danger.ts と同じ作り方(シードから決まる)。リーチ者は1人
// - 自分が切るたびに、その牌の危険度と「もっと安全な牌があったか」を記録する
// - 自分の打牌がリーチ者に当たったら、その場で終わり(放銃)
// - 他家は簡易プレイヤーで打つ(乱数を使わないので、同じ打牌の並びなら必ず同じ展開になる)。
//   他家がリーチ者に放銃したとき・誰かがツモアガリしたときも、その場で終わる(自分は放銃せずに終われた)
// - 山がなくなったら流局

import {
  assessHand,
  chooseDiscard,
  dealsIn,
  generateSituation,
  riichiSeats,
  type DefenseSituation,
  type TileSafety,
} from './danger'
import { createRng } from './random'
import { calcShantenFromTiles } from './shanten'
import { sortTiles, type Tile } from './tiles'
import { findWaits } from './waits'

export interface BetaoriTurn {
  turn: number
  /** 打牌前の14枚(手牌13枚+ツモ牌) */
  tiles: Tile[]
  /** この巡の、牌の種類ごとの判定(安全な順) */
  assessments: TileSafety[]
  discard: Tile
  /** 切った牌の危険度(%) */
  danger: number
  /** この巡で一番安全な牌の危険度(%) */
  minDanger: number
  /** 一番安全な牌の種類 */
  safestKinds: number[]
  /** 手牌にあった現物(危険度0)の枚数 */
  safeStock: number
  /** この牌で放銃した */
  dealtIn: boolean
}

export type BetaoriEnd =
  | { reason: 'dealIn'; seat: number }
  | { reason: 'ryukyoku' }
  /** 他家がアガった(ツモ、またはリーチ者へのロン)。自分は放銃していない。tile はアガリ牌 */
  | { reason: 'otherWin'; winner: number; tsumo: boolean; tile: Tile }

export interface BetaoriGame {
  seed: number
  /** 今の局面(終わったあとの drawn は最後に切った巡のツモ牌のままなので使わない) */
  situation: DefenseSituation
  turns: BetaoriTurn[]
  end: BetaoriEnd | null
}

/** シードから新しいゲームを始める(リーチがかかった直後の自分のツモ番から) */
export function startBetaori(seed: number): BetaoriGame {
  const situation = generateSituation(createRng(seed), { riichiCount: 1, minTurnsAfterRiichi: 0, maxTurn: 11 })
  return { seed, situation, turns: [], end: null }
}

function cloneSituation(s: DefenseSituation): DefenseSituation {
  return {
    ...s,
    rivers: s.rivers.map((r) => [...r]),
    riichiIndex: [...s.riichiIndex],
    hands: s.hands.map((h) => [...h]),
    myHand: [...s.myHand],
    wall: [...s.wall],
  }
}

/** 今の局面の判定(画面で、切ったあとの危険度を出すのに使う) */
export function currentAssessments(game: BetaoriGame): TileSafety[] {
  return assessHand(game.situation)
}

/** 牌の種類 kind を切る。手牌にない牌や、終わったゲームではエラー */
export function discardBetaori(game: BetaoriGame, kind: number): BetaoriGame {
  if (game.end) throw new Error('このゲームは終わっています')
  const s = cloneSituation(game.situation)
  const tiles = [...s.myHand, s.drawn]
  // 赤5でない牌を優先して切る(同じ種類なら危険度は同じ)
  let index = tiles.findIndex((t) => t.kind === kind && !t.red)
  if (index < 0) index = tiles.findIndex((t) => t.kind === kind)
  if (index < 0) throw new Error('手牌にない牌です')

  const assessments = assessHand(game.situation)
  const danger = assessments.find((a) => a.kind === kind)!.danger
  const minDanger = assessments[0].danger
  const hit = dealsIn(game.situation, kind)
  const turn: BetaoriTurn = {
    turn: s.turn,
    tiles,
    assessments,
    discard: tiles[index],
    danger,
    minDanger,
    safestKinds: assessments.filter((a) => a.danger === minDanger).map((a) => a.kind),
    safeStock: tiles.filter((t) => assessments.find((a) => a.kind === t.kind)!.danger === 0).length,
    dealtIn: hit.length > 0,
  }
  s.rivers[0].push({ tile: tiles[index], order: s.nextOrder++ })
  s.myHand = sortTiles(tiles.filter((_, i) => i !== index))
  const turns = [...game.turns, turn]
  if (hit.length > 0) {
    // 頭ハネ: 下家 → 対面 → 上家 の順で優先
    return { ...game, situation: s, turns, end: { reason: 'dealIn', seat: hit[0] } }
  }

  // 他家が打つ
  for (const seat of [1, 2, 3]) {
    if (s.wall.length === 0) return { ...game, situation: s, turns, end: { reason: 'ryukyoku' } }
    const drawn = s.wall.shift()!
    const hand14 = [...s.hands[seat], drawn]
    if (calcShantenFromTiles(hand14).min === -1) {
      // 手牌は13枚のままにして(待ちの表示に使う)、アガリ牌は終わり方の情報に残す
      return { ...game, situation: s, turns, end: { reason: 'otherWin', winner: seat, tsumo: true, tile: drawn } }
    }
    const riichi = riichiSeats(s)
    const avoid = new Set<number>()
    for (const other of riichi) if (other !== seat) for (const w of findWaits(s.hands[other]).waits) avoid.add(w.kind)
    let index14: number | null
    if (s.riichiIndex[seat] !== null) index14 = hand14.length - 1
    else index14 = chooseDiscard(hand14, avoid) ?? chooseDiscard(hand14, new Set())
    const discard = hand14[index14!]
    s.hands[seat] = sortTiles(hand14.filter((_, i) => i !== index14))
    s.rivers[seat].push({ tile: discard, order: s.nextOrder++ })
    const ron = riichi.filter((other) => other !== seat && findWaits(s.hands[other]).waits.some((w) => w.kind === discard.kind))
    if (ron.length > 0) return { ...game, situation: s, turns, end: { reason: 'otherWin', winner: ron[0], tsumo: false, tile: discard } }
  }

  // 自分のツモ
  if (s.wall.length === 0) return { ...game, situation: s, turns, end: { reason: 'ryukyoku' } }
  s.drawn = s.wall.shift()!
  s.turn++
  return { ...game, situation: s, turns, end: null }
}

/** 打牌の並び(牌の種類)から、ゲームを最初から再現する。途中で打てない牌があれば null */
export function replayBetaori(seed: number, kinds: readonly number[]): BetaoriGame | null {
  let game = startBetaori(seed)
  for (const kind of kinds) {
    if (game.end) return null
    if (![...game.situation.myHand, game.situation.drawn].some((t) => t.kind === kind)) return null
    game = discardBetaori(game, kind)
  }
  return game
}

// ---- 振り返り ----

export interface BetaoriSummary {
  /** 切った回数 */
  turns: number
  dealtIn: boolean
  /** 一番安全な牌を選べた巡の数 */
  safestCount: number
  /** もっと安全な牌があった巡 */
  saferExisted: BetaoriTurn[]
  /** 自分の打牌で放銃する確率の目安(各巡の危険度から) */
  risk: number
  /** 毎巡一番安全な牌を切った場合の目安 */
  bestRisk: number
  /** 現物が手牌になかった巡(安パイ切れ) */
  outOfSafeTurns: number[]
  /** 安パイの使い方の短い評価 */
  stockComment: string
}

const combine = (dangers: readonly number[]) => Math.round((1 - dangers.reduce((p, d) => p * (1 - d / 100), 1)) * 1000) / 10

export function summarizeBetaori(game: BetaoriGame): BetaoriSummary {
  const t = game.turns
  const saferExisted = t.filter((x) => x.danger > x.minDanger)
  const outOfSafeTurns = t.filter((x) => x.safeStock === 0).map((x) => x.turn)
  // 現物が手にあったのに、危険な牌を切った巡
  const hoarded = t.filter((x) => x.safeStock > 0 && x.danger > 0).length
  let stockComment: string
  if (hoarded > 0) {
    stockComment = `現物が手にあるのに危険な牌を切った巡が${hoarded}回ありました。リーチを受けたら、まず現物から切りましょう。`
  } else if (outOfSafeTurns.length === 0) {
    stockComment = '最後まで現物を切り続けられました。'
  } else {
    const first = outOfSafeTurns[0]
    stockComment = `${first}巡目で現物がなくなりました。現物がなくなったら、字牌(見えている枚数が多いもの)・スジ・壁の順に安全な牌を探します。対子の安パイは2巡しのげるので大事にしましょう。`
  }
  return {
    turns: t.length,
    dealtIn: game.end?.reason === 'dealIn',
    safestCount: t.length - saferExisted.length,
    saferExisted,
    risk: combine(t.map((x) => x.danger)),
    bestRisk: combine(t.map((x) => x.minDanger)),
    outOfSafeTurns,
    stockComment,
  }
}

export const BETAORI_END_LABELS = {
  dealIn: '放銃',
  ryukyoku: '流局(逃げ切り)',
  otherWin: '他家のアガリ(逃げ切り)',
} as const
