import { describe, expect, it } from 'vitest'
import {
  ALL_KINDS,
  checkTileSet,
  countsToTiles,
  formatTiles,
  isHonor,
  kindOf,
  makeTile,
  parseTiles,
  rankOf,
  sortTiles,
  suitOf,
  tileName,
  tilesToCounts,
} from './tiles'

describe('牌の番号', () => {
  it('34種類の番号と種類・数字が対応する', () => {
    expect(ALL_KINDS).toHaveLength(34)
    expect(kindOf('m', 1)).toBe(0)
    expect(kindOf('p', 1)).toBe(9)
    expect(kindOf('s', 9)).toBe(26)
    expect(kindOf('z', 7)).toBe(33)
    for (const k of ALL_KINDS) expect(kindOf(suitOf(k), rankOf(k))).toBe(k)
  })

  it('字牌の判定', () => {
    expect(isHonor(26)).toBe(false)
    expect(isHonor(27)).toBe(true)
  })

  it('範囲外の数字や5以外の赤はエラー', () => {
    expect(() => kindOf('z', 8)).toThrow()
    expect(() => kindOf('m', 0)).toThrow()
    expect(() => makeTile('m', 4, true)).toThrow()
    expect(() => makeTile('z', 5, true)).toThrow()
  })
})

describe('parseTiles', () => {
  it('数牌と字牌を読み取れる', () => {
    expect(parseTiles('12m7z')).toEqual([
      { kind: 0, red: false },
      { kind: 1, red: false },
      { kind: 33, red: false },
    ])
  })

  it('0 を赤5として読む', () => {
    expect(parseTiles('0m0p0s')).toEqual([
      { kind: 4, red: true },
      { kind: 13, red: true },
      { kind: 22, red: true },
    ])
  })

  it('空白は無視する', () => {
    expect(parseTiles('12m 3p')).toEqual(parseTiles('12m3p'))
  })

  it('不正な表記はエラーになる', () => {
    expect(() => parseTiles('8z')).toThrow()
    expect(() => parseTiles('0z')).toThrow()
    expect(() => parseTiles('123')).toThrow()
    expect(() => parseTiles('1x')).toThrow()
    expect(() => parseTiles('m')).toThrow()
  })
})

describe('formatTiles', () => {
  it('同じ種類が続く部分をまとめて書き出す', () => {
    expect(formatTiles(parseTiles('1m2m3m0p1122z'))).toBe('123m0p1122z')
  })

  it('並び順はそのまま保つ', () => {
    expect(formatTiles(parseTiles('1m1p2m'))).toBe('1m1p2m')
  })

  it('読み取りと書き出しで元に戻る', () => {
    const text = '123m406p789s1122z'
    expect(formatTiles(parseTiles(text))).toBe(text)
  })

  it('空の配列は空文字', () => {
    expect(formatTiles([])).toBe('')
  })
})

describe('枚数配列', () => {
  it('34要素で、赤5は普通の5として数える', () => {
    const counts = tilesToCounts(parseTiles('055m11z'))
    expect(counts).toHaveLength(34)
    expect(counts[4]).toBe(3)
    expect(counts[27]).toBe(2)
    expect(counts.reduce((a, b) => a + b, 0)).toBe(5)
  })

  it('枚数配列から牌の配列に戻せる', () => {
    const tiles = parseTiles('113m7z')
    expect(countsToTiles(tilesToCounts(tiles))).toEqual(tiles)
  })

  it('要素数が違うとエラー', () => {
    expect(() => countsToTiles([1, 2])).toThrow()
  })
})

describe('sortTiles(理牌)', () => {
  it('萬子→筒子→索子→字牌、小さい順に並ぶ', () => {
    expect(formatTiles(sortTiles(parseTiles('7z9s1p5m1z1m')))).toBe('15m1p9s17z')
  })

  it('赤5は同じ5の後ろに並ぶ', () => {
    expect(formatTiles(sortTiles(parseTiles('6054m')))).toBe('4506m')
  })

  it('元の配列は変更しない', () => {
    const tiles = parseTiles('21m')
    sortTiles(tiles)
    expect(formatTiles(tiles)).toBe('21m')
  })
})

describe('checkTileSet', () => {
  it('正しい組み合わせなら問題なし', () => {
    expect(checkTileSet(parseTiles('0555m0p0s1111z'))).toEqual([])
  })

  it('同じ牌が5枚以上なら問題あり', () => {
    expect(checkTileSet(parseTiles('11111z'))).toEqual(['東が5枚あります(最大4枚)'])
  })

  it('赤5が各色1枚を超えたら問題あり', () => {
    expect(checkTileSet(parseTiles('00p'))).toEqual(['赤5筒が2枚あります(最大1枚)'])
  })
})

describe('tileName', () => {
  it('日本語の牌名を返す', () => {
    expect(tileName(makeTile('m', 3))).toBe('3萬')
    expect(tileName(makeTile('p', 5, true))).toBe('赤5筒')
    expect(tileName(makeTile('s', 9))).toBe('9索')
    expect(tileName(makeTile('z', 1))).toBe('東')
    expect(tileName(makeTile('z', 6))).toBe('發')
  })
})
