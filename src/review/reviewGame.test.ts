import legacy from '@kobalab/majiang-ai/legacy'
import { describe, expect, it } from 'vitest'
import { playCpuHanchan } from '../game/selfplay'
import { dapai, fulou, makePaipu, othersPass, pingju, ron, zimo } from './fixtures'
import { reviewGame } from './reviewGame'

const only = (paipu: ReturnType<typeof makePaipu>) => reviewGame(paipu).findings

describe('打牌(牌効率)', () => {
  it('受け入れの少ない打牌を指摘し、最善手と損失の目安を出す', () => {
    // 3面子 + 5索・9索・東南西。5索を切ると受け入れが大きく減る
    const f = only(makePaipu([{ hand: 'm123456p234s59z12', events: [zimo(0, 'z3'), dapai(0, 's5'), ...othersPass(['m9', 'p9', 's1']), pingju()] }]))
    expect(f).toHaveLength(1)
    expect(f[0]).toMatchObject({ category: 'discard', kind: 'ukeire', kyoku: 0, step: 1, played: expect.stringContaining('5索') })
    expect(f[0].better).toMatch(/を切る/)
    expect(f[0].loss).toBeGreaterThan(0)
  })

  it('最善手なら指摘しない', () => {
    const f = only(makePaipu([{ hand: 'm123456p234s59z12', events: [zimo(0, 'z3'), dapai(0, 'z1'), ...othersPass(['m9', 'p9', 's1']), pingju()] }]))
    expect(f).toEqual([])
  })

  it('ドラや役牌の対子を残す打牌は、牌効率で損でも指摘しない', () => {
    // 白の対子を残して 4索 を切る(白を切るほうが受け入れは多い)
    const f = only(makePaipu([{ hand: 'm123456p234s49z55', events: [zimo(0, 's9'), dapai(0, 's4'), ...othersPass(['m9', 'p9', 's1']), pingju()] }]))
    expect(f.filter((x) => x.category === 'discard')).toEqual([])
  })
})

describe('押し引き・放銃', () => {
  // 下家が 5筒 でリーチ。自分は2シャンテンで、現物の5筒を持っている
  const riichi = [zimo(1, 'p5'), dapai(1, 'p5*'), zimo(2, 'z7'), dapai(2, 'z7_'), zimo(3, 'z7'), dapai(3, 'z7_')]

  it('2シャンテンから無スジを押すと「押しすぎ」', () => {
    const f = only(makePaipu([{ hand: 'm1379p159s2468z12', events: [zimo(0, 'p1'), dapai(0, 'p1'), ...riichi, zimo(0, 'p5'), dapai(0, 's4'), zimo(1, 'm9'), dapai(1, 'm9_'), pingju()] }]))
    expect(f.map((x) => x.category)).toContain('pushfold')
    const p = f.find((x) => x.category === 'pushfold')!
    expect(p.kind).toBe('overpush')
    expect(p.better).toMatch(/降りる/)
  })

  it('現物を切れば指摘しない', () => {
    const f = only(makePaipu([{ hand: 'm1379p159s2468z12', events: [zimo(0, 'p1'), dapai(0, 'p1'), ...riichi, zimo(0, 'p5'), dapai(0, 'p5_'), zimo(1, 'm9'), dapai(1, 'm9_'), pingju()] }]))
    expect(f.filter((x) => x.category === 'pushfold' || x.category === 'dealin')).toEqual([])
  })

  it('より安全な牌があったのに放銃すると、払った点数を損失にして指摘する', () => {
    const f = only(makePaipu([{ hand: 'm1379p159s2468z12', events: [zimo(0, 'p1'), dapai(0, 'p1'), ...riichi, zimo(0, 'p5'), dapai(0, 's4'), ron(1, 0, 5200)] }]))
    const d = f.find((x) => x.category === 'dealin')!
    expect(d).toMatchObject({ kind: 'saferTile', loss: 5200 })
    expect(d.better).toMatch(/5筒/)
    // 同じ打牌を押しすぎとしても数えない
    expect(f.filter((x) => x.category === 'pushfold')).toEqual([])
  })
})

