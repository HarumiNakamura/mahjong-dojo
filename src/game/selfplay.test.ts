import AI from '@kobalab/majiang-ai'
import legacy from '@kobalab/majiang-ai/legacy'
import Majiang from '@kobalab/majiang-core'
import { describe, expect, it } from 'vitest'
import { parseTiles } from '../engine/tiles'
import { fromPai, tilesFromPaistr, toMianzi, toPai, toPaistr } from './convert'
import { MLEAGUE_RULE } from './rule'
import { addPaipuStats, mergeStats, newStats, playCpuHanchan } from './selfplay'

describe('牌の表記の変換', () => {
  it('サイトの牌と majiang-core の表記を行き来できる(赤5は 0)', () => {
    const tiles = parseTiles('123m0p55s1z')
    expect(tiles.map(toPai)).toEqual(['m1', 'm2', 'm3', 'p0', 's5', 's5', 'z1'])
    expect(toPaistr(tiles)).toBe('m123p0s55z1')
    expect(tilesFromPaistr('m123p0s55z1,z777-')).toEqual(tiles)
    expect(fromPai('m0')).toEqual({ kind: parseTiles('5m')[0].kind, red: true })
    expect(toMianzi({ type: 'chi', tiles: parseTiles('123m') })).toBe('m1-23')
    expect(toMianzi({ type: 'pon', tiles: parseTiles('777z') })).toBe('z777-')
    expect(toMianzi({ type: 'ankan', tiles: parseTiles('1111p') })).toBe('p1111')
    for (const m of ['m1-23', 'z777-', 'p1111']) expect(Majiang.Shoupai.valid_mianzi(m)).toBeTruthy()
  })
})

describe('Mリーグのルール設定', () => {
  it('海底をツモった人(残り0枚)はリーチできない。残り1枚以上ならできる', () => {
    const shoupai = Majiang.Shoupai.fromString('m123p456s789z11m23s1')
    expect(Majiang.Game.allow_lizhi(MLEAGUE_RULE, shoupai, undefined, 1, 25000)).toBeTruthy()
    expect(Majiang.Game.allow_lizhi(MLEAGUE_RULE, shoupai, undefined, 0, 25000)).toBe(false)
  })

  it('主な設定が Mリーグに合っている', () => {
    expect(MLEAGUE_RULE['最大同時和了数']).toBe(1)
    expect(MLEAGUE_RULE['途中流局あり']).toBe(false)
    expect(MLEAGUE_RULE['流し満貫あり']).toBe(false)
    expect(MLEAGUE_RULE['トビ終了あり']).toBe(false)
    expect(MLEAGUE_RULE['切り上げ満貫あり']).toBe(true)
    expect(MLEAGUE_RULE['数え役満あり']).toBe(false)
    expect(MLEAGUE_RULE['連風牌は2符']).toBe(true)
  })
})

describe('CPU 同士の自動対局', () => {
  it('速い CPU で20半荘を最後まで打てる。点数の合計は100,000点、ポイントの合計は0', () => {
    const stats = newStats()
    for (let seed = 1; seed <= 20; seed++) {
      const { paipu, final } = playCpuHanchan(() => new (legacy('0101'))(), seed)
      expect(final.scores.reduce((a, b) => a + b, 0)).toBe(100000)
      expect(final.points10.reduce((a, b) => a + b, 0)).toBe(0)
      expect([...final.ranks].sort()).toEqual(expect.arrayContaining([1]))
      // 東南戦: 8局以上(連荘があれば増える)。西入はない
      expect(paipu.log.length).toBeGreaterThanOrEqual(8)
      for (const kyoku of paipu.log) expect((kyoku[0] as { qipai: { zhuangfeng: number } }).qipai.zhuangfeng).toBeLessThanOrEqual(1)
      addPaipuStats(stats, paipu)
    }
    const all = mergeStats(stats)
    expect(all.hanchan).toBe(80)
    expect(all.hule).toBeGreaterThan(0)
  }, 120000)

  it('同じシードなら同じ対局になる', () => {
    const a = playCpuHanchan(() => new (legacy('0101'))(), 7)
    const b = playCpuHanchan(() => new (legacy('0101'))(), 7)
    expect(a.final).toEqual(b.final)
  }, 60000)

  it('最新版の CPU で1半荘を最後まで打てる', () => {
    const { final } = playCpuHanchan(() => new AI(), 1)
    expect(final.scores.reduce((a, b) => a + b, 0)).toBe(100000)
  }, 180000)
})
