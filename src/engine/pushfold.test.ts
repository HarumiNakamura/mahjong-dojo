import { describe, expect, it } from 'vitest'
import { evaluatePushFold, isCorrectPushFold, type PushFoldInput } from './pushfold'

const base: PushFoldInput = {
  shanten: 0,
  shape: 'good',
  count: 8,
  turn: 9,
  myValue: 3900,
  iAmDealer: false,
  opponent: { dealer: false, kind: 'riichi' },
  tileDanger: 12,
}

describe('押し引きの概算', () => {
  it('良形テンパイなら無スジでも押し', () => {
    const r = evaluatePushFold(base)
    expect(r.verdict).toBe('push')
    expect(r.diff).toBeGreaterThan(0)
    expect(r.rule).toMatch(/良形テンパイ/)
  })

  it('愚形イーシャンテンなら降り', () => {
    const r = evaluatePushFold({ ...base, shanten: 1, shape: 'bad', count: 10, myValue: 2000 })
    expect(r.verdict).toBe('fold')
    expect(r.rule).toMatch(/イーシャンテン/)
  })

  it('打点が高いほど、アガリ率が高いほど押しに傾く', () => {
    const low = evaluatePushFold({ ...base, shape: 'bad', count: 4, myValue: 1300 })
    const high = evaluatePushFold({ ...base, shape: 'bad', count: 4, myValue: 12000 })
    expect(high.diff).toBeGreaterThan(low.diff)
    expect(high.verdict).toBe('push')
  })

  it('相手が親だと、子のリーチより降りに傾く', () => {
    const child = evaluatePushFold(base)
    const dealer = evaluatePushFold({ ...base, opponent: { dealer: true, kind: 'riichi' } })
    expect(dealer.diff).toBeLessThan(child.diff)
    expect(dealer.opponentValue).toBeGreaterThan(child.opponentValue)
  })

  it('危険度が高いほど、終盤ほど降りに傾く', () => {
    expect(evaluatePushFold({ ...base, tileDanger: 3 }).diff).toBeGreaterThan(evaluatePushFold(base).diff)
    expect(evaluatePushFold({ ...base, turn: 15 }).winRate).toBeLessThan(evaluatePushFold(base).winRate)
  })

  it('差が小さいときはどちらも正解', () => {
    expect(isCorrectPushFold('either', 'push')).toBe(true)
    expect(isCorrectPushFold('either', 'fold')).toBe(true)
    expect(isCorrectPushFold('push', 'fold')).toBe(false)
  })

  it('期待値の式どおりに計算する', () => {
    const r = evaluatePushFold(base)
    const expected = r.winRate * base.myValue - r.dealInRate * r.opponentValue - r.opponentTsumoRate * (1 - r.winRate) * r.tsumoCost
    expect(r.pushEV).toBe(Math.round(expected))
    expect(r.foldEV).toBe(Math.round(-r.opponentTsumoRate * r.tsumoCost))
  })
})
