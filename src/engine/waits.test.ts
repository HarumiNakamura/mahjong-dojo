import { describe, expect, it } from 'vitest'
import { createRng } from './random'
import { calcShanten } from './shanten'
import { formatTiles, parseTiles, tilesToCounts, type Tile } from './tiles'
import { findWaits, isFormalTenpai, shapeLabels, type WaitShape } from './waits'
import { createWall } from './wall'

const p = parseTiles
const name = (k: number) => formatTiles([{ kind: k, red: false }])
/** 待ち牌を "1m 4m" のような文字列にする */
const waitsOf = (hand: string, melds = '') => findWaits(p(hand), p(melds)).waits.map((w) => name(w.kind)).join(' ')
const shapesOf = (hand: string, wait: string): WaitShape[] =>
  findWaits(p(hand)).waits.find((w) => name(w.kind) === wait)!.shapes

describe('指定のケース', () => {
  it('"1112345678999m" は 1m〜9m の9種待ち', () => {
    expect(waitsOf('1112345678999m')).toBe('1m 2m 3m 4m 5m 6m 7m 8m 9m')
  })
})

describe('待ちの形', () => {
  it('両面', () => {
    expect(waitsOf('23m456p789s123s11z')).toBe('1m 4m')
    expect(shapesOf('23m456p789s123s11z', '1m')).toEqual(['ryanmen'])
  })

  it('嵌張', () => {
    expect(waitsOf('13m456p789s123s11z')).toBe('2m')
    expect(shapesOf('13m456p789s123s11z', '2m')).toEqual(['kanchan'])
  })

  it('辺張(12で3待ち、89で7待ち)', () => {
    expect(waitsOf('12m456p789s123s11z')).toBe('3m')
    expect(shapesOf('12m456p789s123s11z', '3m')).toEqual(['penchan'])
    expect(waitsOf('89m456p789s123s11z')).toBe('7m')
    expect(shapesOf('89m456p789s123s11z', '7m')).toEqual(['penchan'])
  })

  it('双碰', () => {
    expect(waitsOf('123m456p789s1122z')).toBe('1z 2z')
    expect(shapesOf('123m456p789s1122z', '1z')).toEqual(['shanpon'])
  })

  it('単騎', () => {
    expect(waitsOf('123m456p789s111z2z')).toBe('2z')
    expect(shapesOf('123m456p789s111z2z', '2z')).toEqual(['tanki'])
  })

  it('延べ単(1234 で 1・4 の単騎)', () => {
    expect(waitsOf('1234m456p789s111z')).toBe('1m 4m')
    expect(shapesOf('1234m456p789s111z', '4m')).toEqual(['tanki'])
  })
})

describe('多面待ち', () => {
  it('2223 は 1・3・4 待ち(両面と単騎)', () => {
    expect(waitsOf('2223m456p789s111z')).toBe('1m 3m 4m')
    expect(shapesOf('2223m456p789s111z', '1m')).toEqual(['ryanmen'])
    expect(shapesOf('2223m456p789s111z', '3m')).toEqual(['tanki'])
  })

  it('3456 は 3・6 待ちと延べ単', () => {
    expect(waitsOf('3456m456p789s111z')).toBe('3m 6m')
  })

  it('4445 は 3・5・6 待ち', () => {
    expect(waitsOf('4445m456p789s111z')).toBe('3m 5m 6m')
  })

  it('同じ待ちでも見方が複数あれば、すべての見方を返す', () => {
    // 2m: 222 + 3 の… ではなく、22 + 23 + 2 など。少なくとも1通り以上
    const w = findWaits(p('1112345678999m')).waits
    expect(w.every((x) => x.patterns.length >= 1)).toBe(true)
    // 1m 待ちには 111 + 1 の単騎以外にも見方がある
    expect(w[0].patterns.length).toBeGreaterThan(1)
  })
})

