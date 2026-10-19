// 振り返りで使う、牌譜の盤面(majiang-core の Board)からサイトの形式への変換

import Majiang, { type Board, type Shoupai } from '@kobalab/majiang-core'
import { assessForPlayer, type DefenseSituation } from '../engine/danger'
import { pointsFor } from '../engine/scoring'
import { doraFromIndicator } from '../engine/scoring'
import { isHonor, rankOf, tileName, tilesToCounts, type Tile } from '../engine/tiles'
import { fromPai, handView, meldView, riverTile } from '../game/convert'

/** 判断の場面(自分が打牌・鳴きをする直前など) */
export interface Scene {
  board: Board
  /** 自分の座席(その局の 0 = 親) */
  me: number
  /** 自分のツモの回数(巡目) */
  turn: number
  /** 各座席の河の牌が、局の何手目に切られたか */
  orders: number[][]
}

export const paiName = (p: string) => tileName(fromPai(p.slice(0, 2)))
export const kindName = (kind: number) => tileName({ kind, red: false })

/** 手の中の牌(副露を除く。ツモ牌を含む) */
export function closedTiles(shoupai: Shoupai): Tile[] {
  const v = handView(shoupai.toString())
  return v.drawn ? [...v.tiles, v.drawn] : v.tiles
}

/** 自分の手の外で見えている牌(河・全員の副露・ドラ表示牌)。鳴かれた河の牌は副露の側で数える */
export function visibleTiles(board: Board): Tile[] {
  const tiles: Tile[] = []
  for (let l = 0; l < 4; l++) {
    for (const p of board.he[l]._pai) {
      const t = riverTile(p)
      if (!t.called) tiles.push(t.tile)
    }
    for (const m of board.shoupai[l]._fulou) tiles.push(...meldView(m).tiles)
  }
  for (const p of board.shan.baopai) tiles.push(fromPai(p))
  return tiles
}

/** リーチしている他家の座席 */
export function riichiOpponents(scene: Scene): number[] {
  return [0, 1, 2, 3].filter((l) => l !== scene.me && scene.board.shoupai[l].lizhi)
}

/** 守備の判定(danger.ts)に渡す局面。座席は自分から見た位置(0 = 自分、1 = 下家 …) */
export function defenseSituation(scene: Scene): DefenseSituation {
  const { board, me } = scene
  const seatOf = (rel: number) => (me + rel) % 4
  const hand = closedTiles(board.shoupai[me])
  return {
    turn: scene.turn,
    doraIndicator: fromPai(board.shan.baopai[0]),
    dealerSeat: (4 - me) % 4,
    rivers: [0, 1, 2, 3].map((rel) =>
      board.he[seatOf(rel)]._pai.map((p, i) => ({ tile: riverTile(p).tile, order: scene.orders[seatOf(rel)][i] ?? 0 })),
    ),
    riichiIndex: [0, 1, 2, 3].map((rel) => {
      const i = board.he[seatOf(rel)]._pai.findIndex((p) => p.includes('*'))
      return rel !== 0 && board.shoupai[seatOf(rel)].lizhi && i >= 0 ? i : null
    }),
    myHand: hand.slice(0, -1),
    drawn: hand[hand.length - 1],
    hands: [[], [], [], []],
    wall: [],
    nextOrder: 0,
  }
}

/** リーチ者全員に対する、牌の種類ごとの危険度(%) */
export function dangerByKind(scene: Scene): Map<number, { danger: number; label: string }> {
  const s = defenseSituation(scene)
  const visible = tilesToCounts([...closedTiles(scene.board.shoupai[scene.me]), ...visibleTiles(scene.board)])
  const seats = riichiOpponents(scene).map((l) => (l - scene.me + 4) % 4)
  const result = new Map<number, { danger: number; label: string }>()
  for (const t of closedTiles(scene.board.shoupai[scene.me])) {
    if (result.has(t.kind)) continue
    const per = seats.map((seat) => assessForPlayer(s, seat, t.kind, visible))
    const safe = per.reduce((p, x) => p * (1 - x.danger / 100), 1)
    result.set(t.kind, { danger: Math.round((1 - safe) * 1000) / 10, label: per.map((x) => x.label).join('・') })
  }
  return result
}

const isSimple = (k: number) => !isHonor(k) && rankOf(k) >= 2 && rankOf(k) <= 8

/** 自分の手の打点の目安(ロン、30符)。リーチ(門前)・ドラ・赤・断么九・役牌の刻子から数える */
export function estimateValue(scene: Scene): number {
  const shoupai = scene.board.shoupai[scene.me]
  const tiles = [...closedTiles(shoupai), ...shoupai._fulou.flatMap((m) => meldView(m).tiles)]
  const counts = tilesToCounts(tiles)
  const doraKinds = scene.board.shan.baopai.map((p) => doraFromIndicator(fromPai(p).kind))
  const dora = tiles.filter((t) => doraKinds.includes(t.kind)).length + tiles.filter((t) => t.red).length
  const yakuhai = [31, 32, 33, 27 + scene.me, 27 + scene.board.zhuangfeng].filter((k, i, all) => all.indexOf(k) === i)
  const triples = yakuhai.filter((k) => counts[k] >= 3).length
  const tanyao = tiles.every((t) => isSimple(t.kind)) ? 1 : 0
  const han = Math.max(1, (shoupai.menqian ? 1 : 0) + dora + tanyao + triples)
  return pointsFor(han, 30, scene.me === 0).ron
}

/** テンパイしているときのアガリ牌(majiang-core の表記) */
export function hulepai(shoupai: Shoupai): string[] {
  return Majiang.Util.xiangting(shoupai) === 0 ? (Majiang.Util.tingpai(shoupai) ?? []) : []
}
