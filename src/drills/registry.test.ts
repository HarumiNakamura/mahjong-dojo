import { describe, expect, it } from 'vitest'
import { createRng } from '../engine/random'
import { generateQuestion } from '../engine/efficiencyQuestion'
import { DRILLS, findDrill } from './registry'

describe('ドリルの登録', () => {
  it('id は重ならず、id から探せる', () => {
    const ids = DRILLS.map((d) => d.id)
    expect(new Set(ids).size).toBe(ids.length)
    expect(findDrill('efficiency')?.title).toBe('何切る(牌効率)')
    expect(findDrill('nothing')).toBeUndefined()
  })

  it('何切る: 保存した形(JSON)から同じ問題・同じキーに戻せる', () => {
    const drill = findDrill('efficiency')!
    const q = generateQuestion('beginner', createRng(3))
    const restored = drill.fromData(JSON.parse(JSON.stringify(drill.toData(q))))
    expect(drill.keyOf(restored)).toBe(drill.keyOf(q))
    const correct = q.judgement.correctKinds[0]
    expect(drill.judge(restored, correct)).toBe(true)
    expect(drill.describeAnswer(restored, correct)).toMatch(/切り$/)
  })
})
