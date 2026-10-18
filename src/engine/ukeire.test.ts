import { describe, expect, it } from 'vitest'
import { formatTiles, parseTiles, type Tile } from './tiles'
import { analyzeDiscards, calcUkeire, type UkeireTile } from './ukeire'

const p = parseTiles

/** 有効牌を "1z:2 2z:2" のような文字列にする(読みやすくするため) */
function show(tiles: UkeireTile[]): string {
  return tiles.map((t) => `${formatTiles([{ kind: t.kind, red: false }])}:${t.remaining}`).join(' ')
}

const name = (t: Tile) => formatTiles([t])

describe('calcUkeire(13枚)', () => {
  it('1シャンテンの有効牌と受け入れ枚数', () => {
    const r = calcUkeire(p('123456m78p23s115z'))
    expect(r.shanten).toBe(1)
    expect(show(r.tiles)).toBe('6p:4 9p:4 1s:4 4s:4')
    expect(r.total).toBe(16)
    expect(r.tenpai).toBe(false)
    expect(r.waits).toBeNull()
  })

  it('見えている牌を差し引く', () => {
    const r = calcUkeire(p('123456m78p23s115z'), p('669p'))
    expect(show(r.tiles)).toBe('6p:2 9p:3 1s:4 4s:4')
    expect(r.total).toBe(13)
  })

  it('九蓮宝燈の形は9種待ちで残り23枚', () => {
    const r = calcUkeire(p('1112345678999m'))
    expect(r.tenpai).toBe(true)
    expect(r.waits?.map((t) => t.kind)).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8])
    expect(r.total).toBe(23)
  })

  it('国士無双13面待ちは13種で残り39枚', () => {
    const r = calcUkeire(p('19m19p19s1234567z'))
    expect(r.waits).toHaveLength(13)
    expect(r.total).toBe(39)
  })

  it('待ち牌がすべて見えていても待ちとして示し、残り0枚', () => {
    const r = calcUkeire(p('123456p111z22z13m'), p('2222m'))
    expect(r.tenpai).toBe(true)
    expect(show(r.waits!)).toBe('2m:0')
    expect(r.total).toBe(0)
  })

  it('待ちを自分で4枚使っている形はノーテン扱い(引ける待ちがない)', () => {
    const r = calcUkeire(p('1111m234p567s789s'))
    expect(r.shanten).toBe(0)
    expect(r.tiles).toEqual([])
    expect(r.tenpai).toBe(false)
    expect(r.waits).toBeNull()
  })

  it('副露あり(10枚)でも調べられる', () => {
    const r = calcUkeire(p('123m456p11z22z'))
    expect(r.tenpai).toBe(true)
    expect(show(r.waits!)).toBe('1z:2 2z:2')
  })

  it('枚数が 3n+1 でなければエラー', () => {
    expect(() => calcUkeire(p('123456789m11122z'))).toThrow()
  })
})

