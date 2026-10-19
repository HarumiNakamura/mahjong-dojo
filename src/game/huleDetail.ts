// CPU対戦のアガリを、自前の点数計算(scoring.ts)で計算し直して内訳を出す
//
// majiang-core の結果は翻・符・点数しか持たないので、符の内訳などは自前の計算で表示する。
// 2つの計算が一致することは scoringCrosscheck.test.ts で確かめている。

import { calculateScore, type Meld, type MeldType, type ScoreResult } from '../engine/scoring'
import type { Tile } from '../engine/tiles'
import { fromPai, handView } from './convert'

export interface HuleMessage {
  /** 座席(その局の 0 = 親) */
  l: number
  /** アガリの手(最後の1枚がアガリ牌。ロンは向きの印つき) */
  shoupai: string
  /** 放銃した座席(ツモは null) */
  baojia: number | null
  fubaopai: string[] | null
  hupai: { name: string; fanshu: number | string }[]
  fu?: number
  fanshu?: number
  damanguan?: number
  defen: number
  fenpei: number[]
}

/** majiang-core の面子の表記を、自前の副露にする */
export function meldFromMianzi(m: string): Meld {
  const suit = m[0]
  const digits = m.match(/\d/g) ?? []
  const tiles: Tile[] = digits.map((d) => fromPai(suit + d))
  let type: MeldType
  if (digits.length === 4) {
    if (!/[+=-]/.test(m)) type = 'ankan'
    else if (/[+=-]$/.test(m)) type = 'minkan'
    else type = 'kakan'
  } else {
    const plain = digits.map((d) => (d === '0' ? '5' : d))
    type = plain.every((d) => d === plain[0]) ? 'pon' : 'chi'
  }
  return { type, tiles }
}

/** アガリを自前の点数計算で計算する(計算できなければ null) */
export function huleDetail(h: HuleMessage, zhuangfeng: number, baopai: readonly string[]): ScoreResult | null {
  const view = handView(h.shoupai)
  if (!view.drawn) return null
  const [, ...fulou] = h.shoupai.split(',')
  const melds = fulou.filter(Boolean).map(meldFromMianzi)
  const names = new Set(h.hupai.map((y) => y.name))
  const result = calculateScore({
    hand: [...view.tiles, view.drawn],
    winTile: view.drawn,
    melds,
    context: {
      tsumo: h.baojia === null,
      roundWind: zhuangfeng + 1,
      seatWind: h.l + 1,
      riichi: names.has('立直'),
      doubleRiichi: names.has('ダブル立直'),
      ippatsu: names.has('一発'),
      haitei: names.has('海底摸月'),
      houtei: names.has('河底撈魚'),
      rinshan: names.has('嶺上開花'),
      chankan: names.has('槍槓') || names.has('搶槓'),
      tenhou: names.has('天和'),
      chiihou: names.has('地和'),
      doraIndicators: baopai.map(fromPai),
      uraDoraIndicators: (h.fubaopai ?? []).map(fromPai),
    },
  })
  return result.ok ? result : null
}
