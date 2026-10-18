import { describe, expect, it } from 'vitest'
import { createRng, randomInt, shuffle } from './random'

describe('random', () => {
  it('同じシードなら同じ並びになる', () => {
    const a = createRng(7)
    const b = createRng(7)
    for (let i = 0; i < 10; i++) expect(a()).toBe(b())
  })

  it('0以上1未満、randomInt は範囲内', () => {
    const rng = createRng(1)
    for (let i = 0; i < 1000; i++) {
      const x = rng()
      expect(x >= 0 && x < 1).toBe(true)
      const n = randomInt(rng, 5)
      expect(n >= 0 && n < 5 && Number.isInteger(n)).toBe(true)
    }
  })

  it('shuffle は並び替えるだけで要素は変わらない', () => {
    const items = Array.from({ length: 20 }, (_, i) => i)
    const s = shuffle(items, createRng(3))
    expect([...s].sort((a, b) => a - b)).toEqual(items)
    expect(s).not.toEqual(items)
  })
})
