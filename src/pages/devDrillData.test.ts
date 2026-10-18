import { describe, expect, it } from 'vitest'
import { calcShantenFromTiles } from '../engine/shanten'
import { SAMPLE_HANDS } from './devDrillData'

describe('/dev/drill の問題', () => {
  it('どの手も13枚で、答え(シャンテン数)が選択肢 0〜3 の中にある', () => {
    for (const hand of SAMPLE_HANDS) {
      expect(hand).toHaveLength(13)
      const n = calcShantenFromTiles(hand).min
      expect(n).toBeGreaterThanOrEqual(0)
      expect(n).toBeLessThanOrEqual(3)
    }
  })
})
