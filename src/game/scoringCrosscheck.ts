// 点数の突き合わせ: 同じアガリを自前エンジン(scoring.ts)と majiang-core で計算して比べる

import Majiang from '@kobalab/majiang-core'
import type { ScoreQuestion } from '../engine/scoreQuestion'
import { toMianzi, toPai, toPaistr } from './convert'
import { MLEAGUE_RULE } from './rule'

export interface CrosscheckResult {
  ours: { han: number; fu: number; points: number; yakuman: number }
  theirs: { han: number; fu: number; points: number; yakuman: number } | null
  /** 点数・翻・符のどれかが違う */
  differs: boolean
  /** majiang-core に渡した手牌と状況(食い違いの記録用) */
  input: string
}

/** ScoreQuestion のアガリを majiang-core でも計算する */
export function crosscheck(q: ScoreQuestion): CrosscheckResult {
  const { hand, winTile, melds, context: c, result } = q
  const rest = [...hand]
  const i = rest.findIndex((t) => t.kind === winTile.kind && t.red === winTile.red)
  rest.splice(i, 1)
  const fulou = melds.map(toMianzi)
  const win = toPai(winTile)
  const paistr = (c.tsumo ? toPaistr(rest) + win[0] + win[1] : toPaistr(rest)) + fulou.map((m) => ',' + m).join('')
  const shoupai = Majiang.Shoupai.fromString(paistr)
  const param = Majiang.Util.hule_param({
    rule: MLEAGUE_RULE,
    zhuangfeng: c.roundWind - 1,
    menfeng: c.seatWind - 1,
    lizhi: c.doubleRiichi ? 2 : c.riichi ? 1 : 0,
    yifa: c.ippatsu === true,
    haidi: c.haitei ? 1 : c.houtei ? 2 : 0,
    lingshang: c.rinshan === true,
    qianggang: c.chankan === true,
    baopai: (c.doraIndicators ?? []).map(toPai),
    fubaopai: c.riichi || c.doubleRiichi ? (c.uraDoraIndicators ?? []).map(toPai) : null,
  })
  const r = Majiang.Util.hule(shoupai, c.tsumo ? null : `${win}-`, param)
  const ours = { han: result.han, fu: result.fu, points: result.points, yakuman: result.yakuman.length > 0 ? result.han || 1 : 0 }
  const theirs = r
    ? { han: r.fanshu ?? 0, fu: r.fu ?? 0, points: r.defen, yakuman: r.damanguan ?? 0 }
    : null
  const yakumanHand = result.yakuman.length > 0
  const differs =
    !theirs ||
    theirs.points !== ours.points ||
    (!yakumanHand && (theirs.han !== ours.han || theirs.fu !== ours.fu))
  return { ours, theirs, differs, input: `${paistr} ${c.tsumo ? 'ツモ' : 'ロン ' + win}` }
}