describe('アガリ逃し・リーチ', () => {
  it('ロンできる牌を見逃すと指摘する(アガリの点数が損失)', () => {
    // 断么九の 5索 単騎待ち
    const f = only(makePaipu([{ hand: 'm234567p345s6785', events: [zimo(0, 'm9'), dapai(0, 'm9_'), zimo(1, 's5'), dapai(1, 's5'), zimo(2, 'z1'), dapai(2, 'z1_'), pingju()] }]))
    const m = f.find((x) => x.kind === 'missedRon')!
    expect(m).toMatchObject({ category: 'missedWin', step: 4 })
    expect(m.loss).toBeGreaterThanOrEqual(2000)
  })

  it('ロンしたときは指摘しない', () => {
    const f = only(makePaipu([{ hand: 'm234567p345s6785', events: [zimo(0, 'm9'), dapai(0, 'm9_'), zimo(1, 's5'), dapai(1, 's5'), ron(0, 1, 2900)] }]))
    expect(f).toEqual([])
  })

  it('ツモアガリを見逃すと指摘する', () => {
    const f = only(makePaipu([{ hand: 'm234567p345s6785', events: [zimo(0, 's5'), dapai(0, 's5_'), ...othersPass(['m9', 'p9', 's1']), pingju()] }]))
    expect(f.map((x) => x.kind)).toContain('missedTsumo')
  })

  it('役のないテンパイでリーチしないと指摘する(1局に1回)', () => {
    // 5萬の嵌張待ち。役がないのでリーチしないとロンできない
    const f = only(
      makePaipu([
        {
          hand: 'm12346p456s789z22',
          events: [zimo(0, 'z7'), dapai(0, 'z7'), ...othersPass(['m9', 'p9', 's1']), zimo(0, 'z6'), dapai(0, 'z6_'), ...othersPass(['m9', 'p9', 's1']), pingju()],
        },
      ]),
    )
    expect(f.filter((x) => x.category === 'riichi')).toHaveLength(1)
    expect(f[0]).toMatchObject({ kind: 'yakulessDama', step: 1 })
  })

  it('リーチすれば指摘しない', () => {
    const f = only(makePaipu([{ hand: 'm12346p456s789z22', events: [zimo(0, 'z7'), dapai(0, 'z7*'), ...othersPass(['m9', 'p9', 's1']), pingju()] }]))
    expect(f).toEqual([])
  })
})

describe('鳴き', () => {
  it('役のなくなるチーを指摘する', () => {
    // 上家(座席3)の 3萬 を 45萬 でチー。么九牌が多く、役がない
    const f = only(
      makePaipu([
        {
          hand: 'm1945p19s19z12346',
          events: [zimo(0, 'z5'), dapai(0, 'z5'), ...othersPass(['m9', 'p9', 's1']).slice(0, 4), zimo(3, 'm3'), dapai(3, 'm3'), fulou(0, 'm3-45'), dapai(0, 'z4'), pingju()],
        },
      ]),
    )
    const c = f.find((x) => x.category === 'call')!
    expect(c).toMatchObject({ kind: 'noYaku', loss: 1500 })
  })

  it('終盤に、役牌をポンすればテンパイなのにスルーすると指摘する', () => {
    const f = only(
      makePaipu([
        {
          hand: 'm234p567s349z5566',
          // 7巡目まではツモ切りで進める(序盤は門前でリーチを目指すのも十分なので、終盤の鳴きで調べる)
          events: [...Array.from({ length: 7 }, () => [zimo(0, 'p9'), dapai(0, 'p9_'), ...othersPass(['m9', 'p9', 's1'])]).flat(), zimo(0, 's9'), dapai(0, 's9_'), zimo(1, 'z5'), dapai(1, 'z5'), zimo(2, 'm9'), dapai(2, 'm9_'), zimo(3, 'm9'), dapai(3, 'm9_'), pingju()],
        },
      ]),
    )
    expect(f.map((x) => x.kind)).toContain('missedCall')
  })
})

describe('半荘の振り返り', () => {
  it('分類ごとの数・損失の合計・分かれ目(最大3つ、損失の大きい順)', () => {
    const { paipu } = playCpuHanchan(() => new (legacy('0000'))(), 3)
    const r = reviewGame(paipu)
    // ツモ切りしかしない CPU なので、打牌の指摘が多い
    expect(r.counts.discard).toBeGreaterThan(0)
    expect(Object.values(r.counts).reduce((a, b) => a + b, 0)).toBe(r.findings.length)
    expect(r.totalLoss).toBe(r.findings.reduce((a, f) => a + f.loss, 0))
    expect(r.turningPoints.length).toBeLessThanOrEqual(3)
    for (let i = 1; i < r.turningPoints.length; i++) expect(r.turningPoints[i - 1].loss).toBeGreaterThanOrEqual(r.turningPoints[i].loss)
  }, 60000)

  it('強い CPU の半荘を、数秒以内で調べられる', () => {
    const { paipu } = playCpuHanchan(() => new (legacy('0201'))(), 5)
    const t0 = performance.now()
    const r = reviewGame(paipu)
    expect(performance.now() - t0).toBeLessThan(3000)
    expect(r.decisions).toBeGreaterThan(30)
  }, 60000)
})
