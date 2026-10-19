import type { Paipu } from '@kobalab/majiang-core'
import { describe, expect, it } from 'vitest'
import { MAX_PAIPU, mergePaipuRecords, sanitizePaipuRecords, type PaipuRecord } from './paipuRecords'

const paipu: Paipu = {
  title: 'CPU対戦',
  player: ['あなた', 'CPU 1', 'CPU 2', 'CPU 3'],
  qijia: 0,
  log: [[{ qipai: { zhuangfeng: 0, jushu: 0, changbang: 0, lizhibang: 0, defen: [25000, 25000, 25000, 25000], baopai: 'm1', shoupai: [] } }]],
  defen: [25000, 25000, 25000, 25000],
  rank: [1, 2, 3, 4],
  point: ['45.0', '5.0', '-15.0', '-35.0'],
}
const rec = (id: string, playedAt = '2026-10-18T10:00:00Z'): PaipuRecord => ({ id, playedAt, paipu })

describe('牌譜の保存データ', () => {
  it('形が壊れた牌譜は捨てる', () => {
    expect(sanitizePaipuRecords([rec('a'), { id: 'b' }, { ...rec('c'), paipu: { ...paipu, log: [] } }, null])).toEqual([rec('a')])
    expect(sanitizePaipuRecords('x')).toEqual([])
  })

  it('同じ牌譜は1つにまとめ、新しい20半荘だけ残す', () => {
    const current = [rec('a', '2026-10-18T01:00:00Z')]
    const incoming = Array.from({ length: MAX_PAIPU + 1 }, (_, i) => rec(`g${i}`, `2026-10-18T${String(i + 2).padStart(2, '0')}:00:00Z`))
    const merged = mergePaipuRecords(current, [...incoming, rec('a', '2026-10-18T01:00:00Z')])
    expect(merged).toHaveLength(MAX_PAIPU)
    expect(merged[0].id).toBe('g1')
    expect(merged[merged.length - 1].id).toBe(`g${MAX_PAIPU}`)
  })
})
