import { describe, expect, it } from 'vitest'
import { dailyDoneCount, dailyItems } from './daily'

describe('今日の練習', () => {
  it('日付で同じ5問が作られ、答えた数を数えられる', () => {
    const a = dailyItems('2026-10-18')
    const b = dailyItems('2026-10-18')
    expect(a).toHaveLength(5)
    expect(a.map((x) => x.key)).toEqual(b.map((x) => x.key))
    const attempts = [a[0], a[2]].map((x, i) => ({
      id: String(i),
      drill: x.definition.id,
      questionKey: x.key,
      question: null,
      answer: null,
      correct: true,
      answeredAt: new Date('2026-10-18T10:00:00').toISOString(),
    }))
    expect(dailyDoneCount(a, attempts, '2026-10-18')).toBe(2)
    expect(dailyDoneCount(a, attempts, '2026-10-19')).toBe(0)
    expect(dailyDoneCount(a, [], '2026-10-18')).toBe(0)
  }, 30000)
})
