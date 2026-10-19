// CPU対戦の練習モードのヒント: 切る牌ごとの受け入れ枚数と、リーチ者に対する危険度

import type { Board, BoardModel } from '@kobalab/majiang-core'
import { judgeDiscards } from '../engine/efficiency'
import { closedTiles, dangerByKind, riichiOpponents, visibleTiles, type Scene } from '../review/scene'

export interface DiscardHint {
  kind: number
  /** 切ったあとのシャンテン数 */
  shanten: number
  /** 受け入れ枚数(テンパイなら待ちの残り枚数) */
  ukeire: number
  /** 一番よい打牌(牌効率) */
  best: boolean
  /** リーチ者に対する危険度(%)。リーチ者がいなければ null */
  danger: number | null
  /** 危険度の根拠(例: 「現物」「スジ」) */
  dangerLabel: string | null
}

/**
 * 自分の打牌の番のヒント(牌効率のよい順)。
 * model は自分から見た盤面、me は自分の座席、orders は河の牌が切られた順番(HumanPlayer が数える)
 */
export function discardHints(model: BoardModel, me: number, orders: number[][]): DiscardHint[] {
  const board = model as Board
  const scene: Scene = { board, me, turn: board.he[me]._pai.length + 1, orders }
  try {
    const j = judgeDiscards(closedTiles(board.shoupai[me]), visibleTiles(board))
    const dangers = riichiOpponents(scene).length ? dangerByKind(scene) : null
    return j.analysis.options.map((o) => {
      const d = dangers?.get(o.tile.kind) ?? null
      return {
        kind: o.tile.kind,
        shanten: o.shanten,
        ukeire: o.total,
        best: j.correctKinds.includes(o.tile.kind),
        danger: d ? d.danger : null,
        dangerLabel: d ? d.label : null,
      }
    })
  } catch {
    return []
  }
}
