import { describe, expect, it } from 'vitest'
import { analyzeCall, callCandidates, judgeCall, kuikaeKinds, type CallSituation } from './call'
import { parseTiles } from './tiles'

const k = (t: string) => parseTiles(t)[0].kind
const sit = (hand: string, tile: string, extra: Partial<CallSituation> = {}): CallSituation => ({
  hand: parseTiles(hand),
  tile: parseTiles(tile)[0],
  from: 3,
  turn: 8,
  doraIndicator: parseTiles('1z')[0],
  seatWind: 2,
  roundWind: 1,
  ...extra,
})

describe('鳴き方の候補と喰い替え', () => {
  it('ポンは2枚あれば誰からでも、チーは上家からだけ', () => {
    const s = sit('2345m55p789s1122z', '4m')
    expect(callCandidates(s)).toEqual([
      { type: 'chi', using: [k('2m'), k('3m')] },
      { type: 'chi', using: [k('3m'), k('5m')] },
    ])
    expect(callCandidates({ ...s, from: 1 })).toHaveLength(0)
    expect(callCandidates(sit('2345m55p789s1122z', '5p', { from: 1 })).map((c) => c.type)).toEqual(['pon'])
  })

  it('喰い替え: ポンした牌、チーした牌とその反対側のスジは切れない', () => {
    expect(kuikaeKinds('pon', k('5p'), [k('5p'), k('5p')])).toEqual([k('5p')])
    // 23 で 4 をチー → 4 と 1 は切れない
    expect(kuikaeKinds('chi', k('4m'), [k('2m'), k('3m')]).sort()).toEqual([k('1m'), k('4m')].sort())
    // 56 で 4 をチー → 4 と 7 は切れない
    expect(kuikaeKinds('chi', k('4m'), [k('5m'), k('6m')]).sort()).toEqual([k('4m'), k('7m')].sort())
    // 35 で 4 をチー(嵌張) → 4 だけ
    expect(kuikaeKinds('chi', k('4m'), [k('3m'), k('5m')])).toEqual([k('4m')])
    // 89 で 7 をチー → 7 と(10はないので)7 だけ
    expect(kuikaeKinds('chi', k('7m'), [k('8m'), k('9m')])).toEqual([k('7m')])
    // 解析の打牌候補にも喰い替えの牌は出てこない
    const a = analyzeCall(sit('1234m46p678s1257z', '4m'))
    const opt = a.options.find((o) => o.type === 'chi' && o.using[0] === k('2m'))!
    expect(opt.discards.map((d) => d.kind)).not.toContain(k('1m'))
    expect(opt.discards.map((d) => d.kind)).not.toContain(k('4m'))
  })
})

describe('鳴き判断', () => {
  // 白の対子のほかに雀頭の候補(11m・99m)がある手。白をポンするとシャンテン数が 2 → 1 に進む
  const yakuhaiHand = '234m57p34s55z1199m'

  it('役牌のポンは役が確定してシャンテン数が進むので鳴き', () => {
    const a = analyzeCall(sit(yakuhaiHand, '5z', { from: 2 }))
    expect(a.shanten).toBe(2)
    expect(a.verdict).toBe('call')
    const pon = a.options[0]
    expect(pon.best.yaku).toContain('役牌(白)')
    expect(pon.best.shanten).toBe(1)
    expect(judgeCall(a, { type: 'pon', using: [k('5z'), k('5z')], discard: pon.best.kind })).toBe(true)
    expect(judgeCall(a, { type: 'skip' })).toBe(false)
  })

  it('喰い替えの打牌(ポンした牌)は選べず、選んでも不正解', () => {
    const a = analyzeCall(sit(yakuhaiHand, '5z', { from: 2 }))
    expect(a.options[0].discards.map((d) => d.kind)).not.toContain(k('5z'))
    expect(judgeCall(a, { type: 'pon', using: [k('5z'), k('5z')], discard: k('5z') })).toBe(false)
  })

  it('鳴くと役がなくなる鳴きは不正解(スルーが正解)', () => {
    // 么九牌が多く、役牌もない手で 3萬 をチー
    const a = analyzeCall(sit('12m45p19s123z499m9p', '3m'))
    expect(a.options.length).toBeGreaterThan(0)
    for (const o of a.options) {
      expect(o.best.yaku).toHaveLength(0)
      expect(o.reasons[0]).toMatch(/役がなくなります/)
    }
    expect(a.verdict).toBe('skip')
    expect(judgeCall(a, { type: 'skip' })).toBe(true)
    const o = a.options[0]
    expect(judgeCall(a, { type: 'chi', using: o.using, discard: o.best.kind })).toBe(false)
  })

  it('シャンテン数が進まない鳴きはスルー(雀頭の白をポンしても面子が増えるだけで頭がなくなる)', () => {
    const a = analyzeCall(sit('23m57p3468s55z129m', '5z', { from: 1 }))
    expect(a.options[0].best.shanten).toBe(a.shanten)
    expect(a.options[0].reasons[0]).toMatch(/シャンテン数が進みません/)
    expect(a.verdict).toBe('skip')
  })

  it('断么九の鳴きは、么九牌を切れば役が残る', () => {
    // 68s に 7s をチー → 9p を切れば断么九
    const a = analyzeCall(sit('234m3467p556s68s9p', '7s', { turn: 11 }))
    const chi = a.options.find((o) => o.type === 'chi' && o.using[0] === k('6s'))!
    expect(chi.forbidden).toEqual([k('7s')])
    expect(chi.best.yaku).toContain('断么九')
    expect(chi.best.kind).toBe(k('9p'))
    const keep9p = chi.discards.find((d) => d.kind === k('3p'))!
    expect(keep9p.yaku).toHaveLength(0)
  })
})

describe('鳴き判断クイズの問題', () => {
  it('鳴ける牌が出ていて、鳴き正解・スルー正解の両方が出る。保存した形から作り直せる', async () => {
    const { generateCallQuestion, fromCallData, toCallData, callKeyOf } = await import('./callQuestion')
    const { createRng } = await import('./random')
    const verdicts = new Set<string>()
    const rng = createRng(5)
    for (let i = 0; i < 12; i++) {
      const q = generateCallQuestion(rng)
      expect(q.analysis.options.length).toBeGreaterThan(0)
      expect(q.situation.hand).toHaveLength(13)
      verdicts.add(q.analysis.verdict)
      const r = fromCallData(JSON.parse(JSON.stringify(toCallData(q))))
      expect(callKeyOf(r)).toBe(callKeyOf(q))
      expect(r.analysis.verdict).toBe(q.analysis.verdict)
    }
    expect(verdicts.has('call')).toBe(true)
    expect(verdicts.has('skip')).toBe(true)
  })
})
