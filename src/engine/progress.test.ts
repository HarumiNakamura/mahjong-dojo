import { describe, expect, it } from 'vitest'
import { areaStats, CLEAR_ANSWERS, dailyPlan, DAILY_COUNT, gameAreaStats, recommend, RECENT_REVIEWED_GAMES, roadmapProgress, streakDays } from './progress'
import type { AttemptRecord, GameRecord } from './records'

let n = 0
function att(drill: string, correct: boolean, date = '2026-10-18T12:00:00'): AttemptRecord {
  n++
  return { id: String(n), drill, questionKey: `q${n}`, question: null, answer: null, correct, answeredAt: new Date(date).toISOString() }
}
const many = (drill: string, count: number, correctRate: number) =>
  Array.from({ length: count }, (_, i) => att(drill, i < Math.round(count * correctRate)))

describe('記録が0件のとき', () => {
  it('どれも壊れずに計算できる', () => {
    expect(areaStats([]).every((s) => s.answered === 0 && s.rate === null)).toBe(true)
    expect(roadmapProgress([]).every((p) => p.status === 'notStarted' && p.percent === 0)).toBe(true)
    expect(recommend([]).area.id).toBe('waits')
    expect(streakDays([], new Date())).toBe(0)
  })
})

describe('弱点マップ', () => {
  it('分野ごとの正解率。守備は安パイ並べとベタオリをまとめる', () => {
    const stats = areaStats([...many('safety', 4, 1), ...many('betaori', 4, 0)])
    const d = stats.find((s) => s.area.id === 'defense')!
    expect(d.answered).toBe(8)
    expect(d.rate).toBe(50)
  })

  it('おすすめは、記録が十分ある分野のうち正解率が一番低い分野', () => {
    const r = recommend([...many('efficiency', 10, 0.9), ...many('waits', 10, 0.4), ...many('call', 2, 0)])
    expect(r.area.id).toBe('waits')
    expect(r.reason).toMatch(/40%/)
  })
})

describe('ロードマップ', () => {
  it('回答数と正解率の条件を満たすとクリア', () => {
    const records = [...many('waits', CLEAR_ANSWERS, 0.8), ...many('score', CLEAR_ANSWERS, 0.75)]
    const p = roadmapProgress(records)
    expect(p[0].status).toBe('cleared')
    expect(p[0].percent).toBe(100)
    expect(p[1].status).toBe('notStarted')
    // 次のおすすめは牌効率(待ち・点数はどちらも正解率が十分)
    expect(recommend(records).area.id).toBe('efficiency')
  })

  it('途中なら練習中で、進み具合が出る', () => {
    const p = roadmapProgress(many('efficiency', 10, 0.5))
    expect(p[1].status).toBe('inProgress')
    expect(p[1].percent).toBeGreaterThan(0)
    expect(p[1].percent).toBeLessThan(100)
  })
})

describe('連続日数', () => {
  it('今日まで(今日がまだなら昨日まで)続けて練習した日数', () => {
    const now = new Date('2026-10-18T20:00:00')
    const recs = [att('waits', true, '2026-10-16T09:00:00'), att('waits', true, '2026-10-17T09:00:00'), att('waits', true, '2026-10-18T09:00:00')]
    expect(streakDays(recs, now)).toBe(3)
    expect(streakDays(recs.slice(0, 2), now)).toBe(2)
    expect(streakDays(recs.slice(0, 1), now)).toBe(0)
  })
})

describe('今日の練習', () => {
  it('日付で5問が決まり、同じ日なら同じ、違う日なら違う', () => {
    const a = dailyPlan('2026-10-18')
    expect(a).toHaveLength(DAILY_COUNT)
    expect(new Set(a.map((x) => x.drill)).size).toBe(DAILY_COUNT)
    expect(dailyPlan('2026-10-18')).toEqual(a)
    expect(dailyPlan('2026-10-19')).not.toEqual(a)
  })
})

function game(i: number, counts?: Record<string, number>): GameRecord {
  return {
    id: `g${i}`,
    playedAt: new Date(Date.UTC(2026, 9, 1, i)).toISOString(),
    cpu: 'latest',
    rank: 2,
    points10: 0,
    score: 25000,
    kyoku: 10,
    hule: 2,
    fangchong: 1,
    lizhi: 2,
    fulouKyoku: 3,
    huleDefen: 10000,
    ...(counts ? { review: { decisions: 100, counts, loss: 0 } } : {}),
  }
}

describe('CPU対戦の振り返りと弱点マップ', () => {
  it('分野ごとの1半荘あたりの指摘(振り返りをした最近の半荘だけ)', () => {
    const games = [game(0, { pushfold: 4, dealin: 2 }), game(1, { pushfold: 2, discard: 1 }), game(2)]
    const stats = gameAreaStats(games)
    expect(stats.find((s) => s.area.id === 'pushfold')).toMatchObject({ games: 2, perGame: 3 })
    expect(stats.find((s) => s.area.id === 'defense')!.perGame).toBe(1)
    expect(stats.find((s) => s.area.id === 'efficiency')!.perGame).toBe(0.5)
    expect(gameAreaStats([]).every((s) => s.perGame === null)).toBe(true)
    // 古い半荘は数えない
    const old = Array.from({ length: RECENT_REVIEWED_GAMES + 5 }, (_, i) => game(i, i < 5 ? { call: 10 } : {}))
    expect(gameAreaStats(old).find((s) => s.area.id === 'call')!.perGame).toBe(0)
  })

  it('ドリルの弱点がなければ、CPU対戦で指摘の多い分野をおすすめする', () => {
    const rec = recommend([], [game(0, { pushfold: 3 }), game(1, { pushfold: 1 })])
    expect(rec.area.id).toBe('pushfold')
    expect(rec.reason).toContain('CPU対戦')
    // ドリルの正解率が低い分野が先
    expect(recommend(many('waits', 10, 0.3), [game(0, { pushfold: 3 })]).area.id).toBe('waits')
    // 指摘が少なければロードマップの順
    expect(recommend([], [game(0, { pushfold: 0 })]).area.id).toBe('waits')
  })
})
