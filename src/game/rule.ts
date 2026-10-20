// CPU対戦のルール設定(@kobalab/majiang-core のルールを Mリーグ公式ルールに合わせる)
//
// 採用ルールの考え方は docs/rules.md、ライブラリで再現できない項目は docs/game-rules-gap.md。
// 最終成績(順位点・同点・南4局流局時のリーチ棒)は src/game/result.ts で自前に計算する。

import Majiang from '@kobalab/majiang-core'
import { RULES } from '../engine/rules'
import { isDaminggang, paoMark, paoPayment, paoSeatFromMark, usesAllFour } from './pao'

export const MLEAGUE_RULE = Majiang.rule({
  配給原点: RULES.startingPoints,
  // 順位点はライブラリの計算を使わず result.ts で計算する(ライブラリの値は表示しない)
  順位点: ['20.0', '10.0', '-10.0', '-20.0'],
  連風牌は2符: true,
  赤牌: { m: 1, p: 1, s: 1 },
  クイタンあり: true,
  喰い替え許可レベル: 0,
  場数: 2,
  途中流局あり: false,
  流し満貫あり: false,
  ノーテン宣言あり: false,
  ノーテン罰あり: true,
  最大同時和了数: 1,
  連荘方式: 2,
  トビ終了あり: false,
  オーラス止めあり: false,
  延長戦方式: 0,
  一発あり: true,
  裏ドラあり: true,
  カンドラあり: true,
  カン裏あり: true,
  カンドラ後乗せ: false,
  ツモ番なしリーチあり: true,
  リーチ後暗槓許可レベル: 1,
  役満の複合あり: true,
  ダブル役満あり: false,
  数え役満あり: false,
  役満パオあり: true,
  切り上げ満貫あり: true,
})

// ライブラリの動きを Mリーグに合わせる補正(docs/game-rules-gap.md の 3)
// - 海底牌をツモった人(残り0枚)はリーチできない(ライブラリは「ツモ番なしリーチあり」にすると認める)
// - 四槓子の4つ目を大明槓させた人も責任払い(ライブラリは大三元・大四喜だけ)
// - 責任払いのロンでも、積み棒は鳴かせた人が払う(ライブラリは放銃者が払う)
// - 流局時、副露も含めて4枚使っている当たり牌はノーテン(ライブラリは手牌の4枚だけを見る)

// ライブラリの内部(型定義にないメンバー)を補正するので any を使う
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyGame = any

/** 四槓子の責任者(席ごと。4つ目のカンが大明槓のときだけ、鳴かせた人の席) */
const SIGANGZI_BAO = Symbol('sigangziBao')
/** いま計算しているアガリの対局の、四槓子の責任者(Game.hule の中だけ) */
let huleSigangziBao: (number | undefined)[] | null = null

const originalAllowLizhi = Majiang.Game.allow_lizhi
const originalHule = Majiang.Util.hule
const originalTingpai = Majiang.Util.tingpai
const proto = Majiang.Game.prototype as AnyGame
const originalQipai = proto.qipai
const originalFulou = proto.fulou
const originalGameHule = proto.hule
const originalPingju = proto.pingju

/** 流局時のテンパイ判定用の待ち牌(副露も含めて4枚使っている牌を除く) */
export function pingjuTingpai(shoupai: AnyGame): string[] | null {
  const pai = originalTingpai(shoupai)
  if (!pai) return pai
  return pai.filter((p: string) => !usesAllFour(p, shoupai._bingpai[p[0]][Number(p[1])], shoupai._fulou))
}

/**
 * アガリの点数に責任払いを反映する。大三元・大四喜はライブラリの役の印(baojia)、
 * 四槓子は対局中に記録した責任者(sigangziPaoSeat。4つ目のカンを大明槓させた人)を使う
 */
export function huleWithPao(shoupai: AnyGame, rongpai: string | null, param: AnyGame, sigangziPaoSeat?: number) {
  const result = originalHule(shoupai, rongpai, param)
  if (!result?.damanguan || !result.hupai) return result
  const winner: number = param.menfeng
  let pao: AnyGame = result.hupai.find((h: AnyGame) => h.baojia)
  if (!pao && sigangziPaoSeat !== undefined) {
    pao = result.hupai.find((h: AnyGame) => h.name === '四槓子')
    if (pao) pao.baojia = paoMark(winner, sigangziPaoSeat)
  }
  if (!pao) return result
  const { fenpei, defen } = paoPayment({
    winner,
    ronFrom: rongpai ? paoSeatFromMark(winner, rongpai.slice(-1)) : null,
    paoSeat: paoSeatFromMark(winner, pao.baojia),
    damanguan: result.damanguan,
    paoDamanguan: pao.fanshu.length,
    changbang: param.jicun.changbang,
    lizhibang: param.jicun.lizhibang,
  })
  return { ...result, fenpei, defen }
}

/** 対局で記録した、その席の四槓子の責任者(いなければ undefined) */
export const sigangziPaoSeat = (game: AnyGame, seat: number): number | undefined => game[SIGANGZI_BAO]?.[seat]

let patched = false
export function applyMleaguePatches() {
  if (patched) return
  patched = true
  Majiang.Game.allow_lizhi = (rule, shoupai, p, paishu, defen) => {
    if (paishu === 0) return false
    return originalAllowLizhi.call(Majiang.Game, rule, shoupai, p, paishu, defen)
  }
  Majiang.Util.hule = (shoupai, rongpai, param) => {
    // 対局のアガリの計算(Game.hule の中の1回目)だけに、四槓子の責任者を使う
    const bao = huleSigangziBao
    huleSigangziBao = null
    return huleWithPao(shoupai, rongpai, param, bao?.[param.menfeng])
  }
  proto.qipai = function (this: AnyGame, ...args: unknown[]) {
    this[SIGANGZI_BAO] = []
    return originalQipai.apply(this, args)
  }
  proto.fulou = function (this: AnyGame, fulou: string) {
    const from = this._model.lunban
    const r = originalFulou.call(this, fulou)
    const l = this._model.lunban
    if (isDaminggang(fulou) && this._n_gang[l] === 4) (this[SIGANGZI_BAO] ??= [])[l] = from
    return r
  }
  proto.hule = function (this: AnyGame, ...args: unknown[]) {
    huleSigangziBao = this[SIGANGZI_BAO] ?? []
    try {
      return originalGameHule.apply(this, args)
    } finally {
      huleSigangziBao = null
    }
  }
  proto.pingju = function (this: AnyGame, ...args: unknown[]) {
    Majiang.Util.tingpai = pingjuTingpai
    try {
      return originalPingju.apply(this, args)
    } finally {
      Majiang.Util.tingpai = originalTingpai
    }
  }
}
applyMleaguePatches()
