import { describe, expect, it } from 'vitest'
import { calcShanten, calcShantenFromTiles, meldCountFromTileCount } from './shanten'
import { parseTiles, tilesToCounts } from './tiles'

const shanten = (text: string) => calcShantenFromTiles(parseTiles(text))

describe('指定のケース', () => {
  it('"123m456p789s1122z" は聴牌(0)', () => {
    expect(shanten('123m456p789s1122z').min).toBe(0)
  })

  it('"19m19p19s1234567z" は国士無双13面待ちの聴牌(0)', () => {
    const r = shanten('19m19p19s1234567z')
    expect(r.kokushi).toBe(0)
    expect(r.min).toBe(0)
  })

  it.each([1, 2, 3, 4, 5, 6, 7, 8, 9])('"1112345678999m" に %im を足すとアガリ(-1)', (n) => {
    expect(shanten(`1112345678999${n}m`).min).toBe(-1)
  })

  it('"11223344556677z"(14枚)は七対子のアガリ(-1)', () => {
    const r = shanten('11223344556677z')
    expect(r.chiitoitsu).toBe(-1)
    expect(r.min).toBe(-1)
  })
})

describe('通常手', () => {
  it.each([
    ['123m456p789s11122z', -1, '4面子1雀頭のアガリ'],
    ['123m456p789s1112z', 0, '単騎待ちの聴牌'],
    ['1112345678999m', 0, '九蓮宝燈の形の聴牌'],
    ['123456m78p23s115z', 1, '2面子2搭子1雀頭の1シャンテン'],
    ['123456m78p23s1155z', 1, '14枚の1シャンテン'],
    ['12m45p78s1234567z', 5, '搭子3つと字牌がばらばら'],
    ['147m258p369s1234z', 8, '面子も搭子もない(通常手は最大の8)'],
    ['13m', 0, '嵌張は搭子(4副露・2枚)'],
    ['22234m', -1, '雀頭と順子(3副露・5枚)'],
    ['2233445566778m', 0, '清一色の多面張'],
  ])('%s → %i(%s)', (text, expected) => {
    expect(shanten(text as string).normal).toBe(expected)
  })
})

describe('七対子', () => {
  it('対子6組と単騎は聴牌', () => {
    const r = shanten('1122m3344p5566s7z')
    expect(r.chiitoitsu).toBe(0)
    expect(r.normal).toBe(3)
    expect(r.min).toBe(0)
  })

  it('同じ牌4枚は対子2組と数えない', () => {
    expect(shanten('1111m2233p4455s6z').chiitoitsu).toBe(2)
  })

  it('七対子のアガリでも通常手としては3シャンテン', () => {
    expect(shanten('11223344556677z').normal).toBe(3)
  })

  it('ばらばらの13枚は6シャンテン', () => {
    expect(shanten('147m258p369s1234z').chiitoitsu).toBe(6)
  })
})

describe('国士無双', () => {
  it('14枚そろえばアガリ', () => {
    expect(shanten('119m19p19s1234567z').kokushi).toBe(-1)
  })

  it('12種で対子なしは1シャンテン', () => {
    expect(shanten('19m19p19s123456z5m').kokushi).toBe(1)
  })

  it('最小値は3つの形の中で一番小さい値', () => {
    const r = shanten('147m258p369s1234z')
    expect(r.kokushi).toBe(7)
    expect(r.min).toBe(6)
  })
})

describe('副露がある場合', () => {
  it.each([
    ['123m456p789s11z', 1, -1],
    ['123m456p11z22z', 1, 0],
    ['234m678p5m', 2, 0],
    ['1112m', 3, 0],
    ['11m', 4, -1],
    ['12m', 4, 0],
    ['1m', 4, 0],
  ])('%s は %i 副露で %i', (text, melds, expected) => {
    const r = shanten(text as string)
    expect(r.melds).toBe(melds)
    expect(r.normal).toBe(expected)
    expect(r.min).toBe(expected)
  })

  it('副露があると七対子・国士無双は不可能(Infinity)', () => {
    const r = shanten('1122m3344p55s')
    expect(r.chiitoitsu).toBe(Infinity)
    expect(r.kokushi).toBe(Infinity)
  })
})

describe('入力チェック', () => {
  it('副露の数は手牌の枚数から決まる', () => {
    expect(meldCountFromTileCount(14)).toBe(0)
    expect(meldCountFromTileCount(13)).toBe(0)
    expect(meldCountFromTileCount(11)).toBe(1)
    expect(meldCountFromTileCount(2)).toBe(4)
  })

  it.each(['', '123456789m123p', '123456789m123456p'])('ありえない枚数はエラー: "%s"', (text) => {
    expect(() => shanten(text)).toThrow()
  })

  it('同じ牌が5枚以上はエラー', () => {
    expect(() => shanten('11111m')).toThrow()
  })

  it('枚数配列の要素数が違うとエラー', () => {
    expect(() => calcShanten([1, 1])).toThrow()
  })
})

// ---- 別の方法(総当たり)との照合 ----

