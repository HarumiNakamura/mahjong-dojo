import { describe, expect, it } from 'vitest'
import { DANGER_TABLE } from '../data/danger-table'
import {
  assessForPlayer,
  assessHand,
  assessTile,
  dangerGroups,
  generateSituation,
  riichiSeats,
  riichiWaits,
  situationIsConsistent,
  type DefenseSituation,
} from './danger'
import { createRng } from './random'
import { parseTiles } from './tiles'
import { findWaits } from './waits'

const k = (text: string) => parseTiles(text)[0].kind

/**
 * 手で局面を作る。河の牌の通し番号は「巡 × 4 + 座席」(打つ順番どおり)にする。
 * riichi は各座席のリーチ宣言牌の位置。
 */
function situation(opts: {
  rivers: [string, string, string, string]
  riichi: (number | null)[]
  myHand?: string
  drawn?: string
  dora?: string
}): DefenseSituation {
  const rivers = opts.rivers.map((text, seat) => parseTiles(text).map((tile, i) => ({ tile, order: i * 4 + seat })))
  return {
    turn: 8,
    doraIndicator: parseTiles(opts.dora ?? '9s')[0],
    dealerSeat: 0,
    rivers,
    riichiIndex: [1, 2, 3].reduce<(number | null)[]>((acc, seat) => [...acc, opts.riichi[seat] ?? null], [null]),
    myHand: parseTiles(opts.myHand ?? '2468p2468s12345z'),
    drawn: parseTiles(opts.drawn ?? '6z')[0],
    hands: [[], [], [], []],
    wall: [],
    nextOrder: 100,
  }
}

const one = (s: DefenseSituation, tile: string, seat = 1) => assessForPlayer(s, seat, k(tile))

describe('現物', () => {
  it('リーチ者自身の河にある牌は現物(危険度0)', () => {
    const s = situation({ rivers: ['', '1m2p3s7z', '', ''], riichi: [null, 3] })
    const r = one(s, '2p')
    expect(r.category).toBe('genbutsu')
    expect(r.danger).toBe(0)
    expect(r.riverRefs).toEqual([{ seat: 1, index: 1 }])
  })

  it('リーチ後に他家が切って通った牌は現物、リーチ前に切られた牌は現物ではない', () => {
    // 下家のリーチ宣言牌は2巡目(通し番号5)。対面の1巡目(2)はリーチ前、2巡目(6)はリーチ後
    const s = situation({ rivers: ['', '1z9s', '5m5s', ''], riichi: [null, 1] })
    expect(one(s, '5s').category).toBe('genbutsu')
    expect(one(s, '5s').riverRefs).toEqual([{ seat: 2, index: 1 }])
    expect(one(s, '5m').category).not.toBe('genbutsu')
  })
})

describe('字牌', () => {
  it('見えている枚数で危険度が変わる', () => {
    // 東(1z)は河に2枚・手に1枚で3枚見え、中(7z)は0枚
    const s = situation({ rivers: ['1z', '9s2s3s', '1z', ''], riichi: [null, 2], myHand: '2468p2468s1234z', drawn: '5z' })
    expect(one(s, '1z').category).toBe('honor')
    expect(one(s, '1z').danger).toBe(DANGER_TABLE.honor[3])
    expect(one(s, '7z').danger).toBe(DANGER_TABLE.honor[0])
    expect(one(s, '2z').label).toBe('字牌(1枚見え)')
  })
})

describe('スジ', () => {
  it('4が現物なら1と7はスジ', () => {
    const s = situation({ rivers: ['', '9p4m1z', '', ''], riichi: [null, 2] })
    expect(one(s, '1m').category).toBe('suji')
    expect(one(s, '1m').danger).toBe(DANGER_TABLE.suji['19'])
    expect(one(s, '7m').category).toBe('suji')
    expect(one(s, '7m').danger).toBe(DANGER_TABLE.suji['37'])
    expect(one(s, '1m').riverRefs).toEqual([{ seat: 1, index: 1 }])
  })

  it('2と8が現物なら5は両スジ、片方だけなら片スジ', () => {
    const both = situation({ rivers: ['', '2m8m1z', '', ''], riichi: [null, 2] })
    expect(one(both, '5m').category).toBe('ryousuji')
    expect(one(both, '5m').danger).toBe(DANGER_TABLE.ryousuji)
    const half = situation({ rivers: ['', '2m9p1z', '', ''], riichi: [null, 2] })
    expect(one(half, '5m').category).toBe('katasuji')
    expect(one(half, '5m').danger).toBe(DANGER_TABLE.katasuji)
  })

  it('4・5・6 は片側のスジだけでは「スジ」にならない', () => {
    const s = situation({ rivers: ['', '1s9p1z', '', ''], riichi: [null, 2] })
    // 4s: 2s3s の両面(1s が現物で消える)と 5s6s の両面(7s 待ち)
    expect(one(s, '4s').category).toBe('katasuji')
  })

  it('リーチ宣言牌でできたスジは「宣言牌のスジ」として少し危険度が高い', () => {
    const s = situation({ rivers: ['', '9p1z4p', '', ''], riichi: [null, 2] })
    const r = one(s, '1p')
    expect(r.category).toBe('sengenSuji')
    expect(r.danger).toBeGreaterThan(DANGER_TABLE.suji['19'])
    // 宣言牌より前にも同じ牌を切っていれば普通のスジ
    const s2 = situation({ rivers: ['', '4p1z4p', '', ''], riichi: [null, 2] })
    expect(one(s2, '1p').category).toBe('suji')
  })

  it('無スジの数牌は危険度が高く、真ん中ほど危ない', () => {
    const s = situation({ rivers: ['', '9p1z2z', '', ''], riichi: [null, 2] })
    expect(one(s, '5s').category).toBe('musuji')
    expect(one(s, '5s').danger).toBe(DANGER_TABLE.musuji['456'])
    expect(one(s, '1m').danger).toBeLessThan(one(s, '5m').danger)
  })
})

