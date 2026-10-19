// 手牌の中で、ある牌がどんな役割をしているか(孤立牌・嵌張・辺張・両面・対子・面子の一部)
//
// 手牌を面子・対子・ターツ・孤立牌に分ける方法を調べ、一番手が進んでいる分け方(面子が多く、
// 対子・ターツが多い分け方)で判断する。何切るの解説文で「切った牌の役割」を一言で添えるのに使う。

import { isHonor, rankOf, tileName, tilesToCounts, TILE_KINDS, type Tile } from './tiles'

export type RoleType = 'shuntsu' | 'kotsu' | 'toitsu' | 'ryanmen' | 'kanchan' | 'penchan' | 'isolated'

export interface TileGroup {
  type: RoleType
  /** 組の牌の種類(小さい順) */
  kinds: number[]
}

export interface TileRole extends TileGroup {
  /** ターツの待ち(両面は2種類、嵌張・辺張は1種類。それ以外は空) */
  waits: number[]
}

/** 役割の重さ(大きいほど手の中で大事)。同じ牌が複数の組にあるとき、切るのは一番軽い組の牌 */
const WEIGHT: Record<RoleType, number> = { shuntsu: 6, kotsu: 6, toitsu: 4, ryanmen: 3, kanchan: 2, penchan: 1, isolated: 0 }

const sameSuitNext = (k: number, d: number) => !isHonor(k) && rankOf(k) + d <= 9

/**
 * 手牌を組に分ける(一番手が進んでいる分け方)。
 * focus を渡すと、同じくらい進んでいる分け方の中から、その牌が一番軽い役割になる分け方を選ぶ
 */
export function splitHand(tiles: readonly Tile[], focus?: number): TileGroup[] {
  const counts = tilesToCounts(tiles)
  let best: { score: number; groups: TileGroup[] } = { score: -1, groups: [] }
  const groups: TileGroup[] = []

  const score = () => {
    const mentsu = groups.filter((g) => g.type === 'shuntsu' || g.type === 'kotsu').length
    const partial = groups.filter((g) => g.type === 'toitsu' || g.type === 'ryanmen' || g.type === 'kanchan' || g.type === 'penchan').length
    const hasPair = groups.some((g) => g.type === 'toitsu')
    // シャンテン数の考え方: 面子は2点、ターツ・対子は1点(面子と合わせて5組まで)。同点なら雀頭のある分け方
    const quality = groups.reduce((a, g) => a + WEIGHT[g.type], 0)
    const focusWeight = focus === undefined ? 0 : Math.min(...groups.filter((g) => g.kinds.includes(focus)).map((g) => WEIGHT[g.type]))
    return (mentsu * 2 + Math.min(partial, 5 - mentsu)) * 100000 + (hasPair ? 10000 : 0) - focusWeight * 100 + quality
  }

  const walk = (from: number) => {
    let k = from
    while (k < TILE_KINDS && counts[k] === 0) k++
    if (k >= TILE_KINDS) {
      const s = score()
      if (s > best.score) best = { score: s, groups: groups.map((g) => ({ ...g, kinds: [...g.kinds] })) }
      return
    }
    const take = (type: RoleType, kinds: number[]) => {
      for (const x of kinds) counts[x]--
      groups.push({ type, kinds })
      walk(k)
      groups.pop()
      for (const x of kinds) counts[x]++
    }
    if (counts[k] >= 3) take('kotsu', [k, k, k])
    if (sameSuitNext(k, 2) && counts[k + 1] > 0 && counts[k + 2] > 0) take('shuntsu', [k, k + 1, k + 2])
    if (counts[k] >= 2) take('toitsu', [k, k])
    if (sameSuitNext(k, 1) && counts[k + 1] > 0) take(rankOf(k) === 1 || rankOf(k) === 8 ? 'penchan' : 'ryanmen', [k, k + 1])
    if (sameSuitNext(k, 2) && counts[k + 2] > 0) take('kanchan', [k, k + 2])
    take('isolated', [k])
  }
  walk(0)
  return best.groups
}

function waitsOf(g: TileGroup): number[] {
  const [a, b] = g.kinds
  if (g.type === 'ryanmen') return [a - 1, b + 1]
  if (g.type === 'kanchan') return [a + 1]
  if (g.type === 'penchan') return rankOf(a) === 1 ? [b + 1] : [a - 1]
  return []
}

/** 手牌の中の、その種類の牌(1枚)の役割。同じ牌が複数あれば、切って一番損の少ない1枚の役割 */
export function tileRole(tiles: readonly Tile[], kind: number): TileRole {
  // 同じ牌が2枚以上あるときだけ、どの1枚が余りかを選ぶ
  const copies = tiles.filter((t) => t.kind === kind).length
  const groups = splitHand(tiles, copies >= 2 ? kind : undefined).filter((g) => g.kinds.includes(kind))
  const g = groups.sort((x, y) => WEIGHT[x.type] - WEIGHT[y.type])[0] ?? { type: 'isolated' as const, kinds: [kind] }
  return { ...g, waits: waitsOf(g) }
}

const name = (k: number) => tileName({ kind: k, red: false })
const names = (ks: readonly number[]) => ks.map(name).join('')

/** 役割の短い説明(例: 「9萬は7萬と組んで嵌張(8萬待ち)の候補」) */
export function describeRole(kind: number, role: TileRole): string {
  const t = name(kind)
  const partner = role.kinds.filter((k) => k !== kind)
  switch (role.type) {
    case 'isolated':
      return isHonor(kind) ? `${t}は孤立した字牌で、同じ牌が来ないと使えません` : `${t}は孤立牌で、ほかの牌とつながっていません`
    case 'ryanmen':
      return `${t}は${names(partner)}と組んで両面(${role.waits.map(name).join('・')}待ち)になっています`
    case 'kanchan':
      return `${t}は${names(partner)}と組んで嵌張(${name(role.waits[0])}待ち)の候補になっています`
    case 'penchan':
      return `${t}は${names(partner)}と組んで辺張(${name(role.waits[0])}待ち)の候補になっています`
    case 'toitsu':
      return `${t}は対子(同じ牌2枚)で、雀頭や刻子の候補です`
    case 'kotsu':
      return `${t}は刻子(${names(role.kinds)})の一部です`
    case 'shuntsu':
      return `${t}は面子(${names(role.kinds)})の一部です`
  }
}
