// 役満の責任払い(パオ)の点数の動き(Mリーグ公式ルール)
//
// - ツモは責任者が全額、ロンは放銃者と責任者で半分ずつ
// - 積み棒は鳴かせた人(責任者)が払う(ライブラリはロンのとき放銃者に払わせるので、ここで計算し直す)
// - 役満が複合したときは、責任払いは確定させた役満の分だけ。残りはふつうのツモ・ロンと同じ
// ライブラリ(@kobalab/majiang-core)の hule の結果を、src/game/rule.ts でこの計算に置きかえる。

export interface PaoInput {
  /** アガった人の席(0 = 親) */
  winner: number
  /** ロンなら放銃者の席、ツモなら null */
  ronFrom: number | null
  /** 責任者の席 */
  paoSeat: number
  /** 役満の数(複合した合計) */
  damanguan: number
  /** 責任払いの対象の役満の数 */
  paoDamanguan: number
  changbang: number
  lizhibang: number
}

const up100 = (n: number) => Math.ceil(n / 100) * 100

/** 席ごとの点数の動き(fenpei)と、アガリの点数(defen。本場・供託を含まない) */
export function paoPayment(p: PaoInput): { fenpei: number[]; defen: number } {
  const fenpei = [0, 0, 0, 0]
  const dealer = p.winner === 0
  const mul = dealer ? 6 : 4
  const base = 8000 * p.damanguan
  let paoBase = 8000 * Math.min(p.paoDamanguan, p.damanguan)
  if (p.ronFrom !== null) paoBase /= 2
  const rest = base - paoBase

  // 責任払いの分
  const paoDefen = paoBase * mul
  fenpei[p.winner] += paoDefen
  fenpei[p.paoSeat] -= paoDefen

  // 残りの分(ロンは放銃者、ツモはほかの3人)
  let restDefen = 0
  if (p.ronFrom !== null) {
    restDefen = up100(rest * mul)
    fenpei[p.ronFrom] -= restDefen
  } else if (rest > 0) {
    for (let l = 0; l < 4; l++) {
      if (l === p.winner) continue
      const pay = dealer || l === 0 ? up100(rest * 2) : up100(rest)
      fenpei[l] -= pay
      restDefen += pay
    }
  }
  fenpei[p.winner] += restDefen

  // 積み棒は責任者がまとめて払う。供託はアガった人へ
  fenpei[p.winner] += p.changbang * 300 + p.lizhibang * 1000
  fenpei[p.paoSeat] -= p.changbang * 300
  return { fenpei, defen: paoDefen + restDefen }
}

/** 責任者の席を、ライブラリの役の baojia(アガった人から見た '+' 下家・'=' 対面・'-' 上家)から求める */
export function paoSeatFromMark(winner: number, mark: string): number {
  return (winner + { '+': 1, '=': 2, '-': 3 }[mark as '+' | '=' | '-']) % 4
}

/** 責任者の席を、アガった人から見た印にする */
export function paoMark(winner: number, paoSeat: number): string {
  return ['', '+', '=', '-'][(paoSeat - winner + 4) % 4]
}

/** 面子の文字列(例: 'm5555+'・'z111=1')がカン(4枚)か */
export const isGangMianzi = (m: string) => m.replace(/[^\d]/g, '').length === 4

/** 大明槓(4枚の牌のあとに、鳴いた相手の印がつく)か */
export const isDaminggang = (m: string) => /^[mpsz]\d{4}[+=-]$/.test(m)

/**
 * 流局時のテンパイ判定で、待ち牌から外す牌か。
 * 手牌(副露を除く)と副露を合わせて4枚使っている牌は、ほかから出てこないので待ちにならない(Mリーグのルール)
 * concealed は手牌のその牌の枚数、fulou は副露の面子の文字列
 */
export function usesAllFour(tile: string, concealed: number, fulou: readonly string[]): boolean {
  const suit = tile[0]
  const n = tile[1]
  let count = concealed
  for (const m of fulou) {
    if (m[0] !== suit) continue
    for (const ch of m.slice(1)) if (ch === n || (n === '5' && ch === '0')) count++
  }
  return count >= 4
}
