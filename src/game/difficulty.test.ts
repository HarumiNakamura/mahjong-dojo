import Majiang from '@kobalab/majiang-core'
import { describe, expect, it } from 'vitest'
import { DIFFICULTIES, difficultyLabel, makeCpu } from './difficulty'
import { EasyPlayer } from './easyPlayer'
import { MLEAGUE_RULE } from './rule'
import { discardHints } from './hints'
import { addPaipuStats, newStats, playCpuHanchan } from './selfplay'

describe('CPU の難易度', () => {
  it('やさしい・ふつう・つよいの3つ', () => {
    expect(DIFFICULTIES.map((d) => d.label)).toEqual(['やさしい', 'ふつう', 'つよい'])
    expect(makeCpu('easy')()).toBeInstanceOf(EasyPlayer)
    expect(difficultyLabel('latest')).toBe('つよい')
  })

  it('やさしい CPU だけで半荘を最後まで打てる(鳴かない・リーチしない)', () => {
    const stats = newStats()
    for (const seed of [1, 2]) {
      const { paipu, final } = playCpuHanchan(makeCpu('easy'), seed)
      expect(final.scores.reduce((a, b) => a + b, 0)).toBe(100000)
      addPaipuStats(stats, paipu)
    }
    expect(stats.every((s) => s.fulouKyoku === 0)).toBe(true)
    expect(stats.every((s) => s.lizhi === 0)).toBe(true)
    expect(stats.some((s) => s.hule > 0)).toBe(true)
  })

  it('やさしい CPU は受け入れ枚数が一番多い牌を切る', () => {
    const p = new EasyPlayer()
    // 3面子 + 5索・9索・東南西 → 字牌か9索を切る(5索は残す)
    Object.assign(p, { _model: { shoupai: [Majiang.Shoupai.fromString('m123456p234s59z12z3')] }, _menfeng: 0, _rule: MLEAGUE_RULE })
    expect(p.chooseDapai()).not.toMatch(/^s5/)
  })
})

describe('練習モードのヒント', () => {
  it('切る牌ごとの受け入れ枚数(よい順)。リーチ者がいなければ危険度はない', () => {
    const board = new Majiang.Board({ title: '', player: ['a', 'b', 'c', 'd'], qijia: 0 })
    board.qipai({ zhuangfeng: 0, jushu: 0, changbang: 0, lizhibang: 0, defen: [25000, 25000, 25000, 25000], baopai: 's7', shoupai: ['m123456p234s59z12', '', '', ''] })
    board.zimo({ l: 0, p: 'z3' })
    let hints = discardHints(board, 0, [[], [], [], []])
    expect(hints[0].best).toBe(true)
    // シャンテン数が同じ打牌の中で、受け入れが一番多い
    expect(hints.filter((h) => h.shanten === hints[0].shanten).every((h) => h.ukeire <= hints[0].ukeire)).toBe(true)
    expect(hints.every((h) => h.danger === null)).toBe(true)
    // 下家が 5筒 でリーチ → 危険度がつく
    board.dapai({ l: 0, p: 'z3_' })
    board.zimo({ l: 1, p: 'p5' })
    board.dapai({ l: 1, p: 'p5*' })
    board.zimo({ l: 2, p: 'z7' })
    board.dapai({ l: 2, p: 'z7_' })
    board.zimo({ l: 3, p: 'z7' })
    board.dapai({ l: 3, p: 'z7_' })
    board.zimo({ l: 0, p: 'p5' })
    hints = discardHints(board, 0, [[1], [2], [3], [4]])
    const p5 = hints.find((h) => h.kind === 13)!
    expect(p5.danger).toBe(0)
    expect(p5.dangerLabel).toBe('現物')
    expect(hints.some((h) => (h.danger ?? 0) > 0)).toBe(true)
  })
})
