// 何切る(牌効率)の解説文をテンプレートで作る(生成AIは使わない)

import { tileName, type Tile } from './tiles'
import type { EfficiencyJudgement } from './efficiency'
import type { DiscardOption, UkeireTile } from './ukeire'

export interface ComparisonRow {
  tile: Tile
  shanten: number
  /** 有効牌の種類数 */
  kinds: number
  /** 受け入れ枚数 */
  total: number
  correct: boolean
  chosen: boolean
  backward: boolean
}

export interface DiscardExplanation {
  correct: boolean
  /** 回答した打牌の説明(例:「3萬切りは受け入れ4種12枚。最善の東切り(16枚)より4枚少ない。」) */
  summary: string
  /** シャンテン戻しが正解のときの理由(それ以外は null) */
  backwardReason: string | null
  /** 最善手 */
  bestTile: Tile
  /** 最善手の有効牌 */
  bestTiles: UkeireTile[]
  /** 全候補の比較表(正解が先頭) */
  rows: ComparisonRow[]
}

/** シャンテン数の呼び方(-1 = アガリ、0 = テンパイ) */
export function shantenLabel(n: number): string {
  if (n === -1) return 'アガリ'
  if (n === 0) return 'テンパイ'
  return `${n}シャンテン`
}

const cut = (o: DiscardOption) => `${tileName(o.tile)}切り`
const ukeire = (o: DiscardOption) => `受け入れ${o.tiles.length}種${o.total}枚`

export function explainDiscard(judgement: EfficiencyJudgement, chosenKind: number): DiscardExplanation {
  const { ranked, best, bestForward, backwardCorrect, correctKinds } = judgement
  const chosen = ranked.find((o) => o.tile.kind === chosenKind)
  if (!chosen) throw new Error('手牌にない牌です')
  const correct = correctKinds.includes(chosenKind)
  const others = ranked.filter((o) => correctKinds.includes(o.tile.kind) && o.tile.kind !== chosenKind)

  let summary: string
  if (correct) {
    summary = `${cut(chosen)}は${ukeire(chosen)}。`
    summary += others.length > 0 ? `${others.map(cut).join('・')}も同じ枚数なので、どちらも正解です。` : 'いちばん多く受け入れられる打牌です。'
  } else if (chosen.shanten > best.shanten) {
    summary =
      `${cut(chosen)}は${shantenLabel(best.shanten)}から${shantenLabel(chosen.shanten)}に戻ってしまいます(${ukeire(chosen)})。` +
      `最善の${cut(best)}なら${shantenLabel(best.shanten)}のまま${best.total}枚受け入れられます。`
  } else {
    const diff = best.total - chosen.total
    summary = `${cut(chosen)}は${ukeire(chosen)}。最善の${cut(best)}(${best.total}枚)より${diff}枚少ない。`
    if (chosen.shanten < best.shanten) {
      summary = `${cut(chosen)}は${shantenLabel(chosen.shanten)}を保てますが、${ukeire(chosen)}しかありません。最善の${cut(best)}(${best.total}枚)より${diff}枚少ない。`
    }
  }

  let backwardReason: string | null = null
  if (backwardCorrect) {
    const ratio = bestForward.total === 0 ? null : Math.floor(best.total / bestForward.total)
    backwardReason =
      `${shantenLabel(bestForward.shanten)}を保つ打牌は、受け入れが最大でも${bestForward.total}枚(${cut(bestForward)})しかありません。` +
      `${cut(best)}で${shantenLabel(best.shanten)}に戻すと、受け入れが${best.total}枚に増え` +
      (ratio === null ? '、進める牌がなくなるのを防げます。' : `、${ratio}倍以上の牌で次に進めます。`) +
      'シャンテン数が1つ戻っても、受け入れが大きく広がるならそちらが有利です。'
  }

  const rows: ComparisonRow[] = ranked.map((o) => ({
    tile: o.tile,
    shanten: o.shanten,
    kinds: o.tiles.length,
    total: o.total,
    correct: correctKinds.includes(o.tile.kind),
    chosen: o.tile.kind === chosenKind,
    backward: o.shanten > bestForward.shanten,
  }))

  return { correct, summary, backwardReason, bestTile: best.tile, bestTiles: best.tiles, rows }
}
