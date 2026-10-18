import { describe, expect, it } from 'vitest'
import { createRng } from './random'
import { calcShantenFromTiles } from './shanten'
import { fromPushFoldData, generatePushFoldQuestion, judgePushFold, MIN_DANGER, pushFoldKeyOf, toPushFoldData } from './pushfoldQuestion'

describe('押し引きジャッジの問題', () => {
  it('テンパイかイーシャンテンで、形を保つには危険な牌を切るしかない', () => {
    const verdicts = new Set<string>()
    for (let seed = 1; seed <= 8; seed++) {
      const q = generatePushFoldQuestion(createRng(seed))
      expect([0, 1]).toContain(calcShantenFromTiles(q.rest).min)
      expect(q.safety.danger).toBeGreaterThanOrEqual(MIN_DANGER)
      expect(q.result.diff).toBeTypeOf('number')
      verdicts.add(q.result.verdict)
      if (q.input.shanten === 0) expect(q.waits.length).toBeGreaterThan(0)
      // 正解の判定
      if (q.result.verdict === 'push') expect(judgePushFold(q, 'push') && !judgePushFold(q, 'fold')).toBe(true)
      if (q.result.verdict === 'fold') expect(judgePushFold(q, 'fold') && !judgePushFold(q, 'push')).toBe(true)
    }
    // 押しが正解の問題と降りが正解の問題の両方が出る
    expect(verdicts.has('push') || verdicts.has('either')).toBe(true)
    expect(verdicts.has('fold')).toBe(true)
  })

  it('保存した形から同じ問題を作り直せる', () => {
    const q = generatePushFoldQuestion(createRng(11))
    const r = fromPushFoldData(JSON.parse(JSON.stringify(toPushFoldData(q))))
    expect(pushFoldKeyOf(r)).toBe(pushFoldKeyOf(q))
    expect(r.result).toEqual(q.result)
    expect(() => fromPushFoldData({ discard: 'x' })).toThrow()
  })
})
