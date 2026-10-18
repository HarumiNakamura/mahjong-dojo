import { describe, expect, it } from 'vitest'
import { RULES } from './rules'

describe('RULES', () => {
  it('順位点(オカ込み)と返し点で、4人のポイント合計が0になる', () => {
    const totalPoints = RULES.startingPoints * RULES.players
    const totalReturn = RULES.returnPoints * RULES.players
    const totalUma = RULES.uma.reduce((a, b) => a + b, 0)
    expect(totalPoints - totalReturn + totalUma).toBe(0)
  })

  it('満貫以上の翻数の区切りが小さい順に並んでいる', () => {
    const { mangan, haneman, baiman, sanbaiman } = RULES.limitHan
    expect(mangan < haneman && haneman < baiman && baiman < sanbaiman).toBe(true)
  })

  it('頭ハネの優先順は下家→対面→上家', () => {
    expect(RULES.headBumpOrder).toEqual([1, 2, 3])
  })
})
