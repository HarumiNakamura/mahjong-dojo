// 何切る(牌効率)の解説文をテンプレートで作る(生成AIは使わない)

import { tileName, type Tile } from './tiles'
import type { EfficiencyJudgement } from './efficiency'
import { describeRole, tileRole, type TileRole } from './tileRole'
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
  /**
   * 理由の文(手牌を渡したときだけ)。切った牌・最善の牌の役割(孤立牌・嵌張など)と、
   * 増えた・減った有効牌、シャンテン戻しの説明
   */
  reasons: string[]
  /** 関連する解説記事(1〜2個) */
  articles: { path: string; label: string }[]
}

const ARTICLE_LABELS: Record<string, string> = {
  '/learn/efficiency': '牌効率の基本',
  '/learn/good-shape': '良形と愚形',
  '/learn/shanten-back': 'シャンテン戻し',
  '/learn/waits': '待ちの種類',
  '/learn/ukeire': '受け入れ枚数とは',
}

const nameOf = (k: number) => tileName({ kind: k, red: false })

/** 役割の一言(孤立牌なら「切っても形が崩れない」まで) */
function roleSentence(kind: number, role: TileRole): string {
  return role.type === 'isolated' ? `${describeRole(kind, role)}。切っても手の形が崩れません。` : `${describeRole(kind, role)}。`
}

function articleFor(role: TileRole | null): string {
  if (!role) return '/learn/efficiency'
  if (role.type === 'ryanmen' || role.type === 'kanchan' || role.type === 'penchan') return '/learn/good-shape'
  return '/learn/efficiency'
}

/** シャンテン数の呼び方(-1 = アガリ、0 = テンパイ) */
export function shantenLabel(n: number): string {
  if (n === -1) return 'アガリ'
  if (n === 0) return 'テンパイ'
  return `${n}シャンテン`
}

const cut = (o: DiscardOption) => `${tileName(o.tile)}切り`
const ukeire = (o: DiscardOption) => `受け入れ${o.tiles.length}種${o.total}枚`

/**
 * 何切るの解説。hand(打牌前の14枚)を渡すと、牌の役割と有効牌の増減で理由も説明する
 */
export function explainDiscard(judgement: EfficiencyJudgement, chosenKind: number, hand?: readonly Tile[]): DiscardExplanation {
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

  // ---- 理由 ----
  const reasons: string[] = []
  const roleChosen = hand ? tileRole(hand, chosenKind) : null
  const roleBest = hand ? tileRole(hand, best.tile.kind) : null
  if (correct) {
    if (roleChosen) reasons.push(roleSentence(chosenKind, roleChosen))
  } else {
    if (chosen.shanten > best.shanten) {
      reasons.push(
        chosen.total > best.total
          ? `${cut(chosen)}は受け入れ枚数(${chosen.total}枚)は多いですが、${shantenLabel(chosen.shanten)}に戻るので、テンパイまでが1枚遠くなります。`
          : `${cut(chosen)}はシャンテン数が戻り、テンパイまでが1枚遠くなります。`,
      )
    }
    if (roleChosen) reasons.push(roleSentence(chosenKind, roleChosen))
    if (roleBest) reasons.push(`一方、${roleSentence(best.tile.kind, roleBest)}`)
    if (chosen.shanten === best.shanten) {
      const has = (o: DiscardOption, k: number) => o.tiles.some((t) => t.kind === k && t.remaining > 0)
      const lost = best.tiles.filter((t) => t.remaining > 0 && !has(chosen, t.kind)).map((t) => nameOf(t.kind))
      const gained = chosen.tiles.filter((t) => t.remaining > 0 && !has(best, t.kind)).map((t) => nameOf(t.kind))
      if (lost.length) reasons.push(`${tileName(chosen.tile)}を切ると、${lost.join('・')}を引いても手が進まなくなります。`)
      if (gained.length) reasons.push(`代わりに${gained.join('・')}で進めるようになりますが、合計では${best.total - chosen.total}枚少なくなります。`)
    }
  }
  const paths = [
    ...(backwardCorrect || chosen.shanten > best.shanten ? ['/learn/shanten-back'] : []),
    articleFor(correct ? roleChosen : roleBest),
    ...(best.shanten === 0 ? ['/learn/waits'] : ['/learn/ukeire']),
  ].filter((p, i, all) => all.indexOf(p) === i)
  const articles = paths.slice(0, 2).map((path) => ({ path, label: ARTICLE_LABELS[path] }))

  const rows: ComparisonRow[] = ranked.map((o) => ({
    tile: o.tile,
    shanten: o.shanten,
    kinds: o.tiles.length,
    total: o.total,
    correct: correctKinds.includes(o.tile.kind),
    chosen: o.tile.kind === chosenKind,
    backward: o.shanten > bestForward.shanten,
  }))

  return { correct, summary, backwardReason, bestTile: best.tile, bestTiles: best.tiles, rows, reasons, articles }
}
