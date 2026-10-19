import { describe, expect, it } from 'vitest'
import { parseTiles } from './tiles'
import { describeRole, splitHand, tileRole } from './tileRole'

const k = (s: string) => parseTiles(s)[0].kind

describe('手牌の中の牌の役割', () => {
  const hand = parseTiles('123m79m45p2p11s5z678s')

  it('孤立牌・嵌張・両面・対子・面子を見分ける', () => {
    expect(tileRole(hand, k('5z')).type).toBe('isolated')
    expect(tileRole(hand, k('2p')).type).toBe('isolated')
    expect(tileRole(hand, k('9m'))).toMatchObject({ type: 'kanchan', kinds: [k('7m'), k('9m')], waits: [k('8m')] })
    expect(tileRole(hand, k('4p'))).toMatchObject({ type: 'ryanmen', waits: [k('3p'), k('6p')] })
    expect(tileRole(hand, k('1s')).type).toBe('toitsu')
    expect(tileRole(hand, k('2m')).type).toBe('shuntsu')
  })

  it('辺張の待ち', () => {
    expect(tileRole(parseTiles('12m'), k('1m'))).toMatchObject({ type: 'penchan', waits: [k('3m')] })
    expect(tileRole(parseTiles('89p'), k('9p'))).toMatchObject({ type: 'penchan', waits: [k('7p')] })
  })

  it('同じ牌が2枚以上あれば、切って一番損の少ない1枚の役割にする', () => {
    // 3索は面子(345索)にも入るが、もう1枚は余り
    expect(tileRole(parseTiles('345s3s'), k('3s')).type).not.toBe('shuntsu')
  })

  it('説明文', () => {
    expect(describeRole(k('9m'), tileRole(hand, k('9m')))).toBe('9萬は7萬と組んで嵌張(8萬待ち)の候補になっています')
    expect(describeRole(k('2p'), tileRole(hand, k('2p')))).toBe('2筒は孤立牌で、ほかの牌とつながっていません')
    expect(describeRole(k('5z'), tileRole(hand, k('5z')))).toContain('孤立した字牌')
  })

  it('14枚でもすぐ分けられる', () => {
    const t0 = performance.now()
    for (let i = 0; i < 100; i++) splitHand(parseTiles('123m79m45p2p11s5z678s'))
    splitHand(parseTiles('11223344556677m'))
    expect(performance.now() - t0).toBeLessThan(1500)
  })
})
