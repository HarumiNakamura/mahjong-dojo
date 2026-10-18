// 一人麻雀(鳴きなし。リーチとツモアガリあり。18巡かアガリで終わる)と振り返りの集計
//
// 毎巡、打牌したときの局面と「最善手(何切るドリルと同じ判定)」を記録する。
// 見えている牌はドラ表示牌と自分の河だけ(一人なので他家の河はない)。
// 鳴きがないので手は常に門前。ツモアガリには必ず門前清自摸和が付くので、アガリの形ならいつでもアガれる。

import { judgeDiscards, type EfficiencyJudgement } from './efficiency'
import type { Difficulty, EfficiencyQuestion } from './efficiencyQuestion'
import type { Rng } from './random'
import { calcShantenFromTiles } from './shanten'
import { sortTiles, type Tile } from './tiles'
import { isFormalTenpai } from './waits'
import { createWall } from './wall'

/** 1局のツモの回数 */
export const SOLO_TURNS = 18

/** 振り返りで「差が大きい」とする受け入れ枚数の差 */
export const BIG_MISS_DIFF = 4

export interface SoloTurnLog {
  turn: number
  /** ツモる前の手牌(13枚・理牌済み) */
  hand: Tile[]
  drawn: Tile
  /** この巡の時点で見えていた牌(ドラ表示牌・自分の河) */
  visible: Tile[]
  /** この巡の時点の自分の河 */
  ownDiscards: Tile[]
  /** 切った牌 */
  discard: Tile
  /** この巡でリーチを宣言した */
  riichi: boolean
  /** リーチ後のツモ切り(採点しない) */
  afterRiichi: boolean
  /** 最善手の判定(リーチ後は null) */
  judgement: EfficiencyJudgement | null
  /** 切ったあとテンパイしているか */
  tenpai: boolean
}

export type SoloEnd = { reason: 'agari'; turn: number } | { reason: 'exhausted'; turn: number }

export interface SoloGame {
  doraIndicator: Tile
  /** これからツモる牌 */
  wall: Tile[]
  /** 今の手牌(ツモ牌を除く13枚) */
  hand: Tile[]
  /** ツモ牌(終局後は null) */
  drawn: Tile | null
  /** 今の巡目(1〜18) */
  turn: number
  discards: Tile[]
  /** リーチを宣言した捨て牌の位置(していなければ null) */
  riichiIndex: number | null
  logs: SoloTurnLog[]
  end: SoloEnd | null
}

/** 新しい局を始める(配牌して1巡目のツモまで) */
export function startSoloGame(rng: Rng): SoloGame {
  const wall = createWall(rng)
  const doraIndicator = wall.pop()!
  wall.splice(wall.length - 13, 13) // 王牌
  const hand = sortTiles(wall.splice(0, 13))
  const draws = wall.slice(0, SOLO_TURNS)
  return {
    doraIndicator,
    wall: draws.slice(1),
    hand,
    drawn: draws[0],
    turn: 1,
    discards: [],
    riichiIndex: null,
    logs: [],
    end: null,
  }
}

function hand14(game: SoloGame): Tile[] {
  if (!game.drawn) throw new Error('ツモ牌がありません')
  return [...game.hand, game.drawn]
}

function visibleOf(game: SoloGame): Tile[] {
  return [game.doraIndicator, ...game.discards]
}

/** ツモアガリできるか */
export function canTsumo(game: SoloGame): boolean {
  return game.end === null && game.drawn !== null && calcShantenFromTiles(hand14(game)).min === -1
}

/**
 * リーチできる打牌(牌の種類)。リーチ済み・最後のツモ(海底)・テンパイにならない場合は空。
 */
export function riichiDiscardKinds(game: SoloGame): number[] {
  if (game.end !== null || game.riichiIndex !== null || game.turn >= SOLO_TURNS || !game.drawn) return []
  const tiles = hand14(game)
  const kinds = new Set<number>()
  tiles.forEach((t, i) => {
    if (kinds.has(t.kind)) return
    const rest = tiles.filter((_, j) => j !== i)
    if (calcShantenFromTiles(rest).min === 0) kinds.add(t.kind)
  })
  return [...kinds].sort((a, b) => a - b)
}

/** 今の局面を何切るの問題と同じ形にする(練習モードの表示に使う) */
export function currentJudgement(game: SoloGame): EfficiencyJudgement {
  return judgeDiscards(hand14(game), visibleOf(game))
}

/**
 * 牌を切る。index は「手牌13枚 + ツモ牌」の並びでの位置(ツモ牌は 13)。
 * リーチ後はツモ牌しか切れない。
 */
