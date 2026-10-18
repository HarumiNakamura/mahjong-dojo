import { describe, expect, it } from 'vitest'
import { correctPlans, planFeatures, scorePlans, type PlanContext } from './plan'
import { fromPlanData, judgePlan, makePlanQuestion, toPlanData } from './planQuestion'
import { createRng } from './random'
import { startSoloGame } from './solo'
import { parseTiles } from './tiles'

const ctx: PlanContext = { doraIndicator: parseTiles('9p')[0], seatWind: 2, roundWind: 1 }
const best = (hand: string, c = ctx) => correctPlans(scorePlans(parseTiles(hand), c))
const scoreOf = (hand: string, id: string, c = ctx) => scorePlans(parseTiles(hand), c).find((s) => s.id === id)!

describe('配牌方針の採点', () => {
  it('特徴を数える(役牌の対子・ドラ・么九牌・対子・色)', () => {
    const f = planFeatures(parseTiles('11m234p567s1155z77z'), ctx)
    expect(f.yakuhaiPairs.map((p) => p.kind)).toEqual([31, 33, 27]) // 白・中・東(場風)
    expect(f.dora).toBe(0)
    expect(f.yaochu).toBe(8)
    expect(f.pairs).toBe(4)
    expect(planFeatures(parseTiles('11m234p567s1155z77z'), { ...ctx, doraIndicator: parseTiles('9m')[0] }).dora).toBe(2)
  })

  it('索子が多く字牌もある手は混一色が正解で、根拠に枚数が出る', () => {
    const hand = '1m123578899s4456z'
    expect(best(hand)).toContain('someTe')
    expect(scoreOf(hand, 'someTe').reasons[0]).toMatch(/索子が9枚.*混一色の候補/)
  })

  it('中張牌ばかりの手はタンヤオ', () => {
    expect(best('234m3456p3456678s')).toContain('tanyao')
  })

  it('役牌の対子があれば役牌', () => {
    const hand = '13m258p3679s1366z7z'
    expect(best(hand)).toContain('yakuhai')
    expect(scoreOf(hand, 'yakuhai').reasons[0]).toMatch(/發が対子/)
  })

  it('対子が多い手は七対子', () => {
    expect(best('1199m3388p44s1255z')).toContain('chiitoi')
  })

  it('バラバラで遠い手は守備寄り', () => {
    expect(best('159m159p159s12346z')).toContain('defense')
  })

  it('早くて形の良い手は門前リーチ', () => {
    expect(best('123m456p78s123999s')).toContain('riichi')
  })
})

describe('配牌方針クイズの問題', () => {
  it('一人麻雀と同じ配牌になり、保存した形から作り直せる', () => {
    const q = makePlanQuestion(1234)
    const g = startSoloGame(createRng(1234))
    expect(q.hand).toEqual(g.hand)
    expect(q.drawn).toEqual(g.drawn)
    const r = fromPlanData(JSON.parse(JSON.stringify(toPlanData(q))))
    expect(r.scores).toEqual(q.scores)
    expect(judgePlan(q, q.correct[0])).toBe(true)
    expect(() => fromPlanData({ seed: -1 })).toThrow()
  })
})
