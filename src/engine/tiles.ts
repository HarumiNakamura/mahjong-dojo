// 牌の表現
// 牌の種類は 0〜33 の番号(kind)で表す。
//   0〜8 = 1〜9萬, 9〜17 = 1〜9筒, 18〜26 = 1〜9索, 27〜33 = 東南西北白發中
// 文字列表記は "123m456p789s1122z"(字牌は 1z〜7z = 東南西北白發中、赤5は "0m" のように 0 で表す)。

import { RULES } from './rules'

export type Suit = 'm' | 'p' | 's' | 'z'

export interface Tile {
  /** 牌の種類(0〜33) */
  kind: number
  /** 赤ドラなら true(5萬・5筒・5索のみ) */
  red: boolean
}

export const TILE_KINDS = 34

const SUITS: readonly Suit[] = ['m', 'p', 's', 'z']
const SUIT_NAMES: Record<Suit, string> = { m: '萬', p: '筒', s: '索', z: '' }
export const HONOR_NAMES = ['東', '南', '西', '北', '白', '發', '中'] as const

/** 34種類すべての牌の番号 */
export const ALL_KINDS: readonly number[] = Array.from({ length: TILE_KINDS }, (_, i) => i)

export function suitOf(kind: number): Suit {
  return SUITS[Math.floor(kind / 9)]
}

/** 数牌は 1〜9、字牌は 1〜7(1z=東 … 7z=中) */
export function rankOf(kind: number): number {
  return (kind % 9) + 1
}

export function isHonor(kind: number): boolean {
  return kind >= 27
}

/** 種類と数字から牌の番号を求める。範囲外ならエラーを投げる。 */
export function kindOf(suit: Suit, rank: number): number {
  const max = suit === 'z' ? 7 : 9
  if (!Number.isInteger(rank) || rank < 1 || rank > max) {
    throw new Error(`牌の数字が範囲外です: ${rank}${suit}`)
  }
  return SUITS.indexOf(suit) * 9 + rank - 1
}

export function makeTile(suit: Suit, rank: number, red = false): Tile {
  if (red && (suit === 'z' || rank !== 5)) {
    throw new Error(`赤ドラは5萬・5筒・5索だけです: ${rank}${suit}`)
  }
  return { kind: kindOf(suit, rank), red }
}

/** 赤5(5萬・5筒・5索) */
export const RED_FIVES: readonly Tile[] = [makeTile('m', 5, true), makeTile('p', 5, true), makeTile('s', 5, true)]

/** "123m0p" のような文字列を牌の配列に変換する。空白は無視する。不正な表記ならエラーを投げる。 */
export function parseTiles(text: string): Tile[] {
  const tiles: Tile[] = []
  let digits: number[] = []
  for (const c of text) {
    if (/\s/.test(c)) continue
    if (c >= '0' && c <= '9') {
      digits.push(Number(c))
      continue
    }
    if (!(SUITS as readonly string[]).includes(c)) throw new Error(`不正な文字です: ${c}`)
    const suit = c as Suit
    if (digits.length === 0) throw new Error(`数字のない種類指定です: ${suit}`)
    for (const d of digits) {
      if (d === 0 && suit === 'z') throw new Error('字牌に赤(0)はありません: 0z')
      tiles.push(d === 0 ? makeTile(suit, 5, true) : makeTile(suit, d))
    }
    digits = []
  }
  if (digits.length > 0) throw new Error('末尾に種類(m/p/s/z)がありません')
  return tiles
}

/** 牌の配列を "123m0p" のような文字列にする。並び順はそのまま(続けて同じ種類なら1つにまとめる)。 */
export function formatTiles(tiles: readonly Tile[]): string {
  let out = ''
  let digits = ''
  let current: Suit | null = null
  for (const t of tiles) {
    const suit = suitOf(t.kind)
    if (current !== null && suit !== current) {
      out += digits + current
      digits = ''
    }
    current = suit
    digits += t.red ? '0' : String(rankOf(t.kind))
  }
  if (current !== null) out += digits + current
  return out
}

/** 手牌を種類ごとの枚数配列(34要素)にする。赤5は普通の5として数える。 */
export function tilesToCounts(tiles: readonly Tile[]): number[] {
  const counts = new Array<number>(TILE_KINDS).fill(0)
  for (const t of tiles) counts[t.kind]++
  return counts
}

/** 枚数配列(34要素)を牌の配列にする(赤5の情報は含まない)。 */
export function countsToTiles(counts: readonly number[]): Tile[] {
  if (counts.length !== TILE_KINDS) throw new Error(`枚数配列は${TILE_KINDS}要素です`)
  const tiles: Tile[] = []
  counts.forEach((n, kind) => {
    for (let i = 0; i < n; i++) tiles.push({ kind, red: false })
  })
  return tiles
}

/** 理牌の順番: 萬子→筒子→索子→字牌、数字の小さい順。同じ種類なら赤5を後ろにする。 */
export function compareTiles(a: Tile, b: Tile): number {
  return a.kind - b.kind || Number(a.red) - Number(b.red)
}

/** 理牌(並べ替え)した新しい配列を返す。 */
export function sortTiles(tiles: readonly Tile[]): Tile[] {
  return [...tiles].sort(compareTiles)
}

/** 牌の組み合わせとしてありえるかを調べ、問題点を日本語で返す(問題がなければ空配列)。 */
export function checkTileSet(tiles: readonly Tile[]): string[] {
  const errors: string[] = []
  tilesToCounts(tiles).forEach((n, kind) => {
    if (n > 4) errors.push(`${tileName({ kind, red: false })}が${n}枚あります(最大4枚)`)
  })
  for (const red of RED_FIVES) {
    const suit = suitOf(red.kind) as 'm' | 'p' | 's'
    const max = RULES.redFives[suit]
    const n = tiles.filter((t) => t.red && t.kind === red.kind).length
    if (n > max) errors.push(`${tileName(red)}が${n}枚あります(最大${max}枚)`)
  }
  return errors
}

export function tilesEqual(a: Tile, b: Tile): boolean {
  return a.kind === b.kind && a.red === b.red
}

/** 日本語の牌名(例: "3萬", "赤5筒", "東") */
export function tileName(tile: Tile): string {
  const suit = suitOf(tile.kind)
  const rank = rankOf(tile.kind)
  if (suit === 'z') return HONOR_NAMES[rank - 1]
  return `${tile.red ? '赤' : ''}${rank}${SUIT_NAMES[suit]}`
}
