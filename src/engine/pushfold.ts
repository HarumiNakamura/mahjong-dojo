// 押し引きの概算モデル
//
// 押し(危険牌を切って勝負を続ける)と降り(安全な牌を切ってアガリをあきらめる)の期待値を比べる。
//   押しの期待値 ≒ 自分のアガリ率 × 自分の打点 − 放銃率 × 相手の打点 − 相手のツモ率 × (1 − 自分のアガリ率) × ツモの支払い
//   降りの期待値 ≒ − 相手のツモ率 × ツモの支払い
// 放銃率 = 1 − (1 − この牌の危険度) × (1 − この先押し続けたときの放銃率)
// 数値の目安は src/data/pushfold-table.ts、考え方は docs/pushfold.md。オーラス(順位の事情)は考えない。

import { PUSHFOLD_TABLE as T, turnBand } from '../data/pushfold-table'

export type HandShape = 'good' | 'bad'
export type OpponentKind = 'riichi' | 'call' | 'dama'

export interface PushFoldInput {
  /** 0 = テンパイ、1 = イーシャンテン */
  shanten: 0 | 1
  shape: HandShape
  /** テンパイなら待ち牌の残り枚数、イーシャンテンなら受け入れ枚数 */
  count: number
  turn: number
  /** 自分がアガったときの点数(ロン) */
  myValue: number
  iAmDealer: boolean
  opponent: { dealer: boolean; kind: OpponentKind }
  /** 切る牌の危険度(%) */
  tileDanger: number
}

export type PushFoldVerdict = 'push' | 'fold' | 'either'

export interface PushFoldResult {
  /** 押したときのアガリ率(0〜1) */
  winRate: number
  /** 押したときの放銃率(0〜1) */
  dealInRate: number
  opponentValue: number
  /** 降りたときに相手がツモアガリする率(0〜1) */
  opponentTsumoRate: number
  /** 相手のツモアガリで自分が払う点数 */
  tsumoCost: number
  pushEV: number
  foldEV: number
  /** 押しの期待値 − 降りの期待値 */
  diff: number
  verdict: PushFoldVerdict
  /** 一言ルール */
  rule: string
}

function countFactor(shanten: 0 | 1, count: number): number {
  const rows = shanten === 0 ? T.countFactor.tenpai : T.countFactor.iishanten
  return rows.find((r) => count >= r.min)!.factor
}

/** 相手のツモアガリで自分が払う割合(親は半分、子は4分の1。相手が親なら3分の1) */
function tsumoShare(iAmDealer: boolean, opponentDealer: boolean): number {
  if (opponentDealer) return 1 / 3
  return iAmDealer ? 1 / 2 : 1 / 4
}

export function evaluatePushFold(input: PushFoldInput): PushFoldResult {
  const band = turnBand(input.turn)
  const kind = input.shanten === 0 ? 'tenpai' : 'iishanten'
  const winRate = (T.winRate[kind][input.shape][band] / 100) * countFactor(input.shanten, input.count)
  const future = T.futureDealIn[kind][band] / 100
  const dealInRate = 1 - (1 - input.tileDanger / 100) * (1 - future)
  const opponentValue = T.opponentValue[input.opponent.kind][input.opponent.dealer ? 'dealer' : 'nonDealer']
  const opponentTsumoRate = T.opponentTsumo[band] / 100
  const tsumoCost = opponentValue * tsumoShare(input.iAmDealer, input.opponent.dealer)

  const pushEV = winRate * input.myValue - dealInRate * opponentValue - opponentTsumoRate * (1 - winRate) * tsumoCost
  const foldEV = -opponentTsumoRate * tsumoCost
  const diff = pushEV - foldEV
  const verdict: PushFoldVerdict = Math.abs(diff) < T.closeMargin ? 'either' : diff > 0 ? 'push' : 'fold'
  return {
    winRate,
    dealInRate,
    opponentValue,
    opponentTsumoRate,
    tsumoCost,
    pushEV: Math.round(pushEV),
    foldEV: Math.round(foldEV),
    diff: Math.round(diff),
    verdict,
    rule: ruleOfThumb(input, verdict),
  }
}

/** 状況に合った一言ルール */
export function ruleOfThumb(input: PushFoldInput, verdict: PushFoldVerdict): string {
  const high = input.myValue >= 7700
  if (input.shanten === 0) {
    if (input.shape === 'good') {
      if (verdict === 'fold') return '良形テンパイでも、安い手で親リーチの無スジは降りることがあります。'
      return '良形テンパイなら、無スジでも押すのが基本です。'
    }
    if (verdict === 'fold') return '愚形の安いテンパイは、危険な牌を切ってまで押さないのが基本です。'
    return high ? '愚形でも打点が高ければ押せます。' : '愚形テンパイでも、序盤や安全寄りの牌なら押せることがあります。'
  }
  if (verdict === 'fold') return 'イーシャンテンからの無スジ押しは、よほど高い手でなければ降りです。'
  return '良形で高いイーシャンテンなら、押せることがあります。'
}

/** 押し・降りの回答が正解か('either' はどちらも正解) */
export function isCorrectPushFold(verdict: PushFoldVerdict, answer: 'push' | 'fold'): boolean {
  return verdict === 'either' || verdict === answer
}
