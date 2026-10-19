// 半荘の最終成績(Mリーグ公式ルール。docs/rules.md 「最終成績」)
//
// - 南4局が流局で終わったときの供託(リーチ棒)はトップが取得。トップが同点なら按分し、端数は起家に近い人へ
// - ポイント =(持ち点 − 返し30,000点)÷ 1,000 + 順位点(+50/+10/−10/−30)
// - 同点は順位点を等分し、端数(0.1pt単位)は起家に近い人が多く受け取る
// majiang-core の終局処理は同点を起家に近い順に並べて順位点を分けないため、ここで自前に計算する。

import { RULES } from '../engine/rules'

export interface FinalResult {
  /** 座席ごとの最終持ち点(供託を加えたあと) */
  scores: number[]
  /** 座席ごとの順位(同点は同じ順位) */
  ranks: number[]
  /** 座席ごとのポイント(0.1pt 単位の値を 10 倍した整数。例: 523 = +52.3pt) */
  points10: number[]
}

/** 起家(qijia)に近い順(起家 → 下家 → …)の座席 */
const seatsFromDealer = (qijia: number) => [0, 1, 2, 3].map((i) => (qijia + i) % 4)

/** total を n 人で分ける(unit 単位。端数は前の人から1単位ずつ多く) */
function split(total: number, n: number, unit: number): number[] {
  const units = Math.round(total / unit)
  const base = Math.floor(units / n)
  const rest = units - base * n
  return Array.from({ length: n }, (_, i) => (base + (i < rest ? 1 : 0)) * unit)
}

/**
 * 最終成績を計算する。
 * @param scores 南4局終了時の持ち点(座席ごと。供託は含まない)
 * @param qijia 起家の座席
 * @param leftoverRiichiSticks 場に残っている供託の本数(南4局が流局で終わったとき)
 */
export function finalResult(scores: readonly number[], qijia: number, leftoverRiichiSticks = 0): FinalResult {
  const order = seatsFromDealer(qijia)
  const final = [...scores]

  // 供託はトップへ(同点トップは按分、端数は起家に近い人へ。100点単位)
  if (leftoverRiichiSticks > 0) {
    const top = Math.max(...final)
    const tops = order.filter((s) => final[s] === top)
    split(leftoverRiichiSticks * 1000, tops.length, 100).forEach((v, i) => (final[tops[i]] += v))
  }

  // 順位(同点は同じ順位。並びは点数の高い順、同点なら起家に近い順)
  const sorted = [...order].sort((a, b) => final[b] - final[a])
  const ranks = [0, 0, 0, 0]
  const umaOf = [0, 0, 0, 0]
  for (let i = 0; i < 4; ) {
    let j = i
    while (j + 1 < 4 && final[sorted[j + 1]] === final[sorted[i]]) j++
    const group = sorted.slice(i, j + 1)
    const umaSum = RULES.uma.slice(i, j + 1).reduce((a, b) => a + b, 0)
    split(umaSum, group.length, 100).forEach((v, k) => {
      ranks[group[k]] = i + 1
      umaOf[group[k]] = v
    })
    i = j + 1
  }

  const points10 = final.map((sc, seat) => (sc - RULES.returnPoints + umaOf[seat]) / 100)
  return { scores: final, ranks, points10 }
}

/** ポイントを「+52.3」のような文字列にする */
export function formatPoints(points10: number): string {
  const v = (points10 / 10).toFixed(1)
  return points10 > 0 ? `+${v}` : v
}
