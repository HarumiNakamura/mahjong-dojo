import { describe, expect, it } from 'vitest'
import { createRng } from './random'
import { formatTiles, suitOf } from './tiles'
import {
  compareWaitsAnswer,
  fromWaitsData,
  generateWaitsQuestion,
  judgeWaits,
  toWaitsData,
  waitsKeyOf,
  WAITS_LEVELS,
} from './waitsQuestion'

describe('待ち当ての問題作り', () => {
  for (const { size, label, minWaits } of WAITS_LEVELS) {
    it(`${label}: ${size}枚・1色・待ちが${minWaits}種以上`, () => {
      const rng = createRng(size)
      for (let i = 0; i < 10; i++) {
        const q = generateWaitsQuestion(size, rng)
        expect(q.hand).toHaveLength(size)
        expect(new Set(q.hand.map((t) => suitOf(t.kind))).size).toBe(1)
        expect(q.result.waits.length).toBeGreaterThanOrEqual(minWaits)
        // 同じ牌は4枚まで
        expect(Math.max(...q.hand.map((t) => q.hand.filter((u) => u.kind === t.kind).length))).toBeLessThanOrEqual(4)
      }
    })
  }

  it('同じシードなら同じ問題', () => {
    const a = generateWaitsQuestion(13, createRng(5))
    const b = generateWaitsQuestion(13, createRng(5))
    expect(formatTiles(a.hand)).toBe(formatTiles(b.hand))
  })
})

describe('判定', () => {
  const q = fromWaitsData({ level: 4, hand: '1123m' })

  it('待ちをすべて選んだときだけ正解(順番は関係ない)', () => {
    expect(judgeWaits(q, [3, 0])).toBe(true)
    expect(judgeWaits(q, [0])).toBe(false)
    expect(judgeWaits(q, [0, 3, 4])).toBe(false)
    expect(judgeWaits(q, [])).toBe(false)
  })

  it('見落としと余分を返す', () => {
    expect(compareWaitsAnswer(q, [0, 4])).toEqual({ missed: [3], extra: [4] })
  })
})

describe('保存と復元', () => {
  it('保存した形から同じ問題に戻せる', () => {
    const q = generateWaitsQuestion(10, createRng(8))
    const r = fromWaitsData(JSON.parse(JSON.stringify(toWaitsData(q))))
    expect(waitsKeyOf(r)).toBe(waitsKeyOf(q))
    expect(r.result.waits.map((w) => w.kind)).toEqual(q.result.waits.map((w) => w.kind))
  })

  it('形が正しくないデータはエラー', () => {
    expect(() => fromWaitsData(null)).toThrow()
    expect(() => fromWaitsData({ level: 5, hand: '1234m' })).toThrow()
    expect(() => fromWaitsData({ level: 7, hand: '1234m' })).toThrow()
  })
})
