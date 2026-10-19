// 牌譜の場面を、何切るドリルの問題にする(振り返りの分かれ目を何切るの復習リストに入れるため)

import type { Paipu } from '@kobalab/majiang-core'
import { judgeDiscards } from '../engine/efficiency'
import { fromQuestionData, toQuestionData, type EfficiencyQuestion } from '../engine/efficiencyQuestion'
import { difficultyForShanten } from '../engine/solo'
import { sortTiles } from '../engine/tiles'
import { fromPai, handView, riverTile } from '../game/convert'
import { boardAt } from '../game/replay'

/**
 * その場面(自分がツモって打牌する直前)の何切る問題。
 * 門前で14枚あるときだけ作れる(鳴いている手・ツモ前の場面は null)。
 */
export function efficiencyQuestionAt(paipu: Paipu, kyoku: number, step: number, playerId = 0): EfficiencyQuestion | null {
  const board = boardAt(paipu, { kyoku, step })
  const me = board.menfeng(playerId)
  const shoupai = board.shoupai[me]
  if (!shoupai.menqian || shoupai.lizhi) return null
  const v = handView(shoupai.toString())
  if (!v.drawn || v.tiles.length !== 13) return null
  const river = (l: number) => board.he[l]._pai.map((p) => riverTile(p).tile)
  const ownDiscards = river(me)
  const otherDiscards = [1, 2, 3].map((d) => river((me + d) % 4)) as EfficiencyQuestion['otherDiscards']
  const doraIndicator = fromPai(board.shan.baopai[0])
  const visible = [doraIndicator, ...ownDiscards, ...otherDiscards.flat()]
  try {
    const judgement = judgeDiscards([...v.tiles, v.drawn], visible)
    const q: EfficiencyQuestion = {
      difficulty: difficultyForShanten(judgement.analysis.shanten),
      turn: ownDiscards.length + 1,
      hand: sortTiles(v.tiles),
      drawn: v.drawn,
      doraIndicator,
      ownDiscards,
      otherDiscards,
      visible,
      judgement,
    }
    // 保存した形から作り直せることを確かめる(学習記録の解き直しで使うため)
    fromQuestionData(toQuestionData(q))
    return q
  } catch {
    return null
  }
}
