import { describe, expect, it } from 'vitest'
import { assessHand, dealsIn, riichiSeats, situationIsConsistent } from './danger'
import { discardBetaori, replayBetaori, startBetaori, summarizeBetaori, type BetaoriGame } from './betaori'

/** 毎巡一番安全な牌を切って最後まで進める */
function playSafest(seed: number): BetaoriGame {
  let g = startBetaori(seed)
  while (!g.end) {
    // 自分の番では、牌の枚数がいつも正しい(終わったあとのツモ牌は使わない)
    expect(situationIsConsistent(g.situation)).toBe(true)
    g = discardBetaori(g, assessHand(g.situation)[0].kind)
  }
  return g
}

describe('ベタオリサバイバル', () => {
  it('リーチ者1人の局面から始まり、牌の枚数が正しい', () => {
    const g = startBetaori(5)
    expect(riichiSeats(g.situation)).toHaveLength(1)
    expect(situationIsConsistent(g.situation)).toBe(true)
    expect(g.turns).toHaveLength(0)
  })

  it('毎巡一番安全な牌を切ると、記録はすべて「最善」で、終わりまで進む', () => {
    for (const seed of [1, 2, 3]) {
      const g = playSafest(seed)
      expect(g.end).not.toBeNull()
      const sum = summarizeBetaori(g)
      expect(sum.saferExisted).toHaveLength(0)
      expect(sum.safestCount).toBe(g.turns.length)
      expect(sum.risk).toBe(sum.bestRisk)
      // 一番安全な牌が現物なら放銃しない
      for (const t of g.turns) if (t.minDanger === 0) expect(t.dealtIn).toBe(false)
    }
  })

  it('当たり牌を切ったらその場で放銃して終わり', () => {
    for (let seed = 1; seed <= 200; seed++) {
      const g = startBetaori(seed)
      const tiles = [...g.situation.myHand, g.situation.drawn]
      const hit = tiles.find((t) => dealsIn(g.situation, t.kind).length > 0)
      if (!hit) continue
      const after = discardBetaori(g, hit.kind)
      expect(after.end).toEqual({ reason: 'dealIn', seat: riichiSeats(g.situation)[0] })
      expect(after.turns[0].dealtIn).toBe(true)
      expect(summarizeBetaori(after).dealtIn).toBe(true)
      expect(() => discardBetaori(after, tiles[0].kind)).toThrow()
      return
    }
    throw new Error('当たり牌を持っている局面が見つかりませんでした')
  })

  it('危険な牌を切った巡は「もっと安全な牌があった」と記録される', () => {
    const g = startBetaori(4)
    const list = assessHand(g.situation)
    const worst = list[list.length - 1]
    const after = discardBetaori(g, worst.kind)
    if (worst.danger > list[0].danger) {
      expect(after.turns[0].danger).toBe(worst.danger)
      expect(after.turns[0].minDanger).toBe(list[0].danger)
      expect(summarizeBetaori(after).saferExisted).toHaveLength(1)
    }
  })

  it('同じ打牌の並びなら同じ展開になる(記録から再現できる)', () => {
    const g = playSafest(7)
    const kinds = g.turns.map((t) => t.discard.kind)
    const r = replayBetaori(7, kinds)!
    expect(r.end).toEqual(g.end)
    expect(r.situation.rivers).toEqual(g.situation.rivers)
    expect(replayBetaori(7, [...kinds, kinds[0]])).toBeNull()
  })
})

describe('ドリルとしての判定', () => {
  it('放銃せずに終われたら正解、放銃したら不正解', async () => {
    const { judgeBetaori, makeBetaoriQuestion, fromBetaoriData, toBetaoriData } = await import('./betaoriQuestion')
    const g = playSafest(3)
    const q = makeBetaoriQuestion(3)
    const kinds = g.turns.map((t) => t.discard.kind)
    expect(judgeBetaori(q, kinds)).toBe(!summarizeBetaori(g).dealtIn)
    // 途中までの回答(終わっていない)は不正解
    expect(judgeBetaori(q, kinds.slice(0, 1))).toBe(false)
    expect(fromBetaoriData(JSON.parse(JSON.stringify(toBetaoriData(q)))).seed).toBe(3)
    expect(() => fromBetaoriData({ seed: 'x' })).toThrow()
  })
})

describe('安パイの使い方の評価', () => {
  it('現物があるのに危険な牌を切ったら、そのことを指摘する', () => {
    for (let seed = 1; seed <= 50; seed++) {
      const g = startBetaori(seed)
      const list = assessHand(g.situation)
      if (list[0].danger !== 0 || list[list.length - 1].danger === 0) continue
      const after = discardBetaori(g, list[list.length - 1].kind)
      expect(summarizeBetaori(after).stockComment).toMatch(/現物が手にあるのに/)
      return
    }
    throw new Error('現物を持つ局面が見つかりませんでした')
  })
})