describe('analyzeDiscards(14枚)', () => {
  const hand = p('123m456p789s11223z')

  it('最善手は聴牌になる打牌で、待ちと残り枚数がわかる', () => {
    const a = analyzeDiscards(hand)
    expect(a.shanten).toBe(0)
    expect(a.agari).toBe(false)
    const best = a.options[0]
    expect(name(best.tile)).toBe('3z')
    expect(best.best).toBe(true)
    expect(best.tenpai).toBe(true)
    expect(show(best.waits!)).toBe('1z:2 2z:2')
    expect(best.total).toBe(4)
    expect(best.diff).toBe(0)
  })

  it('見えている牌(河・副露・ドラ表示牌)を差し引く', () => {
    const river = p('1z9m')
    const melds = p('777p')
    const doraIndicators = p('2z')
    const a = analyzeDiscards(hand, [...river, ...melds, ...doraIndicators])
    expect(show(a.options[0].waits!)).toBe('1z:1 2z:1')
    expect(a.options[0].total).toBe(2)
  })

  it('シャンテン数を戻す打牌には印が付く', () => {
    const a = analyzeDiscards(hand)
    const cut1z = a.options.find((o) => name(o.tile) === '1z')!
    expect(cut1z.shanten).toBe(1)
    expect(cut1z.backward).toBe(true)
    expect(cut1z.best).toBe(false)
    expect(a.options[0].backward).toBe(false)
  })

  it('候補は種類ごとに1つで、シャンテン数が小さい順 → 受け入れ枚数が多い順', () => {
    const a = analyzeDiscards(p('13m123456p9s11122z'))
    // 1m 3m 1p〜6p 9s 1z 2z の11種
    expect(a.options).toHaveLength(11)
    for (let i = 1; i < a.options.length; i++) {
      const prev = a.options[i - 1]
      const cur = a.options[i]
      expect(prev.shanten < cur.shanten || (prev.shanten === cur.shanten && prev.total >= cur.total)).toBe(true)
    }
  })

  it('最善手との差(枚数)を返す', () => {
    // 9s を切れば嵌張 2m 待ち(4枚)。1m を切ると 1シャンテンに戻る
    const a = analyzeDiscards(p('13m123456p9s11122z'), p('2m'))
    const best = a.options[0]
    expect(name(best.tile)).toBe('9s')
    expect(show(best.waits!)).toBe('2m:3')
    for (const o of a.options) expect(o.diff).toBe(best.total - o.total)
    const cut1m = a.options.find((o) => name(o.tile) === '1m')!
    expect(cut1m.backward).toBe(true)
  })

  it('1シャンテンの打牌比較:受け入れが多い打牌が上に来て、差がわかる', () => {
    // 5z を切ると 78p・23s の両面が残る(6p9p1s4s の16枚)。8p を切ると両面が1つ減り受け入れが少ない
    const a = analyzeDiscards(p('123456m78p23s1155z'))
    expect(a.shanten).toBe(1)
    const top = a.options[0]
    expect(top.shanten).toBe(1)
    const cut5z = a.options.find((o) => name(o.tile) === '5z')!
    const cut8p = a.options.find((o) => name(o.tile) === '8p')!
    expect(cut5z.total).toBeGreaterThan(cut8p.total)
    expect(cut8p.diff).toBe(top.total - cut8p.total)
    expect(a.options.indexOf(cut5z)).toBeLessThan(a.options.indexOf(cut8p))
  })

  it('同じ受け入れ枚数の最善手が複数あれば、すべてに best が付く', () => {
    const a = analyzeDiscards(p('123m456p789s111z2z3z'))
    // 2z と 3z のどちらを切っても単騎待ち(残り3枚)
    const bests = a.options.filter((o) => o.best).map((o) => name(o.tile))
    expect(bests).toEqual(['2z', '3z'])
  })

  it('残り枚数は打牌前の手牌で数える(切った牌は戻らない)', () => {
    // アガリ形から 2z を1枚切ると 2z 単騎。切った 2z も自分の手牌として差し引くので残り2枚
    const a = analyzeDiscards(p('123m456p789s11122z'))
    const cut2z = a.options.find((o) => name(o.tile) === '2z')!
    expect(show(cut2z.waits!)).toBe('2z:2')
    // 13枚だけで数えると残り3枚になる
    expect(show(calcUkeire(p('123m456p789s1112z')).waits!)).toBe('2z:3')
  })

  it('赤5と普通の5があれば普通の5を切る候補にする', () => {
    const a = analyzeDiscards(p('0555m123p456s77z11z'))
    const five = a.options.find((o) => o.tile.kind === 4)!
    expect(five.tile.red).toBe(false)
  })

  it('赤5しかなければ赤5を切る候補にする', () => {
    const a = analyzeDiscards(p('0m123p456s789s11z77z'))
    const five = a.options.find((o) => o.tile.kind === 4)!
    expect(five.tile.red).toBe(true)
  })

  it('アガリの形なら agari が true', () => {
    const a = analyzeDiscards(p('123m456p789s11122z'))
    expect(a.shanten).toBe(-1)
    expect(a.agari).toBe(true)
    expect(a.options[0].tenpai).toBe(true)
  })

  it('副露あり(11枚)でも調べられる', () => {
    const a = analyzeDiscards(p('123m456p11z223z'))
    expect(name(a.options[0].tile)).toBe('3z')
    expect(show(a.options[0].waits!)).toBe('1z:2 2z:2')
  })

  it('手牌と見えている牌で5枚以上になるとエラー', () => {
    expect(() => analyzeDiscards(hand, p('111z'))).toThrow('5枚あります')
  })

  it('枚数が 3n+2 でなければエラー', () => {
    expect(() => analyzeDiscards(p('123m456p789s1122z'))).toThrow()
  })

  it('1回の分析は数十ミリ秒以内', () => {
    const start = performance.now()
    analyzeDiscards(p('1356m2479p13468s1z'))
    expect(performance.now() - start).toBeLessThan(100)
  })
})
