import { describe, expect, it } from 'vitest'
import { createRng } from './random'
import { checkTileSet, tilesToCounts } from './tiles'
import { allTiles, createWall } from './wall'

describe('山', () => {
  it('136枚で、各牌4枚・赤5は各色1枚', () => {
    const tiles = allTiles()
    expect(tiles).toHaveLength(136)
    expect(tilesToCounts(tiles).every((n) => n === 4)).toBe(true)
    expect(tiles.filter((t) => t.red).map((t) => t.kind)).toEqual([4, 13, 22])
    expect(checkTileSet(tiles)).toEqual([])
  })

  it('かき混ぜても同じ136枚', () => {
    const wall = createWall(createRng(5))
    expect(wall).toHaveLength(136)
    expect(tilesToCounts(wall)).toEqual(tilesToCounts(allTiles()))
  })
})
