import { describe, expect, it } from 'vitest'
import { situationFromData, situationToData } from './danger'
import { createRng } from './random'
import {
  fromSafetyData,
  generateSafetyQuestion,
  judgeSafety,
  orderMarks,
  safestKinds,
  safetyKeyOf,
  toSafetyData,
} from './safetyQuestion'

describe('安パイ並べの問題', () => {
  it('段階ごとの条件を満たす', () => {
    for (let seed = 1; seed <= 5; seed++) {
      const b = generateSafetyQuestion('beginner', 'order', createRng(seed))
      expect(b.assessments.some((a) => a.perPlayer[0].category === 'genbutsu')).toBe(true)
      const m = generateSafetyQuestion('intermediate', 'order', createRng(seed))
      expect(m.assessments.filter((a) => a.perPlayer[0].category === 'genbutsu').length).toBeLessThanOrEqual(1)
      const a = generateSafetyQuestion('advanced', 'pick', createRng(seed))
      expect(a.assessments[0].perPlayer).toHaveLength(2)
      expect(b.tiles).toHaveLength(14)
    }
  })

  it('安全な順に並べれば正解、同じ危険度の中の順番は問わない', () => {
    const q = generateSafetyQuestion('beginner', 'order', createRng(3))
    const correct = [...q.tiles].sort((x, y) => q.groups.get(x.kind)! - q.groups.get(y.kind)!).map((t) => t.kind)
    expect(judgeSafety(q, correct)).toBe(true)
    // 同じグループ内を逆にしても正解
    const reversed = [...q.tiles]
      .sort((x, y) => q.groups.get(x.kind)! - q.groups.get(y.kind)! || y.kind - x.kind)
      .map((t) => t.kind)
    expect(judgeSafety(q, reversed)).toBe(true)
    // 一番安全な牌と一番危険な牌を入れ替えると不正解
    const wrong = [...correct]
    ;[wrong[0], wrong[13]] = [wrong[13], wrong[0]]
    expect(judgeSafety(q, wrong)).toBe(false)
    expect(orderMarks(q, wrong)[0]).toBe(false)
    expect(orderMarks(q, correct).every(Boolean)).toBe(true)
    // 手牌と違う牌が入っていれば不正解
    expect(judgeSafety(q, correct.slice(0, 13))).toBe(false)
  })

  it('かんたんモードは一番安全な牌を選べば正解', () => {
    const q = generateSafetyQuestion('beginner', 'pick', createRng(5))
    const safest = safestKinds(q)
    expect(judgeSafety(q, [safest[0]])).toBe(true)
    const worst = q.assessments[q.assessments.length - 1].kind
    expect(judgeSafety(q, [worst])).toBe(false)
  })

  it('保存した形から同じ問題を作り直せる', () => {
    const q = generateSafetyQuestion('advanced', 'order', createRng(8))
    const data = JSON.parse(JSON.stringify(toSafetyData(q)))
    const r = fromSafetyData(data)
    expect(safetyKeyOf(r)).toBe(safetyKeyOf(q))
    expect(r.assessments.map((a) => [a.kind, a.danger])).toEqual(q.assessments.map((a) => [a.kind, a.danger]))
    // 河の通し番号も元どおり
    expect(situationFromData(situationToData(q.situation)).rivers).toEqual(q.situation.rivers)
    expect(() => fromSafetyData({ level: 'beginner', mode: 'order', situation: { turn: 1 } })).toThrow()
  })
})

describe('並べた順の印', () => {
  it('1枚だけ動かし間違えたら、その牌だけが ×', () => {
    const q = generateSafetyQuestion('beginner', 'order', createRng(3))
    const correct = [...q.tiles].sort((x, y) => q.groups.get(x.kind)! - q.groups.get(y.kind)!).map((t) => t.kind)
    // 一番危険な牌を先頭に動かす
    const moved = [correct[13], ...correct.slice(0, 13)]
    const marks = orderMarks(q, moved)
    expect(marks.filter((m) => !m)).toHaveLength(1)
    expect(marks[0]).toBe(false)
    expect(judgeSafety(q, moved)).toBe(false)
  })
})