describe('壁・ノーチャンス・ワンチャンス', () => {
  it('8が4枚見えていれば9はノーチャンス', () => {
    const s = situation({ rivers: ['8m', '9p1z2z', '8m', '8m'], riichi: [null, 2], myHand: '8m2468p2468s1234z' })
    const r = one(s, '9m')
    expect(r.category).toBe('noChance')
    expect(r.danger).toBe(DANGER_TABLE.noChance['19'])
    expect(r.wallKinds).toEqual([k('8m')])
  })

  it('8が3枚見えていれば9はワンチャンス', () => {
    const s = situation({ rivers: ['8m', '9p1z2z', '8m', ''], riichi: [null, 2], myHand: '8m2468p2468s1234z' })
    expect(one(s, '9m').category).toBe('oneChance')
    expect(one(s, '9m').danger).toBe(DANGER_TABLE.oneChance['19'])
  })

  it('片側がスジ、もう片側が壁ならノーチャンス', () => {
    // 6s: 4s5s の両面は 3s が現物で消え、7s8s の両面は 7s が4枚見えで消える
    const s = situation({ rivers: ['7s', '3s1z2z', '7s', '7s'], riichi: [null, 2], myHand: '7s2468p248m12345z' })
    expect(one(s, '6s').category).toBe('noChance')
  })
})

describe('複数のリーチ者', () => {
  it('2人分の危険度をまとめる(どちらにも通る確率から計算)', () => {
    const s = situation({ rivers: ['', '4m1z', '9p2z', ''], riichi: [null, 1, 1] })
    expect(riichiSeats(s)).toEqual([1, 2])
    const t = assessTile(s, k('1m'))
    expect(t.perPlayer.map((x) => x.category)).toEqual(['suji', 'musuji'])
    const expected = 1 - (1 - DANGER_TABLE.suji['19'] / 100) * (1 - DANGER_TABLE.musuji['19'] / 100)
    expect(t.danger).toBeCloseTo(expected * 100, 1)
    // 両方の現物なら0
    const s2 = situation({ rivers: ['', '4m1z', '4m2z', ''], riichi: [null, 1, 1] })
    expect(assessTile(s2, k('4m')).danger).toBe(0)
  })

  it('手牌の判定は安全な順に並び、同じ危険度は同じグループになる', () => {
    const s = situation({ rivers: ['', '2p6s1z', '', ''], riichi: [null, 2] })
    const list = assessHand(s)
    expect(list[0].danger).toBe(0) // 2p・6s が現物
    for (let i = 1; i < list.length; i++) expect(list[i].danger).toBeGreaterThanOrEqual(list[i - 1].danger)
    const groups = dangerGroups(list)
    expect(groups.get(k('2p'))).toBe(0)
    expect(groups.get(k('6s'))).toBe(0)
  })
})

describe('リーチの局面を作る', () => {
  it('牌の枚数が正しく、リーチ者はテンパイしていて、自分の手は13枚+ツモ', () => {
    for (let seed = 1; seed <= 6; seed++) {
      const riichiCount = seed % 2 === 0 ? 2 : 1
      const s = generateSituation(createRng(seed), { riichiCount })
      expect(situationIsConsistent(s)).toBe(true)
      expect(s.myHand).toHaveLength(13)
      expect(riichiSeats(s)).toHaveLength(riichiCount)
      for (const seat of riichiSeats(s)) {
        expect(findWaits(s.hands[seat]).tenpai).toBe(true)
        expect(riichiWaits(s, seat).length).toBeGreaterThan(0)
        // リーチ後に他家が通した現物は、リーチ者の待ちではない(当たりならロンされて局面が作られない)
        const genbutsuKinds = assessHand(s)
          .filter((x) => x.perPlayer.find((p) => p.seat === seat)?.category === 'genbutsu')
          .map((x) => x.kind)
        for (const kind of genbutsuKinds) {
          const inOwnRiver = s.rivers[seat].some((r) => r.tile.kind === kind)
          if (inOwnRiver) continue
          expect(riichiWaits(s, seat)).not.toContain(kind)
        }
      }
    }
  })

  it('同じシードなら同じ局面になる', () => {
    const a = generateSituation(createRng(42), { riichiCount: 1 })
    const b = generateSituation(createRng(42), { riichiCount: 1 })
    expect(a.myHand).toEqual(b.myHand)
    expect(a.rivers).toEqual(b.rivers)
  })
})
