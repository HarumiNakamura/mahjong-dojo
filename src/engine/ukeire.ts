// 受け入れ枚数(有効牌の残り枚数)の計算
// 有効牌 = 引くとシャンテン数が進む牌。テンパイしているときは待ち牌(引くとアガリになる牌)。
// 残り枚数 = 4枚 − 自分の手牌 − 見えている牌(河・副露・ドラ表示牌)

import { calcShanten } from './shanten'
import { TILE_KINDS, tileName, tilesToCounts, type Tile } from './tiles'

export interface UkeireTile {
  /** 牌の種類(0〜33) */
  kind: number
  /** 残り枚数 */
  remaining: number
}

export interface UkeireResult {
  /** 今のシャンテン数 */
  shanten: number
  /** 有効牌(残り0枚の牌も含む。牌の種類順) */
  tiles: UkeireTile[]
  /** 受け入れ枚数(有効牌の残り枚数の合計) */
  total: number
  /** テンパイしているか(待ちを自分ですべて使っている形は含めない) */
  tenpai: boolean
  /** テンパイしているときの待ち牌(tiles と同じ)。テンパイでなければ null */
  waits: UkeireTile[] | null
}

export interface DiscardOption extends UkeireResult {
  /** 切る牌(赤5と普通の5があれば普通の5を切る) */
  tile: Tile
  /** 最善手の受け入れ枚数との差(最善手の枚数 − この打牌の枚数) */
  diff: number
  /** 最善手(シャンテン数が最小で、受け入れ枚数が最大) */
  best: boolean
  /** シャンテン戻し(切るとシャンテン数が今より悪くなる) */
  backward: boolean
}

export interface DiscardAnalysis {
  /** 打牌前(14枚)のシャンテン数 */
  shanten: number
  /** すでにアガリの形 */
  agari: boolean
  /** 打牌候補(シャンテン数が小さい順 → 受け入れ枚数が多い順 → 牌の種類順) */
  options: DiscardOption[]
}

/** 見えている牌を枚数配列にし、手牌と合わせて5枚以上にならないか確かめる */
function visibleCounts(handCounts: readonly number[], visible: readonly Tile[]): number[] {
  const seen = tilesToCounts(visible)
  for (let k = 0; k < TILE_KINDS; k++) {
    if (handCounts[k] + seen[k] > 4) {
      throw new Error(`${tileName({ kind: k, red: false })}が手牌と見えている牌で${handCounts[k] + seen[k]}枚あります(最大4枚)`)
    }
  }
  return seen
}

/**
 * 有効牌を調べる。
 * counts は 3n+1 枚の手牌、remainingBase は残り枚数を数えるときに使う手牌(打牌前の手牌)。
 */
function ukeireOf(counts: number[], remainingBase: readonly number[], seen: readonly number[]): UkeireResult {
  const shanten = calcShanten(counts).min
  const tiles: UkeireTile[] = []
  for (let k = 0; k < TILE_KINDS; k++) {
    // 自分で4枚持っている牌は引けない(当たり牌を自分ですべて使っている形はテンパイと認めない)
    if (counts[k] >= 4) continue
    counts[k]++
    const after = calcShanten(counts).min
    counts[k]--
    if (after < shanten) tiles.push({ kind: k, remaining: 4 - remainingBase[k] - seen[k] })
  }
  const total = tiles.reduce((sum, t) => sum + t.remaining, 0)
  // 形はテンパイでも、待ちを自分ですべて使っている(引ける待ちがない)ならノーテン(docs/rules.md 7章)
  const tenpai = shanten === 0 && tiles.length > 0
  return { shanten, tiles, total, tenpai, waits: tenpai ? tiles : null }
}

/** 3n+1 枚(13枚など)の手牌の受け入れを調べる。テンパイなら待ち牌と残り枚数がわかる。 */
export function calcUkeire(hand: readonly Tile[], visible: readonly Tile[] = []): UkeireResult {
  if (hand.length % 3 !== 1) throw new Error(`受け入れは13枚(副露があれば10・7・4・1枚)の手牌で調べます: ${hand.length}枚`)
  const base = tilesToCounts(hand)
  const seen = visibleCounts(base, visible)
  return ukeireOf([...base], base, seen)
}

/** 3n+2 枚(14枚など)の手牌について、打牌候補ごとの受け入れを調べる。 */
export function analyzeDiscards(hand: readonly Tile[], visible: readonly Tile[] = []): DiscardAnalysis {
  if (hand.length % 3 !== 2) throw new Error(`打牌候補は14枚(副露があれば11・8・5・2枚)の手牌で調べます: ${hand.length}枚`)
  const base = tilesToCounts(hand)
  const counts = [...base]
  const seen = visibleCounts(base, visible)
  const shanten = calcShanten(counts).min

  const options: DiscardOption[] = []
  for (let k = 0; k < TILE_KINDS; k++) {
    if (counts[k] === 0) continue
    // 赤5は残したいので、普通の5があればそちらを切る
    const tile = hand.find((t) => t.kind === k && !t.red) ?? hand.find((t) => t.kind === k)!
    counts[k]--
    const result = ukeireOf(counts, base, seen)
    counts[k]++
    options.push({ ...result, tile, diff: 0, best: false, backward: result.shanten > shanten })
  }

  options.sort((a, b) => a.shanten - b.shanten || b.total - a.total || a.tile.kind - b.tile.kind)
  const top = options[0]
  for (const o of options) {
    o.diff = top.total - o.total
    o.best = o.shanten === top.shanten && o.total === top.total
  }
  return { shanten, agari: shanten === -1, options }
}
