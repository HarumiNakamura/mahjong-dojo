// CPU対戦のルール設定(@kobalab/majiang-core のルールを Mリーグ公式ルールに合わせる)
//
// 採用ルールの考え方は docs/rules.md、ライブラリで再現できない項目は docs/game-rules-gap.md。
// 最終成績(順位点・同点・南4局流局時のリーチ棒)は src/game/result.ts で自前に計算する。

import Majiang from '@kobalab/majiang-core'
import { RULES } from '../engine/rules'

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

// ライブラリは「ツモ番なしリーチあり」にすると、海底牌をツモった人(残り0枚)のリーチも認める。
// Mリーグでは海底をツモった人はリーチできないので、残り0枚のときはリーチ不可にする。
const originalAllowLizhi = Majiang.Game.allow_lizhi
let patched = false
export function applyMleaguePatches() {
  if (patched) return
  patched = true
  Majiang.Game.allow_lizhi = (rule, shoupai, p, paishu, defen) => {
    if (paishu === 0) return false
    return originalAllowLizhi.call(Majiang.Game, rule, shoupai, p, paishu, defen)
  }
}
applyMleaguePatches()