describe('七対子と国士無双', () => {
  it('七対子の単騎', () => {
    const r = findWaits(p('1122m3344p5566s7z'))
    expect(r.waits.map((w) => name(w.kind))).toEqual(['7z'])
    expect(r.waits[0].shapes).toEqual(['chiitoitsu'])
    expect(r.waits[0].patterns[0].others).toHaveLength(6)
  })

  it('七対子と通常の形の両方で待つ手', () => {
    // 223344m の二盃口形 + 556677p + 1z
    const r = findWaits(p('223344m556677p1z'))
    expect(r.waits.map((w) => name(w.kind))).toEqual(['1z'])
    expect(r.waits[0].shapes.sort()).toEqual(['chiitoitsu', 'tanki'])
  })

  it('国士無双の1種待ち', () => {
    const r = findWaits(p('119m19p19s123456z'))
    expect(r.waits.map((w) => name(w.kind))).toEqual(['7z'])
    expect(r.waits[0].shapes).toEqual(['kokushi'])
  })

  it('国士無双の13面待ち', () => {
    const r = findWaits(p('19m19p19s1234567z'))
    expect(r.waits).toHaveLength(13)
    expect(r.waits.every((w) => w.shapes[0] === 'kokushi')).toBe(true)
  })

  it('副露があると七対子・国士無双にはならない', () => {
    // 10枚(1副露)の七対子風の形は通常の形として調べる
    expect(findWaits(p('1122m3344p56z')).waits.map((w) => name(w.kind))).toEqual([])
  })
})

describe('自分ですべて使っている当たり牌', () => {
  it('手牌で4枚使っている牌の待ちは含めない(形式聴牌にならない)', () => {
    const r = findWaits(p('1111m234p567s789s'))
    expect(r.waits).toEqual([])
    expect(r.usedUp.map(name)).toEqual(['1m'])
    expect(r.tenpai).toBe(false)
    expect(isFormalTenpai(p('1111m234p567s789s'))).toBe(false)
  })

  it('副露で使っている分も数える', () => {
    // 手牌 4枚(3副露)。4z 単騎だが、4z を副露(ポン)と手牌で4枚使っている
    expect(waitsOf('123m4z', '444z111p999s')).toBe('')
    expect(findWaits(p('123m4z'), p('444z111p999s')).usedUp.map(name)).toEqual(['4z'])
    // 副露がなければ 4z 待ち
    expect(waitsOf('123m4z')).toBe('4z')
  })

  it('一部の待ちだけを使い切っている場合は、残りの待ちだけを返す', () => {
    // 23m 両面で 1m を手牌の 111m と合わせて… ではなく、4m を副露で3枚使っている
    expect(waitsOf('23m456p789s123s11z', '444m')).toBe('1m 4m')
    expect(waitsOf('23m456p789s111z44m', '44m')).toBe('1m')
  })
})

describe('いろいろな枚数', () => {
  it('4枚形・7枚形・10枚形', () => {
    expect(waitsOf('1123m')).toBe('1m 4m')
    expect(waitsOf('2345678m')).toBe('2m 5m 8m')
    expect(waitsOf('1112223334m')).toBe('1m 2m 3m 4m 5m')
  })

  it('1枚(4副露)の単騎', () => {
    expect(waitsOf('5p')).toBe('5p')
  })

  it('テンパイしていなければ待ちはない', () => {
    expect(findWaits(p('147m258p369s1234z')).tenpai).toBe(false)
  })

  it('枚数が 3n+1 でなければエラー', () => {
    expect(() => findWaits(p('11m'))).toThrow()
  })

  it('待ちの形の名前', () => {
    expect(shapeLabels(['ryanmen', 'tanki'])).toBe('両面・単騎')
  })
})

describe('シャンテン数の計算との照合(ランダムな手)', () => {
  it('待ち牌 = 足すとアガリ形になり、まだ4枚使い切っていない牌', () => {
    const rng = createRng(21)
    let tenpaiHands = 0
    for (let i = 0; i < 1000; i++) {
      // テンパイしやすいよう、1色に寄せた手も混ぜる
      const wall = createWall(rng)
      const suit = i % 2 === 0 ? wall.filter((t) => t.kind < 9) : wall
      const hand: Tile[] = suit.slice(0, 13)
      const counts = tilesToCounts(hand)
      const expected: string[] = []
      for (let k = 0; k < 34; k++) {
        if (counts[k] >= 4) continue
        counts[k]++
        if (calcShanten(counts).min === -1) expected.push(name(k))
        counts[k]--
      }
      const actual = findWaits(hand).waits.map((w) => name(w.kind))
      expect(actual).toEqual(expected)
      if (expected.length > 0) tenpaiHands++
    }
    expect(tenpaiHands).toBeGreaterThan(10)
  })
})
