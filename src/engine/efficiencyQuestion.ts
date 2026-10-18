// 何切る(牌効率)の問題を作る
//
// ランダムに牌を並べるのではなく、実際の局に近い流れで局面を作る:
//   1. 山を作り、ドラ表示牌を1枚めくって、4人に13枚ずつ配る
//   2. 自分は「牌効率どおりに打つ簡易プレイヤー」(efficiency.ts と同じ基準で切る)
//      他の3人はツモ切りで河を作る(河は「見えている牌」として残り枚数から差し引く)
//   3. 自分がツモって14枚になった時点で、難易度と問題の質の条件に合えば、その局面を切り出す

import { randomInt, type Rng } from './random'
import { calcShantenFromTiles } from './shanten'
import { formatTiles, parseTiles, sortTiles, type Tile } from './tiles'
import { judgeDiscards, type EfficiencyJudgement } from './efficiency'
import { createWall } from './wall'

export type Difficulty = 'beginner' | 'intermediate' | 'advanced'

export const DIFFICULTIES: readonly { id: Difficulty; label: string; description: string }[] = [
  { id: 'beginner', label: '初級', description: '1シャンテンの手。テンパイに一番近づく打牌を選びます。' },
  { id: 'intermediate', label: '中級', description: '2シャンテンの手。受け入れ枚数の差を見比べます。' },
  { id: 'advanced', label: '上級', description: '3シャンテン以上の手や、七対子が絡む手です。' },
]

export interface EfficiencyQuestion {
  difficulty: Difficulty
  /** 何巡目か */
  turn: number
  /** ツモる前の手牌(13枚・理牌済み) */
  hand: Tile[]
  /** ツモってきた牌 */
  drawn: Tile
  doraIndicator: Tile
  /** 自分の河 */
  ownDiscards: Tile[]
  /** 他家の河(下家・対面・上家) */
  otherDiscards: [Tile[], Tile[], Tile[]]
  /** 見えている牌すべて(ドラ表示牌・河) */
  visible: Tile[]
  judgement: EfficiencyJudgement
}

const MAX_TURNS = 12

/** 難易度の条件に合うか */
export function matchesDifficulty(difficulty: Difficulty, hand14: readonly Tile[], judgement: EfficiencyJudgement): boolean {
  const s = calcShantenFromTiles(hand14)
  const shanten = judgement.analysis.shanten
  switch (difficulty) {
    case 'beginner':
      return shanten === 1 && s.normal === 1
    case 'intermediate':
      return shanten === 2 && s.normal === 2
    case 'advanced':
      return (shanten >= 3 && shanten <= 4) || (shanten >= 1 && shanten <= 3 && s.chiitoitsu <= s.normal)
  }
}

/** 問題として成り立つか(答えが1〜2種類で、間違えやすい選択肢がある) */
export function isGoodQuestion(judgement: EfficiencyJudgement): boolean {
  const { best, correctKinds, analysis } = judgement
  if (best.total === 0 || correctKinds.length > 2) return false
  // 正解と同じシャンテン数の不正解がある(考える意味がある)
  return analysis.options.some((o) => !correctKinds.includes(o.tile.kind) && o.shanten === best.shanten)
}

