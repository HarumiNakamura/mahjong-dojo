import { describe, expect, it } from 'vitest'
import {
  addAttempt,
  dailyTrend,
  drillsInRecords,
  emptyRecords,
  exportRecords,
  isFavorite,
  MAX_ATTEMPTS,
  mergeRecords,
  mistakes,
  parseRecordsFile,
  sanitizeRecords,
  statsOf,
  toggleFavorite,
  addGame,
  gameSummary,
  MAX_GAMES,
  type AttemptRecord,
  type GameRecord,
} from './records'

let n = 0
function attempt(partial: Partial<AttemptRecord>): AttemptRecord {
  n++
  return {
    id: `a${n}`,
    drill: 'efficiency',
    questionKey: 'q1',
    question: { hand: '123m' },
    answer: 1,
    correct: true,
    answeredAt: '2026-10-18T10:00:00.000Z',
    ...partial,
  }
}

describe('回答記録', () => {
  it('追加すると末尾に残る', () => {
    const data = addAttempt(emptyRecords(), attempt({ id: 'x' }))
    expect(data.attempts.map((a) => a.id)).toEqual(['x'])
  })

  it('上限を超えたら古いものから消す', () => {
    let data = emptyRecords()
    for (let i = 0; i < MAX_ATTEMPTS + 5; i++) data = addAttempt(data, attempt({ id: `n${i}` }))
    expect(data.attempts).toHaveLength(MAX_ATTEMPTS)
    expect(data.attempts[0].id).toBe('n5')
  })

  it('ドリル別の解いた数と正解率', () => {
    let data = emptyRecords()
    data = addAttempt(data, attempt({ correct: true }))
    data = addAttempt(data, attempt({ correct: false }))
    data = addAttempt(data, attempt({ correct: true }))
    data = addAttempt(data, attempt({ drill: 'waits', correct: false }))
    expect(statsOf(data.attempts, 'efficiency')).toEqual({ drill: 'efficiency', answered: 3, correct: 2, rate: 67 })
    expect(statsOf(data.attempts, 'score').rate).toBeNull()
    expect(drillsInRecords(data).sort()).toEqual(['efficiency', 'waits'])
  })

  it('最近7日の日ごとの推移(古い日から順、記録のない日は0問)', () => {
    const now = new Date(2026, 9, 18, 12)
    let data = emptyRecords()
    data = addAttempt(data, attempt({ answeredAt: new Date(2026, 9, 18, 9).toISOString(), correct: true }))
    data = addAttempt(data, attempt({ answeredAt: new Date(2026, 9, 18, 10).toISOString(), correct: false }))
    data = addAttempt(data, attempt({ answeredAt: new Date(2026, 9, 15, 10).toISOString(), correct: true }))
    data = addAttempt(data, attempt({ answeredAt: new Date(2026, 9, 1, 10).toISOString(), correct: true }))
    const trend = dailyTrend(data.attempts, 'efficiency', now)
    expect(trend).toHaveLength(7)
    expect(trend[0].date).toBe('2026-10-12')
    expect(trend[6]).toEqual({ date: '2026-10-18', answered: 2, correct: 1, rate: 50 })
    expect(trend[3]).toEqual({ date: '2026-10-15', answered: 1, correct: 1, rate: 100 })
    expect(trend[1].rate).toBeNull()
  })
})

describe('間違えた問題', () => {
  it('最後に間違えた問題だけを新しい順に並べる。解き直して正解すると消える', () => {
    let data = emptyRecords()
    data = addAttempt(data, attempt({ questionKey: 'A', correct: false, answeredAt: '2026-10-18T01:00:00Z' }))
    data = addAttempt(data, attempt({ questionKey: 'B', correct: false, answeredAt: '2026-10-18T02:00:00Z' }))
    data = addAttempt(data, attempt({ questionKey: 'C', correct: true, answeredAt: '2026-10-18T03:00:00Z' }))
    expect(mistakes(data).map((a) => a.questionKey)).toEqual(['B', 'A'])
    data = addAttempt(data, attempt({ questionKey: 'A', correct: true, answeredAt: '2026-10-18T04:00:00Z' }))
    expect(mistakes(data).map((a) => a.questionKey)).toEqual(['B'])
  })

  it('同じ問題を何度間違えても1件', () => {
    let data = emptyRecords()
    data = addAttempt(data, attempt({ questionKey: 'A', correct: false, answeredAt: '2026-10-18T01:00:00Z' }))
    data = addAttempt(data, attempt({ questionKey: 'A', correct: false, answeredAt: '2026-10-18T02:00:00Z' }))
    expect(mistakes(data)).toHaveLength(1)
  })

  it('ドリルで絞り込める', () => {
    let data = emptyRecords()
    data = addAttempt(data, attempt({ questionKey: 'A', correct: false }))
    data = addAttempt(data, attempt({ drill: 'waits', questionKey: 'A', correct: false }))
    expect(mistakes(data, 'waits').map((a) => a.drill)).toEqual(['waits'])
  })
})

describe('お気に入り', () => {
  it('登録と解除', () => {
    const fav = { drill: 'efficiency', questionKey: 'A', question: {}, addedAt: '2026-10-18T00:00:00Z' }
    let data = toggleFavorite(emptyRecords(), fav)
    expect(isFavorite(data, 'efficiency', 'A')).toBe(true)
    expect(isFavorite(data, 'waits', 'A')).toBe(false)
    data = toggleFavorite(data, fav)
    expect(isFavorite(data, 'efficiency', 'A')).toBe(false)
  })
})

