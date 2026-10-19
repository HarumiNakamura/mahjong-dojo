import { describe, expect, it } from 'vitest'
import { finalResult, formatPoints } from './result'

describe('半荘の最終成績(Mリーグ)', () => {
  it('ポイント =(持ち点 − 30,000)÷ 1,000 + 順位点。4人の合計は0', () => {
    const r = finalResult([42300, 31500, 18700, 7500], 0)
    expect(r.ranks).toEqual([1, 2, 3, 4])
    expect(r.points10).toEqual([623, 115, -213, -525])
    expect(r.points10.reduce((a, b) => a + b, 0)).toBe(0)
    expect(formatPoints(623)).toBe('+62.3')
    expect(formatPoints(-525)).toBe('-52.5')
  })

  it('同点は順位点を等分する(2位と3位が同点なら 0pt ずつ)', () => {
    const r = finalResult([40000, 25000, 25000, 10000], 0)
    expect(r.ranks).toEqual([1, 2, 2, 4])
    expect(r.points10).toEqual([600, -50, -50, -500])
  })

  it('等分の端数は起家に近い人が多く受け取る', () => {
    // 1〜3位が同点: (50 + 10 − 10) ÷ 3 = 16.666… → 起家に近い2人が 16.7、残り1人が 16.6
    const r = finalResult([30000, 30000, 30000, 10000], 2)
    // 起家は座席2。起家に近い順は 2 → 3 → 0 → 1
    expect(r.points10[2]).toBe(167)
    expect(r.points10[0]).toBe(167)
    expect(r.points10[1]).toBe(166)
    expect(r.points10[3]).toBe(-500)
    expect(r.points10.reduce((a, b) => a + b, 0)).toBe(0)
  })

  it('南4局流局時の供託はトップが取得。同点トップは按分(端数は起家に近い人へ)', () => {
    const single = finalResult([35000, 30000, 20000, 13000], 0, 2)
    expect(single.scores).toEqual([37000, 30000, 20000, 13000])
    const tie = finalResult([33000, 33000, 20000, 13000], 1, 1)
    // 1,000点を2人で 500 ずつ
    expect(tie.scores[0]).toBe(33500)
    expect(tie.scores[1]).toBe(33500)
    const tie3 = finalResult([30000, 30000, 30000, 9000], 0, 1)
    // 1,000点を3人で 400・300・300(起家に近い人が多く)
    expect(tie3.scores).toEqual([30400, 30300, 30300, 9000])
  })
})