/** 1局をシミュレーションして、条件に合う局面を探す。見つからなければ null */
function trySimulate(difficulty: Difficulty, rng: Rng, wantChiitoitsu: boolean): EfficiencyQuestion | null {
  const wall = createWall(rng)
  const doraIndicator = wall.pop()!
  // 王牌(ドラ表示牌を除く13枚)は使わない
  wall.splice(wall.length - 13, 13)

  let hand = wall.splice(0, 13)
  // 他家の手牌はツモ切りなので中身は使わないが、山からは取り除く
  wall.splice(0, 39)

  const ownDiscards: Tile[] = []
  const otherDiscards: [Tile[], Tile[], Tile[]] = [[], [], []]

  for (let turn = 1; turn <= MAX_TURNS && wall.length >= 4; turn++) {
    const drawn = wall.shift()!
    const hand14 = [...hand, drawn]
    const visible = [doraIndicator, ...ownDiscards, ...otherDiscards.flat()]
    const judgement = judgeDiscards(hand14, visible)

    if (
      matchesDifficulty(difficulty, hand14, judgement) &&
      isGoodQuestion(judgement) &&
      (!wantChiitoitsu || calcShantenFromTiles(hand14).chiitoitsu <= calcShantenFromTiles(hand14).normal)
    ) {
      return {
        difficulty,
        turn,
        hand: sortTiles(hand),
        drawn,
        doraIndicator,
        ownDiscards,
        otherDiscards,
        visible,
        judgement,
      }
    }
    if (judgement.analysis.shanten <= 0) return null

    // 牌効率どおりに切る(正解が複数あればどれか1つ)
    const kind = judgement.correctKinds[randomInt(rng, judgement.correctKinds.length)]
    const index = hand14.findIndex((t) => t.kind === kind && !t.red)
    const discardIndex = index >= 0 ? index : hand14.findIndex((t) => t.kind === kind)
    ownDiscards.push(hand14[discardIndex])
    hand = hand14.filter((_, i) => i !== discardIndex)

    // 他家はツモ切り
    for (const river of otherDiscards) river.push(wall.shift()!)
  }
  return null
}

/** 難易度に合う問題を作る */
export function generateQuestion(difficulty: Difficulty, rng: Rng, maxAttempts = 300): EfficiencyQuestion {
  // 上級は半分くらいを七対子が絡む形にする
  const wantChiitoitsu = difficulty === 'advanced' && rng() < 0.5
  for (let i = 0; i < maxAttempts; i++) {
    const q = trySimulate(difficulty, rng, wantChiitoitsu && i < maxAttempts / 2)
    if (q) return q
  }
  throw new Error(`問題を作れませんでした(${difficulty})`)
}

// ---- 保存用の形(学習記録で局面を再現するため) ----

/** 問題を保存するための形(牌は文字列表記) */
export interface EfficiencyQuestionData {
  difficulty: Difficulty
  turn: number
  hand: string
  drawn: string
  dora: string
  own: string
  others: [string, string, string]
}

export function toQuestionData(q: EfficiencyQuestion): EfficiencyQuestionData {
  return {
    difficulty: q.difficulty,
    turn: q.turn,
    hand: formatTiles(q.hand),
    drawn: formatTiles([q.drawn]),
    dora: formatTiles([q.doraIndicator]),
    own: formatTiles(q.ownDiscards),
    others: q.otherDiscards.map((r) => formatTiles(r)) as [string, string, string],
  }
}

/** 同じ問題を見分けるためのキー */
export function questionKeyOf(q: EfficiencyQuestion): string {
  const d = toQuestionData(q)
  return [d.hand, d.drawn, d.dora, d.own, ...d.others].join('|')
}

/** 保存した形から問題を作り直す(正解も計算し直す)。形が正しくなければエラー */
export function fromQuestionData(value: unknown): EfficiencyQuestion {
  const d = value as Partial<EfficiencyQuestionData> | null
  const isStr = (v: unknown): v is string => typeof v === 'string'
  if (
    !d ||
    !DIFFICULTIES.some((x) => x.id === d.difficulty) ||
    typeof d.turn !== 'number' ||
    !isStr(d.hand) ||
    !isStr(d.drawn) ||
    !isStr(d.dora) ||
    !isStr(d.own) ||
    !Array.isArray(d.others) ||
    d.others.length !== 3 ||
    !d.others.every(isStr)
  ) {
    throw new Error('何切るの問題データが正しくありません')
  }
  const hand = parseTiles(d.hand)
  const drawn = parseTiles(d.drawn)
  const dora = parseTiles(d.dora)
  if (hand.length !== 13 || drawn.length !== 1 || dora.length !== 1) throw new Error('何切るの問題データが正しくありません')
  const ownDiscards = parseTiles(d.own)
  const otherDiscards = d.others.map((r) => parseTiles(r)) as [Tile[], Tile[], Tile[]]
  const visible = [dora[0], ...ownDiscards, ...otherDiscards.flat()]
  return {
    difficulty: d.difficulty as Difficulty,
    turn: d.turn,
    hand,
    drawn: drawn[0],
    doraIndicator: dora[0],
    ownDiscards,
    otherDiscards,
    visible,
    judgement: judgeDiscards([...hand, drawn[0]], visible),
  }
}
