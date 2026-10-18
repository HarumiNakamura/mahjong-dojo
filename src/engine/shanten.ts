// シャンテン数(あと何枚でテンパイか)の計算
// -1 = アガリ、0 = テンパイ、1 = 1シャンテン …
//
// 通常手は「面子(メンツ)・搭子(ターツ)・雀頭」の数から求める:
//   シャンテン数 = 2 × 必要な面子数 − 2 × 面子 − 搭子 − 雀頭
//   (面子 + 搭子 は必要な面子数まで。副露がある分だけ必要な面子数が減る)
// 萬子・筒子・索子・字牌は互いに面子を作れないので、種類ごとに計算して組み合わせる。

import { TILE_KINDS, tilesToCounts, type Tile } from './tiles'

export interface ShantenResult {
  /** 通常手(4面子1雀頭)のシャンテン数 */
  normal: number
  /** 七対子のシャンテン数(副露がある場合は Infinity) */
  chiitoitsu: number
  /** 国士無双のシャンテン数(副露がある場合は Infinity) */
  kokushi: number
  /** 3つのうち最小の値 */
  min: number
  /** 手牌の枚数から求めた副露の数 */
  melds: number
}

/** 種類ごとに作れる (面子数, 搭子数) の組。どちらも多いほうがよい。 */
type Block = [mentsu: number, taatsu: number]

/** 手牌の枚数から副露の数を求める(13・14枚なら0、10・11枚なら1 …)。ありえない枚数ならエラー。 */
export function meldCountFromTileCount(n: number): number {
  if (!Number.isInteger(n) || n < 1 || n > 14 || n % 3 === 0) {
    throw new Error(`手牌の枚数が正しくありません: ${n}枚(1・2・4・5・7・8・10・11・13・14枚のどれか)`)
  }
  return Math.floor((14 - n) / 3)
}

// ---- 種類ごとの計算 ----

/** 他の組に完全に負ける組を除く */
function prune(blocks: Block[]): Block[] {
  const result: Block[] = []
  for (const b of blocks) {
    if (blocks.some((o) => o !== b && o[0] >= b[0] && o[1] >= b[1] && (o[0] > b[0] || o[1] > b[1]))) continue
    if (result.some((r) => r[0] === b[0] && r[1] === b[1])) continue
    result.push(b)
  }
  return result
}

const searchMemo = new Map<string, Block[]>()

/** blocks の各組に (dm, dt) を足して target に加える */
function addAll(target: Block[], blocks: Block[], dm: number, dt: number) {
  for (const [m, t] of blocks) target.push([m + dm, t + dt])
}

/**
 * 1種類(数牌9種または字牌7種)の枚数から、作れる (面子, 搭子) の組をすべて調べる。
 * 一番小さい牌から順に「何に使うか」を決めていき、途中の結果は記憶して使い回す。
 */
function searchBlocks(c: number[], honor: boolean): Block[] {
  let i = 0
  while (i < c.length && c[i] === 0) i++
  if (i >= c.length) return [[0, 0]]
  const key = (honor ? 'z' : 'n') + c.join('')
  const hit = searchMemo.get(key)
  if (hit) return hit

  const found: Block[] = []
  const take = (idx: number[], dm: number, dt: number) => {
    for (const j of idx) c[j]--
    addAll(found, searchBlocks(c, honor), dm, dt)
    for (const j of idx) c[j]++
  }
  const has = (j: number) => !honor && j < c.length && c[j] > 0
  // 刻子
  if (c[i] >= 3) take([i, i, i], 1, 0)
  // 順子
  if (has(i + 1) && has(i + 2)) take([i, i + 1, i + 2], 1, 0)
  // 対子(搭子として)
  if (c[i] >= 2) take([i, i], 0, 1)
  // 両面・辺張
  if (has(i + 1)) take([i, i + 1], 0, 1)
  // 嵌張
  if (has(i + 2)) take([i, i + 2], 0, 1)
  // この牌は使わない(孤立牌)
  take([i], 0, 0)

  const result = prune(found)
  searchMemo.set(key, result)
  return result
}