/** 決まった順の乱数(テストを毎回同じ結果にするため) */
function rng(seed: number) {
  return () => {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff
    return seed / 0x80000000
  }
}

function randomCounts(random: () => number, n: number): number[] {
  const wall: number[] = []
  for (let k = 0; k < 34; k++) for (let i = 0; i < 4; i++) wall.push(k)
  for (let i = wall.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1))
    ;[wall[i], wall[j]] = [wall[j], wall[i]]
  }
  const counts = new Array(34).fill(0)
  for (const k of wall.slice(0, n)) counts[k]++
  return counts
}

/** 残りがすべて面子に分けられるか(素朴な再帰) */
function allSets(c: number[]): boolean {
  const i = c.findIndex((n) => n > 0)
  if (i < 0) return true
  if (c[i] >= 3) {
    c[i] -= 3
    const ok = allSets(c)
    c[i] += 3
    if (ok) return true
  }
  if (i < 27 && i % 9 <= 6 && c[i + 1] > 0 && c[i + 2] > 0) {
    c[i]--
    c[i + 1]--
    c[i + 2]--
    const ok = allSets(c)
    c[i]++
    c[i + 1]++
    c[i + 2]++
    if (ok) return true
  }
  return false
}

/** 総当たりのアガリ判定(七対子・国士無双は14枚のときだけ) */
function isAgari(c: number[]): boolean {
  const total = c.reduce((a, b) => a + b, 0)
  if (total === 14) {
    if (c.filter((n) => n === 2).length === 7) return true
    const yaochu = [0, 8, 9, 17, 18, 26, 27, 28, 29, 30, 31, 32, 33]
    if (yaochu.every((k) => c[k] >= 1) && yaochu.some((k) => c[k] === 2)) return true
  }
  for (let k = 0; k < 34; k++) {
    if (c[k] >= 2) {
      c[k] -= 2
      const ok = allSets(c)
      c[k] += 2
      if (ok) return true
    }
  }
  return false
}

describe('総当たりとの照合(ランダムな手)', () => {
  it('14枚: -1 になるのはアガリ形のときだけ', () => {
    const random = rng(1)
    for (let i = 0; i < 300; i++) {
      const c = randomCounts(random, 14)
      expect(calcShanten(c).min === -1).toBe(isAgari(c))
    }
  })

  it('アガリ形を作ると必ず -1', () => {
    const random = rng(2)
    let checked = 0
    while (checked < 200) {
      // ランダムに面子と雀頭を組み合わせる
      const c = new Array(34).fill(0)
      const pair = Math.floor(random() * 34)
      c[pair] += 2
      for (let s = 0; s < 4; s++) {
        const k = Math.floor(random() * 34)
        if (k < 27 && k % 9 <= 6 && random() < 0.6) {
          c[k]++
          c[k + 1]++
          c[k + 2]++
        } else {
          c[k] += 3
        }
      }
      if (c.some((n) => n > 4)) continue
      expect(calcShanten(c).min).toBe(-1)
      checked++
    }
  })

  it('13枚: 0 になるのは、何か1枚足すとアガリ形になるときだけ', () => {
    const random = rng(3)
    for (let i = 0; i < 300; i++) {
      const c = randomCounts(random, 13)
      const tenpai = Array.from({ length: 34 }, (_, k) => k).some((k) => {
        c[k]++
        const ok = isAgari(c)
        c[k]--
        return ok
      })
      expect(calcShanten(c).min === 0).toBe(tenpai)
    }
  })

  it('14枚のシャンテン数は「1枚捨てた13枚」の最小値と同じ', () => {
    const random = rng(4)
    for (let i = 0; i < 200; i++) {
      const c = randomCounts(random, 14)
      let best = Infinity
      for (let k = 0; k < 34; k++) {
        if (c[k] === 0) continue
        c[k]--
        best = Math.min(best, calcShanten(c).min)
        c[k]++
      }
      expect(calcShanten(c).min).toBe(best)
    }
  })

  it('副露ありの手(11枚)でも 0 と聴牌が一致する', () => {
    const random = rng(5)
    for (let i = 0; i < 200; i++) {
      const c = randomCounts(random, 10)
      const tenpai = Array.from({ length: 34 }, (_, k) => k).some((k) => {
        c[k]++
        const ok = isAgari(c)
        c[k]--
        return ok
      })
      expect(calcShanten(c).normal === 0).toBe(tenpai)
    }
  })
})

describe('速さ', () => {
  it('1回の計算は平均1ミリ秒未満', () => {
    const random = rng(6)
    const hands = Array.from({ length: 2000 }, (_, i) => randomCounts(random, i % 2 === 0 ? 13 : 14))
    const start = performance.now()
    for (const c of hands) calcShanten(c)
    const avg = (performance.now() - start) / hands.length
    expect(avg).toBeLessThan(1)
  })

  it('清一色のような1色の手も速い', () => {
    const start = performance.now()
    calcShanten(tilesToCounts(parseTiles('11223345566789p')))
    calcShanten(tilesToCounts(parseTiles('1112223334445s')))
    expect(performance.now() - start).toBeLessThan(50)
  })
})
