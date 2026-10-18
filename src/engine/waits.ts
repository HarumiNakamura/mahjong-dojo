// 待ちの判定
//
// テンパイの手(13枚。副露があれば10・7・4・1枚)に1枚足してアガリの形になる牌が「待ち」。
// 待ちごとに、手牌の分け方(面子・雀頭と、待ちを作っている塊)と待ちの形を返す。
// 当たり牌を自分の手牌・副露ですべて(4枚)使っている場合は待ちに含めない(docs/rules.md 7章)。

import { meldCountFromTileCount } from './shanten'
import { isHonor, rankOf, TILE_KINDS, tilesToCounts, type Tile } from './tiles'

export type WaitShape = 'ryanmen' | 'kanchan' | 'penchan' | 'shanpon' | 'tanki' | 'chiitoitsu' | 'kokushi'

export const WAIT_SHAPE_LABELS: Record<WaitShape, string> = {
  ryanmen: '両面',
  kanchan: '嵌張',
  penchan: '辺張',
  shanpon: '双碰',
  tanki: '単騎',
  chiitoitsu: '七対子の単騎',
  kokushi: '国士無双',
}

export type BlockType = 'shuntsu' | 'koutsu' | 'pair'

/** 手牌の中の完成した塊(順子・刻子・対子) */
export interface Block {
  type: BlockType
  /** 牌の種類(小さい順) */
  kinds: number[]
}

/** 待ちの1通りの見方 */
export interface WaitPattern {
  shape: WaitShape
  /** 待ちを作っている塊(アガリ牌を除いた形。例: 嵌張なら [1m, 3m]) */
  waiting: number[]
  /** 残りの面子・雀頭 */
  others: Block[]
}

export interface WaitInfo {
  /** 待ち牌の種類 */
  kind: number
  /** この待ちの見方(手牌の分け方)。少なくとも1つ */
  patterns: WaitPattern[]
  /** この待ちの形の一覧(重なりなし) */
  shapes: WaitShape[]
}

export interface WaitsResult {
  /** 待ち牌(牌の種類の小さい順) */
  waits: WaitInfo[]
  /** 形はテンパイだが、自分ですべて使っているので待ちにならない牌 */
  usedUp: number[]
  /** テンパイしているか(待ちが1つ以上ある) */
  tenpai: boolean
}

// ---- 手牌の分け方を調べる ----

/** counts を面子だけに分けるすべての方法 */
function splitIntoMentsu(counts: number[], start = 0): Block[][] {
  let i = start
  while (i < TILE_KINDS && counts[i] === 0) i++
  if (i >= TILE_KINDS) return [[]]
  const result: Block[][] = []
  if (counts[i] >= 3) {
    counts[i] -= 3
    for (const rest of splitIntoMentsu(counts, i)) result.push([{ type: 'koutsu', kinds: [i, i, i] }, ...rest])
    counts[i] += 3
  }
  if (!isHonor(i) && rankOf(i) <= 7 && counts[i + 1] > 0 && counts[i + 2] > 0) {
    counts[i]--
    counts[i + 1]--
    counts[i + 2]--
    for (const rest of splitIntoMentsu(counts, i)) result.push([{ type: 'shuntsu', kinds: [i, i + 1, i + 2] }, ...rest])
    counts[i]++
    counts[i + 1]++
    counts[i + 2]++
  }
  return result
}

/** アガリの形(面子 + 雀頭)の分け方をすべて返す */
function agariDecompositions(counts: number[]): Block[][] {
  const result: Block[][] = []
  for (let k = 0; k < TILE_KINDS; k++) {
    if (counts[k] < 2) continue
    counts[k] -= 2
    for (const mentsu of splitIntoMentsu(counts)) result.push([{ type: 'pair', kinds: [k, k] }, ...mentsu])
    counts[k] += 2
  }
  return result
}

/** アガリ牌 k がこの塊に入っているとき、待ちの形とアガリ前の塊 */
function shapeOf(block: Block, k: number): { shape: WaitShape; waiting: number[] } | null {
  if (!block.kinds.includes(k)) return null
  const rest = [...block.kinds]
  rest.splice(rest.indexOf(k), 1)
  if (block.type === 'pair') return { shape: 'tanki', waiting: rest }
  if (block.type === 'koutsu') return { shape: 'shanpon', waiting: rest }
  const [a] = block.kinds
  if (k === a + 1) return { shape: 'kanchan', waiting: rest }
  // 12 で 3 待ち・89 で 7 待ちは辺張、それ以外は両面
  if ((k === a + 2 && rankOf(a) === 1) || (k === a && rankOf(a) === 7)) return { shape: 'penchan', waiting: rest }
  return { shape: 'ryanmen', waiting: rest }
}