interface SuitBlocks {
  /** 雀頭なし */
  noPair: Block[]
  /** この種類から雀頭を1つ取った場合 */
  withPair: Block[]
}

const cache = new Map<string, SuitBlocks>()

function suitBlocks(c: number[], honor: boolean): SuitBlocks {
  const key = (honor ? 'z' : 'n') + c.join('')
  const hit = cache.get(key)
  if (hit) return hit
  const withPair: Block[] = []
  for (let i = 0; i < c.length; i++) {
    if (c[i] >= 2) {
      c[i] -= 2
      withPair.push(...searchBlocks(c, honor))
      c[i] += 2
    }
  }
  const value = { noPair: searchBlocks(c, honor), withPair: prune(withPair) }
  cache.set(key, value)
  return value
}

// ---- 各形のシャンテン数 ----

/** 通常手のシャンテン数 */
function normalShanten(counts: readonly number[], melds: number): number {
  const need = 4 - melds
  // 状態 = [面子, 搭子, 雀頭の有無]
  let states: [number, number, number][] = [[0, 0, 0]]
  for (let s = 0; s < 4; s++) {
    const honor = s === 3
    const part = counts.slice(s * 9, s * 9 + (honor ? 7 : 9))
    const { noPair, withPair } = suitBlocks(part, honor)
    const next: [number, number, number][] = []
    for (const [m, t, p] of states) {
      for (const [bm, bt] of noPair) next.push([m + bm, t + bt, p])
      if (p === 0) for (const [bm, bt] of withPair) next.push([m + bm, t + bt, 1])
    }
    // 同じ雀頭有無の中で負けている状態を除く
    states = next.filter(
      (a) =>
        !next.some(
          (b) => b !== a && b[2] === a[2] && b[0] >= a[0] && b[1] >= a[1] && (b[0] > a[0] || b[1] > a[1]),
        ),
    )
  }
  let best = Infinity
  for (const [m, t, p] of states) {
    const mm = Math.min(m, need)
    const tt = Math.min(t, need - mm)
    best = Math.min(best, 2 * need - 2 * mm - tt - p)
  }
  return best
}

/** 七対子のシャンテン数(同じ牌4枚は2組の対子にならない) */
function chiitoitsuShanten(counts: readonly number[]): number {
  let pairs = 0
  let kinds = 0
  for (const n of counts) {
    if (n >= 1) kinds++
    if (n >= 2) pairs++
  }
  return 6 - pairs + Math.max(0, 7 - kinds)
}

const YAOCHU = [0, 8, 9, 17, 18, 26, 27, 28, 29, 30, 31, 32, 33]

/** 国士無双のシャンテン数 */
function kokushiShanten(counts: readonly number[]): number {
  let kinds = 0
  let pair = 0
  for (const k of YAOCHU) {
    if (counts[k] >= 1) kinds++
    if (counts[k] >= 2) pair = 1
  }
  return 13 - kinds - pair
}

/** 枚数配列(34要素)からシャンテン数を求める。手牌の枚数から副露の数を判断する。 */
export function calcShanten(counts: readonly number[]): ShantenResult {
  if (counts.length !== TILE_KINDS) throw new Error(`枚数配列は${TILE_KINDS}要素です`)
  let total = 0
  for (const n of counts) {
    if (!Number.isInteger(n) || n < 0 || n > 4) throw new Error(`牌の枚数が正しくありません: ${n}`)
    total += n
  }
  const melds = meldCountFromTileCount(total)
  const normal = normalShanten(counts, melds)
  const chiitoitsu = melds === 0 ? chiitoitsuShanten(counts) : Infinity
  const kokushi = melds === 0 ? kokushiShanten(counts) : Infinity
  return { normal, chiitoitsu, kokushi, min: Math.min(normal, chiitoitsu, kokushi), melds }
}

/** 牌の配列からシャンテン数を求める(赤5は普通の5として扱う)。 */
export function calcShantenFromTiles(tiles: readonly Tile[]): ShantenResult {
  return calcShanten(tilesToCounts(tiles))
}