export function discardTile(game: SoloGame, index: number, options: { riichi?: boolean } = {}): SoloGame {
  if (game.end !== null) throw new Error('この局は終わっています')
  const tiles = hand14(game)
  if (index < 0 || index >= tiles.length) throw new Error('切る牌の位置が正しくありません')
  const afterRiichi = game.riichiIndex !== null
  if (afterRiichi && index !== tiles.length - 1) throw new Error('リーチ後はツモ切りしかできません')
  const discard = tiles[index]
  const riichi = options.riichi === true
  if (riichi && !riichiDiscardKinds(game).includes(discard.kind)) throw new Error('その牌ではリーチできません')

  const rest = tiles.filter((_, i) => i !== index)
  const visible = visibleOf(game)
  const log: SoloTurnLog = {
    turn: game.turn,
    hand: game.hand,
    drawn: game.drawn!,
    visible,
    ownDiscards: game.discards,
    discard,
    riichi,
    afterRiichi,
    judgement: afterRiichi ? null : judgeDiscards(tiles, visible),
    tenpai: calcShantenFromTiles(rest).min === 0,
  }
  const discards = [...game.discards, discard]
  const base = {
    ...game,
    hand: sortTiles(rest),
    discards,
    riichiIndex: riichi ? discards.length - 1 : game.riichiIndex,
    logs: [...game.logs, log],
  }
  if (game.turn >= SOLO_TURNS || game.wall.length === 0) {
    return { ...base, drawn: null, end: { reason: 'exhausted', turn: game.turn } }
  }
  return { ...base, drawn: game.wall[0], wall: game.wall.slice(1), turn: game.turn + 1 }
}

/** ツモアガリする */
export function declareTsumo(game: SoloGame): SoloGame {
  if (!canTsumo(game)) throw new Error('アガリの形ではありません')
  return { ...game, end: { reason: 'agari', turn: game.turn } }
}

// ---- 振り返り ----

export interface SoloTurnReview {
  log: SoloTurnLog
  /** 最善手と同じ打牌か(リーチ後は null) */
  correct: boolean | null
  /** 自分の打牌の受け入れ枚数 */
  chosenTotal: number | null
  chosenShanten: number | null
  bestTotal: number | null
  /** 受け入れの差(最善手 − 自分の打牌) */
  diff: number | null
  /** 差が大きかった巡(シャンテン数を戻した、または受け入れが BIG_MISS_DIFF 枚以上少ない) */
  bigMiss: boolean
}

export interface SoloSummary {
  turns: SoloTurnReview[]
  /** 採点した巡の数(リーチ後のツモ切りを除く) */
  scored: number
  /** 最善手と一致した巡の数 */
  matched: number
  /** 受け入れの差の合計 */
  totalDiff: number
  /** 初めてテンパイした巡目(しなければ null) */
  firstTenpaiTurn: number | null
  /** テンパイしていた巡目の一覧 */
  tenpaiTurns: number[]
  agari: boolean
  /** 終わったときにテンパイしていたか(流局時。待ちを自分ですべて使っている形はノーテン) */
  tenpaiAtEnd: boolean
}

export function reviewTurn(log: SoloTurnLog): SoloTurnReview {
  if (!log.judgement) {
    return { log, correct: null, chosenTotal: null, chosenShanten: null, bestTotal: null, diff: null, bigMiss: false }
  }
  const j = log.judgement
  const chosen = j.ranked.find((o) => o.tile.kind === log.discard.kind)!
  const correct = j.correctKinds.includes(log.discard.kind)
  const diff = j.best.total - chosen.total
  const bigMiss = !correct && (chosen.shanten > j.best.shanten || diff >= BIG_MISS_DIFF)
  return { log, correct, chosenTotal: chosen.total, chosenShanten: chosen.shanten, bestTotal: j.best.total, diff, bigMiss }
}

export function summarizeSolo(game: SoloGame): SoloSummary {
  const turns = game.logs.map(reviewTurn)
  const scoredTurns = turns.filter((t) => t.correct !== null)
  const tenpaiTurns = game.logs.filter((l) => l.tenpai).map((l) => l.turn)
  const agari = game.end?.reason === 'agari'
  // 流局時のテンパイ: 待ちを自分ですべて使っている形はノーテン(docs/rules.md 7章)
  const tenpaiAtEnd = agari || (game.logs.length > 0 && isFormalTenpai(game.hand))
  return {
    turns,
    scored: scoredTurns.length,
    matched: scoredTurns.filter((t) => t.correct).length,
    totalDiff: scoredTurns.reduce((s, t) => s + Math.max(0, t.diff ?? 0), 0),
    firstTenpaiTurn: tenpaiTurns[0] ?? null,
    tenpaiTurns,
    agari,
    tenpaiAtEnd,
  }
}

/** 打牌前の手のシャンテン数から、何切るの難易度の目安を決める */
export function difficultyForShanten(shanten: number): Difficulty {
  if (shanten <= 1) return 'beginner'
  if (shanten === 2) return 'intermediate'
  return 'advanced'
}

/** 振り返りの巡を、何切るの問題と同じ形にする(解説の表示・復習リストに使う) */
export function turnToQuestion(log: SoloTurnLog): EfficiencyQuestion | null {
  if (!log.judgement) return null
  return {
    difficulty: difficultyForShanten(log.judgement.analysis.shanten),
    turn: log.turn,
    hand: log.hand,
    drawn: log.drawn,
    doraIndicator: log.visible[0],
    ownDiscards: log.ownDiscards,
    otherDiscards: [[], [], []],
    visible: log.visible,
    judgement: log.judgement,
  }
}
