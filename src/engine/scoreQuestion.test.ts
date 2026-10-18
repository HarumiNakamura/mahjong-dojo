import { describe, expect, it } from 'vitest'
import { createRng } from './random'
import {
  COMMON_YAKU,
  expectedPoints,
  fromScoreData,
  generateScoreQuestion,
  judgeScore,
  scoreKeyOf,
  SCORE_LEVELS,
} from './scoreQuestion'
import { checkTileSet } from './tiles'

describe('点数計算の問題作り', () => {
  for (const { id, label } of SCORE_LEVELS) {
    it(`${label}: アガれる手で、役満ではなく、牌の枚数も正しい`, () => {
      const rng = createRng(id.length)
      for (let i = 0; i < 30; i++) {
        const q = generateScoreQuestion(id, rng)
        expect(q.result.ok).toBe(true)
        expect(q.result.yakuman).toEqual([])
        expect(q.result.yaku.length).toBeGreaterThan(0)
        const all = [...q.hand, ...q.melds.flatMap((m) => m.tiles), ...(q.context.doraIndicators ?? []), ...(q.context.uraDoraIndicators ?? [])]
        expect(checkTileSet(all)).toEqual([])
        if (id === 'intermediate') expect(q.result.han).toBeLessThanOrEqual(4)
        // 初級の選択肢には正解の役がすべて入っている
        for (const y of q.result.yaku) expect(q.data.choices).toContain(y.name)
      }
    })
  }

  it('実戦に近い比率: 断么九・立直・平和・ドラがよく出て、珍しい役は少ない', () => {
    const rng = createRng(2024)
    const N = 300
    const count = new Map<string, number>()
    let ryanmen = 0
    let dora = 0
    for (let i = 0; i < N; i++) {
      const q = generateScoreQuestion('advanced', rng)
      for (const y of q.result.yaku) count.set(y.name, (count.get(y.name) ?? 0) + 1)
      if (q.result.wait === 'ryanmen') ryanmen++
      if (q.result.dora.length > 0) dora++
    }
    const rate = (name: string) => (count.get(name) ?? 0) / N
    expect(rate('断么九')).toBeGreaterThan(0.3)
    expect(rate('立直')).toBeGreaterThan(0.25)
    expect(rate('平和')).toBeGreaterThan(0.15)
    expect(ryanmen / N).toBeGreaterThan(0.5)
    expect(dora / N).toBeGreaterThan(0.25)
    // よく出る役以外(清一色・混老頭など)は合わせても少ない
    const rare = [...count.entries()].filter(([name]) => !COMMON_YAKU.includes(name)).reduce((s, [, n]) => s + n, 0)
    expect(rare / N).toBeLessThan(0.1)
  })
})

describe('判定', () => {
  const q = generateScoreQuestion('advanced', createRng(5))

  it('初級: 役をすべて選んだときだけ正解(順番は関係ない)', () => {
    const yaku = q.result.yaku.map((y) => y.name)
    expect(judgeScore(q, { yaku: [...yaku].reverse() })).toBe(true)
    expect(judgeScore(q, { yaku: yaku.slice(1) })).toBe(yaku.length === 0)
    expect(judgeScore(q, { yaku: [...yaku, yaku.includes('一気通貫') ? '三色同順' : '一気通貫'] })).toBe(false)
  })

  it('中級: 翻数と符の両方が合えば正解', () => {
    expect(judgeScore(q, { han: q.result.han, fu: q.result.fu })).toBe(true)
    expect(judgeScore(q, { han: q.result.han + 1, fu: q.result.fu })).toBe(false)
    expect(judgeScore(q, { han: q.result.han, fu: q.result.fu + 10 })).toBe(false)
  })

  it('上級: 点数(子のツモは子・親の支払い)が合えば正解', () => {
    const points = expectedPoints(q)
    expect(judgeScore(q, { points })).toBe(true)
    expect(judgeScore(q, { points: points.map((p) => p + 100) })).toBe(false)
  })

  it('答える点数の数: ロン・親のツモは1つ、子のツモは2つ', () => {
    const rng = createRng(8)
    for (let i = 0; i < 40; i++) {
      const x = generateScoreQuestion('advanced', rng)
      const n = expectedPoints(x).length
      if (!x.context.tsumo || x.context.seatWind === 1) expect(n).toBe(1)
      else expect(n).toBe(2)
    }
  })
})

describe('保存と復元', () => {
  it('保存した形から同じ問題・同じ点数に戻せる', () => {
    const rng = createRng(12)
    for (let i = 0; i < 10; i++) {
      const q = generateScoreQuestion('advanced', rng)
      const r = fromScoreData(JSON.parse(JSON.stringify(q.data)))
      expect(scoreKeyOf(r)).toBe(scoreKeyOf(q))
      expect(r.result.ok && r.result.points).toBe(q.result.points)
    }
  })

  it('形が正しくないデータはエラー', () => {
    expect(() => fromScoreData(null)).toThrow()
    expect(() => fromScoreData({ level: 'beginner' })).toThrow()
  })
})