const blockKey = (b: Block) => `${b.type}:${b.kinds.join(',')}`
const patternKey = (p: WaitPattern) => `${p.shape}|${p.waiting.join(',')}|${p.others.map(blockKey).sort().join(' ')}`

/** 牌 k を足したときの、通常の形の待ちの見方 */
function normalPatterns(counts: number[], k: number): WaitPattern[] {
  counts[k]++
  const decompositions = agariDecompositions(counts)
  counts[k]--
  const patterns: WaitPattern[] = []
  for (const blocks of decompositions) {
    blocks.forEach((block, i) => {
      const s = shapeOf(block, k)
      if (!s) return
      patterns.push({ ...s, others: blocks.filter((_, j) => j !== i) })
    })
  }
  return patterns
}

const YAOCHU = [0, 8, 9, 17, 18, 26, 27, 28, 29, 30, 31, 32, 33]

/** 七対子・国士無双の待ち(副露なしの13枚のときだけ) */
function specialPatterns(counts: number[], k: number): WaitPattern[] {
  const patterns: WaitPattern[] = []
  // 七対子: 対子6組と単騎。同じ牌4枚は2組と数えない
  const pairs = counts.map((n, i) => (n === 2 ? i : -1)).filter((i) => i >= 0)
  const singles = counts.map((n, i) => (n === 1 ? i : -1)).filter((i) => i >= 0)
  if (pairs.length === 6 && singles.length === 1 && singles[0] === k) {
    patterns.push({ shape: 'chiitoitsu', waiting: [k], others: pairs.map((p) => ({ type: 'pair', kinds: [p, p] })) })
  }
  // 国士無双: 么九牌13種のうち12種と対子1つ(1種待ち)、または13種1枚ずつ(13面待ち)
  if (YAOCHU.includes(k) && counts.every((n, i) => n === 0 || YAOCHU.includes(i))) {
    counts[k]++
    const complete = YAOCHU.every((y) => counts[y] >= 1) && YAOCHU.filter((y) => counts[y] === 2).length === 1
    counts[k]--
    if (complete) {
      const waiting: number[] = []
      YAOCHU.forEach((y) => {
        for (let n = 0; n < counts[y]; n++) waiting.push(y)
      })
      patterns.push({ shape: 'kokushi', waiting, others: [] })
    }
  }
  return patterns
}

/**
 * 待ちを調べる。hand は 3n+1 枚(13・10・7・4・1枚)。
 * melds には副露している牌を渡す(当たり牌を自分ですべて使っているかの判定に使う)。
 */
export function findWaits(hand: readonly Tile[], melds: readonly Tile[] = []): WaitsResult {
  const meldCount = meldCountFromTileCount(hand.length + 1)
  if (hand.length % 3 !== 1) throw new Error(`待ちは13枚(副露があれば10・7・4・1枚)の手牌で調べます: ${hand.length}枚`)
  const counts = tilesToCounts(hand)
  const used = tilesToCounts([...hand, ...melds])
  if (used.some((n) => n > 4)) throw new Error('同じ牌が5枚以上あります')

  const waits: WaitInfo[] = []
  const usedUp: number[] = []
  for (let k = 0; k < TILE_KINDS; k++) {
    const all = [...normalPatterns(counts, k), ...(meldCount === 0 && hand.length === 13 ? specialPatterns(counts, k) : [])]
    if (all.length === 0) continue
    // 当たり牌を自分の手牌・副露ですべて使っている(5枚目を待つ形を含む)なら待ちにしない
    if (used[k] >= 4) {
      usedUp.push(k)
      continue
    }
    const seen = new Set<string>()
    const patterns = all.filter((p) => {
      const key = patternKey(p)
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
    waits.push({ kind: k, patterns, shapes: [...new Set(patterns.map((p) => p.shape))] })
  }
  return { waits, usedUp, tenpai: waits.length > 0 }
}

/** 形式聴牌(役がなくても、待ちが1つ以上残っている)か。流局時のテンパイ判定に使う */
export function isFormalTenpai(hand: readonly Tile[], melds: readonly Tile[] = []): boolean {
  return findWaits(hand, melds).tenpai
}

/** 待ちの形の名前(複数あれば「・」でつなぐ) */
export function shapeLabels(shapes: readonly WaitShape[]): string {
  return shapes.map((s) => WAIT_SHAPE_LABELS[s]).join('・')
}
