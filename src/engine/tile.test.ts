import { describe, expect, it } from 'vitest'
import { parseTiles } from './tile'

describe('parseTiles', () => {
  it('数牌と字牌を読み取れる', () => {
    expect(parseTiles('12m7z')).toEqual([
      { suit: 'm', rank: 1, red: false },
      { suit: 'm', rank: 2, red: false },
      { suit: 'z', rank: 7, red: false },
    ])
  })

  it('0 を赤五として扱う', () => {
    expect(parseTiles('0p')).toEqual([{ suit: 'p', rank: 5, red: true }])
  })

  it('不正な表記はエラーになる', () => {
    expect(() => parseTiles('8z')).toThrow()
    expect(() => parseTiles('123')).toThrow()
    expect(() => parseTiles('1x')).toThrow()
  })
})
