import { describe, expect, it } from 'vitest'
import { decodeShareData } from '../app/share'
import { makeBetaoriQuestion } from '../engine/betaoriQuestion'
import { dailyItems } from './daily'
import { DRILLS, findDrill } from './registry'
import { shareFor } from './useDrillRecorder'

describe('どのドリルの問題も URL で共有して再現できる', () => {
  it('URL から同じ問題(同じキー)に戻る', () => {
    const items = ['2026-10-18', '2026-10-19', '2026-10-20', '2026-10-21', '2026-10-22'].flatMap(dailyItems)
    items.push({ definition: findDrill('betaori')!, question: makeBetaoriQuestion(123), key: '123' })
    const covered = new Set<string>()
    for (const { definition, question } of items) {
      const path = shareFor(definition).path(question)
      expect(path.startsWith(`/q/${definition.id}?d=`)).toBe(true)
      const restored = definition.fromData(decodeShareData(path.split('?d=')[1]))
      expect(definition.keyOf(restored)).toBe(definition.keyOf(question))
      // URL が長くなりすぎない(多くの環境で使える 2,000文字以内)
      expect(path.length).toBeLessThan(2000)
      covered.add(definition.id)
    }
    expect([...covered].sort()).toEqual(DRILLS.map((d) => d.id).sort())
  })
})