describe('書き出し・読み込み', () => {
  const fav = { drill: 'efficiency', questionKey: 'F', question: { hand: '1m' }, addedAt: '2026-10-18T00:00:00Z' }

  it('書き出したものを読み込むと元に戻る', () => {
    let data = addAttempt(emptyRecords(), attempt({ id: 'r1' }))
    data = toggleFavorite(data, fav)
    const text = exportRecords(data, new Date('2026-10-18T00:00:00Z'))
    expect(parseRecordsFile(text)).toEqual(data)
  })

  it('JSON でないファイル・このサイトのものでないファイルはエラー', () => {
    expect(() => parseRecordsFile('abc')).toThrow('JSON')
    expect(() => parseRecordsFile('{"type":"other"}')).toThrow('このサイトで書き出した')
    expect(() => parseRecordsFile('{"type":"mahjong-dojo-records","data":{"version":99}}')).toThrow('対応していない')
  })

  it('形が壊れた記録は捨てて、残りを使う', () => {
    const data = sanitizeRecords({
      version: 1,
      attempts: [attempt({ id: 'ok' }), { id: 1 }, null, { ...attempt({}), answeredAt: 'not a date' }],
      favorites: [fav, 'x'],
    })
    expect(data.attempts.map((a) => a.id)).toEqual(['ok'])
    expect(data.favorites).toEqual([fav])
  })

  it('壊れたデータや古い形は空の記録として扱う', () => {
    expect(sanitizeRecords(null)).toEqual(emptyRecords())
    expect(sanitizeRecords('abc')).toEqual(emptyRecords())
    expect(sanitizeRecords({ version: 0 })).toEqual(emptyRecords())
  })

  it('読み込んだ記録は今の記録と合わせ、同じ記録は1つにまとめる', () => {
    const current = addAttempt(emptyRecords(), attempt({ id: 'same', answeredAt: '2026-10-18T02:00:00Z' }))
    let incoming = addAttempt(emptyRecords(), attempt({ id: 'same', answeredAt: '2026-10-18T02:00:00Z' }))
    incoming = addAttempt(incoming, attempt({ id: 'new', answeredAt: '2026-10-18T01:00:00Z' }))
    incoming = toggleFavorite(incoming, fav)
    const { data, added } = mergeRecords(current, incoming)
    expect(added).toBe(1)
    // 日時の順に並ぶ
    expect(data.attempts.map((a) => a.id)).toEqual(['new', 'same'])
    expect(data.favorites).toHaveLength(1)
    expect(mergeRecords(data, incoming).data.favorites).toHaveLength(1)
  })
})

function game(partial: Partial<GameRecord>): GameRecord {
  return {
    id: 'g1',
    playedAt: '2026-10-18T10:00:00.000Z',
    cpu: 'latest',
    rank: 1,
    points10: 523,
    score: 52300,
    kyoku: 10,
    hule: 3,
    fangchong: 1,
    lizhi: 2,
    fulouKyoku: 3,
    huleDefen: 18000,
    ...partial,
  }
}

describe('CPU対戦の成績', () => {
  it('対局成績のない古い記録も読み込める', () => {
    const data = sanitizeRecords({ version: 1, attempts: [], favorites: [] })
    expect(data.games).toEqual([])
  })

  it('形が壊れた対局成績は捨てる', () => {
    const data = sanitizeRecords({ version: 1, attempts: [], favorites: [], games: [game({}), { id: 'x' }, { ...game({ id: 'g2' }), playedAt: 'bad' }] })
    expect(data.games.map((g) => g.id)).toEqual(['g1'])
  })

  it('上限を超えたら古いものから消す', () => {
    let data = emptyRecords()
    for (let i = 0; i < MAX_GAMES + 2; i++) data = addGame(data, game({ id: `g${i}` }))
    expect(data.games).toHaveLength(MAX_GAMES)
    expect(data.games[0].id).toBe('g2')
  })

  it('読み込みでは同じ対局を1つにまとめ、日時の順に並べる', () => {
    const current = addGame(emptyRecords(), game({ id: 'b', playedAt: '2026-10-18T02:00:00Z' }))
    let incoming = addGame(emptyRecords(), game({ id: 'b', playedAt: '2026-10-18T02:00:00Z' }))
    incoming = addGame(incoming, game({ id: 'a', playedAt: '2026-10-18T01:00:00Z' }))
    const { data, added } = mergeRecords(current, incoming)
    expect(added).toBe(1)
    expect(data.games.map((g) => g.id)).toEqual(['a', 'b'])
  })

  it('平均順位・合計ポイント・アガリ率・放銃率をまとめる', () => {
    const s = gameSummary([game({}), game({ id: 'g2', rank: 4, points10: -456, hule: 1, fangchong: 3 })])
    expect(s).toEqual({ games: 2, averageRank: 2.5, totalPoints10: 67, huleRate: 20, fangchongRate: 20 })
    expect(gameSummary([])).toEqual({ games: 0, averageRank: null, totalPoints10: 0, huleRate: null, fangchongRate: null })
  })

  it('書き出したファイルを読み込むと対局成績も戻る', () => {
    const data = addGame(emptyRecords(), game({}))
    expect(parseRecordsFile(exportRecords(data, new Date(0))).games).toEqual(data.games)
  })
})
